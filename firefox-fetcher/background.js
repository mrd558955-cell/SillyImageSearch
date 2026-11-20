'use strict';

const GAP_MS = 1000;
const PASS_WAIT_MS = 3 * 60 * 1000;
const PASS_POLL_MS = 1500;
const PASS_COOLDOWN_MS = 60 * 1000;
const APPROVAL_WAIT_MS = 3 * 60 * 1000;
const TAB_LOAD_MS = 30 * 1000;
const TAB_IDLE_MS = 2 * 60 * 1000;
const IMAGE_PARALLEL = 4;
const TEXT_WAIT_MS = 60 * 1000;
const FILE_WAIT_MS = 3 * 60 * 1000;
const QUIET_LOAD_MS = 10 * 1000;
const STATE_WAIT_MS = 10 * 1000;
const lastAt = new Map();
const chains = new Map();
const approvals = new Map();
const siteTabs = new Map();
const passes = new Map();
const passFailed = new Map();
const pools = new Map();
const opening = new Map();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function inTime(promise, ms, fallback) {
    let timer;
    return Promise.race([promise, new Promise(resolve => {
        timer = setTimeout(() => resolve(fallback), ms);
    })]).finally(() => clearTimeout(timer));
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

const PAGE_FIRST = new Set();

function acceptFor(binary) {
    return binary ? 'image/*,video/*,*/*' : 'application/json, text/plain, */*';
}

async function backgroundFetch(url, binary) {
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), binary ? FILE_WAIT_MS : TEXT_WAIT_MS);
    try {
        const response = await fetch(url, { credentials: 'include', redirect: 'follow', headers: { Accept: acceptFor(binary) }, signal: stop.signal });
        const type = response.headers.get('content-type') || '';
        if (binary && response.ok && !/text\/html/i.test(type)) {
            return { ok: true, status: response.status, type, bytes: await response.arrayBuffer() };
        }
        const text = await response.text();
        return { ok: response.ok, status: response.status, type, text, challenge: isChallenge(response.status, text) };
    } catch (error) {
        return { ok: false, status: 0, error: `Firefox could not reach ${new URL(url).hostname}: ${stop.signal.aborted ? 'it took too long' : error?.message || error}` };
    } finally {
        clearTimeout(timer);
    }
}

function originOf(url) {
    return new URL(url).origin;
}

function tabGone(tabId) {
    for (const [origin, known] of siteTabs) {
        if (known.tabId === tabId) {
            clearTimeout(known.timer);
            siteTabs.delete(origin);
        }
    }
}

function touchTab(origin) {
    const known = siteTabs.get(origin);
    if (!known) {
        return;
    }
    clearTimeout(known.timer);
    known.timer = setTimeout(() => {
        siteTabs.delete(origin);
        browser.tabs.remove(known.tabId).catch(() => {});
    }, TAB_IDLE_MS);
}

function waitLoaded(tabId, ms, fresh = false) {
    return new Promise(resolve => {
        let done = false;
        const finish = loaded => {
            if (done) {
                return;
            }
            done = true;
            browser.tabs.onUpdated.removeListener(watch);
            browser.tabs.onRemoved.removeListener(gone);
            clearTimeout(timer);
            resolve(loaded);
        };
        const watch = (id, change) => {
            if (id === tabId && change.status === 'complete') {
                finish(true);
            }
        };
        const gone = id => {
            if (id === tabId) {
                finish(false);
            }
        };
        const timer = setTimeout(() => finish(false), ms);
        browser.tabs.onUpdated.addListener(watch);
        browser.tabs.onRemoved.addListener(gone);
        if (!fresh) {
            browser.tabs.get(tabId).then(tab => {
                if (tab.status === 'complete' && /^https?:/.test(tab.url || '')) {
                    finish(true);
                }
            }, () => finish(false));
        }
    });
}

function siteTab(url, backTo) {
    const origin = originOf(url);
    if (opening.has(origin)) {
        return opening.get(origin);
    }
    const job = openSiteTab(origin, backTo);
    opening.set(origin, job);
    job.finally(() => opening.delete(origin)).catch(() => {});
    return job;
}

async function wakeTab(tabId, backTo) {
    if (await waitLoaded(tabId, QUIET_LOAD_MS)) {
        return true;
    }
    await browser.tabs.update(tabId, { active: true }).catch(() => {});
    const loaded = await waitLoaded(tabId, TAB_LOAD_MS);
    if (backTo !== undefined) {
        await browser.tabs.update(backTo, { active: true }).catch(() => {});
    }
    return loaded;
}

async function openSiteTab(origin, backTo) {
    const known = siteTabs.get(origin);
    if (known) {
        try {
            await browser.tabs.get(known.tabId);
            touchTab(origin);
            if (await wakeTab(known.tabId, backTo)) {
                return known.tabId;
            }
            dropTab(known.tabId);
        } catch {
            tabGone(known.tabId);
        }
    }
    const tab = await browser.tabs.create({ url: `${origin}/`, active: false });
    siteTabs.set(origin, { tabId: tab.id, timer: null });
    touchTab(origin);
    await wakeTab(tab.id, backTo);
    return tab.id;
}

function dropTab(tabId) {
    tabGone(tabId);
    browser.tabs.remove(tabId).catch(() => {});
}

const PAGE_CHALLENGE = /just a moment|attention required|checking your browser|verify you are human|cf-chl|cf_chl|challenge-platform/i;

async function pageState(tabId) {
    try {
        const [state] = await inTime(browser.tabs.executeScript(tabId, { code: '({ title: document.title, text: String(document.body ? document.body.innerText : "").slice(0, 3000), head: document.documentElement.outerHTML.slice(0, 6000) })' }), STATE_WAIT_MS, []);
        return state || null;
    } catch {
        return null;
    }
}

function pageChallenged(state) {
    return !state || PAGE_CHALLENGE.test(`${state.title}\n${state.head}`);
}

async function pageFetch(url, binary, backTo) {
    let tabId;
    try {
        tabId = await siteTab(url, backTo);
    } catch (error) {
        return { ok: false, status: 0, error: `Firefox could not open ${new URL(url).hostname}: ${error?.message || error}`, challenge: true };
    }
    const code = `(async () => {
        try {
            const response = await content.fetch(${JSON.stringify(url)}, { credentials: 'include', headers: { Accept: ${JSON.stringify(acceptFor(binary))} } });
            const type = response.headers.get('content-type') || '';
            if (${binary ? 'true' : 'false'} && response.ok && !/text\\/html/i.test(type)) {
                return { ok: true, status: response.status, type, bytes: await response.arrayBuffer() };
            }
            return { ok: response.ok, status: response.status, type, text: await response.text() };
        } catch (error) {
            return { ok: false, status: 0, error: String(error && error.message || error) };
        }
    })()`;
    let reply;
    try {
        [reply] = await inTime(browser.tabs.executeScript(tabId, { code }), binary ? FILE_WAIT_MS : TEXT_WAIT_MS, [{ ok: false, status: 0, error: 'The site tab took too long to answer.', stuck: true }]);
    } catch (error) {
        return { ok: false, status: 0, error: `Firefox could not ask from the ${new URL(url).hostname} tab: ${error?.message || error}`, challenge: true };
    }
    if (!reply || reply.stuck) {
        dropTab(tabId);
        return { ok: false, status: 0, error: reply?.error || 'The site tab gave no answer.', challenge: true };
    }
    touchTab(originOf(url));
    return { ...reply, challenge: reply.status === 0 || isChallenge(reply.status, String(reply.text || '')) };
}

function getPass(site, url, tabId) {
    if (passes.has(site)) {
        return passes.get(site);
    }
    if (Date.now() - (passFailed.get(site) || 0) < PASS_COOLDOWN_MS) {
        return Promise.resolve({ passed: false, error: `${site} was not passed a moment ago.` });
    }
    const job = (async () => {
        let passTab;
        try {
            passTab = await siteTab(url, tabId);
        } catch {
            return { passed: false };
        }
        const loaded = waitLoaded(passTab, PASS_WAIT_MS, true);
        await browser.tabs.update(passTab, { url, active: true }).catch(() => {});
        await loaded;
        const deadline = Date.now() + PASS_WAIT_MS;
        let passed = false;
        while (Date.now() < deadline) {
            try {
                await browser.tabs.get(passTab);
            } catch {
                break;
            }
            if (!pageChallenged(await pageState(passTab))) {
                passed = true;
                break;
            }
            await sleep(PASS_POLL_MS);
        }
        if (tabId !== undefined) {
            await browser.tabs.update(tabId, { active: true }).catch(() => {});
        }
        return { passed };
    })();
    passes.set(site, job);
    job.then(result => {
        passes.delete(site);
        if (!result.passed) {
            passFailed.set(site, Date.now());
        }
    });
    return job;
}

function pooled(site, job) {
    const pool = pools.get(site) || pools.set(site, { running: 0, waiting: [] }).get(site);
    return new Promise((resolve, reject) => {
        const start = () => {
            pool.running++;
            Promise.resolve().then(job).then(resolve, reject).finally(() => {
                pool.running--;
                const next = pool.waiting.shift();
                if (next) {
                    next();
                }
            });
        };
        if (pool.running < IMAGE_PARALLEL) {
            start();
        } else {
            pool.waiting.push(start);
        }
    });
}

async function doFetch(url, binary, tabId) {
    const site = await siteFor(url);
    if (!site) {
        return { ok: false, notAllowed: cleanDomain(new URL(url).hostname), error: 'This site is not allowed in the SillyImageSearch Fetcher.' };
    }
    const run = binary ? job => pooled(site, job) : job => queued(site, job);
    return run(async () => {
        const origin = originOf(url);
        if (!PAGE_FIRST.has(origin)) {
            const reply = await backgroundFetch(url, binary);
            if (!reply.challenge) {
                return reply;
            }
            PAGE_FIRST.add(origin);
        }
        let reply = await pageFetch(url, binary, tabId);
        if (!reply.challenge) {
            return reply;
        }
        const pass = await getPass(site, url, tabId);
        if (pass.passed) {
            reply = await pageFetch(url, binary, tabId);
        }
        return { ...reply, passTried: true };
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
            return doFetch(String(message.url || ''), Boolean(message.binary), tabId);
        case 'pass': {
            const site = cleanDomain(message.domain);
            return allowedSites().then(sites => (sites.includes(site) ? getPass(site, `https://${site}/`, tabId) : { passed: false, error: 'This site is not allowed in the SillyImageSearch Fetcher.' }));
        }
        default:
            return Promise.resolve({ ok: false, error: 'Unknown request.' });
    }
});

browser.tabs.onRemoved.addListener(tabGone);
