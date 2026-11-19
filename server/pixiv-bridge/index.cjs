'use strict';

const fs = require('node:fs');
const path = require('node:path');

const VERSION = '1.0.0';
const AGENT = `SillyImageSearch-PixivBridge/${VERSION} (SillyTavern server plugin; +https://github.com/mrd558955-cell/SillyImageSearch)`;
const SITE = process.env.PIXIV_BRIDGE_SITE || 'https://www.pixiv.net';
const IMAGES = process.env.PIXIV_BRIDGE_IMAGES || 'https://i.pximg.net';
const REFERER = 'https://www.pixiv.net/';
const IMAGE_HOST = /^(?:[a-z0-9-]+\.)?pximg\.net$/;
const SEARCH_KEEP = 15 * 60 * 1000;
const CACHE_LIMIT = 200;
const IMAGE_CACHE_BYTES = 40 * 1024 * 1024;
const IMAGE_CACHE_ITEM = 600 * 1024;
const IMAGE_JOBS = 4;
const PAUSE_FIRST = 2 * 60 * 1000;
const PAUSE_LONGEST = 30 * 60 * 1000;

const info = {
    id: 'pixiv-bridge',
    name: 'Pixiv bridge',
    description: 'Lets the Image Search extension search and save Pixiv works with your own Pixiv login, slowly and only when you ask.',
};

const state = {
    file: '',
    cookie: '',
    userId: '',
    userName: '',
    limit: 400,
    gapMs: 1500,
    day: '',
    count: 0,
    pausedUntil: 0,
    pauseMs: 0,
    lastError: '',
};
const apiCache = new Map();
const imageCache = new Map();
let imageCacheBytes = 0;
let apiChain = Promise.resolve();
let lastApiAt = 0;
let imageBusy = 0;
const imageWaiting = [];

function today() {
    return new Date().toISOString().slice(0, 10);
}

function load() {
    try {
        const saved = JSON.parse(fs.readFileSync(state.file, 'utf8'));
        for (const key of ['cookie', 'userId', 'userName', 'limit', 'gapMs', 'day', 'count']) {
            if (saved[key] !== undefined) {
                state[key] = saved[key];
            }
        }
    } catch {
        return;
    }
}

function store() {
    try {
        fs.mkdirSync(path.dirname(state.file), { recursive: true });
        const { cookie, userId, userName, limit, gapMs, day, count } = state;
        fs.writeFileSync(state.file, JSON.stringify({ cookie, userId, userName, limit, gapMs, day, count }, null, 1), { mode: 0o600 });
    } catch (error) {
        console.warn('[Pixiv bridge] could not save its settings', error);
    }
}

function counted() {
    if (state.day !== today()) {
        state.day = today();
        state.count = 0;
    }
    return state.count;
}

function status() {
    return {
        ok: true,
        version: VERSION,
        loggedIn: Boolean(state.cookie),
        userId: state.userId,
        userName: state.userName,
        today: counted(),
        limit: state.limit,
        pausedFor: Math.max(0, Math.ceil((state.pausedUntil - Date.now()) / 1000)),
        lastError: state.lastError,
    };
}

function headers(extra = {}) {
    return {
        'User-Agent': AGENT,
        Referer: REFERER,
        'Accept-Language': 'en-US,en;q=0.8',
        ...(state.cookie ? { Cookie: `PHPSESSID=${state.cookie}` } : {}),
        ...extra,
    };
}

class BridgeError extends Error {
    constructor(message, status = 502, extra = {}) {
        super(message);
        this.status = status;
        this.extra = extra;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function pause() {
    state.pauseMs = state.pauseMs ? Math.min(PAUSE_LONGEST, state.pauseMs * 2) : PAUSE_FIRST;
    state.pausedUntil = Date.now() + state.pauseMs;
}

async function pixivApi(pathAndQuery, { cache = true } = {}) {
    const key = pathAndQuery;
    const kept = cache ? apiCache.get(key) : null;
    if (kept && Date.now() - kept.at < SEARCH_KEEP) {
        apiCache.delete(key);
        apiCache.set(key, kept);
        return kept.body;
    }
    const job = apiChain.then(async () => {
        if (Date.now() < state.pausedUntil) {
            throw new BridgeError(`Pixiv asked for a pause; back in ${Math.ceil((state.pausedUntil - Date.now()) / 1000)} s.`, 429, { pausedFor: Math.ceil((state.pausedUntil - Date.now()) / 1000) });
        }
        if (counted() >= state.limit) {
            throw new BridgeError(`Today's Pixiv limit (${state.limit} requests) is reached. Raise it in the Image Search settings, or wait until tomorrow.`, 429, { limit: true });
        }
        const wait = lastApiAt + state.gapMs + Math.floor(Math.random() * 400) - Date.now();
        if (wait > 0) {
            await sleep(wait);
        }
        lastApiAt = Date.now();
        state.count = counted() + 1;
        store();
        let response;
        try {
            response = await fetch(`${SITE}${pathAndQuery}`, { headers: headers({ Accept: 'application/json' }) });
        } catch (error) {
            throw new BridgeError(`Could not reach Pixiv: ${error?.message || error}`, 502);
        }
        const text = await response.text();
        if (response.status === 429 || response.status === 403) {
            pause();
            state.lastError = `Pixiv answered ${response.status}; paused for ${Math.round(state.pauseMs / 60000)} min.`;
            throw new BridgeError(state.lastError, 429, { pausedFor: Math.ceil(state.pauseMs / 1000) });
        }
        let data = null;
        try {
            data = JSON.parse(text);
        } catch {
            data = null;
        }
        if (!data) {
            state.lastError = `Pixiv answered ${response.status} with something that is not JSON.`;
            throw new BridgeError(`${state.lastError} ${text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)}`, 502);
        }
        if (data.error) {
            state.lastError = String(data.message || 'Pixiv answered with an error.');
            throw new BridgeError(state.lastError, response.status === 401 ? 401 : 404);
        }
        state.pauseMs = 0;
        state.lastError = '';
        return data.body;
    });
    apiChain = job.catch(() => {});
    const body = await job;
    if (cache) {
        apiCache.set(key, { at: Date.now(), body });
        while (apiCache.size > CACHE_LIMIT) {
            apiCache.delete(apiCache.keys().next().value);
        }
    }
    return body;
}

function imagePath(url) {
    try {
        const parsed = new URL(url);
        if (!IMAGE_HOST.test(parsed.hostname)) {
            return '';
        }
        return `/i${parsed.pathname}`;
    } catch {
        return '';
    }
}

function regularOf(thumb) {
    return String(thumb || '')
        .replace(/\/c\/[^/]+\//, '/')
        .replace('/custom-thumb/', '/img-master/')
        .replace(/_(?:square|custom)1200\./, '_master1200.');
}

function kindOf(type) {
    return Number(type) === 1 ? 'manga' : Number(type) === 2 ? 'ugoira' : 'illust';
}

function tagsOf(list, translations = {}) {
    return (Array.isArray(list) ? list : []).map(entry => {
        const tag = typeof entry === 'string' ? entry : entry?.tag;
        const en = (typeof entry === 'object' && entry?.translation?.en) || translations?.[tag]?.en || translations?.[tag]?.romaji || '';
        return tag ? { tag: String(tag), en: String(en || '') } : null;
    }).filter(Boolean);
}

function workItem(work, translations = {}) {
    const id = String(work.id ?? work.illustId ?? '');
    const thumb = work.url || work.urls?.thumb || work.urls?.small || '';
    const regular = work.urls?.regular || regularOf(thumb);
    return {
        id,
        title: String(work.title ?? work.illustTitle ?? ''),
        kind: kindOf(work.illustType),
        restrict: Number(work.xRestrict) || 0,
        ai: Number(work.aiType) === 2,
        pages: Number(work.pageCount) || 1,
        width: Number(work.width) || 0,
        height: Number(work.height) || 0,
        userId: String(work.userId ?? ''),
        userName: String(work.userName ?? ''),
        date: String(work.createDate ?? ''),
        tags: tagsOf(work.tags?.tags || work.tags, translations),
        thumb: imagePath(thumb),
        regular: imagePath(regular),
        original: work.urls?.original ? imagePath(work.urls.original) : '',
    };
}

function readWord(raw) {
    const options = { kind: 'all', mode: 'all', order: 'date_d', match: 's_tag', ai: false };
    const words = [];
    let special = null;
    for (const token of String(raw || '').split(/\s+/).filter(Boolean)) {
        const option = token.match(/^pixiv-(kind|mode|order|match|ai):(.+)$/);
        if (option) {
            options[option[1]] = option[2];
            continue;
        }
        const artwork = token.match(/(?:artworks\/|illust_id=|^pixiv:id:)(\d+)/);
        const user = token.match(/(?:users\/|member\.php\?id=|^pixiv:user:)(\d+)/);
        if (artwork) {
            special = { what: 'work', id: artwork[1] };
        } else if (user) {
            special = { what: 'user', id: user[1] };
        } else if (token === 'pixiv:bookmarks') {
            special = { what: 'bookmarks' };
        } else if (token === 'pixiv:following') {
            special = { what: 'following' };
        } else {
            words.push(token);
        }
    }
    return { options, words, special };
}

async function search(raw, page) {
    const { options, words, special } = readWord(raw);
    const p = Math.max(1, Number(page) || 1);
    if (special?.what === 'work') {
        if (p > 1) {
            return { items: [], done: true };
        }
        const work = await pixivApi(`/ajax/illust/${special.id}?lang=en`);
        return { items: [workItem(work)], done: true };
    }
    if (special?.what === 'user') {
        const all = await pixivApi(`/ajax/user/${special.id}/profile/all?lang=en`);
        const ids = [...Object.keys(all?.illusts || {}), ...Object.keys(all?.manga || {})].map(Number).sort((a, b) => b - a);
        const slice = ids.slice((p - 1) * 48, p * 48);
        if (!slice.length) {
            return { items: [], done: true };
        }
        const works = await pixivApi(`/ajax/user/${special.id}/profile/illusts?${slice.map(id => `ids%5B%5D=${id}`).join('&')}&work_category=illustManga&is_first_page=0&lang=en`);
        const items = slice.map(id => works?.works?.[id]).filter(Boolean).map(work => workItem(work));
        return { items, done: p * 48 >= ids.length };
    }
    if (special?.what === 'bookmarks') {
        if (!state.userId) {
            throw new BridgeError('Log in to Pixiv in the Image Search settings to see your bookmarks.', 401);
        }
        const body = await pixivApi(`/ajax/user/${state.userId}/illusts/bookmarks?tag=&offset=${(p - 1) * 48}&limit=48&rest=show&lang=en`);
        const items = (body?.works || []).filter(work => work && work.id && !work.isMasked).map(work => workItem(work));
        return { items, done: (p * 48) >= (Number(body?.total) || 0) };
    }
    if (special?.what === 'following') {
        if (!state.cookie) {
            throw new BridgeError('Log in to Pixiv in the Image Search settings to see the works of the artists you follow.', 401);
        }
        const body = await pixivApi(`/ajax/follow_latest/illust?p=${p}&mode=${options.mode === 'r18' ? 'r18' : 'all'}&lang=en`);
        const items = (body?.thumbnails?.illust || []).map(work => workItem(work, body?.tagTranslation));
        return { items, done: !items.length || p >= 34 };
    }
    if (!words.length) {
        return { items: [], done: true };
    }
    const word = words.join(' ');
    const path = options.kind === 'manga' ? 'manga' : options.kind === 'illust' || options.kind === 'ugoira' ? 'illustrations' : 'artworks';
    const type = options.kind === 'illust' ? 'illust_and_ugoira' : options.kind === 'ugoira' ? 'ugoira' : options.kind === 'manga' ? 'manga' : 'all';
    const mode = ['all', 'safe', 'r18'].includes(options.mode) ? options.mode : 'all';
    const order = options.order === 'date' ? 'date' : 'date_d';
    const match = ['s_tag', 's_tag_full', 's_tc'].includes(options.match) ? options.match : 's_tag';
    const query = `word=${encodeURIComponent(word)}&order=${order}&mode=${mode}&p=${p}&s_mode=${match}&type=${type}${options.ai === 'hide' ? '&ai_type=1' : ''}&lang=en`;
    const body = await pixivApi(`/ajax/search/${path}/${encodeURIComponent(word)}?${query}`);
    const block = body?.illustManga || body?.illust || body?.manga || {};
    const items = (block.data || []).filter(work => work && work.id && !work.isAdContainer).map(work => workItem(work, body?.tagTranslation));
    return { items, done: !items.length || p * 60 >= (Number(block.total) || 0) };
}

async function workDetail(id) {
    const work = await pixivApi(`/ajax/illust/${id}?lang=en`);
    const item = workItem(work);
    let pages = [{ thumb: item.thumb, regular: item.regular, original: item.original, width: item.width, height: item.height }];
    if (item.pages > 1) {
        const list = await pixivApi(`/ajax/illust/${id}/pages?lang=en`);
        pages = (Array.isArray(list) ? list : []).map(page => ({
            thumb: imagePath(page.urls?.small || page.urls?.thumb_mini || ''),
            regular: imagePath(page.urls?.regular || ''),
            original: imagePath(page.urls?.original || ''),
            width: Number(page.width) || 0,
            height: Number(page.height) || 0,
        }));
    }
    return { item, pages };
}

async function ugoiraMeta(id) {
    const meta = await pixivApi(`/ajax/illust/${id}/ugoira_meta?lang=en`);
    return {
        zip: imagePath(meta?.src || ''),
        frames: (meta?.frames || []).map(frame => ({ file: String(frame.file), delay: Number(frame.delay) || 100 })),
    };
}

function takeImageSlot() {
    if (imageBusy < IMAGE_JOBS) {
        imageBusy++;
        return Promise.resolve();
    }
    return new Promise(resolve => imageWaiting.push(resolve));
}

function giveImageSlot() {
    const next = imageWaiting.shift();
    if (next) {
        next();
    } else {
        imageBusy--;
    }
}

async function sendImage(res, imgPath) {
    if (!/^\/[\w\-./]+$/.test(imgPath) || imgPath.includes('..')) {
        res.status(400).json({ error: 'Not a Pixiv picture address.' });
        return;
    }
    const kept = imageCache.get(imgPath);
    if (kept) {
        res.set({ 'Content-Type': kept.type, 'Cache-Control': 'private, max-age=86400' }).send(kept.bytes);
        return;
    }
    if (Date.now() < state.pausedUntil) {
        res.status(429).json({ error: 'Pixiv asked for a pause.', pausedFor: Math.ceil((state.pausedUntil - Date.now()) / 1000) });
        return;
    }
    await takeImageSlot();
    try {
        const response = await fetch(`${IMAGES}${imgPath}`, { headers: headers() });
        if (response.status === 429) {
            pause();
        }
        if (!response.ok) {
            res.status(response.status === 404 ? 404 : 502).json({ error: `Pixiv's picture server answered ${response.status}.` });
            return;
        }
        const type = response.headers.get('content-type') || 'application/octet-stream';
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length <= IMAGE_CACHE_ITEM) {
            imageCache.set(imgPath, { type, bytes });
            imageCacheBytes += bytes.length;
            while (imageCacheBytes > IMAGE_CACHE_BYTES && imageCache.size) {
                const [oldKey, old] = imageCache.entries().next().value;
                imageCache.delete(oldKey);
                imageCacheBytes -= old.bytes.length;
            }
        }
        res.set({ 'Content-Type': type, 'Cache-Control': 'private, max-age=86400' }).send(bytes);
    } catch (error) {
        res.status(502).json({ error: `Could not reach Pixiv's picture server: ${error?.message || error}` });
    } finally {
        giveImageSlot();
    }
}

function fail(res, error) {
    const status = error instanceof BridgeError ? error.status : 500;
    res.status(status).json({ error: String(error?.message || error), ...(error?.extra || {}) });
}

async function checkLogin(cookie) {
    const userId = String(cookie).split('_')[0];
    if (!/^\d+$/.test(userId)) {
        throw new BridgeError('That does not look like a Pixiv login: PHPSESSID starts with your user number and an underscore.', 400);
    }
    const before = { cookie: state.cookie, userId: state.userId, userName: state.userName };
    state.cookie = cookie;
    state.userId = userId;
    try {
        await pixivApi(`/ajax/user/${userId}/illusts/bookmarks?tag=&offset=0&limit=1&rest=hide&lang=en`, { cache: false });
        const user = await pixivApi(`/ajax/user/${userId}?lang=en`, { cache: false }).catch(() => null);
        state.userName = String(user?.name || '');
        store();
    } catch (error) {
        Object.assign(state, before);
        throw error instanceof BridgeError && error.status !== 429 ? new BridgeError('Pixiv did not accept this login. Copy PHPSESSID again from a browser where you are logged in.', 401) : error;
    }
}

async function init(router) {
    state.file = path.join(globalThis.DATA_ROOT || path.join(process.cwd(), 'data'), '_pixiv-bridge', 'state.json');
    load();
    router.get('/status', (req, res) => res.json(status()));
    router.post('/login', async (req, res) => {
        try {
            const cookie = String(req.body?.cookie || '').trim().replace(/^PHPSESSID=/i, '').replace(/;.*$/, '');
            await checkLogin(cookie);
            apiCache.clear();
            res.json(status());
        } catch (error) {
            fail(res, error);
        }
    });
    router.post('/logout', (req, res) => {
        state.cookie = '';
        state.userId = '';
        state.userName = '';
        apiCache.clear();
        store();
        res.json(status());
    });
    router.post('/settings', (req, res) => {
        const limit = Number(req.body?.limit);
        if (Number.isFinite(limit) && limit >= 20 && limit <= 5000) {
            state.limit = Math.round(limit);
        }
        store();
        res.json(status());
    });
    router.get('/search', async (req, res) => {
        try {
            res.json(await search(req.query.word, req.query.p));
        } catch (error) {
            fail(res, error);
        }
    });
    router.get('/work/:id', async (req, res) => {
        try {
            if (!/^\d+$/.test(req.params.id)) {
                throw new BridgeError('Not a Pixiv work number.', 400);
            }
            res.json(await workDetail(req.params.id));
        } catch (error) {
            fail(res, error);
        }
    });
    router.get('/ugoira/:id', async (req, res) => {
        try {
            if (!/^\d+$/.test(req.params.id)) {
                throw new BridgeError('Not a Pixiv work number.', 400);
            }
            res.json(await ugoiraMeta(req.params.id));
        } catch (error) {
            fail(res, error);
        }
    });
    router.get('/original/:id/:page', async (req, res) => {
        try {
            const id = req.params.id;
            const page = Number(String(req.params.page).replace(/\..*$/, '')) || 0;
            if (!/^\d+$/.test(id)) {
                throw new BridgeError('Not a Pixiv work number.', 400);
            }
            const { pages } = await workDetail(id);
            const found = pages[page]?.original || pages[page]?.regular;
            if (!found) {
                throw new BridgeError('That page was not found.', 404);
            }
            await sendImage(res, found.replace(/^\/i/, ''));
        } catch (error) {
            fail(res, error);
        }
    });
    router.get(/^\/i(\/.+)$/, (req, res) => sendImage(res, req.params[0]));
}

async function exit() {
    store();
}

module.exports = { init, exit, info, _test: { state, readWord, regularOf, workItem, apiCache } };
