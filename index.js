const MODULE = 'st_imagesearch';
const PROMPT_KEY = 'st_imagesearch_instruction';
const VERSION = '2.8.1';
const BATCH = 24;
const MAX_PAGE_CALLS = 3;
const RANK_WINDOW = 150;
const MAX_SIDE = 1280;
const LIBRARY_FILE = 'imagesearch-library.json';
const PIC_TAG = /\[pic:\s*([a-z0-9]{4,12})\s*\]/gi;
const LOREBOOK = 'Image Search Pictures';
const WI_COMMENT = /^\[pic:([a-z0-9]+)\]/;
const CATALOG_COMMENT = '[pic-list] Saved pictures the AI can show';
const COUNT_TAGS = /^(\d+(girl|boy|other)s?|solo|male|female|multiple_.*|.*_focus|no_humans)$/;
const STOP_WORDS = new Set(['the', 'and', 'with', 'her', 'his', 'their', 'she', 'him', 'them', 'they', 'you', 'your', 'are', 'was', 'were', 'has', 'have', 'had', 'this', 'that', 'there', 'then', 'than', 'from', 'into', 'onto', 'over', 'under', 'out', 'for', 'not', 'but', 'its', 'who', 'what', 'when', 'where', 'which', 'while', 'some', 'very', 'just', 'like', 'one', 'two', 'picture', 'shows', 'showing', 'shown', 'image', 'wearing', 'looks', 'look', 'seems', 'standing', 'sitting', 'background']);
const GENERIC_KEYWORDS = new Set(['girl', 'girls', 'boy', 'boys', 'man', 'men', 'woman', 'women', 'person', 'people', 'human', 'humans', 'guy', 'lady', 'smile', 'smiling', 'grin', 'hair', 'eyes', 'face', 'body', 'clothes', 'clothing', 'outfit', 'standing', 'sitting', 'looking', 'portrait', 'picture', 'image', 'character', 'solo', 'adult', 'young', 'pose', 'posing', 'background']);
const LOCAL_IMAGE_MD = /!\[([^\]\n]*)\]\((\/user\/images\/imagesearch\/[^)\s]+)\)/g;
const ENGINE_ORDER = ['gelbooru', 'danbooru', 'moebooru', 'philomena'];
const NOT_BOARD = new Set(['web', 'web-unchecked', 'none']);
const KNOWN_WEB = /(^|\.)(wikimedia\.org|wikipedia\.org|pexels\.com|unsplash\.com|artstation\.com|flickr\.com|deviantart\.com|pinterest\.[a-z.]+|pixabay\.com|imgur\.com|reddit\.com)$/;
const DROP_TAGS = new Set(['night', 'day', 'daytime', 'nighttime', 'dawn', 'dusk', 'sunset', 'sunrise', 'evening', 'morning', 'afternoon', 'twilight', 'midnight', 'night_sky', 'starry_sky', 'indoors', 'outdoors', 'sunlight', 'moonlight', 'rain', 'snowing', 'cloudy_sky', 'blue_sky', 'scenery', 'forest', 'woods', 'city', 'cityscape', 'street', 'alley', 'beach', 'ocean', 'sea', 'river', 'lake', 'mountain', 'mountains', 'field', 'meadow', 'park', 'garden', 'desert', 'cave', 'village', 'town', 'school', 'classroom', 'library', 'bedroom', 'room', 'kitchen', 'bathroom', 'office', 'cafe', 'tavern', 'inn', 'shrine', 'temple', 'ruins', 'dungeon', 'castle', 'snow', 'grass', 'water', 'sky', 'outdoor', 'indoor', 'urban', 'city_street', 'rooftop', 'building', 'house', 'road', 'standing', 'sitting', 'walking', 'running', 'lying', 'kneeling', 'squatting', 'crouching', 'leaning', 'leaning_forward', 'jumping', 'fighting', 'holding', 'talking', 'walking_away', 'looking_at_viewer', 'looking_away', 'looking_back', 'looking_down', 'looking_up', 'arms_crossed', 'hands_on_hips', 'from_side', 'from_behind', 'from_above', 'from_below', 'full_body', 'upper_body', 'cowboy_shot', 'portrait', 'close-up']);
const TAG_SYNONYMS = { male: '1boy', man: '1boy', boy: '1boy', guy: '1boy', female: '1girl', woman: '1girl', girl: '1girl', lady: '1girl', men: 'multiple_boys', women: 'multiple_girls', two_girls: '2girls', two_boys: '2boys', blond: 'blonde_hair', blonde: 'blonde_hair', blond_hair: 'blonde_hair', redhead: 'red_hair', ginger_hair: 'orange_hair', dark_skinned: 'dark_skin', pale: 'pale_skin', elf_ears: 'pointy_ears' };

const DEFAULT_TAG_PROMPT = 'You pick image-board (booru) tags to find a picture of one person from a roleplay. First decide who the picture should show: {{char}} if they are in the latest messages, otherwise the person the latest message is about. Then give tags for that person only, based only on what the text below says or clearly implies. Never guess: if the text does not say it, leave it out. Three correct tags are better than many guesses. Give at most {{max}} tags.\nUseful kinds of tags, most important first: how many and gender (1girl, 1boy), species if not human, body type and age look, skin color, hair color or baldness, lasting features of the body, and the kind of outfit.\nDo not tag hair length or style, eye color, small accessories, expression, pose or action, place, background, time, weather or lighting. Never use names from the story. Use common booru tags: lowercase, with underscores inside a tag.\nFor every tag, quote the few words of the text below that support it.\n\nReply in exactly this format:\nSubject: the person\'s name, or none\nTags:\ntag = "exact words from the text"\ntag = "exact words from the text"\n\n{{context}}';
const OLD_TAG_PROMPTS = ['Below is the latest part of a roleplay. Reply with up to {{max}} image-board (booru) tags describing who or what is visible right now: character type, hair, eyes, clothing, expression, pose, creatures, objects. Most important tag first. Lowercase, underscores inside multi-word tags (black_hair, cat_ears), separated by commas. No locations, backgrounds, time of day, weather or lighting. Reply with the tags only, nothing else.\n\n{{context}}', 'You choose image-board (booru) tags to find a picture of {{char}} as they appear in the latest part of a roleplay. If {{char}} is not in the scene, tag the person the latest message is about. Reply with up to {{max}} tags, most important first, in this order:\n1. how many and gender: 1girl, 1boy, 2girls (never male, female, man or woman)\n2. species, only if not human: elf, demon_girl, wolf, dragon\n3. hair color, then hair length or style: black_hair, long_hair, ponytail\n4. eye color: blue_eyes\n5. skin color: dark_skin, pale_skin, tan\n6. clothing and accessories: armor, hooded_cloak, glasses\n7. body features: cat_ears, horns, tail, wings, scar, beard\nNever use names of characters, places or anything else from the story. Never describe pose or action (sitting, walking, standing, holding), setting or background (outdoors, urban, forest, room), time, weather or lighting. Only use common booru tags: lowercase, underscores inside a tag, separated by commas. Reply with the tags only.\n\n{{context}}', 'You choose image-board (booru) tags to find pictures that look like {{char}} in the latest part of a roleplay. If {{char}} is not in the scene, tag the person the latest message is about. The user scrolls the results and picks one, so use broad tags for what makes the character recognizable at a glance, not small details. Reply with up to {{max}} tags, most important first:\n1. how many and gender: 1girl, 1boy, 2girls (never male, female, man or woman)\n2. species, only if not human: elf, orc, demon_girl, wolf\n3. body type and age look: muscular_male, fat, skinny, old_man, mature_female, thick_thighs\n4. skin color: dark_skin, pale_skin\n5. hair color, or bald\n6. the most striking features: beard, scar, tattoo, horns, wings, tail, pointy_ears\n7. outfit type: armor, robe, suit, kimono\nDo not tag hair length or style, eye color, small accessories, expression, pose or action, setting, background, time, weather or lighting. Never use names from the story. Only common booru tags: lowercase, underscores inside a tag, separated by commas. Reply with the tags only.\n\n{{context}}', 'You choose image-board (booru) tags to find pictures that look like {{char}} in the latest part of a roleplay. If {{char}} is not in the scene, tag the person the latest message is about. The user scrolls the results and picks one, so use broad tags for what makes the character recognizable at a glance, not small details. Reply with up to {{max}} tags, most important first:\n1. how many and gender: 1girl, 1boy, 2girls (never male, female, man or woman)\n2. species, only if not human: elf, orc, demon_girl, wolf\n3. body type and age look: muscular_male, fat, skinny, old_man, mature_female, thick_thighs\n4. skin color: dark_skin, pale_skin\n5. hair color, or bald\n6. the most striking features: beard, scar, tattoo, horns, wings, tail, pointy_ears\n7. outfit type: armor, robe, suit, kimono\nDo not tag hair length or style, eye color, small accessories, expression, pose or action, setting, background, time, weather or lighting. Never use names from the story. Only common booru tags: lowercase, underscores inside a tag, separated by commas. Reply in exactly this format:\nSubject: the name of the person you tagged, or none\nTags: tag1, tag2, tag3\n\n{{context}}'];
const APPEARANCE_WORDS = /\b(hair|bald|eyes?|skin|tall|short|height|cm|feet|ft|inch(es)?|met(er|re)s?|build|muscular|muscles?|slim|slender|thin|skinny|fat|chubby|plump|curvy|stocky|broad|shoulders|beard|mustache|moustache|scars?|tattoos?|horns?|tails?|wings?|ears?|fur|scales|freckles|wears?|wearing|dressed|clothes|clothing|outfit|armou?r|robes?|dress|uniform|coat|cloak|appearance|looks? like|face|body|figure|years? old|elderly|petite|breasts?|hips|thighs|legs|arms|complexion|pale|tanned|dark-skinned)\b/i;
const DEFAULT_VISION_PROMPT = 'The user of a roleplay is about to show this picture in the story. Describe it for a writer who cannot see it, so they can refer to it in detail. Describe only what is visible; do not invent names or story. Ignore any writing in the picture (speech bubbles, captions, signs, signatures, watermarks); only mention sound effects written as onomatopoeia, such as "BOOM". The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nReply in exactly this format:\nVisual: 2 to 3 sentences on how each person or creature looks and what stands out: build, skin, hair, clothing, gear and distinctive features. Give the approximate size of people and important things, by comparison (taller than the doorway, a sword as long as her arm) or by measurement (about 2 m tall).\nExpression: 1 sentence on the face, gaze, posture and body language, and the emotion they show.\nAction: 1 to 2 sentences on what is happening.\nAtmosphere: 1 sentence on the mood of the picture.\nFraming: 1 sentence on the shot: close-up, portrait, upper body or full body, the angle, and where the person is in the picture.\nKeywords: 6 to 10 plain everyday words a story would use for what is in it and what is happening, with the action as a verb (walking, fighting), separated by commas\n\nTags: {{tags}}';
const OLD_VISION_PROMPTS = ['The user of a roleplay is about to show this picture in the story. In 2 to 4 sentences, describe what it shows so a writer who cannot see it can refer to it: who or what is in it, their build, skin, hair, clothing, striking features, what they are doing and the mood. Describe only what is visible. Do not invent names or story. The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nTags: {{tags}}', 'The user of a roleplay is about to show this picture in the story. Describe what it shows so a writer who cannot see it can refer to it: who or what is in it, their build, skin, hair, clothing, striking features, what they are doing and the mood. Describe only what is visible. Do not invent names or story. The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nReply in exactly this format:\nDescription: 2 to 4 sentences\nKeywords: 5 to 8 plain everyday words a story would use for what is in it, separated by commas, e.g. orc, axe, armor, scar, warrior\n\nTags: {{tags}}', 'The user of a roleplay is about to show this picture in the story. Describe it for a writer who cannot see it, so they can refer to it in detail. Describe only what is visible; do not invent names or story. Ignore any writing in the picture (speech bubbles, captions, signs, signatures, watermarks); only mention sound effects written as onomatopoeia, such as "BOOM". The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nReply in exactly this format:\nVisual: 2 to 3 sentences on how each person or creature looks and what stands out: build, skin, hair, clothing, gear and distinctive features. Give the approximate size of people and important things, by comparison (taller than the doorway, a sword as long as her arm) or by measurement (about 2 m tall).\nExpression: 1 sentence on the face, gaze, posture and body language, and the emotion they show.\nAction: 1 to 2 sentences on what is happening.\nAtmosphere: 1 sentence on the mood of the picture.\nFraming: 1 sentence on the shot: close-up, portrait, upper body or full body, the angle, and where the person is in the picture.\nKeywords: 5 to 8 plain everyday words a story would use for what is in it, separated by commas\n\nTags: {{tags}}'];
const SECTIONS = [['visual', 'Visual'], ['expression', 'Expression'], ['action', 'Action'], ['atmosphere', 'Atmosphere'], ['framing', 'Framing']];
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
    excludeTags: 'animated, animated_gif, animated_png, video, comic, 4koma',
    favoriteTags: [],
    skipSites: [],
    tagProfile: '',
    prefetch: true,
    maxSuggested: 6,
    requiredCount: 2,
    characterLooks: '',
    minTagPosts: 50,
    suggestBlacklist: 'human',
    contextMessages: 6,
    contextChars: 500,
    tagMaxTokens: 250,
    useCards: true,
    requireEvidence: true,
    describe: true,
    visionProfile: '',
    visionPrompt: DEFAULT_VISION_PROMPT,
    visionMaxTokens: 700,
    describeWaitSec: 15,
    keepLibrary: true,
    aiShow: true,
    aiShowDepth: 2,
    catalogSize: 30,
    wiDisabledByUs: [],
    tagPrompt: DEFAULT_TAG_PROMPT,
    debug: false,
    lastTags: [],
    lastRequired: [],
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
    if (!Array.isArray(s.lastRequired)) {
        s.lastRequired = [];
    }
    if ((Number(s.schema) || 0) < 2) {
        if (s.maxSuggested === 8) {
            s.maxSuggested = 6;
        }
        s.schema = 2;
    }
    if (s.schema < 3) {
        if (Number(s.contextMessages) === 3) {
            s.contextMessages = 6;
        }
        if (Number(s.tagMaxTokens) === 100) {
            s.tagMaxTokens = 250;
        }
        if (Number(s.visionMaxTokens) === 300) {
            s.visionMaxTokens = 700;
        }
        s.schema = 3;
    }
    if (s.schema < 4) {
        const extra = normalizeTagList(s.extraExcluded);
        if (extra.length) {
            s.excludeTags = [...new Set([...normalizeTagList(s.excludeTags), ...extra])].join(', ');
            s.extraExcluded = '';
        }
        s.schema = 4;
    }
    if (!Array.isArray(s.favoriteTags)) {
        s.favoriteTags = [];
    }
    if (!Array.isArray(s.skipSites)) {
        s.skipSites = [];
    }
    if (OLD_VISION_PROMPTS.includes(s.visionPrompt)) {
        s.visionPrompt = DEFAULT_VISION_PROMPT;
    }
    if (!Array.isArray(s.wiDisabledByUs)) {
        s.wiDisabledByUs = [];
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

function excludedTags(wanted = []) {
    const skip = new Set(wanted.map(normalizeTag));
    return [...new Set(normalizeTagList(settings().excludeTags))].filter(tag => !skip.has(tag));
}

function addExcludedTags(list) {
    const s = settings();
    const current = normalizeTagList(s.excludeTags);
    const added = list.map(normalizeTag).filter(tag => tag && !current.includes(tag));
    if (added.length) {
        s.excludeTags = [...current, ...added].join(', ');
        save();
        const box = document.getElementById('st_imagesearch_exclude');
        if (box) {
            box.value = s.excludeTags;
        }
    }
    return added;
}

function favoriteTags() {
    return [...new Set((settings().favoriteTags || []).map(normalizeTag).filter(Boolean))];
}

function setFavorites(list) {
    const s = settings();
    s.favoriteTags = [...new Set(list.map(normalizeTag).filter(Boolean))];
    save();
    const box = document.getElementById('st_imagesearch_favorites');
    if (box) {
        box.value = s.favoriteTags.join(', ');
    }
}

function toggleFavorite(tag, on = !favoriteTags().includes(tag)) {
    const list = favoriteTags().filter(item => item !== tag);
    if (on) {
        list.push(tag);
    }
    setFavorites(list);
    return on;
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

const ALL_SITES = '*';

function activeDomain() {
    const s = settings();
    const domains = siteEntries().map(entry => entry.domain);
    if (domains.length > 1 && (s.lastSite === ALL_SITES || !s.lastSite || !domains.includes(s.lastSite))) {
        return ALL_SITES;
    }
    if (s.lastSite && domains.includes(s.lastSite)) {
        return s.lastSite;
    }
    return domains[0] || '';
}

function domainsFor(domain) {
    if (domain !== ALL_SITES) {
        return domain ? [domain] : [];
    }
    const all = siteEntries().map(entry => entry.domain);
    const skip = new Set(settings().skipSites || []);
    const on = all.filter(name => !skip.has(name));
    return on.length ? on : all;
}

function siteLabel(domain) {
    return domain === ALL_SITES ? 'all sites' : domain;
}

function anySiteLabel(domain) {
    return domain === ALL_SITES ? 'any site' : domain;
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
        tags: (userTags, ratings, noOrder, exclude = []) => [...userTags, 'sort:score:desc', ...exclude.slice(0, 8).map(tag => `-${tag}`), ...ratingNegatives(ratings, { general: ['general', 'safe'], sensitive: ['sensitive'], questionable: ['questionable'], explicit: ['explicit'] })],
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
        parentId: post => (Number(post.parent_id) > 0 ? String(post.parent_id) : ''),
        hasChildren: post => post.has_children === true || post.has_children === 'true',
        md5: post => String(post.md5 || post.hash || ''),
        family: root => [[`parent:${root}`], [`id:${root}`]],
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
        parentId: post => (Number(post.parent_id) > 0 ? String(post.parent_id) : ''),
        hasChildren: post => Boolean(post.has_active_children ?? post.has_children),
        md5: post => String(post.md5 || ''),
        family: root => [[`parent:${root}`]],
        rating: post => ({ g: 'general', s: 'sensitive', q: 'questionable', e: 'explicit' }[String(post.rating || '').toLowerCase()] || ''),
        postTags: post => tagList(post.tag_string),
    },
    e621: {
        cap: 6,
        pageSize: 100,
        url: (origin, tags, extra, page) => `${origin}/posts.json?limit=100&page=${page + 1}&tags=${encodeURIComponent(tags.join(' '))}${extra}`,
        tags: (userTags, ratings, noOrder, exclude = []) => [...userTags, 'order:score', ...exclude.slice(0, 10).map(tag => `-${tag}`), ...ratingNegatives(ratings, { general: ['s'], questionable: ['q'], explicit: ['e'] })],
        parse: result => (result.ok && result.data && Array.isArray(result.data.posts) ? result.data.posts : null),
        image: (post, origin) => absolute(post.sample?.url, origin) || absolute(post.file?.url, origin),
        full: (post, origin) => absolute(post.file?.url, origin),
        thumb: (post, origin) => absolute(post.preview?.url, origin),
        postUrl: (post, origin) => `${origin}/posts/${post.id}`,
        siteUrl: (origin, tags) => `${origin}/posts?tags=${encodeURIComponent(tags.join(' '))}`,
        parentId: post => (Number(post.relationships?.parent_id) > 0 ? String(post.relationships.parent_id) : ''),
        hasChildren: post => Boolean(post.relationships?.has_active_children || post.relationships?.has_children || post.relationships?.children?.length),
        md5: post => String(post.file?.md5 || ''),
        family: root => [[`parent:${root}`], [`id:${root}`]],
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
        parentId: post => (Number(post.parent_id) > 0 ? String(post.parent_id) : ''),
        hasChildren: post => Boolean(post.has_children),
        md5: post => String(post.md5 || ''),
        family: root => [[`parent:${root}`], [`id:${root}`]],
        siteUrl: (origin, tags) => `${origin}/post?tags=${encodeURIComponent(tags.join(' '))}`,
        rating: post => ({ s: 'general', q: 'questionable', e: 'explicit' }[String(post.rating || '').toLowerCase()] || ''),
        postTags: post => tagList(post.tags),
    },
    philomena: {
        cap: 5,
        pageSize: 50,
        url: (origin, tags, extra, page) => `${origin}/api/v1/json/search/images?per_page=50&page=${page + 1}&sf=score&sd=desc&q=${encodeURIComponent(tags.length ? tags.join(', ') : '*')}${extra}`,
        tags: (userTags, ratings, noOrder, exclude = []) => [...userTags.map(tag => tag.replace(/_/g, ' ')), ...exclude.slice(0, 6).map(tag => `-${tag.replace(/_/g, ' ')}`), ...(onlyGeneral(ratings) ? ['safe'] : [])],
        parse: result => (result.ok && result.data && Array.isArray(result.data.images) ? result.data.images : null),
        image: (post, origin) => absolute(post.representations?.large, origin) || absolute(post.representations?.full, origin) || absolute(post.view_url, origin),
        full: (post, origin) => absolute(post.representations?.full, origin) || absolute(post.view_url, origin),
        thumb: (post, origin) => absolute(post.representations?.thumb, origin) || absolute(post.representations?.thumb_small, origin),
        postUrl: (post, origin) => `${origin}/images/${post.id}`,
        parentId: () => '',
        hasChildren: () => false,
        md5: post => String(post.orig_sha512_hash || post.sha512_hash || ''),
        family: () => [],
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

function postsToItems(engineName, posts, origin, ratings, localTags, stats, exclude = new Set(excludedTags())) {
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
        if (tags.some(tag => BLOCKED_TAGS.has(tag) || exclude.has(tag) || isCleanupTag(tag))) {
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
        const postId = String(post.id ?? '');
        const parentId = engine.parentId(post);
        items.push({
            img,
            thumb: thumb || img,
            alts,
            page: engine.postUrl(post, origin),
            tags,
            domain: origin.replace(/^https?:\/\//, ''),
            postId,
            parentId,
            hasChildren: engine.hasChildren(post),
            md5: engine.md5(post),
            root: parentId || postId,
        });
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
    const caps = domainsFor(domain).map(d => ENGINES[settings().engines[d]]?.cap).filter(Boolean);
    return caps.length ? Math.min(...caps) : 0;
}

function defaultRequired(tags) {
    const value = Number(settings().requiredCount);
    const count = Number.isFinite(value) ? Math.max(0, value) : 2;
    return tags.slice(0, count);
}

async function fetchPage(entry, engineName, required, page, wanted = required) {
    const s = settings();
    const engine = ENGINES[engineName];
    const origin = `https://${entry.domain}`;
    const siteTags = required.slice(0, engine.cap);
    const localTags = required.slice(engine.cap);
    const exclude = excludedTags(wanted);
    let noOrder = noOrderSites.has(entry.domain);
    for (let attempt = 0; attempt < 2; attempt++) {
        const query = engine.tags(siteTags, s.ratings, noOrder, exclude);
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
        const items = postsToItems(engineName, posts, origin, s.ratings, localTags, stats, new Set(exclude));
        const debug = {
            domain: entry.domain,
            page,
            apiUrl: engine.url(origin, query, entry.extra, page),
            siteUrl: engine.siteUrl(origin, engine.tags([...siteTags, ...localTags], s.ratings, noOrder, exclude)),
            localTags,
            received: posts.length,
            kept: items.length,
            ...stats,
        };
        return { items, done: posts.length < engine.pageSize, debug };
    }
    return { items: [], done: true, debug: null };
}

const families = new Map();

function familyKey(item) {
    return `${item.domain}:${item.root || item.postId || item.img}`;
}

function mayHaveFamily(item) {
    return Boolean(item.parentId || item.hasChildren);
}

function supportsFamily(item) {
    const engine = ENGINES[settings().engines[item.domain]];
    return Boolean(engine && (item.root || item.postId) && engine.family(item.root || item.postId).length);
}

async function fetchFamily(item) {
    const key = familyKey(item);
    if (families.has(key)) {
        return families.get(key);
    }
    const promise = (async () => {
        const s = settings();
        const entry = siteEntries().find(e => e.domain === item.domain);
        const engineName = s.engines[item.domain];
        const engine = ENGINES[engineName];
        if (!entry || !engine || !item.root) {
            return [item];
        }
        const origin = `https://${entry.domain}`;
        const noOrder = noOrderSites.has(entry.domain);
        const found = [];
        const isRoot = !item.parentId && item.postId === item.root;
        const queries = engine.family(item.root).filter(tags => !(isRoot && tags.some(tag => tag.startsWith('id:'))));
        const results = await Promise.allSettled(queries.map(async tags => {
            const result = await request(engine.url(origin, engine.tags(tags, s.ratings, noOrder, excludedTags()), entry.extra, 0));
            const posts = engine.parse(result);
            return posts ? postsToItems(engineName, posts, origin, s.ratings, [], { rating: 0, excluded: 0, local: 0, notImage: 0 }) : [];
        }));
        results.forEach(result => result.status === 'fulfilled' && found.push(...result.value));
        const seen = new Set();
        const members = [item, ...found].filter(member => {
            if (seen.has(member.img)) {
                return false;
            }
            seen.add(member.img);
            return true;
        });
        members.sort((a, b) => (a.postId === item.root ? -1 : b.postId === item.root ? 1 : Number(a.postId) - Number(b.postId)));
        return members;
    })();
    families.set(key, promise);
    promise.catch(() => families.delete(key));
    return promise;
}

function createBrowse(domain, tags, required) {
    const req = tags.filter(tag => required.includes(tag));
    const browse = { domain, tags: [...tags], required: req, preferred: tags.filter(tag => !req.includes(tag)), page: 0, items: [], seen: new Set(), done: false, loading: null, error: '', engine: '', pages: [], subs: null, siteErrors: [], scope: searchScope(domain) };
    if (domain === ALL_SITES) {
        browse.subs = domainsFor(ALL_SITES).map(name => createBrowse(name, tags, required));
    }
    return browse;
}

function searchScope(domain) {
    return `${domainsFor(domain).join(',')}|${excludedTags().join(',')}`;
}

function sameTags(a, b) {
    return a.length === b.length && a.every((tag, i) => tag === b[i]);
}

function sameSearch(browse, domain, tags, required) {
    return Boolean(browse) && browse.domain === domain && browse.scope === searchScope(domain) && sameTags(browse.tags, tags) && sameTags(browse.required, tags.filter(tag => required.includes(tag)));
}

function sameRequired(browse, domain, tags, required) {
    return Boolean(browse) && browse.domain === domain && browse.scope === searchScope(domain) && sameTags(browse.required, tags.filter(tag => required.includes(tag)));
}

function rankItems(items, preferred) {
    const count = preferred.length;
    for (const item of items) {
        const have = new Set(item.tags || []);
        let score = 0;
        let matched = 0;
        preferred.forEach((tag, index) => {
            if (have.has(tag)) {
                score += count - index;
                matched++;
            }
        });
        item.score = score;
        item.matched = matched;
    }
    if (!count) {
        return items;
    }
    return items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => b.item.score - a.item.score || a.index - b.index)
        .map(entry => entry.item);
}

function rerankBrowse(old, tags, required) {
    const next = createBrowse(old.domain, tags, required);
    Object.assign(next, { page: old.page, seen: old.seen, done: old.done, error: old.error, engine: old.engine, pages: old.pages, siteErrors: old.siteErrors });
    if (old.subs) {
        next.subs = old.subs.map(sub => rerankBrowse(sub, tags, required));
    }
    next.items = rankItems(old.items.slice(), next.preferred);
    return next;
}

async function loadMoreAll(browse) {
    const active = browse.subs.filter(sub => !sub.done);
    const results = await Promise.allSettled(active.map(sub => loadMore(sub)));
    const merged = [];
    results.forEach((result, site) => {
        if (result.status === 'fulfilled') {
            result.value.forEach((item, rank) => merged.push({ item, rank, site }));
        }
    });
    merged.sort((a, b) => (b.item.score || 0) - (a.item.score || 0) || a.rank - b.rank || a.site - b.site);
    const added = [];
    for (const { item } of merged) {
        const key = item.md5 || item.img;
        if (browse.seen.has(key)) {
            continue;
        }
        browse.seen.add(key);
        browse.items.push(item);
        added.push(item);
    }
    browse.pages = browse.subs.flatMap(sub => sub.pages);
    browse.done = browse.subs.every(sub => sub.done);
    browse.siteErrors = browse.subs.filter(sub => sub.error).map(sub => `${sub.domain}: ${sub.error}`);
    if (browse.subs.length && browse.siteErrors.length === browse.subs.length) {
        throw new Error(browse.siteErrors.join(' | '));
    }
    return added;
}

async function loadMore(browse) {
    if (browse.loading) {
        return browse.loading;
    }
    if (browse.done) {
        return [];
    }
    browse.loading = (async () => {
        if (browse.subs) {
            return loadMoreAll(browse);
        }
        const entry = siteEntries().find(e => e.domain === browse.domain);
        if (!entry) {
            throw new Error(`${browse.domain} is not in the approved sites.`);
        }
        const engineName = await engineOf(entry, browse.required.length ? browse.required : browse.tags);
        browse.engine = engineName;
        if (NOT_BOARD.has(engineName) || !ENGINES[engineName]) {
            throw new Error(`${browse.domain} is not an image board this extension can search.`);
        }
        const batch = [];
        let received = 0;
        let calls = 0;
        while (!browse.done && received < RANK_WINDOW && calls < MAX_PAGE_CALLS) {
            calls++;
            const { items, done, debug } = await fetchPage(entry, engineName, browse.required, browse.page, [...browse.required, ...browse.preferred]);
            if (debug) {
                browse.pages.push(debug);
                received += debug.received;
            }
            browse.page++;
            browse.done = done;
            for (const item of items) {
                if (!browse.seen.has(item.img)) {
                    browse.seen.add(item.img);
                    batch.push(item);
                }
            }
        }
        const ranked = rankItems(batch, browse.preferred);
        browse.items.push(...ranked);
        return ranked;
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

function fillNames(text, charName) {
    const c = ctx();
    return String(text || '')
        .replace(/\{\{char\}\}/gi, charName || c.name2 || 'the character')
        .replace(/\{\{user\}\}/gi, c.name1 || 'the user');
}

function appearanceExcerpt(text, limit) {
    const sentences = String(text || '')
        .replace(/<[^>]+>/g, ' ')
        .split(/(?<=[.!?])\s+|\n+/);
    const picked = [];
    let size = 0;
    for (const sentence of sentences) {
        const clean = sentence.replace(/\s+/g, ' ').trim();
        if (clean.length < 8 || !APPEARANCE_WORDS.test(clean)) {
            continue;
        }
        const piece = clean.length > limit ? `${clean.slice(0, limit - 1)}…` : clean;
        if (picked.length && size + piece.length > limit) {
            break;
        }
        picked.push(piece);
        size += piece.length + 1;
    }
    return picked.join(' ');
}

function cardAppearances() {
    const c = ctx();
    const characters = Array.isArray(c.characters) ? c.characters : [];
    let members = [];
    if (c.groupId) {
        const group = (c.groups || []).find(g => String(g?.id) === String(c.groupId));
        members = (group?.members || []).map(avatar => characters.find(ch => ch?.avatar === avatar)).filter(Boolean);
    } else if (c.characterId !== undefined && c.characterId !== null && characters[c.characterId]) {
        members = [characters[c.characterId]];
    }
    const lines = [];
    for (const character of members.slice(0, 4)) {
        const text = appearanceExcerpt(fillNames(character.description || character.data?.description || '', character.name), 500);
        if (text) {
            lines.push(`${character.name} (character card): ${text}`);
        }
    }
    const persona = appearanceExcerpt(fillNames(c.powerUserSettings?.persona_description || '', c.name2), 400);
    if (persona) {
        lines.push(`${c.name1 || 'User'} (persona): ${persona}`);
    }
    return lines;
}

function buildTagRequest() {
    const s = settings();
    const c = ctx();
    const count = Math.max(1, Number(s.contextMessages) || 6);
    const chars = Math.max(100, Number(s.contextChars) || 500);
    const lines = (c.chat || [])
        .filter(m => m && !m.is_system && typeof m.mes === 'string' && m.mes.trim())
        .slice(-count)
        .map(m => {
            const text = cleanForPrompt(m.mes);
            return `${m.name || (m.is_user ? 'User' : 'Character')}: ${text.length > chars ? '…' + text.slice(-chars) : text}`;
        });
    const cards = s.useCards ? cardAppearances() : [];
    const avoid = [...suggestBlacklist()].slice(0, 40);
    const known = parseLooks().map(look => look.name).slice(0, 30);
    const notes = [
        known.length ? `If the person is one of these characters, write the name exactly like this: ${known.join(', ')}.` : '',
        avoid.length ? `Never use these tags: ${avoid.join(', ')}.` : '',
    ].filter(Boolean);
    const context = [
        notes.join('\n'),
        cards.length ? `What the cards say about appearance:\n${cards.join('\n')}` : '',
        `Latest messages:\n${lines.join('\n')}`,
    ].filter(Boolean).join('\n\n');
    const prompt = String(s.tagPrompt || DEFAULT_TAG_PROMPT)
        .replace(/\{\{max\}\}/g, String(maxSuggested()))
        .replace(/\{\{char\}\}/g, c.name2 || 'the main character')
        .replace(/\{\{context\}\}/g, () => context);
    return { prompt, evidence: [...cards, ...lines].join('\n') };
}

function normalizeEvidence(text) {
    return String(text || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

function quoteSupported(quote, haystack, words) {
    const needle = normalizeEvidence(quote);
    if (!needle) {
        return false;
    }
    if (` ${haystack} `.includes(` ${needle} `) || (needle.length >= 8 && haystack.includes(needle))) {
        return true;
    }
    const parts = needle.split(' ').filter(Boolean);
    const content = parts.filter(part => part.length >= 3 && !STOP_WORDS.has(part));
    const counted = content.length ? content : parts;
    const known = part => words.has(part) || (part.length >= 4 && [...words].some(word => word.length >= 4 && (part.startsWith(word) || word.startsWith(part))));
    const hits = counted.filter(known).length;
    return hits > 0 && hits / counted.length >= 0.7;
}

function readSuggestionLines(body) {
    const found = [];
    for (const line of String(body || '').split('\n')) {
        if (!line.trim()) {
            continue;
        }
        const quoted = line.match(/^\s*(?:[-*•]+|\d+[.)])?\s*([^,"“”«]+?)\s*(?:=|:|—|–|-)?\s*["“”«]([^"“”»]+)["“”»]/);
        if (quoted) {
            found.push({ raw: quoted[1].replace(/[=:—–-]+$/, '').trim(), quote: quoted[2].trim() });
            continue;
        }
        for (const part of line.split(',')) {
            if (part.trim()) {
                found.push({ raw: part, quote: '' });
            }
        }
    }
    return found;
}

function parseLooks(text = settings().characterLooks) {
    const looks = [];
    for (const line of String(text || '').split('\n')) {
        const colon = line.indexOf(':');
        if (colon <= 0) {
            continue;
        }
        const name = line.slice(0, colon).trim();
        const tags = [];
        const mustHave = [];
        for (const part of line.slice(colon + 1).split(',')) {
            const trimmed = part.trim();
            const tag = normalizeTag(trimmed.replace(/^!+/, ''));
            if (!tag || tags.includes(tag)) {
                continue;
            }
            tags.push(tag);
            if (trimmed.startsWith('!')) {
                mustHave.push(tag);
            }
        }
        if (name && tags.length) {
            looks.push({ name, tags, required: mustHave.length ? mustHave : defaultRequired(tags) });
        }
    }
    return looks;
}

function findLook(name, looks = parseLooks()) {
    const key = String(name || '').trim().toLowerCase();
    if (!key) {
        return null;
    }
    const first = key.split(/\s+/)[0];
    return looks.find(look => look.name.toLowerCase() === key)
        || looks.find(look => look.name.toLowerCase().split(/\s+/)[0] === first)
        || null;
}

function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mentionedLooks(looks = parseLooks()) {
    const text = recentText(2);
    return looks.filter(look => {
        const names = [look.name, look.name.split(/\s+/)[0]].filter(name => name.length >= 3);
        return names.some(name => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(name)}($|[^\\p{L}\\p{N}])`, 'iu').test(text));
    });
}

function saveLook(name, tags, requiredList) {
    const s = settings();
    const cleanName = String(name || '').replace(/[:\n]/g, ' ').trim();
    if (!cleanName || !tags.length) {
        return null;
    }
    const line = `${cleanName}: ${tags.map(tag => (requiredList.includes(tag) ? '!' : '') + tag).join(', ')}`;
    const lines = String(s.characterLooks || '').split('\n').filter(row => row.trim());
    const index = lines.findIndex(row => row.indexOf(':') > 0 && row.slice(0, row.indexOf(':')).trim().toLowerCase() === cleanName.toLowerCase());
    if (index >= 0) {
        lines[index] = line;
    } else {
        lines.push(line);
    }
    s.characterLooks = lines.join('\n');
    save();
    const box = document.getElementById('st_imagesearch_looks');
    if (box) {
        box.value = s.characterLooks;
    }
    return findLook(cleanName);
}

function storyNames() {
    const c = ctx();
    const names = [c.name1, c.name2, ...(c.chat || []).slice(-30).map(m => m?.name), ...parseLooks().map(look => look.name)];
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

function splitSuggestion(text) {
    const clean = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, ' ');
    const subjectMatch = clean.match(/^\s*\**subject\**\s*:\s*(.*)$/im);
    let subject = subjectMatch ? subjectMatch[1].replace(/[*"'`]/g, '').replace(/[.,;]+$/, '').trim() : '';
    if (/^(none|unknown|n\/a|nobody|no one|-)$/i.test(subject)) {
        subject = '';
    }
    const rest = subjectMatch ? clean.slice(0, subjectMatch.index) + clean.slice(subjectMatch.index + subjectMatch[0].length) : clean;
    const tagsMatch = rest.match(/^\s*\**tags?\**\s*:\s*([\s\S]*)$/im);
    return { subject: subject.slice(0, 60), body: tagsMatch ? tagsMatch[1] : rest };
}

function parseSuggestion(text, evidenceText = null) {
    const limit = maxSuggested() + 2;
    const names = storyNames();
    const banned = suggestBlacklist();
    const { subject, body } = splitSuggestion(text);
    const entries = readSuggestionLines(body);
    const anyQuote = entries.some(entry => entry.quote);
    const checkEvidence = evidenceText !== null && settings().requireEvidence && anyQuote;
    const haystack = normalizeEvidence(evidenceText || '');
    const words = new Set(haystack.split(' ').filter(Boolean));
    const seen = new Set();
    const tags = [];
    const dropped = [];
    const evidence = {};
    for (const entry of entries) {
        let tag = normalizeTag(entry.raw.replace(/^\s*(?:[-*#•]+|\d+[.)])\s*/, '').replace(/["'`[\]*]/g, ''));
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
        if (checkEvidence && !entry.quote) {
            dropped.push(`${tag} (no quote)`);
            continue;
        }
        if (checkEvidence && !quoteSupported(entry.quote, haystack, words)) {
            dropped.push(`${tag} (quote not in the story: "${entry.quote.slice(0, 60)}")`);
            continue;
        }
        seen.add(tag);
        if (entry.quote) {
            evidence[tag] = entry.quote;
        }
        if (tags.length < limit) {
            tags.push(tag);
        }
    }
    return { tags, dropped, subject, evidence, noQuotes: evidenceText !== null && settings().requireEvidence && !anyQuote && entries.length > 0 };
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
    const request = buildTagRequest();
    const messages = [{ role: 'user', content: request.prompt }];
    const prompt = service.constructPrompt(messages, s.tagProfile);
    const result = await service.sendRequest(s.tagProfile, prompt, Math.max(16, Number(s.tagMaxTokens) || 250), { stream: false, signal, extractData: true, includePreset: false, includeInstruct: true }, { temperature: 0.2 });
    const text = typeof result === 'string' ? result : result?.content || '';
    const { tags, dropped, subject, evidence, noQuotes } = parseSuggestion(text, request.evidence);
    if (noQuotes) {
        dropped.push('(the model gave no quotes, so nothing could be checked)');
    }
    if (!tags.length && !findLook(subject)) {
        const usedReasoning = typeof result === 'object' && result?.reasoning;
        throw new Error(usedReasoning ? 'The tag model spent its tokens thinking and gave no tags. Use a non-thinking model or raise the token limit.' : 'The tag model gave no usable tags.');
    }
    return { tags, dropped, subject, evidence, raw: String(text).trim().slice(0, 600) };
}

function tagKey(domain, tag) {
    return `${domain}|${tag}`;
}

function knownCount(domain, tag) {
    if (domain === ALL_SITES) {
        let best = null;
        for (const d of domainsFor(ALL_SITES)) {
            const value = knownCount(d, tag);
            if (value !== null) {
                best = best === null ? value : Math.max(best, value);
            }
        }
        return best;
    }
    const value = tagCounts.get(tagKey(domain, tag));
    return value === undefined ? null : value;
}

async function lookupTagsFor(domain, tags) {
    await Promise.all(domainsFor(domain).map(async d => {
        const entry = siteEntries().find(e => e.domain === d);
        if (!entry) {
            return;
        }
        const engineName = await engineOf(entry, tags).catch(() => '');
        if (ENGINES[engineName]) {
            await lookupTags(d, engineName, tags);
        }
    }));
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

const TAG_SEARCH = {
    gelbooru: [
        (origin, prefix, extra) => [`${prefix}%`, `%${prefix}%`].map(pattern => `${origin}/index.php?page=dapi&s=tag&q=index&json=1&limit=40&orderby=count&order=DESC&name_pattern=${encodeURIComponent(pattern)}${extra}`),
        (origin, prefix) => `${origin}/autocomplete.php?q=${encodeURIComponent(prefix)}`,
        (origin, prefix) => `${origin}/index.php?page=autocomplete2&type=tag_query&limit=20&term=${encodeURIComponent(prefix)}`,
    ],
    danbooru: [
        (origin, prefix, extra) => `${origin}/tags.json?limit=40&search%5Border%5D=count&search%5Bhide_empty%5D=yes&search%5Bname_matches%5D=${encodeURIComponent(`*${prefix}*`)}${extra}`,
    ],
    e621: [
        (origin, prefix, extra) => `${origin}/tags.json?limit=40&search%5Border%5D=count&search%5Bhide_empty%5D=yes&search%5Bname_matches%5D=${encodeURIComponent(`*${prefix}*`)}${extra}`,
    ],
    moebooru: [
        (origin, prefix, extra) => `${origin}/tag.json?limit=40&order=count&name_pattern=${encodeURIComponent(prefix)}${extra}`,
    ],
    philomena: [
        (origin, prefix, extra) => `${origin}/api/v1/json/search/tags?per_page=40&sf=images&sd=desc&q=${encodeURIComponent(`name:*${prefix.replace(/_/g, ' ')}*`)}${extra}`,
        (origin, prefix, extra) => `${origin}/api/v1/json/search/tags?per_page=40&q=${encodeURIComponent(`name:${prefix.replace(/_/g, ' ')}*`)}${extra}`,
    ],
};

const completions = new Map();
const completeMode = new Map();

function readCompletions(result) {
    if (!result?.ok) {
        return null;
    }
    const data = result.data;
    const list = Array.isArray(data) ? data : Array.isArray(data?.tag) ? data.tag : Array.isArray(data?.tags) ? data.tags : null;
    if (!list) {
        return readTagList(result);
    }
    const out = [];
    for (const item of list) {
        if (typeof item === 'string') {
            out.push({ name: normalizeTag(item), count: 0 });
            continue;
        }
        if (!item || typeof item !== 'object') {
            continue;
        }
        const label = String(item.label ?? '');
        const counted = label.match(/\((\d+)\)\s*$/);
        const name = item.name ?? item.value ?? label.replace(/\s*\(\d+\)\s*$/, '');
        const count = Number(item.count ?? item.post_count ?? item.images ?? (counted ? counted[1] : 0)) || 0;
        if (typeof name === 'string' && name) {
            out.push({ name: normalizeTag(name), count });
        }
    }
    return out;
}

async function completeFrom(domain, prefix) {
    const entry = siteEntries().find(e => e.domain === domain);
    if (!entry) {
        return [];
    }
    const engineName = settings().engines[domain] || await engineOf(entry, [prefix]).catch(() => '');
    const builders = TAG_SEARCH[engineName];
    const start = completeMode.get(domain) ?? 0;
    if (!builders || start >= builders.length) {
        return [];
    }
    const origin = `https://${domain}`;
    let empty = false;
    let answered = false;
    for (let index = start; index < builders.length; index++) {
        const urls = [builders[index](origin, prefix, entry.extra)].flat();
        const results = await Promise.allSettled(urls.map(url => request(url)));
        let list = null;
        for (const result of results) {
            if (result.status !== 'fulfilled') {
                continue;
            }
            answered = true;
            const part = readCompletions(result.value);
            if (part) {
                list = [...(list || []), ...part];
            }
        }
        if (!list) {
            continue;
        }
        if (!list.length) {
            empty = true;
            continue;
        }
        const matching = list.filter(item => item.name.includes(prefix));
        if (matching.length) {
            completeMode.set(domain, index);
            matching.forEach(item => {
                if (item.count && knownCount(domain, item.name) === null) {
                    tagCounts.set(tagKey(domain, item.name), item.count);
                }
            });
            return matching;
        }
    }
    if (answered && !empty) {
        completeMode.set(domain, builders.length);
    }
    return [];
}

function localCompletions(prefix) {
    const counts = new Map();
    const add = tag => {
        if (tag && tag.includes(prefix)) {
            counts.set(tag, (counts.get(tag) || 0) + 1);
        }
    };
    library.entries.forEach(entry => entry.tags.forEach(add));
    (settings().lastTags || []).forEach(add);
    for (const key of tagCounts.keys()) {
        add(key.slice(key.indexOf('|') + 1));
    }
    return [...counts.keys()].map(name => ({ name, count: 0, local: counts.get(name) }));
}

function rankCompletions(list, prefix) {
    const place = name => name.startsWith(prefix) ? 0 : name.includes(`_${prefix}`) ? 1 : 2;
    return list.sort((a, b) => place(a.name) - place(b.name) || b.count - a.count || (b.local || 0) - (a.local || 0) || a.name.length - b.name.length || a.name.localeCompare(b.name));
}

function usableCompletion(name) {
    return name && !BLOCKED_TAGS.has(name) && !isCleanupTag(name);
}

async function completeTag(domain, typed) {
    const prefix = normalizeTag(typed);
    if (prefix.length < 2) {
        return [];
    }
    const key = `${domain}|${prefix}`;
    if (!completions.has(key)) {
        const work = Promise.all(domainsFor(domain).map(d => completeFrom(d, prefix).catch(() => []))).then(lists => {
            const merged = new Map();
            lists.flat().forEach(item => {
                const known = merged.get(item.name);
                if (!known || item.count > known.count) {
                    merged.set(item.name, item);
                }
            });
            let list = [...merged.values()].filter(item => usableCompletion(item.name));
            if (!list.length) {
                list = localCompletions(prefix).filter(item => usableCompletion(item.name));
                completions.delete(key);
            }
            return rankCompletions(list, prefix).slice(0, 8);
        });
        completions.set(key, work);
    }
    return completions.get(key);
}

function formatCount(count) {
    if (count >= 1e6) {
        return `${Number((count / 1e6).toFixed(count >= 1e7 ? 0 : 1))}M`;
    }
    if (count >= 1e3) {
        return `${Number((count / 1e3).toFixed(count >= 1e4 ? 0 : 1))}k`;
    }
    return String(count);
}

async function checkSuggested(domain, suggestion) {
    const tags = [...suggestion.tags];
    const dropped = [...suggestion.dropped];
    await lookupTagsFor(domain, tags);
    const minimum = Math.max(0, Number(settings().minTagPosts) || 0);
    const kept = tags.filter(tag => {
        const count = knownCount(domain, tag);
        if (count === 0) {
            dropped.push(`${tag} (not on ${anySiteLabel(domain)})`);
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
    completions.clear();
    completeMode.clear();
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
    const entry = { chatId: currentChatId(), controller: new AbortController(), tags: null, required: [], aiTags: [], aiRequired: [], subject: '', lookName: '', browse: null, error: '', raw: '', dropped: [] };
    entry.promise = (async () => {
        try {
            const suggestion = await suggestTags(entry.controller.signal);
            if (entry.controller.signal.aborted) {
                return;
            }
            entry.raw = suggestion.raw;
            entry.subject = suggestion.subject;
            entry.evidence = suggestion.evidence || {};
            const domain = activeDomain();
            const checked = domain && suggestion.tags.length ? await checkSuggested(domain, suggestion) : suggestion;
            if (entry.controller.signal.aborted) {
                return;
            }
            entry.dropped = checked.dropped;
            entry.aiTags = checked.tags;
            entry.aiRequired = defaultRequired(checked.tags);
            const look = findLook(suggestion.subject);
            if (look) {
                entry.lookName = look.name;
                entry.tags = look.tags;
                entry.required = look.required;
            } else {
                if (!checked.tags.length) {
                    throw new Error(`None of the suggested tags exist on ${anySiteLabel(domain)}.`);
                }
                entry.tags = checked.tags;
                entry.required = entry.aiRequired;
            }
            if (domain) {
                entry.browse = createBrowse(domain, entry.tags, entry.required);
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

async function fetchImageBlob(downloadUrl, variant, route) {
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
    return { blob, format };
}

async function downloadImage(url) {
    const errors = [];
    const viaFetcher = fetcherLink(url);
    if (viaFetcher) {
        try {
            return await fetchImageBlob(viaFetcher, {}, 'fetcher');
        } catch (error) {
            errors.push(`Cloudflare fetcher: ${error?.message || error}`);
        }
    }
    for (const variant of ACCEPT_VARIANTS) {
        try {
            return await fetchImageBlob(proxyUrl(url), variant, 'proxy');
        } catch (error) {
            errors.push(String(error?.message || error));
            if (!/web page instead/.test(String(error?.message))) {
                break;
            }
        }
    }
    throw new Error(errors.join(' | '));
}

async function shrinkImage(picture) {
    if (typeof createImageBitmap !== 'function') {
        return picture;
    }
    try {
        const bitmap = await createImageBitmap(picture.blob);
        const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
        if (scale === 1 && picture.format === 'jpg' && picture.blob.size < 600000) {
            bitmap.close?.();
            return picture;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close?.();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        return blob ? { blob, format: 'jpg' } : picture;
    } catch {
        return picture;
    }
}

async function uploadImage(picture) {
    const image = await blobToBase64(picture.blob);
    const upload = await fetch('/api/images/upload', {
        method: 'POST',
        headers: ctx().getRequestHeaders(),
        body: JSON.stringify({ image, format: picture.format, ch_name: 'imagesearch', filename: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }),
    });
    if (!upload.ok) {
        throw new Error(`SillyTavern could not save the picture (${upload.status}).`);
    }
    const data = await upload.json();
    return `/${String(data.path).replace(/\\/g, '/').replace(/^\/+/, '')}`;
}

const downloads = new Map();

function prepareDownload(item) {
    const key = item.img;
    if (downloads.has(key)) {
        return downloads.get(key);
    }
    const promise = (async () => {
        const errors = [];
        for (const url of [item.img, ...(item.alts || [])]) {
            try {
                return await shrinkImage(await downloadImage(url));
            } catch (error) {
                errors.push(`${url}: ${error?.message || error}`);
            }
        }
        throw new Error(errors.join(' | '));
    })();
    downloads.set(key, promise);
    promise.catch(() => downloads.delete(key));
    while (downloads.size > 8) {
        downloads.delete(downloads.keys().next().value);
    }
    return promise;
}

async function saveBest(item) {
    try {
        const picture = await prepareDownload(item);
        const src = await uploadImage(picture);
        return { src, blob: picture.blob, lines: [] };
    } catch (error) {
        return { src: '', blob: null, lines: [String(error?.message || error)] };
    }
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
    box.setSelectionRange(caret, caret);
    box.dispatchEvent(new Event('input', { bubbles: true }));
}

function summaryTags(tags) {
    return [...new Set((tags || []).map(normalizeTag))]
        .filter(tag => tag && !META_TAG.test(tag) && !EXCLUDED_TAGS.has(tag))
        .slice(0, 60);
}

async function imageDataUrl(url, source = null, maxSide = 1024) {
    let blob = source;
    if (!blob) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Could not read the saved picture (${response.status}).`);
        }
        blob = await response.blob();
    }
    try {
        const bitmap = await createImageBitmap(blob);
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
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

function parseKeywords(text) {
    const seen = new Set();
    return String(text || '')
        .split(/[,;\n]/)
        .map(word => word.toLowerCase().replace(/[^a-z0-9' -]/g, '').replace(/\s+/g, ' ').trim())
        .filter(word => word.length >= 3 && word.length <= 30 && !STOP_WORDS.has(word) && !seen.has(word) && seen.add(word))
        .slice(0, 8);
}

function renderSections(sections) {
    return SECTIONS.filter(([key]) => sections?.[key]).map(([key, label]) => `${label}: ${sections[key]}`).join('\n');
}

function parseDescription(raw) {
    const labels = 'visual|expression|action|atmosphere|framing|keywords?|description|variant\\s*\\d+|version\\s*\\d+|picture\\s*\\d+|step\\s*\\d+';
    const marks = [...String(raw || '').matchAll(new RegExp(`^[\\s*#>-]*\\**(${labels})\\**\\s*:\\s*(?:\\*\\*\\s*)?`, 'gim'))];
    const sections = {};
    const variants = {};
    let keywords = [];
    const source = String(raw || '');
    let plain = marks.length ? source.slice(0, marks[0].index) : source;
    marks.forEach((mark, index) => {
        const label = mark[1].toLowerCase().replace(/\s+/g, ' ');
        const end = index + 1 < marks.length ? marks[index + 1].index : source.length;
        const content = source.slice(mark.index + mark[0].length, end).replace(/\s+/g, ' ').trim();
        if (label.startsWith('keyword')) {
            keywords = parseKeywords(content);
        } else if (label === 'description') {
            plain += ` ${content}`;
        } else if (/^(variant|version|picture|step) \d+$/.test(label)) {
            variants[Number(label.split(' ')[1])] = content.slice(0, 500);
        } else if (content) {
            sections[label] = content.slice(0, 700);
        }
    });
    const text = renderSections(sections) || String(plain).replace(/\s+/g, ' ').trim().slice(0, 1500);
    return { text, sections, keywords, variants };
}

async function requestDescription(url, tags, blob = null) {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    const profile = visionProfileId();
    if (!service || !profile) {
        throw new Error('No vision profile chosen in Image Search settings.');
    }
    const image = await imageDataUrl(url, blob);
    const prompt = String(s.visionPrompt || DEFAULT_VISION_PROMPT).replace(/\{\{tags\}\}/g, () => tags.join(', ') || 'none');
    const messages = [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }] }];
    const result = await service.sendRequest(profile, messages, Math.max(32, Number(s.visionMaxTokens) || 300), { stream: false, extractData: true, includePreset: false, includeInstruct: false }, { temperature: 0.3 });
    const raw = String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const parsed = parseDescription(raw);
    if (!parsed.text) {
        throw new Error('The vision model gave no description.');
    }
    return parsed;
}

function readyDescription(url, tags, text) {
    return { url, tags: tags || [], text: text || '', error: '', started: Date.now(), ms: 0, done: true, promise: Promise.resolve() };
}

function startDescription(url, postTags, onDone, blob = null) {
    const s = settings();
    if (!s.describe) {
        return;
    }
    const entry = { url, tags: summaryTags(postTags), text: '', sections: {}, keywords: [], error: '', started: Date.now(), ms: 0, done: false };
    entry.promise = requestDescription(url, entry.tags, blob)
        .then(({ text, keywords, sections }) => {
            entry.text = text;
            entry.keywords = keywords;
            entry.sections = sections || {};
            onDone?.(text, keywords, entry.sections);
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
                toastr.info(entry.text ? `Described in ${seconds} s: ${entry.text} Keywords: ${entry.keywords.join(', ') || 'none'}` : `Description failed after ${seconds} s: ${entry.error}. The AI gets the tags instead.`, 'Image Search debug', { timeOut: 15000 });
            }
        });
    descriptions.set(url, entry);
}

function tagsLine(tags) {
    return tags?.length ? `Tags: ${tags.join(', ').replace(/_/g, ' ')}` : '';
}

function pictureNote(entry, who = 'the user shared') {
    const tags = tagsLine(entry.tags);
    if (entry.text) {
        return `[Picture ${who}:\n${entry.text}${tags ? `\n${tags}` : ''}]`;
    }
    if (tags) {
        return `[Picture ${who}. ${tags}]`;
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
        sections: entry.sections && typeof entry.sections === 'object' ? Object.fromEntries(SECTIONS.filter(([key]) => typeof entry.sections[key] === 'string').map(([key]) => [key, entry.sections[key]])) : {},
        kind: entry.kind === 'set' || entry.kind === 'sequence' ? entry.kind : 'single',
        variants: Array.isArray(entry.variants) ? entry.variants.filter(v => v && typeof v.id === 'string' && typeof v.url === 'string').map(v => ({ id: v.id, url: v.url, source: String(v.source || ''), tags: Array.isArray(v.tags) ? v.tags.map(String) : [], diff: String(v.diff || '') })) : [],
        keywords: Array.isArray(entry.keywords) ? entry.keywords.map(String) : [],
        wiKeys: Array.isArray(entry.wiKeys) ? entry.wiKeys.map(String) : null,
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

function saveLibrary({ skipSync = false } = {}) {
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
        if (!skipSync) {
            scheduleLorebookSync();
        }
    }).catch(error => {
        console.warn('[Image Search] library save failed', error);
        toastr.warning(String(error?.message || error), 'Image Search');
    });
    return library.saving;
}

function newEntryId() {
    const ids = allIds();
    let id = '';
    do {
        id = Math.random().toString(36).slice(2, 8);
    } while (id.length < 6 || ids.has(id));
    return id;
}

function findPicture(test) {
    const ordered = [...library.entries.filter(entry => entry.kind !== 'sequence'), ...library.entries.filter(entry => entry.kind === 'sequence')];
    for (const entry of ordered) {
        if (hasVariants(entry)) {
            const variant = entry.variants.find(test);
            if (variant) {
                return { entry, variant };
            }
        } else if (test(entry)) {
            return { entry, variant: null };
        }
    }
    return null;
}

function freshIds(count) {
    const ids = allIds();
    const out = [];
    while (out.length < count) {
        const id = Math.random().toString(36).slice(2, 8);
        if (id.length === 6 && !ids.has(id)) {
            ids.add(id);
            out.push(id);
        }
    }
    return out;
}

function findBySource(source) {
    return source ? findPicture(item => item.source === source) : null;
}

function resolvePic(id) {
    return findPicture(item => item.id === id);
}

function entryForSource(source) {
    return findBySource(source)?.entry || null;
}

function entryForUrl(url) {
    return findPicture(item => item.url === url)?.entry || null;
}

function allIds() {
    const ids = new Set();
    for (const entry of library.entries) {
        ids.add(entry.id);
        entry.variants.forEach(variant => ids.add(variant.id));
    }
    return ids;
}

function hasVariants(entry) {
    return (entry?.kind === 'set' || entry?.kind === 'sequence') && Array.isArray(entry.variants) && entry.variants.length > 0;
}

function isMulti(entry) {
    return hasVariants(entry) && entry.variants.length > 1;
}

function entryUrls(entry) {
    return hasVariants(entry) ? entry.variants.map(variant => variant.url) : [entry.url];
}

function describedVariant(entry, variant) {
    if (entry.kind === 'sequence' && isMulti(entry)) {
        const index = Math.max(0, entry.variants.findIndex(item => item.id === variant?.id));
        const count = entry.variants.length;
        const current = entry.variants[index];
        const text = index === 0
            ? `Picture 1 of a ${count}-picture sequence.\n${entry.description}`
            : `Picture ${index + 1} of a ${count}-picture sequence: ${current.diff || 'the next picture.'}\nThe sequence starts with: ${shortDescription(entry)}`;
        return readyDescription(current.url, current.tags?.length ? current.tags : entry.tags, entry.description ? text : '');
    }
    const isOther = variant && entry.kind === 'set' && variant.id !== entry.variants[0]?.id;
    const text = isOther && variant.diff ? `${entry.description}\nThis version: ${variant.diff}` : entry.description;
    return readyDescription(variant?.url || entry.url, entry.tags, text);
}

function urlInUse(url) {
    return library.entries.some(entry => entryUrls(entry).includes(url));
}

async function deleteUnusedFiles(urls) {
    for (const url of new Set(urls)) {
        if (!urlInUse(url)) {
            descriptions.delete(url);
            await deleteImageFile(url);
        }
    }
}

async function deleteImageFile(url) {
    const path = String(url || '').replace(/^\/+/, '');
    if (!path.startsWith('user/images/')) {
        return false;
    }
    try {
        const response = await fetch('/api/images/delete', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ path }) });
        return response.ok || response.status === 404;
    } catch (error) {
        console.warn('[Image Search] could not delete file', url, error);
        return false;
    }
}

async function deleteEntry(entry) {
    await loadLibrary();
    const urls = entryUrls(entry);
    await removeFromLibrary(entry);
    await deleteUnusedFiles(urls);
}

async function deleteAllPictures() {
    await loadLibrary();
    const all = [...library.entries];
    all.forEach(entry => library.deleted.add(entry.id));
    library.entries = [];
    await saveLibrary();
    await deleteUnusedFiles(all.flatMap(entryUrls));
    return all.length;
}

async function removeVariant(entry, variant) {
    if (!isMulti(entry)) {
        return deleteEntry(entry);
    }
    const wasFirst = entry.variants[0].id === variant.id;
    entry.variants = entry.variants.filter(item => item.id !== variant.id);
    const main = entry.variants[0];
    if (entry.id !== main.id) {
        library.deleted.add(entry.id);
        library.deleted.delete(main.id);
    }
    entry.id = main.id;
    entry.url = main.url;
    entry.source = main.source;
    const sequence = entry.kind === 'sequence';
    if (entry.variants.length === 1) {
        entry.tags = main.tags?.length && sequence ? main.tags : entry.tags;
        entry.kind = 'single';
        entry.variants = [];
    }
    await saveLibrary();
    await deleteUnusedFiles([variant.url]);
    if (sequence && wasFirst) {
        redoEntry(entry).catch(error => console.warn('[Image Search] could not describe the sequence again', error));
    }
}

function setPrompt(tags, count) {
    const base = String(settings().visionPrompt || DEFAULT_VISION_PROMPT).replace(/\{\{tags\}\}/g, () => tags.join(', ') || 'none');
    const versions = Array.from({ length: count - 1 }, (_, i) => `Version ${i + 2}: 1 sentence on what is different in picture ${i + 2} compared to picture 1 (expression, pose, outfit, framing or what is happening)`).join('\n');
    return `You will see ${count} pictures. They are versions of the same scene; picture 1 is the main one. Describe picture 1 as asked below, then add the version lines.\n\n${base}\n\nAfter the Keywords line, add one line per other picture:\n${versions}`;
}

function sequencePrompt(tags, count) {
    const base = String(settings().visionPrompt || DEFAULT_VISION_PROMPT).replace(/\{\{tags\}\}/g, () => tags.join(', ') || 'none');
    const steps = Array.from({ length: count - 1 }, (_, i) => `Picture ${i + 2}: 1 to 2 sentences on what picture ${i + 2} shows and what happens in it compared to the picture before (who, action, expression, framing)`).join('\n');
    return `You will see ${count} pictures. They are a sequence, in this order, that the user will use to tell a story. They can come from different artists, so the same person may be drawn differently. Describe picture 1 as asked below, then add the picture lines.\n\n${base}\n\nAfter the Keywords line, add one line per other picture:\n${steps}`;
}

async function describeStep(entry, index, blob) {
    const service = ctx().ConnectionManagerRequestService;
    const image = await imageDataUrl(entry.variants[index].url, blob || null);
    const before = index === 1 ? ([entry.sections?.visual, entry.sections?.action].filter(Boolean).join(' ') || entry.description) : (entry.variants[index - 1].diff || entry.description);
    const prompt = `This picture is picture ${index + 1} of a ${entry.variants.length}-picture sequence used to tell a story. The picture before it shows: ${before}\n\nIn 1 to 2 sentences, say what this picture shows and what happens in it compared to the one before. Ignore writing in the picture, except onomatopoeia.`;
    const result = await service.sendRequest(visionProfileId(), [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }] }], 160, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, { temperature: 0.3 });
    return String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*\**(picture\s*\d+|step\s*\d+)\**\s*:\s*/i, '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

async function describeDifference(entry, index, blob) {
    const service = ctx().ConnectionManagerRequestService;
    const image = await imageDataUrl(entry.variants[index].url, blob || null);
    const scene = [entry.sections?.visual, entry.sections?.action].filter(Boolean).join(' ') || entry.description;
    const prompt = `This picture is one version of a scene described below. In 1 sentence, say only what this version shows that is different: expression, pose, outfit, framing or what is happening. Ignore writing in the picture, except onomatopoeia.\n\nThe scene: ${scene}`;
    const result = await service.sendRequest(visionProfileId(), [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }] }], 120, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, { temperature: 0.3 });
    return String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*\**(version\s*\d+|difference)\**\s*:\s*/i, '').replace(/\s+/g, ' ').trim().slice(0, 400);
}

async function describeSet(entry, blobs = []) {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    const profile = visionProfileId();
    if (!service || !profile) {
        throw new Error('No vision profile chosen in Image Search settings.');
    }
    const count = Math.min(entry.variants.length, 8);
    const sequence = entry.kind === 'sequence';
    const firstTags = sequence && entry.variants[0].tags?.length ? entry.variants[0].tags : entry.tags;
    let parsed = null;
    try {
        const images = [];
        for (let i = 0; i < count; i++) {
            images.push(await imageDataUrl(entry.variants[i].url, blobs[i] || null, count > 3 ? 768 : 1024));
        }
        const content = [{ type: 'text', text: sequence ? sequencePrompt(firstTags, count) : setPrompt(entry.tags, count) }, ...images.map(url => ({ type: 'image_url', image_url: { url } }))];
        const result = await service.sendRequest(profile, [{ role: 'user', content }], Math.max(64, Number(s.visionMaxTokens) || 700) + 80 * count, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, { temperature: 0.3 });
        parsed = parseDescription(String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim());
    } catch (error) {
        console.warn('[Image Search] set description failed, describing one picture at a time', error);
    }
    if (!parsed?.text) {
        parsed = await requestDescription(entry.variants[0].url, firstTags, blobs[0] || null);
        parsed.variants = {};
    }
    entry.description = parsed.text;
    entry.sections = parsed.sections || {};
    entry.keywords = parsed.keywords || [];
    for (let i = 1; i < entry.variants.length; i++) {
        let diff = parsed.variants?.[i + 1] || '';
        if (!diff) {
            try {
                diff = sequence ? await describeStep(entry, i, blobs[i]) : await describeDifference(entry, i, blobs[i]);
            } catch (error) {
                console.warn('[Image Search] variant description failed', error);
            }
        }
        entry.variants[i].diff = diff;
    }
    entry.variants.forEach(variant => descriptions.set(variant.url, describedVariant(entry, variant)));
    return entry;
}

async function redoEntry(entry, { save: saveNow = true } = {}) {
    if (isMulti(entry)) {
        await describeSet(entry);
    } else {
        const result = await requestDescription(entry.url, entry.tags);
        entry.description = result.text;
        entry.sections = result.sections || {};
        entry.keywords = result.keywords || [];
        descriptions.set(entry.url, readyDescription(entry.url, entry.tags, entry.description));
    }
    if (saveNow) {
        await saveLibrary();
    }
    return entry;
}

const redoState = { running: false, cancel: false, done: 0, total: 0, failed: 0 };

async function redoAll(onProgress) {
    if (redoState.running) {
        return;
    }
    await loadLibrary();
    const queue = [...library.entries];
    Object.assign(redoState, { running: true, cancel: false, done: 0, total: queue.length, failed: 0 });
    onProgress?.();
    const worker = async () => {
        while (queue.length && !redoState.cancel) {
            const entry = queue.shift();
            try {
                await redoEntry(entry, { save: false });
            } catch (error) {
                redoState.failed++;
                console.warn('[Image Search] redo failed', entry.id, error);
            }
            redoState.done++;
            if (redoState.done % 5 === 0) {
                await saveLibrary();
            }
            onProgress?.();
        }
    };
    try {
        await Promise.all([worker(), worker()]);
    } finally {
        redoState.running = false;
        await saveLibrary();
        onProgress?.();
    }
}

async function saveSet(items, searchTags) {
    await loadLibrary();
    const members = items.slice(0, 8);
    const variants = [];
    const blobs = [];
    const absorbed = [];
    let existingSet = null;
    for (const item of members) {
        const found = findBySource(item.page);
        if (found?.entry.kind === 'set') {
            existingSet = existingSet || found.entry;
        }
    }
    for (const item of members) {
        const pending = saveJobs.get(saveKey(item));
        if (pending && (pending.state === 'queued' || pending.state === 'saving')) {
            await pending.promise;
        }
        const found = findBySource(item.page);
        if (found?.entry.kind === 'set') {
            const variant = found.variant;
            variants.push({ ...variant });
            blobs.push(null);
            continue;
        }
        if (found?.entry.kind === 'sequence') {
            const [id] = freshIds(1);
            variants.push({ id, url: found.variant.url, source: item.page, tags: summaryTags(item.tags), diff: '' });
            blobs.push(null);
            continue;
        }
        if (found) {
            absorbed.push(found.entry);
            variants.push({ id: found.entry.id, url: found.entry.url, source: item.page, tags: summaryTags(item.tags), diff: '' });
            blobs.push(null);
            continue;
        }
        const { src, blob } = await saveBest(item);
        if (src) {
            const ids = allIds();
            variants.forEach(variant => ids.add(variant.id));
            let id = '';
            do {
                id = Math.random().toString(36).slice(2, 8);
            } while (id.length < 6 || ids.has(id));
            variants.push({ id, url: src, source: item.page, tags: summaryTags(item.tags), diff: '' });
            blobs.push(blob);
        }
    }
    for (let i = 0; i < variants.length; i++) {
        if (variants.slice(0, i).some(other => other.id === variants[i].id)) {
            variants[i].id = freshIds(1)[0];
        }
    }
    if (!variants.length) {
        throw new Error('None of the pictures could be saved.');
    }
    const tags = summaryTags(members.flatMap(item => item.tags || []));
    absorbed.forEach(entry => {
        library.entries = library.entries.filter(e => e.id !== entry.id);
        library.deleted.add(entry.id);
    });
    const carried = { used: absorbed.reduce((sum, e) => sum + (e.used || 0), 0), lastUsed: Math.max(0, ...absorbed.map(e => e.lastUsed || 0)), characters: [...new Set(absorbed.flatMap(e => e.characters || []))] };
    let entry = existingSet;
    if (entry) {
        const known = new Set(entry.variants.map(variant => variant.source));
        variants.filter(variant => !known.has(variant.source)).forEach(variant => entry.variants.push(variant));
        entry.tags = summaryTags([...entry.tags, ...tags]);
        entry.used += carried.used;
        entry.lastUsed = Math.max(entry.lastUsed, carried.lastUsed);
        entry.characters = [...new Set([...entry.characters, ...carried.characters])];
    } else {
        entry = cleanEntry({ id: variants[0].id, url: variants[0].url, source: variants[0].source, site: hostOf(variants[0].source), tags, searchTags, kind: 'set', variants, ...carried });
        library.deleted.delete(entry.id);
        library.entries.unshift(entry);
    }
    if (entry.variants.length < 2) {
        entry.kind = 'single';
        entry.variants = [];
    }
    await saveLibrary();
    const ordered = entry.kind === 'set' ? entry.variants.map(variant => blobs[variants.findIndex(v => v.id === variant.id)] || null) : [blobs[0] || null];
    const work = (entry.kind === 'set' ? describeSet(entry, ordered) : redoEntry(entry, { save: false }))
        .then(() => saveLibrary())
        .then(() => true)
        .catch(error => {
            console.warn('[Image Search] set description failed', error);
            toastr.warning(`The set was saved, but describing it failed: ${error?.message || error}`, 'Image Search');
            return false;
        });
    return { entry, work };
}

async function saveSequence(picks, searchTags) {
    await loadLibrary();
    const variants = [];
    const blobs = [];
    const failed = [];
    for (const pick of picks.slice(0, 8)) {
        if (pick.entry) {
            const picture = pick.variant || pick.entry;
            variants.push({ url: picture.url, source: picture.source || pick.entry.source, tags: (picture.tags?.length ? picture.tags : pick.entry.tags).slice(), diff: '' });
            blobs.push(null);
            continue;
        }
        const item = pick.item;
        const pending = saveJobs.get(saveKey(item));
        if (pending && (pending.state === 'queued' || pending.state === 'saving')) {
            await pending.promise;
        }
        const found = findBySource(item.page);
        if (found) {
            variants.push({ url: (found.variant || found.entry).url, source: item.page, tags: summaryTags(item.tags), diff: '' });
            blobs.push(null);
            continue;
        }
        const { src, blob, lines } = await saveBest(item);
        if (!src) {
            failed.push(lines[0] || 'saving failed');
            continue;
        }
        variants.push({ url: src, source: item.page, tags: summaryTags(item.tags), diff: '' });
        blobs.push(blob);
    }
    if (variants.length < 2) {
        throw new Error(failed.length ? `Only ${variants.length} picture(s) could be saved: ${failed[0]}` : 'A sequence needs at least 2 pictures.');
    }
    freshIds(variants.length).forEach((id, index) => {
        variants[index].id = id;
    });
    const entry = cleanEntry({ id: variants[0].id, url: variants[0].url, source: variants[0].source, site: hostOf(variants[0].source), tags: summaryTags(variants.flatMap(variant => variant.tags)), searchTags, kind: 'sequence', variants });
    library.deleted.delete(entry.id);
    library.entries.unshift(entry);
    await saveLibrary();
    const work = describeSet(entry, blobs)
        .then(() => saveLibrary())
        .then(() => true)
        .catch(error => {
            console.warn('[Image Search] sequence description failed', error);
            toastr.warning(`The sequence was saved, but describing it failed: ${error?.message || error}`, 'Image Search');
            return false;
        });
    return { entry, work, failed };
}

function prepareEntryDescription(entry, variant = null) {
    const url = variant?.url || entry.url;
    if (entry.description) {
        descriptions.set(url, describedVariant(entry, variant));
    } else if (!descriptions.has(url)) {
        if (isMulti(entry)) {
            const pending = { url, tags: entry.tags, text: '', sections: {}, keywords: [], error: '', started: Date.now(), ms: 0, done: false };
            pending.promise = describeSet(entry)
                .then(() => {
                    pending.text = describedVariant(entry, variant).text;
                    return saveLibrary();
                })
                .catch(error => {
                    pending.error = String(error?.message || error);
                })
                .finally(() => {
                    pending.done = true;
                });
            descriptions.set(url, pending);
        } else {
            startDescription(entry.url, entry.tags, (text, keywords, sections) => {
                entry.description = text;
                entry.keywords = keywords;
                entry.sections = sections || {};
                saveLibrary();
            });
        }
    }
}

async function storePicture(item, searchTags, keep = settings().keepLibrary) {
    const s = settings();
    if (keep) {
        await loadLibrary();
        const found = findBySource(item.page);
        if (found) {
            prepareEntryDescription(found.entry, found.variant);
            return { url: found.variant?.url || found.entry.url, entry: found.entry, existed: true };
        }
    }
    if (!s.saveLocal) {
        return { url: item.img, entry: null };
    }
    const { src, blob, lines } = await saveBest(item);
    if (!src) {
        return { url: item.img, entry: null, failed: true, error: lines[0] || 'Saving failed.', lines };
    }
    const entry = keep ? await addToLibrary(item, src, searchTags) : null;
    startDescription(src, item.tags, (text, keywords, sections) => {
        if (entry) {
            entry.description = text;
            entry.keywords = keywords;
            entry.sections = sections || {};
            saveLibrary();
        }
    }, blob);
    if (entry) {
        saveLibrary();
    }
    return { url: src, entry };
}

const saveJobs = new Map();
const saveWaiting = [];
const saveWatchers = new Set();
let saveActive = 0;

function saveKey(item) {
    return item.page || item.img;
}

function saveState(item) {
    return saveJobs.get(saveKey(item))?.state || '';
}

function pendingSaves() {
    return [...saveJobs.values()].filter(job => job.state === 'queued' || job.state === 'saving').length;
}

function notifySaves(key, state) {
    saveWatchers.forEach(watch => {
        try {
            watch(key, state);
        } catch (error) {
            console.warn('[Image Search] save watcher failed', error);
        }
    });
}

function queueSave(item, searchTags) {
    const key = saveKey(item);
    const known = saveJobs.get(key);
    if (known && known.state !== 'failed') {
        return known.promise;
    }
    const job = { state: 'queued', error: '', promise: null };
    job.promise = new Promise(resolve => saveWaiting.push({ item, searchTags, job, key, resolve }));
    saveJobs.set(key, job);
    notifySaves(key, 'queued');
    pumpSaves();
    return job.promise;
}

function pumpSaves() {
    while (saveActive < 2 && saveWaiting.length) {
        const next = saveWaiting.shift();
        saveActive++;
        next.job.state = 'saving';
        notifySaves(next.key, 'saving');
        storePicture(next.item, next.searchTags, true).then(result => {
            if (!result.entry) {
                throw new Error(result.error || 'Saving pictures is turned off in the settings.');
            }
            next.job.state = 'done';
            next.resolve(result.entry);
        }).catch(error => {
            next.job.state = 'failed';
            next.job.error = String(error?.message || error);
            console.warn('[Image Search] background save failed', error);
            toastr.warning(`Could not save a picture to the library: ${next.job.error}`, 'Image Search');
            next.resolve(null);
        }).finally(() => {
            saveActive--;
            notifySaves(next.key, next.job.state);
            pumpSaves();
        });
    }
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
    const text = entry.sections?.visual || String(entry.description || '').replace(/^\w+:\s*/, '') || entry.tags.slice(0, 12).join(', ').replace(/_/g, ' ');
    const first = text.split(/(?<=[.!?])\s/)[0] || text;
    return first.length > 160 ? `${first.slice(0, 157)}…` : first;
}

function fullDescription(entry) {
    return renderSections(entry.sections) || (entry.description ? `Description: ${entry.description}` : '');
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

function fallbackKeywords(entry) {
    return entry.tags
        .filter(tag => !COUNT_TAGS.test(tag) && !META_TAG.test(tag) && !isDetailTag(tag) && !DROP_TAGS.has(tag))
        .map(tag => tag.replace(/_\([^)]*\)$/, '').replace(/_/g, ' '))
        .filter(word => word.length >= 3)
        .slice(0, 8);
}

const VERB_PAST = { run: 'ran', sit: 'sat', swim: 'swam', get: 'got', win: 'won', spin: 'spun', dig: 'dug', begin: 'began', stand: 'stood', fight: 'fought', hold: 'held', kneel: 'knelt', sleep: 'slept', eat: 'ate', drink: 'drank', ride: 'rode', throw: 'threw', fall: 'fell', lie: 'lay', hide: 'hid', bite: 'bit', hang: 'hung', sing: 'sang', shoot: 'shot', catch: 'caught', draw: 'drew', write: 'wrote', drive: 'drove', fly: 'flew', sink: 'sank', swing: 'swung', sneak: 'snuck', weep: 'wept', blow: 'blew', break: 'broke', wake: 'woke', speak: 'spoke', bring: 'brought', teach: 'taught', feel: 'felt', lead: 'led', rise: 'rose', shake: 'shook', steal: 'stole', freeze: 'froze', tear: 'tore', strike: 'struck', cling: 'clung', creep: 'crept', flee: 'fled', fling: 'flung', slide: 'slid', read: 'read', cut: 'cut', hit: 'hit', hurt: 'hurt', cast: 'cast', shut: 'shut', spread: 'spread', feed: 'fed', bleed: 'bled', meet: 'met', build: 'built', send: 'sent', bend: 'bent', seek: 'sought', buy: 'bought', stick: 'stuck', light: 'lit', shine: 'shone', grow: 'grew', sweep: 'swept', leap: 'leapt', swear: 'swore', choose: 'chose' };
const VERB_FROM_PAST = Object.fromEntries(Object.entries(VERB_PAST).map(([base, past]) => [past, base]));
const GENERIC_VERBS = new Set(['be', 'have', 'do', 'make', 'take', 'go', 'come', 'get', 'look', 'see', 'show', 'use', 'put', 'set', 'let', 'keep', 'give', 'seem', 'appear', 'wear', 'stand', 'sit', 'face', 'smile', 'pose', 'hold', 'feature', 'depict', 'contain', 'include', 'remain', 'stay', 'turn', 'try', 'start', 'begin', 'continue', 'say', 'tell', 'ask', 'think', 'know', 'feel', 'find', 'want', 'need', 'hear', 'become', 'leave']);
const NOT_VERB_ING = new Set(['thing', 'things', 'something', 'nothing', 'anything', 'everything', 'ceiling', 'building', 'clothing', 'evening', 'morning', 'during', 'sibling', 'darling', 'lightning', 'pudding', 'railing', 'stocking', 'earring', 'painting', 'drawing', 'ending', 'bedding', 'wedding', 'feeling', 'being', 'setting', 'lighting', 'opening', 'awning', 'icing', 'frosting', 'padding', 'filling', 'lining', 'housing', 'crossing', 'landing', 'clearing', 'dwelling', 'outing', 'legging', 'shading', 'string', 'spring', 'bring', 'swing', 'sting', 'king', 'ring', 'wing']);
const SUBJECT_WORDS = new Set(['she', 'he', 'they', 'it', 'who', 'and', 'both', 'then', 'which', 'that', 'woman', 'man', 'girl', 'boy', 'figure', 'character', 'person', 'creature']);

function vowelGroups(word) {
    return (word.match(/[aeiou]+/g) || []).length;
}

function restoreE(stem) {
    if (/(.)\1$/.test(stem) || stem.endsWith('e')) {
        return stem;
    }
    if (/[bcdfgkptz]l$/.test(stem) || /(c|v|z|dg|rg|u)$/.test(stem)) {
        return `${stem}e`;
    }
    if (vowelGroups(stem) === 1 && /[^aeiou][aeiou][^aeiouwxy]$/.test(stem)) {
        return `${stem}e`;
    }
    return stem;
}

function baseFromIng(word) {
    const special = { lying: 'lie', dying: 'die', tying: 'tie' };
    if (special[word]) {
        return special[word];
    }
    const stem = word.slice(0, -3);
    if (stem.length < 2) {
        return '';
    }
    if (stem.length >= 3 && /([^aeiouflsz])\1$/.test(stem)) {
        return stem.slice(0, -1);
    }
    return restoreE(stem);
}

function baseFromInflected(word) {
    const special = { lies: 'lie', lied: 'lie', dies: 'die', died: 'die', ties: 'tie', tied: 'tie' };
    if (special[word] || VERB_FROM_PAST[word] || VERB_PAST[word]) {
        return special[word] || VERB_FROM_PAST[word] || word;
    }
    if (word.length < 4 || /(ly|ss|us|is)$/.test(word)) {
        return '';
    }
    if (/[^aeiou]ies$/.test(word) || /[^aeiou]ied$/.test(word)) {
        return `${word.slice(0, -3)}y`;
    }
    if (/(ss|sh|ch|x|z|o)es$/.test(word)) {
        return word.slice(0, -2);
    }
    if (word.endsWith('ed') && word.length >= 5) {
        const stem = word.slice(0, -2);
        if (/([^aeiouflsz])\1$/.test(stem)) {
            return stem.slice(0, -1);
        }
        return restoreE(stem);
    }
    if (word.endsWith('s')) {
        return word.slice(0, -1);
    }
    return '';
}

function actionVerbs(text) {
    const words = String(text || '').toLowerCase().match(/[a-z]+/g) || [];
    const found = [];
    words.forEach((word, index) => {
        let base = '';
        if (word.length >= 5 && word.endsWith('ing') && !NOT_VERB_ING.has(word)) {
            base = baseFromIng(word);
        } else {
            const before = words[index - 1] || '';
            const subject = SUBJECT_WORDS.has(before) || (before.endsWith('ly') && SUBJECT_WORDS.has(words[index - 2] || ''));
            if (subject && !STOP_WORDS.has(word)) {
                base = baseFromInflected(word);
            }
        }
        if (base && base.length >= 3 && !GENERIC_VERBS.has(base) && !found.includes(base)) {
            found.push(base);
        }
    });
    return found;
}

function verbForms(base) {
    const single = vowelGroups(base) === 1 && /[^aeiou][aeiou][^aeiouwxy]$/.test(base);
    const third = /(s|sh|ch|x|z|o)$/.test(base) ? `${base}es` : /[^aeiou]y$/.test(base) ? `${base.slice(0, -1)}ies` : `${base}s`;
    const past = VERB_PAST[base] || (base.endsWith('e') ? `${base}d` : /[^aeiou]y$/.test(base) ? `${base.slice(0, -1)}ied` : single ? `${base}${base.slice(-1)}ed` : `${base}ed`);
    const ing = base.endsWith('ie') ? `${base.slice(0, -2)}ying` : (base.endsWith('e') && !/(ee|ye|oe)$/.test(base)) ? `${base.slice(0, -1)}ing` : single ? `${base}${base.slice(-1)}ing` : `${base}ing`;
    return [...new Set([ing, third, past, base])];
}

function entryVerbs(entry) {
    const hasSections = Object.keys(entry.sections || {}).length > 0;
    const texts = [hasSections ? entry.sections.action || '' : entry.description];
    if (isMulti(entry)) {
        texts.push(...entry.variants.slice(1).map(variant => variant.diff || ''));
    }
    const fromKeywords = entry.keywords.flatMap(word => word.toLowerCase().split(/\s+/)).filter(word => word.length >= 5 && word.endsWith('ing') && !NOT_VERB_ING.has(word)).map(baseFromIng);
    return [...new Set([...texts.flatMap(actionVerbs), ...fromKeywords])].filter(base => base && base.length >= 3 && !GENERIC_VERBS.has(base));
}

function entryKeywords(entry) {
    const words = entry.keywords.length ? entry.keywords : fallbackKeywords(entry);
    const plain = [...new Set(words.map(word => word.toLowerCase().trim()))].filter(word => word && !GENERIC_KEYWORDS.has(word));
    const forms = entryVerbs(entry).slice(0, 3).flatMap(verbForms).filter(word => !GENERIC_KEYWORDS.has(word));
    return [...new Set([...plain.filter(word => !forms.includes(word)).slice(0, 12), ...forms])];
}

const SHOW_RULE = 'This chat app can show real pictures to the user: when a reply contains a picture tag such as [pic:abc123] on its own line, the app removes the tag and displays that picture in the chat. You can do this whenever a picture fits the scene, and always when the user asks you to show or bring in a picture.';

function catalogLine(entry) {
    const summary = shortDescription(entry) || entry.tags.slice(0, 8).join(', ').replace(/_/g, ' ');
    if (entry.kind === 'sequence' && isMulti(entry)) {
        const later = entry.variants.slice(1).map(variant => `[pic:${variant.id}]`).join(', then ');
        return `[pic:${entry.variants[0].id}] ${summary} (picture 1 of a ${entry.variants.length}-picture sequence; show ${later} later, in that order)`;
    }
    if (isMulti(entry)) {
        return `[pic:${entry.variants[0].id}] ${summary} (other versions: ${entry.variants.slice(1).map(variant => `[pic:${variant.id}]`).join(', ')})`;
    }
    return `[pic:${entry.id}] ${summary}`;
}

function pictureCatalog(size) {
    const recent = [...library.entries]
        .filter(entry => entry.description || entry.tags.length)
        .sort((a, b) => Math.max(b.lastUsed, b.added) - Math.max(a.lastUsed, a.added))
        .slice(0, size);
    if (!recent.length) {
        return '';
    }
    return [`${SHOW_RULE} Use only the tags listed here or in other saved-picture notes, never invent one, never mention the tag in your text, and show at most one picture per reply. Prefer a picture that has not been shown yet in this chat. Saved pictures:`, ...recent.map(catalogLine)].join('\n');
}

function catalogWiEntry(uid, depth) {
    return { ...newWiEntry(uid, depth), constant: true, selective: false, group: '', useGroupScoring: false, cooldown: null, order: 0, comment: CATALOG_COMMENT };
}

function pictureOffer(entry) {
    const rule = 'never mention the tag itself, and show at most one picture per reply.';
    const body = fullDescription(entry);
    const tags = tagsLine(entry.tags);
    if (entry.kind === 'sequence' && isMulti(entry)) {
        const steps = entry.variants.map((variant, index) => index === 0
            ? `Picture 1 [pic:${variant.id}]: as described above.`
            : `Picture ${index + 1} [pic:${variant.id}]: ${variant.diff || 'the next picture of the sequence.'}`);
        return [`Saved picture sequence: ${entry.variants.length} real pictures that tell a story in this order. ${SHOW_RULE} When the scene matches picture 1, you may show it; show the next ones in later replies, in order, as the story moves on. Never skip ahead. Write the tag on its own line where the picture belongs; ${rule}`, body, ...steps, tags].filter(Boolean).join('\n');
    }
    if (entry.kind === 'set' && entry.variants.length > 1) {
        const versions = entry.variants.map((variant, index) => index === 0
            ? `Version 1 [pic:${variant.id}]: as described above.`
            : `Version ${index + 1} [pic:${variant.id}]: ${variant.diff || 'another version of the same picture.'}`);
        return [`Saved picture set: ${entry.variants.length} real pictures, versions of the same scene. ${SHOW_RULE} If one fits the moment or the user asks for it, write its tag on its own line where it belongs; ${rule}`, body, ...versions, tags].filter(Boolean).join('\n');
    }
    return [`Saved picture [pic:${entry.id}], a real picture. ${SHOW_RULE} If it fits the moment or the user asks for it, write [pic:${entry.id}] on its own line where it belongs; ${rule}`, body, tags].filter(Boolean).join('\n');
}

function newWiEntry(uid, depth) {
    return {
        uid,
        key: [],
        keysecondary: [],
        comment: '',
        content: '',
        constant: false,
        vectorized: false,
        selective: true,
        selectiveLogic: 0,
        addMemo: true,
        order: 1,
        position: 4,
        disable: false,
        ignoreBudget: false,
        excludeRecursion: true,
        preventRecursion: true,
        matchPersonaDescription: false,
        matchCharacterDescription: false,
        matchCharacterPersonality: false,
        matchCharacterDepthPrompt: false,
        matchScenario: false,
        matchCreatorNotes: false,
        delayUntilRecursion: 0,
        probability: 100,
        useProbability: true,
        depth,
        outletName: '',
        group: 'imagesearch',
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: false,
        matchWholeWords: true,
        useGroupScoring: true,
        automationId: '',
        role: 0,
        sticky: null,
        cooldown: 4,
        delay: null,
        triggers: [],
        displayIndex: uid,
    };
}

function lorebookActive() {
    return [...document.querySelectorAll('#world_info option')].some(option => option.selected && option.textContent.trim() === LOREBOOK);
}

async function activateLorebook() {
    const c = ctx();
    if (lorebookActive() || !c.executeSlashCommandsWithOptions) {
        return;
    }
    try {
        await c.executeSlashCommandsWithOptions(`/world state=on silent=true ${LOREBOOK}`);
    } catch (error) {
        console.warn('[Image Search] could not turn on the lorebook', error);
    }
}

let lorebookTimer = null;
let lorebookRunning = Promise.resolve();

function scheduleLorebookSync(options = {}) {
    clearTimeout(lorebookTimer);
    lorebookTimer = setTimeout(() => {
        lorebookRunning = lorebookRunning.then(() => syncLorebook(options)).catch(error => console.warn('[Image Search] lorebook sync failed', error));
    }, 1500);
}

async function syncLorebook({ activate = false } = {}) {
    const s = settings();
    const c = ctx();
    if (!c.loadWorldInfo || !c.saveWorldInfo) {
        return;
    }
    await loadLibrary();
    if (library.broken) {
        return;
    }
    const exists = (c.getWorldInfoNames?.() || []).includes(LOREBOOK);
    let data = exists ? await c.loadWorldInfo(LOREBOOK) : null;
    if (exists && (!data || typeof data.entries !== 'object')) {
        return;
    }
    let created = false;
    if (!data) {
        if (!library.entries.length) {
            return;
        }
        data = { entries: {} };
        created = true;
    }
    const byId = new Map();
    for (const wi of Object.values(data.entries)) {
        const match = String(wi?.comment || '').match(WI_COMMENT);
        if (match) {
            byId.set(match[1], wi);
        }
    }
    let changed = created;
    let libraryChanged = false;
    const wanted = new Set(library.entries.map(entry => entry.id));
    const catalogs = Object.values(data.entries).filter(wi => wi?.comment === CATALOG_COMMENT);
    const catalogText = s.aiShow ? pictureCatalog(Math.max(0, Math.min(200, Number(s.catalogSize) || 0))) : '';
    catalogs.slice(catalogText ? 1 : 0).forEach(wi => {
        delete data.entries[wi.uid];
        changed = true;
    });
    for (const [id, wi] of byId) {
        if (!wanted.has(id)) {
            delete data.entries[wi.uid];
            changed = true;
        }
    }
    let nextUid = Math.max(-1, ...Object.keys(data.entries).map(Number).filter(Number.isFinite)) + 1;
    const depth = Math.max(0, Number(s.aiShowDepth) || 0);
    const disabledByUs = new Set(s.wiDisabledByUs);
    for (const entry of library.entries) {
        let wi = byId.get(entry.id);
        if (!wi) {
            wi = newWiEntry(nextUid++, depth);
            data.entries[wi.uid] = wi;
            changed = true;
        }
        const keys = entryKeywords(entry);
        const userEdited = Array.isArray(entry.wiKeys) && Array.isArray(wi.key) && wi.key.length && JSON.stringify(wi.key) !== JSON.stringify(entry.wiKeys);
        if (!userEdited) {
            if (JSON.stringify(wi.key) !== JSON.stringify(keys)) {
                wi.key = keys;
                changed = true;
            }
            if (JSON.stringify(entry.wiKeys) !== JSON.stringify(keys)) {
                entry.wiKeys = keys;
                libraryChanged = true;
            }
        }
        const comment = `[pic:${entry.id}] ${shortDescription(entry)}`.slice(0, 200);
        const content = pictureOffer(entry);
        if (wi.comment !== comment || wi.content !== content || wi.depth !== depth) {
            wi.comment = comment;
            wi.content = content;
            wi.depth = depth;
            changed = true;
        }
        if (!s.aiShow && !wi.disable) {
            wi.disable = true;
            disabledByUs.add(entry.id);
            changed = true;
        } else if (s.aiShow && wi.disable && disabledByUs.has(entry.id)) {
            wi.disable = false;
            disabledByUs.delete(entry.id);
            changed = true;
        }
    }
    if (catalogText) {
        let catalog = catalogs[0];
        if (!catalog) {
            catalog = catalogWiEntry(nextUid++, depth);
            data.entries[catalog.uid] = catalog;
            changed = true;
        }
        if (catalog.content !== catalogText || catalog.depth !== depth || !catalog.constant) {
            catalog.content = catalogText;
            catalog.depth = depth;
            catalog.constant = true;
            changed = true;
        }
    }
    s.wiDisabledByUs = [...disabledByUs].filter(id => wanted.has(id));
    save();
    if (changed) {
        await c.saveWorldInfo(LOREBOOK, data, true);
        c.reloadWorldInfoEditor?.(LOREBOOK, false);
    }
    if (created) {
        await c.updateWorldInfoList?.();
    }
    if ((created || activate) && s.aiShow) {
        await activateLorebook();
    }
    if (libraryChanged) {
        await saveLibrary({ skipSync: true });
    }
}

function onWorldInfoActivated(entries) {
    if (!settings().debug || !Array.isArray(entries)) {
        return;
    }
    const offered = entries.filter(entry => entry?.world === LOREBOOK).map(entry => entry.comment);
    if (offered.length) {
        toastr.info(`Offered to the AI: ${offered.join(' | ')}`, 'Image Search debug', { timeOut: 10000 });
    }
}

function syncCurrentSwipe(message) {
    const info = Array.isArray(message.swipe_info) && Number.isInteger(message.swipe_id) ? message.swipe_info[message.swipe_id] : null;
    if (info && typeof info === 'object') {
        info.extra = structuredClone(message.extra || {});
    }
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
    const pictures = [...new Set(ids)].map(pid => resolvePic(pid)).filter(Boolean).slice(0, 2);
    if (pictures.length) {
        if (!message.extra || typeof message.extra !== 'object') {
            message.extra = {};
        }
        if (!Array.isArray(message.extra.media)) {
            message.extra.media = [];
        }
        for (const { entry, variant } of pictures) {
            const url = variant?.url || entry.url;
            if (!message.extra.media.some(item => item.url === url)) {
                const note = pictureNote(describedVariant(entry, variant), 'shown in the story');
                message.extra.media.push({ type: 'image', url, title: note, append_title: true, source: 'upload' });
            }
            noteUse(entry, message.name || c.name2 || '');
        }
        saveLibrary();
    }
    syncCurrentSwipe(message);
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
    const notice = !entry.done && timeout > 0 ? toastr.info('Waiting for the picture description…', 'Image Search', { timeOut: 0, extendedTimeOut: 0 }) : null;
    const finished = entry.done || await Promise.race([
        entry.promise.then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), timeout)),
    ]);
    if (notice) {
        toastr.clear?.(notice);
    }
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
        let entry = descriptions.get(url);
        if (!entry && s.describe && s.keepLibrary) {
            await loadLibrary();
            const known = findPicture(item => item.url === url);
            if (known?.entry.description) {
                entry = describedVariant(known.entry, known.variant);
            }
        }
        if (entry && s.describe) {
            waits.push(applyDescription(message, media, entry));
        }
    }
    message.mes = message.mes.replace(LOCAL_IMAGE_MD, '').replace(/\n{3,}/g, '\n\n').trim();
    await Promise.all(waits);
    await c.saveChat();
}

function confirmClicks(button, label, armedLabel, action, before = null) {
    let armed = false;
    let timer = null;
    const disarm = () => {
        clearTimeout(timer);
        armed = false;
        button.textContent = label;
        button.classList.remove('stis-armed');
    };
    button.addEventListener('click', async () => {
        if (before && await before(button) === false) {
            return;
        }
        if (!armed) {
            armed = true;
            button.textContent = typeof armedLabel === 'function' ? armedLabel() : armedLabel;
            button.classList.add('stis-armed');
            timer = setTimeout(disarm, 4000);
            return;
        }
        clearTimeout(timer);
        armed = false;
        button.classList.remove('stis-armed');
        await action(button);
    });
    return button;
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

function bindPress(cell, onTap, onLong) {
    let timer = null;
    let fired = false;
    let startX = 0;
    let startY = 0;
    const cancel = () => {
        clearTimeout(timer);
        timer = null;
    };
    cell.addEventListener('pointerdown', event => {
        fired = false;
        startX = event.clientX;
        startY = event.clientY;
        cancel();
        timer = setTimeout(() => {
            timer = null;
            fired = true;
            onLong();
        }, 550);
    });
    cell.addEventListener('pointermove', event => {
        if (timer && (Math.abs(event.clientX - startX) > 10 || Math.abs(event.clientY - startY) > 10)) {
            cancel();
        }
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(name => cell.addEventListener(name, cancel));
    cell.addEventListener('contextmenu', event => event.preventDefault());
    cell.addEventListener('click', () => {
        if (fired) {
            fired = false;
            return;
        }
        onTap();
    });
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
        tabs: el('div', 'stis-tabs'),
        tabSearch: el('div', 'menu_button stis-tab stis-tab-on', 'Search'),
        tabLibrary: el('div', 'menu_button stis-tab', 'Library'),
        who: el('div', 'stis-who'),
        top: el('div', 'stis-top'),
        site: el('select', 'text_pole stis-site'),
        chips: el('div', 'stis-chips'),
        input: el('input', 'text_pole stis-input'),
        suggest: el('div', 'menu_button stis-btn'),
        search: el('div', 'menu_button stis-btn'),
        chipMenu: el('div', 'stis-chip-menu'),
        complete: el('div', 'stis-complete'),
        lookBar: el('div', 'stis-look-bar'),
        lookButton: el('div', 'menu_button stis-look-btn', 'Save as character look'),
        lookForm: el('div', 'stis-look-form'),
        lookName: el('input', 'text_pole'),
        lookSave: el('div', 'menu_button', 'Save'),
        lookCancel: el('div', 'menu_button', 'Cancel'),
        status: el('div', 'stis-status'),
        debug: el('div', 'stis-debug'),
        grid: el('div', 'stis-grid'),
        sentinel: el('div', 'stis-sentinel'),
        preview: el('div', 'stis-preview'),
        libraryView: el('div', 'stis-library'),
        libSearch: el('input', 'text_pole stis-lib-search'),
        libGrid: el('div', 'stis-grid'),
        selectToggle: el('div', 'menu_button stis-tab stis-select-btn'),
        sites: el('div', 'stis-sites'),
        favs: el('div', 'stis-favs'),
        selectBar: el('div', 'stis-select-bar'),
        selectInfo: el('span', 'stis-select-info'),
        selectSave: el('div', 'menu_button stis-select-save', 'Save as sequence'),
        selectClear: el('div', 'menu_button', 'Clear'),
        selectDone: el('div', 'menu_button', 'Done'),
    };
    ui.libSearch.type = 'text';
    ui.libSearch.placeholder = 'search saved pictures';
    ui.selectToggle.innerHTML = '<i class="fa-solid fa-list-ol"></i> Select';
    ui.selectToggle.title = 'Pick pictures in story order and save them as a sequence';
    ui.selectToggle.hidden = !(s.saveLocal && s.keepLibrary);
    ui.tabs.append(ui.tabSearch, ui.tabLibrary, ui.selectToggle);
    ui.selectBar.append(ui.selectInfo, ui.selectSave, ui.selectClear, ui.selectDone);
    ui.selectBar.hidden = true;
    ui.sites.hidden = true;
    ui.favs.hidden = true;
    ui.libraryView.append(ui.libSearch, ui.libGrid);
    ui.libraryView.hidden = true;
    ui.input.type = 'text';
    ui.input.placeholder = 'add tag, Enter';
    ui.suggest.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
    ui.suggest.title = 'Ask the tag model again';
    ui.search.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    ui.search.title = 'Search';
    if (entries.length > 1) {
        const all = el('option', '', 'All sites');
        all.value = ALL_SITES;
        ui.site.appendChild(all);
    }
    for (const entry of entries) {
        const option = el('option', '', entry.domain);
        option.value = entry.domain;
        ui.site.appendChild(option);
    }
    ui.site.value = activeDomain();
    ui.chips.appendChild(ui.input);
    ui.top.append(ui.site, ui.chips, ui.suggest, ui.search);
    ui.chipMenu.hidden = true;
    ui.complete.hidden = true;
    ui.lookName.type = 'text';
    ui.lookName.placeholder = 'Character name';
    ui.lookForm.append(ui.lookName, ui.lookSave, ui.lookCancel);
    ui.lookForm.hidden = true;
    ui.lookBar.append(ui.lookButton, ui.lookForm);
    ui.who.hidden = true;
    ui.grid.appendChild(ui.sentinel);
    ui.preview.hidden = true;
    ui.debug.hidden = !s.debug;
    ui.root.append(ui.tabs, ui.who, ui.top, ui.complete, ui.sites, ui.favs, ui.chipMenu, ui.lookBar, ui.status, ui.debug, ui.grid, ui.libraryView, ui.selectBar, ui.preview);

    let tags = [];
    let required = new Set();
    let edited = false;
    let browse = null;
    let rendered = 0;
    let searchTimer = null;
    let closed = false;
    let busy = false;
    let dragFrom = -1;
    let shown = null;
    let menuTag = '';
    let selectedWho = '';
    let previewState = null;
    let libraryOrder = [];
    let reps = [];
    let gridFamilies = new Map();
    let selecting = false;
    let selection = Array.isArray(state.selection) ? state.selection : [];
    let saveButtons = new Map();

    const setStatus = (text, kind = '') => {
        ui.status.textContent = text;
        ui.status.className = `stis-status ${kind}`;
    };

    const requiredList = () => tags.filter(tag => required.has(tag));

    const selectedLookName = () => {
        if (!selectedWho || selectedWho === '*ai*') {
            return '';
        }
        return findLook(selectedWho)?.name || '';
    };

    const whoOptions = () => {
        const looks = parseLooks();
        const options = [];
        const add = look => {
            if (look && !options.some(option => option.key === look.name.toLowerCase())) {
                options.push({ key: look.name.toLowerCase(), label: look.name, look });
            }
        };
        const pre = currentPrefetch();
        if (pre?.subject) {
            add(findLook(pre.subject, looks));
        }
        mentionedLooks(looks).forEach(add);
        if (selectedWho && selectedWho !== '*ai*') {
            add(findLook(selectedWho, looks));
        }
        if (options.length && pre?.aiTags?.length) {
            options.push({ key: '*ai*', label: 'Suggested', ai: pre });
        }
        return options;
    };

    const renderWho = () => {
        ui.who.innerHTML = '';
        const options = whoOptions();
        ui.who.hidden = !options.length;
        if (!options.length) {
            return;
        }
        ui.who.appendChild(el('span', 'stis-who-label', 'Who:'));
        for (const option of options) {
            const chip = el('span', 'stis-who-chip', option.label);
            chip.classList.toggle('stis-who-on', option.key === selectedWho);
            chip.title = option.look ? `Use ${option.look.name}'s saved look` : 'Use the tags the AI suggested';
            chip.addEventListener('click', () => {
                selectedWho = option.key;
                if (option.look) {
                    setTags(option.look.tags, true, option.look.required);
                } else {
                    shown = option.ai;
                    setTags(option.ai.aiTags, true, option.ai.aiRequired);
                }
                renderWho();
                runSearch();
            });
            ui.who.appendChild(chip);
        }
    };

    const renderChips = () => {
        ui.chips.querySelectorAll('.stis-chip').forEach(chip => chip.remove());
        const domain = ui.site.value;
        const cap = capFor(domain);
        const req = requiredList();
        tags.forEach((tag, index) => {
            const chip = el('span', 'stis-chip');
            const isRequired = required.has(tag);
            chip.classList.add(isRequired ? 'stis-req' : 'stis-pref');
            const position = req.indexOf(tag);
            let title = isRequired
                ? (cap && position >= cap ? `Required, checked by the extension (${domain === ALL_SITES ? 'a site' : domain} takes ${cap} tags)` : 'Required: only pictures with this tag')
                : 'Preferred: pictures with this tag come first';
            const count = knownCount(domain, tag);
            if (count === 0) {
                chip.classList.add('stis-unknown');
                title = `Not found on ${anySiteLabel(domain)}`;
            } else if (count !== null) {
                title += `, ${count} posts`;
            }
            chip.title = `${title}. Tap for options.`;
            if (menuTag === tag) {
                chip.classList.add('stis-chip-open');
            }
            chip.draggable = true;
            chip.appendChild(el('span', '', tag));
            const remove = el('i', 'fa-solid fa-xmark stis-chip-x');
            remove.title = 'Remove from this search';
            remove.addEventListener('click', event => {
                event.stopPropagation();
                removeTag(tag);
            });
            chip.appendChild(remove);
            chip.addEventListener('click', () => {
                menuTag = menuTag === tag ? '' : tag;
                renderChips();
            });
            chip.addEventListener('dragstart', event => {
                dragFrom = index;
                event.dataTransfer?.setData('text/plain', tag);
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
        renderMenu();
        renderDebug();
        renderFavs();
    };

    function renderMenu() {
        ui.chipMenu.innerHTML = '';
        if (!menuTag || !tags.includes(menuTag)) {
            menuTag = '';
            ui.chipMenu.hidden = true;
            return;
        }
        const tag = menuTag;
        ui.chipMenu.hidden = false;
        ui.chipMenu.appendChild(el('b', 'stis-menu-tag', tag));
        const action = (label, run) => {
            const button = el('div', 'menu_button stis-menu-btn', label);
            button.addEventListener('click', () => {
                menuTag = '';
                run();
            });
            ui.chipMenu.appendChild(button);
        };
        action(required.has(tag) ? 'Make preferred' : 'Make required', () => {
            if (required.has(tag)) {
                required.delete(tag);
            } else {
                required.add(tag);
            }
            tagsChanged();
        });
        if (tags.indexOf(tag) > 0) {
            action('Move first', () => {
                tags.unshift(...tags.splice(tags.indexOf(tag), 1));
                tagsChanged();
            });
        }
        action(favoriteTags().includes(tag) ? '☆ Unfavorite' : '★ Favorite', () => {
            toggleFavorite(tag);
            renderChips();
        });
        action('Remove', () => removeTag(tag));
        action('Never suggest', () => {
            addToSuggestBlacklist(tag);
            toastr.info(`"${tag}" will not be suggested again. You can undo this in the settings.`, 'Image Search');
            removeTag(tag);
        });
        action('Leave out', () => {
            addExcludedTags([tag]);
            toastr.info(`Pictures tagged ${tag} are left out from now on. You can change this in the settings.`, 'Image Search');
            removeTag(tag);
        });
    }

    function renderFavs() {
        ui.favs.innerHTML = '';
        const favorites = favoriteTags();
        ui.favs.hidden = !favorites.length || !ui.libraryView.hidden;
        if (ui.favs.hidden) {
            return;
        }
        ui.favs.appendChild(el('span', 'stis-favs-label', '★'));
        favorites.forEach(tag => {
            const chip = el('span', 'stis-fav', tag);
            const active = tags.includes(tag);
            chip.classList.toggle('stis-fav-on', active);
            chip.title = active ? 'In the search; tap to take it out' : 'Tap to add it to the search';
            chip.addEventListener('click', () => {
                if (tags.includes(tag)) {
                    removeTag(tag);
                } else {
                    setTags([...tags, tag], true, requiredList());
                    tagsChanged();
                }
            });
            ui.favs.appendChild(chip);
        });
    }

    function renderSites() {
        ui.sites.innerHTML = '';
        const skip = new Set(s.skipSites || []);
        const on = entries.filter(entry => !skip.has(entry.domain)).length;
        const allOption = [...ui.site.options].find(option => option.value === ALL_SITES);
        if (allOption) {
            allOption.textContent = on < entries.length ? `All sites (${on}/${entries.length})` : 'All sites';
        }
        ui.sites.hidden = ui.site.value !== ALL_SITES || entries.length < 2 || !ui.libraryView.hidden;
        if (ui.sites.hidden) {
            return;
        }
        ui.sites.appendChild(el('span', 'stis-sites-label', 'Sites:'));
        entries.forEach(entry => {
            const off = skip.has(entry.domain);
            const chip = el('span', 'stis-site-chip', entry.domain);
            chip.classList.toggle('stis-site-off', off);
            chip.title = off ? 'Left out of All sites; tap to search it again' : 'Tap to leave this site out of All sites';
            chip.addEventListener('click', () => {
                const next = new Set(s.skipSites || []);
                if (next.has(entry.domain)) {
                    next.delete(entry.domain);
                } else if (entries.filter(item => !next.has(item.domain)).length <= 1) {
                    toastr.info('Keep at least one site on.', 'Image Search');
                    return;
                } else {
                    next.add(entry.domain);
                }
                s.skipSites = [...next].filter(domain => entries.some(item => item.domain === domain));
                save();
                renderSites();
                renderChips();
                refreshCounts();
                runSearch();
            });
            ui.sites.appendChild(chip);
        });
    }

    const refreshCounts = async () => {
        const domain = ui.site.value;
        if (!tags.length) {
            return;
        }
        const before = tags.map(tag => knownCount(domain, tag)).join();
        await lookupTagsFor(domain, tags);
        if (!closed && domain === ui.site.value && tags.map(tag => knownCount(domain, tag)).join() !== before) {
            renderChips();
        }
    };

    function renderDebug() {
        if (!s.debug) {
            ui.debug.hidden = true;
            return;
        }
        ui.debug.hidden = !ui.libraryView.hidden;
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
        if (shown) {
            line('Subject:', `${shown.subject || 'none'}${shown.lookName ? ` (using ${shown.lookName}'s saved look)` : ''}`);
        }
        if (shown?.evidence && Object.keys(shown.evidence).length) {
            line('Evidence:', Object.entries(shown.evidence).map(([tag, quote]) => `${tag} ← "${quote}"`).join(', '));
        }
        if (shown?.dropped?.length) {
            line('Removed:', shown.dropped.join(', '));
        }
        if (tags.length) {
            line('Posts per tag:', tags.map(tag => `${tag} (${knownCount(ui.site.value, tag) ?? '?'})`).join(', '));
        }
        if (browse) {
            const firstPages = browse.subs ? browse.subs.map(sub => sub.pages[0]).filter(Boolean) : [browse.pages[0]].filter(Boolean);
            for (const first of firstPages) {
                const link = el('a', '', `Open the same search on ${first.domain}`);
                link.href = first.siteUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                line('Site (required tags):', link);
                if (first.localTags.length) {
                    line(`Required, checked here for ${first.domain}:`, first.localTags.join(', '));
                }
            }
            if (browse.preferred.length) {
                line('Preferred, used for sorting:', browse.preferred.join(', '));
            }
            const apiPage = browse.pages[0];
            if (apiPage) {
                line('API:', apiPage.apiUrl);
            }
            browse.pages.forEach(p => line(`${p.domain} page ${p.page + 1}:`, `site sent ${p.received}, kept ${p.kept} (removed: rating ${p.rating}, excluded tags ${p.excluded}, missing required tags ${p.local}, not a picture ${p.notImage})`));
            browse.siteErrors?.forEach(error => line('Site error:', error));
        }
        if (browse?.error) {
            line('Error:', browse.error);
        }
    }

    const setTags = (list, fromUser, wantedRequired = null) => {
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
        const wanted = new Set((wantedRequired || defaultRequired(tags)).map(normalizeTag));
        required = new Set(tags.filter(tag => wanted.has(tag)));
        if (fromUser) {
            edited = true;
        }
        if (removed.length) {
            toastr.info(`Not searchable: ${removed.join(', ')}`, 'Image Search');
        }
        menuTag = '';
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

    const removeTag = tag => {
        tags = tags.filter(item => item !== tag);
        required.delete(tag);
        if (menuTag === tag) {
            menuTag = '';
        }
        tagsChanged();
    };

    const commitInput = () => {
        const parts = ui.input.value.split(',').map(normalizeTag).filter(Boolean);
        ui.input.value = '';
        if (!parts.length) {
            return false;
        }
        setTags([...tags, ...parts], true, requiredList());
        tagsChanged();
        return true;
    };

    const familyBadge = family => {
        const count = family.members.length;
        const more = family.members.some(mayHaveFamily) && !family.loaded;
        family.badge.innerHTML = '';
        family.badge.hidden = count < 2 && !more;
        if (!family.badge.hidden) {
            family.badge.appendChild(el('i', 'fa-solid fa-clone'));
            family.badge.appendChild(document.createTextNode(` ${count}${more ? '+' : ''}`));
        }
    };

    const renderNew = () => {
        if (!browse) {
            return;
        }
        const total = browse.preferred.length;
        for (const item of browse.items.slice(rendered)) {
            const key = familyKey(item);
            const known = gridFamilies.get(key);
            if (known) {
                known.members.push(item);
                familyBadge(known);
                continue;
            }
            const cell = el('div', 'stis-cell');
            const img = el('img');
            img.loading = 'lazy';
            img.alt = '';
            img.draggable = false;
            setThumbSource(img, item);
            cell.appendChild(img);
            if (total) {
                cell.appendChild(el('span', 'stis-badge', `${item.matched || 0}/${total}`));
            }
            const badge = el('span', 'stis-set-badge');
            cell.appendChild(badge);
            const family = { rep: item, members: [item], badge, loaded: false };
            gridFamilies.set(key, family);
            familyBadge(family);
            reps.push(item);
            const choice = itemPick(item);
            cell.appendChild(orderBadge(choice));
            if (s.keepLibrary && s.saveLocal) {
                cell.appendChild(saveCellButton(item));
            }
            bindPress(cell, () => {
                if (selecting) {
                    toggleSelect(choice);
                } else {
                    showPreview(item);
                }
            }, () => {
                if (selecting) {
                    toggleSelect(choice);
                    return;
                }
                cell.classList.add('stis-picking');
                pick(item, null);
            });
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
            setStatus(browse.required.length ? 'No pictures with the required tags. Make one preferred or remove it.' : 'No pictures found.');
        } else {
            const sorted = browse.preferred.length ? ', best matches first' : '';
            const failed = browse.siteErrors?.length ? ` (${browse.siteErrors.length} site(s) failed, see debug)` : '';
            setStatus(`${browse.items.length}${browse.done ? '' : '+'} picture(s) on ${siteLabel(browse.domain)}${sorted}${failed}`);
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
        renderChips();
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
        reps = [];
        gridFamilies = new Map();
        saveButtons = new Map();
        ui.grid.querySelectorAll('.stis-cell').forEach(cell => cell.remove());
        ui.grid.scrollTop = 0;
        renderNew();
        if (next.items.length) {
            describe();
        }
        pump();
    };

    function runSearch() {
        clearTimeout(searchTimer);
        if (closed) {
            return;
        }
        const req = requiredList();
        s.lastTags = [...tags];
        s.lastRequired = req;
        s.lastSite = ui.site.value;
        save();
        if (!tags.length) {
            browse = null;
            ui.grid.querySelectorAll('.stis-cell').forEach(cell => cell.remove());
            setStatus('Add a tag to search.');
            renderDebug();
            return;
        }
        const domain = ui.site.value;
        const pre = currentPrefetch();
        if (pre?.browse && !pre.browse.error && sameSearch(pre.browse, domain, tags, req)) {
            useBrowse(pre.browse);
            return;
        }
        if (browse && !browse.error && sameSearch(browse, domain, tags, req)) {
            return;
        }
        if (browse && !browse.error && !browse.loading && browse.items.length && sameRequired(browse, domain, tags, req)) {
            useBrowse(rerankBrowse(browse, tags, req));
            return;
        }
        useBrowse(createBrowse(domain, tags, req));
    }

    const adoptSuggestion = pre => {
        if (closed || edited || !pre?.tags) {
            renderWho();
            return;
        }
        const keepLook = selectedLookName() && pre.lookName !== selectedLookName();
        if (keepLook) {
            renderWho();
            return;
        }
        shown = pre;
        selectedWho = pre.lookName ? pre.lookName.toLowerCase() : '';
        setTags(pre.tags, false, pre.required);
        if (!selectedWho && whoOptions().some(option => option.look)) {
            selectedWho = '*ai*';
        }
        renderWho();
        runSearch();
    };

    const waitForSuggestion = pre => {
        if (!selectedLookName()) {
            setStatus('Suggesting tags…');
        }
        pre.promise.then(() => {
            if (closed || state.prefetch !== pre) {
                return;
            }
            if (pre.error) {
                shown = pre;
                renderDebug();
                if (!selectedLookName()) {
                    setStatus(pre.error, 'stis-error');
                }
                return;
            }
            if (edited) {
                renderWho();
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
        selectedWho = '';
        const pre = startPrefetch();
        if (pre) {
            waitForSuggestion(pre);
        }
    };

    function previewList() {
        return previewState?.kind === 'entry' ? libraryOrder : reps;
    }

    function navigate(delta) {
        if (!previewState || ui.preview.hidden) {
            return;
        }
        const list = previewList();
        const next = list.indexOf(previewState.target) + delta;
        if (next < 0) {
            return;
        }
        if (next >= list.length) {
            if (previewState.kind === 'item' && browse && !browse.done) {
                const before = list.length;
                pump().then(() => {
                    if (reps.length > before) {
                        navigate(delta);
                    }
                });
            }
            return;
        }
        if (previewState.kind === 'entry') {
            showEntry(list[next]);
        } else {
            showPreview(list[next]);
        }
    }

    function closePreview() {
        ui.preview.hidden = true;
        previewState = null;
    }

    function previewShell(src, sourceUrl, target, kind) {
        previewState = { kind, target };
        ui.preview.innerHTML = '';
        ui.preview.scrollTop = 0;
        const main = el('div', 'stis-preview-main');
        const img = el('img', 'stis-preview-img');
        img.draggable = false;
        if (typeof src === 'string') {
            img.src = src;
        } else {
            setPreviewSource(img, src);
        }
        const bar = el('div', 'stis-preview-bar');
        const back = el('div', 'menu_button', 'Back');
        back.addEventListener('click', closePreview);
        const prev = el('div', 'menu_button stis-nav');
        prev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prev.title = 'Previous';
        prev.addEventListener('click', () => navigate(-1));
        const next = el('div', 'menu_button stis-nav');
        next.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        next.title = 'Next';
        next.addEventListener('click', () => navigate(1));
        const list = previewList();
        const more = kind === 'item' && browse && !browse.done ? '+' : '';
        const position = el('small', 'stis-pos', `${list.indexOf(target) + 1} / ${list.length}${more}`);
        const link = el('a', 'stis-post-link', 'Open post');
        link.href = sourceUrl || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.hidden = !sourceUrl;
        bar.append(back, prev, position, next, link);
        main.append(img, bar);
        const below = el('div', 'stis-preview-more');
        ui.preview.append(main, below);
        ui.preview.hidden = false;
        return { bar, img, link, main, below };
    }

    function variantStrip(members, current, onChoose, numbered = false) {
        const strip = el('div', 'stis-variants');
        members.forEach((member, index) => {
            const wrap = el('span', 'stis-variant-wrap');
            const thumb = el('img', 'stis-variant');
            thumb.alt = numbered ? `Picture ${index + 1}` : `Version ${index + 1}`;
            thumb.draggable = false;
            if (member.thumb) {
                setThumbSource(thumb, member);
            } else {
                thumb.src = member.url;
            }
            thumb.classList.toggle('stis-variant-on', member === current);
            thumb.addEventListener('click', () => onChoose(member));
            wrap.appendChild(thumb);
            if (numbered) {
                wrap.appendChild(el('span', 'stis-variant-num', String(index + 1)));
            }
            strip.appendChild(wrap);
        });
        return strip;
    }

    function tagSection(tagNames, below) {
        const unique = [...new Set((tagNames || []).map(normalizeTag).filter(Boolean))];
        const box = el('div', 'stis-tagbox');
        const head = el('div', 'stis-tagbox-head');
        head.append(el('span', '', `Tags (${unique.length})`), el('i', 'fa-solid fa-chevron-down'));
        head.title = 'All the tags of this picture';
        head.addEventListener('click', () => {
            if (typeof ui.preview.scrollTo === 'function') {
                ui.preview.scrollTo({ top: box.offsetTop, behavior: 'smooth' });
            }
        });
        const holder = el('div', 'stis-tagbox-tags');
        const actions = el('div', 'stis-tagbox-actions');
        const picked = new Set();
        const chips = new Map();
        const add = el('div', 'menu_button stis-tagbox-btn');
        const fav = el('div', 'menu_button stis-tagbox-btn');
        const out = el('div', 'menu_button stis-tagbox-btn');
        add.title = 'Add the selected tags to the search, as preferred tags';
        fav.title = 'Add the selected tags to your favorites, or take them out if they all are';
        out.title = 'Never show pictures with the selected tags (change it in the settings)';
        const paint = () => {
            const favorites = favoriteTags();
            chips.forEach((chip, tag) => {
                chip.classList.toggle('stis-tagpick-on', picked.has(tag));
                chip.classList.toggle('stis-tagpick-have', tags.includes(tag));
                chip.querySelector('.stis-tagpick-star').hidden = !favorites.includes(tag);
            });
            const count = picked.size ? ` (${picked.size})` : '';
            add.textContent = `Add to search${count}`;
            fav.textContent = picked.size && [...picked].every(tag => favorites.includes(tag)) ? `☆ Unfavorite${count}` : `★ Favorite${count}`;
            out.textContent = `Leave out${count}`;
            [add, fav, out].forEach(button => button.classList.toggle('stis-disabled', !picked.size));
        };
        unique.forEach(tag => {
            const chip = el('span', 'stis-tagpick');
            chip.append(el('span', 'stis-tagpick-star', '★'), el('span', '', tag));
            chip.title = tags.includes(tag) ? 'Already in the search' : 'Tap to select';
            chip.addEventListener('click', () => {
                if (picked.has(tag)) {
                    picked.delete(tag);
                } else {
                    picked.add(tag);
                }
                paint();
            });
            chips.set(tag, chip);
            holder.appendChild(chip);
        });
        add.addEventListener('click', () => {
            if (!picked.size) {
                return;
            }
            const wanted = [...picked].filter(tag => !tags.includes(tag));
            closePreview();
            if (!ui.libraryView.hidden) {
                setView('search');
            }
            if (wanted.length) {
                setTags([...tags, ...wanted], true, requiredList());
                tagsChanged();
            }
        });
        fav.addEventListener('click', () => {
            if (!picked.size) {
                return;
            }
            const favorites = favoriteTags();
            const allFavorite = [...picked].every(tag => favorites.includes(tag));
            setFavorites(allFavorite ? favorites.filter(tag => !picked.has(tag)) : [...favorites, ...picked]);
            picked.clear();
            paint();
            renderFavs();
        });
        out.addEventListener('click', () => {
            if (!picked.size) {
                return;
            }
            const added = addExcludedTags([...picked]);
            toastr.info(added.length ? `Pictures tagged ${added.join(', ')} are left out from now on. You can change this in the settings.` : 'Those tags are already left out.', 'Image Search');
            picked.clear();
            closePreview();
            if (!added.length || !ui.libraryView.hidden) {
                return;
            }
            if (tags.some(tag => added.includes(tag))) {
                tags = tags.filter(tag => !added.includes(tag));
                added.forEach(tag => required.delete(tag));
                tagsChanged();
            } else {
                runSearch();
            }
        });
        actions.append(add, fav, out);
        box.append(head, holder, actions);
        below.appendChild(box);
        paint();
        return box;
    }

    const itemPick = item => ({ key: `src:${saveKey(item)}`, item });
    const entryPick = (entry, variant = null) => {
        const picture = variant || (hasVariants(entry) ? entry.variants[0] : null);
        const source = (picture || entry).source || entry.source;
        return { key: source ? `src:${source}` : `pic:${(picture || entry).id}`, entry, variant: picture };
    };
    const selectionIndex = key => selection.findIndex(choice => choice.key === key);

    function paintSelection() {
        state.selection = selection;
        ui.root.querySelectorAll('.stis-order').forEach(badge => {
            const index = selectionIndex(badge.dataset.key);
            badge.textContent = index >= 0 ? String(index + 1) : '';
            badge.hidden = !selecting || index < 0;
        });
        ui.selectInfo.textContent = selection.length ? `${selection.length} selected, in story order` : 'Tap pictures in story order';
        ui.selectSave.classList.toggle('stis-disabled', selection.length < 2);
        ui.selectClear.hidden = !selection.length;
        previewState?.paintSelect?.();
    }

    function toggleSelect(choice) {
        const index = selectionIndex(choice.key);
        if (index >= 0) {
            selection.splice(index, 1);
        } else if (selection.length >= 8) {
            toastr.info('A sequence can have up to 8 pictures.', 'Image Search');
            return;
        } else {
            selection.push(choice);
        }
        paintSelection();
    }

    function setSelecting(on) {
        selecting = on;
        ui.root.classList.toggle('stis-selecting', on);
        ui.selectToggle.classList.toggle('stis-tab-on', on);
        ui.selectBar.hidden = !on;
        closePreview();
        paintSelection();
    }

    function selectButton(choice) {
        const button = el('div', 'menu_button stis-select-one');
        const paint = () => {
            const index = selectionIndex(choice.key);
            button.textContent = index >= 0 ? `#${index + 1} selected` : 'Select';
            button.classList.toggle('stis-select-on', index >= 0);
        };
        button.addEventListener('click', () => toggleSelect(choice));
        previewState.paintSelect = paint;
        paint();
        return button;
    }

    function orderBadge(choice) {
        const badge = el('span', 'stis-order');
        badge.dataset.key = choice.key;
        const index = selectionIndex(choice.key);
        badge.textContent = index >= 0 ? String(index + 1) : '';
        badge.hidden = !selecting || index < 0;
        return badge;
    }

    function cellSaveState(item) {
        const state = saveState(item);
        if (state === 'queued' || state === 'saving' || state === 'failed') {
            return state;
        }
        return state === 'done' || (library.loaded && findBySource(item.page)) ? 'done' : '';
    }

    function paintSave(button, item) {
        const state = cellSaveState(item);
        button.innerHTML = '';
        const icon = state === 'done' ? 'fa-solid fa-bookmark' : state === 'failed' ? 'fa-solid fa-triangle-exclamation' : state ? 'fa-solid fa-spinner fa-spin' : 'fa-regular fa-bookmark';
        button.appendChild(el('i', icon));
        button.title = state === 'done' ? 'In the library' : state === 'failed' ? 'Saving failed, tap to try again' : state ? 'Saving to the library…' : 'Save to the library and keep browsing (not added to the chat)';
        button.classList.toggle('stis-cell-saved', state === 'done');
    }

    function saveCellButton(item) {
        const button = el('div', 'stis-cell-save');
        ['pointerdown', 'pointerup', 'mousedown', 'touchstart'].forEach(name => button.addEventListener(name, event => event.stopPropagation(), { passive: true }));
        button.addEventListener('contextmenu', event => {
            event.preventDefault();
            event.stopPropagation();
        });
        button.addEventListener('click', event => {
            event.stopPropagation();
            const state = cellSaveState(item);
            if (state === '' || state === 'failed') {
                queueSave(item, [...tags]);
            }
            paintSave(button, item);
        });
        const key = saveKey(item);
        if (!saveButtons.has(key)) {
            saveButtons.set(key, []);
        }
        saveButtons.get(key).push({ button, item });
        paintSave(button, item);
        return button;
    }

    function updateLibraryTab() {
        const waiting = pendingSaves();
        ui.tabLibrary.textContent = `Library (${library.entries.length})${waiting ? ` · saving ${waiting}` : ''}`;
    }

    function showPreview(item, chosen = null) {
        const family = gridFamilies.get(familyKey(item));
        const current = chosen || item;
        const { bar, img, link, below } = previewShell(current, current.page, item, 'item');
        previewState.variant = current;
        if (s.saveLocal) {
            prepareDownload(current).catch(() => {});
        }
        const stripHolder = el('div', 'stis-variant-holder');
        bar.before(stripHolder);
        const drawStrip = () => {
            stripHolder.innerHTML = '';
            if (family && family.members.length > 1) {
                stripHolder.appendChild(variantStrip(family.members, current, member => showPreview(item, member)));
            }
            setButton.hidden = !family || family.members.length < 2 || !s.saveLocal || !s.keepLibrary;
        };
        const setButton = el('div', 'menu_button', 'Save set');
        setButton.title = 'Save all versions of this picture as one library entry';
        setButton.addEventListener('click', async () => {
            if (busy || setButton.textContent !== 'Save set') {
                return;
            }
            busy = true;
            setButton.textContent = 'Saving set…';
            try {
                const { entry, work } = await saveSet(family.members, [...tags]);
                setButton.textContent = `Set saved (${entry.kind === 'set' ? entry.variants.length : 1})`;
                updateLibraryTab();
                work.then(ok => ok && toastr.success('The set is described and in the lorebook.', 'Image Search'));
            } catch (error) {
                setButton.textContent = 'Save set';
                toastr.warning(String(error?.message || error), 'Image Search');
            }
            busy = false;
        });
        drawStrip();
        if (family && !family.loaded && supportsFamily(item)) {
            const loadFamily = () => fetchFamily(item).then(members => {
                family.loaded = true;
                const seen = new Set(family.members.map(member => member.img));
                members.forEach(member => {
                    if (!seen.has(member.img)) {
                        seen.add(member.img);
                        family.members.push(member);
                    }
                });
                familyBadge(family);
                if (!closed && previewState?.target === item && previewState.variant === current) {
                    drawStrip();
                }
            }).catch(() => {
                family.loaded = true;
                familyBadge(family);
            });
            setTimeout(() => {
                if (!closed && previewState?.target === item) {
                    loadFamily();
                }
            }, families.has(familyKey(item)) ? 0 : 350);
        }
        if (s.keepLibrary && s.saveLocal) {
            const keep = el('div', 'menu_button');
            keep.title = 'Save it in the library without adding it to the chat; you can keep browsing';
            const paintKeep = () => {
                const state = saveState(current);
                const found = library.loaded ? findBySource(current.page) : null;
                keep.textContent = state === 'queued' || state === 'saving' ? 'Saving…' : found ? (found.entry.kind === 'set' ? 'In a saved set' : 'In library') : state === 'failed' ? 'Retry saving' : 'Save to library';
            };
            previewState.paintKeep = paintKeep;
            paintKeep();
            loadLibrary().then(() => {
                if (previewState?.paintKeep === paintKeep) {
                    paintKeep();
                }
            });
            keep.addEventListener('click', () => {
                if (keep.textContent !== 'Save to library' && keep.textContent !== 'Retry saving') {
                    return;
                }
                queueSave(current, [...tags]);
                paintKeep();
            });
            bar.append(keep, setButton);
        }
        if (selecting) {
            bar.append(selectButton(itemPick(current)));
        }
        const use = el('div', 'menu_button stis-use', 'Use this');
        use.addEventListener('click', () => pick(current, use));
        bar.append(use);
        link.href = current.page || '#';
        img.alt = '';
        tagSection(current.tags, below);
    }

    async function storeItem(item, searchTags) {
        const pending = saveJobs.get(saveKey(item));
        if (pending && (pending.state === 'queued' || pending.state === 'saving')) {
            await pending.promise;
        }
        const result = await storePicture(item, searchTags);
        if (result.failed) {
            console.warn('[Image Search] save failed', result.lines);
            toastr.warning(`${result.error} Using the direct link instead, so the AI will not see this picture.`, 'Image Search');
        }
        return { url: result.url, entry: result.entry };
    }

    async function pick(item, button) {
        if (busy) {
            return;
        }
        busy = true;
        if (button) {
            button.textContent = 'Adding…';
        }
        const searchTags = [...tags];
        const who = selectedLookName();
        await popup.completeCancelled();
        let notice = null;
        const slow = setTimeout(() => {
            notice = toastr.info('Adding the picture…', 'Image Search', { timeOut: 0, extendedTimeOut: 0 });
        }, 700);
        try {
            const { url, entry } = await storeItem(item, searchTags);
            if (entry) {
                noteUse(entry, who || ctx().name2 || '');
                saveLibrary();
            }
            insertIntoChatBox(markdownFor(url, searchTags));
        } finally {
            clearTimeout(slow);
            if (notice) {
                toastr.clear?.(notice);
            }
        }
    }

    async function pickEntry(entry, button, variant = null) {
        if (busy) {
            return;
        }
        busy = true;
        if (button) {
            button.textContent = 'Adding…';
        }
        const chosen = variant || (hasVariants(entry) ? entry.variants[0] : null);
        noteUse(entry, selectedLookName() || ctx().name2 || '');
        prepareEntryDescription(entry, chosen);
        saveLibrary();
        await popup.completeCancelled();
        insertIntoChatBox(markdownFor(chosen?.url || entry.url, entry.searchTags.length ? entry.searchTags : entry.tags.slice(0, 6)));
    }

    function confirmButton(label, armedLabel, action) {
        return confirmClicks(el('div', 'menu_button', label), label, armedLabel, action);
    }

    function showEntry(entry, chosen = null) {
        const multi = isMulti(entry);
        const sequence = multi && entry.kind === 'sequence';
        const current = chosen || (multi ? entry.variants[0] : null);
        const { bar, below } = previewShell(current?.url || entry.url, current?.source || entry.source, entry, 'entry');
        previewState.variant = current;
        if (multi) {
            bar.before(variantStrip(entry.variants, current, variant => showEntry(entry, variant), sequence));
        }
        const index = multi ? Math.max(0, entry.variants.indexOf(current)) : 0;
        const info = el('div', 'stis-entry-info');
        info.appendChild(el('div', 'stis-entry-text', entry.description || 'No description yet. One is made the next time you use it, or tap Redo.'));
        if (multi && index > 0) {
            info.appendChild(el('div', 'stis-entry-text', sequence ? `Picture ${index + 1}: ${current.diff || 'not described yet.'}` : `This version: ${current.diff || 'no difference noted yet.'}`));
        }
        const kindLine = multi ? (sequence ? `Sequence of ${entry.variants.length} pictures` : `Set of ${entry.variants.length} versions`) : '';
        const meta = [kindLine, entry.characters.length ? `Used with: ${entry.characters.join(', ')}` : '', `Used ${entry.used} time(s)`].filter(Boolean).join(' · ');
        info.appendChild(el('small', '', meta));
        bar.before(info);
        const redo = el('div', 'menu_button', 'Redo');
        redo.title = sequence ? 'Describe the sequence again' : 'Describe this picture again';
        redo.addEventListener('click', async () => {
            if (redo.textContent !== 'Redo') {
                return;
            }
            redo.textContent = 'Describing…';
            try {
                await redoEntry(entry);
                if (!closed && previewState?.target === entry) {
                    showEntry(entry, current);
                }
            } catch (error) {
                redo.textContent = 'Redo';
                toastr.warning(`Could not describe the picture: ${error?.message || error}`, 'Image Search');
            }
        });
        const removeLabel = sequence ? 'Delete sequence' : multi ? 'Delete set' : 'Delete';
        const armedLabel = sequence ? 'Tap again to delete the sequence' : multi ? `Tap again to delete ${entry.variants.length} pictures` : 'Tap again to delete';
        const remove = confirmButton(removeLabel, armedLabel, async button => {
            button.textContent = 'Deleting…';
            await deleteEntry(entry);
            closePreview();
            renderLibrary();
        });
        remove.title = sequence ? 'Delete the sequence; pictures also saved on their own are kept' : 'Delete from the library, the lorebook and the disk';
        bar.append(redo, remove);
        if (multi && current) {
            const removeOne = confirmButton(sequence ? 'Remove picture' : 'Delete version', sequence ? 'Tap again to remove this picture' : 'Tap again to delete this version', async () => {
                await removeVariant(entry, current);
                if (!closed) {
                    if (library.entries.includes(entry)) {
                        showEntry(entry);
                    } else {
                        closePreview();
                    }
                    renderLibrary();
                }
            });
            bar.append(removeOne);
        }
        if (selecting) {
            bar.append(selectButton(entryPick(entry, current)));
        }
        const use = el('div', 'menu_button stis-use', 'Use this');
        use.addEventListener('click', () => pickEntry(entry, use, current));
        bar.append(use);
        tagSection(current?.tags?.length ? current.tags : entry.tags, below);
    }

    async function renderLibrary() {
        await loadLibrary();
        if (closed) {
            return;
        }
        updateLibraryTab();
        const scroll = ui.libGrid.scrollTop;
        ui.libGrid.innerHTML = '';
        const query = [...wordsOf(ui.libSearch.value)];
        let ranked = rankEntries(library.entries, { text: recentText(2), tags, character: selectedLookName() || ctx().name2 || '' });
        if (query.length) {
            ranked = ranked.filter(({ entry }) => {
                const hay = `${entry.tags.join(' ')} ${entry.description} ${entry.variants.map(variant => variant.diff).join(' ')} ${entry.characters.join(' ')}`.toLowerCase().replace(/_/g, ' ');
                return query.every(word => hay.includes(word));
            });
        }
        libraryOrder = ranked.map(({ entry }) => entry);
        if (!ranked.length) {
            const message = library.broken ? 'The library could not be read.' : library.entries.length ? 'Nothing matches.' : 'Pictures you pick are saved here.';
            ui.libGrid.appendChild(el('div', 'stis-status', message));
            return;
        }
        for (const entry of libraryOrder) {
            const cell = el('div', 'stis-cell');
            const img = el('img');
            img.loading = 'lazy';
            img.alt = '';
            img.draggable = false;
            img.src = entry.url;
            img.onerror = () => cell.classList.add('stis-broken');
            cell.title = shortDescription(entry);
            cell.appendChild(img);
            if (isMulti(entry)) {
                const badge = el('span', 'stis-set-badge');
                badge.appendChild(el('i', entry.kind === 'sequence' ? 'fa-solid fa-film' : 'fa-solid fa-clone'));
                badge.appendChild(document.createTextNode(` ${entry.variants.length}`));
                badge.title = entry.kind === 'sequence' ? 'Sequence' : 'Set of versions';
                cell.appendChild(badge);
            }
            const choice = entryPick(entry);
            cell.appendChild(orderBadge(choice));
            bindPress(cell, () => {
                if (selecting) {
                    toggleSelect(choice);
                } else {
                    showEntry(entry);
                }
            }, () => {
                if (selecting) {
                    toggleSelect(choice);
                    return;
                }
                cell.classList.add('stis-picking');
                pickEntry(entry, null);
            });
            ui.libGrid.appendChild(cell);
        }
        ui.libGrid.scrollTop = scroll;
    }

    function setView(next) {
        const lib = next === 'library';
        ui.top.hidden = lib;
        ui.complete.hidden = true;
        ui.status.hidden = lib;
        ui.grid.hidden = lib;
        ui.lookBar.hidden = lib;
        ui.chipMenu.hidden = lib || !menuTag;
        ui.who.hidden = lib || !ui.who.childElementCount;
        ui.debug.hidden = lib || !s.debug;
        ui.libraryView.hidden = !lib;
        renderFavs();
        renderSites();
        ui.tabSearch.classList.toggle('stis-tab-on', !lib);
        ui.tabLibrary.classList.toggle('stis-tab-on', lib);
        ui.preview.hidden = true;
        previewState = null;
        if (lib) {
            renderLibrary();
        }
    }

    const closeLookForm = () => {
        ui.lookForm.hidden = true;
        ui.lookButton.hidden = false;
    };
    const saveLookForm = () => {
        const name = ui.lookName.value.trim();
        if (!name || !tags.length) {
            toastr.warning(name ? 'Add some tags first.' : 'Type the character name.', 'Image Search');
            return;
        }
        const look = saveLook(name, tags, requiredList());
        if (look) {
            selectedWho = look.name.toLowerCase();
            toastr.success(`Saved ${look.name}'s look.`, 'Image Search');
        }
        closeLookForm();
        renderWho();
    };
    ui.lookButton.addEventListener('click', () => {
        ui.lookName.value = selectedLookName() || currentPrefetch()?.subject || '';
        ui.lookForm.hidden = false;
        ui.lookButton.hidden = true;
        ui.lookName.focus();
    });
    ui.lookSave.addEventListener('click', saveLookForm);
    ui.lookCancel.addEventListener('click', closeLookForm);
    ui.lookName.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            saveLookForm();
        }
    });

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
            updateLibraryTab();
            saveButtons.forEach(list => list.forEach(({ button, item }) => paintSave(button, item)));
        }
    });
    const onSaveChange = (key, state) => {
        if (closed) {
            return;
        }
        (saveButtons.get(key) || []).forEach(({ button, item }) => paintSave(button, item));
        previewState?.paintKeep?.();
        updateLibraryTab();
        if (state === 'done' && !ui.libraryView.hidden && ui.preview.hidden) {
            renderLibrary();
        }
    };
    saveWatchers.add(onSaveChange);
    ui.selectToggle.addEventListener('click', () => setSelecting(!selecting));
    ui.selectDone.addEventListener('click', () => setSelecting(false));
    ui.selectClear.addEventListener('click', () => {
        selection = [];
        paintSelection();
    });
    ui.selectSave.addEventListener('click', async () => {
        if (selection.length < 2 || ui.selectSave.textContent !== 'Save as sequence') {
            return;
        }
        ui.selectSave.textContent = 'Saving…';
        try {
            const { entry, work, failed } = await saveSequence(selection, [...tags]);
            toastr.success(`Sequence of ${entry.variants.length} pictures saved${failed.length ? `, ${failed.length} could not be saved` : ''}. It is being described.`, 'Image Search');
            work.then(ok => ok && toastr.success('The sequence is described and in the lorebook.', 'Image Search'));
            selection = [];
            if (!closed) {
                updateLibraryTab();
                if (!ui.libraryView.hidden) {
                    renderLibrary();
                }
            }
        } catch (error) {
            toastr.warning(String(error?.message || error), 'Image Search');
        }
        ui.selectSave.textContent = 'Save as sequence';
        paintSelection();
    });

    let touchX = null;
    let touchY = 0;
    ui.preview.addEventListener('touchstart', event => {
        const touch = event.changedTouches[0];
        touchX = event.target?.closest?.('.stis-variants, .stis-entry-info, .stis-tagbox') ? null : touch.clientX;
        touchY = touch.clientY;
    }, { passive: true });
    ui.preview.addEventListener('touchend', event => {
        if (touchX === null) {
            return;
        }
        const touch = event.changedTouches[0];
        const dx = touch.clientX - touchX;
        const dy = touch.clientY - touchY;
        if (Math.abs(dx) > 60 && Math.abs(dy) < 60) {
            navigate(dx < 0 ? 1 : -1);
        }
    }, { passive: true });
    const onKey = event => {
        if (ui.preview.hidden) {
            return;
        }
        if (event.key === 'ArrowRight') {
            navigate(1);
        } else if (event.key === 'ArrowLeft') {
            navigate(-1);
        }
    };
    document.addEventListener('keydown', onKey);

    let completeTimer = null;
    let completeItems = [];
    let completeIndex = -1;
    let choosing = false;
    const hideComplete = () => {
        completeItems = [];
        completeIndex = -1;
        ui.complete.innerHTML = '';
        ui.complete.hidden = true;
    };
    const chooseCompletion = name => {
        const parts = ui.input.value.split(',');
        parts[parts.length - 1] = name;
        ui.input.value = parts.join(',');
        hideComplete();
        commitInput();
        choosing = false;
        ui.input.focus();
    };
    const renderComplete = () => {
        ui.complete.innerHTML = '';
        ui.complete.hidden = !completeItems.length;
        completeItems.forEach((item, index) => {
            const option = el('div', 'stis-complete-item');
            option.classList.toggle('stis-complete-on', index === completeIndex);
            option.appendChild(el('span', '', item.fav ? `★ ${item.name}` : item.name));
            if (item.count) {
                option.appendChild(el('small', '', formatCount(item.count)));
            }
            option.addEventListener('pointerdown', () => {
                choosing = true;
                setTimeout(() => {
                    choosing = false;
                }, 600);
            });
            option.addEventListener('mousedown', event => event.preventDefault());
            option.addEventListener('click', () => chooseCompletion(item.name));
            ui.complete.appendChild(option);
        });
    };
    const updateComplete = () => {
        clearTimeout(completeTimer);
        const prefix = normalizeTag(ui.input.value.split(',').pop());
        if (prefix.length < 2) {
            hideComplete();
            return;
        }
        completeTimer = setTimeout(async () => {
            const favorites = favoriteTags().filter(tag => tag.includes(prefix));
            const list = await completeTag(ui.site.value, prefix).catch(() => []);
            if (closed || normalizeTag(ui.input.value.split(',').pop()) !== prefix) {
                return;
            }
            const favItems = favorites.map(name => ({ name, count: list.find(item => item.name === name)?.count || knownCount(ui.site.value, name) || 0, fav: true }));
            completeItems = [...favItems, ...list.filter(item => !favorites.includes(item.name))].filter(item => !tags.includes(item.name)).slice(0, 10);
            completeIndex = -1;
            renderComplete();
        }, 250);
    };
    ui.input.addEventListener('input', updateComplete);

    ui.input.addEventListener('keydown', event => {
        if (!ui.complete.hidden && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            completeIndex = (completeIndex + step + completeItems.length) % completeItems.length;
            renderComplete();
            return;
        }
        if (event.key === 'Escape' && !ui.complete.hidden) {
            event.preventDefault();
            event.stopPropagation();
            hideComplete();
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            if (!ui.complete.hidden && completeIndex >= 0) {
                chooseCompletion(completeItems[completeIndex].name);
                return;
            }
            hideComplete();
            if (!commitInput()) {
                runSearch();
            }
        } else if (event.key === ',') {
            event.preventDefault();
            hideComplete();
            commitInput();
        } else if (event.key === 'Backspace' && !ui.input.value && tags.length) {
            removeTag(tags[tags.length - 1]);
        }
    });
    ui.input.addEventListener('paste', () => setTimeout(() => {
        if (ui.input.value.includes(',')) {
            commitInput();
        }
    }, 0));
    ui.input.addEventListener('blur', () => {
        setTimeout(() => {
            if (choosing || closed) {
                return;
            }
            hideComplete();
            if (ui.input.value.trim()) {
                commitInput();
            }
        }, 150);
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
        renderSites();
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
            clearTimeout(completeTimer);
            saveWatchers.delete(onSaveChange);
            document.removeEventListener('keydown', onKey);
        },
    });
    renderSites();
    if (selection.length && !ui.selectToggle.hidden) {
        setSelecting(true);
    } else {
        paintSelection();
    }
    popup.show();
    observer.observe(ui.sentinel);

    if (Array.isArray(initialTags) && initialTags.length) {
        setTags(initialTags, true);
        renderWho();
        runSearch();
        return;
    }
    let pre = currentPrefetch();
    if (pre?.tags) {
        shown = pre;
        selectedWho = pre.lookName ? pre.lookName.toLowerCase() : '';
        setTags(pre.tags, false, pre.required);
        if (!selectedWho && whoOptions().some(option => option.look)) {
            selectedWho = '*ai*';
        }
        renderWho();
        runSearch();
        return;
    }
    const mentioned = mentionedLooks();
    if (mentioned.length) {
        selectedWho = mentioned[0].name.toLowerCase();
        setTags(mentioned[0].tags, false, mentioned[0].required);
    } else {
        setTags(s.lastTags || [], false, s.lastRequired?.length || !s.lastTags?.length ? s.lastRequired : null);
    }
    renderWho();
    runSearch();
    if (!pre && s.tagProfile) {
        pre = startPrefetch();
    }
    if (pre) {
        if (pre.error) {
            shown = pre;
            renderDebug();
            if (!selectedLookName()) {
                setStatus(pre.error, 'stis-error');
            }
        } else {
            waitForSuggestion(pre);
        }
    } else if (!s.tagProfile && !selectedLookName()) {
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
                <div>Favorite tags (comma-separated; shown as a ★ row in the picker, tap one there to add it)</div>
                <textarea id="st_imagesearch_favorites" class="text_pole"></textarea>
                <div>Character looks (one per line, e.g. <code>Kaelen: !1boy, !muscular_male, bald, beard</code>; <code>!</code> marks tags a picture must have, the others only sort the results). You can also save the current tags with "Save as character look" in the picker.</div>
                <textarea id="st_imagesearch_looks" class="text_pole"></textarea>
                <div>Leave out pictures with these tags (comma-separated; sent to the site as -tag where it allows it, checked here otherwise)</div>
                <textarea id="st_imagesearch_exclude" class="text_pole"></textarea>
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
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_aishow"> <span>Let the AI show saved pictures in its replies</span></label>
                <small>Saved pictures are offered through the lorebook "${LOREBOOK}" (World Info): one entry per picture, triggered by its keywords, at most one picture per reply. Keep that lorebook turned on. You can edit keywords there; your edits are kept.</small>
                <div class="st-imagesearch-library">
                    <div id="st_imagesearch_lib_count">Library</div>
                    <div class="st-imagesearch-row">
                        <div id="st_imagesearch_redo_all" class="menu_button" title="Describe every saved picture again with the vision model">Redo all descriptions</div>
                        <div id="st_imagesearch_delete_all" class="menu_button" title="Remove every saved picture from the library, the lorebook and the disk">Delete everything</div>
                    </div>
                    <small id="st_imagesearch_lib_status"></small>
                </div>
                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_debug"> <span>Show debug info in the picker (site search link, filter counts, tag model reply)</span></label>
                <details>
                    <summary>Advanced</summary>
                    <div class="st-imagesearch-row"><span>Tags required by default (the rest only sort the results)</span><input type="number" min="0" max="6" id="st_imagesearch_required" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Max suggested tags</span><input type="number" min="1" max="20" id="st_imagesearch_max" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Minimum posts for a suggested tag</span><input type="number" min="0" max="100000" id="st_imagesearch_min_posts" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Messages sent to the tag model</span><input type="number" min="1" max="10" id="st_imagesearch_ctx_count" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Characters per message</span><input type="number" min="100" max="4000" id="st_imagesearch_ctx_chars" class="text_pole"></div>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_cards"> <span>Give the tag model what character cards and your persona say about appearance</span></label>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_evidence"> <span>Only keep suggested tags the AI can quote from the story</span></label>
                    <div class="st-imagesearch-row"><span>Tag reply token limit</span><input type="number" min="16" max="4000" id="st_imagesearch_tokens" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Description token limit</span><input type="number" min="32" max="4000" id="st_imagesearch_vision_tokens" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Seconds to wait for the description when sending</span><input type="number" min="0" max="120" id="st_imagesearch_describe_wait" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Depth of the picture offer in the prompt</span><input type="number" min="0" max="50" id="st_imagesearch_aishow_depth" class="text_pole"></div>
                    <div class="st-imagesearch-row"><span>Pictures always listed for the AI (0 = only when keywords match)</span><input type="number" min="0" max="200" id="st_imagesearch_catalog_size" class="text_pole"></div>
                    <div>Description prompt ({{tags}} is filled in)</div>
                    <textarea id="st_imagesearch_vision_prompt" class="text_pole"></textarea>
                    <div id="st_imagesearch_vision_reset" class="menu_button">Reset description prompt</div>
                    <div>Tag prompt ({{max}} and {{context}} are filled in)</div>
                    <textarea id="st_imagesearch_tag_prompt" class="text_pole"></textarea>
                    <div id="st_imagesearch_prompt_reset" class="menu_button">Reset prompt</div>
                    <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_proxy"> <span>Always route through SillyTavern proxy</span></label>
                    <div class="st-imagesearch-row"><span>Image fetcher URL (Cloudflare)</span><input type="text" id="st_imagesearch_fetcher_url" class="text_pole" placeholder="https://imgfetch.yourname.workers.dev"></div>
                    <div class="st-imagesearch-row"><span>Image fetcher key</span><input type="password" id="st_imagesearch_fetcher_key" class="text_pole"></div>
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
    bind('st_imagesearch_aishow', 'aiShow', 'checked', () => scheduleLorebookSync({ activate: true }));
    bind('st_imagesearch_aishow_depth', 'aiShowDepth', 'number', () => scheduleLorebookSync());
    bind('st_imagesearch_catalog_size', 'catalogSize', 'number', () => scheduleLorebookSync());
    bind('st_imagesearch_vision_tokens', 'visionMaxTokens', 'number');
    bind('st_imagesearch_describe_wait', 'describeWaitSec', 'number');
    bind('st_imagesearch_vision_prompt', 'visionPrompt');
    document.getElementById('st_imagesearch_vision_reset').addEventListener('click', () => {
        s.visionPrompt = DEFAULT_VISION_PROMPT;
        document.getElementById('st_imagesearch_vision_prompt').value = DEFAULT_VISION_PROMPT;
        save();
    });
    bind('st_imagesearch_max', 'maxSuggested', 'number');
    bind('st_imagesearch_required', 'requiredCount', 'number');
    bind('st_imagesearch_looks', 'characterLooks');
    bind('st_imagesearch_min_posts', 'minTagPosts', 'number');
    bind('st_imagesearch_blacklist', 'suggestBlacklist');
    bind('st_imagesearch_ctx_count', 'contextMessages', 'number');
    bind('st_imagesearch_ctx_chars', 'contextChars', 'number');
    bind('st_imagesearch_tokens', 'tagMaxTokens', 'number');
    bind('st_imagesearch_cards', 'useCards', 'checked');
    bind('st_imagesearch_evidence', 'requireEvidence', 'checked');
    bind('st_imagesearch_tag_prompt', 'tagPrompt');
    bind('st_imagesearch_proxy', 'useProxy', 'checked');
    bind('st_imagesearch_fetcher_url', 'fetcherUrl');
    bind('st_imagesearch_fetcher_key', 'fetcherKey');
    bind('st_imagesearch_exclude', 'excludeTags');
    const favBox = document.getElementById('st_imagesearch_favorites');
    favBox.value = favoriteTags().join(', ');
    favBox.addEventListener('input', () => {
        s.favoriteTags = normalizeTagList(favBox.value);
        save();
    });
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

    const libCount = document.getElementById('st_imagesearch_lib_count');
    const libStatus = document.getElementById('st_imagesearch_lib_status');
    const pictureCount = () => library.entries.reduce((sum, entry) => sum + entryUrls(entry).length, 0);
    const showLibrary = async () => {
        await loadLibrary();
        const sets = library.entries.filter(entry => entry.kind === 'set' && isMulti(entry)).length;
        const sequences = library.entries.filter(entry => entry.kind === 'sequence' && isMulti(entry)).length;
        const groups = [sets ? `${sets} set${sets === 1 ? '' : 's'}` : '', sequences ? `${sequences} sequence${sequences === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ');
        libCount.textContent = library.broken ? 'The picture library could not be read.' : `Library: ${pictureCount()} picture(s)${groups ? ` (${groups})` : ''}`;
    };
    document.querySelector('#st_imagesearch_settings .inline-drawer-toggle')?.addEventListener('click', () => showLibrary());
    const redoButton = document.getElementById('st_imagesearch_redo_all');
    const redoLabel = 'Redo all descriptions';
    confirmClicks(redoButton, redoLabel, () => `Tap again to describe ${library.entries.length} entr${library.entries.length === 1 ? 'y' : 'ies'} again`, async () => {
        redoButton.textContent = 'Cancel';
        const progress = () => {
            libStatus.textContent = `Describing ${redoState.done} / ${redoState.total}${redoState.failed ? ` (${redoState.failed} failed)` : ''}…`;
        };
        await redoAll(progress);
        const described = redoState.done - redoState.failed;
        libStatus.textContent = `${redoState.cancel ? 'Stopped' : 'Done'}: ${described} described${redoState.failed ? `, ${redoState.failed} failed (see the browser console)` : ''}.`;
        redoButton.textContent = redoLabel;
        showLibrary();
    }, async () => {
        if (redoState.running) {
            redoState.cancel = true;
            redoButton.textContent = 'Stopping…';
            return false;
        }
        await loadLibrary();
        if (library.broken || !library.entries.length) {
            libStatus.textContent = library.broken ? 'The picture library could not be read.' : 'The library is empty.';
            return false;
        }
        if (!visionProfileId()) {
            libStatus.textContent = 'Choose a vision profile (or a tag profile) first.';
            return false;
        }
        return true;
    });
    const deleteButton = document.getElementById('st_imagesearch_delete_all');
    const deleteLabel = 'Delete everything';
    confirmClicks(deleteButton, deleteLabel, () => `Tap again to delete ${pictureCount()} picture(s) and their files`, async () => {
        deleteButton.textContent = 'Deleting…';
        const count = await deleteAllPictures();
        deleteButton.textContent = deleteLabel;
        libStatus.textContent = `Deleted ${count} entr${count === 1 ? 'y' : 'ies'}.`;
        showLibrary();
    }, async () => {
        if (redoState.running || deleteButton.textContent === 'Deleting…') {
            return false;
        }
        await loadLibrary();
        if (library.broken || !library.entries.length) {
            libStatus.textContent = library.broken ? 'The picture library could not be read.' : 'The library is empty.';
            return false;
        }
        return true;
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
    c.setExtensionPrompt?.(PROMPT_KEY, '', 1, 0, false, 0);
    scheduleLorebookSync();
    refreshCleanup();
    setInterval(refreshCleanup, CLEANUP_REFRESH_MS);
    registerCommand();
    addButtons();
    c.eventSource.on(c.eventTypes.APP_READY, addButtons);
    c.eventSource.on(c.eventTypes.MESSAGE_RECEIVED, onAiPictures);
    c.eventSource.on(c.eventTypes.MESSAGE_RECEIVED, onReplyFinished);
    c.eventSource.on(c.eventTypes.MESSAGE_SENT, onMessageSent);
    c.eventSource.on(c.eventTypes.CHAT_CHANGED, onChatChanged);
    if (c.eventTypes.WORLD_INFO_ACTIVATED) {
        c.eventSource.on(c.eventTypes.WORLD_INFO_ACTIVATED, onWorldInfoActivated);
    }
});
