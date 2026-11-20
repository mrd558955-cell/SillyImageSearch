'use strict';

const GAP_MS = 1000;
const PASS_WAIT_MS = 3 * 60 * 1000;
const APPROVAL_WAIT_MS = 3 * 60 * 1000;
const lastAt = new Map();
const chains = new Map();
const approvals = new Map();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanDomain(value) {
    return String(value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/?#:].*$/, '');
}

async function allowedSites() {
    const { sites } = await browser.storage.local.get({ sites: [] });
    return Array.isArray(sites) ? sites : [];
}

async function siteFor(url) {
    let host;
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            return '';
        }
        host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
        return '';
    }
    return (await allowedSites()).find(site => host === site || host.endsWith(`.${site}`)) || '';
}

function isChallenge(status, text) {
    return (status === 403 || status === 503 || status === 429) && /just a moment|cf-chl|cf_chl|challenge-platform|attention required|cf-mitigated/i.test(text);
}

function queued(site, job) {
    const before = chains.get(site) || Promise.resolve();
    const next = before.catch(() => {}).then(async () => {
        const wait = (lastAt.get(site) || 0) + GAP_MS - Date.now();
        if (wait > 0) {
            await sleep(wait);
        }
        lastAt.set(site, Date.now());
        return job();
    });
    chains.set(site, next);
    return next;
}

async function doFetch(url, binary) {
    const site = await siteFor(url);
    if (!site) {
        return { ok: false, notAllowed: cleanDomain(new URL(url).hostname), error: 'This site is not allowed in the SillyImageSearch Fetcher.' };
    }
    return queued(site, async () => {
        let response;
        try {
            response = await fetch(url, { credentials: 'include', redirect: 'follow', headers: { Accept: binary ? 'image/*,video/*,*/*' : 'application/json, text/plain, */*' } });
        } catch (error) {
            return { ok: false, status: 0, error: `Firefox could not reach ${site}: ${error?.message || error}` };
        }
        const type = response.headers.get('content-type') || '';
        if (binary && response.ok && !/text\/html/i.test(type)) {
            return { ok: true, status: response.status, type, bytes: await response.arrayBuffer() };
        }
        const text = await response.text();
        return { ok: response.ok, status: response.status, type, text, challenge: isChallenge(response.status, text) };
    });
}

async function askApproval(domain, tabId) {
    const site = cleanDomain(domain);
    if (!site) {
        return { allowed: false };
    }
    if ((await allowedSites()).includes(site)) {
        return { allowed: true };
    }
    if (approvals.has(site)) {
        return approvals.get(site).promise;
    }
    let resolve;
    const promise = new Promise(done => {
        resolve = done;
    });
    approvals.set(site, { promise, resolve, tabId });
    const tab = await browser.tabs.create({ url: browser.runtime.getURL(`approve.html?site=${encodeURIComponent(site)}`), active: true });
    approvals.get(site).approvalTab = tab.id;
    setTimeout(() => finishApproval(site, false), APPROVAL_WAIT_MS);
    return promise;
}

async function finishApproval(site, allowed) {
    const waiting = approvals.get(site);
    if (!waiting) {
        return;
    }
    approvals.delete(site);
    if (allowed) {
        const sites = await allowedSites();
        if (!sites.includes(site)) {
            await browser.storage.local.set({ sites: [...sites, site] });
        }
    }
    if (waiting.approvalTab !== undefined) {
        browser.tabs.remove(waiting.approvalTab).catch(() => {});
    }
    if (waiting.tabId !== undefined) {
        browser.tabs.update(waiting.tabId, { active: true }).catch(() => {});
    }
    waiting.resolve({ allowed });
}

async function getPass(domain, tabId) {
    const site = cleanDomain(domain);
    if (!(await allowedSites()).includes(site)) {
        return { passed: false, error: 'This site is not allowed in the SillyImageSearch Fetcher.' };
    }
    const tab = await browser.tabs.create({ url: `https://${site}/`, active: true });
    return new Promise(resolve => {
        let done = false;
        const finish = passed => {
            if (done) {
                return;
            }
            done = true;
            browser.cookies.onChanged.removeListener(watch);
            browser.tabs.onRemoved.removeListener(closed);
            clearTimeout(timer);
            setTimeout(() => {
                if (passed) {
                    browser.tabs.remove(tab.id).catch(() => {});
                }
                if (tabId !== undefined) {
                    browser.tabs.update(tabId, { active: true }).catch(() => {});
                }
                resolve({ passed });
            }, passed ? 1500 : 0);
        };
        const watch = change => {
            const cookie = change.cookie;
            const host = String(cookie?.domain || '').replace(/^\./, '');
            if (!change.removed && cookie?.name === 'cf_clearance' && (host === site || host.endsWith(`.${site}`) || site.endsWith(`.${host}`))) {
                finish(true);
            }
        };
        const closed = removed => {
            if (removed === tab.id) {
                finish(false);
            }
        };
        const timer = setTimeout(() => finish(false), PASS_WAIT_MS);
        browser.cookies.onChanged.addListener(watch);
        browser.tabs.onRemoved.addListener(closed);
    });
}

browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === 'approved' && sender.url?.startsWith(browser.runtime.getURL('approve.html'))) {
        finishApproval(cleanDomain(message.site), Boolean(message.allowed));
        return Promise.resolve({ ok: true });
    }
    if (message?.source !== 'stis-page') {
        return undefined;
    }
    const tabId = sender.tab?.id;
    switch (message.type) {
        case 'hello':
            return allowedSites().then(sites => ({ ok: true, version: browser.runtime.getManifest().version, sites }));
        case 'approve':
            return askApproval(message.domain, tabId);
        case 'fetch':
            return doFetch(String(message.url || ''), Boolean(message.binary));
        case 'pass':
            return getPass(message.domain, tabId);
        default:
            return Promise.resolve({ ok: false, error: 'Unknown request.' });
    }
});
