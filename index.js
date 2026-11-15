const MODULE = 'st_imagesearch';
const PROMPT_KEY = 'st_imagesearch_instruction';
const VERSION = '2.4.0';
const BATCH = 24;
const MAX_PAGE_CALLS = 4;
const LIBRARY_FILE = 'imagesearch-library.json';
const PIC_TAG = /\[pic:\s*([a-z0-9]{4,12})\s*\]/gi;
const DEFAULT_SHOW_PROMPT = 'Saved pictures you can show in this story. When one clearly fits the moment, write its tag, for example [pic:ab12cd], on its own line where it belongs. At most one per reply, only when it adds to the scene, and never mention the tag itself. The user sees the picture, not the tag.';
const STOP_WORDS = new Set(['the', 'and', 'with', 'her', 'his', 'their', 'she', 'him', 'them', 'they', 'you', 'your', 'are', 'was', 'were', 'has', 'have', 'had', 'this', 'that', 'there', 'then', 'than', 'from', 'into', 'onto', 'over', 'under', 'out', 'for', 'not', 'but', 'its', 'who', 'what', 'when', 'where', 'which', 'while', 'some', 'very', 'just', 'like', 'one', 'two', 'picture', 'shows', 'showing', 'shown', 'image', 'wearing', 'looks', 'look', 'seems', 'standing', 'sitting', 'background']);
const LOCAL_IMAGE_MD = /!\[([^\]\n]*)\]\((\/user\/images\/imagesearch\/[^)\s]+)\)/g;
const ENGINE_ORDER = ['gelbooru', 'danbooru', 'moebooru', 'philomena'];
const NOT_BOARD = new Set(['web', 'web-unchecked', 'none']);
const KNOWN_WEB = /(^|\.)(wikimedia\.org|wikipedia\.org|pexels\.com|unsplash\.com|artstation\.com|flickr\.com|deviantart\.com|pinterest\.[a-z.]+|pixabay\.com|imgur\.com|reddit\.com)$/;
const DROP_TAGS = new Set(['night', 'day', 'daytime', 'nighttime', 'dawn', 'dusk', 'sunset', 'sunrise', 'evening', 'morning', 'afternoon', 'twilight', 'midnight', 'night_sky', 'starry_sky', 'indoors', 'outdoors', 'sunlight', 'moonlight', 'rain', 'snowing', 'cloudy_sky', 'blue_sky', 'scenery', 'forest', 'woods', 'city', 'cityscape', 'street', 'alley', 'beach', 'ocean', 'sea', 'river', 'lake', 'mountain', 'mountains', 'field', 'meadow', 'park', 'garden', 'desert', 'cave', 'village', 'town', 'school', 'classroom', 'library', 'bedroom', 'room', 'kitchen', 'bathroom', 'office', 'cafe', 'tavern', 'inn', 'shrine', 'temple', 'ruins', 'dungeon', 'castle', 'snow', 'grass', 'water', 'sky', 'outdoor', 'indoor', 'urban', 'city_street', 'rooftop', 'building', 'house', 'road', 'standing', 'sitting', 'walking', 'running', 'lying', 'kneeling', 'squatting', 'crouching', 'leaning', 'leaning_forward', 'jumping', 'fighting', 'holding', 'talking', 'walking_away', 'looking_at_viewer', 'looking_away', 'looking_back', 'looking_down', 'looking_up', 'arms_crossed', 'hands_on_hips', 'from_side', 'from_behind', 'from_above', 'from_below', 'full_body', 'upper_body', 'cowboy_shot', 'portrait', 'close-up']);
const TAG_SYNONYMS = { male: '1boy', man: '1boy', boy: '1boy', guy: '1boy', female: '1girl', woman: '1girl', girl: '1girl', lady: '1girl', men: 'multiple_boys', women: 'multiple_girls', two_girls: '2girls', two_boys: '2boys', blond: 'blonde_hair', blonde: 'blonde_hair', blond_hair: 'blonde_hair', redhead: 'red_hair', ginger_hair: 'orange_hair', dark_skinned: 'dark_skin', pale: 'pale_skin', elf_ears: 'pointy_ears' };

const DEFAULT_TAG_PROMPT = 'You choose image-board (booru) tags to find pictures that look like {{char}} in the latest part of a roleplay. If {{char}} is not in the scene, tag the person the latest message is about. The user scrolls the results and picks one, so use broad tags for what makes the character recognizable at a glance, not small details. Reply with up to {{max}} tags, most important first:\n1. how many and gender: 1girl, 1boy, 2girls (never male, female, man or woman)\n2. species, only if not human: elf, orc, demon_girl, wolf\n3. body type and age look: muscular_male, fat, skinny, old_man, mature_female, thick_thighs\n4. skin color: dark_skin, pale_skin\n5. hair color, or bald\n6. the most striking features: beard, scar, tattoo, horns, wings, tail, pointy_ears\n7. outfit type: armor, robe, suit, kimono\nDo not tag hair length or style, eye color, small accessories, expression, pose or action, setting, background, time, weather or lighting. Never use names from the story. Only common booru tags: lowercase, underscores inside a tag, separated by commas. Reply with the tags only.\n\n{{context}}';
const OLD_TAG_PROMPTS = ['Below is the latest part of a roleplay. Reply with up to {{max}} image-board (booru) tags describing who or what is visible right now: character type, hair, eyes, clothing, expression, pose, creatures, objects. Most important tag first. Lowercase, underscores inside multi-word tags (black_hair, cat_ears), separated by commas. No locations, backgrounds, time of day, weather or lighting. Reply with the tags only, nothing else.\n\n{{context}}', 'You choose image-board (booru) tags to find a picture of {{char}} as they appear in the latest part of a roleplay. If {{char}} is not in the scene, tag the person the latest message is about. Reply with up to {{max}} tags, most important first, in this order:\n1. how many and gender: 1girl, 1boy, 2girls (never male, female, man or woman)\n2. species, only if not human: elf, demon_girl, wolf, dragon\n3. hair color, then hair length or style: black_hair, long_hair, ponytail\n4. eye color: blue_eyes\n5. skin color: dark_skin, pale_skin, tan\n6. clothing and accessories: armor, hooded_cloak, glasses\n7. body features: cat_ears, horns, tail, wings, scar, beard\nNever use names of characters, places or anything else from the story. Never describe pose or action (sitting, walking, standing, holding), setting or background (outdoors, urban, forest, room), time, weather or lighting. Only use common booru tags: lowercase, underscores inside a tag, separated by commas. Reply with the tags only.\n\n{{context}}'];
const DEFAULT_VISION_PROMPT = 'The user of a roleplay is about to show this picture in the story. In 2 to 4 sentences, describe what it shows so a writer who cannot see it can refer to it: who or what is in it, their build, skin, hair, clothing, striking features, what they are doing and the mood. Describe only what is visible. Do not invent names or story. The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nTags: {{tags}}';
const META_TAG = /^(highres|absurdres|lowres|incredibly_absurdres|tagme|official_art|commentary|.*_commentary|commentary_.*|translat.*|.*_request|bad_.*|artist_name|signature|watermark|web_address|md5_mismatch|dated|jpeg_artifacts|third-party_edit|.*_username|copyright_name|character_name|.*_id|.*_background|image_sample|resized|duplicate|revision|variant_set|.*_available|.*_text|text)$/;
const DETAIL_TAGS = new Set(['long_hair', 'short_hair', 'medium_hair', 'very_long_hair', 'absurdly_long_hair', 'ponytail', 'high_ponytail', 'twintails', 'braid', 'single_braid', 'twin_braids', 'bangs', 'blunt_bangs', 'sidelocks', 'hair_between_eyes', 'ahoge', 'hair_ornament', 'hair_ribbon', 'hairband', 'hair_bow', 'hair_over_one_eye', 'smile', 'grin', 'smirk', 'open_mouth', 'closed_mouth', 'blush', 'frown', 'angry', 'serious', 'expressionless', 'teeth', 'closed_eyes', 'half-closed_eyes', 'earrings', 'necklace', 'jewelry', 'ring', 'bracelet', 'choker']);
const EYE_COLOR = /^(aqua|black|blue|brown|green|grey|gray|orange|pink|purple|red|white|yellow|amber|gold|golden|silver|violet|light_blue|dark_blue|light_brown|light_green|multicolored)_eyes$/;

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
    maxSuggested: 6,
    minTagPosts: 50,
    suggestBlacklist: 'human',
    contextMessages: 3,
    contextChars: 500,
    tagMaxTokens: 100,
    describe: true,
    visionProfile: '',
    visionPrompt: DEFAULT_VISION_PROMPT,
    visionMaxTokens: 300,
    describeWaitSec: 15,
    keepLibrary: true,
    aiShow: true,
    aiShowCount: 6,
    aiShowDepth: 1,
    showPrompt: DEFAULT_SHOW_PROMPT,
    tagPrompt: DEFAULT_TAG_PROMPT,
    debug: false,
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
const tagCounts = new Map();
const descriptions = new Map();
const noTagLookup = new Set();

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
    if ((Number(s.schema) || 0) < 2) {
        if (s.maxSuggested === 8) {
            s.maxSuggested = 6;
        }
        s.schema = 2;
    }
    if (OLD_TAG_PROMPTS.includes(s.tagPrompt)) {
        s.tagPrompt = DEFAULT_TAG_PROMPT;
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

function suggestBlacklist() {
    return new Set(normalizeTagList(settings().suggestBlacklist));
}

function addToSuggestBlacklist(tag) {
    const s = settings();
    const list = normalizeTagList(s.suggestBlacklist);
    if (!list.includes(tag)) {
        list.push(tag);
        s.suggestBlacklist = list.join('\n');
        save();
    }
    const box = document.getElementById('st_imagesearch_blacklist');
    if (box) {
        box.value = s.suggestBlacklist;
    }
}

function isDetailTag(tag) {
    return DETAIL_TAGS.has(tag) || EYE_COLOR.test(tag);
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
        siteUrl: (origin, tags) => `${origin}/index.php?page=post&s=list&tags=${encodeURIComponent(tags.join(' '))}`,
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
        siteUrl: (origin, tags) => `${origin}/posts?tags=${encodeURIComponent(tags.join(' '))}`,
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
        siteUrl: (origin, tags) => `${origin}/posts?tags=${encodeURIComponent(tags.join(' '))}`,
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
        siteUrl: (origin, tags) => `${origin}/post?tags=${encodeURIComponent(tags.join(' '))}`,
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
        siteUrl: (origin, tags) => `${origin}/search?q=${encodeURIComponent(tags.length ? tags.join(', ') : '*')}&sf=score&sd=desc`,
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

function postsToItems(engineName, posts, origin, ratings, localTags, stats) {
    const engine = ENGINES[engineName];
    const items = [];
    for (const post of posts) {
        if (!post || typeof post !== 'object') {
            continue;
        }
        const rating = engine.rating(post) || 'explicit';
        if (!ratings[rating]) {
            stats.rating++;
            continue;
        }
        const tags = engine.postTags(post).map(tag => tag.toLowerCase());
        if (tags.some(tag => BLOCKED_TAGS.has(tag) || EXCLUDED_TAGS.has(tag) || isCleanupTag(tag))) {
            stats.excluded++;
            continue;
        }
        if (localTags.length) {
            const have = new Set(tags);
            if (!localTags.every(tag => have.has(tag))) {
                stats.local++;
                continue;
            }
        }
        const img = engine.image(post, origin);
        if (!isStillImage(img)) {
            stats.notImage++;
            continue;
        }
        const full = engine.full(post, origin);
        const thumb = engine.thumb(post, origin);
        const alts = [full, thumb].filter(alt => alt && alt !== img && isStillImage(alt));
        items.push({ img, thumb: thumb || img, alts, page: engine.postUrl(post, origin), tags });
    }
    return items;
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
        const stats = { rating: 0, excluded: 0, local: 0, notImage: 0 };
        const items = postsToItems(engineName, posts, origin, s.ratings, localTags, stats);
        const debug = {
            page,
            apiUrl: engine.url(origin, query, entry.extra, page),
            siteUrl: engine.siteUrl(origin, engine.tags([...siteTags, ...localTags], s.ratings, noOrder)),
            localTags,
            received: posts.length,
            kept: items.length,
            ...stats,
        };
        return { items, done: posts.length < engine.pageSize, debug };
    }
    return { items: [], done: true, debug: null };
}

function createBrowse(domain, tags) {
    return { domain, tags: [...tags], page: 0, items: [], seen: new Set(), done: false, loading: null, error: '', engine: '', pages: [] };
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
            const { items, done, debug } = await fetchPage(entry, engineName, browse.tags, browse.page);
            if (debug) {
                browse.pages.push(debug);
            }
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

function maxSuggested() {
    return Math.max(1, Number(settings().maxSuggested) || 8);
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
    const avoid = [...suggestBlacklist()].slice(0, 40);
    const context = (avoid.length ? `Never use these tags: ${avoid.join(', ')}.\n\n` : '') + lines.join('\n');
    return String(s.tagPrompt || DEFAULT_TAG_PROMPT)
        .replace(/\{\{max\}\}/g, String(maxSuggested() + 2))
        .replace(/\{\{char\}\}/g, c.name2 || 'the main character')
        .replace(/\{\{context\}\}/g, () => context);
}

function storyNames() {
    const c = ctx();
    const names = [c.name1, c.name2, ...(c.chat || []).slice(-30).map(m => m?.name)];
    const words = new Set();
    for (const name of names) {
        const full = normalizeTag(name);
        if (full.length >= 3) {
            words.add(full);
        }
        const first = String(name || '').toLowerCase().split(/[^a-z0-9]+/).find(Boolean) || '';
        if (first.length >= 3) {
            words.add(first);
        }
    }
    return words;
}

function isStoryName(tag, names) {
    const bare = tag.replace(/_\([^)]*\)$/, '');
    return names.has(tag) || names.has(bare);
}

function parseSuggestion(text) {
    const limit = maxSuggested() + 2;
    const names = storyNames();
    const banned = suggestBlacklist();
    const body = String(text || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, ' ')
        .replace(/^\s*tags?\s*:/i, '');
    const seen = new Set();
    const tags = [];
    const dropped = [];
    for (const raw of body.split(/[,\n]/)) {
        let tag = normalizeTag(raw.replace(/^\s*(?:[-*#•]+|\d+[.)])\s*/, '').replace(/["'`[\]]/g, ''));
        if (!tag) {
            continue;
        }
        if (tag.length > 40 || !/^[a-z0-9_()'.:!?&+-]+$/.test(tag)) {
            dropped.push(`${tag} (not a tag)`);
            continue;
        }
        if (TAG_SYNONYMS[tag]) {
            tag = TAG_SYNONYMS[tag];
        }
        if (seen.has(tag)) {
            continue;
        }
        if (isStoryName(tag, names)) {
            dropped.push(`${tag} (a name)`);
            continue;
        }
        if (banned.has(tag)) {
            dropped.push(`${tag} (blacklisted)`);
            continue;
        }
        if (DROP_TAGS.has(tag)) {
            dropped.push(`${tag} (pose or setting)`);
            continue;
        }
        if (isDetailTag(tag)) {
            dropped.push(`${tag} (too specific)`);
            continue;
        }
        if (isBlockedQueryTag(tag)) {
            dropped.push(`${tag} (excluded)`);
            continue;
        }
        seen.add(tag);
        if (tags.length < limit) {
            tags.push(tag);
        }
    }
    return { tags, dropped };
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
    const { tags, dropped } = parseSuggestion(text);
    if (!tags.length) {
        const usedReasoning = typeof result === 'object' && result?.reasoning;
        throw new Error(usedReasoning ? 'The tag model spent its tokens thinking and gave no tags. Use a non-thinking model or raise the token limit.' : 'The tag model gave no usable tags.');
    }
    return { tags, dropped, raw: String(text).trim().slice(0, 400) };
}

function tagKey(domain, tag) {
    return `${domain}|${tag}`;
}

function knownCount(domain, tag) {
    const value = tagCounts.get(tagKey(domain, tag));
    return value === undefined ? null : value;
}

function readTagList(result) {
    const out = [];
    const push = (name, count) => {
        if (typeof name === 'string' && name) {
            out.push({ name: normalizeTag(name), count: Number(count) || 0 });
        }
    };
    const data = result.data;
    const list = Array.isArray(data) ? data
        : Array.isArray(data?.tag) ? data.tag
            : Array.isArray(data?.tags) ? data.tags
                : data?.tag && typeof data.tag === 'object' ? [data.tag] : null;
    if (list) {
        list.forEach(item => item && typeof item === 'object' && push(item.name, item.count ?? item.post_count ?? item.images));
        return out;
    }
    if (data && typeof data === 'object' && '@attributes' in data) {
        return out;
    }
    const text = String(result.text || '').trim();
    if (text.startsWith('<')) {
        const doc = new DOMParser().parseFromString(text, 'text/xml');
        if (doc.querySelector('parsererror')) {
            return null;
        }
        doc.querySelectorAll('tag').forEach(node => push(node.getAttribute('name'), node.getAttribute('count')));
        return out;
    }
    return null;
}

const TAG_LOOKUP = {
    gelbooru: { url: (origin, tags, extra) => `${origin}/index.php?page=dapi&s=tag&q=index&json=1&limit=100&names=${encodeURIComponent(tags.join(' '))}${extra}` },
    danbooru: { url: (origin, tags, extra) => `${origin}/tags.json?limit=100&search%5Bname_comma%5D=${encodeURIComponent(tags.join(','))}${extra}` },
    e621: { url: (origin, tags, extra) => `${origin}/tags.json?limit=100&search%5Bname_comma%5D=${encodeURIComponent(tags.join(','))}${extra}` },
    moebooru: { perTag: true, url: (origin, tags, extra) => `${origin}/tag.json?limit=50&name=${encodeURIComponent(tags[0])}${extra}` },
    philomena: { url: (origin, tags, extra) => `${origin}/api/v1/json/search/tags?per_page=50&q=${encodeURIComponent(tags.map(tag => `name:${tag.replace(/_/g, ' ')}`).join(' || '))}${extra}` },
};

async function lookupTags(domain, engineName, tags) {
    const lookup = TAG_LOOKUP[engineName];
    const wanted = [...new Set(tags)].filter(tag => knownCount(domain, tag) === null);
    if (!lookup || !wanted.length || noTagLookup.has(domain)) {
        return;
    }
    const origin = `https://${domain}`;
    const extra = siteEntries().find(entry => entry.domain === domain)?.extra || '';
    try {
        const urls = lookup.perTag ? wanted.map(tag => lookup.url(origin, [tag], extra)) : [lookup.url(origin, wanted, extra)];
        const results = await Promise.all(urls.map(url => request(url)));
        const found = new Map();
        for (const result of results) {
            if (!result.ok) {
                throw new Error(`tag lookup answered ${result.status}`);
            }
            const list = readTagList(result);
            if (list === null) {
                throw new Error('tag lookup answer not readable');
            }
            list.forEach(item => found.set(item.name, item.count));
        }
        const asked = new Set(wanted);
        if (!lookup.perTag && [...found.keys()].some(name => !asked.has(name))) {
            throw new Error('tag lookup ignored the requested names');
        }
        if (wanted.length >= 3 && !wanted.some(tag => found.has(tag))) {
            throw new Error('tag lookup found none of the tags');
        }
        wanted.forEach(tag => tagCounts.set(tagKey(domain, tag), found.get(tag) ?? 0));
    } catch (error) {
        console.debug(`[Image Search] tag lookup off for ${domain}`, error);
        noTagLookup.add(domain);
    }
}

async function checkSuggested(domain, suggestion) {
    const tags = [...suggestion.tags];
    const dropped = [...suggestion.dropped];
    const entry = siteEntries().find(e => e.domain === domain);
    if (entry) {
        const engineName = await engineOf(entry, tags).catch(() => '');
        if (ENGINES[engineName]) {
            await lookupTags(domain, engineName, tags);
        }
    }
    const minimum = Math.max(0, Number(settings().minTagPosts) || 0);
    const kept = tags.filter(tag => {
        const count = knownCount(domain, tag);
        if (count === 0) {
            dropped.push(`${tag} (not on ${domain})`);
            return false;
        }
        if (count !== null && count < minimum) {
            dropped.push(`${tag} (too rare: ${count} posts)`);
            return false;
        }
        return true;
    });
    const result = kept.slice(0, maxSuggested());
    kept.slice(maxSuggested()).forEach(tag => dropped.push(`${tag} (over the limit)`));
    return { tags: result, dropped };
}

function clearTagCache() {
    tagCounts.clear();
    noTagLookup.clear();
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
    const entry = { chatId: currentChatId(), controller: new AbortController(), tags: null, browse: null, error: '', raw: '', dropped: [] };
    entry.promise = (async () => {
        try {
            const suggestion = await suggestTags(entry.controller.signal);
            if (entry.controller.signal.aborted) {
                return;
            }
            entry.raw = suggestion.raw;
            const domain = activeDomain();
            const checked = domain ? await checkSuggested(domain, suggestion) : suggestion;
            if (entry.controller.signal.aborted) {
                return;
            }
            entry.dropped = checked.dropped;
            if (!checked.tags.length) {
                throw new Error(`None of the suggested tags exist on ${domain}.`);
            }
            entry.tags = checked.tags;
            if (domain) {
                entry.browse = createBrowse(domain, entry.tags);
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

function summaryTags(tags) {
    return [...new Set((tags || []).map(normalizeTag))]
        .filter(tag => tag && !META_TAG.test(tag) && !EXCLUDED_TAGS.has(tag))
        .slice(0, 60);
}

async function imageDataUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Could not read the saved picture (${response.status}).`);
    }
    const blob = await response.blob();
    try {
        const bitmap = await createImageBitmap(blob);
        const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close?.();
        return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
        return `data:${blob.type || 'image/jpeg'};base64,${await blobToBase64(blob)}`;
    }
}

function visionProfileId() {
    const s = settings();
    return s.visionProfile || s.tagProfile;
}

async function requestDescription(url, tags) {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    const profile = visionProfileId();
    if (!service || !profile) {
        throw new Error('No vision profile chosen in Image Search settings.');
    }
    const image = await imageDataUrl(url);
    const prompt = String(s.visionPrompt || DEFAULT_VISION_PROMPT).replace(/\{\{tags\}\}/g, () => tags.join(', ') || 'none');
    const messages = [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }] }];
    const result = await service.sendRequest(profile, messages, Math.max(32, Number(s.visionMaxTokens) || 300), { stream: false, extractData: true, includePreset: false, includeInstruct: false }, { temperature: 0.3 });
    const text = String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (!text) {
        throw new Error('The vision model gave no description.');
    }
    return text.slice(0, 1500);
}

function readyDescription(url, tags, text) {
    return { url, tags: tags || [], text: text || '', error: '', started: Date.now(), ms: 0, done: true, promise: Promise.resolve() };
}

function startDescription(url, postTags, onDone) {
    const s = settings();
    if (!s.describe) {
        return;
    }
    const entry = { url, tags: summaryTags(postTags), text: '', error: '', started: Date.now(), ms: 0, done: false };
    entry.promise = requestDescription(url, entry.tags)
        .then(text => {
            entry.text = text;
            onDone?.(text);
        })
        .catch(error => {
            entry.error = String(error?.cause?.message || error?.message || error);
            console.warn('[Image Search] picture description failed', error);
        })
        .finally(() => {
            entry.done = true;
            entry.ms = Date.now() - entry.started;
            if (settings().debug) {
                const seconds = (entry.ms / 1000).toFixed(1);
                toastr.info(entry.text ? `Described in ${seconds} s: ${entry.text}` : `Description failed after ${seconds} s: ${entry.error}. The AI gets the tags instead.`, 'Image Search debug', { timeOut: 15000 });
            }
        });
    descriptions.set(url, entry);
}

function pictureNote(entry, who = 'the user shared') {
    if (entry.text) {
        return `[Picture ${who}: ${entry.text}]`;
    }
    if (entry.tags.length) {
        return `[Picture ${who}, tagged: ${entry.tags.slice(0, 25).join(', ').replace(/_/g, ' ')}]`;
    }
    return '';
}

const library = { entries: [], loaded: false, broken: false, loading: null, saving: Promise.resolve(), deleted: new Set() };

function validEntry(entry) {
    return entry && typeof entry === 'object' && typeof entry.id === 'string' && typeof entry.url === 'string';
}

function cleanEntry(entry) {
    return {
        id: entry.id,
        url: entry.url,
        source: String(entry.source || ''),
        site: String(entry.site || ''),
        tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
        searchTags: Array.isArray(entry.searchTags) ? entry.searchTags.map(String) : [],
        description: String(entry.description || ''),
        characters: Array.isArray(entry.characters) ? entry.characters.map(String) : [],
        added: Number(entry.added) || Date.now(),
        lastUsed: Number(entry.lastUsed) || 0,
        used: Number(entry.used) || 0,
    };
}

async function readLibraryFile() {
    const response = await fetch(`/user/files/${LIBRARY_FILE}?t=${Date.now()}`, { cache: 'no-store' });
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        throw new Error(`The picture library could not be read (${response.status}).`);
    }
    const data = JSON.parse(await response.text());
    return (Array.isArray(data?.entries) ? data.entries : []).filter(validEntry).map(cleanEntry);
}

async function loadLibrary(force = false) {
    if (library.loaded && !force) {
        return library.entries;
    }
    if (library.loading) {
        return library.loading;
    }
    library.loading = (async () => {
        try {
            library.entries = await readLibraryFile();
            library.broken = false;
        } catch (error) {
            console.warn('[Image Search] library unavailable', error);
            library.broken = true;
        }
        library.loaded = true;
        library.loading = null;
        return library.entries;
    })();
    return library.loading;
}

function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
}

function saveLibrary() {
    library.saving = library.saving.then(async () => {
        if (library.broken) {
            await loadLibrary(true);
            if (library.broken) {
                throw new Error('The picture library could not be read, so it was not saved, to avoid overwriting it.');
            }
        }
        try {
            const remote = await readLibraryFile();
            const known = new Set(library.entries.map(entry => entry.id));
            remote.filter(entry => !known.has(entry.id) && !library.deleted.has(entry.id)).forEach(entry => library.entries.push(entry));
        } catch {
        }
        const body = JSON.stringify({ version: 1, entries: library.entries });
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            headers: ctx().getRequestHeaders(),
            body: JSON.stringify({ name: LIBRARY_FILE, data: utf8ToBase64(body) }),
        });
        if (!response.ok) {
            throw new Error(`The picture library could not be saved (${response.status}).`);
        }
    }).catch(error => {
        console.warn('[Image Search] library save failed', error);
        toastr.warning(String(error?.message || error), 'Image Search');
    });
    return library.saving;
}

function newEntryId() {
    let id = '';
    do {
        id = Math.random().toString(36).slice(2, 8);
    } while (id.length < 6 || library.entries.some(entry => entry.id === id));
    return id;
}

function entryForSource(source) {
    return source ? library.entries.find(entry => entry.source === source) : null;
}

function entryForUrl(url) {
    return library.entries.find(entry => entry.url === url) || null;
}

function noteUse(entry, character) {
    entry.used = (entry.used || 0) + 1;
    entry.lastUsed = Date.now();
    if (character && !entry.characters.includes(character)) {
        entry.characters.push(character);
    }
}

async function addToLibrary(item, url, searchTags) {
    await loadLibrary();
    let entry = entryForSource(item.page) || entryForUrl(url);
    if (!entry) {
        entry = cleanEntry({
            id: newEntryId(),
            url,
            source: item.page,
            site: hostOf(item.page),
            tags: summaryTags(item.tags),
            searchTags,
        });
        library.entries.unshift(entry);
    }
    return entry;
}

function removeFromLibrary(entry) {
    library.entries = library.entries.filter(e => e.id !== entry.id);
    library.deleted.add(entry.id);
    return saveLibrary();
}

function shortDescription(entry) {
    const text = entry.description || entry.tags.slice(0, 12).join(', ').replace(/_/g, ' ');
    const first = text.split(/(?<=[.!?])\s/)[0] || text;
    return first.length > 160 ? `${first.slice(0, 157)}…` : first;
}

function wordsOf(text) {
    return new Set(String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length >= 3 && !STOP_WORDS.has(word)));
}

function scoreEntry(entry, words, tags, character) {
    let score = 0;
    for (const tag of entry.tags) {
        if (tags.has(tag)) {
            score += 3;
        }
        if (tag.split('_').some(part => words.has(part))) {
            score += 1;
        }
    }
    for (const word of wordsOf(entry.description)) {
        if (words.has(word)) {
            score += 1;
        }
    }
    if (character && entry.characters.includes(character)) {
        score += 4;
    }
    return score;
}

function rankEntries(entries, { text = '', tags = [], character = '' } = {}) {
    const words = wordsOf(text);
    tags.forEach(tag => tag.split('_').forEach(part => part.length >= 3 && words.add(part)));
    const tagSet = new Set(tags);
    return entries
        .map(entry => ({ entry, score: scoreEntry(entry, words, tagSet, character) }))
        .sort((a, b) => b.score - a.score || (b.entry.lastUsed || b.entry.added) - (a.entry.lastUsed || a.entry.added));
}

function recentText(count = 3) {
    return (ctx().chat || [])
        .filter(m => m && !m.is_system && typeof m.mes === 'string')
        .slice(-count)
        .map(m => cleanForPrompt(m.mes).slice(-800))
        .join(' ');
}

async function updateShowPrompt() {
    const s = settings();
    const c = ctx();
    if (!s.enabled || !s.aiShow) {
        c.setExtensionPrompt?.(PROMPT_KEY, '', 1, 0, false, 0);
        return;
    }
    await loadLibrary();
    const ranked = rankEntries(library.entries, { text: recentText(3), character: c.name2 || '' })
        .filter(item => item.score > 0)
        .slice(0, Math.max(1, Number(s.aiShowCount) || 6));
    const value = ranked.length
        ? `${s.showPrompt || DEFAULT_SHOW_PROMPT}\n${ranked.map(({ entry }) => `- [pic:${entry.id}] ${shortDescription(entry)}`).join('\n')}`
        : '';
    c.setExtensionPrompt?.(PROMPT_KEY, value, 1, Math.max(0, Number(s.aiShowDepth) || 0), false, 0);
}

function setMessageText(message, text) {
    message.mes = text;
    if (Array.isArray(message.swipes) && Number.isInteger(message.swipe_id) && message.swipe_id < message.swipes.length) {
        message.swipes[message.swipe_id] = text;
    }
}

async function onAiPictures(messageId) {
    const s = settings();
    const c = ctx();
    const id = Number(messageId);
    const message = c.chat[id];
    if (!s.enabled || !message || message.is_user || message.is_system || typeof message.mes !== 'string' || !/\[pic:/i.test(message.mes)) {
        return;
    }
    await loadLibrary();
    const ids = [...message.mes.matchAll(PIC_TAG)].map(match => match[1].toLowerCase());
    setMessageText(message, message.mes.replace(PIC_TAG, '').replace(/\n{3,}/g, '\n\n').trim());
    const entries = [...new Set(ids)].map(pid => library.entries.find(entry => entry.id === pid)).filter(Boolean).slice(0, 2);
    if (entries.length) {
        if (!message.extra || typeof message.extra !== 'object') {
            message.extra = {};
        }
        if (!Array.isArray(message.extra.media)) {
            message.extra.media = [];
        }
        for (const entry of entries) {
            if (!message.extra.media.some(item => item.url === entry.url)) {
                const note = pictureNote(readyDescription(entry.url, entry.tags, entry.description), 'shown in the story');
                message.extra.media.push({ type: 'image', url: entry.url, title: note, append_title: true, source: 'upload' });
            }
            noteUse(entry, message.name || c.name2 || '');
        }
        saveLibrary();
    }
    if (document.querySelector(`#chat .mes[mesid="${id}"]`)) {
        c.updateMessageBlock(id, message);
    }
    await c.saveChat();
}

function setNote(media, entry) {
    const note = pictureNote(entry);
    if (note) {
        media.title = note;
        media.append_title = true;
    }
}

async function applyDescription(message, media, entry) {
    const timeout = Math.max(0, Number(settings().describeWaitSec) || 0) * 1000;
    const finished = entry.done || await Promise.race([
        entry.promise.then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), timeout)),
    ]);
    setNote(media, entry);
    if (!finished) {
        entry.promise.then(async () => {
            const c = ctx();
            if (c.chat.includes(message)) {
                setNote(media, entry);
                await c.saveChat();
            }
        });
    }
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
    const waits = [];
    for (const match of found) {
        const url = match[2];
        let media = message.extra.media.find(item => item.url === url);
        if (!media) {
            media = { type: 'image', url, title: match[1], source: 'upload' };
            message.extra.media.push(media);
        }
        const entry = descriptions.get(url);
        if (entry && s.describe) {
            waits.push(applyDescription(message, media, entry));
        }
    }
    message.mes = message.mes.replace(LOCAL_IMAGE_MD, '').replace(/\n{3,}/g, '\n\n').trim();
    await Promise.all(waits);
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
        debug: el('div', 'stis-debug'),
        grid: el('div', 'stis-grid'),
        sentinel: el('div', 'stis-sentinel'),
        preview: el('div', 'stis-preview'),
        tabs: el('div', 'stis-tabs'),
        tabSearch: el('div', 'menu_button stis-tab stis-tab-on', 'Search'),
        tabLibrary: el('div', 'menu_button stis-tab', 'Library'),
        libraryView: el('div', 'stis-library'),
        libSearch: el('input', 'text_pole stis-lib-search'),
        libGrid: el('div', 'stis-grid'),
    };
    ui.libSearch.type = 'text';
    ui.libSearch.placeholder = 'search saved pictures';
    ui.tabs.append(ui.tabSearch, ui.tabLibrary);
    ui.libraryView.append(ui.libSearch, ui.libGrid);
    ui.libraryView.hidden = true;
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
    ui.debug.hidden = !s.debug;
    ui.root.append(ui.tabs, ui.top, ui.status, ui.debug, ui.grid, ui.libraryView, ui.preview);

    let tags = [];
    let edited = false;
    let browse = null;
    let rendered = 0;
    let searchTimer = null;
    let closed = false;
    let busy = false;
    let dragFrom = -1;
    let shown = null;

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
            const count = knownCount(ui.site.value, tag);
            if (count === 0) {
                chip.classList.add('stis-unknown');
                chip.title = `Not found on ${ui.site.value}`;
            } else if (count !== null) {
                chip.title += ` ${count} posts.`;
            }
            chip.appendChild(el('span', '', tag));
            const ban = el('i', 'fa-solid fa-ban stis-chip-x');
            ban.title = 'Never suggest this tag again';
            ban.addEventListener('click', event => {
                event.stopPropagation();
                addToSuggestBlacklist(tag);
                tags.splice(index, 1);
                toastr.info(`"${tag}" will not be suggested again. You can undo this in the settings.`, 'Image Search');
                tagsChanged();
            });
            chip.appendChild(ban);
            const remove = el('i', 'fa-solid fa-xmark stis-chip-x');
            remove.title = 'Remove from this search';
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
        renderDebug();
    };

    const refreshCounts = async () => {
        const domain = ui.site.value;
        const engineName = settings().engines[domain];
        if (!ENGINES[engineName] || !tags.length) {
            return;
        }
        const before = tags.map(tag => knownCount(domain, tag)).join();
        await lookupTags(domain, engineName, tags);
        if (!closed && domain === ui.site.value && tags.map(tag => knownCount(domain, tag)).join() !== before) {
            renderChips();
        }
    };

    function renderDebug() {
        if (!s.debug) {
            ui.debug.hidden = true;
            return;
        }
        ui.debug.hidden = false;
        ui.debug.innerHTML = '';
        const line = (label, value) => {
            const row = el('div', 'stis-debug-row');
            row.appendChild(el('b', '', `${label} `));
            row.appendChild(typeof value === 'string' ? document.createTextNode(value) : value);
            ui.debug.appendChild(row);
        };
        if (shown?.raw) {
            line('Tag model reply:', shown.raw);
        }
        if (shown?.dropped?.length) {
            line('Removed:', shown.dropped.join(', '));
        }
        if (tags.length) {
            line('Posts per tag:', tags.map(tag => `${tag} (${knownCount(ui.site.value, tag) ?? '?'})`).join(', '));
        }
        const first = browse?.pages?.[0];
        if (first) {
            const link = el('a', '', `Open the same search on ${browse.domain}`);
            link.href = first.siteUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            line('Site:', link);
            if (first.localTags.length) {
                line('Checked here, not by the site:', first.localTags.join(', '));
            }
            line('API:', first.apiUrl);
            browse.pages.forEach(p => line(`Page ${p.page + 1}:`, `site sent ${p.received}, kept ${p.kept} (removed: rating ${p.rating}, excluded tags ${p.excluded}, missing checked tags ${p.local}, not a picture ${p.notImage})`));
        }
        if (browse?.error) {
            line('Error:', browse.error);
        }
    }

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
        refreshCounts();
    };

    const tagsChanged = () => {
        edited = true;
        renderChips();
        refreshCounts();
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
        renderDebug();
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
        refreshCounts();
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
        shown = pre;
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
                shown = pre;
                renderDebug();
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

    function previewShell(src, sourceUrl) {
        ui.preview.innerHTML = '';
        const img = el('img', 'stis-preview-img');
        if (typeof src === 'string') {
            img.src = src;
        } else {
            setPreviewSource(img, src);
        }
        const bar = el('div', 'stis-preview-bar');
        const back = el('div', 'menu_button', 'Back');
        back.addEventListener('click', () => {
            ui.preview.hidden = true;
        });
        const link = el('a', 'stis-post-link', 'Open post');
        link.href = sourceUrl || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.hidden = !sourceUrl;
        bar.append(back, link);
        ui.preview.append(img, bar);
        ui.preview.hidden = false;
        return bar;
    }

    function showPreview(item) {
        const bar = previewShell(item, item.page);
        const use = el('div', 'menu_button stis-use', 'Use this');
        use.addEventListener('click', () => pick(item, use));
        if (s.keepLibrary && s.saveLocal) {
            const keep = el('div', 'menu_button', 'Save to library');
            loadLibrary().then(() => {
                if (entryForSource(item.page)) {
                    keep.textContent = 'In library';
                }
            });
            keep.addEventListener('click', async () => {
                if (busy || keep.textContent !== 'Save to library') {
                    return;
                }
                busy = true;
                keep.textContent = 'Saving…';
                const { entry } = await storeItem(item);
                busy = false;
                keep.textContent = entry ? 'In library' : 'Save to library';
            });
            bar.append(keep);
        }
        bar.append(use);
    }

    function prepareEntryDescription(entry) {
        if (entry.description) {
            descriptions.set(entry.url, readyDescription(entry.url, entry.tags, entry.description));
        } else if (!descriptions.has(entry.url)) {
            startDescription(entry.url, entry.tags, text => {
                entry.description = text;
                saveLibrary();
            });
        }
    }

    async function storeItem(item) {
        if (s.keepLibrary) {
            await loadLibrary();
            const existing = entryForSource(item.page);
            if (existing) {
                prepareEntryDescription(existing);
                return { url: existing.url, entry: existing };
            }
        }
        if (!s.saveLocal) {
            return { url: item.img, entry: null };
        }
        const { src, lines } = await saveBest(item);
        if (!src) {
            console.warn('[Image Search] save failed', lines);
            toastr.warning(`${lines[0] || 'Saving failed.'} Using the direct link instead, so the AI will not see this picture.`, 'Image Search');
            return { url: item.img, entry: null };
        }
        const entry = s.keepLibrary ? await addToLibrary(item, src, [...tags]) : null;
        startDescription(src, item.tags, text => {
            if (entry) {
                entry.description = text;
                saveLibrary();
            }
        });
        if (entry) {
            saveLibrary();
        }
        return { url: src, entry };
    }

    async function finishPick(text) {
        await popup.completeCancelled();
        setTimeout(() => insertIntoChatBox(text), 0);
    }

    async function pick(item, button) {
        if (busy) {
            return;
        }
        busy = true;
        button.textContent = 'Saving…';
        const { url, entry } = await storeItem(item);
        if (entry) {
            noteUse(entry, ctx().name2 || '');
            saveLibrary();
        }
        await finishPick(markdownFor(url, tags));
    }

    async function pickEntry(entry, button) {
        if (busy) {
            return;
        }
        busy = true;
        button.textContent = 'Adding…';
        noteUse(entry, ctx().name2 || '');
        prepareEntryDescription(entry);
        saveLibrary();
        await finishPick(markdownFor(entry.url, entry.searchTags.length ? entry.searchTags : entry.tags.slice(0, 6)));
    }

    function showEntry(entry) {
        const bar = previewShell(entry.url, entry.source);
        const info = el('div', 'stis-entry-info');
        info.appendChild(el('div', '', entry.description || 'No description yet. One is made the next time you use it.'));
        const meta = [entry.characters.length ? `Used with: ${entry.characters.join(', ')}` : '', `Used ${entry.used} time(s)`].filter(Boolean).join(' · ');
        info.appendChild(el('small', '', meta));
        ui.preview.insertBefore(info, bar);
        const remove = el('div', 'menu_button', 'Remove');
        remove.title = 'Remove from the library. The file stays, so chats that show it keep working.';
        remove.addEventListener('click', async () => {
            await removeFromLibrary(entry);
            ui.preview.hidden = true;
            renderLibrary();
        });
        const use = el('div', 'menu_button stis-use', 'Use this');
        use.addEventListener('click', () => pickEntry(entry, use));
        bar.append(remove, use);
    }

    async function renderLibrary() {
        await loadLibrary();
        if (closed) {
            return;
        }
        ui.tabLibrary.textContent = `Library (${library.entries.length})`;
        ui.libGrid.innerHTML = '';
        const query = [...wordsOf(ui.libSearch.value)];
        let ranked = rankEntries(library.entries, { text: recentText(2), tags, character: ctx().name2 || '' });
        if (query.length) {
            ranked = ranked.filter(({ entry }) => {
                const hay = `${entry.tags.join(' ')} ${entry.description} ${entry.characters.join(' ')}`.toLowerCase().replace(/_/g, ' ');
                return query.every(word => hay.includes(word));
            });
        }
        if (!ranked.length) {
            const message = library.broken ? 'The library could not be read.' : library.entries.length ? 'Nothing matches.' : 'Pictures you pick are saved here.';
            ui.libGrid.appendChild(el('div', 'stis-status', message));
            return;
        }
        for (const { entry } of ranked) {
            const cell = el('div', 'stis-cell');
            const img = el('img');
            img.loading = 'lazy';
            img.alt = '';
            img.src = entry.url;
            img.onerror = () => cell.classList.add('stis-broken');
            cell.title = shortDescription(entry);
            cell.appendChild(img);
            cell.addEventListener('click', () => showEntry(entry));
            ui.libGrid.appendChild(cell);
        }
    }

    function setView(next) {
        const lib = next === 'library';
        ui.top.hidden = lib;
        ui.status.hidden = lib;
        ui.grid.hidden = lib;
        ui.debug.hidden = lib || !s.debug;
        ui.libraryView.hidden = !lib;
        ui.tabSearch.classList.toggle('stis-tab-on', !lib);
        ui.tabLibrary.classList.toggle('stis-tab-on', lib);
        ui.preview.hidden = true;
        if (lib) {
            renderLibrary();
        }
    }

    ui.tabSearch.addEventListener('click', () => setView('search'));
    ui.tabLibrary.addEventListener('click', () => setView('library'));
    let libTimer = null;
    ui.libSearch.addEventListener('input', () => {
        clearTimeout(libTimer);
        libTimer = setTimeout(renderLibrary, 250);
    });
    ui.libSearch.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            renderLibrary();
        }
    });
    loadLibrary().then(() => {
        if (!closed) {
            ui.tabLibrary.textContent = `Library (${library.entries.length})`;
        }
    });

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
        refreshCounts();
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
        shown = pre;
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
            shown = pre;
            renderDebug();
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
                <div>Never suggest these tags (one per line, or tap <i class="fa-solid fa-ban"></i> on a tag in the picker)</div>
                <textarea id="st_imagesearch_blacklist" class="text_pole"></textarea>
                <div>Allowed ratings</div>
                <div class="st-imagesearch-row">
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_general"> <span>General</span></label>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_sensitive"> <span>Sensitive</span></label>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_questionable"> <span>Questionable</span></label>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_explicit"> <span>Explicit</span></label>
                </div>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_savelocal"> <span>Save picked pictures into SillyTavern (needs CORS proxy or the fetcher)</span></label>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_attach"> <span>Attach saved pictures when sending, so vision models can see them</span></label>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_describe"> <span>Describe picked pictures for the AI (a vision model looks at the picture and its tags; the description is sent to the AI with the picture, hidden from the chat)</span></label>
                <div>Vision profile (empty = use the tag profile)</div>
                <select id="st_imagesearch_vision_profile" class="text_pole"></select>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_keep"> <span>Keep picked pictures in the library</span></label>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_aishow"> <span>Let the AI show saved pictures in its replies (adds a short list of fitting pictures to the prompt)</span></label>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_debug"> <span>Show debug info in the picker (site search link, filter counts, tag model reply)</span></label>
                <details>
                    <summary>Advanced</summary>
                    <div class="st-imagesearch-row"><span>Max suggested tags</span><input type="number" min="1" max="20" id="st_imagesearch_max" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Minimum posts for a suggested tag</span><input type="number" min="0" max="100000" id="st_imagesearch_min_posts" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Messages sent to the tag model</span><input type="number" min="1" max="10" id="st_imagesearch_ctx_count" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Characters per message</span><input type="number" min="100" max="4000" id="st_imagesearch_ctx_chars" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Tag reply token limit</span><input type="number" min="16" max="4000" id="st_imagesearch_tokens" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Description token limit</span><input type="number" min="32" max="4000" id="st_imagesearch_vision_tokens" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Seconds to wait for the description when sending</span><input type="number" min="0" max="120" id="st_imagesearch_describe_wait" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Saved pictures offered to the AI</span><input type="number" min="1" max="20" id="st_imagesearch_aishow_count" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Depth of that list in the prompt</span><input type="number" min="0" max="50" id="st_imagesearch_aishow_depth" class="text_pole"></div>
                    <div>Instruction for showing saved pictures (the list is added below it)</div>
                    <textarea id="st_imagesearch_show_prompt" class="text_pole"></textarea>
                    <div>Description prompt ({{tags}} is filled in)</div>
                    <textarea id="st_imagesearch_vision_prompt" class="text_pole"></textarea>
                    <div id="st_imagesearch_vision_reset" class="menu_button">Reset description prompt</div>
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
        updateShowPrompt();
        if (!s.enabled) {
            onChatChanged();
        }
    });
    bind('st_imagesearch_sites', 'sites', 'value', () => {
        s.engines = {};
        clearTagCache();
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
    bind('st_imagesearch_debug', 'debug', 'checked');
    bind('st_imagesearch_describe', 'describe', 'checked');
    bind('st_imagesearch_keep', 'keepLibrary', 'checked');
    bind('st_imagesearch_aishow', 'aiShow', 'checked', updateShowPrompt);
    bind('st_imagesearch_aishow_count', 'aiShowCount', 'number', updateShowPrompt);
    bind('st_imagesearch_aishow_depth', 'aiShowDepth', 'number', updateShowPrompt);
    bind('st_imagesearch_show_prompt', 'showPrompt', 'value', updateShowPrompt);
    bind('st_imagesearch_vision_tokens', 'visionMaxTokens', 'number');
    bind('st_imagesearch_describe_wait', 'describeWaitSec', 'number');
    bind('st_imagesearch_vision_prompt', 'visionPrompt');
    document.getElementById('st_imagesearch_vision_reset').addEventListener('click', () => {
        s.visionPrompt = DEFAULT_VISION_PROMPT;
        document.getElementById('st_imagesearch_vision_prompt').value = DEFAULT_VISION_PROMPT;
        save();
    });
    bind('st_imagesearch_max', 'maxSuggested', 'number');
    bind('st_imagesearch_min_posts', 'minTagPosts', 'number');
    bind('st_imagesearch_blacklist', 'suggestBlacklist');
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
        clearTagCache();
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
        ctx().ConnectionManagerRequestService.handleDropdown('#st_imagesearch_vision_profile', s.visionProfile, profile => {
            s.visionProfile = profile?.id || '';
            save();
        });
        note.textContent = 'Make a profile with a fast model that does not think, e.g. DeepSeek V4.1 Flash (standard). It can also describe pictures, since it accepts images.';
    } catch (error) {
        note.textContent = `Tag suggestions unavailable: ${error?.message || error}. Enable the Connection Profiles extension.`;
    }
}

jQuery(() => {
    const c = ctx();
    applyReferrerPolicy();
    settings();
    buildSettings();
    updateShowPrompt();
    refreshCleanup();
    setInterval(refreshCleanup, CLEANUP_REFRESH_MS);
    registerCommand();
    addButtons();
    c.eventSource.on(c.eventTypes.APP_READY, addButtons);
    c.eventSource.on(c.eventTypes.MESSAGE_RECEIVED, onAiPictures);
    c.eventSource.on(c.eventTypes.MESSAGE_RECEIVED, onReplyFinished);
    c.eventSource.on(c.eventTypes.MESSAGE_RECEIVED, updateShowPrompt);
    c.eventSource.on(c.eventTypes.MESSAGE_SENT, onMessageSent);
    c.eventSource.on(c.eventTypes.MESSAGE_SENT, updateShowPrompt);
    c.eventSource.on(c.eventTypes.CHAT_CHANGED, onChatChanged);
    c.eventSource.on(c.eventTypes.CHAT_CHANGED, updateShowPrompt);
});
