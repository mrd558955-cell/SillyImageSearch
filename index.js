const MODULE = 'st_imagesearch';
const PROMPT_KEY = 'st_imagesearch_instruction';
const VERSION = '2.0.0';
const BATCH = 24;
const MAX_PAGE_CALLS = 4;
const LOCAL_IMAGE_MD = /!\[([^\]\n]*)\]\((\/user\/images\/imagesearch\/[^)\s]+)\)/g;
const ENGINE_ORDER = ['gelbooru', 'danbooru', 'moebooru', 'philomena'];
const NOT_BOARD = new Set(['web', 'web-unchecked', 'none']);
const KNOWN_WEB = /(^|\.)(wikimedia\.org|wikipedia\.org|pexels\.com|unsplash\.com|artstation\.com|flickr\.com|deviantart\.com|pinterest\.[a-z.]+|pixabay\.com|imgur\.com|reddit\.com)$/;
const DROP_TAGS = new Set(['night', 'day', 'daytime', 'nighttime', 'dawn', 'dusk', 'sunset', 'sunrise', 'evening', 'morning', 'afternoon', 'twilight', 'midnight', 'night_sky', 'starry_sky', 'indoors', 'outdoors', 'sunlight', 'moonlight', 'rain', 'snowing', 'cloudy_sky', 'blue_sky', 'scenery', 'forest', 'woods', 'city', 'cityscape', 'street', 'alley', 'beach', 'ocean', 'sea', 'river', 'lake', 'mountain', 'mountains', 'field', 'meadow', 'park', 'garden', 'desert', 'cave', 'village', 'town', 'school', 'classroom', 'library', 'bedroom', 'room', 'kitchen', 'bathroom', 'office', 'cafe', 'tavern', 'inn', 'shrine', 'temple', 'ruins', 'dungeon', 'castle', 'snow', 'grass', 'water', 'sky']);

const DEFAULT_TAG_PROMPT = 'Below is the latest part of a roleplay. Reply with up to {{max}} image-board (booru) tags describing who or what is visible right now: character type, hair, eyes, clothing, expression, pose, creatures, objects. Most important tag first. Lowercase, underscores inside multi-word tags (black_hair, cat_ears), separated by commas. No locations, backgrounds, time of day, weather or lighting. Reply with the tags only, nothing else.\n\n{{context}}';

const DEFAULTS = {
    enabled: true,
    sites: 'safebooru.org',
    useProxy: false,
    saveLocal: true,
    attachOnSend: true,
    fetcherUrl: '',
    fetcherKey: '',
    extraExcluded: '',
    tagProfile: '',
    prefetch: true,
    maxSuggested: 8,
    contextMessages: 3,
    contextChars: 500,
    tagMaxTokens: 100,
    tagPrompt: DEFAULT_TAG_PROMPT,
    lastTags: [],
    lastSite: '',
    engines: {},
};

const RATINGS = ['general', 'sensitive', 'questionable', 'explicit'];
const CLEANUP_URL = 'https://raw.githubusercontent.com/mrd558955-cell/SillyImageSearch/main/tag-cleanup.txt';
const CLEANUP_REFRESH_MS = 10 * 60 * 1000;
let cleanupTags = new Set();

const EXCLUDED_TAGS = new Set(['animated', 'animated_gif', 'animated_png', 'video', 'comic', '4koma']);
const BLOCKED_TAGS = new Set([]);

class BlockedError extends Error {}

const noOrderSites = new Set();

const state = {
    prefetch: null,
    prefetchTimer: null,
    pickerOpen: false,
};

function ctx() {
    return SillyTavern.getContext();
}

function settings() {
    const all = ctx().extensionSettings;
    if (!all[MODULE]) {
        all[MODULE] = {};
    }
    const s = all[MODULE];
    if (!s.ratings || typeof s.ratings !== 'object') {
        const all4 = s.safeOnly === false;
        s.ratings = { general: true, sensitive: all4, questionable: all4, explicit: all4 };
    }
    if (!RATINGS.some(r => s.ratings[r])) {
        s.ratings.general = true;
    }
    for (const [key, value] of Object.entries(DEFAULTS)) {
        if (s[key] === undefined) {
            s[key] = Array.isArray(value) ? [...value] : typeof value === 'object' ? { ...value } : value;
        }
    }
    if (!Array.isArray(s.lastTags)) {
        s.lastTags = [];
    }
    if (String(s.sites).trim() === 'commons.wikimedia.org\npexels.com') {
        s.sites = DEFAULTS.sites;
        s.engines = {};
    }
    return s;
}

function save() {
    ctx().saveSettingsDebounced();
}

function normalizeTag(tag) {
    return String(tag || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/^_+|_+$/g, '');
}

function normalizeTagList(text) {
    return String(text || '')
        .split(/[\n,]/)
        .map(normalizeTag)
        .filter(line => line && !line.startsWith('#'));
}

function personalTags() {
    return new Set(normalizeTagList(settings().extraExcluded));
}

function isCleanupTag(tag) {
    const t = String(tag).toLowerCase();
    return cleanupTags.has(t) || personalTags().has(t);
}

function isBlockedQueryTag(tag) {
    return isCleanupTag(tag) || BLOCKED_TAGS.has(tag);
}

async function refreshCleanup() {
    const s = settings();
    try {
        const response = await fetch(`${CLEANUP_URL}?t=${Date.now()}`, { cache: 'no-store', referrerPolicy: 'no-referrer' });
        if (response.ok) {
            const list = normalizeTagList(await response.text());
            s.cleanupCache = list;
            save();
        }
    } catch (error) {
        console.debug('[Image Search] cleanup list unavailable', error);
    }
    cleanupTags = new Set(Array.isArray(s.cleanupCache) ? s.cleanupCache : []);
    const view = document.getElementById('st_imagesearch_cleanup_view');
    if (view) {
        view.value = [...cleanupTags].join('\n');
    }
}

function applyReferrerPolicy() {
    let meta = document.querySelector('meta[name="referrer"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'referrer';
        document.head.appendChild(meta);
    }
    meta.content = 'no-referrer';
}

function siteEntries() {
    return String(settings().sites || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const [first, ...rest] = line.split(/\s+/);
            const domain = first.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
            const extra = rest.join('&').replace(/^[?&]+/, '');
            return { domain, extra: extra ? `&${extra}` : '' };
        })
        .filter(entry => entry.domain);
}

function activeDomain() {
    const s = settings();
    const domains = siteEntries().map(entry => entry.domain);
    if (s.lastSite && domains.includes(s.lastSite)) {
        return s.lastSite;
    }
    return domains[0] || '';
}

function hostOf(url) {
    try {
        return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
        return '';
    }
}

function proxyUrl(url) {
    return `/proxy/${encodeURIComponent(url)}`;
}

async function rawFetch(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        const text = await response.text();
        let data = null;
        try {
            data = JSON.parse(text);
        } catch {
            data = null;
        }
        return { ok: response.ok, status: response.status, text, data };
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error('Request timed out.');
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

async function request(url, options = {}) {
    const s = settings();
    if (!s.useProxy) {
        try {
            return await rawFetch(url, options);
        } catch (error) {
            if (error?.message === 'Request timed out.') {
                throw error;
            }
        }
    }
    let result;
    try {
        result = await rawFetch(proxyUrl(url), { ...options, headers: { ...ctx().getRequestHeaders(), ...(options.headers || {}) } });
    } catch (error) {
        throw new BlockedError(`Could not reach ${hostOf(url)}: ${error?.message || error}`);
    }
    if (result.status === 404 && /CORS proxy is disabled/i.test(result.text)) {
        throw new BlockedError(`${hostOf(url)} blocks requests from the browser. Set enableCorsProxy: true in SillyTavern's config.yaml and restart.`);
    }
    return result;
}

function ratingNegatives(ratings, names) {
    return RATINGS.filter(r => !ratings[r] && names[r]).flatMap(r => names[r].map(value => `-rating:${value}`));
}

function onlyGeneral(ratings) {
    return ratings.general && !ratings.sensitive && !ratings.questionable && !ratings.explicit;
}

function tagList(value) {
    if (Array.isArray(value)) {
        return value.map(String);
    }
    if (value && typeof value === 'object') {
        return Object.values(value).flat().map(String);
    }
    return String(value || '').split(/\s+/).filter(Boolean);
}

function absolute(url, origin) {
    if (typeof url !== 'string' || !url) {
        return '';
    }
    if (url.startsWith('//')) {
        return `https:${url}`;
    }
    if (url.startsWith('/')) {
        return `${origin}${url}`;
    }
    return url;
}

function isStillImage(url) {
    try {
        return /\.(jpe?g|png|webp|gif|avif)$/i.test(new URL(url).pathname);
    } catch {
        return false;
    }
}

function baseName(file) {
    return String(file || '').replace(/\.[^.]+$/, '');
}

function gelbooruPath(post, origin, folder, prefix, ext) {
    if (!post.directory || !post.image) {
        return '';
    }
    return `${origin}/${folder}/${post.directory}/${prefix}${ext ? `${baseName(post.image)}.${ext}` : post.image}`;
}

const ENGINES = {
    gelbooru: {
        cap: 6,
        pageSize: 100,
        url: (origin, tags, extra, page) => `${origin}/index.php?page=dapi&s=post&q=index&json=1&limit=100&pid=${page}&tags=${encodeURIComponent(tags.join(' '))}${extra}`,
        tags: (userTags, ratings) => [...userTags, 'sort:score:desc', '-animated', '-comic', ...ratingNegatives(ratings, { general: ['general', 'safe'], sensitive: ['sensitive'], questionable: ['questionable'], explicit: ['explicit'] })],
        parse: result => {
            if (!result.ok) {
                return null;
            }
            if (result.data === null) {
                return result.text.trim() === '' ? [] : null;
            }
            if (Array.isArray(result.data)) {
                return result.data.length && typeof result.data[0] === 'object' && !('directory' in result.data[0] || 'file_url' in result.data[0]) ? null : result.data;
            }
            if (result.data && typeof result.data === 'object' && ('post' in result.data || '@attributes' in result.data)) {
                return Array.isArray(result.data.post) ? result.data.post : [];
            }
            return null;
        },
        image: (post, origin) => absolute(post.sample_url, origin) || (post.sample && Number(post.sample) !== 0 ? gelbooruPath(post, origin, 'samples', 'sample_', 'jpg') : '') || absolute(post.file_url, origin) || gelbooruPath(post, origin, 'images', '', ''),
        full: (post, origin) => absolute(post.file_url, origin) || gelbooruPath(post, origin, 'images', '', ''),
        thumb: (post, origin) => absolute(post.preview_url, origin) || gelbooruPath(post, origin, 'thumbnails', 'thumbnail_', 'jpg'),
        postUrl: (post, origin) => `${origin}/index.php?page=post&s=view&id=${post.id}`,
        rating: post => ({ general: 'general', safe: 'general', s: 'general', sensitive: 'sensitive', questionable: 'questionable', q: 'questionable', explicit: 'explicit', e: 'explicit' }[String(post.rating || '').toLowerCase()] || ''),
        postTags: post => tagList(post.tags),
    },
    danbooru: {
        cap: 2,
        pageSize: 100,
        url: (origin, tags, extra, page) => `${origin}/posts.json?limit=100&page=${page + 1}&tags=${encodeURIComponent(tags.join(' '))}${extra}`,
        tags: (userTags, ratings, noOrder) => [...userTags, ...(noOrder ? [] : ['order:score'])],
        parse: result => {
            if (!result.ok || !Array.isArray(result.data)) {
                return null;
            }
            return result.data.length && typeof result.data[0] === 'object' && !('tag_string' in result.data[0] || 'file_url' in result.data[0] || 'md5' in result.data[0]) ? null : result.data;
        },
        image: (post, origin) => absolute(post.large_file_url, origin) || absolute(post.file_url, origin),
        full: (post, origin) => absolute(post.file_url, origin),
        thumb: (post, origin) => absolute(post.preview_file_url, origin),
        postUrl: (post, origin) => `${origin}/posts/${post.id}`,
        rating: post => ({ g: 'general', s: 'sensitive', q: 'questionable', e: 'explicit' }[String(post.rating || '').toLowerCase()] || ''),
        postTags: post => tagList(post.tag_string),
    },
    e621: {
        cap: 6,
        pageSize: 100,
        url: (origin, tags, extra, page) => `${origin}/posts.json?limit=100&page=${page + 1}&tags=${encodeURIComponent(tags.join(' '))}${extra}`,
        tags: (userTags, ratings) => [...userTags, 'order:score', '-animated', '-comic', ...ratingNegatives(ratings, { general: ['s'], questionable: ['q'], explicit: ['e'] })],
        parse: result => (result.ok && result.data && Array.isArray(result.data.posts) ? result.data.posts : null),
        image: (post, origin) => absolute(post.sample?.url, origin) || absolute(post.file?.url, origin),
        full: (post, origin) => absolute(post.file?.url, origin),
        thumb: (post, origin) => absolute(post.preview?.url, origin),
        postUrl: (post, origin) => `${origin}/posts/${post.id}`,
        rating: post => ({ s: 'general', q: 'questionable', e: 'explicit' }[String(post.rating || '').toLowerCase()] || ''),
        postTags: post => tagList(post.tags),
    },
    moebooru: {
        cap: 4,
        pageSize: 100,
        url: (origin, tags, extra, page) => `${origin}/post.json?limit=100&page=${page + 1}&tags=${encodeURIComponent(tags.join(' '))}${extra}`,
        tags: (userTags, ratings) => [...userTags, 'order:score', ...(onlyGeneral(ratings) ? ['rating:s'] : [])],
        parse: result => {
            if (!result.ok || !Array.isArray(result.data)) {
                return null;
            }
            return result.data.length && typeof result.data[0] === 'object' && !('file_url' in result.data[0] || 'jpeg_url' in result.data[0]) ? null : result.data;
        },
        image: (post, origin) => absolute(post.sample_url, origin) || absolute(post.jpeg_url, origin) || absolute(post.file_url, origin),
        full: (post, origin) => absolute(post.jpeg_url, origin) || absolute(post.file_url, origin),
        thumb: (post, origin) => absolute(post.preview_url, origin),
        postUrl: (post, origin) => `${origin}/post/show/${post.id}`,
        rating: post => ({ s: 'general', q: 'questionable', e: 'explicit' }[String(post.rating || '').toLowerCase()] || ''),
        postTags: post => tagList(post.tags),
    },
    philomena: {
        cap: 5,
        pageSize: 50,
        url: (origin, tags, extra, page) => `${origin}/api/v1/json/search/images?per_page=50&page=${page + 1}&sf=score&sd=desc&q=${encodeURIComponent(tags.length ? tags.join(', ') : '*')}${extra}`,
        tags: (userTags, ratings) => [...userTags.map(tag => tag.replace(/_/g, ' ')), ...(onlyGeneral(ratings) ? ['safe'] : [])],
        parse: result => (result.ok && result.data && Array.isArray(result.data.images) ? result.data.images : null),
        image: (post, origin) => absolute(post.representations?.large, origin) || absolute(post.representations?.full, origin) || absolute(post.view_url, origin),
        full: (post, origin) => absolute(post.representations?.full, origin) || absolute(post.view_url, origin),
        thumb: (post, origin) => absolute(post.representations?.thumb, origin) || absolute(post.representations?.thumb_small, origin),
        postUrl: (post, origin) => `${origin}/images/${post.id}`,
        rating: post => {
            const tags = tagList(post.tags).map(tag => tag.toLowerCase());
            return tags.includes('explicit') ? 'explicit' : tags.includes('questionable') ? 'questionable' : tags.includes('suggestive') ? 'sensitive' : tags.includes('safe') ? 'general' : '';
        },
        postTags: post => tagList(post.tags).map(tag => tag.replace(/\s+/g, '_')),
    },
};

function engineFor(name, result) {
    if (name === 'danbooru' && result?.ok && result.data && !Array.isArray(result.data) && Array.isArray(result.data.posts)) {
        return 'e621';
    }
    return name;
}

function allowedPost(engine, post, ratings, localTags) {
    const rating = engine.rating(post) || 'explicit';
    if (!ratings[rating]) {
        return false;
    }
    const tags = engine.postTags(post).map(tag => tag.toLowerCase());
    if (tags.some(tag => BLOCKED_TAGS.has(tag) || EXCLUDED_TAGS.has(tag) || isCleanupTag(tag))) {
        return false;
    }
    if (!localTags.length) {
        return true;
    }
    const have = new Set(tags);
    return localTags.every(tag => have.has(tag));
}

function postsToItems(engineName, posts, origin, ratings, localTags) {
    const engine = ENGINES[engineName];
    return posts
        .filter(post => post && typeof post === 'object' && allowedPost(engine, post, ratings, localTags))
        .map(post => {
            const img = engine.image(post, origin);
            const full = engine.full(post, origin);
            const thumb = engine.thumb(post, origin);
            const alts = [full, thumb].filter(alt => alt && alt !== img && isStillImage(alt));
            return { img, thumb: thumb || img, alts, page: engine.postUrl(post, origin) };
        })
        .filter(item => isStillImage(item.img));
}

async function detectEngine(entry, probeTags) {
    const s = settings();
    if (KNOWN_WEB.test(entry.domain)) {
        s.engines[entry.domain] = 'none';
        save();
        return 'none';
    }
    const origin = `https://${entry.domain}`;
    const probe = probeTags.slice(0, 1);
    for (const name of ENGINE_ORDER) {
        const engine = ENGINES[name];
        let result;
        try {
            result = await request(engine.url(origin, engine.tags(probe, false), entry.extra, 0));
        } catch (error) {
            if (error instanceof BlockedError) {
                throw new BlockedError(`${entry.domain}: the browser blocked the check. If it is an image board, set enableCorsProxy: true in SillyTavern's config.yaml and restart.`);
            }
            throw error;
        }
        const detected = engineFor(name, result);
        if (ENGINES[detected].parse(result) !== null) {
            s.engines[entry.domain] = detected;
            save();
            return detected;
        }
    }
    s.engines[entry.domain] = 'none';
    save();
    return 'none';
}

async function engineOf(entry, tags) {
    const known = settings().engines[entry.domain];
    if (known) {
        return known;
    }
    return detectEngine(entry, tags);
}

function capFor(domain) {
    const engine = ENGINES[settings().engines[domain]];
    return engine ? engine.cap : 0;
}

async function fetchPage(entry, engineName, tags, page) {
    const s = settings();
    const engine = ENGINES[engineName];
    const origin = `https://${entry.domain}`;
    const siteTags = tags.slice(0, engine.cap);
    const localTags = tags.slice(engine.cap);
    let noOrder = noOrderSites.has(entry.domain);
    for (let attempt = 0; attempt < 2; attempt++) {
        const query = engine.tags(siteTags, s.ratings, noOrder);
        const result = await request(engine.url(origin, query, entry.extra, page));
        const posts = engine.parse(result);
        if (posts === null) {
            if (engineName === 'danbooru' && !noOrder) {
                noOrder = true;
                noOrderSites.add(entry.domain);
                continue;
            }
            throw new Error(`${entry.domain} answered ${result.status}: ${String(result.text).slice(0, 150)}`);
        }
        return { items: postsToItems(engineName, posts, origin, s.ratings, localTags), done: posts.length < engine.pageSize };
    }
    return { items: [], done: true };
}

function createBrowse(domain, tags) {
    return { domain, tags: [...tags], page: 0, items: [], seen: new Set(), done: false, loading: null, error: '', engine: '' };
}

function sameTags(a, b) {
    return a.length === b.length && a.every((tag, i) => tag === b[i]);
}

async function loadMore(browse) {
    if (browse.loading) {
        return browse.loading;
    }
    if (browse.done) {
        return [];
    }
    browse.loading = (async () => {
        const entry = siteEntries().find(e => e.domain === browse.domain);
        if (!entry) {
            throw new Error(`${browse.domain} is not in the approved sites.`);
        }
        const engineName = await engineOf(entry, browse.tags);
        browse.engine = engineName;
        if (NOT_BOARD.has(engineName) || !ENGINES[engineName]) {
            throw new Error(`${browse.domain} is not an image board this extension can search.`);
        }
        const added = [];
        let calls = 0;
        while (!browse.done && added.length < BATCH && calls < MAX_PAGE_CALLS) {
            calls++;
            const { items, done } = await fetchPage(entry, engineName, browse.tags, browse.page);
            browse.page++;
            browse.done = done;
            for (const item of items) {
                if (!browse.seen.has(item.img)) {
                    browse.seen.add(item.img);
                    browse.items.push(item);
                    added.push(item);
                }
            }
        }
        return added;
    })();
    try {
        return await browse.loading;
    } catch (error) {
        browse.error = String(error?.message || error);
        browse.done = true;
        throw error;
    } finally {
        browse.loading = null;
    }
}

function warmThumbs(items) {
    items.slice(0, BATCH).forEach(item => {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.src = item.thumb;
    });
}

function cleanForPrompt(text) {
    return String(text || '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildTagPrompt() {
    const s = settings();
    const c = ctx();
    const count = Math.max(1, Number(s.contextMessages) || 3);
    const chars = Math.max(100, Number(s.contextChars) || 500);
    const lines = (c.chat || [])
        .filter(m => m && !m.is_system && typeof m.mes === 'string' && m.mes.trim())
        .slice(-count)
        .map(m => {
            const text = cleanForPrompt(m.mes);
            return `${m.name || (m.is_user ? 'User' : 'Character')}: ${text.length > chars ? '…' + text.slice(-chars) : text}`;
        });
    return String(s.tagPrompt || DEFAULT_TAG_PROMPT)
        .replace(/\{\{max\}\}/g, String(Math.max(1, Number(s.maxSuggested) || 8)))
        .replace(/\{\{context\}\}/g, lines.join('\n'));
}

function parseSuggestion(text) {
    const s = settings();
    const max = Math.max(1, Number(s.maxSuggested) || 8);
    const body = String(text || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, ' ')
        .replace(/^\s*tags?\s*:/i, '');
    const seen = new Set();
    const tags = [];
    for (const raw of body.split(/[,\n]/)) {
        const tag = normalizeTag(raw.replace(/^\s*(?:[-*#•]+|\d+[.)])\s*/, '').replace(/["'`[\]]/g, ''));
        if (!tag || tag.length > 40 || !/^[a-z0-9_()'.:!?&+-]+$/.test(tag)) {
            continue;
        }
        if (seen.has(tag) || DROP_TAGS.has(tag) || isBlockedQueryTag(tag)) {
            continue;
        }
        seen.add(tag);
        tags.push(tag);
        if (tags.length >= max) {
            break;
        }
    }
    return tags;
}

async function suggestTags(signal) {
    const s = settings();
    const c = ctx();
    const service = c.ConnectionManagerRequestService;
    if (!service) {
        throw new Error('This SillyTavern version has no connection profile support for extensions.');
    }
    if (!s.tagProfile) {
        throw new Error('No tag profile chosen in Image Search settings.');
    }
    const messages = [{ role: 'user', content: buildTagPrompt() }];
    const prompt = service.constructPrompt(messages, s.tagProfile);
    const result = await service.sendRequest(s.tagProfile, prompt, Math.max(16, Number(s.tagMaxTokens) || 100), { stream: false, signal, extractData: true, includePreset: false, includeInstruct: true }, { temperature: 0.3 });
    const text = typeof result === 'string' ? result : result?.content || '';
    const tags = parseSuggestion(text);
    if (!tags.length) {
        const usedReasoning = typeof result === 'object' && result?.reasoning;
        throw new Error(usedReasoning ? 'The tag model spent its tokens thinking and gave no tags. Use a non-thinking model or raise the token limit.' : 'The tag model gave no usable tags.');
    }
    return tags;
}

function currentChatId() {
    try {
        return ctx().getCurrentChatId() || '';
    } catch {
        return '';
    }
}

function startPrefetch() {
    const s = settings();
    if (state.prefetch) {
        state.prefetch.controller.abort();
    }
    if (!s.enabled || !s.tagProfile) {
        state.prefetch = null;
        return null;
    }
    const entry = { chatId: currentChatId(), controller: new AbortController(), tags: null, browse: null, error: '' };
    entry.promise = (async () => {
        try {
            const tags = await suggestTags(entry.controller.signal);
            if (entry.controller.signal.aborted) {
                return;
            }
            entry.tags = tags;
            const domain = activeDomain();
            if (domain) {
                entry.browse = createBrowse(domain, tags);
                loadMore(entry.browse).then(warmThumbs).catch(() => {});
            }
        } catch (error) {
            if (!entry.controller.signal.aborted) {
                entry.error = String(error?.cause?.message || error?.message || error);
                console.warn('[Image Search] tag suggestion failed', error);
            }
        }
    })();
    state.prefetch = entry;
    return entry;
}

function onReplyFinished(messageId, type) {
    const s = settings();
    if (!s.enabled || !s.prefetch || !s.tagProfile || type === 'impersonate') {
        return;
    }
    const message = ctx().chat[Number(messageId)];
    if (!message || message.is_user || message.is_system) {
        return;
    }
    clearTimeout(state.prefetchTimer);
    state.prefetchTimer = setTimeout(startPrefetch, 300);
}

function onChatChanged() {
    clearTimeout(state.prefetchTimer);
    if (state.prefetch) {
        state.prefetch.controller.abort();
        state.prefetch = null;
    }
}

function currentPrefetch() {
    const p = state.prefetch;
    return p && p.chatId === currentChatId() ? p : null;
}

const SAVE_FORMATS = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/bmp': 'bmp' };

async function sniffFormat(blob) {
    const b = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
    const ascii = (start, end) => String.fromCharCode(...b.slice(start, end));
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) {
        return 'jpg';
    }
    if (b[0] === 0x89 && ascii(1, 4) === 'PNG') {
        return 'png';
    }
    if (ascii(0, 4) === 'GIF8') {
        return 'gif';
    }
    if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
        return 'webp';
    }
    if (ascii(0, 2) === 'BM') {
        return 'bmp';
    }
    return '';
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

const ACCEPT_VARIANTS = [
    { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8', 'Upgrade-Insecure-Requests': '1' },
    { 'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' },
];

function fetcherLink(url) {
    const s = settings();
    const base = String(s.fetcherUrl || '').trim().replace(/\/+$/, '');
    if (!base) {
        return '';
    }
    const root = /^https?:\/\//i.test(base) ? base : `https://${base}`;
    return `${root}/?key=${encodeURIComponent(s.fetcherKey || '')}&url=${encodeURIComponent(url)}`;
}

async function saveImage(url) {
    const errors = [];
    const viaFetcher = fetcherLink(url);
    if (viaFetcher) {
        try {
            return await saveImageOnce(viaFetcher, {}, 'fetcher');
        } catch (error) {
            errors.push(`Cloudflare fetcher: ${error?.message || error}`);
        }
    }
    for (const variant of ACCEPT_VARIANTS) {
        try {
            return await saveImageOnce(proxyUrl(url), variant, 'proxy');
        } catch (error) {
            errors.push(String(error?.message || error));
            if (!/web page instead/.test(String(error?.message))) {
                break;
            }
        }
    }
    throw new Error(errors.join(' | '));
}

async function saveImageOnce(downloadUrl, variant, route) {
    const headers = ctx().getRequestHeaders();
    let response;
    try {
        response = route === 'fetcher'
            ? await fetch(downloadUrl)
            : await fetch(downloadUrl, { headers: { ...headers, ...variant } });
    } catch (error) {
        throw new Error(`Could not download the picture: ${error?.message || error}`);
    }
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        if (/CORS proxy is disabled/i.test(text)) {
            throw new Error('Saving pictures needs enableCorsProxy: true in SillyTavern\'s config.yaml.');
        }
        if (route === 'fetcher') {
            throw new Error(`${response.status} ${text.slice(0, 200)}`);
        }
        throw new Error(`The image server refused the download (${response.status}).`);
    }
    const blob = await response.blob();
    const type = (response.headers.get('content-type') || blob.type || '').split(';')[0].trim().toLowerCase();
    const format = SAVE_FORMATS[type] || await sniffFormat(blob);
    if (!format) {
        const start = (await blob.slice(0, 4000).text()).trim();
        if (start.startsWith('<')) {
            const title = (start.match(/<title[^>]*>([^<]*)/i)?.[1] || '').trim();
            const text = start.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
            throw new Error(`The image server sent a web page instead of the picture. Page title: "${title || 'none'}". Text: "${text}"`);
        }
        throw new Error(`The downloaded file is not a supported picture (${type || 'unknown type'}).`);
    }
    const image = await blobToBase64(blob);
    const upload = await fetch('/api/images/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image, format, ch_name: 'imagesearch', filename: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }),
    });
    if (!upload.ok) {
        throw new Error(`SillyTavern could not save the picture (${upload.status}).`);
    }
    const data = await upload.json();
    return `/${String(data.path).replace(/\\/g, '/').replace(/^\/+/, '')}`;
}

async function saveBest(item) {
    const lines = [];
    for (const url of [item.img, ...(item.alts || [])]) {
        try {
            const src = await saveImage(url);
            return { src, lines };
        } catch (error) {
            lines.push(`Save failed for ${url}: ${error?.message || error}`);
        }
    }
    return { src: '', lines };
}

function cleanAlt(text) {
    return String(text || '').replace(/[[\]()]/g, '').replace(/_/g, ' ').trim();
}

function markdownFor(url, tags) {
    const safeUrl = url.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/ /g, '%20');
    return `![${cleanAlt(tags.join(', '))}](${safeUrl})`;
}

function insertIntoChatBox(text) {
    const box = document.getElementById('send_textarea');
    if (!(box instanceof HTMLTextAreaElement)) {
        navigator.clipboard?.writeText(text).catch(() => {});
        toastr.info('Chat box not found, the picture link was copied to the clipboard.', 'Image Search');
        return;
    }
    const start = box.selectionStart ?? box.value.length;
    const end = box.selectionEnd ?? start;
    const before = box.value.slice(0, start);
    const after = box.value.slice(end);
    const pre = before && !before.endsWith('\n') ? '\n' : '';
    const post = after && !after.startsWith('\n') ? '\n' : '';
    box.value = before + pre + text + post + after;
    const caret = (before + pre + text + post).length;
    box.focus();
    box.setSelectionRange(caret, caret);
    box.dispatchEvent(new Event('input', { bubbles: true }));
}

async function onMessageSent(messageId) {
    const s = settings();
    if (!s.enabled || !s.attachOnSend) {
        return;
    }
    const c = ctx();
    const message = c.chat[Number(messageId)];
    if (!message || !message.is_user || typeof message.mes !== 'string') {
        return;
    }
    const found = [...message.mes.matchAll(LOCAL_IMAGE_MD)];
    if (!found.length) {
        return;
    }
    if (!message.extra || typeof message.extra !== 'object') {
        message.extra = {};
    }
    if (!Array.isArray(message.extra.media)) {
        message.extra.media = [];
    }
    for (const match of found) {
        const url = match[2];
        if (!message.extra.media.some(item => item.url === url)) {
            message.extra.media.push({ type: 'image', url, title: match[1], source: 'upload' });
        }
    }
    message.mes = message.mes.replace(LOCAL_IMAGE_MD, '').replace(/\n{3,}/g, '\n\n').trim();
    await c.saveChat();
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

function setThumbSource(img, item) {
    const sources = [item.thumb, fetcherLink(item.thumb), proxyUrl(item.thumb)].filter(Boolean);
    let index = 0;
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
        index++;
        if (index < sources.length) {
            img.src = sources[index];
        } else {
            img.onerror = null;
            img.closest('.stis-cell')?.classList.add('stis-broken');
        }
    };
    img.src = sources[0];
}

function setPreviewSource(img, item) {
    const sources = [item.img, fetcherLink(item.img), proxyUrl(item.img), item.thumb].filter(Boolean);
    let index = 0;
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
        index++;
        if (index < sources.length) {
            img.src = sources[index];
        } else {
            img.onerror = null;
        }
    };
    img.src = sources[0];
}

async function openPicker(initialTags = null) {
    const s = settings();
    const c = ctx();
    if (!s.enabled || state.pickerOpen) {
        return;
    }
    const entries = siteEntries();
    if (!entries.length) {
        toastr.warning('Add at least one image board in the Image Search settings.', 'Image Search');
        return;
    }
    state.pickerOpen = true;

    const ui = {
        root: el('div', 'stis-picker'),
        top: el('div', 'stis-top'),
        site: el('select', 'text_pole stis-site'),
        chips: el('div', 'stis-chips'),
        input: el('input', 'text_pole stis-input'),
        suggest: el('div', 'menu_button stis-btn'),
        search: el('div', 'menu_button stis-btn'),
        status: el('div', 'stis-status'),
        grid: el('div', 'stis-grid'),
        sentinel: el('div', 'stis-sentinel'),
        preview: el('div', 'stis-preview'),
    };
    ui.input.type = 'text';
    ui.input.placeholder = 'add tag, Enter';
    ui.suggest.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
    ui.suggest.title = 'Ask the tag model again';
    ui.search.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    ui.search.title = 'Search';
    for (const entry of entries) {
        const option = el('option', '', entry.domain);
        option.value = entry.domain;
        ui.site.appendChild(option);
    }
    ui.site.value = activeDomain();
    ui.chips.appendChild(ui.input);
    ui.top.append(ui.site, ui.chips, ui.suggest, ui.search);
    ui.grid.appendChild(ui.sentinel);
    ui.preview.hidden = true;
    ui.root.append(ui.top, ui.status, ui.grid, ui.preview);

    let tags = [];
    let edited = false;
    let browse = null;
    let rendered = 0;
    let searchTimer = null;
    let closed = false;
    let busy = false;
    let dragFrom = -1;

    const setStatus = (text, kind = '') => {
        ui.status.textContent = text;
        ui.status.className = `stis-status ${kind}`;
    };

    let shownCap = 0;
    const renderChips = () => {
        ui.chips.querySelectorAll('.stis-chip').forEach(chip => chip.remove());
        const cap = capFor(ui.site.value);
        shownCap = cap;
        tags.forEach((tag, index) => {
            const chip = el('span', 'stis-chip');
            chip.draggable = true;
            if (cap && index >= cap) {
                chip.classList.add('stis-local');
                chip.title = 'Checked by the extension (the site only takes the first tags)';
            } else {
                chip.title = 'Sent to the site. Drag to reorder, double-click to move first.';
            }
            chip.appendChild(el('span', '', tag));
            const remove = el('i', 'fa-solid fa-xmark stis-chip-x');
            remove.addEventListener('click', () => {
                tags.splice(index, 1);
                tagsChanged();
            });
            chip.appendChild(remove);
            chip.addEventListener('dragstart', event => {
                dragFrom = index;
                event.dataTransfer?.setData('text/plain', tag);
            });
            chip.addEventListener('dblclick', () => {
                if (index > 0) {
                    tags.unshift(...tags.splice(index, 1));
                    tagsChanged();
                }
            });
            chip.addEventListener('dragover', event => event.preventDefault());
            chip.addEventListener('drop', event => {
                event.preventDefault();
                if (dragFrom < 0 || dragFrom === index) {
                    return;
                }
                const [moved] = tags.splice(dragFrom, 1);
                tags.splice(index, 0, moved);
                dragFrom = -1;
                tagsChanged();
            });
            ui.chips.insertBefore(chip, ui.input);
        });
    };

    const setTags = (list, fromUser) => {
        const seen = new Set();
        const removed = [];
        tags = list.map(normalizeTag).filter(tag => {
            if (!tag || seen.has(tag)) {
                return false;
            }
            seen.add(tag);
            if (isBlockedQueryTag(tag)) {
                removed.push(tag);
                return false;
            }
            return true;
        });
        if (fromUser) {
            edited = true;
        }
        if (removed.length) {
            toastr.info(`Not searchable: ${removed.join(', ')}`, 'Image Search');
        }
        renderChips();
    };

    const tagsChanged = () => {
        edited = true;
        renderChips();
        clearTimeout(searchTimer);
        searchTimer = setTimeout(runSearch, 700);
    };

    const commitInput = () => {
        const parts = ui.input.value.split(',').map(normalizeTag).filter(Boolean);
        ui.input.value = '';
        if (!parts.length) {
            return false;
        }
        setTags([...tags, ...parts], true);
        tagsChanged();
        return true;
    };

    const renderNew = () => {
        if (!browse) {
            return;
        }
        for (const item of browse.items.slice(rendered)) {
            const cell = el('div', 'stis-cell');
            const img = el('img');
            img.loading = 'lazy';
            img.alt = '';
            setThumbSource(img, item);
            cell.appendChild(img);
            cell.addEventListener('click', () => showPreview(item));
            ui.grid.insertBefore(cell, ui.sentinel);
        }
        rendered = browse.items.length;
    };

    const describe = () => {
        if (!browse) {
            return;
        }
        if (browse.error) {
            setStatus(browse.error, 'stis-error');
        } else if (!browse.items.length && browse.done) {
            setStatus(tags.length > 1 ? 'No pictures. Try removing a tag.' : 'No pictures for these tags.');
        } else {
            setStatus(`${browse.items.length}${browse.done ? '' : '+'} picture(s) on ${browse.domain}`);
        }
    };

    const pump = async () => {
        if (!browse || closed) {
            return;
        }
        const current = browse;
        if (!current.loading && !current.done) {
            setStatus('Searching…');
        }
        try {
            await loadMore(current);
        } catch {
        }
        if (closed || current !== browse) {
            return;
        }
        renderNew();
        describe();
        if (capFor(current.domain) !== shownCap) {
            renderChips();
        }
        const rect = ui.sentinel.getBoundingClientRect();
        const box = ui.grid.getBoundingClientRect();
        if (!current.done && rect.top < box.bottom + 200) {
            pump();
        }
    };

    const useBrowse = next => {
        browse = next;
        rendered = 0;
        ui.grid.querySelectorAll('.stis-cell').forEach(cell => cell.remove());
        ui.grid.scrollTop = 0;
        renderNew();
        pump();
    };

    function runSearch() {
        clearTimeout(searchTimer);
        if (closed) {
            return;
        }
        s.lastTags = [...tags];
        s.lastSite = ui.site.value;
        save();
        if (!tags.length) {
            browse = null;
            ui.grid.querySelectorAll('.stis-cell').forEach(cell => cell.remove());
            setStatus('Add a tag to search.');
            return;
        }
        const pre = currentPrefetch();
        if (pre?.browse && pre.browse.domain === ui.site.value && sameTags(pre.browse.tags, tags) && !pre.browse.error) {
            useBrowse(pre.browse);
            return;
        }
        if (browse && browse.domain === ui.site.value && sameTags(browse.tags, tags) && !browse.error) {
            return;
        }
        useBrowse(createBrowse(ui.site.value, tags));
    }

    const adoptSuggestion = pre => {
        if (closed || edited || !pre?.tags) {
            return;
        }
        setTags(pre.tags, false);
        runSearch();
    };

    const waitForSuggestion = pre => {
        setStatus('Suggesting tags…');
        pre.promise.then(() => {
            if (closed || state.prefetch !== pre) {
                return;
            }
            if (pre.error) {
                setStatus(pre.error, 'stis-error');
                return;
            }
            if (edited) {
                describe();
                return;
            }
            adoptSuggestion(pre);
        });
    };

    const askAgain = () => {
        if (!s.tagProfile) {
            setStatus('Choose a tag profile in the Image Search settings first.', 'stis-error');
            return;
        }
        edited = false;
        const pre = startPrefetch();
        if (pre) {
            waitForSuggestion(pre);
        }
    };

    function showPreview(item) {
        ui.preview.innerHTML = '';
        const img = el('img', 'stis-preview-img');
        setPreviewSource(img, item);
        const bar = el('div', 'stis-preview-bar');
        const back = el('div', 'menu_button', 'Back');
        const use = el('div', 'menu_button stis-use', 'Use this');
        const link = el('a', 'stis-post-link', 'Open post');
        link.href = item.page;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        back.addEventListener('click', () => {
            ui.preview.hidden = true;
        });
        use.addEventListener('click', () => pick(item, use));
        bar.append(back, link, use);
        ui.preview.append(img, bar);
        ui.preview.hidden = false;
    }

    async function pick(item, button) {
        if (busy) {
            return;
        }
        busy = true;
        button.textContent = 'Saving…';
        let url = item.img;
        if (s.saveLocal) {
            const { src, lines } = await saveBest(item);
            if (src) {
                url = src;
            } else {
                console.warn('[Image Search] save failed', lines);
                toastr.warning(`${lines[0] || 'Saving failed.'} Using the direct link instead, so the AI will not see this picture.`, 'Image Search');
            }
        }
        const text = markdownFor(url, tags);
        await popup.completeCancelled();
        setTimeout(() => insertIntoChatBox(text), 0);
    }

    ui.input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            if (!commitInput()) {
                runSearch();
            }
        } else if (event.key === ',') {
            event.preventDefault();
            commitInput();
        } else if (event.key === 'Backspace' && !ui.input.value && tags.length) {
            tags.pop();
            tagsChanged();
        }
    });
    ui.input.addEventListener('paste', () => setTimeout(() => {
        if (ui.input.value.includes(',')) {
            commitInput();
        }
    }, 0));
    ui.input.addEventListener('blur', () => {
        if (ui.input.value.trim()) {
            commitInput();
        }
    });
    ui.chips.addEventListener('click', event => {
        if (event.target === ui.chips) {
            ui.input.focus();
        }
    });
    ui.search.addEventListener('click', () => {
        commitInput();
        runSearch();
    });
    ui.suggest.addEventListener('click', askAgain);
    ui.site.addEventListener('change', () => {
        renderChips();
        runSearch();
    });

    const observer = new IntersectionObserver(found => {
        if (found.some(entry => entry.isIntersecting)) {
            pump();
        }
    }, { root: ui.grid, rootMargin: '200px' });

    const popup = new c.Popup(ui.root, c.POPUP_TYPE.DISPLAY, '', {
        large: true,
        wide: true,
        animation: 'fast',
        onClose: () => {
            closed = true;
            state.pickerOpen = false;
            observer.disconnect();
            clearTimeout(searchTimer);
        },
    });
    popup.show();
    observer.observe(ui.sentinel);

    if (Array.isArray(initialTags) && initialTags.length) {
        setTags(initialTags, true);
        runSearch();
        return;
    }
    let pre = currentPrefetch();
    if (pre?.tags) {
        setTags(pre.tags, false);
        runSearch();
        return;
    }
    setTags(s.lastTags || [], false);
    runSearch();
    if (!pre && s.tagProfile) {
        pre = startPrefetch();
    }
    if (pre) {
        if (pre.error) {
            setStatus(pre.error, 'stis-error');
        } else {
            waitForSuggestion(pre);
        }
    } else if (!s.tagProfile) {
        setStatus(tags.length ? 'Last tags. Choose a tag profile in settings to get suggestions.' : 'Type some tags, or choose a tag profile in settings to get suggestions.');
    }
}

function addButtons() {
    if (!document.getElementById('st_imagesearch_button')) {
        const left = document.getElementById('leftSendForm');
        if (left) {
            const button = el('div', 'fa-solid fa-images interactable');
            button.id = 'st_imagesearch_button';
            button.title = 'Image Search';
            button.tabIndex = 0;
            button.addEventListener('click', () => openPicker());
            left.appendChild(button);
        }
    }
    if (!document.getElementById('st_imagesearch_wand')) {
        const menu = document.getElementById('extensionsMenu');
        if (menu) {
            const item = el('div', 'list-group-item flex-container flexGap5');
            item.id = 'st_imagesearch_wand';
            item.appendChild(el('div', 'fa-solid fa-images extensionsMenuExtensionButton'));
            item.appendChild(el('span', '', 'Image Search'));
            item.addEventListener('click', () => openPicker());
            menu.appendChild(item);
        }
    }
    updateButtons();
}

function updateButtons() {
    const show = settings().enabled;
    ['st_imagesearch_button', 'st_imagesearch_wand'].forEach(id => {
        const node = document.getElementById(id);
        if (node) {
            node.style.display = show ? '' : 'none';
        }
    });
}

function registerCommand() {
    const c = ctx();
    if (!c.SlashCommandParser || !c.SlashCommand) {
        return;
    }
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'imgsearch',
        callback: (_args, value) => {
            const list = normalizeTagList(String(value || ''));
            openPicker(list.length ? list : null);
            return '';
        },
        unnamedArgumentList: c.SlashCommandArgument ? [c.SlashCommandArgument.fromProps({
            description: 'tags, comma-separated',
            typeList: [c.ARGUMENT_TYPE.STRING],
            isRequired: false,
        })] : [],
        helpString: 'Opens the Image Search picker. Optional tags, comma-separated, e.g. /imgsearch red_fox, snow',
    }));
}

function buildSettings() {
    const s = settings();
    const html = `
    <div id="st_imagesearch_settings" class="extension_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Image Search v${VERSION}</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_enabled"> <span>Enabled</span></label>
                <div>Image boards (one per line)</div>
                <textarea id="st_imagesearch_sites" class="text_pole"></textarea>
                <small>Booru sites only (Gelbooru, Danbooru, e621, Moebooru, Philomena). If a site needs a login key, add it after the domain, e.g. <code>gelbooru.com api_key=XXX&amp;user_id=123</code></small>
                <div>Tag profile (connection profile used to suggest tags)</div>
                <select id="st_imagesearch_profile" class="text_pole"></select>
                <small id="st_imagesearch_profile_note"></small>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_prefetch"> <span>Prepare tags and pictures after each AI reply</span></label>
                <div>Allowed ratings</div>
                <div class="st-imagesearch-row">
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_general"> <span>General</span></label>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_sensitive"> <span>Sensitive</span></label>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_questionable"> <span>Questionable</span></label>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_explicit"> <span>Explicit</span></label>
                </div>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_savelocal"> <span>Save picked pictures into SillyTavern (needs CORS proxy or the fetcher)</span></label>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_attach"> <span>Attach saved pictures when sending, so vision models can see them</span></label>
                <details>
                    <summary>Advanced</summary>
                    <div class="st-imagesearch-row"><span>Max suggested tags</span><input type="number" min="1" max="20" id="st_imagesearch_max" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Messages sent to the tag model</span><input type="number" min="1" max="10" id="st_imagesearch_ctx_count" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Characters per message</span><input type="number" min="100" max="4000" id="st_imagesearch_ctx_chars" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Tag reply token limit</span><input type="number" min="16" max="4000" id="st_imagesearch_tokens" class="text_pole"></div>
                    <div>Tag prompt ({{max}} and {{context}} are filled in)</div>
                    <textarea id="st_imagesearch_tag_prompt" class="text_pole"></textarea>
                    <div id="st_imagesearch_prompt_reset" class="menu_button">Reset prompt</div>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_proxy"> <span>Always route through SillyTavern proxy</span></label>
                    <div class="st-imagesearch-row"><span>Image fetcher URL (Cloudflare)</span><input type="text" id="st_imagesearch_fetcher_url" class="text_pole" placeholder="https://imgfetch.yourname.workers.dev"></div>
                    <div class="st-imagesearch-row"><span>Image fetcher key</span><input type="password" id="st_imagesearch_fetcher_key" class="text_pole"></div>
                    <div>Extra excluded tags (one per line)</div>
                    <textarea id="st_imagesearch_extra_excluded" class="text_pole"></textarea>
                    <div>Tag cleanup list (from repo)</div>
                    <textarea id="st_imagesearch_cleanup_view" class="text_pole" readonly></textarea>
                    <div class="st-imagesearch-row"><span id="st_imagesearch_engines"></span><div id="st_imagesearch_redetect" class="menu_button">Re-detect sites</div></div>
                </details>
                <hr>
                <div id="st_imagesearch_open" class="menu_button">Open picker</div>
            </div>
        </div>
    </div>`;
    const container = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    container.insertAdjacentHTML('beforeend', html);

    const showEngines = () => {
        const known = Object.entries(s.engines || {});
        document.getElementById('st_imagesearch_engines').textContent = known.length ? known.map(([d, e]) => `${d}: ${NOT_BOARD.has(e) ? 'not an image board' : e}`).join(', ') : 'No sites detected yet';
    };
    const bind = (id, key, kind = 'value', after = null) => {
        const node = document.getElementById(id);
        if (kind === 'checked') {
            node.checked = !!s[key];
        } else {
            node.value = s[key] ?? '';
        }
        node.addEventListener(kind === 'checked' ? 'change' : 'input', () => {
            s[key] = kind === 'checked' ? node.checked : kind === 'number' ? Number(node.value) : node.value;
            save();
            if (after) {
                after();
            }
        });
    };
    bind('st_imagesearch_enabled', 'enabled', 'checked', () => {
        updateButtons();
        if (!s.enabled) {
            onChatChanged();
        }
    });
    bind('st_imagesearch_sites', 'sites', 'value', () => {
        s.engines = {};
        showEngines();
    });
    bind('st_imagesearch_prefetch', 'prefetch', 'checked');
    RATINGS.forEach(rating => {
        const node = document.getElementById(`st_imagesearch_r_${rating}`);
        node.checked = !!s.ratings[rating];
        node.addEventListener('change', () => {
            s.ratings[rating] = node.checked;
            save();
            onChatChanged();
        });
    });
    bind('st_imagesearch_savelocal', 'saveLocal', 'checked');
    bind('st_imagesearch_attach', 'attachOnSend', 'checked');
    bind('st_imagesearch_max', 'maxSuggested', 'number');
    bind('st_imagesearch_ctx_count', 'contextMessages', 'number');
    bind('st_imagesearch_ctx_chars', 'contextChars', 'number');
    bind('st_imagesearch_tokens', 'tagMaxTokens', 'number');
    bind('st_imagesearch_tag_prompt', 'tagPrompt');
    bind('st_imagesearch_proxy', 'useProxy', 'checked');
    bind('st_imagesearch_fetcher_url', 'fetcherUrl');
    bind('st_imagesearch_fetcher_key', 'fetcherKey');
    bind('st_imagesearch_extra_excluded', 'extraExcluded');
    showEngines();
    document.getElementById('st_imagesearch_prompt_reset').addEventListener('click', () => {
        s.tagPrompt = DEFAULT_TAG_PROMPT;
        document.getElementById('st_imagesearch_tag_prompt').value = DEFAULT_TAG_PROMPT;
        save();
    });
    document.getElementById('st_imagesearch_redetect').addEventListener('click', () => {
        s.engines = {};
        save();
        showEngines();
        toastr.info('Sites will be re-detected on the next search.', 'Image Search');
    });
    document.getElementById('st_imagesearch_open').addEventListener('click', async () => {
        await openPicker();
        showEngines();
    });

    const note = document.getElementById('st_imagesearch_profile_note');
    try {
        ctx().ConnectionManagerRequestService.handleDropdown('#st_imagesearch_profile', s.tagProfile, profile => {
            s.tagProfile = profile?.id || '';
            save();
            onChatChanged();
        });
        note.textContent = 'Make a profile with a fast model that does not think, e.g. DeepSeek V4.1 Flash (standard).';
    } catch (error) {
        note.textContent = `Tag suggestions unavailable: ${error?.message || error}. Enable the Connection Profiles extension.`;
    }
}

jQuery(() => {
    const c = ctx();
    applyReferrerPolicy();
    settings();
    c.setExtensionPrompt?.(PROMPT_KEY, '', 1, 0, false, 0);
    buildSettings();
    refreshCleanup();
    setInterval(refreshCleanup, CLEANUP_REFRESH_MS);
    registerCommand();
    addButtons();
    c.eventSource.on(c.eventTypes.APP_READY, addButtons);
    c.eventSource.on(c.eventTypes.MESSAGE_RECEIVED, onReplyFinished);
    c.eventSource.on(c.eventTypes.MESSAGE_SENT, onMessageSent);
    c.eventSource.on(c.eventTypes.CHAT_CHANGED, onChatChanged);
});
