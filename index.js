const MODULE = 'st_imagesearch';
const PROMPT_KEY = 'st_imagesearch_instruction';
const VERSION = '2.28.0';
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
const ENGINE_ORDER = ['gelbooru', 'danbooru', 'moebooru', 'philomena', 'shimmie'];
const NOT_BOARD = new Set(['web', 'web-unchecked', 'none']);
const KNOWN_WEB = /(^|\.)(wikimedia\.org|wikipedia\.org|pexels\.com|unsplash\.com|artstation\.com|flickr\.com|deviantart\.com|pinterest\.[a-z.]+|pixabay\.com|imgur\.com|reddit\.com)$/;
const DROP_TAGS = new Set(['night', 'day', 'daytime', 'nighttime', 'dawn', 'dusk', 'sunset', 'sunrise', 'evening', 'morning', 'afternoon', 'twilight', 'midnight', 'night_sky', 'starry_sky', 'indoors', 'outdoors', 'sunlight', 'moonlight', 'rain', 'snowing', 'cloudy_sky', 'blue_sky', 'scenery', 'forest', 'woods', 'city', 'cityscape', 'street', 'alley', 'beach', 'ocean', 'sea', 'river', 'lake', 'mountain', 'mountains', 'field', 'meadow', 'park', 'garden', 'desert', 'cave', 'village', 'town', 'school', 'classroom', 'library', 'bedroom', 'room', 'kitchen', 'bathroom', 'office', 'cafe', 'tavern', 'inn', 'shrine', 'temple', 'ruins', 'dungeon', 'castle', 'snow', 'grass', 'water', 'sky', 'outdoor', 'indoor', 'urban', 'city_street', 'rooftop', 'building', 'house', 'road', 'standing', 'sitting', 'walking', 'running', 'lying', 'kneeling', 'squatting', 'crouching', 'leaning', 'leaning_forward', 'jumping', 'fighting', 'holding', 'talking', 'walking_away', 'looking_at_viewer', 'looking_away', 'looking_back', 'looking_down', 'looking_up', 'arms_crossed', 'hands_on_hips', 'from_side', 'from_behind', 'from_above', 'from_below', 'full_body', 'upper_body', 'cowboy_shot', 'portrait', 'close-up']);
const TAG_SYNONYMS = { male: '1boy', man: '1boy', boy: '1boy', guy: '1boy', female: '1girl', woman: '1girl', girl: '1girl', lady: '1girl', men: 'multiple_boys', women: 'multiple_girls', two_girls: '2girls', two_boys: '2boys', blond: 'blonde_hair', blonde: 'blonde_hair', blond_hair: 'blonde_hair', redhead: 'red_hair', ginger_hair: 'orange_hair', dark_skinned: 'dark_skin', pale: 'pale_skin', elf_ears: 'pointy_ears' };

const DEFAULT_TAG_PROMPT = 'You pick image-board (booru) tags to find a picture of one person from a roleplay. First decide who the picture should show: {{char}} if they are in the latest messages, otherwise the person the latest message is about. Then give tags for that person only, based only on what the text below says or clearly implies. Never guess: if the text does not say it, leave it out. Three correct tags are better than many guesses. Give at most {{max}} tags.\nUseful kinds of tags, most important first: how many and gender (1girl, 1boy), species if not human, body type and age look, skin color, hair color or baldness, lasting features of the body, and the kind of outfit.\nDo not tag hair length or style, eye color, small accessories, expression, pose or action, place, background, time, weather or lighting. Never use names from the story. Use common booru tags: lowercase, with underscores inside a tag.\nFor every tag, quote the few words of the text below that support it.\n\nReply in exactly this format:\nSubject: the person\'s name, or none\nTags:\ntag = "exact words from the text"\ntag = "exact words from the text"\n\n{{context}}';
const OLD_TAG_PROMPTS = ['Below is the latest part of a roleplay. Reply with up to {{max}} image-board (booru) tags describing who or what is visible right now: character type, hair, eyes, clothing, expression, pose, creatures, objects. Most important tag first. Lowercase, underscores inside multi-word tags (black_hair, cat_ears), separated by commas. No locations, backgrounds, time of day, weather or lighting. Reply with the tags only, nothing else.\n\n{{context}}', 'You choose image-board (booru) tags to find a picture of {{char}} as they appear in the latest part of a roleplay. If {{char}} is not in the scene, tag the person the latest message is about. Reply with up to {{max}} tags, most important first, in this order:\n1. how many and gender: 1girl, 1boy, 2girls (never male, female, man or woman)\n2. species, only if not human: elf, demon_girl, wolf, dragon\n3. hair color, then hair length or style: black_hair, long_hair, ponytail\n4. eye color: blue_eyes\n5. skin color: dark_skin, pale_skin, tan\n6. clothing and accessories: armor, hooded_cloak, glasses\n7. body features: cat_ears, horns, tail, wings, scar, beard\nNever use names of characters, places or anything else from the story. Never describe pose or action (sitting, walking, standing, holding), setting or background (outdoors, urban, forest, room), time, weather or lighting. Only use common booru tags: lowercase, underscores inside a tag, separated by commas. Reply with the tags only.\n\n{{context}}', 'You choose image-board (booru) tags to find pictures that look like {{char}} in the latest part of a roleplay. If {{char}} is not in the scene, tag the person the latest message is about. The user scrolls the results and picks one, so use broad tags for what makes the character recognizable at a glance, not small details. Reply with up to {{max}} tags, most important first:\n1. how many and gender: 1girl, 1boy, 2girls (never male, female, man or woman)\n2. species, only if not human: elf, orc, demon_girl, wolf\n3. body type and age look: muscular_male, fat, skinny, old_man, mature_female, thick_thighs\n4. skin color: dark_skin, pale_skin\n5. hair color, or bald\n6. the most striking features: beard, scar, tattoo, horns, wings, tail, pointy_ears\n7. outfit type: armor, robe, suit, kimono\nDo not tag hair length or style, eye color, small accessories, expression, pose or action, setting, background, time, weather or lighting. Never use names from the story. Only common booru tags: lowercase, underscores inside a tag, separated by commas. Reply with the tags only.\n\n{{context}}', 'You choose image-board (booru) tags to find pictures that look like {{char}} in the latest part of a roleplay. If {{char}} is not in the scene, tag the person the latest message is about. The user scrolls the results and picks one, so use broad tags for what makes the character recognizable at a glance, not small details. Reply with up to {{max}} tags, most important first:\n1. how many and gender: 1girl, 1boy, 2girls (never male, female, man or woman)\n2. species, only if not human: elf, orc, demon_girl, wolf\n3. body type and age look: muscular_male, fat, skinny, old_man, mature_female, thick_thighs\n4. skin color: dark_skin, pale_skin\n5. hair color, or bald\n6. the most striking features: beard, scar, tattoo, horns, wings, tail, pointy_ears\n7. outfit type: armor, robe, suit, kimono\nDo not tag hair length or style, eye color, small accessories, expression, pose or action, setting, background, time, weather or lighting. Never use names from the story. Only common booru tags: lowercase, underscores inside a tag, separated by commas. Reply in exactly this format:\nSubject: the name of the person you tagged, or none\nTags: tag1, tag2, tag3\n\n{{context}}'];
const APPEARANCE_WORDS = /\b(hair|bald|eyes?|skin|tall|short|height|cm|feet|ft|inch(es)?|met(er|re)s?|build|muscular|muscles?|slim|slender|thin|skinny|fat|chubby|plump|curvy|stocky|broad|shoulders|beard|mustache|moustache|scars?|tattoos?|horns?|tails?|wings?|ears?|fur|scales|freckles|wears?|wearing|dressed|clothes|clothing|outfit|armou?r|robes?|dress|uniform|coat|cloak|appearance|looks? like|face|body|figure|years? old|elderly|petite|breasts?|hips|thighs|legs|arms|complexion|pale|tanned|dark-skinned)\b/i;
const DEFAULT_VISION_PROMPT = 'The user of a roleplay is about to show this picture in the story. Describe it for a writer who cannot see it, so they can refer to it in detail. Describe only what is visible; do not invent names or story. Ignore any writing in the picture (speech bubbles, captions, signs, signatures, watermarks); only mention sound effects written as onomatopoeia, such as "BOOM". The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nReply in exactly this format:\nVisual: 2 to 3 sentences on how each person or creature looks and what stands out. For each person always give how old they look (child under about 13, teen 13 to 17, young adult 18 to 25, adult 26 to 39, middle-aged 40 to 59, or old), their skin colour and hair colour (and eye colour when it can be seen), then build, clothing, gear and distinctive features. Give the approximate size of people and important things, by comparison (taller than the doorway, a sword as long as her arm) or by measurement (about 2 m tall).\nExpression: 1 sentence on the face, gaze, posture and body language, and the emotion they show.\nAction: 1 to 2 sentences on what is happening.\nAtmosphere: 1 sentence on the mood of the picture.\nFraming: 1 sentence on the shot: close-up, portrait, upper body or full body, the angle, and where the person is in the picture.\nKeywords: 6 to 10 plain everyday words a story would use for what is in it and what is happening, with the action as a verb (walking, fighting), separated by commas\n\nTags: {{tags}}';
const OLD_VISION_PROMPTS = ['The user of a roleplay is about to show this picture in the story. In 2 to 4 sentences, describe what it shows so a writer who cannot see it can refer to it: who or what is in it, their build, skin, hair, clothing, striking features, what they are doing and the mood. Describe only what is visible. Do not invent names or story. The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nTags: {{tags}}', 'The user of a roleplay is about to show this picture in the story. Describe what it shows so a writer who cannot see it can refer to it: who or what is in it, their build, skin, hair, clothing, striking features, what they are doing and the mood. Describe only what is visible. Do not invent names or story. The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nReply in exactly this format:\nDescription: 2 to 4 sentences\nKeywords: 5 to 8 plain everyday words a story would use for what is in it, separated by commas, e.g. orc, axe, armor, scar, warrior\n\nTags: {{tags}}', 'The user of a roleplay is about to show this picture in the story. Describe it for a writer who cannot see it, so they can refer to it in detail. Describe only what is visible; do not invent names or story. Ignore any writing in the picture (speech bubbles, captions, signs, signatures, watermarks); only mention sound effects written as onomatopoeia, such as "BOOM". The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nReply in exactly this format:\nVisual: 2 to 3 sentences on how each person or creature looks and what stands out: build, skin, hair, clothing, gear and distinctive features. Give the approximate size of people and important things, by comparison (taller than the doorway, a sword as long as her arm) or by measurement (about 2 m tall).\nExpression: 1 sentence on the face, gaze, posture and body language, and the emotion they show.\nAction: 1 to 2 sentences on what is happening.\nAtmosphere: 1 sentence on the mood of the picture.\nFraming: 1 sentence on the shot: close-up, portrait, upper body or full body, the angle, and where the person is in the picture.\nKeywords: 5 to 8 plain everyday words a story would use for what is in it, separated by commas\n\nTags: {{tags}}', 'The user of a roleplay is about to show this picture in the story. Describe it for a writer who cannot see it, so they can refer to it in detail. Describe only what is visible; do not invent names or story. Ignore any writing in the picture (speech bubbles, captions, signs, signatures, watermarks); only mention sound effects written as onomatopoeia, such as "BOOM". The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nReply in exactly this format:\nVisual: 2 to 3 sentences on how each person or creature looks and what stands out: build, skin, hair, clothing, gear and distinctive features. Give the approximate size of people and important things, by comparison (taller than the doorway, a sword as long as her arm) or by measurement (about 2 m tall).\nExpression: 1 sentence on the face, gaze, posture and body language, and the emotion they show.\nAction: 1 to 2 sentences on what is happening.\nAtmosphere: 1 sentence on the mood of the picture.\nFraming: 1 sentence on the shot: close-up, portrait, upper body or full body, the angle, and where the person is in the picture.\nKeywords: 6 to 10 plain everyday words a story would use for what is in it and what is happening, with the action as a verb (walking, fighting), separated by commas\n\nTags: {{tags}}', 'The user of a roleplay is about to show this picture in the story. Describe it for a writer who cannot see it, so they can refer to it in detail. Describe only what is visible; do not invent names or story. Ignore any writing in the picture (speech bubbles, captions, signs, signatures, watermarks); only mention sound effects written as onomatopoeia, such as "BOOM". The picture\'s image-board tags are below; use them as hints but trust the picture.\n\nReply in exactly this format:\nVisual: 2 to 3 sentences on how each person or creature looks and what stands out. For each person always give their skin colour and hair colour (and eye colour when it can be seen), then build, clothing, gear and distinctive features. Give the approximate size of people and important things, by comparison (taller than the doorway, a sword as long as her arm) or by measurement (about 2 m tall).\nExpression: 1 sentence on the face, gaze, posture and body language, and the emotion they show.\nAction: 1 to 2 sentences on what is happening.\nAtmosphere: 1 sentence on the mood of the picture.\nFraming: 1 sentence on the shot: close-up, portrait, upper body or full body, the angle, and where the person is in the picture.\nKeywords: 6 to 10 plain everyday words a story would use for what is in it and what is happening, with the action as a verb (walking, fighting), separated by commas\n\nTags: {{tags}}'];
const SECTIONS = [['visual', 'Visual'], ['expression', 'Expression'], ['action', 'Action'], ['atmosphere', 'Atmosphere'], ['framing', 'Framing']];
const META_TAG = /^(highres|absurdres|lowres|incredibly_absurdres|tagme|official_art|commentary|.*_commentary|commentary_.*|translat.*|.*_request|bad_.*|artist_name|signature|watermark|web_address|md5_mismatch|dated|jpeg_artifacts|third-party_edit|.*_username|copyright_name|character_name|.*_id|.*_background|image_sample|resized|duplicate|revision|variant_set|.*_available|.*_text|text)$/;
const DETAIL_TAGS = new Set(['long_hair', 'short_hair', 'medium_hair', 'very_long_hair', 'absurdly_long_hair', 'ponytail', 'high_ponytail', 'twintails', 'braid', 'single_braid', 'twin_braids', 'bangs', 'blunt_bangs', 'sidelocks', 'hair_between_eyes', 'ahoge', 'hair_ornament', 'hair_ribbon', 'hairband', 'hair_bow', 'hair_over_one_eye', 'smile', 'grin', 'smirk', 'open_mouth', 'closed_mouth', 'blush', 'frown', 'angry', 'serious', 'expressionless', 'teeth', 'closed_eyes', 'half-closed_eyes', 'earrings', 'necklace', 'jewelry', 'ring', 'bracelet', 'choker']);
const EYE_COLOR = /^(aqua|black|blue|brown|green|grey|gray|orange|pink|purple|red|white|yellow|amber|gold|golden|silver|violet|light_blue|dark_blue|light_brown|light_green|multicolored)_eyes$/;

const DEFAULT_POSES = 'standing, walking, running, jumping, sitting, kneeling, crouching, lying down, sleeping, knocked down, falling, fighting, attacking, blocking, casting magic, aiming, holding a weapon, hugging, kissing, holding hands, carrying someone, pinned down, eating, drinking, talking, shouting, laughing, crying, waving, pointing, dancing, bathing, reading, working, riding, flying, swimming, hiding, fleeing, chasing, posing';
const DEFAULT_MOODS = 'happy, cheerful, calm, peaceful, romantic, shy, embarrassed, surprised, scared, worried, sad, angry, determined, confident, smug, playful, tired, pained, serious, tense, menacing, mysterious, triumphant, defeated';

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
    gifFrames: 3,
    gifFrameSize: 768,
    gifSheet: false,
    huntTags: true,
    huntIqdb: true,
    keepLibrary: true,
    aiShow: true,
    aiShowDepth: 2,
    catalogSize: 30,
    sendButton: true,
    confirmPicture: true,
    cards: true,
    poseList: DEFAULT_POSES,
    moodList: DEFAULT_MOODS,
    meaningSource: 'nanogpt',
    meaningModel: '',
    pickShortlist: 30,
    openSections: ['setup'],
    danbooruAccount: '',
    danbooruIds: {},
    pickWindow: true,
    pickWithUser: true,
    pickFocus: 'char',
    pickMain: '',
    pickAllowOther: null,
    firstPass: 50,
    lookSheets: {},
    lookCategories: [],
    lookRules: { noMatch: -20, extraCap: 5 },
    includeVideos: true,
    gifSeconds: 6,
    gifWidth: 480,
    gifFps: 10,
    wiDisabledByUs: [],
    tagPrompt: DEFAULT_TAG_PROMPT,
    debug: false,
    lastTags: [],
    lastRequired: [],
    lastSite: '',
    engines: {},
    termLimits: {},
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

const DONMAI = /(^|\.)donmai\.us$/;
const danbooruIdentity = { account: '', id: '', error: '', pending: null };
const identityWatchers = new Set();

function danbooruAccount() {
    const typed = String(settings().danbooruAccount || '').trim();
    if (typed) {
        return typed;
    }
    const entry = siteEntries().find(site => DONMAI.test(site.domain));
    return entry ? String(new URLSearchParams(entry.extra.replace(/^&+/, '')).get('login') || '').trim() : '';
}

function danbooruAgent() {
    return danbooruIdentity.id ? `SillyImageSearch/${VERSION}; user #${danbooruIdentity.id}` : '';
}

function agentFor(url) {
    return DONMAI.test(hostOf(url)) && danbooruIdentity.id && danbooruIdentity.account === danbooruAccount() ? { 'User-Agent': danbooruAgent() } : {};
}

function resolveDanbooruId({ again = false } = {}) {
    const account = danbooruAccount();
    const tell = () => identityWatchers.forEach(watch => watch());
    if (!account) {
        Object.assign(danbooruIdentity, { account: '', id: '', error: '', pending: null });
        tell();
        return Promise.resolve('');
    }
    if (danbooruIdentity.account === account && (danbooruIdentity.pending || danbooruIdentity.id || (danbooruIdentity.error && !again))) {
        return danbooruIdentity.pending || Promise.resolve(danbooruIdentity.id);
    }
    const number = account.match(/^(?:user\s*)?#?(\d+)$/i);
    const cached = settings().danbooruIds?.[account.toLowerCase()];
    if (number || cached) {
        Object.assign(danbooruIdentity, { account, id: String(number ? number[1] : cached), error: '', pending: null });
        tell();
        return Promise.resolve(danbooruIdentity.id);
    }
    Object.assign(danbooruIdentity, { account, id: '', error: '' });
    danbooruIdentity.pending = (async () => {
        try {
            const wanted = account.toLowerCase().replace(/ /g, '_');
            const result = await request(`https://danbooru.donmai.us/users.json?search%5Bname%5D=${encodeURIComponent(wanted)}&only=id,name&limit=5`, { identify: false });
            const user = (Array.isArray(result.data) ? result.data : []).find(item => String(item?.name || '').toLowerCase() === wanted);
            if (!user) {
                danbooruIdentity.error = result.ok ? `Danbooru has no account called ${account}.` : `Danbooru answered ${result.status} when looking up ${account}.`;
                return '';
            }
            danbooruIdentity.id = String(user.id);
            const s = settings();
            s.danbooruIds = { ...(s.danbooruIds || {}), [account.toLowerCase()]: danbooruIdentity.id };
            save();
            return danbooruIdentity.id;
        } catch (error) {
            danbooruIdentity.error = `Could not look up ${account}: ${error?.message || error}`;
            return '';
        } finally {
            danbooruIdentity.pending = null;
            tell();
        }
    })();
    tell();
    return danbooruIdentity.pending;
}

async function agentHeaders(url) {
    if (!DONMAI.test(hostOf(url)) || !danbooruAccount()) {
        return {};
    }
    await resolveDanbooruId();
    return agentFor(url);
}

async function request(url, options = {}) {
    const s = settings();
    const { identify = true, ...rest } = options;
    if (!s.useProxy) {
        try {
            return await rawFetch(url, rest);
        } catch (error) {
            if (error?.message === 'Request timed out.') {
                throw error;
            }
        }
    }
    let result;
    try {
        const agent = identify ? await agentHeaders(url) : {};
        result = await rawFetch(proxyUrl(url), { ...rest, headers: { ...ctx().getRequestHeaders(), ...agent, ...(rest.headers || {}) } });
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

function isGifUrl(url) {
    try {
        return /\.gif$/i.test(filePath(url));
    } catch {
        return false;
    }
}

function isStillImage(url) {
    try {
        return /\.(jpe?g|png|webp|gif|avif)$/i.test(filePath(url));
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
                return result.text.trim() === '' ? [] : xmlPosts(result.text);
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
    shimmie: {
        cap: 6,
        pageSize: 100,
        emptyMeansNoOrder: true,
        fewTerms: 2,
        url: (origin, tags, extra, page) => `${origin}/api/danbooru/find_posts?limit=100&page=${page + 1}&tags=${encodeURIComponent(tags.join(' '))}${extra}`,
        tags: (userTags, ratings, noOrder, exclude = []) => [...userTags, ...(noOrder ? [] : ['order:score_desc']), ...exclude.slice(0, 8).map(tag => `-${tag}`)],
        parse: result => (result.ok && /<posts[\s>]/i.test(String(result.text || '').slice(0, 2000)) ? xmlPosts(result.text, true) : null),
        image: (post, origin) => withFileHint(absolute(post.file_url, origin), post.file_name),
        full: (post, origin) => withFileHint(absolute(post.file_url, origin), post.file_name),
        thumb: (post, origin) => absolute(post.preview_url, origin),
        postUrl: (post, origin) => `${origin}/post/view/${post.id}`,
        parentId: () => '',
        hasChildren: () => false,
        md5: post => String(post.md5 || ''),
        family: () => [],
        siteUrl: (origin, tags) => `${origin}/post/list/${encodeURIComponent(tags.join(' ') || '*')}/1`,
        rating: post => ({ s: 'general', safe: 'general', q: 'questionable', e: 'explicit' }[String(post.rating || '').toLowerCase()] || ''),
        postTags: post => tagList(post.tags),
    },
};

function withFileHint(url, name) {
    if (!url || !/\.\w{2,5}$/.test(String(name || ''))) {
        return url;
    }
    try {
        const parsed = new URL(url);
        if (/\.\w{2,5}$/.test(parsed.pathname)) {
            return url;
        }
        parsed.hash = `file${String(name).match(/\.\w{2,5}$/)[0].toLowerCase()}`;
        return parsed.href;
    } catch {
        return url;
    }
}

function filePath(url) {
    const parsed = new URL(url);
    return /\.\w{2,5}$/.test(parsed.pathname) ? parsed.pathname : parsed.hash || parsed.pathname;
}

function xmlPosts(text, loose = false) {
    if (!/<posts[\s>]/i.test(String(text || '').slice(0, 2000)) || typeof DOMParser !== 'function') {
        return null;
    }
    let doc = new DOMParser().parseFromString(String(text), 'text/xml');
    if (doc.getElementsByTagName('parsererror').length) {
        if (!loose) {
            return null;
        }
        doc = new DOMParser().parseFromString(String(text), 'text/html');
    }
    return [...doc.getElementsByTagName('post')].map(node => {
        const post = Object.fromEntries([...node.attributes].map(attr => [attr.name, attr.value]));
        for (const child of node.children) {
            post[child.tagName] ??= child.textContent;
        }
        return post;
    });
}

function pageText(text) {
    const raw = String(text || '');
    if (!/^\s*</.test(raw) || !/<(html|body|head|!doctype)/i.test(raw.slice(0, 500))) {
        return raw;
    }
    return raw.replace(/<head[\s\S]*?<\/head>|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() || raw;
}

function siteAnswer(result) {
    const text = String(result?.text || '');
    const plain = text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (/^\(\uFFFD\/\uFFFD/.test(text)) {
        return `${result?.status ?? '?'} with zstd-compressed data that SillyTavern's proxy did not unpack; SillyTavern 1.19.0 and later fix this, so update SillyTavern`;
    }
    const cloudflare = /just a moment|cf-chl|cf_chl|challenge-platform|attention required|cloudflare/i.test(text);
    return `${result?.status ?? '?'}${plain ? ` "${plain.slice(0, 70)}"` : ''}${cloudflare ? ' (a Cloudflare check, which stops SillyTavern\'s server)' : ''}`;
}

function engineFor(name, result) {
    if (name === 'danbooru' && result?.ok && result.data && !Array.isArray(result.data) && Array.isArray(result.data.posts)) {
        return 'e621';
    }
    return name;
}

function siteCopy(url, origin) {
    try {
        const file = new URL(url);
        const site = new URL(origin);
        return file.host !== site.host && !file.pathname.startsWith('/data/') ? `${site.origin}/data${file.pathname}` : '';
    } catch {
        return '';
    }
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
        let img = engine.image(post, origin);
        const full = engine.full(post, origin);
        const thumb = engine.thumb(post, origin);
        const original = absolute(post.file_url, origin) || absolute(post.file?.url, origin) || absolute(post.representations?.full, origin) || full;
        const video = [original, full, img].find(url => url && isVideoUrl(url)) || '';
        if (!isStillImage(img)) {
            const still = [thumb, absolute(post.sample_url, origin), absolute(post.large_file_url, origin), absolute(post.preview?.url, origin)].find(url => url && isStillImage(url));
            if (!video || !still || !settings().includeVideos) {
                stats.notImage++;
                continue;
            }
            img = still;
        }
        const alts = video ? [] : [full, thumb].filter(alt => alt && alt !== img && isStillImage(alt));
        const anim = video ? '' : [original, full, img].find(url => url && isGifUrl(url)) || '';
        const postId = String(post.id ?? '');
        const parentId = engine.parentId(post);
        items.push({
            img,
            thumb: thumb || img,
            alts,
            anim,
            video,
            page: engine.postUrl(post, origin),
            tags,
            domain: origin.replace(/^https?:\/\//, ''),
            postId,
            parentId,
            hasChildren: engine.hasChildren(post),
            md5: engine.md5(post),
            root: parentId || postId,
            siteFiles: engineName === 'danbooru' ? { thumb: siteCopy(thumb, origin), img: siteCopy(img, origin), full: siteCopy(original, origin) } : null,
        });
    }
    return items;
}

const siteAnswers = {};

async function detectEngine(entry, probeTags) {
    const s = settings();
    if (KNOWN_WEB.test(entry.domain)) {
        s.engines[entry.domain] = 'none';
        save();
        return 'none';
    }
    const origin = `https://${entry.domain}`;
    const probe = probeTags.slice(0, 1);
    const answers = [];
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
            delete siteAnswers[entry.domain];
            save();
            return detected;
        }
        answers.push(siteAnswer(result));
    }
    siteAnswers[entry.domain] = answers.find(answer => /Cloudflare/.test(answer)) || answers[0] || '';
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

async function fetchPage(entry, engineName, required, page, wanted = required, negatives = []) {
    const s = settings();
    const engine = ENGINES[engineName];
    const origin = `https://${entry.domain}`;
    const exclude = [...new Set([...negatives, ...excludedTags(wanted)])];
    let noOrder = noOrderSites.has(entry.domain);
    for (let attempt = 0; attempt < 4; attempt++) {
        const limit = Number(s.termLimits?.[entry.domain]) || Infinity;
        const siteTags = required.slice(0, Math.min(engine.cap, limit));
        const localTags = required.slice(siteTags.length);
        const query = engine.tags(siteTags, s.ratings, noOrder, exclude).slice(0, limit);
        const result = await request(engine.url(origin, query, entry.extra, page));
        const posts = engine.parse(result);
        if (posts === null && result.status === 403) {
            const said = pageText(result.text).match(/up to (\d+) tags/i);
            const allowed = said ? Number(said[1]) : query.length > (engine.fewTerms || Infinity) ? engine.fewTerms : 0;
            if (allowed > 0 && allowed < query.length) {
                s.termLimits = { ...(s.termLimits || {}), [entry.domain]: allowed };
                save();
                continue;
            }
        }
        if (posts !== null && !posts.length && page === 0 && engine.emptyMeansNoOrder && !noOrder) {
            noOrder = true;
            noOrderSites.add(entry.domain);
            continue;
        }
        if (posts === null) {
            if (engineName === 'danbooru' && !noOrder) {
                noOrder = true;
                noOrderSites.add(entry.domain);
                continue;
            }
            throw new Error(`${entry.domain} answered ${result.status}: ${pageText(result.text).slice(0, 150)}`);
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

function createBrowse(domain, tags, required, negatives = []) {
    const req = tags.filter(tag => required.includes(tag));
    const browse = { domain, tags: [...tags], required: req, preferred: tags.filter(tag => !req.includes(tag)), negatives: [...negatives], page: 0, items: [], seen: new Set(), done: false, loading: null, error: '', engine: '', pages: [], subs: null, siteErrors: [], scope: searchScope(domain, negatives) };
    if (domain === ALL_SITES) {
        browse.subs = domainsFor(ALL_SITES).map(name => createBrowse(name, tags, required, negatives));
    }
    return browse;
}

function searchScope(domain, negatives = []) {
    return `${domainsFor(domain).join(',')}|${excludedTags().join(',')}|${negatives.join(',')}`;
}

function sameTags(a, b) {
    return a.length === b.length && a.every((tag, i) => tag === b[i]);
}

function sameSearch(browse, domain, tags, required, negatives = []) {
    return Boolean(browse) && browse.domain === domain && browse.scope === searchScope(domain, negatives) && sameTags(browse.tags, tags) && sameTags(browse.required, tags.filter(tag => required.includes(tag)));
}

function sameRequired(browse, domain, tags, required, negatives = []) {
    return Boolean(browse) && browse.domain === domain && browse.scope === searchScope(domain, negatives) && sameTags(browse.required, tags.filter(tag => required.includes(tag)));
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
    const next = createBrowse(old.domain, tags, required, old.negatives || []);
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
        if (DONMAI.test(entry.domain)) {
            await resolveDanbooruId();
        }
        const engineName = await engineOf(entry, browse.required.length ? browse.required : browse.tags);
        browse.engine = engineName;
        if (NOT_BOARD.has(engineName) || !ENGINES[engineName]) {
            throw new Error(`${browse.domain} is not an image board this extension can search${siteAnswers[browse.domain] ? ` (it answered ${siteAnswers[browse.domain]})` : ''}.`);
        }
        const batch = [];
        let received = 0;
        let calls = 0;
        while (!browse.done && received < RANK_WINDOW && calls < MAX_PAGE_CALLS) {
            calls++;
            const { items, done, debug } = await fetchPage(entry, engineName, browse.required, browse.page, [...browse.required, ...browse.preferred], browse.negatives || []);
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

function samplers(temperature) {
    return { temperature, top_p: undefined, top_k: undefined, top_a: undefined, min_p: undefined, frequency_penalty: undefined, presence_penalty: undefined, repetition_penalty: undefined };
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
    const result = await service.sendRequest(s.tagProfile, prompt, Math.max(16, Number(s.tagMaxTokens) || 250), { stream: false, signal, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.2));
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
    sendState.pending = null;
    clearForcePrompt();
    state.catalogSends = 0;
    scheduleLorebookSync();
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

const MAX_ANIMATED_BYTES = 20 * 1024 * 1024;
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

const ORIGINAL_ACCEPT = [
    { 'Accept': 'image/gif,image/png,image/jpeg,image/*;q=0.8,video/*;q=0.7,*/*;q=0.5' },
    { 'Accept': '*/*' },
];

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
    const agent = route === 'proxy' ? await agentHeaders(decodeURIComponent(downloadUrl.replace(/^\/proxy\//, ''))) : {};
    let response;
    try {
        response = route === 'fetcher'
            ? await fetch(downloadUrl)
            : await fetch(downloadUrl, { headers: { ...headers, ...variant, ...agent } });
    } catch (error) {
        throw new Error(`Could not download the picture: ${error?.message || error}`);
    }
    const checkMessage = () => `${hostOf(route === 'proxy' ? decodeURIComponent(downloadUrl.replace(/^\/proxy\//, '')) : downloadUrl) || 'The image server'} asks for a Cloudflare check that SillyTavern's server cannot pass, so the picture could not be saved. Try again later, or save it from another site.`;
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        if (CHALLENGE_PAGE.test(text.slice(0, 20000))) {
            throw new Error(checkMessage());
        }
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
            if (CHALLENGE_PAGE.test(`${title} ${start.slice(0, 2000)}`)) {
                throw new Error(checkMessage());
            }
            const text = start.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
            throw new Error(`The image server sent a web page instead of the picture. Page title: "${title || 'none'}". Text: "${text}"`);
        }
        throw new Error(`The downloaded file is not a supported picture (${type || 'unknown type'}).`);
    }
    return { blob, format };
}

async function downloadImage(url, variants = ACCEPT_VARIANTS) {
    const errors = [];
    const viaFetcher = fetcherLink(url);
    if (viaFetcher) {
        try {
            return await fetchImageBlob(viaFetcher, {}, 'fetcher');
        } catch (error) {
            errors.push(`Cloudflare fetcher: ${error?.message || error}`);
        }
    }
    for (const variant of variants) {
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

const VIDEO_URL = /\.(webm|mp4|m4v|mov)$/i;

function isVideoUrl(url) {
    try {
        return VIDEO_URL.test(filePath(url));
    } catch {
        return false;
    }
}

function colorKey(data, i) {
    return ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
}

function buildPalette(samples, maxColors = 256) {
    const hist = new Uint32Array(32768);
    for (const data of samples) {
        for (let i = 0; i < data.length; i += 4) {
            hist[colorKey(data, i)]++;
        }
    }
    const keys = [];
    for (let key = 0; key < 32768; key++) {
        if (hist[key]) {
            keys.push(key);
        }
    }
    const channel = (key, c) => (c === 0 ? key >> 10 : c === 1 ? (key >> 5) & 31 : key & 31);
    const describe = list => {
        const min = [31, 31, 31];
        const max = [0, 0, 0];
        let count = 0;
        for (const key of list) {
            for (let c = 0; c < 3; c++) {
                const v = channel(key, c);
                if (v < min[c]) {
                    min[c] = v;
                }
                if (v > max[c]) {
                    max[c] = v;
                }
            }
            count += hist[key];
        }
        const ranges = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
        const wide = ranges.indexOf(Math.max(...ranges));
        return { list, count, wide, range: ranges[wide] };
    };
    const boxes = keys.length ? [describe(keys)] : [];
    while (boxes.length < maxColors) {
        let best = -1;
        let bestScore = 0;
        boxes.forEach((box, index) => {
            const score = box.list.length > 1 ? box.range * Math.sqrt(box.count) : 0;
            if (score > bestScore) {
                bestScore = score;
                best = index;
            }
        });
        if (best < 0) {
            break;
        }
        const box = boxes[best];
        box.list.sort((a, b) => channel(a, box.wide) - channel(b, box.wide));
        let seen = 0;
        let cut = 1;
        for (let i = 0; i < box.list.length - 1; i++) {
            seen += hist[box.list[i]];
            if (seen >= box.count / 2) {
                cut = i + 1;
                break;
            }
            cut = i + 1;
        }
        boxes.splice(best, 1, describe(box.list.slice(0, cut)), describe(box.list.slice(cut)));
    }
    const palette = new Uint8Array(maxColors * 3);
    const lookup = new Int16Array(32768).fill(-1);
    boxes.forEach((box, index) => {
        const sum = [0, 0, 0];
        for (const key of box.list) {
            for (let c = 0; c < 3; c++) {
                sum[c] += channel(key, c) * hist[key];
            }
            lookup[key] = index;
        }
        for (let c = 0; c < 3; c++) {
            palette[index * 3 + c] = Math.min(255, Math.round((sum[c] / Math.max(1, box.count)) * 8 + 4));
        }
    });
    return { palette, lookup, size: Math.max(1, boxes.length) };
}

function paletteIndex(table, key) {
    const known = table.lookup[key];
    if (known >= 0) {
        return known;
    }
    const r = (key >> 10) * 8 + 4;
    const g = ((key >> 5) & 31) * 8 + 4;
    const b = (key & 31) * 8 + 4;
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < table.size; i++) {
        const dr = table.palette[i * 3] - r;
        const dg = table.palette[i * 3 + 1] - g;
        const db = table.palette[i * 3 + 2] - b;
        const distance = dr * dr + dg * dg + db * db;
        if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
        }
    }
    table.lookup[key] = best;
    return best;
}

class ByteSink {
    constructor(size = 65536) {
        this.buf = new Uint8Array(size);
        this.length = 0;
    }

    push(value) {
        if (this.length === this.buf.length) {
            const next = new Uint8Array(this.buf.length * 2);
            next.set(this.buf);
            this.buf = next;
        }
        this.buf[this.length++] = value;
    }

    bytes(list) {
        for (const value of list) {
            this.push(value);
        }
    }

    word(value) {
        this.push(value & 255);
        this.push((value >> 8) & 255);
    }

    result() {
        return this.buf.slice(0, this.length);
    }
}

const lzwTables = { stamps: null, codes: null, stamp: 0 };

function lzwFrame(sink, indices) {
    const minCodeSize = 8;
    const clear = 1 << minCodeSize;
    const eoi = clear + 1;
    let next = eoi + 1;
    let codeSize = minCodeSize + 1;
    if (!lzwTables.stamps) {
        lzwTables.stamps = new Uint32Array(1 << 20);
        lzwTables.codes = new Uint16Array(1 << 20);
    }
    const { stamps, codes } = lzwTables;
    let stamp = ++lzwTables.stamp;
    let block = [];
    let bits = 0;
    let shift = 0;
    const flushBlock = () => {
        if (block.length) {
            sink.push(block.length);
            sink.bytes(block);
            block = [];
        }
    };
    const emit = code => {
        bits |= code << shift;
        shift += codeSize;
        while (shift >= 8) {
            block.push(bits & 255);
            bits >>= 8;
            shift -= 8;
            if (block.length === 255) {
                flushBlock();
            }
        }
    };
    sink.push(minCodeSize);
    emit(clear);
    let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) {
        const k = indices[i];
        const key = (prefix << 8) | k;
        if (stamps[key] === stamp) {
            prefix = codes[key];
            continue;
        }
        emit(prefix);
        if (next === 4096) {
            emit(clear);
            next = eoi + 1;
            codeSize = minCodeSize + 1;
            stamp = ++lzwTables.stamp;
        } else {
            if (next >= (1 << codeSize)) {
                codeSize++;
            }
            stamps[key] = stamp;
            codes[key] = next++;
        }
        prefix = k;
    }
    emit(prefix);
    emit(eoi);
    if (shift > 0) {
        block.push(bits & 255);
    }
    flushBlock();
    sink.push(0);
}

function gifEncoder(width, height, table) {
    const sink = new ByteSink(Math.max(65536, width * height));
    sink.bytes([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    sink.word(width);
    sink.word(height);
    sink.bytes([0xF7, 0, 0]);
    sink.bytes(table.palette);
    sink.bytes([0x21, 0xFF, 0x0B, ...[...'NETSCAPE2.0'].map(ch => ch.charCodeAt(0)), 0x03, 0x01, 0, 0, 0]);
    let frames = 0;
    return {
        addFrame(data, delayMs) {
            const indices = new Uint8Array(width * height);
            for (let p = 0, i = 0; p < indices.length; p++, i += 4) {
                indices[p] = paletteIndex(table, colorKey(data, i));
            }
            sink.bytes([0x21, 0xF9, 0x04, 0x04]);
            sink.word(Math.max(2, Math.round(delayMs / 10)));
            sink.bytes([0, 0]);
            sink.push(0x2C);
            sink.word(0);
            sink.word(0);
            sink.word(width);
            sink.word(height);
            sink.push(0);
            lzwFrame(sink, indices);
            frames++;
        },
        finish() {
            sink.push(0x3B);
            return { bytes: sink.result(), frames };
        },
    };
}

async function downloadVideo(url) {
    const errors = [];
    const routes = [fetcherLink(url), proxyUrl(url)].filter(Boolean);
    for (const route of routes) {
        try {
            const response = await fetch(route, route === fetcherLink(url) ? {} : { headers: { ...ctx().getRequestHeaders(), ...await agentHeaders(url) } });
            if (!response.ok) {
                throw new Error(`the server answered ${response.status}`);
            }
            const blob = await response.blob();
            const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
            const isWebm = head[0] === 0x1A && head[1] === 0x45 && head[2] === 0xDF && head[3] === 0xA3;
            const isMp4 = String.fromCharCode(...head.slice(4, 8)) === 'ftyp';
            if (!isWebm && !isMp4 && !/^video\//.test(blob.type)) {
                throw new Error('the download is not a video');
            }
            return blob;
        } catch (error) {
            errors.push(String(error?.message || error));
        }
    }
    throw new Error(`Could not download the video: ${errors.join(' | ')}`);
}

function waitFor(target, event, ms = 8000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`the video did not answer (${event})`));
        }, ms);
        const done = () => {
            cleanup();
            resolve();
        };
        const failed = () => {
            cleanup();
            reject(new Error('the video could not be read on this device'));
        };
        const cleanup = () => {
            clearTimeout(timer);
            target.removeEventListener(event, done);
            target.removeEventListener('error', failed);
        };
        target.addEventListener(event, done, { once: true });
        target.addEventListener('error', failed, { once: true });
    });
}

async function videoToGif(url, { start = 0, seconds = 6, fps = 10, width = 480 } = {}, onProgress = null) {
    const blob = await downloadVideo(url);
    const objectUrl = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    try {
        video.src = objectUrl;
        await waitFor(video, 'loadeddata');
        const duration = Number.isFinite(video.duration) ? video.duration : start + seconds;
        const from = Math.max(0, Math.min(start, Math.max(0, duration - 0.1)));
        const to = Math.min(duration, from + seconds);
        const count = Math.max(1, Math.min(600, Math.round((to - from) * fps)));
        const scale = Math.min(1, width / Math.max(1, video.videoWidth));
        const w = Math.max(1, Math.round(video.videoWidth * scale));
        const h = Math.max(1, Math.round(video.videoHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const grab = async time => {
            video.currentTime = Math.min(Math.max(0, time), Math.max(0, duration - 0.05));
            await waitFor(video, 'seeked');
            context.drawImage(video, 0, 0, w, h);
            return context.getImageData(0, 0, w, h).data;
        };
        const samples = [await grab(from), await grab(from + (to - from) / 2), await grab(Math.max(from, to - 1 / fps))];
        const encoder = gifEncoder(w, h, buildPalette(samples));
        for (let i = 0; i < count; i++) {
            encoder.addFrame(await grab(from + i / fps), 1000 / fps);
            onProgress?.((i + 1) / count);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        const { bytes, frames } = encoder.finish();
        return { blob: new Blob([bytes], { type: 'image/gif' }), frames, width: w, height: h };
    } finally {
        video.removeAttribute('src');
        video.load?.();
        URL.revokeObjectURL(objectUrl);
    }
}

async function convertVideoItem(item, onProgress = null) {
    const s = settings();
    const clamp = (value, min, max, fallback) => Math.min(max, Math.max(min, Number(value) || fallback));
    const made = await videoToGif(item.video, {
        start: Number(item.clipStart) || 0,
        seconds: clamp(item.clipSeconds || s.gifSeconds, 1, 30, 6),
        fps: clamp(s.gifFps, 2, 30, 10),
        width: clamp(s.gifWidth, 120, 1280, 480),
    }, onProgress);
    return { blob: made.blob, format: 'gif', frames: made.frames };
}

async function frameDataUrl(source, width, height, maxSide = 768) {
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
}

async function frameSheet(images, maxSide = 768) {
    const width = images[0].displayWidth || images[0].codedWidth || images[0].width || 1;
    const height = images[0].displayHeight || images[0].codedHeight || images[0].height || 1;
    const cols = Math.ceil(Math.sqrt(images.length));
    const rows = Math.ceil(images.length / cols);
    const gap = 4;
    const scale = Math.min(1, maxSide / Math.max(width, height), 2048 / (cols * width), 2048 / (rows * height));
    const tileWidth = Math.max(1, Math.round(width * scale));
    const tileHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = cols * tileWidth + (cols - 1) * gap;
    canvas.height = rows * tileHeight + (rows - 1) * gap;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const font = Math.max(12, Math.round(Math.min(tileWidth, tileHeight) / 8));
    images.forEach((image, index) => {
        const x = (index % cols) * (tileWidth + gap);
        const y = Math.floor(index / cols) * (tileHeight + gap);
        context.drawImage(image, x, y, tileWidth, tileHeight);
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(x, y, font * (index >= 9 ? 2.1 : 1.5), font * 1.3);
        context.fillStyle = '#ffffff';
        context.font = `bold ${font}px sans-serif`;
        context.textBaseline = 'top';
        context.fillText(String(index + 1), x + font * 0.3, y + font * 0.15);
    });
    return canvas.toDataURL('image/jpeg', 0.85);
}

async function animationFrames(url, blob = null) {
    if (typeof ImageDecoder !== 'function') {
        return null;
    }
    let data = blob;
    if (!data) {
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        data = await response.blob();
    }
    const format = await sniffFormat(data);
    if (!format || !await isAnimated({ blob: data, format })) {
        return null;
    }
    const type = format === 'gif' ? 'image/gif' : format === 'webp' ? 'image/webp' : 'image/png';
    if (ImageDecoder.isTypeSupported && !await ImageDecoder.isTypeSupported(type)) {
        return null;
    }
    const decoder = new ImageDecoder({ data: new Uint8Array(await data.arrayBuffer()), type });
    try {
        await decoder.tracks.ready;
        await decoder.completed?.catch(() => {});
        const count = decoder.tracks.selectedTrack?.frameCount || 1;
        if (count < 2) {
            return null;
        }
        const s = settings();
        const wanted = Math.min(count, 16, Math.max(1, Math.round(Number(s.gifFrames) || 3)));
        const size = Math.min(2048, Math.max(128, Number(s.gifFrameSize) || 768));
        const picks = wanted === 1 ? [0] : [...new Set(Array.from({ length: wanted }, (_, i) => Math.round(i * (count - 1) / (wanted - 1))))];
        if (s.gifSheet && picks.length > 1) {
            const images = [];
            try {
                for (const frameIndex of picks) {
                    images.push((await decoder.decode({ frameIndex })).image);
                }
                const sheet = [await frameSheet(images, size)];
                sheet.count = images.length;
                sheet.sheet = true;
                return sheet;
            } finally {
                images.forEach(image => image.close?.());
            }
        }
        const frames = [];
        for (const frameIndex of picks) {
            const { image } = await decoder.decode({ frameIndex });
            frames.push(await frameDataUrl(image, image.displayWidth || image.codedWidth, image.displayHeight || image.codedHeight, size));
            image.close?.();
        }
        frames.count = frames.length;
        return frames;
    } finally {
        decoder.close?.();
    }
}

async function isAnimated(picture) {
    if (picture.format === 'gif') {
        return true;
    }
    if (picture.format !== 'webp' && picture.format !== 'png') {
        return false;
    }
    const head = new Uint8Array(await picture.blob.slice(0, 4096).arrayBuffer());
    const text = String.fromCharCode(...head);
    return picture.format === 'webp' ? text.includes('ANIM') : text.slice(0, text.indexOf('IDAT') > 0 ? text.indexOf('IDAT') : text.length).includes('acTL');
}

async function shrinkImage(picture) {
    if (typeof createImageBitmap !== 'function') {
        return picture;
    }
    if (await isAnimated(picture) && picture.blob.size <= MAX_ANIMATED_BYTES) {
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
        if (item.video) {
            let notice = null;
            const slow = setTimeout(() => {
                notice = toastr.info('Making a GIF from the video…', 'Image Search', { timeOut: 0, extendedTimeOut: 0 });
            }, 600);
            try {
                return await convertVideoItem(item);
            } catch (error) {
                if (!item.siteFiles?.full || !isVideoUrl(item.siteFiles.full)) {
                    throw error;
                }
                errors.push(`${item.video}: ${error?.message || error}`);
                return await convertVideoItem({ ...item, video: item.siteFiles.full });
            } finally {
                clearTimeout(slow);
                if (notice) {
                    toastr.clear?.(notice);
                }
            }
        }
        for (const anim of [item.anim, item.anim ? item.siteFiles?.full : ''].filter(Boolean)) {
            try {
                const picture = await downloadImage(anim);
                if (await isAnimated(picture) && picture.blob.size <= MAX_ANIMATED_BYTES) {
                    return picture;
                }
                break;
            } catch (error) {
                errors.push(`${anim}: ${error?.message || error}`);
            }
        }
        for (const url of [...new Set([item.img, ...(item.alts || []), item.siteFiles?.img, item.siteFiles?.full].filter(Boolean))]) {
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

function lockedPrompt(locked, prompt) {
    return `The user checked this description of the picture and locked it as correct:\n\n${locked}\n\nRewrite it in the format asked below. Keep every fact it gives and never contradict it; keep its wording where it fits. Look at the picture only to add what the format asks for and the locked description does not say.\n\n${prompt}`;
}

async function requestDescription(url, tags, blob = null, locked = '') {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    const profile = visionProfileId();
    if (!service || !profile) {
        throw new Error('No vision profile chosen in Image Search settings.');
    }
    const asked = String(s.visionPrompt || DEFAULT_VISION_PROMPT).replace(/\{\{tags\}\}/g, () => tags.join(', ') || 'none');
    const prompt = locked ? lockedPrompt(locked, asked) : asked;
    const ask = async (text, images) => {
        const messages = [{ role: 'user', content: [{ type: 'text', text }, ...images.map(image => ({ type: 'image_url', image_url: { url: image } }))] }];
        const result = await service.sendRequest(profile, messages, Math.max(32, Number(s.visionMaxTokens) || 300), { stream: false, extractData: true, includePreset: false, includeInstruct: false }, samplers(0.3));
        return String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    };
    let frames = null;
    try {
        frames = await animationFrames(url, blob);
    } catch (error) {
        console.warn('[Image Search] could not read the animation frames', error);
    }
    let raw = '';
    if (frames?.count > 1) {
        const shown = frames.sheet
            ? `You get one picture with ${frames.count} moments from it, numbered 1 to ${frames.count} (left to right, then top to bottom), evenly spread from the start to the end.`
            : `You get ${frames.count} moments from it, in order, evenly spread from the start to the end.`;
        try {
            raw = await ask(`This picture is a short animation (a GIF). ${shown} Describe it as one moving picture; in Action, say what happens from the start to the end.\n\n${prompt}`, frames);
        } catch (error) {
            console.warn('[Image Search] the vision model refused several frames, using the first one', error);
        }
    }
    if (!raw) {
        raw = await ask(prompt, [await imageDataUrl(url, blob)]);
    }
    const parsed = parseDescription(raw);
    parsed.animated = Boolean(frames?.length);
    if (!parsed.text) {
        throw new Error('The vision model gave no description.');
    }
    return parsed;
}

function readyDescription(url, tags, text) {
    return { url, tags: tags || [], text: text || '', error: '', started: Date.now(), ms: 0, done: true, promise: Promise.resolve() };
}

function startDescription(url, postTags, onDone, blob = null, tagsLater = null) {
    const s = settings();
    if (!s.describe) {
        return;
    }
    const entry = { url, tags: summaryTags(postTags), text: '', sections: {}, keywords: [], error: '', started: Date.now(), ms: 0, done: false };
    entry.promise = (tagsLater ? tagsLater.then(tags => {
        entry.tags = summaryTags(tags);
    }).catch(() => {}) : Promise.resolve())
        .then(() => requestDescription(url, entry.tags, blob))
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
        animated: Boolean(entry.animated),
        described: String(entry.described || ''),
        borrowed: entry.borrowed && typeof entry.borrowed === 'object' && entry.borrowed.site ? { site: String(entry.borrowed.site), id: String(entry.borrowed.id || ''), page: String(entry.borrowed.page || ''), how: String(entry.borrowed.how || ''), alike: Number(entry.borrowed.alike) || 0, at: Number(entry.borrowed.at) || Date.now() } : null,
        lock: entry.lock && typeof entry.lock === 'object' && String(entry.lock.text || '').trim() ? { text: String(entry.lock.text), at: Number(entry.lock.at) || Date.now() } : null,
        card: cleanCard(entry.card),
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
            scheduleFiling(6000);
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

function saveLibrary({ skipSync = false, skipFiling = false } = {}) {
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
        if (!skipFiling) {
            scheduleFiling();
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
    return readyDescription(variant?.url || entry.url, entry.tags, entry.animated && text ? `An animated picture (GIF).\n${text}` : text);
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
        entry.lock = null;
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
    const result = await service.sendRequest(visionProfileId(), [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }] }], 160, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, samplers(0.3));
    return String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*\**(picture\s*\d+|step\s*\d+)\**\s*:\s*/i, '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

async function describeDifference(entry, index, blob) {
    const service = ctx().ConnectionManagerRequestService;
    const image = await imageDataUrl(entry.variants[index].url, blob || null);
    const scene = [entry.sections?.visual, entry.sections?.action].filter(Boolean).join(' ') || entry.description;
    const prompt = `This picture is one version of a scene described below. In 1 sentence, say only what this version shows that is different: expression, pose, outfit, framing or what is happening. Ignore writing in the picture, except onomatopoeia.\n\nThe scene: ${scene}`;
    const result = await service.sendRequest(visionProfileId(), [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }] }], 120, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, samplers(0.3));
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
    const locked = Boolean(entry.lock?.text);
    let parsed = null;
    if (!locked) {
        try {
            const images = [];
            for (let i = 0; i < count; i++) {
                images.push(await imageDataUrl(entry.variants[i].url, blobs[i] || null, count > 3 ? 768 : 1024));
            }
            const content = [{ type: 'text', text: sequence ? sequencePrompt(firstTags, count) : setPrompt(entry.tags, count) }, ...images.map(url => ({ type: 'image_url', image_url: { url } }))];
            const result = await service.sendRequest(profile, [{ role: 'user', content }], Math.max(64, Number(s.visionMaxTokens) || 700) + 80 * count, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, samplers(0.3));
            parsed = parseDescription(String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim());
        } catch (error) {
            console.warn('[Image Search] set description failed, describing one picture at a time', error);
        }
    }
    if (locked) {
        parsed = await requestDescription(entry.variants[0].url, firstTags, blobs[0] || null, entry.lock.text);
        parsed.variants = {};
    }
    if (!parsed?.text) {
        parsed = await requestDescription(entry.variants[0].url, firstTags, blobs[0] || null);
        parsed.variants = {};
    }
    entry.description = parsed.text;
    entry.described = visionHash();
    entry.sections = parsed.sections || {};
    entry.keywords = parsed.keywords || [];
    for (let i = 1; i < entry.variants.length; i++) {
        let diff = parsed.variants?.[i + 1] || (locked ? entry.variants[i].diff || '' : '');
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
        const result = await requestDescription(entry.url, entry.tags, null, entry.lock?.text || '');
        entry.description = result.text;
        entry.described = visionHash();
        entry.sections = result.sections || {};
        entry.keywords = result.keywords || [];
        descriptions.set(entry.url, readyDescription(entry.url, entry.tags, entry.description));
    }
    if (saveNow) {
        await saveLibrary();
    }
    return entry;
}

const redoState = { running: false, cancel: false, done: 0, total: 0, failed: 0, skipped: 0, videos: 0, stills: [], errors: [] };

const ANIMATED_TAGS = new Set(['animated', 'animated_gif', 'gif', 'animated_png', 'animation', 'video', 'webm', 'mp4', 'ugoira']);

function stillGifs() {
    const found = [];
    for (const entry of library.entries) {
        const pictures = isMulti(entry) ? entry.variants.map(variant => ({ entry, variant, tags: variant.tags.length ? variant.tags : entry.tags, url: variant.url, source: variant.source || entry.source })) : [{ entry, variant: null, tags: entry.tags, url: entry.url, source: entry.source }];
        for (const picture of pictures) {
            if (!/\.gif(\?|$)/i.test(picture.url) && !(picture.entry.animated && !picture.variant) && picture.tags.some(tag => ANIMATED_TAGS.has(normalizeTag(tag))) && postRef(picture.source)) {
                found.push(picture);
            }
        }
    }
    return found;
}

function postRef(source) {
    try {
        const url = new URL(source);
        const id = url.searchParams.get('id') || (url.pathname.match(/\/(?:posts|post\/show|post\/view|images)\/(\d+)/) || [])[1];
        return /^\d+$/.test(String(id || '')) ? { domain: url.hostname, origin: url.origin, id: String(id) } : null;
    } catch {
        return null;
    }
}

function everyRating() {
    return Object.fromEntries(RATINGS.map(rating => [rating, true]));
}

async function sourcePost(ref) {
    const domain = ref.domain.replace(/^www\./, '');
    const engine = ENGINES[settings().engines?.[domain]];
    if (!engine) {
        throw new Error(`${domain} is not detected yet: search it once first`);
    }
    const extra = siteEntries().find(entry => entry.domain === domain)?.extra || '';
    const result = await request(engine.url(ref.origin, engine.tags([`id:${ref.id}`], everyRating(), true, []), extra, 0));
    const posts = engine.parse(result) || [];
    const post = posts.find(item => String(item.id) === ref.id) || (posts.length === 1 ? posts[0] : null);
    if (!post) {
        throw new Error(`${domain} did not return post ${ref.id}`);
    }
    return { post, engine };
}

async function originalFile(ref) {
    const { post, engine } = await sourcePost(ref);
    const choices = [post.file_url, post.file?.url, post.view_url, post.representations?.full, engine.full(post, ref.origin)].map(url => absolute(url, ref.origin)).filter(Boolean);
    const usable = choices.filter(url => !/\.zip(\?|$)/i.test(url));
    const url = usable[0] || absolute(post.large_file_url, ref.origin) || absolute(post.sample?.url, ref.origin);
    if (!url) {
        throw new Error(`${ref.domain} gave no file for post ${ref.id} (it may need a login)`);
    }
    return url;
}

const FEW_TAGS = 10;
const HUNT_WAIT = 25000;
const HUNT_SKIP = new Set(['sound', 'webm', 'mp4', 'gif', 'tagme', 'artist_request', 'source_request', 'character_request', 'copyright_request']);

function tagPoor(entry) {
    return !isMulti(entry) && !entry.borrowed && entry.tags.length < FEW_TAGS;
}

function huntNames(entry) {
    return [...new Set([...(entry.searchTags || []), ...entry.tags].map(normalizeTag))]
        .filter(tag => tag && !HUNT_SKIP.has(tag) && !ANIMATED_TAGS.has(tag) && !/^-|[:*]/.test(tag))
        .slice(0, 12);
}

function postRatio(post) {
    const width = Number(post.width ?? post.image_width ?? post.file?.width ?? post.jpeg_width) || 0;
    const height = Number(post.height ?? post.image_height ?? post.file?.height ?? post.jpeg_height) || 0;
    return width && height ? width / height : 0;
}

async function pictureHash(source) {
    const blob = source instanceof Blob ? source : String(source).startsWith('/') ? await (await fetch(source)).blob() : (await downloadImage(source)).blob;
    const bitmap = await createImageBitmap(blob);
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 9;
        canvas.height = 8;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, 9, 8);
        context.drawImage(bitmap, 0, 0, 9, 8);
        const data = context.getImageData(0, 0, 9, 8).data;
        const gray = [];
        for (let i = 0; i < data.length; i += 4) {
            gray.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }
        let bits = '';
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                bits += gray[y * 9 + x] > gray[y * 9 + x + 1] ? '1' : '0';
            }
        }
        return { bits, ratio: bitmap.width / bitmap.height };
    } finally {
        bitmap.close?.();
    }
}

function hashDistance(a, b) {
    let distance = 0;
    for (let i = 0; i < 64; i++) {
        if (a[i] !== b[i]) {
            distance++;
        }
    }
    return distance;
}

async function huntSites(entry) {
    const own = hostOf(entry.source) || entry.site;
    const targets = [];
    for (const site of siteEntries()) {
        if (site.domain === own || KNOWN_WEB.test(site.domain)) {
            continue;
        }
        const engineName = await engineOf(site, ['1girl']).catch(() => '');
        if (ENGINES[engineName]) {
            targets.push({ site, engineName, engine: ENGINES[engineName], origin: `https://${site.domain}` });
        }
    }
    return targets;
}

async function sitePosts(target, terms, page = 0) {
    const limit = Number(settings().termLimits?.[target.site.domain]) || Infinity;
    const query = target.engine.tags(terms, everyRating(), true, []).slice(0, limit);
    const result = await request(target.engine.url(target.origin, query, target.site.extra, page));
    return target.engine.parse(result) || [];
}

function huntMatch(target, post, how, alike) {
    return { domain: target.site.domain, id: String(post.id ?? ''), page: target.engine.postUrl(post, target.origin), tags: target.engine.postTags(post).map(normalizeTag), how, alike };
}

function sameFile(target, post, md5) {
    return Boolean(md5) && String(target.engine.md5(post) || '').toLowerCase() === md5;
}

async function findByMd5(targets, md5) {
    const results = await Promise.all(targets.filter(target => target.engineName !== 'philomena').map(async target => {
        try {
            const post = (await sitePosts(target, [`md5:${md5}`])).find(item => sameFile(target, item, md5));
            return post ? huntMatch(target, post, 'same file', 100) : null;
        } catch (error) {
            console.debug(`[Image Search] md5 search failed on ${target.site.domain}`, error);
            return null;
        }
    }));
    return results.find(Boolean) || null;
}

async function closestThumb(pool, own, budget) {
    const queue = pool.slice(0, Math.max(0, budget.left));
    budget.left -= queue.length;
    let best = null;
    const worker = async () => {
        while (queue.length && !(best && best.distance <= 2)) {
            const candidate = queue.shift();
            try {
                const distance = hashDistance(own.bits, (await pictureHash(candidate.thumb)).bits);
                if (!best || distance < best.distance) {
                    best = { ...candidate, distance };
                }
            } catch (error) {
                console.debug('[Image Search] could not compare a thumbnail', candidate.thumb, error);
            }
        }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    return best && best.distance <= 8 ? best : null;
}

async function findByNames(targets, entry, own, md5) {
    const names = huntNames(entry);
    if (!names.length) {
        return null;
    }
    const budget = { left: 80 };
    const seen = new Set();
    for (const target of targets) {
        const domain = target.site.domain;
        const spellings = [...new Set(names.flatMap(name => {
            const parts = name.split('_');
            return parts.length === 2 ? [name, `${parts[1]}_${parts[0]}`] : [name];
        }))];
        await lookupTags(domain, target.engineName, spellings).catch(() => {});
        const counted = spellings.map(name => ({ name, count: knownCount(domain, name) }));
        const usable = counted.some(item => item.count !== null) ? counted.filter(item => item.count > 0).sort((a, b) => a.count - b.count) : counted;
        for (const { name } of usable.slice(0, 2)) {
            const pool = [];
            for (const terms of entry.animated ? [[name, 'animated'], [name]] : [[name]]) {
                for (let page = 0; page < 2; page++) {
                    let posts = [];
                    try {
                        posts = await sitePosts(target, terms, page);
                    } catch (error) {
                        console.debug(`[Image Search] name search failed on ${domain}`, error);
                        break;
                    }
                    for (const post of posts) {
                        if (sameFile(target, post, md5)) {
                            return huntMatch(target, post, 'same file', 100);
                        }
                        const ratio = postRatio(post);
                        const thumb = target.engine.thumb(post, target.origin);
                        if (!thumb || seen.has(thumb) || (own.ratio && ratio && Math.abs(ratio - own.ratio) / own.ratio > 0.04)) {
                            continue;
                        }
                        seen.add(thumb);
                        pool.push({ target, post, thumb });
                    }
                    if (posts.length < target.engine.pageSize) {
                        break;
                    }
                }
            }
            const best = await closestThumb(pool, own, budget);
            if (best) {
                return huntMatch(best.target, best.post, 'alike', Math.round((64 - best.distance) / 64 * 100));
            }
            if (budget.left <= 0) {
                return null;
            }
        }
    }
    return null;
}

async function findOnIqdb(thumb, targets) {
    const result = await request(`https://iqdb.org/?url=${encodeURIComponent(thumb)}`);
    if (!result.ok || typeof DOMParser !== 'function') {
        return null;
    }
    const doc = new DOMParser().parseFromString(String(result.text || ''), 'text/html');
    const matches = [...doc.querySelectorAll('table')].map(table => {
        const text = table.textContent || '';
        const alike = Number((text.match(/(\d+)%\s*similarity/i) || [])[1]) || 0;
        const link = table.querySelector('a[href]');
        const image = table.querySelector('img');
        return { href: absolute(link?.getAttribute('href') || '', 'https://iqdb.org'), alike, alt: image?.getAttribute('alt') || image?.getAttribute('title') || '', mine: /your image/i.test(text) };
    }).filter(match => match.href && match.alike && !match.mine).sort((a, b) => b.alike - a.alike);
    const best = matches.find(match => match.alike >= 90);
    if (!best) {
        return null;
    }
    const ref = postRef(best.href);
    const target = ref && targets.find(item => item.site.domain === hostOf(best.href));
    if (ref && target) {
        try {
            const { post } = await sourcePost(ref);
            return huntMatch(target, post, 'alike (IQDB)', best.alike);
        } catch (error) {
            console.debug('[Image Search] could not read the IQDB match', best.href, error);
        }
    }
    const tags = String((best.alt.match(/Tags:\s*(.*)$/i) || [])[1] || '').split(/\s+/).map(normalizeTag).filter(Boolean);
    return tags.length ? { domain: hostOf(best.href), id: ref?.id || '', page: best.href, tags, how: 'alike (IQDB)', alike: best.alike } : null;
}

async function huntTags(entry, { item = null, blob = null } = {}) {
    if (isMulti(entry)) {
        return null;
    }
    const ref = postRef(entry.source);
    let md5 = String(item?.md5 || '').toLowerCase();
    let thumb = item?.thumb || '';
    if ((!md5 || !thumb) && ref) {
        try {
            const { post, engine } = await sourcePost(ref);
            md5 = md5 || String(engine.md5(post) || '').toLowerCase();
            thumb = thumb || engine.thumb(post, ref.origin);
        } catch (error) {
            console.debug('[Image Search] could not read the source post', entry.source, error);
        }
    }
    const targets = await huntSites(entry);
    let match = targets.length && md5 ? await findByMd5(targets, md5) : null;
    if (!match && targets.length) {
        const own = await pictureHash(blob || entry.url).catch(error => {
            console.debug('[Image Search] could not read the saved picture to compare it', error);
            return null;
        });
        if (own) {
            match = await findByNames(targets, entry, own, md5);
        }
    }
    if (!match && settings().huntIqdb && thumb) {
        match = await findOnIqdb(thumb, targets).catch(error => {
            console.debug('[Image Search] IQDB search failed', error);
            return null;
        });
    }
    if (!match?.tags.length) {
        return null;
    }
    entry.tags = summaryTags([...entry.tags, ...match.tags]);
    entry.borrowed = { site: match.domain, id: match.id, page: match.page, how: match.how, alike: match.alike, at: Date.now() };
    if (entry.card && !entry.card.edited) {
        entry.card.basis = '';
    }
    return match;
}

function borrowedLine(entry) {
    const from = entry.borrowed;
    return from ? `Tags from ${from.site}${from.id ? ` #${from.id}` : ''} (${from.how === 'same file' ? 'same file' : `${from.alike}% alike${from.how.includes('IQDB') ? ', found by IQDB' : ''}`})` : '';
}

async function huntAll(onProgress) {
    if (redoState.running) {
        return 0;
    }
    await loadLibrary();
    const queue = library.entries.filter(tagPoor);
    Object.assign(redoState, { running: true, cancel: false, done: 0, total: queue.length, failed: 0, found: 0 });
    onProgress?.();
    try {
        for (const entry of queue) {
            if (redoState.cancel) {
                break;
            }
            try {
                if (await huntTags(entry)) {
                    redoState.found++;
                    await redoEntry(entry, { save: false });
                }
            } catch (error) {
                redoState.failed++;
                console.warn('[Image Search] finding tags failed', entry.id, error);
            }
            redoState.done++;
            if (redoState.done % 5 === 0) {
                await saveLibrary();
            }
            onProgress?.();
        }
    } finally {
        redoState.running = false;
        await saveLibrary();
        onProgress?.();
    }
    return redoState.found;
}

async function redownloadGif(picture) {
    const url = await originalFile(postRef(picture.source));
    let file = null;
    if (isVideoUrl(url)) {
        file = await convertVideoItem({ video: url });
        redoState.videos++;
    } else {
        try {
            file = await downloadImage(url, ORIGINAL_ACCEPT);
        } catch (error) {
            if (!/not a supported picture \(video\//.test(String(error?.message))) {
                throw error;
            }
            file = await convertVideoItem({ video: url });
            redoState.videos++;
        }
    }
    if (!(await isAnimated(file))) {
        redoState.stills.push(`${url.split('/').pop()} (${file.format})`);
        return false;
    }
    const src = await uploadImage(file);
    const old = picture.url;
    if (picture.variant) {
        picture.variant.url = src;
        if (picture.entry.url === old) {
            picture.entry.url = src;
        }
    } else {
        picture.entry.url = src;
    }
    picture.entry.animated = true;
    descriptions.delete(old);
    return old;
}

async function redownloadGifs(onProgress) {
    if (redoState.running) {
        return;
    }
    await loadLibrary();
    const queue = stillGifs();
    Object.assign(redoState, { running: true, cancel: false, done: 0, total: queue.length, failed: 0, skipped: 0, videos: 0, stills: [], errors: [] });
    onProgress?.();
    const replaced = [];
    try {
        for (const picture of queue) {
            if (redoState.cancel) {
                break;
            }
            try {
                const old = await redownloadGif(picture);
                if (old) {
                    replaced.push(old);
                } else {
                    redoState.skipped++;
                }
            } catch (error) {
                redoState.failed++;
                redoState.errors.push(String(error?.message || error).slice(0, 120));
                console.warn('[Image Search] could not download the animated version', picture.source, error);
            }
            redoState.done++;
            onProgress?.();
        }
    } finally {
        redoState.running = false;
        await saveLibrary();
        onProgress?.();
    }
    return replaced.length;
}

async function redoAll(onProgress, only = null) {
    if (redoState.running) {
        return;
    }
    await loadLibrary();
    const queue = [...(only || library.entries)];
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
                entry.described = visionHash();
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
    if (entry && blob) {
        entry.animated = await isAnimated({ blob, format: await sniffFormat(blob) }).catch(() => false);
    }
    const hunt = entry && s.huntTags && tagPoor(entry) ? huntTags(entry, { item, blob }).catch(error => {
        console.warn('[Image Search] finding tags elsewhere failed', error);
        return null;
    }) : null;
    let huntLate = false;
    const tagsLater = hunt ? Promise.race([hunt.then(() => 'found'), new Promise(resolve => setTimeout(() => resolve('late'), HUNT_WAIT))]).then(winner => {
        huntLate = winner === 'late';
        return entry.tags;
    }) : null;
    startDescription(src, item.tags, (text, keywords, sections) => {
        if (entry) {
            entry.description = text;
            entry.described = visionHash();
            entry.keywords = keywords;
            entry.sections = sections || {};
            saveLibrary();
        }
    }, blob, tagsLater);
    hunt?.then(async match => {
        if (!match) {
            return;
        }
        await descriptions.get(src)?.promise;
        if (huntLate && s.describe) {
            await redoEntry(entry).catch(error => console.warn('[Image Search] could not describe the picture again with its new tags', error));
        } else {
            await saveLibrary();
        }
    });
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
    const extra = entry.variants.map(variant => variant.diff || '').join(' ');
    for (const word of wordsOf(`${entry.description} ${extra}`)) {
        if (words.has(word)) {
            score += 1;
        }
    }
    for (const keyword of entry.keywords) {
        if (String(keyword).toLowerCase().split(/\s+/).some(part => words.has(part))) {
            score += 2;
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
    return `[pic:${entry.id}] ${summary}${entry.animated ? ' (animated)' : ''}`;
}

function pictureCatalog(size) {
    const usable = library.entries.filter(entry => entry.description || entry.tags.length);
    const recent = rankEntries(usable, { text: recentText(8), character: ctx().name2 || '' }).map(({ entry }) => entry).slice(0, size);
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
    return [`Saved picture [pic:${entry.id}], a real ${entry.animated ? 'animated picture (GIF)' : 'picture'}. ${SHOW_RULE} If it fits the moment or the user asks for it, write [pic:${entry.id}] on its own line where it belongs; ${rule}`, body, tags].filter(Boolean).join('\n');
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

const CARD_BATCH = 8;
const CARD_VERSION = 5;
const SHEET_VERSION = 4;
const VECTOR_COLLECTION = 'imagesearch_pictures';
const MEANING_MODELS = { nanogpt: 'text-embedding-3-small', openai: 'text-embedding-3-small' };
const filing = { running: null, timer: null, failed: new Map(), total: 0, done: 0, made: 0, error: '', warned: false, started: 0, stage: '', bar: false, dismissed: false, cancel: false, stopped: false, reasons: { cut: 0, left: 0, failed: 0 }, lastReasons: '' };
const meaning = { synced: false, syncing: null, error: '', count: 0, key: '', warned: false, hashes: new Set() };

function hashText(text) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ code, 2654435761);
        h2 = Math.imul(h2 ^ code, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function listSetting(text) {
    return [...new Set(String(text || '').split(/[\n,]/).map(value => value.trim().toLowerCase()).filter(Boolean))];
}

function asList(value, separator = /[;,]/) {
    return (Array.isArray(value) ? value : String(value || '').split(separator)).map(item => String(item || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function fitToList(values, allowed) {
    const out = [];
    for (const value of values.map(item => item.toLowerCase())) {
        const hit = allowed.find(item => item === value) || allowed.find(item => value.includes(item) || (value.length >= 4 && item.includes(value)));
        if (hit && !out.includes(hit)) {
            out.push(hit);
        }
    }
    return out;
}

function isBackground(person) {
    return person.background === true || /^(background|crowd|extra|minor|bystander)$/i.test(String(person.role || '').trim());
}

const EMPTY_VALUE = /^(none|n\/a|unknown|unclear|-|not shown|not visible|not stated|"")$/;

function cleanPerson(person) {
    const out = isBackground(person) ? { role: 'background' } : {};
    const suffixes = new Map(categories().map(category => [category.id, (category.phrase.match(/\{value\}\s+(.+)$/) || [])[1] || '']));
    for (const [key, raw] of Object.entries(person).slice(0, 24)) {
        const field = slug(key);
        if (!field || field === 'role' || field === 'background' || field === 'name' || typeof raw === 'object') {
            continue;
        }
        let value = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 80).toLowerCase();
        if (EMPTY_VALUE.test(value)) {
            value = '';
        }
        const suffix = suffixes.get(field);
        if (suffix && value.endsWith(` ${suffix}`)) {
            value = value.slice(0, -suffix.length - 1).trim();
        }
        out[field] = value;
    }
    return out;
}

function cleanCard(card) {
    if (!card || typeof card !== 'object') {
        return null;
    }
    const text = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const people = (Array.isArray(card.people) ? card.people : [])
        .filter(person => person && typeof person === 'object')
        .slice(0, 6)
        .map(cleanPerson)
        .filter(person => Object.entries(person).some(([key, value]) => key !== 'role' && value));
    const scene = {};
    for (const [key, value] of Object.entries(card.scene && typeof card.scene === 'object' ? card.scene : {}).slice(0, 16)) {
        const field = slug(key);
        const clean = text(value).toLowerCase();
        if (field && clean && !EMPTY_VALUE.test(clean)) {
            scene[field] = clean;
        }
    }
    const v = Number(card.v) || 1;
    let cats = card.cats && typeof card.cats === 'object' ? Object.fromEntries(Object.entries(card.cats).map(([key, value]) => [slug(key), String(value)])) : null;
    if (!cats && v >= 5) {
        cats = builtinHashes();
    }
    return {
        people,
        scene,
        pose: asList(card.pose, ',').map(item => item.toLowerCase().slice(0, 40)).slice(0, 3),
        mood: asList(card.mood, ',').map(item => item.toLowerCase().slice(0, 40)).slice(0, 3),
        place: text(card.place).toLowerCase(),
        framing: text(card.framing).toLowerCase(),
        moments: asList(card.moments, ';').map(item => item.toLowerCase().slice(0, 80)).slice(0, 6),
        basis: String(card.basis || ''),
        edited: Boolean(card.edited),
        v,
        cats: cats || {},
    };
}

let builtinHashCache = null;

function builtinHashes() {
    if (!builtinHashCache) {
        builtinHashCache = Object.fromEntries(BUILTIN_CATEGORIES.map(raw => {
            const category = cleanCategory(raw);
            return [category.id, String(hashText(JSON.stringify([category.id, category.question, category.scope, category.type, parseTagLines(category.tagText)])))];
        }));
    }
    return { ...builtinHashCache };
}

function cardBasis(entry) {
    return String(hashText(`${entry.description}\n${entry.variants.map(variant => variant.diff).join('\n')}`));
}

function needsCard(entry) {
    return Boolean(entry.description) && (!entry.card || (!entry.card.edited && (entry.card.basis !== cardBasis(entry) || (entry.card.v || 1) < CARD_VERSION)));
}

function staleCategories(entry) {
    if (!entry.card) {
        return [];
    }
    return categories().filter(category => entry.card.cats?.[category.id] !== category.hash);
}

function cardWho(card) {
    return card.people.length ? card.people.map(person => personText(person)).join(' + ') : 'nobody';
}

function cardLine(card) {
    const people = card.people.filter(person => person.role !== 'background');
    const scene = sceneCategories().filter(category => category.judge && card.scene?.[category.id]).map(category => `${category.label}: ${valuesIn(category, card.scene[category.id]).join('/') || card.scene[category.id]}`);
    return [`Who: ${people.length ? people.map(judgeWho).join(' + ') : 'nobody'}`, card.pose.length ? `Pose: ${card.pose.join(', ')}` : '', card.mood.length ? `Mood: ${card.mood.join(', ')}` : '', ...scene].filter(Boolean).join(' | ');
}

function personLine(person) {
    const keys = [...personCategories().map(category => category.id), ...Object.keys(person).filter(key => key !== 'role')];
    const fields = [...new Set(keys)].filter(key => person[key]).map(key => `${key}: ${person[key]}`);
    return `Person: ${[...(person.role === 'background' ? ['role: background'] : []), ...fields].join('; ')}`;
}

function cardToText(card) {
    const lines = card.people.map(personLine);
    const scene = Object.entries(card.scene || {}).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`);
    if (scene.length || sceneCategories().length) {
        lines.push(`Scene: ${scene.join('; ')}`);
    }
    lines.push(`Pose: ${card.pose.join(', ')}`, `Mood: ${card.mood.join(', ')}`, `Place: ${card.place}`, `Framing: ${card.framing}`, `Moments: ${card.moments.join('; ')}`);
    return lines.join('\n');
}

function readPairs(value) {
    const out = {};
    for (const part of value.split(';')) {
        const pair = part.match(/^\s*([\w -]+?)\s*:\s*(.*)$/);
        if (pair) {
            out[slug(pair[1])] = pair[2].trim();
        }
    }
    return out;
}

function textToCard(text) {
    const card = { people: [], scene: {}, pose: [], mood: [], place: '', framing: '', moments: [] };
    for (const line of String(text || '').split('\n')) {
        const match = line.match(/^\s*(person|scene|pose|mood|place|framing|moments?)\s*\d*\s*:\s*(.*)$/i);
        if (!match) {
            continue;
        }
        const key = match[1].toLowerCase();
        const value = match[2].trim();
        if (key === 'person') {
            card.people.push(readPairs(value));
        } else if (key === 'scene') {
            card.scene = readPairs(value);
        } else if (key === 'pose' || key === 'mood') {
            card[key] = asList(value, ',');
        } else if (key.startsWith('moment')) {
            card.moments = asList(value, ';');
        } else {
            card[key] = value;
        }
    }
    return cleanCard(card);
}

function categoryHint(category) {
    const tags = category.tags.map(tag => {
        const range = tag.words.find(word => /^#\d+-\d+$/.test(word));
        const [low, high] = range ? range.slice(1).split('-').map(Number) : [];
        return range ? `${tag.name} (${high >= 100 ? `${low} and up` : `${low} to ${high}`})` : tag.name;
    }).join(', ');
    return category.type === 'each' ? `${category.question}; every one that applies, from: ${tags}` : `${category.question}; one of: ${tags}`;
}

function categoryExample(category) {
    const tags = category.tags.map(tag => tag.name);
    return category.type === 'scale' ? tags[Math.floor(tags.length / 2)] || '' : tags[0] || '';
}

function cardFieldRules(list) {
    return list.map(category => `  "${category.id}": ${categoryHint(category)}`).join('\n');
}

function meaningText(entry) {
    const card = entry.card;
    const action = String(entry.sections?.action || '').replace(/\s+/g, ' ').trim();
    return [`${cardWho(card)}.`, card.pose.length ? `Pose: ${card.pose.join(', ')}.` : '', card.mood.length ? `Mood: ${card.mood.join(', ')}.` : '', card.place ? `Place: ${card.place}.` : '', card.moments.length ? `Story moments: ${card.moments.join('; ')}.` : '', action].filter(Boolean).join(' ').slice(0, 1200);
}

function cardSource(entry) {
    const parts = [String(entry.description || '').replace(/\s+/g, ' ').trim().slice(0, 900)];
    if (isMulti(entry)) {
        entry.variants.slice(1, 4).forEach((variant, index) => variant.diff && parts.push(`${entry.kind === 'sequence' ? `Picture ${index + 2}` : `Version ${index + 2}`}: ${variant.diff.replace(/\s+/g, ' ').slice(0, 200)}`));
    }
    return parts.join(' ');
}

function parseCards(text, count, poses, moods) {
    const cleaned = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '');
    let items = null;
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start >= 0 && end > start) {
        try {
            items = JSON.parse(cleaned.slice(start, end + 1));
        } catch {
            items = null;
        }
    }
    if (!Array.isArray(items)) {
        items = [];
        for (const match of cleaned.matchAll(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g)) {
            try {
                items.push(JSON.parse(match[0]));
            } catch {
                continue;
            }
        }
    }
    const cards = new Map();
    items.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return;
        }
        const n = Number(item.n ?? item.picture ?? item.number ?? item.id) || index + 1;
        if (n < 1 || n > count || cards.has(n)) {
            return;
        }
        const pose = fitToList(asList(item.pose, ','), poses);
        const mood = fitToList(asList(item.mood, ','), moods);
        const card = cleanCard({ ...item, pose: pose.length ? pose : asList(item.pose, ',').slice(0, 2), mood: mood.length ? mood : asList(item.mood, ',').slice(0, 2) });
        if (card && (card.people.length || card.pose.length || card.moments.length)) {
            cards.set(n, card);
        }
    });
    return cards;
}

function picturesBlock(batch, withPeople = false) {
    return batch.map((entry, index) => {
        const lines = [`#${index + 1}`, `Description: ${cardSource(entry)}`, `Tags: ${entry.tags.slice(0, 80).join(', ').replace(/_/g, ' ') || 'none'}`];
        if (withPeople) {
            lines.push(`People on the card: ${(entry.card?.people || []).map((person, n) => `${n + 1}. ${personText(person)}`).join(' ') || 'none'}`);
        }
        return lines.join('\n');
    }).join('\n\n');
}

function replyText(result) {
    return String(typeof result === 'string' ? result : result?.content || '');
}

function looksCut(text) {
    const cleaned = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').trim();
    return cleaned.includes('[') && !cleaned.endsWith(']');
}

async function requestCards(batch) {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    if (!service || !s.tagProfile) {
        throw new Error('no tag profile is chosen in the Image Search settings');
    }
    const poses = listSetting(s.poseList || DEFAULT_POSES);
    const moods = listSetting(s.moodList || DEFAULT_MOODS);
    const people = personCategories();
    const scene = sceneCategories();
    const example = { n: 1, people: [{ role: 'main', ...Object.fromEntries(people.map(category => [category.id, categoryExample(category)])) }], ...(scene.length ? { scene: Object.fromEntries(scene.map(category => [category.id, categoryExample(category)])) } : {}), pose: [poses[0] || 'standing'], mood: [moods[0] || 'calm'], place: 'forest at night', framing: 'full body', moments: ['after being shoved', 'losing a fight', 'an ambush'] };
    const prompt = `You are filing the pictures of a roleplay picture library, so the right picture can be found quickly later. For each picture below you get its description and tags. Fill one filing card per picture.\n\nPoses (pick one or two, only from this list): ${poses.join(', ')}\nMoods (pick one or two, only from this list): ${moods.join(', ')}\n\nEach person has these fields:\n  "role": "main", or "background" for bystanders, crowds and anyone small or blurry behind the main people\n${cardFieldRules(people)}${scene.length ? `\nEach picture also has "scene" with these fields:\n${cardFieldRules(scene)}` : ''}\n\nRules:\n- people: the main people of the picture first, at most 6.\n- Take every field only from what the description or the tags say; never guess. Use "" for what is not shown.\n- moments: 3 to 5 short story moments this picture could illustrate, written the way a story would say them ("after being shoved", "first meeting", "winning a fight").\n- place and framing: a few words each.\n\nReply with only a JSON array, one object per picture, like this:\n${JSON.stringify([example])}\n\nPictures:\n${picturesBlock(batch)}`;
    const result = await service.sendRequest(s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), 150 + 300 * batch.length, { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.2));
    const text = replyText(result);
    return { cards: parseCards(text, batch.length, poses, moods), cut: looksCut(text) };
}

async function requestCategoryUpdate(batch, list) {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    if (!service || !s.tagProfile) {
        throw new Error('no tag profile is chosen in the Image Search settings');
    }
    const people = list.filter(category => category.scope === 'person');
    const scene = list.filter(category => category.scope === 'picture');
    const example = { n: 1, ...(people.length ? { people: [Object.fromEntries(people.map(category => [category.id, categoryExample(category)]))] } : {}), ...(scene.length ? { scene: Object.fromEntries(scene.map(category => [category.id, categoryExample(category)])) } : {}) };
    const prompt = `You are updating the filing cards of a roleplay picture library. For each picture below you get its description, its tags and the people already on its card. Fill only these fields.${people.length ? `\nFor each of those people, in the same order:\n${cardFieldRules(people)}` : ''}${scene.length ? `\nFor the picture, under "scene":\n${cardFieldRules(scene)}` : ''}\nTake every field only from what the description or the tags say; never guess. Use "" for what is not shown.\n\nReply with only a JSON array, one object per picture, like this:\n${JSON.stringify([example])}\n\nPictures:\n${picturesBlock(batch, true)}`;
    const result = await service.sendRequest(s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), 100 + batch.length * (30 + 25 * list.length * 2), { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.2));
    const text = replyText(result);
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '');
    let items = [];
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    try {
        items = start >= 0 && end > start ? JSON.parse(cleaned.slice(start, end + 1)) : [];
    } catch {
        items = [...cleaned.matchAll(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g)].map(match => {
            try {
                return JSON.parse(match[0]);
            } catch {
                return null;
            }
        }).filter(Boolean);
    }
    const updates = new Map();
    (Array.isArray(items) ? items : []).forEach((item, index) => {
        if (item && typeof item === 'object') {
            const n = Number(item.n) || index + 1;
            if (n >= 1 && n <= batch.length && !updates.has(n)) {
                updates.set(n, item);
            }
        }
    });
    return { updates, cut: looksCut(text) };
}

function applyCategoryUpdate(entry, update, list) {
    const card = entry.card;
    const people = Array.isArray(update.people) ? update.people : [];
    card.people.forEach((person, index) => {
        const fresh = people[index] && typeof people[index] === 'object' ? cleanPerson(people[index]) : {};
        list.filter(category => category.scope === 'person').forEach(category => {
            person[category.id] = fresh[category.id] || '';
        });
    });
    const scene = update.scene && typeof update.scene === 'object' ? update.scene : {};
    list.filter(category => category.scope === 'picture').forEach(category => {
        const value = String(scene[category.id] ?? '').trim().toLowerCase().slice(0, 80);
        card.scene[category.id] = EMPTY_VALUE.test(value) ? '' : value;
    });
    list.forEach(category => {
        card.cats[category.id] = category.hash;
    });
}

function categoryHashes() {
    return Object.fromEntries(categories().map(category => [category.id, category.hash]));
}

async function fileBatches(list, size, run, filed, count = true) {
    const missed = [];
    for (let i = 0; i < list.length && !filing.cancel; i += size) {
        const batch = list.slice(i, i + size);
        let result = null;
        try {
            result = await run(batch);
        } catch (error) {
            filing.error = String(error?.message || error).slice(0, 160);
            console.warn('[Image Search] filing cards failed', error);
        }
        let any = false;
        batch.forEach((entry, index) => {
            if (result && filed(entry, index + 1, result)) {
                any = true;
                filing.made++;
            } else {
                missed.push(entry);
                if (count) {
                    filing.reasons[!result ? 'failed' : result.cut ? 'cut' : 'left']++;
                }
            }
        });
        filing.done += batch.length;
        paintCardStatus();
        if (any) {
            await saveLibrary({ skipSync: true, skipFiling: true });
        }
    }
    return missed;
}

function reasonText() {
    const r = filing.reasons;
    return [r.cut ? `${r.cut} cut off (answer too long)` : '', r.left ? `${r.left} left out of the answer` : '', r.failed ? `${r.failed} in failed requests${filing.error ? ` (${filing.error})` : ''}` : ''].filter(Boolean).join(', ');
}

function scheduleFiling(ms = 4000) {
    clearTimeout(filing.timer);
    if (filing.stopped) {
        return;
    }
    filing.timer = setTimeout(() => {
        fileCards().catch(error => console.warn('[Image Search] filing cards failed', error));
    }, ms);
}

function stopFiling() {
    filing.stopped = true;
    clearTimeout(filing.timer);
    if (filing.running) {
        filing.cancel = true;
        paintCardStatus();
    }
}

async function fileCards({ only = null, loud = false } = {}) {
    if (only || loud) {
        filing.stopped = false;
    } else if (filing.stopped) {
        return;
    }
    if (filing.running) {
        await filing.running;
        if (!only && !loud) {
            return;
        }
    }
    const s = settings();
    filing.cancel = false;
    filing.running = (async () => {
        await loadLibrary();
        if (library.broken) {
            return;
        }
        if (loud) {
            filing.failed.clear();
        }
        const full = only || (s.cards ? library.entries.filter(entry => needsCard(entry) && (filing.failed.get(entry.id) || 0) < 2) : []);
        const light = only || !loud ? [] : library.entries.filter(entry => !full.includes(entry) && staleCategories(entry).length);
        if ((full.length || light.length) && !s.tagProfile) {
            filing.error = 'Choose a tag profile to make filing cards.';
        } else if (full.length || light.length) {
            Object.assign(filing, { total: full.length + light.length, done: 0, made: 0, error: '', started: Date.now(), stage: 'cards', reasons: { cut: 0, left: 0, failed: 0 } });
            const big = !only && full.length + light.length >= CARD_BATCH;
            filing.bar = big || loud;
            filing.dismissed = false;
            if (big || loud) {
                toastr.info(`Making filing cards for ${full.length + light.length} picture(s), so the AI can find the right one faster…`, 'Image Search');
            }
            paintCardStatus();
            const fill = (entry, n, result) => {
                const card = result.cards.get(n);
                if (!card) {
                    return false;
                }
                entry.card = { ...card, basis: cardBasis(entry), edited: false, v: CARD_VERSION, cats: categoryHashes() };
                filing.failed.delete(entry.id);
                return true;
            };
            let missed = await fileBatches(full, CARD_BATCH, requestCards, fill, false);
            if (missed.length && !filing.cancel) {
                filing.total += missed.length;
                filing.stage = 'retry';
                paintCardStatus();
                missed = await fileBatches(missed, Math.min(CARD_BATCH, 4), requestCards, fill);
            }
            missed.forEach(entry => filing.failed.set(entry.id, (filing.failed.get(entry.id) || 0) + 1));
            const groups = new Map();
            light.forEach(entry => {
                const stale = staleCategories(entry);
                const key = stale.map(category => category.id).join('|');
                groups.set(key, { list: stale, entries: [...(groups.get(key)?.entries || []), entry] });
            });
            let lightMissed = 0;
            for (const { list, entries } of groups.values()) {
                filing.stage = 'update';
                const left = await fileBatches(entries, 20, batch => requestCategoryUpdate(batch, list), (entry, n, result) => {
                    const update = result.updates.get(n);
                    if (!update) {
                        return false;
                    }
                    applyCategoryUpdate(entry, update, list);
                    return true;
                });
                lightMissed += left.length;
            }
            const failedCount = missed.length + lightMissed;
            if (filing.cancel) {
                toastr.info(`Filing stopped: ${filing.made} card(s) made. "Make missing cards" goes on from there.`, 'Image Search');
            } else if (big || loud) {
                toastr[failedCount ? 'warning' : 'success'](failedCount ? `Filing cards made for ${filing.made} picture(s); ${failedCount} could not be filed (${reasonText()}). They are tried again later.` : `Filing cards made for ${filing.made} picture(s).`, 'Image Search');
            } else if (failedCount && !filing.warned && filing.error) {
                filing.warned = true;
                toastr.warning(`Filing cards could not be made: ${filing.error}`, 'Image Search');
            }
            filing.lastReasons = failedCount ? reasonText() : '';
        }
        filing.stage = 'index';
        paintCardStatus();
        await syncMeaning();
    })().finally(() => {
        filing.running = null;
        const shown = filing.bar;
        filing.stage = shown ? 'done' : '';
        paintCardStatus();
        if (shown) {
            setTimeout(() => {
                if (!filing.running) {
                    filing.bar = false;
                    filing.stage = '';
                    paintCardStatus();
                }
            }, 4000);
        }
    });
    return filing.running;
}

function filingProgress() {
    const total = filing.total || 0;
    const done = filing.done || 0;
    if (filing.stage === 'done') {
        return { fraction: 1, text: `Filing cards done: ${filing.made} made${filing.lastReasons ? `, not filed: ${filing.lastReasons}` : ''}${meaning.error ? ` · search index: ${meaning.error}` : ''}` };
    }
    if (filing.stage === 'index') {
        return { fraction: 1, text: `Filing cards: ${filing.made} made · updating the search index…` };
    }
    let left = '';
    if (done > 0 && done < total) {
        const seconds = Math.round((Date.now() - filing.started) / done * (total - done) / 1000);
        left = seconds < 10 ? ' · almost done' : ` · about ${seconds >= 90 ? `${Math.round(seconds / 60)} min` : `${seconds} s`} left`;
    }
    const stage = filing.stage === 'retry' ? ' · trying the missed ones again' : filing.stage === 'update' ? ' · adding changed categories' : '';
    return { fraction: total ? done / total : 0, text: `Filing cards: ${done} of ${total} pictures${stage}${left}` };
}

function paintFilingBar() {
    let bar = document.getElementById('stis_filing_bar');
    if (!filing.bar || filing.dismissed || !filing.stage) {
        bar?.remove();
        return;
    }
    if (!bar) {
        bar = el('div', 'stis-progress');
        bar.id = 'stis_filing_bar';
        const label = el('small', 'stis-progress-text');
        const track = el('div', 'stis-progress-track');
        track.appendChild(el('div', 'stis-progress-fill'));
        const close = el('span', 'stis-progress-close fa-solid fa-xmark');
        close.title = 'Hide (it keeps going; progress is also in the settings)';
        close.addEventListener('click', () => {
            filing.dismissed = true;
            paintFilingBar();
        });
        bar.append(label, track, close);
        document.body.appendChild(bar);
    }
    const { fraction, text } = filingProgress();
    bar.querySelector('.stis-progress-text').textContent = text;
    bar.querySelector('.stis-progress-fill').style.width = `${Math.round(fraction * 100)}%`;
    bar.classList.toggle('stis-progress-done', filing.stage === 'done');
}

function meaningSource() {
    const source = String(settings().meaningSource || '');
    return source && source !== 'off' ? source : '';
}

function meaningKey() {
    const source = meaningSource();
    return source ? `${source}|${String(settings().meaningModel || '').trim() || MEANING_MODELS[source] || ''}` : '';
}

async function vectorCall(path, body) {
    const source = meaningSource();
    const model = String(settings().meaningModel || '').trim() || MEANING_MODELS[source];
    const response = await fetch(`/api/vector/${path}`, {
        method: 'POST',
        headers: ctx().getRequestHeaders(),
        body: JSON.stringify({ collectionId: VECTOR_COLLECTION, source, ...(model ? { model } : {}), ...body }),
    });
    if (!response.ok) {
        const detail = String(await response.text().catch(() => '') || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        throw new Error(`the search index answered ${response.status}${detail ? ` (${detail.slice(0, 120)})` : ''}`);
    }
    return String(response.headers.get('content-type') || '').includes('json') ? response.json() : null;
}

function meaningItems() {
    const items = new Map();
    for (const entry of library.entries) {
        if (entry.card) {
            const text = meaningText(entry);
            items.set(hashText(`${entry.id}\n${text}`), { entry, text });
        }
    }
    return items;
}

async function syncMeaning() {
    if (!meaningSource()) {
        return false;
    }
    if (meaning.syncing) {
        return meaning.syncing;
    }
    const key = meaningKey();
    meaning.syncing = (async () => {
        const want = meaningItems();
        if (!want.size || (meaning.synced && meaning.key === key && want.size === meaning.hashes.size && [...want.keys()].every(hash => meaning.hashes.has(hash)))) {
            Object.assign(meaning, { synced: true, error: '', count: want.size, key, hashes: new Set(want.keys()) });
            return true;
        }
        const have = new Set((await vectorCall('list', {}) || []).map(Number));
        const drop = [...have].filter(hash => !want.has(hash));
        const add = [...want].filter(([hash]) => !have.has(hash)).map(([hash, item]) => ({ hash, text: item.text, index: 0 }));
        if (drop.length) {
            await vectorCall('delete', { hashes: drop });
        }
        for (let i = 0; i < add.length; i += 20) {
            await vectorCall('insert', { items: add.slice(i, i + 20) });
            meaning.count = want.size - add.length + Math.min(add.length, i + 20);
            paintCardStatus();
        }
        Object.assign(meaning, { synced: true, error: '', count: want.size, key, hashes: new Set(want.keys()) });
        return true;
    })().catch(error => {
        meaning.error = String(error?.message || error).slice(0, 200);
        meaning.synced = false;
        console.warn('[Image Search] search index sync failed', error);
        return false;
    }).finally(() => {
        meaning.syncing = null;
        paintCardStatus();
    });
    return meaning.syncing;
}

async function meaningRank(text, limit = 80) {
    if (!meaningSource() || !String(text || '').trim()) {
        return null;
    }
    if (filing.running) {
        await Promise.race([filing.running, new Promise(resolve => setTimeout(resolve, 8000))]);
    }
    if (!meaning.synced || meaning.key !== meaningKey()) {
        await syncMeaning();
    } else if (meaning.syncing) {
        await meaning.syncing;
    }
    if (!meaning.synced) {
        throw new Error(meaning.error || 'the search index is not ready');
    }
    const want = meaningItems();
    if (!want.size) {
        return null;
    }
    const result = await vectorCall('query', { searchText: String(text).slice(-1500), topK: Math.min(limit, want.size), threshold: 0 });
    const order = new Map();
    for (const hash of result?.hashes || []) {
        const item = want.get(Number(hash));
        if (item && !order.has(item.entry)) {
            order.set(item.entry, order.size);
        }
    }
    return order;
}

function paintCardStatus() {
    paintFilingBar();
    const stop = document.getElementById('st_imagesearch_cards_stop');
    if (stop) {
        stop.hidden = !(filing.running && filing.total);
        stop.textContent = filing.cancel ? 'Stopping…' : 'Stop';
    }
    const settingsBar = document.getElementById('st_imagesearch_card_progress');
    if (settingsBar) {
        const active = Boolean(filing.running && filing.total);
        settingsBar.hidden = !active;
        if (active) {
            const { fraction, text } = filingProgress();
            settingsBar.querySelector('.stis-progress-fill').style.width = `${Math.round(fraction * 100)}%`;
            settingsBar.title = text;
        }
    }
    const node = document.getElementById('st_imagesearch_card_status');
    if (!node) {
        return;
    }
    const described = library.entries.filter(entry => entry.description);
    const carded = described.filter(entry => entry.card).length;
    const parts = [`Filing cards: ${carded} of ${described.length} described picture(s)`];
    if (filing.running && filing.total) {
        parts.push(filingProgress().text.replace(/^Filing cards: /, 'making: '));
    } else if (filing.error) {
        parts.push(filing.error);
    }
    if (meaningSource()) {
        parts.push(meaning.error ? `Search index: not working (${meaning.error})` : meaning.syncing ? `Search index: updating ${meaning.count}…` : meaning.synced ? `Search index: ${meaning.count} picture(s)` : 'Search index: not built yet');
    } else {
        parts.push('Search by meaning is off');
    }
    node.textContent = parts.join(' · ');
}

const BUILTIN_CATEGORIES = [
    { id: 'gender', label: 'gender', question: 'their gender', type: 'match', must: true, judge: true, phrase: '{value}', points: { match: 4, close: 0, different: 0, missing: -1 }, tags: 'woman: woman, women, girl, girls, female, lady, 1girl, 2girls, 3girls\nman: man, men, boy, boys, male, guy, 1boy, 2boys, 3boys' },
    { id: 'species', label: 'species', question: 'their species, human unless the picture shows otherwise', type: 'match', must: true, judge: true, phrase: '{value}', points: { match: 4, close: 0, different: 0, missing: -1 }, tags: 'human: human, person, people\nelf: elf, elves, elven, dark elf, drow\norc: orc, orcs, orcish, half-orc, half orc\ndemon: demon, succubus, incubus, devil, oni, tiefling\nangel: angel\ncat: cat girl, catgirl, cat boy, catboy, nekomimi, neko, cat ears\nfox: fox, kitsune\nwolf: wolf, werewolf, wolf girl, lycan\ndog: dog girl, dog boy, inugami\nrobot: robot, android, cyborg, automaton, gynoid, mecha\ndragon: dragon, dragon girl\ngoblin: goblin\ndwarf: dwarf, dwarven\nslime: slime' },
    { id: 'age', label: 'age', question: 'how old they look', type: 'scale', must: false, judge: true, phrase: '{value}', points: { match: 5, close: 0, different: -5, missing: -1 }, tags: 'child: child, kid, little girl, little boy, preteen, #1-12\nteen: teen, teens, teenage, teenager, adolescent, high school, #13-17\nyoung adult: young adult, young, youthful, college, twenties, #18-25\nadult: adult, grown, mature, thirties, #26-39\nmiddle-aged: middle-aged, middle aged, middle age, forties, fifties, #40-59\nold: old, elderly, aged, senior, ancient, wrinkled, grandmother, grandfather, #60-130' },
    { id: 'hair', label: 'hair', question: 'hair colour, not the style', type: 'match', must: false, judge: true, phrase: '{value} hair', points: { match: 4, close: -1, different: -4, missing: -1 }, tags: 'black: black, raven, jet\nbrown: brown, brunette, chestnut\nblonde: blonde, blond, golden, yellow\nred: red, ginger, auburn, crimson, scarlet\norange: orange\nwhite: white, silver, grey, gray, platinum\npink: pink\nblue: blue, navy, teal\ngreen: green\npurple: purple, violet, lavender', close: 'black ~ brown\nbrown ~ red\nbrown ~ blonde\nblonde ~ white\nblonde ~ orange\nred ~ orange\nred ~ pink\npink ~ purple\npurple ~ blue\nblue ~ green\npink ~ white' },
    { id: 'build', label: 'build', question: 'their figure, the one that stands out most', type: 'match', must: false, judge: true, phrase: '{value}', points: { match: 4, close: 0, different: -4, missing: -1 }, tags: 'slim: slim, slender, thin, skinny, lithe, willowy, petite, lean, wiry, delicate\nathletic: athletic, fit, toned, sporty, agile\nmuscular: muscular, buff, brawny, ripped, burly, strong, bulky, broad-shouldered, stocky\ncurvy: curvy, voluptuous, hourglass, shapely, full-figured, curvaceous, thick\nheavy: heavy, chubby, plump, fat, heavyset, rotund, portly', close: 'slim ~ athletic\nathletic ~ muscular\nmuscular ~ heavy\ncurvy ~ heavy\nathletic ~ curvy' },
    { id: 'height', label: 'height', question: 'how tall they look', type: 'scale', must: false, judge: true, phrase: '{value}', from: 'height, build', points: { match: 2, close: 0, different: -2, missing: -1 }, tags: 'short: short, petite, small, tiny, little, diminutive\naverage: average height, medium height, average\ntall: tall, towering, giant, lanky' },
    { id: 'skin', label: 'skin', question: 'skin colour', type: 'match', must: false, judge: true, phrase: '{value} skin', points: { match: 3, close: 0, different: -3, missing: -1 }, tags: 'light: pale, white, fair, light, porcelain\ndark: dark, tan, tanned, brown, black, ebony, olive\ngreen: green\nblue: blue\nred: red\npurple: purple, lavender\ngrey: grey, gray, ashen\npink: pink\nyellow: yellow\ngolden: golden, gold' },
    { id: 'eyes', label: 'eyes', question: 'eye colour, when it can be seen', type: 'match', must: false, judge: true, phrase: '{value} eyes', points: { match: 2, close: 0, different: -2, missing: -1 }, tags: 'amber: amber, gold, golden, yellow\nbrown: brown, hazel\nblack: black\nblue: blue, azure\ngreen: green, emerald\ngrey: grey, gray, silver\nred: red, crimson, scarlet\npurple: purple, violet\npink: pink\nwhite: white', close: 'amber ~ brown\nblue ~ grey\ngreen ~ brown\nblack ~ grey' },
    { id: 'features', label: 'features', question: 'what stands out on their body', type: 'each', must: false, judge: true, phrase: '{value}', from: 'features, outfit, species', points: { match: 3, close: 0, different: 0, missing: -1 }, tags: 'horns: horns, horn, horned\ntail: tail, tails\ntusks: tusks, tusk\nwings: wings, wing, winged\npointed ears: pointy ears, pointed ears, elf ears, elven ears\nanimal ears: animal ears, cat ears, fox ears, wolf ears, dog ears, bunny ears, rabbit ears, kemonomimi\nscar: scar, scars, scarred\nglasses: glasses, spectacles, eyeglasses, monocle\ntattoos: tattoo, tattoos, tattooed\nfreckles: freckles, freckled\nfangs: fangs, fang\nhalo: halo\neyepatch: eyepatch, eye patch\nbeard: beard, bearded\nmustache: mustache, moustache\npiercings: piercing, piercings, pierced\nscales: scales, scaly\nfur: fur, furry\nclaws: claws' },
    { id: 'condition', label: 'condition', question: 'whether they are a ghost, undead or a vampire', type: 'each', must: false, judge: true, phrase: '{value}', from: 'condition, species, features, skin', points: { match: 3, close: 0, different: 0, missing: 0 }, tags: 'ghost: ghost, ghosts, ghostly, spirit, phantom, specter, spectre, wraith, translucent, transparent, see-through, spectral\nundead: undead, zombie, skeletal, rotting\nvampire: vampire, vampiric' },
    { id: 'outfit', label: 'outfit', question: 'the kind of clothes they wear', type: 'match', must: false, judge: false, phrase: '{value}', points: { match: 2, close: 0, different: 0, missing: 0 }, tags: 'armor: armor, armour, plate, chainmail\ndress: dress, gown, sundress\nkimono: kimono, yukata, hakama\nuniform: uniform, school uniform\nrobe: robe, robes, cloak, cape\nsuit: suit, tuxedo\nswimsuit: swimsuit, bikini\ncasual: casual, t-shirt, shirt, jeans, hoodie, sweater, shorts\nmaid: maid\nleather: leather' },
];

let categoryCache = null;

function slug(value) {
    return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
}

function parseTagLines(text) {
    const tags = [];
    for (const line of String(text || '').split('\n')) {
        const colon = line.indexOf(':');
        const name = (colon >= 0 ? line.slice(0, colon) : line).trim().toLowerCase();
        if (!name || tags.some(tag => tag.name === name)) {
            continue;
        }
        const words = (colon >= 0 ? line.slice(colon + 1) : '').split(',').map(word => word.trim().toLowerCase()).filter(Boolean);
        tags.push({ name, words: [...new Set([name, ...words])] });
    }
    return tags;
}

function parseCloseLines(text) {
    const pairs = [];
    for (const line of String(text || '').split('\n')) {
        const match = line.match(/^\s*([^~:]+?)\s*~\s*([^~:]+?)\s*(?::\s*(-?\d+))?\s*$/);
        if (match) {
            pairs.push({ a: match[1].toLowerCase(), b: match[2].toLowerCase(), points: match[3] === undefined ? null : Number(match[3]) });
        }
    }
    return pairs;
}

function cleanCategory(raw) {
    const points = raw?.points || {};
    const number = (value, fallback) => (Number.isFinite(Number(value)) && value !== '' && value !== null ? Number(value) : fallback);
    const id = slug(raw?.id || raw?.label) || 'category';
    return {
        id,
        label: String(raw?.label || id).trim().slice(0, 40) || id,
        question: String(raw?.question || raw?.label || id).trim().slice(0, 200),
        scope: raw?.scope === 'picture' ? 'picture' : 'person',
        against: ['character', 'message', 'both'].includes(raw?.against) ? raw.against : raw?.scope === 'picture' ? 'message' : 'character',
        type: ['match', 'scale', 'each'].includes(raw?.type) ? raw.type : 'match',
        must: Boolean(raw?.must),
        judge: raw?.judge !== false,
        enabled: raw?.enabled !== false,
        builtin: Boolean(raw?.builtin),
        phrase: String(raw?.phrase || '{value}').includes('{value}') ? String(raw.phrase || '{value}') : '{value}',
        from: String(raw?.from || id).split(',').map(field => slug(field)).filter(Boolean),
        tagText: typeof raw?.tags === 'string' ? raw.tags : (Array.isArray(raw?.tags) ? raw.tags.map(tag => `${tag.name}: ${(tag.words || []).join(', ')}`).join('\n') : ''),
        closeText: String(raw?.close || ''),
        points: { match: number(points.match, 3), close: number(points.close, 0), different: number(points.different, -3), missing: number(points.missing, -1) },
    };
}

function defaultCategories() {
    return BUILTIN_CATEGORIES.map(category => ({ ...JSON.parse(JSON.stringify(category)), builtin: true, enabled: true, scope: 'person', against: 'character' }));
}

function storedCategories() {
    const s = settings();
    if (!Array.isArray(s.lookCategories) || !s.lookCategories.length) {
        s.lookCategories = defaultCategories();
    }
    return s.lookCategories;
}

function categories() {
    const stored = storedCategories();
    const key = JSON.stringify(stored);
    if (categoryCache?.key !== key) {
        const list = [];
        for (const raw of stored) {
            const category = cleanCategory(raw);
            if (list.some(item => item.id === category.id)) {
                continue;
            }
            category.tags = parseTagLines(category.tagText);
            category.close = parseCloseLines(category.closeText);
            category.phrases = category.tags
                .flatMap(tag => tag.words.map(word => ({ tag: tag.name, word })))
                .filter(item => !item.word.startsWith('#'))
                .sort((a, b) => b.word.length - a.word.length)
                .map(item => ({ ...item, re: new RegExp(`(^|[^a-z0-9])${escapeRegex(item.word)}(?=$|[^a-z0-9])`) }));
            category.ranges = category.tags.flatMap(tag => tag.words.filter(word => /^#\d+-\d+$/.test(word)).map(word => {
                const [low, high] = word.slice(1).split('-').map(Number);
                return { tag: tag.name, low, high };
            }));
            category.hash = String(hashText(JSON.stringify([category.id, category.question, category.scope, category.type, category.tags])));
            list.push(category);
        }
        categoryCache = { key, list };
    }
    return categoryCache.list.filter(category => category.enabled);
}

function personCategories() {
    return categories().filter(category => category.scope === 'person');
}

function sceneCategories() {
    return categories().filter(category => category.scope === 'picture');
}

function valuesIn(category, raw) {
    let text = ` ${String(raw || '').toLowerCase().replace(/_/g, ' ')} `;
    const found = [];
    for (const phrase of category.phrases) {
        const match = text.match(phrase.re);
        if (match) {
            const at = match.index + match[1].length;
            found.push({ tag: phrase.tag, at });
            text = text.slice(0, at) + ' '.repeat(phrase.word.length) + text.slice(at + phrase.word.length);
        }
    }
    for (const match of text.matchAll(/\d+/g)) {
        const value = Number(match[0]);
        const range = category.ranges.find(item => value >= item.low && value <= item.high);
        if (range) {
            found.push({ tag: range.tag, at: match.index });
        }
    }
    return [...new Set(found.sort((a, b) => a.at - b.at).map(item => item.tag))];
}

function fieldText(category, person) {
    return category.from.map(field => person?.[field] || '').filter(Boolean).join(' ; ');
}

function personValues(category, person) {
    return valuesIn(category, fieldText(category, person));
}

function closePoints(category, a, b) {
    const pair = category.close.find(item => (item.a === a && item.b === b) || (item.a === b && item.b === a));
    return pair ? (pair.points ?? category.points.close) : null;
}

function signed(value) {
    return value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0';
}

function compareValues(category, picture, wanted) {
    const points = category.points;
    const out = { score: 0, wrong: '', parts: [] };
    const add = (value, text) => {
        out.score += value;
        out.parts.push(`${text} ${signed(value)}`);
    };
    if (!wanted.length) {
        return out;
    }
    if (category.type === 'each') {
        for (const tag of wanted) {
            add(picture.includes(tag) ? points.match : points.missing, picture.includes(tag) ? `${tag} ✓` : `${tag}: not shown`);
        }
        return out;
    }
    if (!picture.length) {
        add(points.missing, `${category.label}: not on the picture's card`);
        return out;
    }
    const shown = picture.join('/');
    const want = wanted.join('/');
    if (category.type === 'scale') {
        const order = category.tags.map(tag => tag.name);
        const gap = Math.min(...picture.flatMap(a => wanted.map(b => Math.abs(order.indexOf(a) - order.indexOf(b)))));
        if (gap === 0) {
            add(points.match, `${category.label} ${picture.find(value => wanted.includes(value))} ✓`);
        } else if (category.must) {
            out.wrong = `${category.label} ${shown} ≠ ${want}`;
        } else {
            add(gap === 1 ? points.close : points.different, `${category.label} ${shown} ≠ ${want}${gap === 1 ? ' (close)' : ''}`);
        }
        return out;
    }
    const same = picture.filter(value => wanted.includes(value));
    if (same.length) {
        add(points.match, `${category.label} ${same.join('/')} ✓`);
        return out;
    }
    if (category.must) {
        out.wrong = `${category.label} ${shown} ≠ ${want}`;
        return out;
    }
    const close = picture.flatMap(a => wanted.map(b => closePoints(category, a, b))).filter(value => value !== null);
    if (close.length) {
        add(Math.max(...close), `${category.label} ${shown} ≠ ${want} (close)`);
    } else {
        add(points.different, `${category.label} ${shown} ≠ ${want}`);
    }
    return out;
}

function messageValues(message) {
    const text = withoutRuledOut(message);
    return new Map(categories().filter(category => category.against !== 'character').map(category => [category.id, valuesIn(category, text)]));
}

function wantedValues(category, member, fromMessage) {
    const said = fromMessage?.get(category.id) || [];
    if (category.against === 'message') {
        return said;
    }
    if (category.against === 'both' && said.length) {
        return said;
    }
    return member ? personValues(category, member) : [];
}

function compareLooks(person, member, fromMessage = new Map()) {
    const out = { score: 0, wrong: '', parts: [] };
    for (const category of personCategories()) {
        const result = compareValues(category, personValues(category, person), wantedValues(category, member, fromMessage));
        out.score += result.score;
        out.parts.push(...result.parts);
        out.wrong ||= result.wrong;
    }
    return out;
}

function knownLine(member, fromMessage = new Map()) {
    const known = [];
    const unknown = [];
    for (const category of personCategories()) {
        const values = wantedValues(category, member, fromMessage);
        const said = category.against !== 'character' && (fromMessage.get(category.id) || []).length;
        if (values.length) {
            known.push(`${category.label} ${values.join(category.type === 'each' ? ', ' : '/')}${said ? ' (from your message)' : ''}`);
        } else {
            unknown.push(category.label);
        }
    }
    return `${member.name} is known as: ${known.join(', ') || 'nothing'}${unknown.length ? `; not known: ${unknown.join(', ')}` : ''}`;
}

function sceneDetail(entry, fromMessage) {
    const out = { score: 0, notes: [] };
    for (const category of sceneCategories()) {
        const wanted = fromMessage.get(category.id) || [];
        if (!wanted.length) {
            continue;
        }
        const result = compareValues(category, valuesIn(category, entry.card?.scene?.[category.id] || ''), wanted);
        out.score += result.score;
        if (result.parts.length) {
            out.notes.push(`Scene: ${result.parts.join(', ')}`);
        }
    }
    return out;
}

function looksDetail(entry, cast, fromMessage = new Map()) {
    const all = entry.card?.people || [];
    const people = all.filter(person => person.role !== 'background');
    const ignored = all.length - people.length;
    const tail = ignored ? ` (${ignored} background ${ignored === 1 ? 'person' : 'people'} ignored)` : '';
    const scene = entry.card ? sceneDetail(entry, fromMessage) : { score: 0, notes: [] };
    if (!cast.length) {
        return { score: scene.score, notes: ['No character looks are known, so looks do not count.', ...scene.notes] };
    }
    if (!entry.card) {
        return { score: 0, notes: ['No filing card yet, so looks do not count.'] };
    }
    if (!people.length) {
        return { score: scene.score, notes: [`Nobody in the picture${tail}, so looks do not count.`, ...scene.notes] };
    }
    const notes = [];
    const matched = [];
    let score = 0;
    const roled = cast.some(member => member.role) ? cast : cast.map((member, index) => ({ ...member, role: index === 0 ? 'main' : 'extra' }));
    const needMain = roled.some(member => member.role === 'main');
    let mainFound = false;
    for (const member of roled) {
        const main = member.role === 'main';
        notes.push(`${knownLine(member, fromMessage)}${main ? ' (main focus)' : ' (may also be in it)'}`);
        const tried = people.map(person => ({ index: all.indexOf(person), person, ...compareLooks(person, member, fromMessage) }));
        const fits = tried.filter(item => !item.wrong && !matched.includes(item.index)).sort((x, y) => y.score - x.score);
        const describe = item => `person ${item.index + 1} (${personHead(item.person) || 'person'})`;
        if (fits.length) {
            const best = fits[0];
            const points = main ? best.score : Math.min(best.score, lookRules().extraCap);
            matched.push(best.index);
            mainFound ||= main;
            score += points;
            notes.push(`${member.name} ↔ ${describe(best)}: ${best.parts.join(', ') || 'nothing to compare'} → ${signed(points)}${main ? '' : ` (may also be in it, at most ${signed(lookRules().extraCap)})`}`);
        } else if (main) {
            notes.push(`Nobody looks like ${member.name}: ${tried.map(item => `${describe(item)} ${item.wrong}`).join('; ')}`);
        } else {
            notes.push(`${member.name} is not in the picture: that is fine → 0`);
        }
    }
    if (needMain && !mainFound) {
        score = lookRules().noMatch;
        notes.push(`The main focus is not in the picture → ${signed(score)}`);
    } else if (!needMain) {
        notes.push('How the main focus looks is not known, so only the others count.');
    }
    if (tail) {
        notes.push(tail.trim().replace(/^\(|\)$/g, ''));
    }
    return { score: score + scene.score, notes: [...notes, ...scene.notes] };
}

function personHead(person) {
    return personCategories().filter(category => category.must).map(category => personValues(category, person)[0] || '').filter(Boolean).join(' ');
}

function personText(person, { judged = false } = {}) {
    const parts = [];
    for (const category of personCategories()) {
        if (judged && !category.judge) {
            continue;
        }
        const values = judged ? personValues(category, person) : [];
        const raw = judged ? values.join(category.type === 'each' ? ', ' : '/') : String(person[category.id] || '').trim();
        if (raw) {
            parts.push(category.phrase.replace('{value}', raw));
        }
    }
    const text = parts.join(', ') || 'person';
    return person.role === 'background' ? `${text}, in the background` : text;
}

function judgeWho(person) {
    return personText(person, { judged: true });
}

function pronounGender(text) {
    const she = (String(text).match(/\b(she|her|hers|herself)\b/g) || []).length;
    const he = (String(text).match(/\b(he|him|his|himself)\b/g) || []).length;
    return she > he ? 'woman' : he > she ? 'man' : '';
}

function wordsBefore(text, noun) {
    const joined = text.match(new RegExp(`\\b([a-z]+)-${noun}\\b`));
    if (joined) {
        return joined[1];
    }
    const match = text.match(new RegExp(`((?:[a-z-]+[ ,]+){0,3})${noun}\\b`));
    if (!match) {
        return '';
    }
    const kept = [];
    for (const word of match[1].split(/[ ,]+/).filter(Boolean).reverse()) {
        if (/^(with|and|has|have|her|his|their|a|an|the|of|is|in|its|she|he|own|my|your|wears|wearing|got|very|pair)$/.test(word)) {
            break;
        }
        kept.unshift(word);
    }
    return kept.join(' ');
}

function sheetFromText(name, source) {
    const person = {};
    const lower = String(source || '').toLowerCase().replace(/_/g, ' ');
    for (const category of personCategories()) {
        const noun = (category.phrase.match(/\{value\}\s+(\w+)/) || [])[1];
        const values = valuesIn(category, noun ? wordsBefore(lower, `${escapeRegex(noun)}(?:s|ed|ned)?`) : lower);
        person[category.id] = category.type === 'each' ? values.join(', ') : values[0] || '';
    }
    if ('gender' in person && !person.gender) {
        person.gender = pronounGender(String(source || '').toLowerCase());
    }
    return { name, ...person };
}

const sheetFailed = new Set();
let lastCast = [];
let pickOptions = { focus: 'char', main: '', allowOther: true };

function categoryEditor(raw, onChange, onDelete) {
    const box = el('details', 'stis-cat');
    const summary = el('summary', 'stis-cat-head');
    const enabled = el('input');
    enabled.type = 'checkbox';
    enabled.checked = raw.enabled !== false;
    enabled.title = 'Use this category';
    enabled.addEventListener('click', event => event.stopPropagation());
    const title = el('span', 'stis-cat-title');
    const paintTitle = () => {
        const category = cleanCategory(raw);
        title.textContent = ` ${category.label} · ${{ match: 'same tag', scale: 'ordered scale', each: 'each tag counts' }[category.type]} · ${category.scope === 'picture' ? 'the picture' : 'each person'}, compared with ${{ character: 'the character', message: 'your message', both: 'your message, else the character' }[category.against]}`;
    };
    summary.append(enabled, title);
    box.appendChild(summary);
    const changed = () => {
        paintTitle();
        onChange();
    };
    enabled.addEventListener('change', () => {
        raw.enabled = enabled.checked;
        changed();
    });
    const row = (label, input, hint = '') => {
        const line = el('div', 'st-imagesearch-row stis-cat-row');
        line.appendChild(el('span', '', label));
        line.appendChild(input);
        box.appendChild(line);
        if (hint) {
            box.appendChild(el('small', 'stis-cat-hint', hint));
        }
        return input;
    };
    const text = (key, label, hint, fallback = '') => {
        const input = el('input', 'text_pole');
        input.type = 'text';
        input.value = raw[key] ?? fallback;
        input.addEventListener('input', () => {
            raw[key] = key === 'id' ? slug(input.value) : input.value;
            changed();
        });
        return row(label, input, hint);
    };
    const choice = (key, label, options, fallback) => {
        const select = el('select', 'text_pole');
        Object.entries(options).forEach(([value, name]) => {
            const option = el('option', '', name);
            option.value = value;
            select.appendChild(option);
        });
        select.value = raw[key] || fallback;
        select.addEventListener('change', () => {
            raw[key] = select.value;
            changed();
        });
        return row(label, select);
    };
    const check = (key, label, fallback) => {
        const line = el('label', 'checkbox_label stis-cat-row');
        const input = el('input');
        input.type = 'checkbox';
        input.checked = raw[key] ?? fallback;
        input.addEventListener('change', () => {
            raw[key] = input.checked;
            changed();
        });
        line.append(input, el('span', '', ` ${label}`));
        box.appendChild(line);
    };
    const area = (key, label, hint) => {
        box.appendChild(el('div', 'stis-cat-label', label));
        const input = el('textarea', 'text_pole stis-cat-area');
        input.value = raw[key] || '';
        input.addEventListener('input', () => {
            raw[key] = input.value;
            changed();
        });
        box.appendChild(input);
        box.appendChild(el('small', 'stis-cat-hint', hint));
    };
    text('label', 'Name');
    text('id', 'Field name on the cards', 'Changing it means the cards need an update.');
    text('question', 'Question for the AI', 'What the AI should look for, in a few words.');
    choice('scope', 'Applies to', { person: 'each person', picture: 'the whole picture' }, 'person');
    choice('against', 'Compared with', { character: 'the character (look sheet)', message: 'your message', both: 'your message when it says, else the character' }, 'character');
    choice('type', 'Type', { match: 'same tag counts', scale: 'ordered scale (one step apart is close)', each: 'each tag of the character counts' }, 'match');
    check('must', 'Must match: a different tag means the person is not the character', false);
    check('judge', 'Show it to the AI that picks', true);
    text('phrase', 'Reads as', '{value} is replaced by the tag, for example "{value} hair".', '{value}');
    text('from', 'Read from fields', 'Card fields to read, separated by commas. Empty means its own field.', '');
    area('tags', 'Tags, one per line', '"tag: words that count as it, more words". For an ordered scale, put them in order. "#13-17" counts numbers.');
    area('close', 'Close pairs, one per line', '"black ~ brown" uses the close points, "black ~ brown: -1" sets them.');
    const points = el('div', 'stis-cat-points');
    raw.points = { match: 3, close: 0, different: -3, missing: 0, ...(raw.points || {}) };
    for (const [key, label] of [['match', 'match'], ['close', 'close'], ['different', 'different'], ['missing', 'not on the picture']]) {
        const cell = el('label', 'stis-cat-point');
        const input = el('input', 'text_pole');
        input.type = 'number';
        input.value = raw.points[key];
        input.addEventListener('input', () => {
            raw.points[key] = Number(input.value) || 0;
            changed();
        });
        cell.append(el('small', '', label), input);
        points.appendChild(cell);
    }
    box.appendChild(el('div', 'stis-cat-label', 'Points'));
    box.appendChild(points);
    const remove = el('div', 'menu_button stis-cat-delete', 'Delete category');
    confirmClicks(remove, 'Delete category', 'Tap again to delete', () => onDelete());
    box.appendChild(remove);
    paintTitle();
    return box;
}

function categoryStatus() {
    const stale = new Map();
    for (const entry of library.entries) {
        staleCategories(entry).forEach(category => stale.set(category.label, (stale.get(category.label) || 0) + 1));
    }
    return stale.size ? `Cards to update: ${[...stale].map(([label, count]) => `${label} (${count})`).join(', ')}. Point changes need no update.` : 'Every card is up to date with the categories. Point changes need no update.';
}

function lookRules() {
    const rules = settings().lookRules || {};
    return { noMatch: Number.isFinite(Number(rules.noMatch)) ? Number(rules.noMatch) : -20, extraCap: Number.isFinite(Number(rules.extraCap)) ? Number(rules.extraCap) : 5 };
}

function visionHash() {
    return String(hashText(settings().visionPrompt || DEFAULT_VISION_PROMPT));
}

function describedOld(entry) {
    return Boolean(entry.description) && !String(entry.description).trimStart().startsWith('Visual:');
}

function chatCharacters() {
    const c = ctx();
    const characters = Array.isArray(c.characters) ? c.characters : [];
    if (c.groupId) {
        const group = (c.groups || []).find(g => String(g?.id) === String(c.groupId));
        return (group?.members || []).map(avatar => characters.find(ch => ch?.avatar === avatar)).filter(Boolean).slice(0, 4);
    }
    if (c.characterId !== undefined && c.characterId !== null && characters[c.characterId]) {
        return [characters[c.characterId]];
    }
    return [];
}

function sceneMembers() {
    const c = ctx();
    const user = String(c.name1 || '').toLowerCase();
    const looks = parseLooks();
    const members = [];
    const savedFor = name => looks.filter(look => look.name.toLowerCase() === String(name).toLowerCase()).map(look => `Saved look: ${look.tags.join(', ').replace(/_/g, ' ')}`);
    for (const character of chatCharacters()) {
        const card = fillNames(character.description || character.data?.description || '', character.name).replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, 4000);
        const source = [card, ...savedFor(character.name)].filter(Boolean).join('\n');
        if (source) {
            members.push({ key: `char:${character.avatar || character.name}`, name: character.name, source });
        }
    }
    const extra = [c.name2, ...mentionedLooks(looks).map(look => look.name)].filter(name => name && name.toLowerCase() !== user && !members.some(member => member.name.toLowerCase() === name.toLowerCase()));
    for (const name of [...new Set(extra)].slice(0, 3)) {
        const source = savedFor(name).join('\n');
        if (source) {
            members.push({ key: `look:${name.toLowerCase()}`, name, source });
        }
    }
    return members.map(member => ({ ...member, basis: String(hashText(member.source)) }));
}

async function castSheets() {
    const plan = castPlan();
    const members = [plan.main, ...plan.extras].filter(member => member && member.source);
    const sheets = await lookSheets({ members });
    return sheets.map(sheet => ({ ...sheet, role: sheet.key === plan.main?.key ? 'main' : 'extra' })).sort((a, b) => (a.role === 'main' ? -1 : 0) - (b.role === 'main' ? -1 : 0));
}

function personaMember() {
    const c = ctx();
    const name = c.name1 || '';
    if (!name) {
        return null;
    }
    const text = fillNames(c.powerUserSettings?.persona_description || '', c.name2).replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, 4000);
    const saved = parseLooks().filter(look => look.name.toLowerCase() === name.toLowerCase()).map(look => `Saved look: ${look.tags.join(', ').replace(/_/g, ' ')}`);
    const source = [text, ...saved].filter(Boolean).join('\n');
    return { key: `persona:${name.toLowerCase()}`, name, source, basis: String(hashText(source)) };
}

function allMembers() {
    const persona = personaMember();
    return [...sceneMembers(), ...(persona && persona.source ? [persona] : [])];
}

function castPlan(options = pickOptions) {
    const characters = sceneMembers();
    const persona = personaMember();
    if (options.focus === 'user') {
        return { main: persona, extras: options.allowOther ? characters : [] };
    }
    const main = characters.find(member => member.name === options.main) || characters[0] || null;
    return { main, extras: [...characters.filter(member => member !== main), ...(options.allowOther && persona ? [persona] : [])] };
}

function sheetCategories() {
    return personCategories().filter(category => category.against !== 'message');
}

function sheetHashes() {
    return Object.fromEntries(sheetCategories().map(category => [category.id, category.hash]));
}

async function requestSheets(members) {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    const list = sheetCategories();
    const example = { name: 'Mira', ...Object.fromEntries(list.map(category => [category.id, categoryExample(category)])) };
    const prompt = `Below is what is written about the characters of a roleplay. Fill one look sheet per character, only from what is written. Each sheet has these fields:\n${cardFieldRules(list)}\nWork out the gender from she/her or he/his when it is not said outright. Use "" for anything that is not written.\n\nReply with only a JSON array, one object per character, like this:\n${JSON.stringify([example])}\n\n${members.map(member => `${member.name}:\n${member.source}`).join('\n\n')}`;
    const result = await service.sendRequest(s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), 200 + 40 * list.length * members.length, { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.1));
    const text = replyText(result).replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '');
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    const items = start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : [];
    const people = new Map();
    for (const item of Array.isArray(items) ? items : []) {
        if (item && typeof item === 'object' && item.name) {
            const person = cleanPerson(item);
            if (Object.values(person).some(Boolean)) {
                people.set(String(item.name).toLowerCase(), person);
            }
        }
    }
    return people;
}

function staleSheet(sheet) {
    const want = sheetHashes();
    const have = sheet?.cats || builtinHashes();
    return Object.keys(want).filter(id => have[id] !== want[id]);
}

async function lookSheets({ ask = true, members = allMembers() } = {}) {
    if (!members.length) {
        return [];
    }
    const s = settings();
    if (!s.lookSheets || typeof s.lookSheets !== 'object') {
        s.lookSheets = {};
    }
    const current = member => {
        const sheet = s.lookSheets[member.key];
        return sheet && (sheet.edited || sheet.basis === member.basis) && (sheet.v || 1) >= SHEET_VERSION && !staleSheet(sheet).length ? sheet : null;
    };
    const missing = members.filter(member => !current(member) && !sheetFailed.has(`${member.basis}|${JSON.stringify(sheetHashes())}`));
    const service = ctx().ConnectionManagerRequestService;
    if (ask && missing.length && service && s.tagProfile) {
        try {
            const people = await requestSheets(missing);
            for (const member of missing) {
                const person = people.get(member.name.toLowerCase()) || (missing.length === 1 && people.size === 1 ? [...people.values()][0] : null);
                const old = s.lookSheets[member.key];
                if (person) {
                    const keep = old?.edited ? Object.fromEntries(Object.entries(old.person || {}).filter(([id]) => !staleSheet(old).includes(id))) : {};
                    s.lookSheets[member.key] = { name: member.name, person: { ...person, ...keep }, basis: member.basis, edited: Boolean(old?.edited), v: SHEET_VERSION, cats: sheetHashes() };
                } else {
                    sheetFailed.add(`${member.basis}|${JSON.stringify(sheetHashes())}`);
                }
            }
            save();
        } catch (error) {
            missing.forEach(member => sheetFailed.add(`${member.basis}|${JSON.stringify(sheetHashes())}`));
            console.warn('[Image Search] could not fill the look sheets', error);
        }
    }
    return members.map(member => {
        const sheet = current(member) || (s.lookSheets[member.key]?.edited ? s.lookSheets[member.key] : null);
        return sheet ? { name: member.name, key: member.key, ...sheet.person, edited: Boolean(sheet.edited) } : { ...sheetFromText(member.name, member.source), key: member.key, guessed: true };
    });
}

function sheetFields(member) {
    return Object.fromEntries(Object.entries(member).filter(([key]) => !['name', 'key', 'edited', 'guessed', 'role'].includes(key)));
}

function sheetLine(member) {
    const fields = sheetFields(member);
    const keys = [...new Set([...sheetCategories().map(category => category.id), ...Object.keys(fields)])].filter(key => fields[key]);
    return `Person: ${keys.map(key => `${key}: ${fields[key]}`).join('; ')}`;
}

function sheetBox(member, onSave) {
    const box = el('div', 'stis-card stis-sheet');
    let editing = false;
    const replace = person => {
        Object.keys(sheetFields(member)).forEach(key => delete member[key]);
        Object.assign(member, person);
    };
    const draw = () => {
        box.innerHTML = '';
        const s = settings();
        box.appendChild(el('small', 'stis-card-head', `How ${member.name} looks${member.edited ? ' (edited by you)' : member.guessed ? ' (guessed from the card text, the AI could not read it)' : ''}`));
        if (editing) {
            const area = el('textarea', 'text_pole stis-card-edit');
            area.value = sheetLine(member);
            const hint = el('small', 'stis-card-hint', `Fields: ${sheetCategories().map(category => category.id).join(', ')}, separated by ;.`);
            const saveButton = el('div', 'menu_button', 'Save');
            const cancel = el('div', 'menu_button', 'Cancel');
            saveButton.addEventListener('click', () => {
                const person = textToCard(area.value)?.people[0];
                if (!person) {
                    return;
                }
                const basis = allMembers().find(item => item.key === member.key)?.basis || '';
                s.lookSheets = s.lookSheets || {};
                s.lookSheets[member.key] = { name: member.name, person, basis, edited: true, v: SHEET_VERSION, cats: sheetHashes() };
                save();
                replace(person);
                Object.assign(member, { edited: true, guessed: false });
                editing = false;
                draw();
                onSave?.();
            });
            cancel.addEventListener('click', () => {
                editing = false;
                draw();
            });
            const row = el('div', 'stis-card-bar');
            row.append(saveButton, cancel);
            box.append(area, hint, row);
            return;
        }
        box.appendChild(el('div', 'stis-card-text', sheetLine(member).replace(/^Person: /, '').replace(/; /g, '\n')));
        const row = el('div', 'stis-card-bar');
        const edit = el('div', 'menu_button', 'Edit');
        edit.addEventListener('click', () => {
            editing = true;
            draw();
        });
        const again = el('div', 'menu_button', 'Read the card again');
        again.title = 'Ask the tag model to fill this sheet again from the character card';
        again.addEventListener('click', async () => {
            if (s.lookSheets) {
                delete s.lookSheets[member.key];
            }
            sheetFailed.clear();
            again.textContent = 'Reading…';
            const fresh = (await lookSheets()).find(item => item.key === member.key);
            if (fresh) {
                replace(sheetFields(fresh));
                Object.assign(member, { edited: false, guessed: Boolean(fresh.guessed) });
            }
            draw();
            onSave?.();
        });
        row.append(edit, again);
        box.appendChild(row);
    };
    draw();
    return box;
}

const SCENE_CUT = /\b(?:the )?(?:next|following) (?:day|morning|evening|night|afternoon|week|month|year)\b|\b(?:hours|days|weeks|months|years|moments|minutes) later\b|\b(?:an?|one|some|few|several|couple of|two|three) (?:hours?|days?|weeks?|months?|years?) later\b|\blater (?:that|on|in the) (?:day|night|evening|morning|afternoon|week)\b|\bthe (?:morning|day|night|week) after\b|\bthat (?:evening|night|afternoon)\b|\bmeanwhile\b|\belsewhere\b|\btime ?skip\b|\bscene (?:change|break|cut|shift)\b|^\s*(?:-{3,}|\*{3,}|#{3,}|~{3,}|_{3,})\s*$/im;
const NEGATIONS = /\b(?:no|not|never|without|don'?t|doesn'?t|didn'?t|won'?t|isn'?t|aren'?t|wasn'?t|can'?t|cannot|stops?|stopped|refuses? to|refused to|avoids?|avoiding|instead of|rather than)\s+(?:(?:any|more|the|a|an|her|his|their|longer|even|to|be|being|get|getting|go|going|start|starting|want|wants|try|trying|tries|bother|dare)\s+){0,3}([a-z]{3,})/gi;
const NOT_ACTIONS = new Set(['one', 'way', 'matter', 'idea', 'time', 'problem', 'need', 'thing', 'things', 'reason', 'doubt', 'sure', 'know', 'think', 'want', 'like', 'care', 'mind', 'longer', 'more', 'less', 'much', 'many', 'other', 'response', 'answer', 'words', 'word', 'sound', 'only', 'just', 'really', 'quite', 'yet', 'again', 'here', 'there', 'that', 'this', 'what', 'how', 'why', 'where', 'when', 'say', 'said', 'tell', 'see', 'look', 'seem', 'feel', 'hear', 'notice', 'help', 'move', 'react', 'wait', 'stop', 'anymore', 'anything', 'something', 'nothing', 'everything', 'someone', 'anyone', 'nobody', 'big', 'deal', 'joke', 'kidding', 'chance', 'choice', 'escape', 'hope', 'hurry', 'rush', 'fair', 'good', 'bad', 'right', 'wrong', 'ever', 'thanks', 'thank', 'sorry', 'please', 'okay', 'ready', 'today', 'tonight']);

function sceneCut(message) {
    const match = String(message || '').match(SCENE_CUT);
    return match ? match[0].trim() : '';
}

function actionStem(word) {
    let stem = String(word || '').toLowerCase();
    stem = stem.replace(/(?:ing|ed|es|s)$/, '');
    if (stem.length >= 4 && /([^aeiou])\1$/.test(stem)) {
        stem = stem.slice(0, -1);
    }
    return stem.length >= 3 ? stem : String(word || '').toLowerCase();
}

function ruledOut(message) {
    const out = [];
    for (const match of String(message || '').matchAll(NEGATIONS)) {
        const word = match[1].toLowerCase();
        if (!NOT_ACTIONS.has(word) && !STOP_WORDS.has(word) && !out.some(item => item.word === word)) {
            out.push({ word, stem: actionStem(word), phrase: match[0].trim() });
        }
    }
    return out.slice(0, 6);
}

function showsAction(entry, item) {
    const text = [entry.card?.pose.join(' '), entry.card?.moments.join(' '), entry.sections?.action, entry.keywords?.join(' '), entry.variants.map(variant => variant.diff).join(' ')].filter(Boolean).join(' ').toLowerCase();
    return text.split(/[^a-z']+/).some(word => word.length >= 3 && actionStem(word) === item.stem);
}

function withoutRuledOut(message) {
    let text = String(message || '');
    ruledOut(message).forEach(item => {
        text = text.split(item.phrase).join(' ');
    });
    return text.replace(/\s+/g, ' ').trim();
}

function meaningQuery(message) {
    const text = withoutRuledOut(message);
    if (sceneCut(message)) {
        return text;
    }
    const last = (ctx().chat || []).filter(m => m && !m.is_system && typeof m.mes === 'string').slice(-1)[0];
    const before = last ? cleanForPrompt(last.mes).slice(-400) : '';
    return `${before}\n${text}`.trim();
}

async function rankedCandidates(message) {
    const timing = {};
    const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const timed = async (key, work) => {
        const start = clock();
        try {
            return await work;
        } finally {
            timing[key] = clock() - start;
        }
    };
    let started = clock();
    const cut = sceneCut(message);
    const banned = ruledOut(message);
    const fromMessage = messageValues(message);
    const choices = pictureCandidates(`${cut ? '' : recentText(2)} ${withoutRuledOut(message)} ${judgedNotes().join(' ')}`);
    timing.keywords = clock() - started;
    if (!choices.length) {
        return choices;
    }
    let order = null;
    let meaningFailed = false;
    const [rank, cast] = await Promise.all([
        timed('meaning', meaningRank(meaningQuery(message || recentText(1)), Infinity)).catch(error => {
            meaningFailed = true;
            if (!meaning.warned) {
                meaning.warned = true;
                toastr.warning(`Search by meaning did not work (${String(error?.message || error).slice(0, 140)}). Using keywords only.`, 'Image Search');
            }
            return null;
        }),
        timed('sheets', castSheets()).catch(() => []),
    ]);
    lastCast = cast;
    started = clock();
    order = rank;
    for (const choice of choices) {
        const position = order?.get(choice.entry);
        const keywords = Math.min(choice.score || 0, 24);
        const meaningPoints = position === undefined ? 0 : Math.round(18 * (1 - position / Math.max(order.size, 1)));
        const detail = looksDetail(choice.entry, cast, fromMessage);
        const looks = detail.score;
        const shownPoints = choice.fresh ? 0 : -12;
        const clashes = banned.filter(item => showsAction(choice.entry, item));
        const bannedPoints = clashes.length ? -15 : 0;
        let meaningNote;
        if (!meaningSource()) {
            meaningNote = 'Meaning: search by meaning is off, so it does not count.';
        } else if (meaningFailed) {
            meaningNote = 'Meaning: the search did not work this time, so it does not count.';
        } else if (position !== undefined) {
            meaningNote = `Meaning: #${position + 1} of ${order.size} closest to the newest message → ${signed(meaningPoints)} (the closest gets +18, the farthest 0)`;
        } else if (!choice.entry.card) {
            meaningNote = 'Meaning: no filing card yet, so it is not in the search index → 0';
        } else {
            meaningNote = 'Meaning: not in the search index yet (it updates in the background) → 0';
        }
        choice.parts = { meaning: position === undefined ? null : position + 1, of: order?.size || 0, looks, keywords, shown: shownPoints, meaningPoints, cast: cast.length > 0, notes: [meaningNote, ...detail.notes.map(note => `Looks: ${note}`), `Keywords: words shared with ${cut ? 'your message' : 'the story'} and the character's looks → ${signed(keywords)} (at most +24)`, ...(cut ? [`Scene cut ("${cut}"): the old scene is left out of keywords, meaning and the AI's check`] : []), ...(clashes.length ? [`Your message rules out ${clashes.map(item => `"${item.word}"`).join(', ')}, and the picture shows it → ${signed(bannedPoints)}`] : []), ...(shownPoints ? [`Already shown in this chat → ${signed(shownPoints)}`] : [])] };
        choice.parts.meaningNote = choice.parts.notes.shift();
        choice.first = keywords + looks + shownPoints + bannedPoints;
        choice.total = choice.first + meaningPoints;
    }
    const keep = firstPassSize();
    const first = [...choices].sort((a, b) => b.first - a.first);
    first.forEach((choice, index) => {
        choice.parts.notes.push(`1. Looks and keywords: ${signed(Math.round(choice.first))} → #${index + 1} of ${first.length}; the first ${Math.min(keep, first.length)} go on`);
    });
    const kept = first.slice(0, keep).sort((a, b) => b.total - a.total || b.first - a.first);
    const sorted = [...kept, ...first.slice(keep)];
    const seen = shortlistSize();
    sorted.forEach((choice, index) => {
        if (index < kept.length) {
            choice.parts.notes.push(`2. ${choice.parts.meaningNote}`, `Total ${signed(Math.round(choice.total))} → #${index + 1}; the AI compares the first ${Math.min(seen, sorted.length)}`);
        } else {
            choice.parts.notes.push(`2. Not ranked by meaning (left out by the first step) → #${index + 1}; the AI compares the first ${Math.min(seen, sorted.length)}`);
        }
    });
    timing.looks = clock() - started;
    sorted.cast = cast;
    sorted.timing = timing;
    return sorted;
}

function firstPassSize() {
    return Math.max(shortlistSize(), Math.min(500, Number(settings().firstPass) || 50));
}

function timingLine(timing) {
    const sec = ms => `${((Number(ms) || 0) / 1000).toFixed(1)} s`;
    const parts = [['keywords', 'keywords'], ['meaning', 'meaning search'], ['sheets', 'look sheets'], ['looks', 'looks'], ['ai', 'AI ranking']].filter(([key]) => key in timing).map(([key, label]) => `${label} ${sec(timing[key])}`);
    return `Took: ${parts.join(' · ')}${'total' in timing ? ` · total ${sec(timing.total)}` : ''}`;
}

function scoreLine(choice) {
    const parts = choice.parts;
    if (!parts) {
        return '';
    }
    const items = [];
    if (parts.meaning) {
        items.push(`meaning #${parts.meaning} of ${parts.of}`);
    } else if (parts.of) {
        items.push(choice.entry.card ? 'not in the search index' : 'no meaning match');
    }
    if (parts.cast && choice.entry.card?.people?.length) {
        items.push(`looks ${signed(parts.looks)}`);
    } else if (!choice.entry.card) {
        items.push('no filing card');
    }
    items.push(`keywords ${parts.keywords}`);
    return `Search: ${items.join(' · ')}`;
}

function shortlistSize() {
    return Math.min(60, Math.max(5, Number(settings().pickShortlist) || 30));
}

function cardBox(entry, onChange) {
    const box = el('div', 'stis-card');
    let editing = false;
    let busy = false;
    const draw = () => {
        box.innerHTML = '';
        const card = entry.card;
        box.appendChild(el('small', 'stis-card-head', card ? `Filing card${card.edited ? ' (edited by you)' : ''}${!card.edited && needsCard(entry) ? ' (out of date)' : ''}` : entry.description ? 'No filing card yet.' : 'A filing card is made once the picture is described.'));
        if (editing) {
            const area = el('textarea', 'text_pole stis-card-edit');
            area.value = card ? cardToText(card) : 'Person: gender: ; species: ; skin: ; hair: ; build: ; outfit: ; features: \nPose: \nMood: \nPlace: \nFraming: \nMoments: ';
            const hint = el('small', 'stis-card-hint', `One Person line per person, fields: ${personCategories().map(category => category.id).join(', ')} (separated by ;). Add "role: background" to people who should not count for looks. Moments are separated by ;. Poses: ${listSetting(settings().poseList || DEFAULT_POSES).slice(0, 12).join(', ')}…`);
            const save = el('div', 'menu_button', 'Save card');
            const cancel = el('div', 'menu_button', 'Cancel');
            save.addEventListener('click', async () => {
                const next = textToCard(area.value);
                if (!next) {
                    return;
                }
                entry.card = { ...next, basis: cardBasis(entry), edited: true, v: CARD_VERSION };
                editing = false;
                draw();
                await saveLibrary({ skipSync: true, skipFiling: true });
                syncMeaning();
                onChange?.();
            });
            cancel.addEventListener('click', () => {
                editing = false;
                draw();
            });
            const row = el('div', 'stis-card-bar');
            row.append(save, cancel);
            box.append(area, hint, row);
            return;
        }
        if (card) {
            box.appendChild(el('div', 'stis-card-text', cardToText(card)));
        }
        const row = el('div', 'stis-card-bar');
        const edit = el('div', 'menu_button', card ? 'Edit card' : 'Write card');
        edit.addEventListener('click', () => {
            editing = true;
            draw();
        });
        row.appendChild(edit);
        if (entry.description) {
            const again = el('div', 'menu_button', busy ? 'Making…' : card ? 'Make again' : 'Make card');
            again.title = 'Ask the tag model to fill the card from the description';
            again.addEventListener('click', async () => {
                if (busy) {
                    return;
                }
                busy = true;
                draw();
                const before = entry.card;
                await fileCards({ only: [entry] });
                busy = false;
                if (entry.card === before) {
                    toastr.warning(`The filing card could not be made${filing.error ? `: ${filing.error}` : '.'}`, 'Image Search');
                }
                draw();
                onChange?.();
            });
            row.appendChild(again);
        }
        box.appendChild(row);
    };
    draw();
    return box;
}

function entryAnimated(entry) {
    return Boolean(entry.animated) || entryUrls(entry).some(url => /\.gif(\?|$)/i.test(url));
}

function entryFacets(entry) {
    return [...cardFacets(entry), ...(entryAnimated(entry) ? ['file:animated'] : [])];
}

function cardFacets(entry) {
    if (!entry.card) {
        return entry.description ? ['card:none'] : [];
    }
    const keys = [];
    const people = entry.card.people.filter(person => person.role !== 'background');
    for (const category of personCategories()) {
        people.forEach(person => personValues(category, person).forEach(value => keys.push(`${category.id}:${value}`)));
    }
    for (const category of sceneCategories()) {
        valuesIn(category, entry.card.scene?.[category.id] || '').forEach(value => keys.push(`${category.id}:${value}`));
    }
    entry.card.pose.forEach(value => keys.push(`pose:${value}`));
    entry.card.mood.forEach(value => keys.push(`mood:${value}`));
    return [...new Set(keys)];
}

const sendState = { pending: null, busy: false };

function chatPictures() {
    const meta = ctx().chatMetadata;
    if (!meta || typeof meta !== 'object') {
        return { shown: [], forced: null };
    }
    if (!meta.imagesearch || typeof meta.imagesearch !== 'object') {
        meta.imagesearch = {};
    }
    if (!Array.isArray(meta.imagesearch.shown)) {
        meta.imagesearch.shown = [];
    }
    return meta.imagesearch;
}

function markShown(ids) {
    const record = chatPictures();
    record.shown = [...record.shown.filter(id => !ids.includes(id)), ...ids].slice(-100);
}

function lastUserIndex() {
    const chat = ctx().chat || [];
    for (let i = chat.length - 1; i >= 0; i--) {
        if (chat[i]?.is_user && !chat[i].is_system) {
            return i;
        }
    }
    return -1;
}

function choiceId(choice) {
    return (choice.variant || choice.entry).id;
}

function nextPicture(entry, shown) {
    if (entry.kind === 'sequence' && isMulti(entry)) {
        let last = -1;
        entry.variants.forEach((variant, index) => {
            if (shown.has(variant.id)) {
                last = index;
            }
        });
        const next = entry.variants[last + 1];
        return next ? { entry, variant: next, fresh: true } : { entry, variant: entry.variants[0], fresh: false };
    }
    if (isMulti(entry)) {
        const variant = entry.variants.find(item => !shown.has(item.id));
        return variant ? { entry, variant, fresh: true } : { entry, variant: entry.variants[0], fresh: false };
    }
    return { entry, variant: null, fresh: !shown.has(entry.id) };
}

function pictureCandidates(text) {
    const shown = new Set(chatPictures().shown);
    const ranked = rankEntries(library.entries.filter(entry => entry.description), { text, character: ctx().name2 || '' });
    const choices = ranked.map(({ entry, score }) => ({ ...nextPicture(entry, shown), score }));
    return [...choices.filter(choice => choice.fresh), ...choices.filter(choice => !choice.fresh)];
}

function choiceLine(choice) {
    const { entry, variant } = choice;
    const index = variant ? Math.max(0, entry.variants.indexOf(variant)) : 0;
    const what = index > 0 && variant.diff ? variant.diff : entry.sections?.action || '';
    const kind = entry.kind === 'sequence' && isMulti(entry) ? ` (picture ${index + 1} of a ${entry.variants.length}-picture story sequence)` : '';
    const looks = entry.card ? cardLine(entry.card) : `Looks: ${String(entry.sections?.visual || shortDescription(entry)).replace(/\s+/g, ' ').trim().slice(0, 320)}`;
    return `${looks} | Happening: ${what.replace(/\s+/g, ' ').trim().slice(0, 200) || 'not described'}${kind}${entry.animated ? ' (animated)' : ''}`;
}

function appearanceNotes() {
    const c = ctx();
    const lines = cardAppearances();
    const looks = parseLooks();
    const names = new Set([c.name2, c.name1].filter(Boolean).map(name => name.toLowerCase()));
    mentionedLooks(looks).forEach(look => names.add(look.name.toLowerCase()));
    looks.filter(look => names.has(look.name.toLowerCase())).forEach(look => lines.push(`${look.name} (saved look): ${look.tags.join(', ').replace(/_/g, ' ')}`));
    return lines;
}

function storyLines(count = 4) {
    return (ctx().chat || [])
        .filter(message => message && !message.is_system && typeof message.mes === 'string')
        .slice(-count)
        .map(message => `${message.name || (message.is_user ? 'User' : 'Character')}: ${cleanForPrompt(message.mes).slice(-500)}`)
        .join('\n');
}

function judgedNotes() {
    const plan = castPlan();
    const allowed = new Set([plan.main, ...plan.extras].filter(Boolean).map(member => member.name.toLowerCase()));
    return appearanceNotes().filter(line => [...allowed].some(name => line.toLowerCase().startsWith(`${name} (`)));
}

function pickContext(message) {
    const c = ctx();
    const user = c.name1 || 'The user';
    const looks = [...lastCast.map(member => `${member.name} (look sheet): ${judgeWho(member)}`), ...judgedNotes()];
    const cut = sceneCut(message);
    const banned = ruledOut(message);
    const story = cut ? `(The newest message starts a new scene with "${cut}": what happened before does not count.)` : storyLines() || '(start of the story)';
    const plan = castPlan();
    const everyone = [...sceneMembers(), personaMember()].filter(Boolean);
    const left = everyone.filter(member => member !== plan.main && !plan.extras.includes(member) && member.key !== plan.main?.key && !plan.extras.some(extra => extra.key === member.key)).map(member => member.name);
    const focus = plan.main ? `\nThe picture must show ${plan.main.name}: judge looks against ${plan.main.name} first.${plan.extras.length ? ` ${plan.extras.map(member => member.name).join(', ')} may also be in it, but does not have to be.` : ''}` : '';
    const ignoreUser = focus + (left.length ? `\n${left.join(', ')} ${left.length > 1 ? 'are' : 'is'} not part of this check: never judge a picture by whether ${left.join(' or ')} ${left.length > 1 ? 'are' : 'is'} in it or how they look, and do not mention them in your reasons.` : '');
    const rules = (banned.length ? `\nThe newest message rules out: ${banned.map(item => item.phrase).join('; ')}. Any picture showing that is wrong: rank it last.` : '') + ignoreUser;
    return `A roleplay continues. ${user} just wrote the newest message below, and the reply to it will come with one saved picture. Choose that picture.\nJudge in this order:\n1. Looks: the people in the picture must look like the characters in the scene: gender, species, age, build, skin and hair colour. How the hair is styled or how long it is does not matter, and neither do clothes. A picture of someone who looks different is wrong, even if the action fits.\n2. Action: the picture must show what the newest message says happens, or its direct result (if someone gets pushed, a picture of them falling fits better than one of them standing). Read it carefully: if it says something does not happen, a picture showing it is wrong.\nWhere it happens (the place or the background) does not matter.${rules}\n\nHow the characters look:\n${looks.join('\n') || '(only what the story says)'}\n\nStory so far:\n${story}\n\nNewest message from ${user}:\n${message || '(no new message: the story simply continues)'}`;
}

async function askPicturePick(message, candidates) {
    const s = settings();
    const c = ctx();
    const service = c.ConnectionManagerRequestService;
    if (!service || !s.tagProfile || candidates.length < 2) {
        return null;
    }
    const shortlist = candidates.slice(0, shortlistSize());
    const prompt = `${pickContext(message)}\n\nPictures:\n${shortlist.map((choice, index) => `${index + 1}. ${choiceLine(choice)}`).join('\n')}\n\nRank all ${shortlist.length} pictures, best first, one per line, each with a short reason for its place (who it shows, what happens, what fits or does not), in at most 12 words, like this:\n#7 - Mira knocked down, right looks, follows the shove\n#12 - right looks, but she is standing calmly\nIf none of the pictures really fits, start with this line and still rank them all: #0 - why nothing fits`;
    const result = await service.sendRequest(s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), 120 + 40 * shortlist.length, { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.2));
    const text = String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
    const picks = [];
    let none = null;
    const take = (number, why) => {
        if (number === 0) {
            none ??= why;
            return;
        }
        const choice = shortlist[number - 1];
        if (choice && !picks.some(pick => pick.choice === choice)) {
            picks.push({ choice, why });
        }
    };
    for (const raw of text.split('\n')) {
        const line = raw.replace(/\*\*/g, '').replace(/^\s*(?:[-*•]+|\d+[.)])\s+(?=(?:picture\s*)?#?\d)/i, '');
        if (/\d/.test(line) && /^[\s#\d,;.]+$/.test(line)) {
            line.match(/\d+/g).map(Number).forEach(number => take(number, ''));
            continue;
        }
        const match = line.match(/^\s*(?:[-*#]+\s*)?(?:picture\s*)?#?(\d+)(?:\s*[.):\-–—*]+\s*|\s+|$)(.*)$/i);
        if (match) {
            take(Number(match[1]), match[2].replace(/^(why it fits|why|because)\s*[:\-–—]?\s*/i, '').trim().slice(0, 200));
        }
    }
    if (!picks.length && none === null) {
        const numbers = [...text.matchAll(/\d+/g)].map(match => Number(match[0])).filter(number => number >= 1 && number <= shortlist.length);
        if (!numbers.length) {
            return null;
        }
        [...new Set(numbers)].forEach(number => take(number, ''));
    }
    return {
        choices: picks.map(pick => pick.choice),
        reasons: new Map(picks.filter(pick => pick.why).map(pick => [pick.choice, pick.why])),
        picked: new Set(picks.map(pick => pick.choice)),
        noneFits: none !== null,
        none: none || '',
    };
}

function forceInstruction(choice) {
    const described = describedVariant(choice.entry, choice.variant);
    return `[The app will show a picture together with your next reply. Write the reply so the story leads into the moment the picture shows, as the result of or the reaction to the last message, and describe that moment in the story itself. Do not mention a picture, an image or tags. The picture shows:\n${described.text || tagsLine(choice.entry.tags)}]`;
}

function setForcePrompt(choice) {
    ctx().setExtensionPrompt?.(PROMPT_KEY, forceInstruction(choice), 1, 0, false, 0);
}

function clearForcePrompt() {
    ctx().setExtensionPrompt?.(PROMPT_KEY, '', 1, 0, false, 0);
}

function forcePicture(choice) {
    sendState.pending = { id: choiceId(choice) };
    setForcePrompt(choice);
    const button = document.getElementById('send_but');
    if (button) {
        button.click();
    } else {
        sendState.pending = null;
        clearForcePrompt();
        toastr.warning('Could not find SillyTavern\'s send button.', 'Image Search');
    }
}

function showPictureCard(session) {
    const c = ctx();
    const { options, reasons, picked, noneFits, noneWhy } = session;
    const aiOrder = new Map(options.filter(choice => picked.has(choice)).map((choice, position) => [choice, position + 1]));
    let index = 0;
    const root = el('div', 'stis-sendcard');
    const note = el('small', 'stis-sendcard-note');
    const img = el('img', 'stis-sendcard-img');
    img.alt = '';
    const text = el('div', 'stis-sendcard-text');
    const why = el('div', 'stis-sendcard-why');
    const score = el('small', 'stis-sendcard-score');
    score.title = 'Tap to see how this picture was ranked';
    const looksBox = el('div', 'stis-sendcard-looks');
    let showLooks = false;
    score.addEventListener('click', () => {
        showLooks = !showLooks;
        draw();
    });
    const grid = el('div', 'stis-sendcard-grid');
    grid.hidden = true;
    const fix = el('a', 'stis-sendcard-fix', 'Something wrong? Cancel and open this picture in the library');
    fix.href = '#';
    fix.title = 'Cancel this send and open the picture in the library, to fix its description, filing card or tags';
    fix.addEventListener('click', async event => {
        event.preventDefault();
        const choice = options[index];
        await popup.completeCancelled();
        openPicker(null, { entryId: choice.entry.id, variantId: choice.variant?.id || '' });
    });
    const bar = el('div', 'stis-sendcard-bar');
    const send = el('div', 'menu_button stis-use', 'Send');
    const another = el('div', 'menu_button', 'Another');
    const browse = el('div', 'menu_button', 'Library');
    browse.title = 'Choose any picture from the library';
    const search = el('div', 'menu_button', 'Search the sites');
    const cancel = el('div', 'menu_button', 'Cancel');
    bar.append(send, another, browse, search, cancel);
    const sheets = el('div', 'stis-sendcard-sheets');
    root.append(note, img, why, text, score, looksBox, sheets, grid, fix, bar);
    const popup = new c.Popup(root, c.POPUP_TYPE.DISPLAY, '', { animation: 'fast', allowVerticalScrolling: true });
    const draw = () => {
        const choice = options[index];
        img.src = (choice.variant || choice.entry).url;
        text.textContent = choiceLine(choice);
        score.textContent = scoreLine(choice) ? `${scoreLine(choice)} ${showLooks ? '▴' : '▾'}` : '';
        looksBox.textContent = showLooks ? [...(choice.parts?.notes || []), ...(session.timing ? [timingLine(session.timing)] : [])].join('\n') : '';
        if (showLooks && !sheets.childElementCount) {
            (session.cast || []).forEach(member => sheets.appendChild(sheetBox(member, () => {
                note.textContent = 'Saved. The new look counts from the next picture send.';
            })));
        }
        sheets.hidden = !showLooks;
        const reason = reasons.get(choice);
        const place = aiOrder.get(choice);
        if (place) {
            why.textContent = `AI #${place} of ${session.shortlist.size}${reason ? `: ${reason}` : '.'}`;
        } else if (!picked.size) {
            why.textContent = '';
        } else if (session.shortlist.has(choice)) {
            why.textContent = 'The AI left this one out of its ranking.';
        } else {
            why.textContent = `The AI did not see this one: it was #${session.ranks.get(choice) || '?'} in the search, and the AI sees the first ${session.shortlist.size}.`;
        }
        const head = noneFits ? `The AI found nothing that really fits${noneWhy ? `: ${noneWhy.replace(/[.!?]*$/, '.')}` : '.'} Its ranking anyway. ` : '';
        note.textContent = `${head}Choice ${index + 1} of ${options.length}`;
        another.classList.toggle('stis-disabled', index >= options.length - 1);
    };
    send.addEventListener('click', async () => {
        const choice = options[index];
        await popup.completeCancelled();
        forcePicture(choice);
    });
    another.addEventListener('click', () => {
        if (index < options.length - 1) {
            index++;
            draw();
        }
    });
    browse.addEventListener('click', () => {
        grid.hidden = !grid.hidden;
        if (grid.hidden || grid.childElementCount) {
            return;
        }
        options.forEach((choice, position) => {
            const cell = el('div', 'stis-sendcard-cell');
            const thumb = el('img');
            thumb.loading = 'lazy';
            thumb.alt = '';
            thumb.src = (choice.variant || choice.entry).url;
            cell.title = shortDescription(choice.entry);
            cell.append(thumb, el('span', 'stis-sendcard-num', String(position + 1)));
            cell.addEventListener('click', () => {
                index = position;
                grid.hidden = true;
                draw();
            });
            grid.appendChild(cell);
        });
    });
    search.addEventListener('click', async () => {
        await popup.completeCancelled();
        openPicker();
    });
    cancel.addEventListener('click', () => popup.completeCancelled());
    draw();
    popup.show();
}

function storedSendOptions() {
    const s = settings();
    return { focus: s.pickFocus === 'user' ? 'user' : 'char', main: String(s.pickMain || ''), allowOther: typeof s.pickAllowOther === 'boolean' ? s.pickAllowOther : s.pickWithUser !== false };
}

function askSendOptions() {
    const s = settings();
    const stored = storedSendOptions();
    if (!s.pickWindow) {
        return Promise.resolve(stored);
    }
    const c = ctx();
    const user = c.name1 || 'You';
    const names = [...new Set([...chatCharacters().map(character => character.name), ...(chatCharacters().length ? [] : [c.name2])].filter(Boolean))];
    return new Promise(resolve => {
        let answer = null;
        const root = el('div', 'stis-sendopts');
        root.appendChild(el('b', '', 'Send with a picture'));
        const row = el('div', 'st-imagesearch-row');
        row.appendChild(el('span', '', 'Main focus'));
        const focus = el('select', 'text_pole');
        focus.id = 'stis_sendopts_focus';
        names.forEach(name => {
            const option = el('option', '', name);
            option.value = `char:${name}`;
            focus.appendChild(option);
        });
        const me = el('option', '', `${user} (me)`);
        me.value = 'user';
        focus.appendChild(me);
        focus.value = stored.focus === 'user' ? 'user' : `char:${names.includes(stored.main) ? stored.main : names[0] || ''}`;
        if (!focus.value) {
            focus.value = 'user';
        }
        row.appendChild(focus);
        const label = el('label', 'checkbox_label');
        const box = el('input');
        box.type = 'checkbox';
        box.checked = stored.allowOther;
        box.id = 'stis_sendopts_other';
        const boxText = el('span', '');
        label.append(box, boxText);
        const hint = el('small', 'stis-sendopts-hint');
        const others = () => (focus.value === 'user' ? names.join(', ') || 'the characters' : user);
        const mainName = () => (focus.value === 'user' ? user : focus.value.slice(5));
        const paint = () => {
            boxText.textContent = ` Also allow ${others()} in the picture`;
            hint.textContent = box.checked ? `The picture must show ${mainName()}; ${others()} may also be in it.` : `The picture must show ${mainName()}; the AI leaves ${others()} out of its check.`;
        };
        focus.addEventListener('change', paint);
        box.addEventListener('change', paint);
        paint();
        const bar = el('div', 'stis-sendcard-bar');
        const go = el('div', 'menu_button stis-use', 'Choose picture');
        const cancel = el('div', 'menu_button', 'Cancel');
        bar.append(go, cancel);
        root.append(row, label, hint, bar);
        const popup = new c.Popup(root, c.POPUP_TYPE.DISPLAY, '', { animation: 'fast', onClose: () => resolve(answer) });
        go.addEventListener('click', async () => {
            answer = { focus: focus.value === 'user' ? 'user' : 'char', main: focus.value === 'user' ? stored.main : focus.value.slice(5), allowOther: box.checked };
            s.pickFocus = answer.focus;
            s.pickMain = answer.main;
            s.pickAllowOther = answer.allowOther;
            save();
            await popup.completeCancelled();
        });
        cancel.addEventListener('click', () => popup.completeCancelled());
        popup.show();
    });
}

async function sendWithPicture() {
    const s = settings();
    if (!s.enabled || sendState.busy) {
        return;
    }
    sendState.busy = true;
    let choices = null;
    try {
        choices = await askSendOptions();
    } finally {
        sendState.busy = false;
    }
    if (!choices) {
        return;
    }
    pickOptions = choices;
    const message = String(document.getElementById('send_textarea')?.value || '').trim();
    sendState.busy = true;
    const notice = toastr.info('Choosing a picture…', 'Image Search', { timeOut: 0, extendedTimeOut: 0 });
    let options = [];
    let noneFits = false;
    let reasons = new Map();
    let aiPicked = new Set();
    let noneWhy = '';
    let shortlist = new Set();
    let ranks = new Map();
    let cast = [];
    let timing = null;
    const sendStart = Date.now();
    try {
        await loadLibrary();
        const candidates = await rankedCandidates(message);
        if (!candidates.length) {
            toastr.info('The library has no described pictures yet. Save some from the picker first.', 'Image Search');
            return;
        }
        let picked = null;
        const aiStart = Date.now();
        try {
            picked = await askPicturePick(message, candidates);
        } catch (error) {
            console.warn('[Image Search] picture choice failed, using the closest match', error);
            toastr.warning(`The AI could not choose (${String(error?.message || error).slice(0, 120)}). Showing the closest pictures by keywords.`, 'Image Search');
        }
        noneFits = Boolean(picked?.noneFits);
        reasons = picked?.reasons || new Map();
        aiPicked = picked?.picked || new Set(picked?.choices || []);
        noneWhy = picked?.none || '';
        const first = picked?.choices || [];
        options = [...first, ...candidates.filter(choice => !first.includes(choice))];
        shortlist = new Set(candidates.slice(0, shortlistSize()));
        ranks = new Map(candidates.map((choice, position) => [choice, position + 1]));
        cast = candidates.cast || [];
        timing = { ...(candidates.timing || {}), ai: Date.now() - aiStart, total: Date.now() - sendStart };
    } finally {
        toastr.clear?.(notice);
        sendState.busy = false;
    }
    if (!options.length) {
        return;
    }
    if (s.confirmPicture || noneFits) {
        showPictureCard({ message, cast, timing, options, noneFits, reasons, noneWhy, picked: aiPicked, shortlist, ranks });
    } else {
        forcePicture(options[0]);
    }
}

function attachPicture(message, entry, variant, note = 'shown in the story') {
    if (!message.extra || typeof message.extra !== 'object') {
        message.extra = {};
    }
    if (!Array.isArray(message.extra.media)) {
        message.extra.media = [];
    }
    const url = variant?.url || entry.url;
    if (!message.extra.media.some(item => item.url === url)) {
        message.extra.media.push({ type: 'image', url, title: pictureNote(describedVariant(entry, variant), note), append_title: true, source: 'upload' });
    }
    markShown([(variant || entry).id]);
    noteUse(entry, message.name || ctx().name2 || '');
}

function onGenerationStarted(type, _options, dryRun) {
    if (dryRun || type === 'quiet' || type === 'impersonate') {
        return;
    }
    const record = chatPictures();
    if (sendState.pending) {
        record.forced = { pic: sendState.pending.id, user: lastUserIndex(), armed: true };
        sendState.pending = null;
        return;
    }
    if ((type === 'swipe' || type === 'regenerate') && record.forced && record.forced.user === lastUserIndex()) {
        const found = resolvePic(record.forced.pic);
        if (found) {
            setForcePrompt(found);
            record.forced.armed = true;
            return;
        }
    }
    if (record.forced) {
        record.forced.armed = false;
    }
    clearForcePrompt();
}

async function onForcedReply(messageId) {
    const c = ctx();
    const record = chatPictures();
    if (!record.forced?.armed) {
        return;
    }
    record.forced.armed = false;
    clearForcePrompt();
    const id = Number(messageId);
    const message = c.chat[id];
    if (!message || message.is_user || message.is_system) {
        return;
    }
    await loadLibrary();
    const found = resolvePic(record.forced.pic);
    if (!found) {
        return;
    }
    record.forced.reply = id;
    attachPicture(message, found.entry, found.variant);
    saveLibrary();
    syncCurrentSwipe(message);
    if (document.querySelector(`#chat .mes[mesid="${id}"]`)) {
        c.updateMessageBlock(id, message);
    }
    await c.saveChat();
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
        for (const { entry, variant } of pictures) {
            attachPicture(message, entry, variant);
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
    state.catalogSends = (state.catalogSends || 0) + 1;
    if (state.catalogSends >= 10) {
        state.catalogSends = 0;
        scheduleLorebookSync();
    }
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
    if (s.keepLibrary) {
        await loadLibrary();
        const shownIds = found.map(match => findPicture(item => item.url === match[2])).filter(Boolean).map(hit => (hit.variant || hit.entry).id);
        if (shownIds.length) {
            markShown(shownIds);
        }
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

const thumbTrouble = new Map();
const thumbWatchers = new Set();
const CHALLENGE_PAGE = /just a moment|challenge-platform|cf-chl|cf_chl|attention required|cloudflare/i;

function thumbRoute(item, via) {
    if (typeof via === 'function') {
        return 'identified';
    }
    const source = String(via || '');
    if (source.startsWith('/proxy/')) {
        return 'proxy';
    }
    if (item.siteFiles?.thumb && source === item.siteFiles.thumb) {
        return 'site';
    }
    return source.startsWith(item.thumb) ? 'direct' : 'other';
}

function noteThumb(item, img, ok, via = '') {
    const host = hostOf(item.thumb || '');
    if (!host) {
        return;
    }
    const trouble = thumbTrouble.get(host) || { host, failed: [], loaded: 0, loadedUrls: new Set(), routes: {}, sample: '', tries: 0, checked: false, cloudflare: false, why: '' };
    if (ok) {
        trouble.loaded++;
        trouble.loadedUrls.add(item.thumb);
        const route = thumbRoute(item, via);
        trouble.routes[route] = (trouble.routes[route] || 0) + 1;
    } else {
        trouble.failed.push({ img, item });
        trouble.sample = trouble.sample || item.thumb;
    }
    thumbTrouble.set(host, trouble);
    thumbWatchers.forEach(watch => watch(trouble));
}

function blockedHosts() {
    return [...thumbTrouble.values()].filter(trouble => {
        trouble.failed = trouble.failed.filter(({ img }) => img.isConnected);
        return trouble.failed.length >= 3 && trouble.failed.length > trouble.loaded * 3;
    });
}

async function checkBlockedHost(trouble) {
    if (trouble.checked) {
        return;
    }
    trouble.checked = true;
    try {
        const result = await rawFetch(proxyUrl(trouble.sample), { headers: { ...ctx().getRequestHeaders(), ...await agentHeaders(trouble.sample) } });
        trouble.cloudflare = CHALLENGE_PAGE.test(String(result.text || '').slice(0, 20000));
        trouble.why = trouble.cloudflare ? 'its image server asks for a Cloudflare check' : result.ok ? '' : `its image server answered ${result.status}`;
    } catch (error) {
        trouble.why = '';
    }
    thumbWatchers.forEach(watch => watch(trouble));
}

function retryThumbs(host) {
    const trouble = thumbTrouble.get(host);
    if (!trouble) {
        return;
    }
    const list = trouble.failed;
    trouble.failed = [];
    trouble.loaded = 0;
    trouble.tries++;
    list.forEach(({ img, item }) => {
        if (img.isConnected) {
            img.closest('.stis-cell')?.classList.remove('stis-broken');
            setThumbSource(img, item, true);
        }
    });
    thumbWatchers.forEach(watch => watch(trouble));
}

function freshUrl(url) {
    return `${url}${url.includes('?') ? '&' : '?'}_r=${Date.now().toString(36)}`;
}

const serverImages = new Map();

function serverImageUrl(url) {
    if (!serverImages.has(url)) {
        const promise = fetchImageBlob(proxyUrl(url), {}, 'proxy').then(({ blob }) => URL.createObjectURL(blob));
        promise.catch(() => serverImages.delete(url));
        serverImages.set(url, promise);
        while (serverImages.size > 300) {
            const [oldest, old] = serverImages.entries().next().value;
            serverImages.delete(oldest);
            old.then(objectUrl => URL.revokeObjectURL?.(objectUrl)).catch(() => {});
        }
    }
    return serverImages.get(url);
}

function cycleSources(img, sources, { loaded = null, failed = null } = {}) {
    let index = 0;
    img.referrerPolicy = 'no-referrer';
    const show = () => {
        const source = sources[index];
        if (typeof source === 'function') {
            source().then(url => {
                img.src = url;
            }, next);
        } else {
            img.src = source;
        }
    };
    const next = () => {
        index++;
        if (index < sources.length) {
            show();
        } else {
            img.onerror = null;
            img.onload = null;
            failed?.();
        }
    };
    img.onload = () => {
        img.onload = null;
        loaded?.(sources[index]);
    };
    img.onerror = next;
    if (sources.length) {
        show();
    } else {
        failed?.();
    }
}

function setThumbSource(img, item, fresh = false) {
    const site = item.siteFiles?.thumb || '';
    const identified = Boolean(agentFor(item.thumb)['User-Agent']);
    const server = identified ? () => serverImageUrl(item.thumb) : proxyUrl(item.thumb);
    const sources = [fresh ? freshUrl(item.thumb) : item.thumb, site, fetcherLink(item.thumb), server, site && !identified ? proxyUrl(site) : ''].filter(Boolean);
    cycleSources(img, sources, {
        loaded: via => noteThumb(item, img, true, via),
        failed: () => {
            img.closest('.stis-cell')?.classList.add('stis-broken');
            noteThumb(item, img, false);
        },
    });
}

function setPreviewSource(img, item) {
    const site = item.siteFiles || {};
    const identified = Boolean(agentFor(item.img || item.thumb)['User-Agent']);
    const server = identified ? [() => serverImageUrl(item.anim || item.img)] : [proxyUrl(item.img), site.img ? proxyUrl(site.img) : ''];
    const sources = [...new Set([item.anim, item.img, item.anim ? site.full : '', site.img, fetcherLink(item.img), ...server, item.thumb, site.thumb, identified ? () => serverImageUrl(item.thumb) : ''].filter(Boolean))];
    cycleSources(img, sources);
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

async function openPicker(initialTags = null, focus = null) {
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
        blocked: el('div', 'stis-blocked'),
        check: el('div', 'stis-check'),
        grid: el('div', 'stis-grid'),
        sentinel: el('div', 'stis-sentinel'),
        preview: el('div', 'stis-preview'),
        libraryView: el('div', 'stis-library'),
        libSearch: el('input', 'text_pole stis-lib-search'),
        libGrid: el('div', 'stis-grid'),
        libFilters: el('div', 'stis-lib-filters'),
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
    ui.libraryView.append(ui.libSearch, ui.libFilters, ui.libGrid);
    ui.libraryView.hidden = true;
    ui.input.type = 'text';
    ui.input.placeholder = 'add tag (-tag to exclude), Enter';
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
    ui.root.append(ui.tabs, ui.who, ui.top, ui.complete, ui.sites, ui.favs, ui.chipMenu, ui.lookBar, ui.status, ui.debug, ui.blocked, ui.check, ui.grid, ui.libraryView, ui.selectBar, ui.preview);
    ui.blocked.hidden = true;
    ui.check.hidden = true;
    thumbTrouble.clear();
    const awaitingCheck = new Set();
    let checkHost = '';
    const closeCheck = () => {
        ui.check.hidden = true;
        ui.check.innerHTML = '';
        checkHost = '';
    };
    const openInTab = trouble => {
        awaitingCheck.add(trouble.host);
        window.open(freshUrl(lastSample || trouble.sample), '_blank');
    };
    let lastSample = '';
    const openCheck = trouble => {
        closeCheck();
        checkHost = trouble.host;
        const candidates = trouble.failed.map(({ item }) => item.thumb).filter(Boolean);
        const sample = candidates.find(url => url !== lastSample) || candidates[0] || trouble.sample;
        lastSample = sample;
        const head = el('div', 'stis-check-head');
        head.appendChild(el('b', '', `Check for ${trouble.host}`));
        const done = el('div', 'menu_button', 'Done');
        done.addEventListener('click', () => {
            const host = checkHost;
            closeCheck();
            retryThumbs(host);
        });
        head.appendChild(done);
        const frame = el('iframe', 'stis-check-frame');
        frame.referrerPolicy = 'no-referrer';
        const tab = el('a', 'stis-check-tab', 'Stays blank? Open it in a new tab instead');
        tab.href = '#';
        tab.addEventListener('click', event => {
            event.preventDefault();
            openInTab(trouble);
        });
        ui.check.append(head, frame, el('small', 'stis-help', 'Tick the box if one shows. When the picture appears here, tap Done.'), tab);
        ui.check.hidden = false;
        frame.src = freshUrl(sample);
    };
    const renderBlocked = () => {
        const list = blockedHosts();
        ui.blocked.innerHTML = '';
        ui.blocked.hidden = !list.length || ui.grid.hidden;
        for (const trouble of list) {
            checkBlockedHost(trouble);
            const row = el('div', 'stis-blocked-row');
            const why = trouble.why ? `: ${trouble.why}` : '';
            row.appendChild(el('div', 'stis-blocked-text', `${trouble.tries ? 'Still blocked. ' : ''}${trouble.failed.length} picture(s) from ${trouble.host} could not be shown${why}.`));
            const buttons = el('div', 'stis-blocked-buttons');
            const open = el('div', 'menu_button', trouble.cloudflare ? 'Pass the check' : 'Open one');
            open.title = 'Opens one of these pictures right here, so its check can be passed';
            open.addEventListener('click', () => openCheck(trouble));
            const again = el('div', 'menu_button', 'Try again');
            again.addEventListener('click', () => retryThumbs(trouble.host));
            buttons.append(open, again);
            row.appendChild(buttons);
            row.appendChild(el('small', '', trouble.cloudflare ? 'The check opens right here. When the picture shows in it, tap Done and the others load again.' : 'One of the pictures opens right here. If it shows, tap Done and the others load again.'));
            const routes = Object.entries(trouble.routes || {}).filter(([, n]) => n);
            if (routes.length) {
                const names = { direct: `straight from ${trouble.host}`, site: 'from the site\'s own address (/data)', proxy: 'through SillyTavern\'s server', identified: 'through SillyTavern\'s server, saying who you are', other: 'another way' };
                row.appendChild(el('small', 'stis-help', `Shown so far: ${routes.map(([route, n]) => `${n} ${names[route]}`).join(', ')}.`));
            }
            if (DONMAI.test(trouble.host) && !danbooruIdentity.id) {
                row.appendChild(el('small', 'stis-help', 'Danbooru lets programs through when they say whose they are. Add your Danbooru account under Setup → Danbooru account, then tap Try again.'));
            }
            if (trouble.tries && trouble.cloudflare) {
                row.appendChild(el('small', 'stis-help', 'Passed the check and still blocked? Some browsers (Firefox, Brave, Safari) keep the pass apart from pictures shown inside another page. In Firefox, tap the shield in the address bar on this page and turn off Enhanced Tracking Protection for it, then pass the check again; or use Chrome.'));
            }
            ui.blocked.appendChild(row);
        }
    };
    const onThumbTrouble = () => {
        if (closed) {
            return;
        }
        renderBlocked();

    };
    const onCheckReturn = () => {
        if (document.visibilityState === 'visible' && awaitingCheck.size && !closed) {
            const hosts = [...awaitingCheck];
            awaitingCheck.clear();
            hosts.forEach(retryThumbs);
        }
    };
    thumbWatchers.add(onThumbTrouble);
    document.addEventListener('visibilitychange', onCheckReturn);
    window.addEventListener('focus', onCheckReturn);

    let tags = [];
    let required = new Set();
    let negatives = [];
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
    const libFilter = new Set();
    let libMoreOpen = false;
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
        negatives.forEach(tag => {
            const chip = el('span', 'stis-chip stis-neg');
            chip.title = 'Excluded: pictures with this tag are left out of this search. Tap × to take it out.';
            chip.appendChild(el('span', '', `−${tag}`));
            const remove = el('i', 'fa-solid fa-xmark stis-chip-x');
            remove.title = 'Stop excluding it';
            remove.addEventListener('click', event => {
                event.stopPropagation();
                dropNegative(tag);
            });
            chip.appendChild(remove);
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
        action('Exclude from this search', () => makeNegative(tag));
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
                    setTags([...tags, tag], true, [...requiredList(), tag]);
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
        const raw = ui.input.value.split(',').map(part => part.trim()).filter(Boolean);
        ui.input.value = '';
        const minus = raw.filter(part => part.startsWith('-')).map(part => normalizeTag(part.slice(1))).filter(Boolean);
        const parts = raw.filter(part => !part.startsWith('-')).map(normalizeTag).filter(Boolean);
        if (!parts.length && !minus.length) {
            return false;
        }
        if (minus.length) {
            negatives = [...new Set([...negatives, ...minus])];
            tags = tags.filter(tag => !minus.includes(tag));
            minus.forEach(tag => required.delete(tag));
        }
        setTags([...tags, ...parts], true, [...requiredList(), ...parts]);
        tagsChanged();
        return true;
    };

    const makeNegative = tag => {
        negatives = [...new Set([...negatives, tag])];
        removeTag(tag);
    };

    const dropNegative = tag => {
        negatives = negatives.filter(item => item !== tag);
        tagsChanged();
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
            if (item.video) {
                const play = el('span', 'stis-video-badge');
                play.appendChild(el('i', 'fa-solid fa-play'));
                play.title = 'Video: made into a GIF when you use or save it';
                cell.appendChild(play);
            }
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
        if (pre?.browse && !pre.browse.error && sameSearch(pre.browse, domain, tags, req, negatives)) {
            useBrowse(pre.browse);
            return;
        }
        if (browse && !browse.error && sameSearch(browse, domain, tags, req, negatives)) {
            return;
        }
        if (browse && !browse.error && !browse.loading && browse.items.length && sameRequired(browse, domain, tags, req, negatives)) {
            useBrowse(rerankBrowse(browse, tags, req));
            return;
        }
        useBrowse(createBrowse(domain, tags, req, negatives));
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
        const isVideo = typeof src !== 'string' && Boolean(src?.video);
        const img = el(isVideo ? 'video' : 'img', 'stis-preview-img');
        img.draggable = false;
        if (typeof src === 'string') {
            img.src = src;
        } else if (isVideo) {
            Object.assign(img, { muted: true, loop: true, playsInline: true, autoplay: true, controls: true, poster: src.img });
            img.src = proxyUrl(src.video);
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
                setTags([...tags, ...wanted], true, [...requiredList(), ...wanted]);
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

    function clipBar(current, player) {
        const clip = el('div', 'stis-clip');
        const startText = el('span', 'stis-clip-start');
        const paintStart = () => {
            startText.textContent = `Start: ${(Number(current.clipStart) || 0).toFixed(1)} s`;
        };
        const startHere = el('div', 'menu_button', 'Start here');
        startHere.title = 'Start the GIF where the video is now';
        const length = el('input', 'text_pole stis-clip-len');
        Object.assign(length, { type: 'number', min: '1', max: '30', step: '1', value: String(current.clipSeconds || s.gifSeconds || 6) });
        length.title = 'Seconds of video in the GIF';
        const make = el('div', 'menu_button', 'Make GIF');
        const status = el('small', 'stis-clip-status');
        const reset = () => {
            downloads.delete(current.img);
            status.textContent = '';
            make.textContent = 'Make GIF';
        };
        startHere.addEventListener('click', () => {
            current.clipStart = Math.max(0, Number(player.currentTime) || 0);
            paintStart();
            reset();
        });
        length.addEventListener('input', () => {
            current.clipSeconds = Math.min(30, Math.max(1, Number(length.value) || 6));
            reset();
        });
        make.addEventListener('click', async () => {
            if (make.textContent === 'Making…') {
                return;
            }
            reset();
            make.textContent = 'Making…';
            const promise = convertVideoItem(current, share => {
                status.textContent = `Making the GIF… ${Math.round(share * 100)}%`;
            });
            downloads.set(current.img, promise);
            promise.catch(() => downloads.delete(current.img));
            try {
                const picture = await promise;
                status.textContent = `GIF ready: ${(picture.blob.size / 1048576).toFixed(1)} MB, ${picture.frames} frames. Use it or save it.`;
                make.textContent = 'Make again';
                if (previewState?.variant === current && player.isConnected) {
                    const gif = el('img', 'stis-preview-img');
                    gif.alt = '';
                    gif.src = URL.createObjectURL(picture.blob);
                    player.replaceWith(gif);
                }
            } catch (error) {
                make.textContent = 'Make GIF';
                status.textContent = `Could not make the GIF: ${error?.message || error}`;
            }
        });
        paintStart();
        clip.append(startText, startHere, length, el('span', '', 's'), make, status);
        return clip;
    }

    function showPreview(item, chosen = null) {
        const family = gridFamilies.get(familyKey(item));
        const current = chosen || item;
        const { bar, img, link, below } = previewShell(current, current.page, item, 'item');
        previewState.variant = current;
        if (s.saveLocal && !current.video) {
            prepareDownload(current).catch(() => {});
        }
        const stripHolder = el('div', 'stis-variant-holder');
        bar.before(stripHolder);
        if (current.video && s.saveLocal) {
            bar.before(clipBar(current, img));
        }
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
        const meta = [kindLine, entry.lock ? 'Description locked' : '', borrowedLine(entry), entry.characters.length ? `Used with: ${entry.characters.join(', ')}` : '', `Used ${entry.used} time(s)`].filter(Boolean).join(' · ');
        info.appendChild(el('small', '', meta));
        info.appendChild(cardBox(entry, () => {
            if (!closed) {
                renderLibFilters();
            }
        }));
        bar.before(info);
        const redoLabel = entry.lock ? 'Update' : 'Redo';
        const redo = el('div', 'menu_button', redoLabel);
        redo.title = entry.lock ? 'Bring the locked description up to the current description format, keeping what it says; unlock to describe from scratch' : sequence ? 'Describe the sequence again' : 'Describe this picture again';
        redo.addEventListener('click', async () => {
            if (redo.textContent !== redoLabel) {
                return;
            }
            redo.textContent = entry.lock ? 'Updating…' : 'Describing…';
            try {
                await redoEntry(entry);
                if (!closed && previewState?.target === entry) {
                    showEntry(entry, current);
                }
            } catch (error) {
                redo.textContent = redoLabel;
                toastr.warning(`Could not describe the picture: ${error?.message || error}`, 'Image Search');
            }
        });
        const lock = entry.lock
            ? confirmButton('Unlock', 'Tap again to unlock', async () => {
                entry.lock = null;
                await saveLibrary();
                if (!closed && previewState?.target === entry) {
                    showEntry(entry, current);
                    renderLibrary();
                }
            })
            : el('div', 'menu_button', 'Lock');
        lock.title = entry.lock ? 'Let Redo describe this picture from scratch again' : 'Keep this description: later redos only bring it up to date instead of starting over';
        if (!entry.lock) {
            lock.classList.toggle('disabled', !entry.description);
            lock.addEventListener('click', async () => {
                if (!entry.description) {
                    return;
                }
                entry.lock = { text: entry.description, at: Date.now() };
                await saveLibrary();
                if (!closed && previewState?.target === entry) {
                    showEntry(entry, current);
                    renderLibrary();
                }
            });
        }
        const removeLabel = sequence ? 'Delete sequence' : multi ? 'Delete set' : 'Delete';
        const armedLabel = sequence ? 'Tap again to delete the sequence' : multi ? `Tap again to delete ${entry.variants.length} pictures` : 'Tap again to delete';
        const remove = confirmButton(removeLabel, armedLabel, async button => {
            button.textContent = 'Deleting…';
            await deleteEntry(entry);
            closePreview();
            renderLibrary();
        });
        remove.title = sequence ? 'Delete the sequence; pictures also saved on their own are kept' : 'Delete from the library, the lorebook and the disk';
        bar.append(redo, lock);
        if (!multi) {
            const huntLabel = 'Find tags';
            const hunt = el('div', 'menu_button', huntLabel);
            hunt.title = 'Look for this picture on your other sites, take its tags, then describe and file it again';
            hunt.addEventListener('click', async () => {
                if (hunt.textContent !== huntLabel) {
                    return;
                }
                hunt.textContent = 'Looking…';
                try {
                    const match = await huntTags(entry);
                    if (!match) {
                        hunt.textContent = huntLabel;
                        toastr.info('This picture was not found on your other sites.', 'Image Search');
                        return;
                    }
                    hunt.textContent = entry.lock ? 'Updating…' : 'Describing…';
                    await redoEntry(entry);
                    toastr.success(`${borrowedLine(entry)}. Described and filed again.`, 'Image Search');
                    if (!closed && previewState?.target === entry) {
                        showEntry(entry, current);
                    }
                } catch (error) {
                    hunt.textContent = huntLabel;
                    toastr.warning(`Could not finish: ${error?.message || error}`, 'Image Search');
                }
            });
            bar.append(hunt);
        }
        bar.append(remove);
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

    function renderLibFilters() {
        ui.libFilters.innerHTML = '';
        const counts = new Map();
        library.entries.forEach(entry => entryFacets(entry).forEach(key => counts.set(key, (counts.get(key) || 0) + 1)));
        [...libFilter].filter(key => !counts.has(key)).forEach(key => libFilter.delete(key));
        const more = el('details', 'stis-lib-more');
        more.open = libMoreOpen;
        more.addEventListener('toggle', () => {
            libMoreOpen = more.open;
        });
        more.appendChild(el('summary', '', 'More filters'));
        const groups = [['file', 'Type', ui.libFilters], ['pose', 'Pose', ui.libFilters], ['mood', 'Mood', ui.libFilters], ...categories().map(category => [category.id, category.label, more])];
        for (const [group, label, parent] of groups) {
            const keys = [...counts.keys()].filter(key => key.startsWith(`${group}:`)).sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
            if (!keys.length) {
                continue;
            }
            const row = el('div', 'stis-lib-filter-row');
            row.appendChild(el('small', 'stis-lib-filter-label', label));
            for (const key of keys) {
                const chip = el('span', 'stis-fchip', `${key.slice(group.length + 1)} ${counts.get(key)}`);
                chip.classList.toggle('stis-fchip-on', libFilter.has(key));
                chip.addEventListener('click', () => {
                    if (libFilter.has(key)) {
                        libFilter.delete(key);
                    } else {
                        libFilter.add(key);
                    }
                    renderLibrary();
                });
                row.appendChild(chip);
            }
            parent.appendChild(row);
        }
        if (more.childElementCount > 1) {
            ui.libFilters.appendChild(more);
        }
        if (counts.has('card:none')) {
            const row = el('div', 'stis-lib-filter-row');
            const chip = el('span', 'stis-fchip', `no filing card ${counts.get('card:none')}`);
            chip.classList.toggle('stis-fchip-on', libFilter.has('card:none'));
            chip.addEventListener('click', () => {
                libFilter[libFilter.has('card:none') ? 'delete' : 'add']('card:none');
                renderLibrary();
            });
            row.appendChild(chip);
            ui.libFilters.appendChild(row);
        }
        ui.libFilters.hidden = !ui.libFilters.childElementCount;
    }

    async function renderLibrary() {
        await loadLibrary();
        if (closed) {
            return;
        }
        updateLibraryTab();
        renderLibFilters();
        const scroll = ui.libGrid.scrollTop;
        ui.libGrid.innerHTML = '';
        const query = [...wordsOf(ui.libSearch.value)];
        let ranked = rankEntries(library.entries, { text: recentText(2), tags, character: selectedLookName() || ctx().name2 || '' });
        if (query.length) {
            ranked = ranked.filter(({ entry }) => {
                const hay = `${entry.tags.join(' ')} ${entry.description} ${entry.variants.map(variant => variant.diff).join(' ')} ${entry.characters.join(' ')} ${entry.card ? cardToText(entry.card) : ''}`.toLowerCase().replace(/_/g, ' ');
                return query.every(word => hay.includes(word));
            });
        }
        if (libFilter.size) {
            ranked = ranked.filter(({ entry }) => {
                const facets = entryFacets(entry);
                return [...libFilter].every(key => facets.includes(key));
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
            if (entry.lock) {
                const locked = el('span', 'stis-lock-badge');
                locked.appendChild(el('i', 'fa-solid fa-lock'));
                locked.title = 'Description locked';
                cell.appendChild(locked);
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
        ui.blocked.hidden = lib || !blockedHosts().length;
        if (lib) {
            closeCheck();
        }
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
        touchX = event.target?.closest?.('.stis-variants, .stis-entry-info, .stis-tagbox, .stis-clip, .stis-card, video') ? null : touch.clientX;
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
    const lastPart = () => {
        const last = ui.input.value.split(',').pop().trim();
        return { minus: last.startsWith('-'), prefix: normalizeTag(last.replace(/^-+/, '')) };
    };
    const chooseCompletion = name => {
        const parts = ui.input.value.split(',');
        parts[parts.length - 1] = `${lastPart().minus ? '-' : ''}${name}`;
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
        const { prefix } = lastPart();
        if (prefix.length < 2) {
            hideComplete();
            return;
        }
        completeTimer = setTimeout(async () => {
            const favorites = favoriteTags().filter(tag => tag.includes(prefix));
            const list = await completeTag(ui.site.value, prefix).catch(() => []);
            if (closed || lastPart().prefix !== prefix) {
                return;
            }
            const favItems = favorites.map(name => ({ name, count: list.find(item => item.name === name)?.count || knownCount(ui.site.value, name) || 0, fav: true }));
            completeItems = [...favItems, ...list.filter(item => !favorites.includes(item.name))].filter(item => !tags.includes(item.name) && !negatives.includes(item.name)).slice(0, 10);
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
            thumbWatchers.delete(onThumbTrouble);
            document.removeEventListener('visibilitychange', onCheckReturn);
            window.removeEventListener('focus', onCheckReturn);
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

    if (focus?.entryId) {
        setTags(s.lastTags || [], false, s.lastRequired?.length || !s.lastTags?.length ? s.lastRequired : null);
        renderWho();
        setView('library');
        await loadLibrary();
        const entry = library.entries.find(item => item.id === focus.entryId || item.variants.some(variant => variant.id === focus.entryId));
        if (entry && !closed) {
            showEntry(entry, entry.variants.find(variant => variant.id === focus.variantId) || null);
        }
        return;
    }
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
    if (!document.getElementById('st_imagesearch_picsend')) {
        const sendButton = document.getElementById('send_but');
        if (sendButton?.parentElement) {
            const button = el('div', 'fa-solid fa-image interactable');
            button.id = 'st_imagesearch_picsend';
            button.title = 'Send with a picture from the library';
            button.tabIndex = 0;
            button.addEventListener('click', () => sendWithPicture());
            sendButton.parentElement.insertBefore(button, sendButton);
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
    const s = settings();
    const show = s.enabled;
    ['st_imagesearch_button', 'st_imagesearch_wand'].forEach(id => {
        const node = document.getElementById(id);
        if (node) {
            node.style.display = show ? '' : 'none';
        }
    });
    const send = document.getElementById('st_imagesearch_picsend');
    if (send) {
        send.style.display = show && s.sendButton && s.keepLibrary ? '' : 'none';
    }
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
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'picsend',
        callback: () => {
            sendWithPicture();
            return '';
        },
        helpString: 'Sends the message in the chat box; the reply comes with the best fitting picture from the Image Search library.',
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
                <div class="stis-settings-top">
                    <input type="search" id="st_imagesearch_find" class="text_pole" placeholder="Find a setting">
                    <div id="st_imagesearch_open" class="menu_button">Open picker</div>
                </div>
                <small id="st_imagesearch_find_none" class="stis-help" hidden>No setting matches.</small>
                <div class="stis-sections">
                <details class="stis-section" data-section="setup">
                    <summary><span class="stis-section-title">Setup</span><small class="stis-section-sum" data-sum="setup"></small></summary>
                    <div class="stis-section-body">
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_enabled"> <span>Enabled</span></label></div>
                        <div class="stis-set">
                            <div class="stis-label">Image boards</div>
                            <textarea id="st_imagesearch_sites" class="text_pole"></textarea>
                            <small class="stis-help">One per line. Gelbooru, Danbooru, e621, Moebooru, Philomena and Shimmie sites (such as rule34.paheal.net). A login key goes after the domain: <code>gelbooru.com api_key=XXX&amp;user_id=123</code></small>
                            <div class="st-imagesearch-row"><span id="st_imagesearch_engines"></span><div id="st_imagesearch_redetect" class="menu_button">Re-detect sites</div></div>
                        </div>
                        <div class="stis-set">
                            <div class="st-imagesearch-row"><span>Danbooru account</span><input type="text" id="st_imagesearch_danbooru_account" class="text_pole" placeholder="name or user ID"></div>
                            <small class="stis-help">Danbooru asks programs to say whose they are, and puts programs that pretend to be a browser through a check. With your account, SillyTavern's server tells Danbooru it is SillyImageSearch for your account number, as Danbooru asks. Your name is enough; no API key is needed. Works in Firefox; Chrome does not let pages say this.</small>
                            <small id="st_imagesearch_danbooru_status" class="stis-help"></small>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Tag model</div>
                            <select id="st_imagesearch_profile" class="text_pole"></select>
                            <small id="st_imagesearch_profile_note" class="stis-help"></small>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Vision model</div>
                            <select id="st_imagesearch_vision_profile" class="text_pole"></select>
                            <small class="stis-help">Describes saved pictures. Empty = the tag model.</small>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Ratings</div>
                            <div class="st-imagesearch-row stis-wrap">
                                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_general"> <span>General</span></label>
                                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_sensitive"> <span>Sensitive</span></label>
                                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_questionable"> <span>Questionable</span></label>
                                <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_r_explicit"> <span>Explicit</span></label>
                            </div>
                        </div>
                    </div>
                </details>
                <details class="stis-section" data-section="picker">
                    <summary><span class="stis-section-title">Picker</span><small class="stis-section-sum" data-sum="picker"></small></summary>
                    <div class="stis-section-body">
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_prefetch"> <span>Prepare tags after each reply</span></label><small class="stis-help">Tags and pictures are ready when you open the picker.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Required tags by default</span><input type="number" min="0" max="6" id="st_imagesearch_required" class="text_pole"></div><small class="stis-help">The other tags only sort the results.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Most suggested tags</span><input type="number" min="1" max="20" id="st_imagesearch_max" class="text_pole"></div></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Fewest posts for a tag</span><input type="number" min="0" max="100000" id="st_imagesearch_min_posts" class="text_pole"></div><small class="stis-help">Suggested tags with fewer posts on the site are dropped.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Messages read for tags</span><input type="number" min="1" max="10" id="st_imagesearch_ctx_count" class="text_pole"></div></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Characters per message</span><input type="number" min="100" max="4000" id="st_imagesearch_ctx_chars" class="text_pole"></div></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_cards"> <span>Use the cards' appearance</span></label><small class="stis-help">Give the tag model what character cards and your persona say about looks.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_evidence"> <span>Only tags quoted from the story</span></label><small class="stis-help">Drop suggested tags the AI cannot quote from the chat.</small></div>
                        <div class="stis-set">
                            <div class="stis-label">Favorite tags</div>
                            <textarea id="st_imagesearch_favorites" class="text_pole"></textarea>
                            <small class="stis-help">Comma-separated. Shown as a ★ row in the picker; tap one there to add it.</small>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Never suggest</div>
                            <textarea id="st_imagesearch_blacklist" class="text_pole"></textarea>
                            <small class="stis-help">One per line, or tap <i class="fa-solid fa-ban"></i> on a tag in the picker.</small>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Leave out pictures with</div>
                            <textarea id="st_imagesearch_exclude" class="text_pole"></textarea>
                            <small class="stis-help">Comma-separated tags. Sent to the site as -tag where it allows it, checked here otherwise.</small>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Character looks</div>
                            <textarea id="st_imagesearch_looks" class="text_pole"></textarea>
                            <small class="stis-help">One per line, e.g. <code>Kaelen: !1boy, !muscular_male, bald, beard</code>. <code>!</code> marks tags a picture must have; the others only sort. "Save as character look" in the picker adds one.</small>
                        </div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_videos"> <span>Include videos</span></label><small class="stis-help">Made into GIFs when you use or save them.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Video GIF length (seconds)</span><input type="number" min="1" max="30" id="st_imagesearch_gif_seconds" class="text_pole"></div></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Video GIF width (px)</span><input type="number" min="120" max="1280" id="st_imagesearch_gif_width" class="text_pole"></div></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Video GIF frames per second</span><input type="number" min="2" max="30" id="st_imagesearch_gif_fps" class="text_pole"></div></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_debug"> <span>Debug info in the picker</span></label><small class="stis-help">Site search link, filter counts and the tag model's reply.</small></div>
                    </div>
                </details>
                <details class="stis-section" data-section="library">
                    <summary><span class="stis-section-title">Saving and library</span><small class="stis-section-sum" data-sum="library"></small></summary>
                    <div class="stis-section-body">
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_savelocal"> <span>Save picked pictures</span></label><small class="stis-help">Into SillyTavern. Needs the CORS proxy or the image fetcher.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_keep"> <span>Keep them in the library</span></label></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_attach"> <span>Attach saved pictures to messages</span></label><small class="stis-help">So vision models can see them.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_hunt"> <span>Find tags for tag-poor pictures</span></label><small class="stis-help">When a saved picture has fewer than ${FEW_TAGS} tags, look for it on your other sites and take their tags before describing it.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_hunt_iqdb"> <span>Also ask IQDB</span></label><small class="stis-help">A free lookalike search, when the picture is not found on your sites.</small></div>
                        <div class="stis-set st-imagesearch-library">
                            <div id="st_imagesearch_lib_count" class="stis-label">Library</div>
                            <div class="st-imagesearch-row stis-wrap">
                                <div id="st_imagesearch_redo_all" class="menu_button" title="Describe every saved picture again with the vision model">Redo all descriptions</div>
                                <div id="st_imagesearch_redo_old" class="menu_button" title="Describe again only the pictures described with an older description prompt">Redo out-of-date descriptions</div>
                                <div id="st_imagesearch_regif" class="menu_button" title="Download again the animated GIFs that were saved as still pictures">Re-download GIFs saved as stills</div>
                                <div id="st_imagesearch_hunt_all" class="menu_button" title="Look for pictures with few tags on your other sites, take their tags, then describe and file them again">Find tags for pictures with few tags</div>
                                <div id="st_imagesearch_redo_stop" class="menu_button" title="Stop after the pictures being worked on now" hidden>Stop</div>
                            </div>
                            <div id="st_imagesearch_redo_progress" class="stis-progress-track" hidden><div class="stis-progress-fill"></div></div>
                            <small id="st_imagesearch_lib_status"></small>
                        </div>
                    </div>
                </details>
                <details class="stis-section" data-section="describe">
                    <summary><span class="stis-section-title">Descriptions</span><small class="stis-section-sum" data-sum="describe"></small></summary>
                    <div class="stis-section-body">
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_describe"> <span>Describe saved pictures</span></label><small class="stis-help">A vision model looks at the picture and its tags. The description goes to the AI with the picture, hidden from the chat.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Description length (tokens)</span><input type="number" min="32" max="4000" id="st_imagesearch_vision_tokens" class="text_pole"></div></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Wait for it when sending (s)</span><input type="number" min="0" max="120" id="st_imagesearch_describe_wait" class="text_pole"></div><small class="stis-help">After this, the message goes without it and the description is added when ready.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row stis-range-row"><span>GIF frames sent</span><input type="range" min="1" max="16" step="1" id="st_imagesearch_gif_frames"><b id="st_imagesearch_gif_frames_value" class="stis-range-value"></b></div><small class="stis-help">Spread from the start to the end of the GIF. More frames show more of the motion, and cost more.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>GIF frame size</span><select id="st_imagesearch_gif_size" class="text_pole"><option value="384">384 px (cheapest)</option><option value="512">512 px</option><option value="768">768 px (default)</option><option value="1024">1024 px</option><option value="1536">1536 px</option><option value="2048">2048 px (most detail)</option></select></div></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_gif_sheet"> <span>GIF frames as one sheet</span></label><small class="stis-help">One numbered picture instead of several: cheaper, less detail per frame.</small></div>
                        <div class="stis-set">
                            <div class="stis-label">Description prompt</div>
                            <textarea id="st_imagesearch_vision_prompt" class="text_pole"></textarea>
                            <small class="stis-help">{{tags}} is filled in.</small>
                            <div id="st_imagesearch_vision_reset" class="menu_button">Reset description prompt</div>
                        </div>
                    </div>
                </details>
                <details class="stis-section" data-section="send">
                    <summary><span class="stis-section-title">Picture send</span><small class="stis-section-sum" data-sum="send"></small></summary>
                    <div class="stis-section-body">
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_sendbutton"> <span>Picture button next to Send</span></label></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_confirmpic"> <span>Show the picture before sending</span></label></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_pickwindow"> <span>Ask for the main focus first</span></label><small class="stis-help">Who the picture is about, and who else may be in it.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Pictures the AI compares</span><input type="number" min="5" max="60" id="st_imagesearch_pick_shortlist" class="text_pole"></div><small class="stis-help">Fewer is faster; a good picture ranked lower is not seen by the AI.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Search by meaning</span><select id="st_imagesearch_meaning" class="text_pole"><option value="nanogpt">NanoGPT (uses your NanoGPT key)</option><option value="transformers">Local, on the SillyTavern server (free, slow on phones, downloads a model the first time)</option><option value="openai">OpenAI (needs an OpenAI key in SillyTavern)</option><option value="off">Off (keywords only)</option></select></div></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Embedding model</span><input type="text" id="st_imagesearch_meaning_model" class="text_pole" placeholder="text-embedding-3-small"></div><small class="stis-help">Empty = the default.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Kept before meaning ranking</span><input type="number" min="5" max="500" id="st_imagesearch_first_pass" class="text_pole"></div><small class="stis-help">The best pictures by looks and keywords that go on to be ranked by meaning.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_aishow"> <span>AI may show pictures</span></label><small class="stis-help">Saved pictures are offered through the lorebook "${LOREBOOK}": one entry per picture, triggered by its keywords, at most one per reply. Keep that lorebook on; your keyword edits are kept.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Pictures always listed</span><input type="number" min="0" max="200" id="st_imagesearch_catalog_size" class="text_pole"></div><small class="stis-help">The ones that fit the chat best. 0 = only when keywords match.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Offer depth in the prompt</span><input type="number" min="0" max="50" id="st_imagesearch_aishow_depth" class="text_pole"></div></div>
                    </div>
                </details>
                <details class="stis-section" data-section="filing">
                    <summary><span class="stis-section-title">Filing and looks</span><small class="stis-section-sum" data-sum="filing"></small></summary>
                    <div class="stis-section-body">
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_filing"> <span>Make filing cards</span></label><small class="stis-help">Who, pose, mood, place and story moments for each picture, so the AI finds the right one.</small></div>
                        <div class="stis-set">
                            <div class="st-imagesearch-row stis-wrap">
                                <div id="st_imagesearch_cards_run" class="menu_button" title="Make the filing cards that are missing or out of date now">Make missing cards</div>
                                <div id="st_imagesearch_cards_redo" class="menu_button" title="Make every filing card again, except the ones you edited">Redo all cards</div>
                                <div id="st_imagesearch_meaning_rebuild" class="menu_button" title="Throw away the search index and build it again">Rebuild search index</div>
                                <div id="st_imagesearch_cards_stop" class="menu_button" title="Stop making filing cards after the request that is running" hidden>Stop</div>
                            </div>
                            <div id="st_imagesearch_card_progress" class="stis-progress-track" hidden><div class="stis-progress-fill"></div></div>
                            <small id="st_imagesearch_card_status"></small>
                        </div>
                        <div class="stis-set">
                            <div class="st-imagesearch-row"><div id="st_imagesearch_sheets_show" class="menu_button" title="Show how the characters of this chat are known for matching looks">Characters' looks</div></div>
                            <div id="st_imagesearch_sheets"></div>
                        </div>
                        <details id="st_imagesearch_cats_box" class="stis-set">
                            <summary>Look categories</summary>
                            <small class="stis-help">Each category is a field on the filing cards and look sheets, with the points it is worth. Changing points needs nothing; changing tags or questions needs "Update cards".</small>
                            <div id="st_imagesearch_cats"></div>
                            <div class="st-imagesearch-row">
                                <div id="st_imagesearch_cat_add" class="menu_button">+ Add category</div>
                                <div id="st_imagesearch_cat_update" class="menu_button" title="Ask the tag model only for the changed categories">Update cards</div>
                            </div>
                            <small id="st_imagesearch_cat_status"></small>
                            <div class="st-imagesearch-row"><span>Points when nobody looks like the main focus</span><input type="number" id="st_imagesearch_rule_nomatch" class="text_pole"></div>
                            <div class="st-imagesearch-row"><span>Most another person can add</span><input type="number" id="st_imagesearch_rule_extra" class="text_pole"></div>
                            <details>
                                <summary>Export, import, reset</summary>
                                <textarea id="st_imagesearch_cat_json" class="text_pole" placeholder="Export fills this box; paste categories here and Import"></textarea>
                                <div class="st-imagesearch-row">
                                    <div id="st_imagesearch_cat_export" class="menu_button">Export</div>
                                    <div id="st_imagesearch_cat_import" class="menu_button">Import</div>
                                    <div id="st_imagesearch_cat_reset" class="menu_button">Reset to the built-in categories</div>
                                </div>
                            </details>
                        </details>
                        <details class="stis-set">
                            <summary>Pose and mood lists</summary>
                            <div class="stis-label">Poses the filing cards use</div>
                            <textarea id="st_imagesearch_poses" class="text_pole"></textarea>
                            <div class="stis-label">Moods the filing cards use</div>
                            <textarea id="st_imagesearch_moods" class="text_pole"></textarea>
                            <div id="st_imagesearch_lists_reset" class="menu_button">Reset both lists</div>
                        </details>
                    </div>
                </details>
                <details class="stis-section" data-section="advanced">
                    <summary><span class="stis-section-title">Advanced</span><small class="stis-section-sum" data-sum="advanced"></small></summary>
                    <div class="stis-section-body">
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Tag reply length (tokens)</span><input type="number" min="16" max="4000" id="st_imagesearch_tokens" class="text_pole"></div></div>
                        <div class="stis-set">
                            <div class="stis-label">Tag prompt</div>
                            <textarea id="st_imagesearch_tag_prompt" class="text_pole"></textarea>
                            <small class="stis-help">{{max}} and {{context}} are filled in.</small>
                            <div id="st_imagesearch_prompt_reset" class="menu_button">Reset prompt</div>
                        </div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_proxy"> <span>Always use SillyTavern's proxy</span></label><small class="stis-help">For sites the browser cannot reach directly.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Image fetcher URL</span><input type="text" id="st_imagesearch_fetcher_url" class="text_pole" placeholder="https://imgfetch.yourname.workers.dev"></div><small class="stis-help">Your Cloudflare image fetcher, if you made one.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Image fetcher key</span><input type="password" id="st_imagesearch_fetcher_key" class="text_pole"></div></div>
                        <div class="stis-set">
                            <div class="stis-label">Tag cleanup list</div>
                            <textarea id="st_imagesearch_cleanup_view" class="text_pole" readonly></textarea>
                            <small class="stis-help">Downloaded from the extension's repository.</small>
                        </div>
                    </div>
                </details>
                <details class="stis-section stis-danger" data-section="danger">
                    <summary><span class="stis-section-title">Delete everything</span><small class="stis-section-sum" data-sum="danger"></small></summary>
                    <div class="stis-section-body">
                        <div class="stis-set">
                            <div id="st_imagesearch_delete_all" class="menu_button" title="Remove every saved picture from the library, the lorebook and the disk">Delete everything</div>
                            <small class="stis-help">Removes every saved picture from the library, the lorebook and the disk. Asks to tap again.</small>
                        </div>
                    </div>
                </details>
                </div>
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
    const danbooruStatus = document.getElementById('st_imagesearch_danbooru_status');
    const showIdentity = () => {
        const account = danbooruAccount();
        danbooruStatus.textContent = !account ? '' : danbooruIdentity.pending ? `Looking up ${account}…` : danbooruIdentity.id && danbooruIdentity.account === account ? `Danbooru sees: ${danbooruAgent()}` : danbooruIdentity.error;
    };
    identityWatchers.add(showIdentity);
    let identityTimer = null;
    bind('st_imagesearch_danbooru_account', 'danbooruAccount', 'value', () => {
        clearTimeout(identityTimer);
        identityTimer = setTimeout(() => resolveDanbooruId({ again: true }), 700);
    });
    showIdentity();
    bind('st_imagesearch_sites', 'sites', 'value', () => {
        resolveDanbooruId().catch(() => {});
        s.engines = {};
        s.termLimits = {};
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
    bind('st_imagesearch_sendbutton', 'sendButton', 'checked', updateButtons);
    bind('st_imagesearch_confirmpic', 'confirmPicture', 'checked');
    bind('st_imagesearch_pickwindow', 'pickWindow', 'checked');
    bind('st_imagesearch_vision_tokens', 'visionMaxTokens', 'number');
    bind('st_imagesearch_describe_wait', 'describeWaitSec', 'number');
    const framesValue = document.getElementById('st_imagesearch_gif_frames_value');
    const showFrames = () => {
        const count = Math.min(16, Math.max(1, Math.round(Number(s.gifFrames) || 3)));
        framesValue.textContent = `${count} frame${count === 1 ? '' : 's'}`;
    };
    bind('st_imagesearch_gif_frames', 'gifFrames', 'number', showFrames);
    document.getElementById('st_imagesearch_gif_frames').value = String(Math.min(16, Math.max(1, Math.round(Number(s.gifFrames) || 3))));
    showFrames();
    bind('st_imagesearch_gif_size', 'gifFrameSize', 'number');
    if (!document.getElementById('st_imagesearch_gif_size').value) {
        document.getElementById('st_imagesearch_gif_size').value = '768';
    }
    bind('st_imagesearch_gif_sheet', 'gifSheet', 'checked');
    bind('st_imagesearch_hunt', 'huntTags', 'checked');
    bind('st_imagesearch_hunt_iqdb', 'huntIqdb', 'checked');
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
    bind('st_imagesearch_videos', 'includeVideos', 'checked');
    const meaningChanged = () => {
        meaning.synced = false;
        meaning.error = '';
        meaning.warned = false;
        paintCardStatus();
        scheduleFiling(800);
    };
    bind('st_imagesearch_filing', 'cards', 'checked', () => scheduleFiling(800));
    bind('st_imagesearch_meaning', 'meaningSource', 'value', meaningChanged);
    bind('st_imagesearch_meaning_model', 'meaningModel', 'value', meaningChanged);
    bind('st_imagesearch_pick_shortlist', 'pickShortlist', 'number');
    bind('st_imagesearch_first_pass', 'firstPass', 'number');
    bind('st_imagesearch_poses', 'poseList');
    bind('st_imagesearch_moods', 'moodList');
    document.getElementById('st_imagesearch_sheets_show').addEventListener('click', async () => {
        const box = document.getElementById('st_imagesearch_sheets');
        box.innerHTML = '';
        box.appendChild(el('small', '', 'Reading…'));
        const cast = await lookSheets();
        box.innerHTML = '';
        if (!cast.length) {
            box.appendChild(el('small', '', 'No character in this chat has looks written (character card or saved look).'));
        }
        cast.forEach(member => box.appendChild(sheetBox(member)));
    });
    const catBox = document.getElementById('st_imagesearch_cats');
    const catStatus = document.getElementById('st_imagesearch_cat_status');
    let catTimer = null;
    const catChanged = () => {
        clearTimeout(catTimer);
        catTimer = setTimeout(() => {
            save();
            catStatus.textContent = categoryStatus();
        }, 300);
    };
    const drawCats = (openLast = false) => {
        catBox.innerHTML = '';
        const stored = storedCategories();
        stored.forEach(raw => catBox.appendChild(categoryEditor(raw, catChanged, () => {
            const list = storedCategories();
            list.splice(list.indexOf(raw), 1);
            save();
            drawCats();
            catStatus.textContent = categoryStatus();
        })));
        if (openLast && catBox.lastElementChild) {
            catBox.lastElementChild.open = true;
        }
    };
    document.getElementById('st_imagesearch_cats_box').addEventListener('toggle', async event => {
        if (event.target.open) {
            await loadLibrary();
            drawCats();
            catStatus.textContent = categoryStatus();
        }
    });
    document.getElementById('st_imagesearch_cat_add').addEventListener('click', () => {
        const list = storedCategories();
        let n = 1;
        while (list.some(raw => slug(raw.id) === `category-${n}`)) {
            n++;
        }
        list.push({ id: `category-${n}`, label: `category ${n}`, question: 'what to look for', scope: 'person', against: 'character', type: 'match', must: false, judge: true, enabled: true, phrase: '{value}', from: '', tags: '', close: '', points: { match: 3, close: 0, different: -3, missing: 0 } });
        save();
        drawCats(true);
        catStatus.textContent = categoryStatus();
    });
    document.getElementById('st_imagesearch_cat_update').addEventListener('click', async () => {
        if (!s.tagProfile) {
            toastr.warning('Choose a tag profile first: it fills the cards.', 'Image Search');
            return;
        }
        await loadLibrary();
        if (!library.entries.some(entry => needsCard(entry) || staleCategories(entry).length)) {
            toastr.info('Every card is up to date with the categories.', 'Image Search');
            return;
        }
        await fileCards({ loud: true });
        catStatus.textContent = categoryStatus();
    });
    const ruleNoMatch = document.getElementById('st_imagesearch_rule_nomatch');
    const ruleExtra = document.getElementById('st_imagesearch_rule_extra');
    ruleNoMatch.value = lookRules().noMatch;
    ruleExtra.value = lookRules().extraCap;
    const rulesChanged = () => {
        s.lookRules = { noMatch: Number(ruleNoMatch.value) || 0, extraCap: Number(ruleExtra.value) || 0 };
        save();
    };
    ruleNoMatch.addEventListener('input', rulesChanged);
    ruleExtra.addEventListener('input', rulesChanged);
    const catJson = document.getElementById('st_imagesearch_cat_json');
    document.getElementById('st_imagesearch_cat_export').addEventListener('click', () => {
        catJson.value = JSON.stringify(storedCategories(), null, 2);
    });
    document.getElementById('st_imagesearch_cat_import').addEventListener('click', () => {
        try {
            const list = JSON.parse(catJson.value);
            if (!Array.isArray(list) || !list.length || list.some(item => !item || typeof item !== 'object')) {
                throw new Error('expected a list of categories');
            }
            s.lookCategories = list;
            save();
            drawCats();
            catStatus.textContent = categoryStatus();
            toastr.success(`Imported ${list.length} categories.`, 'Image Search');
        } catch (error) {
            toastr.warning(`Could not import: ${error.message}`, 'Image Search');
        }
    });
    const catReset = document.getElementById('st_imagesearch_cat_reset');
    confirmClicks(catReset, 'Reset to the built-in categories', 'Tap again: your own categories are removed', () => {
        s.lookCategories = defaultCategories();
        save();
        drawCats();
        catStatus.textContent = categoryStatus();
    });
    document.getElementById('st_imagesearch_lists_reset').addEventListener('click', () => {
        s.poseList = DEFAULT_POSES;
        s.moodList = DEFAULT_MOODS;
        document.getElementById('st_imagesearch_poses').value = DEFAULT_POSES;
        document.getElementById('st_imagesearch_moods').value = DEFAULT_MOODS;
        save();
    });
    document.getElementById('st_imagesearch_cards_run').addEventListener('click', async () => {
        await loadLibrary();
        if (!s.tagProfile) {
            toastr.warning('Choose a tag profile first: it makes the filing cards.', 'Image Search');
            return;
        }
        if (!library.entries.some(needsCard)) {
            toastr.info('Every described picture already has a filing card.', 'Image Search');
            await syncMeaning();
            return;
        }
        await fileCards({ loud: true });
    });
    const cardsRedo = document.getElementById('st_imagesearch_cards_redo');
    confirmClicks(cardsRedo, 'Redo all cards', () => `Tap again to make ${library.entries.filter(entry => entry.description && !entry.card?.edited).length} card(s) again`, async () => {
        cardsRedo.textContent = 'Making…';
        await fileCards({ only: library.entries.filter(entry => entry.description && !entry.card?.edited), loud: true });
        cardsRedo.textContent = 'Redo all cards';
    }, async () => {
        await loadLibrary();
        if (!s.tagProfile) {
            toastr.warning('Choose a tag profile first: it makes the filing cards.', 'Image Search');
            return false;
        }
        return !filing.running && library.entries.some(entry => entry.description);
    });
    document.getElementById('st_imagesearch_cards_stop').addEventListener('click', () => stopFiling());
    document.getElementById('st_imagesearch_meaning_rebuild').addEventListener('click', async () => {
        if (!meaningSource()) {
            toastr.info('Search by meaning is off.', 'Image Search');
            return;
        }
        await loadLibrary();
        try {
            await fetch('/api/vector/purge', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ collectionId: VECTOR_COLLECTION }) });
        } catch (error) {
            console.warn('[Image Search] could not clear the search index', error);
        }
        meaning.synced = false;
        meaning.error = '';
        meaning.warned = false;
        const ok = await syncMeaning();
        toastr[ok ? 'success' : 'warning'](ok ? `Search index rebuilt: ${meaning.count} picture(s).` : `The search index could not be built: ${meaning.error}`, 'Image Search');
    });
    bind('st_imagesearch_gif_seconds', 'gifSeconds', 'number');
    bind('st_imagesearch_gif_width', 'gifWidth', 'number');
    bind('st_imagesearch_gif_fps', 'gifFps', 'number');
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
        s.termLimits = {};
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
        paintCardStatus();
        const sets = library.entries.filter(entry => entry.kind === 'set' && isMulti(entry)).length;
        const sequences = library.entries.filter(entry => entry.kind === 'sequence' && isMulti(entry)).length;
        const groups = [sets ? `${sets} set${sets === 1 ? '' : 's'}` : '', sequences ? `${sequences} sequence${sequences === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ');
        libCount.textContent = library.broken ? 'The picture library could not be read.' : `Library: ${pictureCount()} picture(s)${groups ? ` (${groups})` : ''}`;
        if (!redoState.running) {
            redoOld.textContent = oldLabel();
            regif.textContent = gifLabel();
            huntButton.textContent = huntLabel();
        }
    };
    document.querySelector('#st_imagesearch_settings .inline-drawer-toggle')?.addEventListener('click', () => showLibrary());
    const redoButton = document.getElementById('st_imagesearch_redo_all');
    const redoStop = document.getElementById('st_imagesearch_redo_stop');
    const redoBar = document.getElementById('st_imagesearch_redo_progress');
    redoStop.addEventListener('click', () => {
        if (redoState.running) {
            redoState.cancel = true;
            redoStop.textContent = 'Stopping…';
        }
    });
    const redoLabel = 'Redo all descriptions';
    const redoOld = document.getElementById('st_imagesearch_redo_old');
    const oldLabel = () => `Redo out-of-date descriptions (${library.entries.filter(describedOld).length})`;
    const runRedo = async (button, label, only) => {
        button.textContent = 'Describing…';
        redoStop.hidden = false;
        redoStop.textContent = 'Stop';
        redoBar.hidden = false;
        const progress = () => {
            libStatus.textContent = `Describing ${redoState.done} / ${redoState.total}${redoState.failed ? ` (${redoState.failed} failed)` : ''}…`;
            redoBar.querySelector('.stis-progress-fill').style.width = `${Math.round(redoState.total ? redoState.done / redoState.total * 100 : 0)}%`;
        };
        await redoAll(progress, only);
        const described = redoState.done - redoState.failed;
        libStatus.textContent = `${redoState.cancel ? 'Stopped' : 'Done'}: ${described} described${redoState.failed ? `, ${redoState.failed} failed (see the browser console)` : ''}.`;
        button.textContent = typeof label === 'function' ? label() : label;
        redoStop.hidden = true;
        redoBar.hidden = true;
        showLibrary();
    };
    const canRedo = async (list = null) => {
        if (redoState.running) {
            return false;
        }
        await loadLibrary();
        if (library.broken || !library.entries.length) {
            libStatus.textContent = library.broken ? 'The picture library could not be read.' : 'The library is empty.';
            return false;
        }
        if (list && !list().length) {
            libStatus.textContent = 'Every description was made with the current description prompt.';
            return false;
        }
        if (!visionProfileId()) {
            libStatus.textContent = 'Choose a vision profile (or a tag profile) first.';
            return false;
        }
        return true;
    };
    const lockedNote = list => {
        const count = list.filter(entry => entry.lock).length;
        return count ? ` (${count} locked: updated from their locked description)` : '';
    };
    confirmClicks(redoButton, redoLabel, () => `Tap again to describe ${library.entries.length} entr${library.entries.length === 1 ? 'y' : 'ies'} again${lockedNote(library.entries)}`, () => runRedo(redoButton, redoLabel, null), () => canRedo());
    const regif = document.getElementById('st_imagesearch_regif');
    const gifLabel = () => `Re-download GIFs saved as stills (${stillGifs().length})`;
    confirmClicks(regif, 'Re-download GIFs saved as stills', () => `Tap again to download ${stillGifs().length} animated GIF(s) again`, async () => {
        regif.textContent = 'Downloading…';
        redoStop.hidden = false;
        redoStop.textContent = 'Stop';
        redoBar.hidden = false;
        const progress = () => {
            libStatus.textContent = `Downloading ${redoState.done} / ${redoState.total}${redoState.failed ? ` (${redoState.failed} failed)` : ''}…`;
            redoBar.querySelector('.stis-progress-fill').style.width = `${Math.round(redoState.total ? redoState.done / redoState.total * 100 : 0)}%`;
        };
        const count = await redownloadGifs(progress);
        libStatus.textContent = `${redoState.cancel ? 'Stopped' : 'Done'}: ${count} GIF(s) replaced${redoState.videos ? ` (${redoState.videos} made from a video)` : ''}${redoState.skipped ? `, ${redoState.skipped} not animated on the site: ${redoState.stills.slice(0, 3).join(', ')}` : ''}${redoState.failed ? `, ${redoState.failed} failed: ${[...new Set(redoState.errors)].slice(0, 2).join(' | ')}` : ''}.`;
        regif.textContent = gifLabel();
        redoStop.hidden = true;
        redoBar.hidden = true;
        showLibrary();
    }, async () => {
        if (redoState.running) {
            return false;
        }
        await loadLibrary();
        if (!stillGifs().length) {
            libStatus.textContent = 'No GIF in the library was saved as a still picture.';
            return false;
        }
        return true;
    });
    const huntButton = document.getElementById('st_imagesearch_hunt_all');
    const huntLabel = () => `Find tags for pictures with few tags (${library.entries.filter(tagPoor).length})`;
    confirmClicks(huntButton, 'Find tags for pictures with few tags', () => `Tap again to look for ${library.entries.filter(tagPoor).length} picture(s) on your other sites`, async () => {
        huntButton.textContent = 'Looking…';
        redoStop.hidden = false;
        redoStop.textContent = 'Stop';
        redoBar.hidden = false;
        const progress = () => {
            libStatus.textContent = `Looking ${redoState.done} / ${redoState.total}, tags found for ${redoState.found || 0}${redoState.failed ? ` (${redoState.failed} failed)` : ''}…`;
            redoBar.querySelector('.stis-progress-fill').style.width = `${Math.round(redoState.total ? redoState.done / redoState.total * 100 : 0)}%`;
        };
        const found = await huntAll(progress);
        libStatus.textContent = `${redoState.cancel ? 'Stopped' : 'Done'}: tags found for ${found} of ${redoState.done} picture(s)${found ? ', which were described and filed again' : ''}${redoState.failed ? `, ${redoState.failed} failed (see the browser console)` : ''}.`;
        huntButton.textContent = huntLabel();
        redoStop.hidden = true;
        redoBar.hidden = true;
        showLibrary();
    }, async () => {
        if (redoState.running) {
            return false;
        }
        await loadLibrary();
        if (!library.entries.some(tagPoor)) {
            libStatus.textContent = `No picture with fewer than ${FEW_TAGS} tags is waiting for tags.`;
            return false;
        }
        return true;
    });
    const oldList = () => library.entries.filter(describedOld);
    confirmClicks(redoOld, 'Redo out-of-date descriptions', () => `Tap again to describe ${oldList().length} out-of-date entr${oldList().length === 1 ? 'y' : 'ies'}${lockedNote(oldList())}`, () => runRedo(redoOld, oldLabel, oldList()), () => canRedo(oldList));
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
    setupSections();
}

function sectionSummary(section) {
    const s = settings();
    const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
    if (section === 'setup') {
        const name = document.getElementById('st_imagesearch_profile')?.selectedOptions?.[0]?.textContent?.trim();
        return [count(siteEntries().length, 'site'), s.tagProfile ? `tag model: ${name || 'chosen'}` : 'no tag model yet', danbooruIdentity.id ? `Danbooru: user #${danbooruIdentity.id}` : '', s.enabled ? '' : 'turned off'].filter(Boolean).join(' · ');
    }
    if (section === 'picker') {
        return `${Number.isFinite(Number(s.requiredCount)) ? Number(s.requiredCount) : 2} required · up to ${maxSuggested()} suggested`;
    }
    if (section === 'library') {
        return [s.saveLocal ? 'saving on' : 'saving off', library.loaded && !library.broken ? count(library.entries.length, 'entry', 'entries') : ''].filter(Boolean).join(' · ');
    }
    if (section === 'describe') {
        const frames = Math.min(16, Math.max(1, Math.round(Number(s.gifFrames) || 3)));
        return s.describe ? `on · ${count(frames, 'GIF frame')}${s.gifSheet ? ' as one sheet' : ''}` : 'off';
    }
    if (section === 'send') {
        return `button ${s.sendButton ? 'on' : 'off'} · the AI compares ${shortlistSize()}`;
    }
    if (section === 'filing') {
        return `cards ${s.cards ? 'on' : 'off'} · ${count(categories().length, 'look category', 'look categories')}`;
    }
    return '';
}

function setupSections() {
    const s = settings();
    const root = document.getElementById('st_imagesearch_settings');
    if (!root) {
        return;
    }
    const sections = [...root.querySelectorAll('.stis-section')];
    const openNow = () => new Set(Array.isArray(s.openSections) ? s.openSections : ['setup']);
    let finding = false;
    sections.forEach(section => {
        section.open = openNow().has(section.dataset.section);
        section.addEventListener('toggle', () => {
            if (finding) {
                return;
            }
            const now = openNow();
            now[section.open ? 'add' : 'delete'](section.dataset.section);
            s.openSections = [...now];
            save();
        });
    });
    const paint = () => sections.forEach(section => {
        const sum = section.querySelector('.stis-section-sum');
        if (sum) {
            sum.textContent = sectionSummary(section.dataset.section);
        }
    });
    let timer = null;
    root.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(paint, 300);
    });
    root.addEventListener('change', () => {
        clearTimeout(timer);
        timer = setTimeout(paint, 300);
    });
    root.querySelector('.inline-drawer-toggle')?.addEventListener('click', () => loadLibrary().then(paint));
    paint();
    const find = document.getElementById('st_imagesearch_find');
    const none = document.getElementById('st_imagesearch_find_none');
    const setText = set => `${set.textContent} ${[...set.querySelectorAll('[placeholder], [title], option')].map(node => `${node.getAttribute('placeholder') || ''} ${node.getAttribute('title') || ''} ${node.tagName === 'OPTION' ? node.textContent : ''}`).join(' ')}`.toLowerCase();
    find.addEventListener('input', () => {
        const words = find.value.toLowerCase().split(/\s+/).filter(Boolean);
        finding = true;
        let shown = 0;
        sections.forEach(section => {
            const title = section.querySelector('.stis-section-title')?.textContent.toLowerCase() || '';
            let hits = 0;
            section.querySelectorAll('.stis-set').forEach(set => {
                const match = !words.length || words.every(word => setText(set).includes(word) || title.includes(word));
                set.hidden = !match;
                hits += match ? 1 : 0;
            });
            section.hidden = Boolean(words.length) && !hits;
            section.open = words.length ? hits > 0 : openNow().has(section.dataset.section);
            shown += hits;
        });
        none.hidden = !words.length || shown > 0;
        setTimeout(() => {
            finding = false;
        });
    });
}

jQuery(() => {
    const c = ctx();
    applyReferrerPolicy();
    settings();
    buildSettings();
    resolveDanbooruId().catch(() => {});
    c.setExtensionPrompt?.(PROMPT_KEY, '', 1, 0, false, 0);
    scheduleLorebookSync();
    refreshCleanup();
    setInterval(refreshCleanup, CLEANUP_REFRESH_MS);
    registerCommand();
    addButtons();
    c.eventSource.on(c.eventTypes.APP_READY, addButtons);
    c.eventSource.on(c.eventTypes.MESSAGE_RECEIVED, onForcedReply);
    c.eventSource.on(c.eventTypes.MESSAGE_RECEIVED, onAiPictures);
    if (c.eventTypes.GENERATION_STARTED) {
        c.eventSource.on(c.eventTypes.GENERATION_STARTED, onGenerationStarted);
    }
    c.eventSource.on(c.eventTypes.MESSAGE_RECEIVED, onReplyFinished);
    c.eventSource.on(c.eventTypes.MESSAGE_SENT, onMessageSent);
    c.eventSource.on(c.eventTypes.CHAT_CHANGED, onChatChanged);
    if (c.eventTypes.WORLD_INFO_ACTIVATED) {
        c.eventSource.on(c.eventTypes.WORLD_INFO_ACTIVATED, onWorldInfoActivated);
    }
});
