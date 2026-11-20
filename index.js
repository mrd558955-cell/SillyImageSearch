const MODULE = 'st_imagesearch';
const PROMPT_KEY = 'st_imagesearch_instruction';
const VERSION = '2.69.0';
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
const OLD_NAMES_RULE = 'Use names only when the tags give them.';
const NO_NAMES_RULE = 'Never use names for people or characters, even when the tags give them (a character tag is only a hint): say he, she or they, or describe the person (the blond boy in orange). If a text you are given uses names, replace them the same way.';
const ACTORS_RULE = 'Begin the Visual line (keep its "Visual:" label) with how many people or characters there are, counting anyone only partly in view (a hand, an arm, a silhouette, someone in the shadows), like "Visual: Two people (one only partly in view): …". Describe the main person fully; give each other person one short sentence on what can be seen of them and what they do.';
const PICTURE_FIRST = 'The picture comes first: describe what you actually see. Tags, notes and earlier descriptions only support it; where they do not match the picture, follow the picture, and mention something that cannot be seen only as likely off screen or implied, in a few words, without changing what is visibly happening.';
const DEFAULT_GIF_NOTE = 'This picture is a short animation (a GIF). {{frames}}{{#seconds}} It is {{seconds}} s long{{#apart}}, and the moments are spread evenly over that time, about {{apart}} s apart{{/apart}}.{{/seconds}}{{#loop}} Its last moment matches its first almost exactly, so it most likely repeats as a loop.{{/loop}}{{#long}} It is long enough to hold several actions in a row: in Action, say what happens in order (first…, then…, at the end…).{{/long}} Describe it as one moving picture; in Action, say what happens from the start to the end.';
const DEFAULT_DESCRIBE_RULES = `{{tag_info}}\n\n${PICTURE_FIRST} ${ACTORS_RULE}{{#tag_count}} The site's tags say: {{tag_count}}. If they count more people than you first notice, look again for someone only partly in view before you give the count.{{/tag_count}} ${NO_NAMES_RULE}`;
const DEFAULT_BOARD_NOTE = 'A first look at all the items together saw in this one:{{#who}}\nWho is there: {{who}}{{/who}}{{#what}}\nWhat happens: {{what}}{{/what}}{{#just_before}}\nJust before (item {{before_number}}): {{just_before}}{{/just_before}}{{#just_after}}\nJust after (item {{after_number}}): {{just_after}}{{/just_after}}\nUse it to know who is there (count anyone only partly in view, or most likely just out of view) and where this moment sits in the story. Where it does not match the picture, follow the picture.';
const DEFAULT_AGAIN_PROMPT = 'This is the description of this picture so far:\n\n{{description}}\n\nLook at the picture again and rewrite it:\n{{asks}}\nKeep every fact that is right, and never contradict what the picture shows.\n\nRewrite it in the format asked below.\n\n{{prompt}}{{#first_tag}}\n\nAfter the last line of that format, add one more line, exactly like "Checked: {{first_tag}} kept" or "Checked: {{first_tag}} left out, because …"{{#several}}, naming every tag above, separated by semicolons{{/several}}.{{/first_tag}}';
const DEFAULT_LOOP_NOTE = 'This item is a loop: it repeats. Describe the repeating moment as one moment, not as a story.{{#before_loop}} The item before is a loop too.{{/before_loop}}{{#before_not_loop}} The item before is not a loop.{{/before_not_loop}}{{#after_loop}} The item after is a loop too.{{/after_loop}}{{#after_not_loop}} The item after is not a loop.{{/after_not_loop}}';
const DEFAULT_ONE_MOVING = 'Item {{item}} is the only item that is not a loop: if this sequence has a climax, it is most likely there.';
const DEFAULT_FORCE_PROMPT = '[The app will show a picture together with your next reply. Write the reply so the story leads into the moment the picture shows, as the result of or the reaction to the last message, and describe that moment in the story itself. The people in the picture may not look like the characters (hair, eyes, skin, clothes, build): keep the characters as the story has them and let the picture\'s looks go; what matters is what happens. Do not mention a picture, an image or tags.{{#continues}} This picture continues a sequence already shown in this chat ({{continues}}): pick up from that moment, so the story moves on from it to this one.{{/continues}}{{#marker}} The one exception: write [picture] alone on its own line where the picture should appear, right after the lines that describe its moment.{{/marker}}{{#lead}}\nHow the story gets there ({{user}} chose this): {{lead}}{{/lead}}\nThe picture shows:\n{{picture}}]';
const DEFAULT_LEAD_PROMPT = 'A roleplay continues, and {{char}}\'s next reply will come with a picture. Suggest 3 different ways the story can get to the moment the picture shows.\n\nGuidelines:\n- Blend the story and the picture. It does not have to be perfect: some things can be bent on either side (the place, the time, clothes, a small detail of what happens) so they fit together.\n- Everything in the story so far has already happened. Start after the end of the newest message: never retell or redo what it already shows. The picture\'s moment should follow from it, as its result or a reaction to it.\n- Keep the characters as the story has them. If the picture\'s looks (hair, skin, clothes) do not fit them, let those looks go.\n- Never give names to the people in the picture: use the names the story uses, or a plain description.\n- Each way is 1 to 3 sentences: what happens to get there, and what the picture\'s moment means in the story.\n- Make the 3 ways really different from each other.{{#continues}}\n- The picture continues a sequence already shown in this chat: each way starts from the moment shown before.{{/continues}}{{#next}}\n- The picture is one step of a sequence and the next step comes later: leave room for it.{{/next}}\n\nHow the characters look:\n{{looks}}\n\nStory so far:\n{{story}}{{#typed}}\n\n{{user}}\'s newest message, sent with the picture:\n{{typed}}{{/typed}}{{#wish}}\n\nWhat {{user}} wants:\n{{wish}}{{/wish}}\n\nThe picture{{#focus}} (about {{focus}}){{/focus}}:\n{{picture}}{{#continues}}\n\nWhere it is in the sequence:\n{{continues}}{{/continues}}{{#next}}\n\nThe next step of the sequence:\n{{next}}{{/next}}\n\nAnswer with exactly 3 lines and nothing else:\n1. …\n2. …\n3. …';
const DEFAULT_SHOW_RULE = 'This chat app can show real pictures to the user: when a reply contains a picture tag such as [pic:abc123] on its own line, the app removes the tag and displays that picture in the chat. You can do this whenever a picture fits the scene, and always when the user asks you to show or bring in a picture. The people in a picture may not look like the characters (hair, eyes, skin, clothes, build): a picture can be shown when what happens in it fits; keep the characters as the story has them and let the picture\'s looks go.';
const DEFAULT_SPELL_PROMPT = 'On image boards, the same thing is often tagged differently on each site. The tag "{{tag}}"{{#meaning}} ({{meaning}}){{/meaning}} is not used on {{site}}. Which one of these {{site}} tags means the same thing? Pick one only if it really is the same thing, not just something related or a part of it.\n\n{{candidates}}\n\nReply with the one tag exactly as written. If none of them is the same thing, reply with the tag {{site}} most likely uses for it instead, or none if you do not know.';
const DEFAULT_CARD_PROMPT = 'You are filing the pictures of a roleplay picture library, so the right picture can be found quickly later. For each picture below you get its description and tags. Fill one filing card per picture.\n\nPoses (pick one or two, only from this list): {{poses}}\nMoods (pick one or two, only from this list): {{moods}}\n\ncount: how many people the description counts, including anyone only partly in view (an arm from the shadows, someone behind her).\nrating: how strong the picture is, judging everything it shows: nudity and sex, but also violence, blood, gore, cruelty and anything disturbing. \"general\": fine for anyone. \"sensitive\": mild (suggestive clothes or poses, a fight without injuries, a little blood). \"questionable\": strong (partial nudity, sexual suggestion, wounds, real violence). \"explicit\": R-18 (sex, exposed private parts, gore, graphic violence or cruelty). Take the strongest thing in the picture.\n\npeople: everyone the description counts, at most 6, the main person first. Each person has:\n  \"role\": \"main\" for the one person the description spends the most on, \"side\" for the other people, \"background\" for bystanders, crowds and anyone small or blurry far behind\n  \"view\": \"full\", or \"partly\" when only part of them is in view\n  \"seen\": for someone partly in view, a few words for what is seen (\"only a muscular arm\", \"a shadow behind her\"), else \"\"\nFor the main person, fill:\n{{fields}}\nFor side people and people partly in view, fill only these, from the little the description says about them, and leave the rest out:\n{{sidefields}}\n{{#scene}}Each picture also has \"scene\" with these fields:\n{{scene}}\n{{/scene}}\nRules:\n- Take every field only from what the description or the tags say; never guess. Use \"\" for what is not shown.\n- moments: 3 to 5 short story moments this picture could illustrate, written the way a story would say them (\"after being shoved\", \"first meeting\", \"winning a fight\").\n- place and framing: a few words each.\n\nPictures:\n{{pictures}}';
const DEFAULT_CARD_UPDATE_PROMPT = 'You are updating the filing cards of a roleplay picture library. For each picture below you get its description, its tags and the people already on its card. Fill only these fields.\n{{#fields}}For each of those people, in the same order (for side people and people partly in view, only the fields marked side, from what the description says about them):\n{{fields}}\n{{/fields}}{{#scene}}For the picture, under \"scene\":\n{{scene}}\n{{/scene}}Take every field only from what the description or the tags say; never guess. Use \"\" for what is not shown.\n\nPictures:\n{{pictures}}';
const PROMPT_PARTS = { gifNote: DEFAULT_GIF_NOTE, describeRules: DEFAULT_DESCRIBE_RULES, boardNote: DEFAULT_BOARD_NOTE, againPrompt: DEFAULT_AGAIN_PROMPT, loopNote: DEFAULT_LOOP_NOTE, oneMoving: DEFAULT_ONE_MOVING, forcePrompt: DEFAULT_FORCE_PROMPT, leadPrompt: DEFAULT_LEAD_PROMPT, showRule: DEFAULT_SHOW_RULE, spellPrompt: DEFAULT_SPELL_PROMPT, cardPrompt: DEFAULT_CARD_PROMPT, cardUpdatePrompt: DEFAULT_CARD_UPDATE_PROMPT };

function fillTemplate(text, values) {
    let out = String(text);
    for (let pass = 0; pass < 8; pass++) {
        const next = out.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (all, key, inner) => (values[key] ? inner : ''));
        if (next === out) {
            break;
        }
        out = next;
    }
    return out.replace(/\{\{(\w+)\}\}/g, (all, key) => (key in values ? String(values[key] ?? '') : all));
}

function promptPart(key) {
    const own = settings()[key];
    return typeof own === 'string' && own.trim() ? own : PROMPT_PARTS[key];
}
const PREV_STORY_PROMPT = 'These are the items of one {{kind}}, saved for a roleplay, in order. For each item you get its tags and its description, written by someone looking at that item alone.\n\n{{items}}\n\nGive each item a role and a story line.\nRole: a main role, then a finer one. Main roles: setup (how things are before the action, often a loop or an idle moment), build-up (leading to the action), main action (the key moment), aftermath (the result or the reaction to it), transition (moving on to another scene). The finer role is 1 to 3 words of your own, like idle loop, wind-up, climax, impact, reveal, reaction, calm down. With 3 items, the first is often the setup, the second the main action and the third the aftermath, but go by what the descriptions say.\nStory line: 1 to 2 sentences on what this moment means in the story, from what was happening before and what is happening now, like "He was eating his ramen; now he slurps the last noodle, so he has just finished the bowl." Say what it means, not what looks different (not "the noodles are shorter now"). For item 1, say what is going on. Never use names, even when the tags give them: say he, she or they, or describe the person (the blond boy in orange). Only conclude what the descriptions support.\n\nReply with one line per item and nothing else, like:\n1. setup, idle loop: ...\n2. main action, climax: ...';
const V241_STORY_PROMPT = 'These are the items of one {{kind}}, saved for a roleplay, in order. For each item you get its tags and its description, written by someone looking at that item alone.\n\n{{items}}\n\nFirst give the shape of the whole group, then a role and a story line for each item.\nRoles: setup (how things are before anything happens, often an idle loop), build-up (tension rising toward an action or the climax), action (something happens: a move, a hit, a kiss; not every action is the peak), pause (a lull between actions: catching breath, a standoff, a loop that holds the moment), climax (the single most intense moment of the whole group), aftermath (the result or the reaction after the climax), transition (moving on to another place or scene). After the role, add a finer role of 1 to 3 words of your own, like idle loop, wind-up, first clash, standoff, finishing blow, reaction, calm down.\nGuidelines:\n- A group has highs and lows. Roles can repeat and come in any order, like setup, action, pause, action, climax.\n- A loop says how an item moves, not what it is: a loop at the start is usually the setup, a loop between actions is a pause, a loop at the end can be the aftermath.\n- There is at most one climax. It is usually the last item or the one before it; an action earlier on is just an action unless nothing after it comes close.\n- Not every group has an aftermath. Use it only for an item that comes after the climax and shows its result or a reaction. If the group ends on the peak, the last item is the climax.\n- Judge each item by what it shows and by the items around it, not by its position.\nExamples: setup, climax, aftermath (a short scene with one peak); setup, action, pause, climax, aftermath; setup, build-up, action, climax (ends on the peak); setup, action, action, transition (no real peak, so no climax).\nStory line: 1 to 2 sentences on what this moment means in the story, from what was happening before and what is happening now, like "He was eating his ramen; now he slurps the last noodle, so he has just finished the bowl." Say what it means, not what looks different (not "the noodles are shorter now"). For item 1, say what is going on. Never use names, even when the tags give them: say he, she or they, or describe the person (the blond boy in orange). Only conclude what the descriptions support.\n\nReply with the shape line, then one line per item, and nothing else, like:\nShape: setup → action → pause → climax\n1. setup, idle loop: ...\n2. action, first clash: ...';
const DEFAULT_STORY_PROMPT = 'These are the items of one {{kind}}, saved for a roleplay, in order. For each item you get its tags and its description, written by someone looking at that item alone.\n\n{{items}}\n\nFirst rate each item, then give the shape of the whole group, then a role and a story line for each item.\nIntensity: rate each item from 1 to 10 for how intense the moment is. Intensity is the peak of emotion, not just of action: a fierce blow, a confession, a reconciliation hug, a goodbye or someone breaking into tears can all be a 9 or a 10. Calm, ordinary or waiting moments are low. Compare the items with each other, not with other stories.\nRoles: setup (how things are before anything happens, often an idle loop), build-up (tension or feeling rising toward the peak), action (something happens: a move, a hit, a kiss; not every action is the peak), pause (a lull between two higher moments: catching breath, a standoff, a loop that holds the moment), climax (the item where the intensity peaks), aftermath (after the climax: its result, or the reaction to it, with the intensity coming down), transition (moving on to another place or scene). After the role, add a finer role of 1 to 3 words of your own, like idle loop, wind-up, first clash, standoff, finishing blow, embrace, tears, reaction, calm down.\nGuidelines:\n- Decide the climax from the intensity: it is the item with the highest one, and there is at most one. It can be anywhere, also the first item, and in a sad or tender scene it is the most emotional moment, not the most active one.\n- An item after the climax that shows its result or a reaction is the aftermath, even if something still moves in it. A group that ends on the peak has no aftermath.\n- Item 1 is not always the setup: a group can start in the middle of things, with a build-up or an action.\n- A group has highs and lows. Roles can repeat and come in any order, like setup, action, pause, action, climax.\n- A loop says how an item moves, not what it is: it can be a setup, a pause or an aftermath depending on what it shows.\nExamples: setup, climax, aftermath; build-up, climax, aftermath (starts in the middle of things); setup, action, pause, climax, aftermath; setup, build-up, action, climax (ends on the peak); climax, aftermath, aftermath (starts at the peak); setup, build-up, climax (a tearful goodbye).\nStory line: 1 to 2 sentences on what this moment means in the story, from what was happening before and what is happening now, like "He was eating his ramen; now he slurps the last noodle, so he has just finished the bowl." Say what it means, not what looks different (not "the noodles are shorter now"). For item 1, say what is going on. Never use names, even when the tags give them: say he, she or they, or describe the person (the blond boy in orange). Only conclude what the descriptions support.\n\nReply with one rating line per item, then the shape line, then one line per item, and nothing else, like:\nIntensity 1: 4, they size each other up\nIntensity 2: 9, the decisive blow\nIntensity 3: 5, she staggers back, hurt\nShape: build-up → climax → aftermath\n1. build-up, sizing up: ...\n2. climax, finishing blow: ...';
const DEFAULT_VERSIONS_PROMPT = 'These are the {{count}} versions of one picture (the same scene in several versions), saved for a roleplay. For each version you get its tags and its description, written by someone looking at that version alone.\n\n{{items}}\n\nGive each version a role and a line.\nRole: a main role, then a finer one. Main roles: base (version 1, the one the others are compared with), variation (the same moment, changed), escalation (the same moment, taken further), alternate (another take on the scene). The finer role is 1 to 3 words on what changed, like expression, outfit, undressed, pose, angle, mood.\nLine: for version 1, 1 sentence on what the scene is. For the others, 1 to 2 sentences on what this version means compared with version 1, like "In this version she is embarrassed" rather than "her cheeks are redder". Never use names, even when the tags give them: say he, she or they, or describe the person (the blond boy in orange). Only conclude what the descriptions support.\n\nReply with one line per version and nothing else, like:\n1. base: ...\n2. variation, expression: ...';
const DEFAULT_IMPORTANCE_PROMPT = 'These pictures are the items of one {{kind}} saved for a roleplay. What each item shows:\n{{items}}\n\nThe site\'s tags for the whole group: {{tags}}\nThese tags were not found in any item: {{missing}}\n\nFor each tag that was not found, decide whether it matters. It matters when it names a key action or moment of the group, a person, or a defining feature of what the group is about (a kiss, a transformation, a weapon being used, a fight). It does not matter when it is a small detail, a background object, clothing that can be off-screen, or a tag about the file itself (resolution, artist, series, format).\n\nReply with one line per tag that was not found, like "tag: important, because ..." or "tag: minor". Then a last line: "Verdict: needs a look" if any tag is important, or "Verdict: fine".';
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
    groupsInLore: false,
    groupStory: true,
    maxPictures: 8,
    roleCheck: false,
    groupLink: true,
    groupInText: true,
    sequenceV3: true,
    gifNote: '',
    loopNote: '',
    oneMoving: '',
    forcePrompt: '',
    showRule: '',
    spellPrompt: '',
    cardPrompt: '',
    cardUpdatePrompt: '',
    looksWeight: 100,
    sendRatings: { general: true, sensitive: true, questionable: true, explicit: true },
    spellAi: true,
    siteSpellings: {},
    siteAccounts: {},
    siteKinds: {},
    viaFirefox: {},
    pixiv: { enabled: false, kind: 'all', order: 'date_d', match: 's_tag', hideAi: false, limit: 400 },
    leadPrompt: '',
    inlinePictures: true,
    keepLibraryFiles: true,
    libraryBackups: [],
    libAnimate: true,
    pickMix: true,
    describeRules: '',
    boardNote: '',
    againPrompt: '',
    tagLinks: [],
    tagAliasChecked: {},
    groupRoleFit: true,
    roleRules: '',
    groupDeduce: true,
    storyPrompt: DEFAULT_STORY_PROMPT,
    versionsPrompt: DEFAULT_VERSIONS_PROMPT,
    tagsMatter: '',
    tagsDontMatter: '',
    tagNotes: {},
    fixLog: [],
    tagDefinitions: {},
    removalNotes: {},
    groupBlind: true,
    groupReview: true,
    groupImportance: true,
    importancePrompt: DEFAULT_IMPORTANCE_PROMPT,
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
    libOrder: 'fit',
    libKind: 'all',
    videoMin: 0,
    videoMax: 0,
    libSmall: false,
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
    splitSense: 3,
    loopRepeats: 3,
    videoReader: 'auto',
    decoderUrl: '',
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

let settingsChecked = null;

function settings() {
    const all = ctx().extensionSettings;
    if (!all[MODULE]) {
        all[MODULE] = {};
    }
    const s = all[MODULE];
    if (s === settingsChecked && s.ratings && typeof s.ratings === 'object') {
        if (!RATINGS.some(r => s.ratings[r])) {
            s.ratings.general = true;
        }
        return s;
    }
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
    if (s.storyPrompt === V241_STORY_PROMPT || s.storyPrompt === PREV_STORY_PROMPT || s.storyPrompt === PREV_STORY_PROMPT.replace('Never use names, even when the tags give them: say he, she or they, or describe the person (the blond boy in orange).', OLD_NAMES_RULE)) {
        s.storyPrompt = DEFAULT_STORY_PROMPT;
    }
    for (const key of ['storyPrompt', 'versionsPrompt']) {
        if (typeof s[key] === 'string' && s[key].includes(OLD_NAMES_RULE)) {
            s[key] = s[key].replace(OLD_NAMES_RULE, 'Never use names, even when the tags give them: say he, she or they, or describe the person (the blond boy in orange).');
        }
    }
    if (!Array.isArray(s.tagLinks)) {
        s.tagLinks = [];
    }
    if (!s.tagAliasChecked || typeof s.tagAliasChecked !== 'object' || Array.isArray(s.tagAliasChecked)) {
        s.tagAliasChecked = {};
    }
    if (!s.removalNotes || typeof s.removalNotes !== 'object' || Array.isArray(s.removalNotes)) {
        s.removalNotes = {};
    }
    if (!s.tagDefinitions || typeof s.tagDefinitions !== 'object' || Array.isArray(s.tagDefinitions)) {
        s.tagDefinitions = {};
    }
    if (!Array.isArray(s.fixLog)) {
        s.fixLog = [];
    }
    if (!s.tagNotes || typeof s.tagNotes !== 'object' || Array.isArray(s.tagNotes)) {
        s.tagNotes = {};
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
    settingsChecked = s;
    return s;
}

function save() {
    ctx().saveSettingsDebounced();
}

const DEVICE_CACHES = ['tagImplied', 'characterGender', 'tagAliasChecked'];
const deviceCaches = new Map();

function deviceStore() {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
        return null;
    }
}

function deviceCache(name) {
    if (!deviceCaches.has(name)) {
        let value = {};
        try {
            const parsed = JSON.parse(deviceStore()?.getItem(`${MODULE}_${name}`) || 'null');
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                value = parsed;
            }
        } catch {
        }
        const s = settings();
        const old = s[name];
        if (old && typeof old === 'object' && !Array.isArray(old) && Object.keys(old).length) {
            value = { ...old, ...value };
            s[name] = {};
            save();
            deviceCaches.set(name, value);
            keepDeviceCache(name, value);
        }
        deviceCaches.set(name, value);
    }
    return deviceCaches.get(name);
}

function keepDeviceCache(name, value) {
    deviceCaches.set(name, value);
    try {
        deviceStore()?.setItem(`${MODULE}_${name}`, JSON.stringify(value));
    } catch {
    }
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

let personalList = { text: null, tags: new Set() };

function personalTags() {
    const text = String(settings().extraExcluded || '');
    if (personalList.text !== text) {
        personalList = { text, tags: new Set(normalizeTagList(text)) };
    }
    return personalList.tags;
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
            const before = Array.isArray(s.cleanupCache) ? s.cleanupCache : [];
            if (list.length !== before.length || list.some((tag, index) => before[index] !== tag)) {
                s.cleanupCache = list;
                save();
            }
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
            const query = first.includes('?') ? first.slice(first.indexOf('?') + 1) : '';
            const domain = first.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/?].*$/, '');
            const typed = [query, ...rest].filter(Boolean).join('&').replace(/^[?&]+/, '');
            const extra = typed ? `&${typed}` : '';
            return { domain, extra: `${extra}${accountExtra(domain, settings().engines?.[domain], extra)}` };
        })
        .filter(entry => entry.domain);
}

const ALL_SITES = '*';
const SITE_HOME = 'https://github.com/mrd558955-cell/SillyImageSearch';

function siteAccounts() {
    const s = settings();
    if (!s.siteAccounts || typeof s.siteAccounts !== 'object' || Array.isArray(s.siteAccounts)) {
        s.siteAccounts = {};
    }
    return s.siteAccounts;
}

function accountFor(domain) {
    const found = siteAccounts()[domain];
    return found && (String(found.login || '').trim() || String(found.key || '').trim()) ? found : null;
}

function accountForHost(host) {
    const name = String(host || '').toLowerCase().replace(/^www\./, '');
    const domain = Object.keys(siteAccounts()).find(site => name === site || name.endsWith(`.${site}`));
    return domain ? accountFor(domain) : null;
}

function accountExtra(domain, engineName, extra = '') {
    const account = accountFor(domain);
    if (!account || /(?:^|&)(?:api_key|key|password_hash)=/.test(extra)) {
        return '';
    }
    const login = encodeURIComponent(String(account.login || '').trim());
    const key = encodeURIComponent(String(account.key || '').trim());
    const pair = (who, secret) => `${login ? `&${who}=${login}` : ''}${key ? `&${secret}=${key}` : ''}`;
    switch (engineName) {
        case 'danbooru':
        case 'e621':
            return pair('login', 'api_key');
        case 'gelbooru':
            return pair('user_id', 'api_key');
        case 'moebooru':
            return pair('login', 'password_hash');
        case 'philomena':
            return key ? `&key=${key}` : '';
        default:
            return '';
    }
}

function accountAgent(url) {
    const account = accountForHost(hostOf(url));
    if (!account || DONMAI.test(hostOf(url))) {
        return {};
    }
    const login = String(account.login || '').trim();
    return { 'User-Agent': `SillyImageSearch/${VERSION} (${login ? `user ${login}` : 'with an API key'}; +${SITE_HOME})` };
}
const PIXIV = 'pixiv.net';
const BRIDGE = '/api/plugins/pixiv-bridge';

function pixivSettings() {
    const s = settings();
    if (!s.pixiv || typeof s.pixiv !== 'object') {
        s.pixiv = { enabled: false };
    }
    return s.pixiv;
}

function pixivOn() {
    return Boolean(pixivSettings().enabled);
}

function siteEntry(domain) {
    if (domain === PIXIV) {
        return pixivOn() ? { domain: PIXIV, extra: '' } : null;
    }
    return siteEntries().find(entry => entry.domain === domain) || null;
}

function pixivTags(list) {
    const out = [];
    for (const entry of Array.isArray(list) ? list : []) {
        const tag = normalizeTag(typeof entry === 'string' ? entry : entry?.tag);
        const en = normalizeTag(typeof entry === 'object' ? entry?.en : '');
        if (tag) {
            out.push(tag);
        }
        if (en && en !== tag) {
            out.push(en);
        }
    }
    return [...new Set(out)];
}

function pixivError(result) {
    if (result?.data?.error) {
        return `Pixiv: ${result.data.error}`;
    }
    if (result?.status === 404 || /Cannot GET|not found/i.test(String(result?.text || '').slice(0, 300))) {
        return 'The Pixiv bridge is not running on SillyTavern\'s server. See Setup → Pixiv in the Image Search settings.';
    }
    return `The Pixiv bridge answered ${result?.status ?? '?'}.`;
}

async function bridgeCall(path, body = null) {
    const options = body ? { method: 'POST', headers: { ...ctx().getRequestHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { headers: ctx().getRequestHeaders() };
    const result = await rawFetch(`${BRIDGE}${path}`, options);
    if (!result.ok || !result.data || result.data.error) {
        throw new Error(pixivError(result));
    }
    return result.data;
}

async function pixivFamily(item) {
    const { item: work, pages } = await bridgeCall(`/work/${item.pixivId}`);
    const tags = pixivTags(work?.tags);
    if (tags.length) {
        item.tags = [...new Set([...tags, ...item.tags])];
    }
    const list = Array.isArray(pages) && pages.length ? pages : [{ regular: '', thumb: '' }];
    return list.map((page, index) => {
        if (index === 0) {
            return item;
        }
        return {
            ...item,
            img: `${BRIDGE}${page.regular}`,
            thumb: `${BRIDGE}${page.thumb || page.regular}`,
            alts: [],
            anim: '',
            page: `${item.page}#${index + 1}`,
            pageIndex: index,
            tags: item.tags,
        };
    });
}

function readZip(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let end = -1;
    for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65557); at--) {
        if (view.getUint32(at, true) === 0x06054b50) {
            end = at;
            break;
        }
    }
    if (end < 0) {
        throw new Error('The animation file is not a zip.');
    }
    const count = view.getUint16(end + 10, true);
    let at = view.getUint32(end + 16, true);
    const files = new Map();
    for (let n = 0; n < count && view.getUint32(at, true) === 0x02014b50; n++) {
        const method = view.getUint16(at + 10, true);
        const size = view.getUint32(at + 20, true);
        const nameLength = view.getUint16(at + 28, true);
        const extraLength = view.getUint16(at + 30, true);
        const commentLength = view.getUint16(at + 32, true);
        const local = view.getUint32(at + 42, true);
        const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
        const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
        files.set(name, { method, data: bytes.subarray(start, start + size) });
        at += 46 + nameLength + extraLength + commentLength;
    }
    return files;
}

async function zipFile(file) {
    if (file.method === 0) {
        return file.data;
    }
    if (file.method === 8 && typeof DecompressionStream === 'function') {
        return new Uint8Array(await new Response(new Blob([file.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    }
    throw new Error('The animation file is packed in a way this browser cannot open.');
}

async function frameData(bytes, width, height) {
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
    const w = width || bitmap.width;
    const h = height || Math.round(bitmap.height * (w / bitmap.width));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const draw = canvas.getContext('2d', { willReadFrequently: true });
    draw.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return { data: draw.getImageData(0, 0, w, h).data, width: w, height: h };
}

async function ugoiraGif(id) {
    const meta = await bridgeCall(`/ugoira/${id}`);
    const response = await fetch(`${BRIDGE}${meta.zip}`, { headers: ctx().getRequestHeaders() });
    if (!response.ok) {
        throw new Error(`Could not get the animation's frames (${response.status}).`);
    }
    const files = readZip(await response.arrayBuffer());
    const frames = (meta.frames || []).filter(frame => files.has(frame.file));
    if (!frames.length) {
        throw new Error('The animation has no frames.');
    }
    const first = await frameData(await zipFile(files.get(frames[0].file)));
    const scale = Math.min(1, 600 / Math.max(first.width, first.height));
    const width = Math.max(1, Math.round(first.width * scale));
    const height = Math.max(1, Math.round(first.height * scale));
    const picks = frames.length <= 6 ? frames : Array.from({ length: 6 }, (_, i) => frames[Math.round(i * (frames.length - 1) / 5)]);
    const samples = [];
    for (const frame of picks) {
        samples.push((await frameData(await zipFile(files.get(frame.file)), width, height)).data);
    }
    const encoder = gifEncoder(width, height, buildPalette(samples));
    samples.length = 0;
    for (const frame of frames) {
        const { data } = await frameData(await zipFile(files.get(frame.file)), width, height);
        encoder.addFrame(data, Math.max(20, Number(frame.delay) || 100));
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    const { bytes } = encoder.finish();
    return new Blob([bytes], { type: 'image/gif' });
}

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
    return String(url).startsWith('/') ? url : `/proxy/${encodeURIComponent(url)}`;
}

async function fetchWithin(url, options = {}, ms = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error(`SillyTavern did not answer in ${Math.round(ms / 1000)} s.`);
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

const MODEL_WAIT_MS = 5 * 60 * 1000;

async function modelRequest(service, profile, prompt, maxTokens, custom = {}, override = {}) {
    const controller = new AbortController();
    const outer = custom?.signal || null;
    const relay = () => controller.abort();
    if (outer?.aborted) {
        controller.abort();
    } else {
        outer?.addEventListener?.('abort', relay, { once: true });
    }
    let late = false;
    let timer = null;
    const limit = new Promise((resolve, reject) => {
        timer = setTimeout(() => {
            late = true;
            controller.abort();
            reject(new Error(`The model did not answer in ${MODEL_WAIT_MS / 60000} minutes.`));
        }, MODEL_WAIT_MS);
    });
    const asked = (async () => service.sendRequest(profile, prompt, maxTokens, { ...custom, signal: controller.signal }, override))();
    asked.catch(() => {});
    try {
        return await Promise.race([asked, limit]);
    } catch (error) {
        if (late) {
            throw new Error(`The model did not answer in ${MODEL_WAIT_MS / 60000} minutes.`);
        }
        throw error;
    } finally {
        clearTimeout(timer);
        outer?.removeEventListener?.('abort', relay);
    }
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

function canSetAgent() {
    if (typeof Request !== 'function') {
        return true;
    }
    try {
        return new Request('https://example.invalid/', { headers: { 'User-Agent': 'check' } }).headers.get('User-Agent') === 'check';
    } catch {
        return false;
    }
}

function agentFor(url) {
    if (!DONMAI.test(hostOf(url))) {
        return canSetAgent() ? accountAgent(url) : {};
    }
    return danbooruIdentity.id && danbooruIdentity.account === danbooruAccount() ? { 'User-Agent': danbooruAgent() } : {};
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
    if (!DONMAI.test(hostOf(url))) {
        return canSetAgent() ? accountAgent(url) : {};
    }
    if (!danbooruAccount()) {
        return {};
    }
    await resolveDanbooruId();
    return agentFor(url);
}

const firefox = { version: '', sites: [], waiting: new Map(), counter: 0, blobs: new Set(), checked: null, passing: new Map(), images: new Map(), ready: new Map() };

window.addEventListener('message', event => {
    if (event.source !== window || event.data?.source !== 'stis-fetcher') {
        return;
    }
    const waiting = firefox.waiting.get(event.data.id);
    if (waiting) {
        firefox.waiting.delete(event.data.id);
        clearTimeout(waiting.timer);
        waiting.resolve(event.data);
    }
});

function askFirefox(type, payload = {}, timeoutMs = 60000) {
    return new Promise(resolve => {
        const id = `stis${Date.now()}_${firefox.counter++}`;
        const timer = setTimeout(() => {
            firefox.waiting.delete(id);
            resolve({ ok: false, missing: true, error: 'The SillyImageSearch Fetcher add-on did not answer. Is it installed in this Firefox?' });
        }, timeoutMs);
        firefox.waiting.set(id, { resolve, timer });
        window.postMessage({ source: 'stis-page', id, type, ...payload }, location.origin);
    });
}

async function firefoxHello(force = false) {
    if (!force && firefox.checked) {
        return firefox.checked;
    }
    firefox.checked = askFirefox('hello', {}, 1500).then(reply => {
        firefox.version = reply.version || '';
        firefox.sites = Array.isArray(reply.sites) ? reply.sites : [];
        return reply;
    });
    return firefox.checked;
}

function siteOfHost(host) {
    const name = String(host || '').toLowerCase().replace(/^www\./, '');
    return Object.keys(settings().viaFirefox || {}).find(site => settings().viaFirefox[site] && (name === site || name.endsWith(`.${site}`))) || '';
}

function throughFirefox(url) {
    return siteOfHost(hostOf(url));
}

async function firefoxFetch(url, binary = false) {
    const site = throughFirefox(url);
    const hello = await firefoxHello();
    if (!hello.version) {
        firefox.checked = null;
        throw new BlockedError(`${site} is set to go through Firefox, but the SillyImageSearch Fetcher add-on did not answer. Install it in this Firefox (Setup → Site accounts tells how), or untick "Through Firefox".`);
    }
    let reply = await askFirefox('fetch', { url, binary }, 240000);
    if (reply.notAllowed) {
        const answer = await askFirefox('approve', { domain: site }, 200000);
        if (!answer.allowed) {
            throw new BlockedError(`${site} was not allowed in the SillyImageSearch Fetcher.`);
        }
        firefox.sites = [...new Set([...firefox.sites, site])];
        reply = await askFirefox('fetch', { url, binary }, 240000);
    }
    if (reply.challenge && !reply.passTried) {
        if (!firefox.passing.has(site)) {
            toastr.info(`Getting a pass from ${site} in Firefox: pass the check if it asks, and you come back here by yourself.`, 'Image Search');
            firefox.passing.set(site, askFirefox('pass', { domain: site }, 200000).finally(() => setTimeout(() => firefox.passing.delete(site), 60000)));
        }
        const pass = await firefox.passing.get(site);
        if (pass.passed) {
            reply = await askFirefox('fetch', { url, binary }, 240000);
        }
    }
    return reply;
}

async function firefoxRequest(url) {
    const reply = await firefoxFetch(url, false);
    if (reply.missing || (reply.status === 0 && !reply.text)) {
        throw new BlockedError(reply.error || `Firefox could not reach ${hostOf(url)}.`);
    }
    const text = String(reply.text || '');
    let data = null;
    try {
        data = JSON.parse(text);
    } catch {
        data = null;
    }
    return { ok: Boolean(reply.ok), status: Number(reply.status) || 0, text, data };
}

async function firefoxImage(url) {
    const reply = await firefoxFetch(url, true);
    if (!reply.ok || !reply.bytes) {
        throw new Error(reply.challenge ? `${hostOf(url)} still asks for its check in Firefox.` : `Firefox got ${reply.status || 'no answer'} for this picture${reply.error ? ` (${reply.error})` : ''}.`);
    }
    const type = String(reply.type || '').split(';')[0].trim().toLowerCase();
    const blob = new Blob([reply.bytes], { type: type || 'application/octet-stream' });
    return { blob, format: SAVE_FORMATS[type] || await sniffFormat(blob) };
}

function firefoxImageUrl(url) {
    if (!firefox.images.has(url)) {
        const job = firefoxImage(url).then(({ blob }) => {
            const link = URL.createObjectURL(blob);
            firefox.blobs.add(link);
            firefox.ready.set(url, link);
            return link;
        });
        job.catch(() => firefox.images.delete(url));
        firefox.images.set(url, job);
    }
    return firefox.images.get(url);
}

function dropFirefoxBlobs() {
    firefox.blobs.forEach(link => URL.revokeObjectURL(link));
    firefox.blobs.clear();
    firefox.images.clear();
    firefox.ready.clear();
}

async function request(url, options = {}) {
    const s = settings();
    const { identify = true, ...rest } = options;
    if (throughFirefox(url)) {
        return firefoxRequest(url);
    }
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
        parse: result => {
            if (!result.ok || !result.data) {
                return null;
            }
            if (Array.isArray(result.data.posts)) {
                return result.data.posts;
            }
            const list = Array.isArray(result.data) ? result.data : null;
            return list && (!list.length || (list[0] && typeof list[0] === 'object' && 'files' in list[0])) ? list.map(e621Post) : null;
        },
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
    pixiv: {
        cap: 8,
        pageSize: 60,
        quiet: true,
        url: (origin, tags, extra, page) => `${BRIDGE}/search?word=${encodeURIComponent(tags.join(' '))}&p=${page + 1}`,
        tags: (userTags, ratings) => {
            const p = pixivSettings();
            const mode = ratings.general && !ratings.questionable && !ratings.explicit ? 'safe' : !ratings.general && !ratings.sensitive ? 'r18' : 'all';
            return [...userTags.map(tag => tag.replace(/_/g, ' ')), `pixiv-mode:${mode}`, `pixiv-kind:${p.kind || 'all'}`, `pixiv-order:${p.order || 'date_d'}`, `pixiv-match:${p.match || 's_tag'}`, ...(p.hideAi ? ['pixiv-ai:hide'] : [])];
        },
        parse: result => (result.ok && result.data && Array.isArray(result.data.items) ? result.data.items : null),
        image: post => (post.regular ? `${BRIDGE}${post.regular}` : ''),
        full: post => (post.regular ? `${BRIDGE}${post.regular}` : ''),
        thumb: post => (post.thumb ? `${BRIDGE}${post.thumb}` : ''),
        postUrl: post => `https://www.pixiv.net/artworks/${post.id}`,
        siteUrl: (origin, tags) => `https://www.pixiv.net/tags/${encodeURIComponent(tags.filter(tag => !tag.startsWith('pixiv-') && !tag.startsWith('-')).join(' '))}/artworks`,
        parentId: () => '',
        hasChildren: post => Number(post.pages) > 1,
        md5: () => '',
        family: () => [['pages']],
        rating: post => (Number(post.restrict) > 0 ? 'explicit' : 'general'),
        postTags: post => pixivTags(post.tags),
        more: post => ({ pixivId: String(post.id), pageCount: Number(post.pages) || 1, title: String(post.title || ''), artist: String(post.userName || ''), ai: Boolean(post.ai), ...(post.kind === 'ugoira' ? { anim: `${BRIDGE}/ugoira-gif/${post.id}` } : {}) }),
        familyItems: item => pixivFamily(item),
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
    const parsed = new URL(url, 'https://local.invalid');
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

function siteVerdict(answer, domain) {
    const text = String(answer || '');
    if (/Cloudflare/i.test(text)) {
        return `stopped by a Cloudflare check (${text.slice(0, 120)}). SillyTavern's server cannot pass it. ${accountFor(domain) ? 'Your name and key went with it, but Cloudflare stands in front of the site and stopped the request before the site could see them. This site lets no programs through, so only the site can let SillyTavern in; leave it out for now.' : 'Add an account for it under Site accounts and check again; if it still stops, only the site can let SillyTavern in.'}`;
    }
    if (/\b(401|403)\b/.test(text)) {
        return accountFor(domain) ? `refuses your account (${text.slice(0, 120)}). Check the name and the API key from your account settings on the site.` : `refuses SillyTavern's server (${text.slice(0, 120)}). Add an account for it under Site accounts and check again.`;
    }
    if (/\b(429)\b/.test(text)) {
        return `asks to slow down (${text.slice(0, 120)}). Try again later.`;
    }
    return text.slice(0, 200);
}

function e621Post(post) {
    if (!post || typeof post !== 'object' || !post.files || typeof post.files !== 'object') {
        return post;
    }
    const files = post.files;
    const meta = files.meta || {};
    return {
        ...post,
        file: { url: files.original?.url || null, ext: meta.ext || '', md5: meta.md5 || '', size: meta.size || 0, width: files.original?.width || 0, height: files.original?.height || 0 },
        preview: { url: files.preview?.jpg || files.preview?.webp || null, width: files.preview?.width || 0, height: files.preview?.height || 0 },
        sample: { has: Boolean(meta.has_sample), url: files.sample?.jpg || files.sample?.webp || null, width: files.sample?.width || 0, height: files.sample?.height || 0 },
        duration: meta.duration ?? null,
        relationships: { parent_id: post.relationships?.parent_id ?? null, has_children: Boolean(post.has?.children), has_active_children: Boolean(post.has?.active_children), children: post.relationships?.children || [] },
        score: post.stats?.score || post.score,
        fav_count: post.stats?.fav_count ?? post.fav_count,
    };
}

function engineFor(name, result) {
    if (name === 'danbooru' && result?.ok && result.data && !Array.isArray(result.data) && Array.isArray(result.data.posts)) {
        return 'e621';
    }
    const first = name === 'danbooru' && result?.ok && Array.isArray(result.data) ? result.data[0] : null;
    if (first && typeof first === 'object' && first.files && typeof first.files === 'object' && 'change_seq' in first) {
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
            duration: video ? Number(post.media_asset?.duration || post.duration || post.file?.duration || 0) || 0 : 0,
            page: engine.postUrl(post, origin),
            tags,
            fileTags: postFileTags(post),
            domain: origin.replace(/^https?:\/\//, ''),
            postId,
            parentId,
            hasChildren: engine.hasChildren(post),
            md5: engine.md5(post),
            root: parentId || postId,
            siteFiles: engineName === 'danbooru' ? { thumb: siteCopy(thumb, origin), img: siteCopy(img, origin), full: siteCopy(original, origin) } : null,
            ...(engine.more ? engine.more(post) : {}),
        });
    }
    return items;
}

function postFileTags(post) {
    const named = ['tag_string_artist', 'tag_string_copyright', 'tag_string_meta'].flatMap(key => tagList(post[key]));
    const grouped = post.tags && typeof post.tags === 'object' && !Array.isArray(post.tags) ? ['artist', 'copyright', 'meta', 'lore', 'invalid', 'contributor'].flatMap(key => (Array.isArray(post.tags[key]) ? post.tags[key] : [])) : [];
    return [...new Set([...named, ...grouped].map(tag => normalizeTag(String(tag))).filter(Boolean))].slice(0, 40);
}

const siteAnswers = {};
const siteProbes = {};
const KIND_NAMES = { danbooru: 'Danbooru', e621: 'e621', gelbooru: 'Gelbooru', moebooru: 'Moebooru', philomena: 'Philomena', shimmie: 'Shimmie' };

function siteKind(domain) {
    const kind = settings().siteKinds?.[domain];
    return ENGINES[kind] && kind !== 'pixiv' ? kind : '';
}

function maskKey(url) {
    return String(url).replace(/((?:api_key|key|password_hash)=)[^&]+/g, '$1•••');
}

function shortAddress(url) {
    try {
        const parsed = new URL(url);
        return maskKey(`${parsed.pathname}${parsed.search}`).slice(0, 140);
    } catch {
        return maskKey(url).slice(0, 140);
    }
}

async function detectEngine(entry, probeTags) {
    const s = settings();
    if (KNOWN_WEB.test(entry.domain)) {
        s.engines[entry.domain] = 'none';
        save();
        return 'none';
    }
    const chosen = siteKind(entry.domain);
    if (chosen) {
        s.engines[entry.domain] = chosen;
        delete siteAnswers[entry.domain];
        siteProbes[entry.domain] = [];
        save();
        return chosen;
    }
    const origin = `https://${entry.domain}`;
    const probe = probeTags.slice(0, 1);
    const answers = [];
    siteProbes[entry.domain] = [];
    for (const name of ENGINE_ORDER) {
        const engine = ENGINES[name];
        let result;
        const address = engine.url(origin, engine.tags(probe, false), `${entry.extra}${accountExtra(entry.domain, name, entry.extra)}`, 0);
        try {
            result = await request(address);
        } catch (error) {
            if (error instanceof BlockedError) {
                throw new BlockedError(`${entry.domain}: the browser blocked the check. If it is an image board, set enableCorsProxy: true in SillyTavern's config.yaml and restart.`);
            }
            throw error;
        }
        const detected = engineFor(name, result);
        siteProbes[entry.domain].push({ kind: KIND_NAMES[name] || name, address: shortAddress(address), answer: ENGINES[detected].parse(result) !== null ? 'answered as this kind of board' : siteAnswer(result) });
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
    if (entry.domain === PIXIV) {
        return 'pixiv';
    }
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
        if (posts === null && engineName === 'pixiv') {
            throw new Error(pixivError(result));
        }
        if (posts === null) {
            if (engineName === 'danbooru' && !noOrder) {
                noOrder = true;
                noOrderSites.add(entry.domain);
                continue;
            }
            throw new Error(`${entry.domain} answered ${result.status}: ${pageText(result.text).slice(0, 150)}${/just a moment|cf-chl|cf_chl|challenge-platform|attention required|cloudflare/i.test(String(result.text || '')) ? ' (a Cloudflare check, which stops SillyTavern\'s server)' : ''}`);
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

function animatedItem(item) {
    return Boolean(item?.video || item?.anim);
}

function mayHaveFamily(item) {
    return Boolean(item.parentId || item.hasChildren);
}

function supportsFamily(item) {
    const engine = ENGINES[item.domain === PIXIV ? 'pixiv' : settings().engines[item.domain]];
    return Boolean(engine && (item.root || item.postId) && engine.family(item.root || item.postId).length);
}

async function fetchFamily(item) {
    const key = familyKey(item);
    if (families.has(key)) {
        return families.get(key);
    }
    const promise = (async () => {
        const s = settings();
        const entry = siteEntry(item.domain);
        const engineName = item.domain === PIXIV ? 'pixiv' : s.engines[item.domain];
        const engine = ENGINES[engineName];
        if (!entry || !engine || !item.root) {
            return [item];
        }
        if (engine.familyItems) {
            return engine.familyItems(item);
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
    const p = domain === PIXIV ? pixivSettings() : null;
    return `${domainsFor(domain).join(',')}|${excludedTags().join(',')}|${negatives.join(',')}${p ? `|${p.kind}|${p.order}|${p.match}|${p.hideAi}` : ''}`;
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
    Object.assign(next, { page: old.page, seen: old.seen, done: old.done, error: old.error, engine: old.engine, pages: old.pages, siteErrors: old.siteErrors, siteNotes: old.siteNotes, skipped: old.skipped });
    if (old.spelled && sameTags(old.required, next.required)) {
        next.spelled = { ...old.spelled, preferred: next.preferred.map(tag => knownSpelling(next.domain, tag)?.to || tag) };
    }
    if (old.subs) {
        next.subs = old.subs.map(sub => rerankBrowse(sub, tags, required));
    }
    next.items = rankItems(old.items.slice(), next.spelled ? next.spelled.preferred : next.preferred);
    return next;
}

const SPELL_KEEP = 30 * 24 * 3600 * 1000;
const SPELL_LIMIT = 600;
const spellJobs = new Map();

function plainTag(tag) {
    return Boolean(tag) && !tag.startsWith('-') && !/^[a-z_]+:./.test(tag);
}

function spellingStore() {
    const s = settings();
    if (!s.siteSpellings || typeof s.siteSpellings !== 'object' || Array.isArray(s.siteSpellings)) {
        s.siteSpellings = {};
    }
    return s.siteSpellings;
}

function knownSpelling(domain, tag) {
    const found = spellingStore()[domain]?.[tag];
    if (!found || typeof found !== 'object') {
        return undefined;
    }
    if (found.by !== 'you' && !found.to && Date.now() - (Number(found.at) || 0) > SPELL_KEEP) {
        return undefined;
    }
    return found;
}

function keepSpelling(domain, tag, to, by) {
    const store = spellingStore();
    store[domain] = { ...(store[domain] || {}), [tag]: { to: to || '', by, at: Date.now() } };
    const all = Object.entries(store).flatMap(([site, tags]) => Object.entries(tags || {}).map(([name, value]) => [site, name, value]));
    if (all.length > SPELL_LIMIT) {
        all.filter(([, , value]) => value.by !== 'you').sort((a, b) => (a[2].at || 0) - (b[2].at || 0)).slice(0, all.length - SPELL_LIMIT).forEach(([site, name]) => delete store[site][name]);
    }
    save();
    renderSpellings();
}

async function aliasOnSite(entry, engineName, tag) {
    const origin = `https://${entry.domain}`;
    if (engineName === 'danbooru') {
        const found = (await danbooruList({ origin }, `tags.json?search%5Bname_or_alias_matches%5D=${encodeURIComponent(tag)}&only=name,post_count&limit=1`))[0];
        return found?.name && Number(found.post_count) > 0 ? normalizeTag(found.name) : '';
    }
    if (engineName === 'e621') {
        const found = (await danbooruList({ origin }, `tag_aliases.json?search%5Bantecedent_name%5D=${encodeURIComponent(tag)}&search%5Bstatus%5D=active&limit=1`))[0];
        const name = normalizeTag(found?.consequent_name || '');
        if (!name) {
            return '';
        }
        await lookupTags(entry.domain, engineName, [name]).catch(() => {});
        return knownCount(entry.domain, name) === 0 ? '' : name;
    }
    return '';
}

async function aiSpelling(entry, tag) {
    const s = settings();
    if (s.spellAi === false || (!s.tagProfile && !visionProfileId())) {
        return undefined;
    }
    const words = [...new Set(tag.replace(/\d+/g, '').split('_').filter(word => word.length >= 3))].sort((a, b) => b.length - a.length).slice(0, 2);
    const lists = await Promise.all((words.length ? words : [tag]).map(word => completeFrom(entry.domain, word).catch(() => [])));
    const seen = new Map();
    lists.flat().forEach(item => {
        if (item?.name && !seen.has(item.name)) {
            seen.set(item.name, Number(item.count) || 0);
        }
    });
    const candidates = [...seen.entries()].filter(([name, count]) => name !== tag && count !== 0).sort((a, b) => b[1] - a[1]).slice(0, 25);
    const meaning = tagDefinition(tag)?.text || '';
    const prompt = fillTemplate(promptPart('spellPrompt'), {
        tag,
        meaning: meaning ? meaning.slice(0, 300) : '',
        site: entry.domain,
        candidates: candidates.length ? candidates.map(([name, count]) => `- ${name}${count > 0 ? ` (${count} posts)` : ''}`).join('\n') : '(the site has no tag sharing a word with it)',
    });
    const reply = String(await textAsk(prompt, 40)).trim().split('\n')[0].replace(/[`*"'.]/g, '').trim();
    const picked = normalizeTag(reply);
    if (!picked || /^none\b/i.test(reply)) {
        return null;
    }
    if (seen.has(picked)) {
        return picked;
    }
    if (picked === tag || !/^[\w()'!?.:;&+-]+$/.test(picked)) {
        return null;
    }
    const engineName = settings().engines[entry.domain];
    await lookupTags(entry.domain, engineName, [picked]).catch(() => {});
    return knownCount(entry.domain, picked) > 0 ? picked : null;
}

async function spellTag(entry, engineName, tag, ask = true) {
    const domain = entry.domain;
    if (!plainTag(tag)) {
        return tag;
    }
    const known = knownSpelling(domain, tag);
    if (known) {
        return known.to || null;
    }
    const links = tagLinksFor(tag);
    const variants = [...new Set([tag, ...bothOrders(tag), ...links])];
    await lookupTags(domain, engineName, [tag]).catch(() => {});
    const own = knownCount(domain, tag);
    for (let start = 1; own === 0 && start < variants.length; start += 2) {
        await lookupTags(domain, engineName, variants.slice(start, start + 2)).catch(() => {});
    }
    if (own === null || own > 0) {
        return tag;
    }
    const other = variants.slice(1).find(variant => knownCount(domain, variant) > 0);
    if (other) {
        keepSpelling(domain, tag, other, links.includes(other) ? 'link' : 'order');
        return other;
    }
    if (!ask) {
        return tag;
    }
    const job = `${domain}|${tag}`;
    if (!spellJobs.has(job)) {
        spellJobs.set(job, (async () => {
            const alias = await aliasOnSite(entry, engineName, tag).catch(() => '');
            if (alias && alias !== tag) {
                keepSpelling(domain, tag, alias, 'alias');
                return alias;
            }
            const guess = await aiSpelling(entry, tag).catch(error => {
                console.warn(`[Image Search] could not find ${tag} on ${domain}`, error);
                return undefined;
            });
            if (guess) {
                keepSpelling(domain, tag, guess, 'ai');
                return guess;
            }
            if (guess === null) {
                keepSpelling(domain, tag, '', 'ai');
            }
            return null;
        })().finally(() => spellJobs.delete(job)));
    }
    return spellJobs.get(job);
}

async function siteSpelled(entry, engineName, browse) {
    const notes = [];
    const missing = [];
    const required = [];
    for (const tag of browse.required) {
        const to = await spellTag(entry, engineName, tag, true);
        if (to === null) {
            missing.push(tag);
            required.push(tag);
        } else {
            if (to !== tag) {
                notes.push(`${tag} → ${to}`);
            }
            required.push(to);
        }
    }
    const cheap = async list => {
        const out = [];
        for (const tag of list) {
            const to = await spellTag(entry, engineName, tag, false);
            if (to) {
                out.push(to);
            }
        }
        return out;
    };
    return { required, preferred: await cheap(browse.preferred), negatives: await cheap(browse.negatives || []), notes, missing };
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
    browse.siteNotes = browse.subs.flatMap(sub => (sub.siteNotes || []).map(note => `${sub.domain}: ${note}`));
    browse.skipped = browse.subs.filter(sub => sub.skipped).map(sub => `${sub.domain}: ${sub.skipped}`);
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
        const entry = siteEntry(browse.domain);
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
        if (!browse.spelled) {
            browse.spelled = await siteSpelled(entry, engineName, browse);
            browse.siteNotes = browse.spelled.notes;
        }
        const spelled = browse.spelled;
        browse.skipped = spelled.missing.length ? `no tag for ${spelled.missing.join(', ')}` : '';
        const batch = [];
        let received = 0;
        let calls = 0;
        while (!browse.done && received < RANK_WINDOW && calls < MAX_PAGE_CALLS) {
            calls++;
            const { items, done, debug } = await fetchPage(entry, engineName, spelled.required, browse.page, [...spelled.required, ...spelled.preferred], spelled.negatives);
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
        const ranked = rankItems(batch, spelled.preferred);
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
    const result = await modelRequest(service, s.tagProfile, prompt, Math.max(16, Number(s.tagMaxTokens) || 250), { stream: false, signal, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.2));
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
        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.slice(result.indexOf(',') + 1));
        };
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
    const ugoira = String(url).match(/^\/api\/plugins\/pixiv-bridge\/ugoira-gif\/(\d+)$/);
    if (ugoira) {
        return { blob: await ugoiraGif(ugoira[1]), format: 'gif' };
    }
    const errors = [];
    if (throughFirefox(url)) {
        try {
            return await firefoxImage(url);
        } catch (error) {
            errors.push(`Through Firefox: ${error?.message || error}`);
        }
    }
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

async function videoIntact(blob) {
    const read = async (at, length) => new Uint8Array(await blob.slice(at, at + length).arrayBuffer());
    const megabytes = bytes => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}` : `${(bytes / 1048576).toFixed(2)}`);
    const head = await read(0, 12);
    if (String.fromCharCode(...head.slice(4, 8)) === 'ftyp') {
        let at = 0;
        let index = false;
        for (let boxes = 0; at + 8 <= blob.size && boxes < 5000; boxes++) {
            const box = await read(at, 16);
            const view = new DataView(box.buffer);
            let size = view.getUint32(0);
            const type = String.fromCharCode(...box.slice(4, 8));
            if (size === 1 && box.length >= 16) {
                size = Number(view.getBigUint64(8));
            } else if (size === 0) {
                size = blob.size - at;
            }
            if (size < 8) {
                return 'the file is damaged';
            }
            if (type === 'moov') {
                index = true;
            }
            if (at + size > blob.size) {
                return `the download stopped early (${megabytes(blob.size)} of ${megabytes(at + size)} MB)`;
            }
            at += size;
        }
        return index ? '' : 'the file has no index (it is damaged or cut short)';
    }
    if (head[0] === 0x1A && head[1] === 0x45 && head[2] === 0xDF && head[3] === 0xA3) {
        const top = await read(0, 64);
        const number = at => {
            const first = top[at];
            let length = 1;
            while (length <= 8 && !(first & (0x80 >> (length - 1)))) {
                length++;
            }
            if (length > 8) {
                return null;
            }
            let value = first & (0xFF >> length);
            let unknown = value === (0xFF >> length);
            for (let i = 1; i < length; i++) {
                value = value * 256 + top[at + i];
                unknown = unknown && top[at + i] === 0xFF;
            }
            return { value, length, unknown };
        };
        const header = number(4);
        if (!header) {
            return '';
        }
        const segment = 4 + header.length + header.value;
        if (segment + 5 > top.length || top[segment] !== 0x18 || top[segment + 1] !== 0x53 || top[segment + 2] !== 0x80 || top[segment + 3] !== 0x67) {
            return '';
        }
        const body = number(segment + 4);
        if (body && !body.unknown && segment + 4 + body.length + body.value > blob.size) {
            return `the download stopped early (${megabytes(blob.size)} of ${megabytes(segment + 4 + body.length + body.value)} MB)`;
        }
    }
    return '';
}

function pageGist(text) {
    const title = (String(text).match(/<title[^>]*>([^<]*)</i) || [])[1];
    return (title || String(text).replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 120);
}

async function downloadVideo(url) {
    const errors = [];
    const host = hostOf(url);
    const routes = [fetcherLink(url), proxyUrl(url)].filter(Boolean);
    for (const route of routes) {
        for (let attempt = 0; attempt < 3; attempt++) {
            let again = false;
            try {
                const response = await fetch(route, route === fetcherLink(url) ? {} : { headers: { ...ctx().getRequestHeaders(), ...await agentHeaders(url) } });
                if (!response.ok) {
                    const gist = pageGist(await response.text().catch(() => ''));
                    again = response.status === 429 || response.status >= 500;
                    throw new Error(`${host} answered ${response.status}${gist ? ` ("${gist}")` : ''}`);
                }
                const blob = await response.blob();
                const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
                const isWebm = head[0] === 0x1A && head[1] === 0x45 && head[2] === 0xDF && head[3] === 0xA3;
                const isMp4 = String.fromCharCode(...head.slice(4, 8)) === 'ftyp';
                if (!isWebm && !isMp4 && !/^video\//.test(blob.type)) {
                    const text = /^\s*</.test(String.fromCharCode(...head)) ? pageGist(new TextDecoder().decode(await blob.slice(0, 4000).arrayBuffer())) : '';
                    throw new Error(`${host} sent a page instead of the video${text ? ` ("${text}")` : ''}`);
                }
                const broken = await videoIntact(blob);
                if (broken) {
                    again = true;
                    throw new Error(broken);
                }
                return blob;
            } catch (error) {
                const message = String(error?.message || error);
                if (errors[errors.length - 1] !== message) {
                    errors.push(message);
                }
                if (!again || attempt === 2) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, attempt ? 4000 : 1500));
            }
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

const THUMB_SHORT = 360;
const LIB_PLAYING = 6;
const THUMB_LONG = 1080;
const thumbs = { db: null, made: new Map(), queue: [], running: 0 };

function thumbDb() {
    if (!thumbs.db) {
        thumbs.db = new Promise(resolve => {
            try {
                const request = indexedDB.open('stis-thumbs', 1);
                request.onupgradeneeded = () => request.result.createObjectStore('thumbs');
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
                request.onblocked = () => resolve(null);
            } catch {
                resolve(null);
            }
        });
    }
    return thumbs.db;
}

function thumbKey(url) {
    return `${url}#${THUMB_SHORT}`;
}

async function storedThumb(url) {
    const db = await thumbDb();
    if (!db) {
        return null;
    }
    return new Promise(resolve => {
        try {
            const request = db.transaction('thumbs', 'readonly').objectStore('thumbs').get(thumbKey(url));
            request.onsuccess = () => resolve(request.result instanceof Blob && request.result.size ? request.result : null);
            request.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

async function keepThumb(url, blob) {
    const db = await thumbDb();
    try {
        db?.transaction('thumbs', 'readwrite').objectStore('thumbs').put(blob, thumbKey(url));
    } catch {
    }
}

async function drawThumb(url) {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) {
        throw new Error('the picture has no size');
    }
    const scale = Math.min(1, THUMB_SHORT / Math.min(width, height), THUMB_LONG / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const pen = canvas.getContext('2d');
    if (!pen) {
        throw new Error('no canvas');
    }
    pen.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.removeAttribute('src');
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) {
        throw new Error('the small copy could not be made');
    }
    return blob;
}

const THUMB_JOBS = 3;

function pumpThumbs() {
    while (thumbs.running < THUMB_JOBS && thumbs.queue.length) {
        const job = thumbs.queue.pop();
        thumbs.running++;
        job.work().then(job.resolve, job.reject).finally(() => {
            thumbs.running--;
            pumpThumbs();
        });
    }
}

function thumbFor(url) {
    if (!thumbs.made.has(url)) {
        const made = (async () => {
            let blob = await storedThumb(url);
            if (!blob) {
                blob = await new Promise((resolve, reject) => {
                    thumbs.queue.push({ work: () => drawThumb(url), resolve, reject });
                    pumpThumbs();
                });
                keepThumb(url, blob);
            }
            return URL.createObjectURL(blob);
        })();
        made.catch(() => thumbs.made.delete(url));
        thumbs.made.set(url, made);
    }
    return thumbs.made.get(url);
}

function dropThumbJobs() {
    thumbs.queue.splice(0).forEach(job => job.reject(new Error('closed')));
    const made = [...thumbs.made.values()];
    thumbs.made.clear();
    made.forEach(promise => promise.then(src => URL.revokeObjectURL(src), () => {}));
}

async function pruneThumbs() {
    const db = await thumbDb();
    if (!db || !library.loaded || library.broken) {
        return;
    }
    const keep = new Set(library.entries.flatMap(entryUrls).map(thumbKey));
    try {
        const store = db.transaction('thumbs', 'readwrite').objectStore('thumbs');
        const request = store.getAllKeys();
        request.onsuccess = () => {
            (request.result || []).filter(url => !keep.has(url)).forEach(url => store.delete(url));
        };
    } catch {
    }
}

function showThumb(img, url) {
    img.dataset.full = url || '';
    if (!url || !String(url).startsWith('/user/')) {
        img.src = url || '';
        return;
    }
    thumbFor(url).then(src => {
        img.dataset.thumb = src;
        if (img.dataset.full === url && !img.dataset.playing) {
            img.src = src;
        }
    }).catch(error => {
        if (img.dataset.full === url && error?.message !== 'closed' && !img.dataset.playing) {
            img.src = url;
        }
    });
}

function gridMedia(root, animate) {
    const watching = typeof IntersectionObserver === 'function';
    const lazy = watching ? new IntersectionObserver(seen => {
        seen.forEach(item => {
            if (item.isIntersecting) {
                lazy.unobserve(item.target);
                showThumb(item.target, item.target.dataset.full);
            }
        });
    }, { root, rootMargin: '600px 0px' }) : null;
    const playing = new Set();
    const waiting = new Set();
    const play = img => {
        img.dataset.playing = '1';
        img.src = img.dataset.full;
        playing.add(img);
    };
    const stop = img => {
        delete img.dataset.playing;
        if (img.dataset.thumb) {
            img.src = img.dataset.thumb;
        }
    };
    const player = animate && watching ? new IntersectionObserver(seen => {
        seen.forEach(item => {
            const img = item.target;
            if (item.isIntersecting) {
                if (playing.size < LIB_PLAYING) {
                    play(img);
                } else {
                    waiting.add(img);
                }
                return;
            }
            waiting.delete(img);
            if (playing.delete(img)) {
                stop(img);
                const next = waiting.values().next().value;
                if (next) {
                    waiting.delete(next);
                    play(next);
                }
            }
        });
    }, { root, threshold: 0.4 }) : null;
    return {
        animates: Boolean(player),
        add(img, moves) {
            if (lazy) {
                lazy.observe(img);
            } else {
                showThumb(img, img.dataset.full);
            }
            if (moves && player) {
                player.observe(img);
            }
        },
        close() {
            lazy?.disconnect();
            player?.disconnect();
            playing.forEach(stop);
            playing.clear();
            waiting.clear();
        },
    };
}

function releaseMedia(root) {
    root?.querySelectorAll?.('video').forEach(video => {
        video.pause?.();
        if (video.getAttribute('src') || video.currentSrc) {
            video.removeAttribute('src');
            video.load?.();
        }
    });
    root?.querySelectorAll?.('img[data-stis-made]').forEach(img => {
        URL.revokeObjectURL(img.src);
        img.removeAttribute('data-stis-made');
    });
}

const videoCopies = new Map();
const videoPlayUrls = new Map();

function needsVideoCopy(url) {
    return DONMAI.test(hostOf(url));
}

function videoCopy(url) {
    if (!videoCopies.has(url)) {
        const promise = downloadVideo(url);
        promise.catch(() => videoCopies.delete(url));
        videoCopies.set(url, promise);
        while (videoCopies.size > 2) {
            videoCopies.delete(videoCopies.keys().next().value);
        }
    }
    return videoCopies.get(url);
}

const videoRoutes = new Map();
const videoLengths = new Map();
const lengthQueue = [];
let lengthBusy = false;

function lengthText(seconds) {
    const total = Math.round(Number(seconds) || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total / 60) % 60;
    const rest = String(total % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

function videoLength(item) {
    return item.duration || videoLengths.get(item.video) || 0;
}

function probeLength(url) {
    return new Promise(resolve => {
        const video = document.createElement('video');
        video.muted = true;
        video.preload = 'metadata';
        let timer = null;
        const done = value => {
            clearTimeout(timer);
            video.removeAttribute('src');
            video.load?.();
            resolve(value);
        };
        timer = setTimeout(() => done(0), 10000);
        video.addEventListener('loadedmetadata', () => done(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0), { once: true });
        video.addEventListener('error', () => done(0), { once: true });
        video.src = url;
    });
}

async function nextLength() {
    if (lengthBusy) {
        return;
    }
    lengthBusy = true;
    while (lengthQueue.length) {
        const { url, show } = lengthQueue.shift();
        if (!show.isConnected) {
            continue;
        }
        if (!videoLengths.has(url)) {
            videoLengths.set(url, await probeLength(url));
        }
        show(videoLengths.get(url) || 0);
    }
    lengthBusy = false;
}

function askLength(url, show) {
    if (needsVideoCopy(url) || videoRoutes.get(url) === 'copy' || (videoLengths.has(url) && !videoLengths.get(url))) {
        return;
    }
    lengthQueue.push({ url, show });
    nextLength();
}

function forgetVideo(url) {
    videoCopies.delete(url);
    const played = videoPlayUrls.get(url);
    videoPlayUrls.delete(url);
    played?.then(objectUrl => URL.revokeObjectURL?.(objectUrl)).catch(() => {});
}

function videoPlayUrl(url) {
    if (!needsVideoCopy(url) && videoRoutes.get(url) !== 'copy') {
        return Promise.resolve(url);
    }
    if (!videoPlayUrls.has(url)) {
        const promise = videoCopy(url).then(blob => URL.createObjectURL(blob));
        promise.catch(() => videoPlayUrls.delete(url));
        videoPlayUrls.set(url, promise);
        while (videoPlayUrls.size > 2) {
            const [oldest, old] = videoPlayUrls.entries().next().value;
            videoPlayUrls.delete(oldest);
            old.then(objectUrl => URL.revokeObjectURL?.(objectUrl)).catch(() => {});
        }
    }
    return videoPlayUrls.get(url);
}

async function openVideo(source) {
    const blob = typeof source === 'string' ? await videoCopy(source) : source;
    const objectUrl = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('playsinline', '');
    video.className = 'stis-video-work';
    ([...document.querySelectorAll('dialog[open]')].pop() || document.body).appendChild(video);
    const close = () => {
        video.pause?.();
        video.removeAttribute('src');
        video.load?.();
        video.remove();
        URL.revokeObjectURL(objectUrl);
    };
    try {
        video.src = objectUrl;
        await waitFor(video, 'loadeddata', 20000);
        return { video, close, duration: Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0 };
    } catch (error) {
        close();
        throw error;
    }
}

async function seekVideo(video, time) {
    const end = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : time + 1;
    const target = Math.max(0, Math.min(time, end - 0.02));
    if (Math.abs((Number(video.currentTime) || 0) - target) < 0.0005 && video.readyState >= 2) {
        return;
    }
    const seeked = waitFor(video, 'seeked');
    video.currentTime = target;
    await seeked;
}

async function playThrough(video, from, to, step, onFrame, rate = 1) {
    await seekVideo(video, from);
    try {
        video.playbackRate = rate;
    } catch {
        video.playbackRate = 1;
    }
    const speed = video.playbackRate || 1;
    await new Promise((resolve, reject) => {
        let finished = false;
        let last = -1;
        let next = from;
        let watchdog = null;
        const finish = error => {
            if (finished) {
                return;
            }
            finished = true;
            clearTimeout(watchdog);
            clearTimeout(limit);
            video.removeEventListener('ended', ended);
            video.pause?.();
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        };
        const ended = () => finish(last < 0 ? new Error('the video did not play') : null);
        const limit = setTimeout(() => finish(new Error('the video played too slowly')), ((to - from) / speed) * 1000 + 15000);
        const alive = () => {
            clearTimeout(watchdog);
            watchdog = setTimeout(() => finish(new Error(last < 0 ? 'the video did not play' : 'the video stopped playing; keep SillyTavern open while it works')), 5000);
        };
        const handle = time => {
            if (finished || !(time > last)) {
                return;
            }
            last = time;
            alive();
            if (time >= to - step * 0.25) {
                finish();
                return;
            }
            if (time + step * 0.25 >= next) {
                try {
                    onFrame(time);
                } catch (error) {
                    finish(error);
                    return;
                }
                while (next <= time + step * 0.25) {
                    next += step;
                }
            }
        };
        const byFrame = typeof video.requestVideoFrameCallback === 'function';
        const tick = (now, meta) => {
            if (finished) {
                return;
            }
            handle(Number(meta?.mediaTime ?? video.currentTime));
            if (!finished) {
                video.requestVideoFrameCallback(tick);
            }
        };
        const poll = () => {
            if (finished) {
                return;
            }
            handle(Number(video.currentTime));
            if (!finished) {
                requestAnimationFrame(poll);
            }
        };
        video.addEventListener('ended', ended);
        alive();
        if (byFrame) {
            video.requestVideoFrameCallback(tick);
        }
        Promise.resolve(video.play()).then(() => {
            if (!byFrame) {
                requestAnimationFrame(poll);
            }
        }).catch(error => finish(error));
    });
}

let frameMethod = '';

function glReader(video, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const options = { antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: true };
    const gl = canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);
    if (!gl) {
        throw new Error('WebGL is not available');
    }
    const shader = (type, source) => {
        const unit = gl.createShader(type);
        gl.shaderSource(unit, source);
        gl.compileShader(unit);
        if (!gl.getShaderParameter(unit, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(unit) || 'WebGL shader failed');
        }
        return unit;
    };
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 t;void main(){t=(p+1.0)*0.5;gl_Position=vec4(p,0.0,1.0);}'));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec2 t;uniform sampler2D s;void main(){gl_FragColor=texture2D(s,t);}'));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'WebGL program failed');
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const where = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(where);
    gl.vertexAttribPointer(where, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.uniform1i(gl.getUniformLocation(program, 's'), 0);
    gl.viewport(0, 0, width, height);
    const out = new Uint8Array(width * height * 4);
    return {
        method: 'webgl',
        read() {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
            const error = gl.getError();
            if (error) {
                throw new Error(`WebGL could not take the frame (${error})`);
            }
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, out);
            return new Uint8ClampedArray(out);
        },
        close() {
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        },
    };
}

function frameReader(video, width, height, method) {
    if (method === 'webgl') {
        return glReader(video, width, height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    return {
        method: '2d',
        read() {
            context.drawImage(video, 0, 0, width, height);
            return context.getImageData(0, 0, width, height).data;
        },
        close() {},
    };
}

function darkData(data) {
    let top = 0;
    for (let i = 0; i < data.length; i += 16) {
        const value = data[i + 3] ? data[i] + data[i + 1] + data[i + 2] : 0;
        if (value > top) {
            top = value;
        }
    }
    return top < 30;
}

function flatData(data) {
    const low = [255, 255, 255];
    const high = [0, 0, 0];
    for (let i = 0; i < data.length; i += 148) {
        for (let c = 0; c < 3; c++) {
            low[c] = Math.min(low[c], data[i + c]);
            high[c] = Math.max(high[c], data[i + c]);
        }
    }
    return high[0] - low[0] <= 10 && high[1] - low[1] <= 10 && high[2] - low[2] <= 10;
}

function emptyData(data) {
    return darkData(data) || flatData(data);
}

async function frameMethods(video, at, width, height) {
    const methods = [...new Set([frameMethod, '2d', 'webgl'].filter(Boolean))];
    const grades = new Map();
    try {
        await seekVideo(video, at);
    } catch {
        return methods;
    }
    for (const method of methods) {
        let reader = null;
        try {
            reader = frameReader(video, width, height, method);
            grades.set(method, emptyData(reader.read()) ? 1 : 0);
        } catch {
            grades.set(method, 2);
        } finally {
            reader?.close();
        }
    }
    const usable = methods.filter(method => grades.get(method) < 2);
    return (usable.length ? usable : methods).sort((a, b) => grades.get(a) - grades.get(b));
}

function noFramesError(errors) {
    console.warn('[Image Search] the browser gave no usable video pictures', errors);
    return new Error(decoder.failed
        ? `the built-in video reader could not be downloaded (${decoder.failed}), and this browser gives no usable pictures of the video (${errors.slice(0, 3).join('; ')})`
        : `this browser gives no usable pictures of the video (${errors.slice(0, 3).join('; ')}). Set "Reading videos" to Automatic or the built-in reader in the settings.`);
}

async function readFrames(video, { from, to, step, rate = 1, seekStep = step, width, height }, onStart, onFrame, onProgress = null, stopped = null) {
    const methods = await frameMethods(video, (from + to) / 2, width, height);
    const errors = [];
    const span = Math.max(0.05, to - from);
    const passes = [{ how: 'playing', rate }, ...(rate > 1 ? [{ how: 'playing', rate: 1, whenSparse: true }] : []), { how: 'seeking', rate: 0 }];
    let sparse = false;
    for (const pass of passes) {
        if (pass.whenSparse && !sparse) {
            continue;
        }
        for (const method of methods) {
            let reader = null;
            let count = 0;
            let lit = false;
            let moving = false;
            let probe = null;
            let last = from;
            let widest = 0;
            try {
                reader = frameReader(video, width, height, method);
                onStart();
                const take = time => {
                    if (stopped?.()) {
                        throw new Error('stopped');
                    }
                    const data = reader.read();
                    lit = lit || !emptyData(data);
                    if (!probe) {
                        probe = data;
                    } else if (!moving) {
                        for (let i = 0; i < data.length; i += 148) {
                            if (Math.abs(data[i] - probe[i]) > 12) {
                                moving = true;
                                break;
                            }
                        }
                    }
                    widest = Math.max(widest, time - last);
                    last = time;
                    count++;
                    onFrame(time, data);
                    onProgress?.(Math.min(1, (time - from) / span));
                };
                if (pass.how === 'playing') {
                    await playThrough(video, from, to, step, take, pass.rate);
                } else {
                    for (let time = from; time < to - seekStep * 0.25; time += seekStep) {
                        await seekVideo(video, time);
                        take(time);
                    }
                }
                const label = `${method} by ${pass.how}${pass.rate > 1 ? ` ${pass.rate}x` : ''}`;
                if (!count || !lit) {
                    errors.push(`${label}: ${count ? 'empty pictures' : 'no pictures'}`);
                } else if (pass.how === 'seeking') {
                    frameMethod = method;
                    return { how: pass.how, method, moving };
                } else if (!moving && span >= 2) {
                    errors.push(`${label}: the picture did not change`);
                } else if (count < span / step * 0.3 || last < to - Math.max(1, span * 0.04) || widest > Math.max(1, step * 8)) {
                    sparse = true;
                    errors.push(`${label}: parts of the video were skipped`);
                } else {
                    frameMethod = method;
                    return { how: pass.how, method, moving };
                }
            } catch (error) {
                if (stopped?.()) {
                    throw new Error('stopped');
                }
                errors.push(`${method} by ${pass.how}: ${error?.message || error}`);
            } finally {
                reader?.close();
            }
        }
    }
    throw noFramesError(errors);
}

async function grabClip(video, from, to, fps, width, height, onProgress = null) {
    let frames = [];
    const { how, method } = await readFrames(video, { from, to, step: 1 / fps, width, height }, () => {
        frames = [];
    }, (time, data) => frames.push({ data, time }), onProgress);
    return { frames, how: `${how}, ${method}` };
}

async function videoStill(video, width = 160) {
    if (!video.videoWidth) {
        return '';
    }
    const height = Math.max(1, Math.round(width * video.videoHeight / video.videoWidth));
    for (const method of [...new Set([frameMethod, '2d', 'webgl'].filter(Boolean))]) {
        let reader = null;
        try {
            reader = frameReader(video, width, height, method);
            const data = reader.read();
            if (!emptyData(data)) {
                return pixelsToUrl(data, width, height);
            }
        } catch {
            continue;
        } finally {
            reader?.close();
        }
    }
    return '';
}

function pixelsToUrl(data, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
    return canvas.toDataURL('image/jpeg', 0.7);
}

async function encodeFrames(frames, width, height, to, fps, onProgress = null) {
    const picks = frames.length <= 6 ? frames : Array.from({ length: 6 }, (_, i) => frames[Math.round(i * (frames.length - 1) / 5)]);
    const encoder = gifEncoder(width, height, buildPalette(picks.map(frame => frame.data)));
    for (let i = 0; i < frames.length; i++) {
        const next = frames[i + 1];
        const delay = next ? (next.time - frames[i].time) * 1000 : Math.min(2000 / fps, Math.max(1000 / fps, (to - frames[i].time) * 1000));
        encoder.addFrame(frames[i].data, Math.max(20, delay));
        frames[i].data = null;
        onProgress?.((i + 1) / frames.length);
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    return encoder.finish();
}

async function gifFromOpen(open, start, end, { fps = 10, width = 480 } = {}, onProgress = null) {
    const { video } = open;
    const total = open.duration || end;
    const from = Math.max(0, Math.min(start, Math.max(0, total - 0.1)));
    const to = Math.max(from + 0.05, Math.min(total, end));
    const rate = Math.min(fps, 600 / (to - from));
    const count = Math.max(1, Math.round((to - from) * rate));
    let scale = Math.min(1, width / Math.max(1, video.videoWidth));
    const bytes = video.videoWidth * scale * video.videoHeight * scale * 4 * count;
    const budget = 160 * 1048576;
    if (bytes > budget) {
        scale *= Math.sqrt(budget / bytes);
    }
    const w = Math.max(1, Math.round(video.videoWidth * scale));
    const h = Math.max(1, Math.round(video.videoHeight * scale));
    const { frames, how } = await grabClip(video, from, to, rate, w, h, share => onProgress?.(share * 0.7));
    const { bytes: data, frames: made } = await encodeFrames(frames, w, h, to, rate, share => onProgress?.(0.7 + share * 0.3));
    return { blob: new Blob([data], { type: 'image/gif' }), frames: made, width: w, height: h, how };
}

const DECODER_BASES = ['https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/', 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/'];

function decoderBases() {
    const custom = String(settings().decoderUrl || '').trim();
    return custom ? [`${custom.replace(/\/+$/, '')}/`] : DECODER_BASES;
}
const DECODER_FILES = {
    'ffmpeg-core.js': { hash: 'b266ab5b952555881dd6310663986994a182acb2b7ff25cf10a25f7a37ac2b21', type: 'text/javascript', size: 112059 },
    'ffmpeg-core.wasm': { hash: '9f57947a5bd530d8f00c5b3f2cb2a3492faa7e5d823315342d6a8656d0a6b7b7', type: 'application/wasm', size: 32232419 },
};
const DECODER_WORKER = `
let core = null;
self.onmessage = async ({ data: { id, type, data } }) => {
    try {
        let out = true;
        if (type === 'load') {
            importScripts(data.coreURL);
            core = await self.createFFmpegCore({ mainScriptUrlOrBlob: data.coreURL + '#' + btoa(JSON.stringify({ wasmURL: data.wasmURL, workerURL: '' })) });
            core.setLogger(entry => self.postMessage({ log: entry.message }));
        } else if (type === 'exec') {
            core.setTimeout(-1);
            core.exec(...data.args);
            out = core.ret;
            core.reset();
        } else if (type === 'write') {
            core.FS.writeFile(data.path, data.bytes);
        } else if (type === 'read') {
            out = core.FS.readFile(data.path);
        } else if (type === 'delete') {
            try {
                core.FS.unlink(data.path);
            } catch (error) {
                out = false;
            }
        }
        self.postMessage({ id, ok: true, data: out }, out instanceof Uint8Array ? [out.buffer] : []);
    } catch (error) {
        self.postMessage({ id, ok: false, data: String((error && error.message) || error) });
    }
};
`;
const decoder = { worker: null, ready: null, calls: new Map(), next: 1, log: null, note: null, input: null, name: '', info: null, failed: '', queue: Promise.resolve() };

function readerChoice() {
    const choice = settings().videoReader;
    return choice === 'browser' || choice === 'software' ? choice : 'auto';
}

async function pickReader() {
    const choice = readerChoice();
    if (choice !== 'auto') {
        return choice;
    }
    try {
        await loadDecoder();
        return 'software';
    } catch (error) {
        console.warn('[Image Search] the built-in video reader could not be loaded, using the browser', error);
        decoder.failed = String(error?.message || error);
        return 'browser';
    }
}

function resetDecoder(reason = 'the video reader stopped') {
    decoder.worker?.terminate();
    decoder.calls.forEach(call => call.reject(new Error(reason)));
    decoder.calls.clear();
    Object.assign(decoder, { worker: null, ready: null, log: null, input: null, name: '', info: null, busy: false });
}

function decoderCall(type, data, transfer = []) {
    return new Promise((resolve, reject) => {
        if (!decoder.worker) {
            reject(new Error('the video reader is not loaded'));
            return;
        }
        const id = decoder.next++;
        decoder.calls.set(id, { resolve, reject });
        decoder.worker.postMessage({ id, type, data }, transfer);
    });
}

async function decoderAsset(name, onShare = null) {
    const file = DECODER_FILES[name];
    const checked = !String(settings().decoderUrl || '').trim() && Boolean(globalThis.crypto?.subtle);
    const store = typeof caches === 'object' ? await caches.open('stis-video-reader').catch(() => null) : null;
    const errors = [];
    const bases = [];
    for (const base of decoderBases()) {
        const held = store ? await store.match(`${base}${name}`).catch(() => null) : null;
        bases[held ? 'unshift' : 'push'](base);
    }
    for (const base of bases) {
        const url = `${base}${name}`;
        try {
            let response = store ? await store.match(url).catch(() => null) : null;
            const kept = Boolean(response);
            if (!response) {
                response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`answered ${response.status}`);
                }
            }
            const chunks = [];
            const stream = response.body?.getReader?.();
            if (stream) {
                let got = 0;
                for (;;) {
                    const { done, value } = await stream.read();
                    if (done) {
                        break;
                    }
                    chunks.push(value);
                    got += value.length;
                    onShare?.(Math.min(1, got / file.size), kept);
                }
            } else {
                chunks.push(new Uint8Array(await response.arrayBuffer()));
            }
            const blob = new Blob(chunks, { type: file.type });
            if (checked) {
                const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map(byte => byte.toString(16).padStart(2, '0')).join('');
                if (digest !== file.hash) {
                    await store?.delete(url).catch(() => {});
                    throw new Error('sent a file that is not the expected one');
                }
            }
            if (store && !kept) {
                await store.put(url, new Response(blob, { headers: { 'Content-Type': file.type } })).catch(() => {});
            }
            return URL.createObjectURL(blob);
        } catch (error) {
            errors.push(`${hostOf(url)} ${error?.message || error}`);
        }
    }
    throw new Error(errors.join('; '));
}

function loadDecoder() {
    if (!decoder.ready) {
        decoder.ready = (async () => {
            decoder.note?.('Loading the video reader…');
            const coreURL = await decoderAsset('ffmpeg-core.js');
            const wasmURL = await decoderAsset('ffmpeg-core.wasm', (share, kept) => decoder.note?.(kept ? 'Loading the video reader…' : `Downloading the video reader (32 MB, only the first time)… ${Math.round(share * 100)}%`));
            const worker = new Worker(URL.createObjectURL(new Blob([DECODER_WORKER], { type: 'text/javascript' })));
            worker.onmessage = ({ data }) => {
                if (data.log !== undefined) {
                    decoder.log?.(String(data.log));
                    return;
                }
                const call = decoder.calls.get(data.id);
                if (!call) {
                    return;
                }
                decoder.calls.delete(data.id);
                if (data.ok) {
                    call.resolve(data.data);
                } else {
                    call.reject(new Error(data.data));
                }
            };
            worker.onerror = event => resetDecoder(event.message || 'the video reader stopped');
            decoder.worker = worker;
            await decoderCall('load', { coreURL, wasmURL });
        })().catch(error => {
            resetDecoder();
            throw new Error(`Could not get the video reader (it is downloaded once, 32 MB): ${error?.message || error}`);
        });
    }
    return decoder.ready;
}

let decoderIdle = null;

function idleDecoder(wait = 90000) {
    clearTimeout(decoderIdle);
    decoderIdle = setTimeout(() => {
        if (decoder.worker && !decoder.calls.size && !decoder.busy) {
            resetDecoder('the video reader was closed to free memory');
        }
    }, wait);
}

function decoderTask(task) {
    clearTimeout(decoderIdle);
    const wrapped = async () => {
        decoder.busy = true;
        try {
            return await task();
        } finally {
            decoder.busy = false;
            idleDecoder();
        }
    };
    const run = decoder.queue.then(wrapped, wrapped);
    decoder.queue = run.catch(() => {});
    return run;
}

async function decoderRun(args, onLine = null) {
    const lines = [];
    let watchdog = null;
    const alive = () => {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => resetDecoder('the video reader stopped answering (the phone may be short of memory)'), 60000);
    };
    decoder.log = line => {
        alive();
        lines.push(line);
        onLine?.(line);
    };
    alive();
    try {
        const code = await decoderCall('exec', { args });
        return { code, lines };
    } finally {
        clearTimeout(watchdog);
        decoder.log = null;
    }
}

async function decoderInput(source) {
    await loadDecoder();
    if (decoder.input === source && decoder.info) {
        return decoder.info;
    }
    if (decoder.name) {
        await decoderCall('delete', { path: decoder.name });
    }
    Object.assign(decoder, { input: null, name: '', info: null });
    const blob = typeof source === 'string' ? await videoCopy(source) : source;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const name = bytes[0] === 0x1A && bytes[1] === 0x45 ? 'in.webm' : 'in.mp4';
    await decoderCall('write', { path: name, bytes }, [bytes.buffer]);
    decoder.name = name;
    const { lines } = await decoderRun(['-hide_banner', '-i', name]);
    const text = lines.join('\n');
    const length = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    const size = text.match(/Video:[^\n]*?\b(\d{2,5})x(\d{2,5})\b/);
    const codec = (text.match(/Video:\s*([a-z0-9_]+)/i) || [])[1] || '';
    if (!size) {
        throw new Error('the video reader found no picture in this file');
    }
    decoder.input = source;
    decoder.info = { duration: length ? Number(length[1]) * 3600 + Number(length[2]) * 60 + Number(length[3]) : 0, width: Number(size[1]), height: Number(size[2]), codec: codec.toLowerCase() };
    return decoder.info;
}

function decoderClock(line) {
    const time = line.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
    return time ? Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]) : null;
}

function softScan(url, onProgress = null, stopped = null) {
    return decoderTask(async () => {
        const started = Date.now();
        const info = await decoderInput(url);
        const fps = info.duration > 180 ? 15 : info.duration > 60 ? 20 : 30;
        const width = 160;
        const height = Math.max(2, Math.round(width * info.height / info.width / 2) * 2);
        const graph = `[0:v]fps=${fps},split=2[a][b];[a]scale=${SCAN_SIDE}:${SCAN_SIDE}:flags=area,format=rgb24[c];[b]fps=2,scale=${width}:${height},format=rgba[s]`;
        let halted = false;
        let run = null;
        try {
            run = await decoderRun(['-hide_banner', '-i', decoder.name, '-an', '-filter_complex', graph, '-map', '[c]', '-f', 'rawvideo', 'cells.raw', '-map', '[s]', '-f', 'rawvideo', 'stills.raw'], line => {
                if (!halted && stopped?.()) {
                    halted = true;
                    resetDecoder('stopped');
                    return;
                }
                const time = decoderClock(line);
                if (time !== null && info.duration) {
                    onProgress?.(Math.min(1, time / info.duration));
                }
            });
        } catch (error) {
            throw halted ? new Error('stopped') : error;
        }
        const cells = await decoderCall('read', { path: 'cells.raw' });
        const pictures = await decoderCall('read', { path: 'stills.raw' });
        await decoderCall('delete', { path: 'cells.raw' });
        await decoderCall('delete', { path: 'stills.raw' });
        const size = SCAN_SIDE * SCAN_SIDE * 3;
        const samples = [];
        for (let i = 0; (i + 1) * size <= cells.length; i++) {
            samples.push({ time: i / fps, cells: cells.subarray(i * size, (i + 1) * size) });
        }
        if (!samples.length) {
            throw new Error(`the video reader could not read this video: ${run.lines.slice(-2).join(' ')}`);
        }
        const stills = [];
        for (let i = 0; (i + 1) * width * height * 4 <= pictures.length; i++) {
            stills.push({ time: i / 2, url: pixelsToUrl(pictures.subarray(i * width * height * 4, (i + 1) * width * height * 4), width, height) });
        }
        const first = samples[0].cells;
        const moving = samples.some(sample => sample.cells.some((value, i) => Math.abs(value - first[i]) > 12));
        return { duration: info.duration || samples.length / fps, step: 1 / fps, samples, stills, moving, how: 'built-in reader', ms: Date.now() - started };
    });
}

function softGif(url, start, end, { fps = 10, width = 480 } = {}, onProgress = null) {
    return decoderTask(async () => {
        const info = await decoderInput(url);
        const total = info.duration || end;
        const from = Math.max(0, Math.min(start, Math.max(0, total - 0.1)));
        const length = Math.max(0.05, Math.min(total, end) - from);
        const rate = Math.min(fps, 600 / length);
        const count = Math.max(1, Math.round(length * rate));
        let w = Math.min(width, info.width);
        const bytes = w * (info.height * w / info.width) * 1.5 * count;
        const budget = 150 * 1048576;
        if (bytes > budget) {
            w *= Math.sqrt(budget / bytes);
        }
        w = Math.max(2, Math.round(w / 2) * 2);
        const graph = `[0:v]fps=${Math.round(rate * 1000) / 1000},scale=${w}:-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`;
        let frames = 0;
        const run = await decoderRun(['-hide_banner', '-ss', from.toFixed(3), '-t', length.toFixed(3), '-i', decoder.name, '-an', '-filter_complex', graph, '-loop', '0', '-f', 'gif', 'out.gif'], line => {
            const made = line.match(/frame=\s*(\d+)/);
            if (made) {
                frames = Number(made[1]);
            }
            const time = decoderClock(line);
            if (time !== null) {
                onProgress?.(Math.min(1, time / length));
            }
        });
        const data = await decoderCall('read', { path: 'out.gif' }).catch(() => null);
        await decoderCall('delete', { path: 'out.gif' });
        if (!data?.length) {
            throw new Error(`the video reader could not make the GIF: ${run.lines.slice(-2).join(' ')}`);
        }
        onProgress?.(1);
        return { blob: new Blob([data], { type: 'image/gif' }), frames: frames || count, width: w, height: Math.round(info.height * w / info.width / 2) * 2, how: 'built-in reader' };
    });
}

function softStill(url, time, width = 160) {
    return decoderTask(async () => {
        const info = await decoderInput(url);
        const height = Math.max(2, Math.round(width * info.height / info.width / 2) * 2);
        await decoderRun(['-hide_banner', '-ss', Math.max(0, time).toFixed(3), '-i', decoder.name, '-an', '-frames:v', '1', '-vf', `scale=${width}:${height}`, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'still.raw']);
        const data = await decoderCall('read', { path: 'still.raw' }).catch(() => null);
        await decoderCall('delete', { path: 'still.raw' });
        return data?.length >= width * height * 4 ? pixelsToUrl(data.subarray(0, width * height * 4), width, height) : '';
    });
}

async function partStill(url, player, time) {
    if (await pickReader() === 'software') {
        return softStill(url, time);
    }
    return Math.abs((Number(player.currentTime) || 0) - time) < 0.6 ? videoStill(player) : '';
}

async function clipMaker(url) {
    const reader = await pickReader();
    let open = null;
    return {
        async make(start, end, options, onProgress) {
            if (reader === 'software') {
                return softGif(url, start, end, options, onProgress);
            }
            open = open || await openVideo(url);
            return gifFromOpen(open, start, end, options, onProgress);
        },
        close() {
            open?.close();
        },
    };
}

async function videoToGif(url, { start = 0, seconds = 6, fps = 10, width = 480 } = {}, onProgress = null) {
    const maker = await clipMaker(url);
    try {
        return await maker.make(start, start + seconds, { fps, width }, onProgress);
    } finally {
        maker.close();
    }
}

function gifOptions() {
    const s = settings();
    const clamp = (value, min, max, fallback) => Math.min(max, Math.max(min, Number(value) || fallback));
    return { fps: clamp(s.gifFps, 2, 30, 10), width: clamp(s.gifWidth, 120, 1280, 480) };
}

async function makePartGifs(url, parts, onProgress = null, onPart = null) {
    const maker = await clipMaker(url);
    try {
        for (let i = 0; i < parts.length; i++) {
            try {
                const made = await maker.make(parts[i].start, parts[i].end, gifOptions(), share => onProgress?.(i, share));
                onPart?.(i, made, null);
            } catch (error) {
                onPart?.(i, null, error);
            }
        }
    } finally {
        maker.close();
    }
}

const SCAN_SIDE = 20;

function frameCells(data, width, height) {
    const cells = new Uint8Array(SCAN_SIDE * SCAN_SIDE * 3);
    for (let cy = 0; cy < SCAN_SIDE; cy++) {
        const y0 = Math.floor(cy * height / SCAN_SIDE);
        const y1 = Math.max(y0 + 1, Math.floor((cy + 1) * height / SCAN_SIDE));
        for (let cx = 0; cx < SCAN_SIDE; cx++) {
            const x0 = Math.floor(cx * width / SCAN_SIDE);
            const x1 = Math.max(x0 + 1, Math.floor((cx + 1) * width / SCAN_SIDE));
            let red = 0;
            let green = 0;
            let blue = 0;
            let n = 0;
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    const i = (y * width + x) * 4;
                    red += data[i];
                    green += data[i + 1];
                    blue += data[i + 2];
                    n++;
                }
            }
            const at = (cy * SCAN_SIDE + cx) * 3;
            cells[at] = Math.round(red / n);
            cells[at + 1] = Math.round(green / n);
            cells[at + 2] = Math.round(blue / n);
        }
    }
    return cells;
}

async function scanVideo(url, onProgress = null, stopped = null) {
    return await pickReader() === 'software' ? softScan(url, onProgress, stopped) : browserScan(url, onProgress, stopped);
}

async function browserScan(url, onProgress = null, stopped = null) {
    const started = Date.now();
    const open = await openVideo(url);
    try {
        const { video, duration } = open;
        if (!duration) {
            throw new Error('the length of the video is unknown');
        }
        const width = 160;
        const height = Math.max(1, Math.round(width * (video.videoHeight || 9) / (video.videoWidth || 16)));
        const rate = duration > 180 ? 4 : duration > 60 ? 3 : 2;
        const step = 1 / (duration > 180 ? 15 : duration > 60 ? 20 : 30);
        let samples = [];
        let stills = [];
        let nextStill = 0;
        const { how, method, moving } = await readFrames(video, { from: 0, to: duration, step, rate, seekStep: 1 / 8, width, height }, () => {
            samples = [];
            stills = [];
            nextStill = 0;
        }, (time, data) => {
            samples.push({ time, cells: frameCells(data, width, height) });
            if (time >= nextStill) {
                stills.push({ time, url: pixelsToUrl(data, width, height) });
                nextStill = time + 0.5;
            }
        }, onProgress, stopped);
        return { duration, step: how === 'seeking' ? 1 / 8 : step, samples, stills, moving, how: `${how}, ${method}`, ms: Date.now() - started };
    } finally {
        open.close();
    }
}

function frameGap(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const gap = a[i] > b[i] ? a[i] - b[i] : b[i] - a[i];
        if (gap > 5) {
            sum += gap - 5;
        }
    }
    return sum * 3 / a.length;
}

function medianOf(values) {
    if (!values.length) {
        return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

function splitVideo(scan, { maxPart = 6, sense = 3, maxParts = 8, repeats = 3 } = {}) {
    const { duration } = scan;
    const samples = [...(scan.samples || [])].sort((a, b) => a.time - b.time);
    if (samples.length < 2 || !duration) {
        return { parts: [], loops: 0, cuts: 0, bursts: 0, dropped: 0, longest: maxPart, skipped: [] };
    }
    const spacing = medianOf(samples.slice(1).map((sample, i) => sample.time - samples[i].time));
    const step = Math.max(Number(scan.step) || 0, spacing, Math.sqrt(duration * 0.000029), 0.01);
    const count = Math.max(2, Math.ceil(duration / step - 0.001));
    const grid = [];
    for (let k = 0, j = 0; k < count; k++) {
        const time = k * step;
        while (j + 1 < samples.length && samples[j + 1].time <= time) {
            j++;
        }
        const one = samples[j];
        const two = samples[j + 1];
        if (!two || one.time >= time || two.time - one.time > step * 3) {
            grid.push(two && Math.abs(two.time - time) < Math.abs(one.time - time) ? two.cells : one.cells);
            continue;
        }
        const share = (time - one.time) / (two.time - one.time);
        if (share < 0.02) {
            grid.push(one.cells);
            continue;
        }
        const mixed = new Uint8Array(one.cells.length);
        for (let i = 0; i < mixed.length; i++) {
            mixed[i] = one.cells[i] + (two.cells[i] - one.cells[i]) * share + 0.5;
        }
        grid.push(mixed);
    }
    const ratio = [0.2, 0.27, 0.35, 0.45, 0.55][Math.min(5, Math.max(1, Math.round(Number(sense) || 3))) - 1];
    const hold = ratio + 0.2;
    const floor = 0.06;
    const minLag = Math.max(2, Math.round(0.25 / step));
    const maxLag = Math.max(minLag, Math.min(count - 1, Math.round(6 / step)));
    const width = maxLag + 1;
    const raw = new Float32Array(count * width);
    for (let k = 1; k < count; k++) {
        const top = Math.min(maxLag, k);
        for (let lag = 1; lag <= top; lag++) {
            raw[k * width + lag] = frameGap(grid[k], grid[k - lag]);
        }
    }
    const half = Math.max(1, Math.round(0.35 / step));
    const smooth = new Float32Array(count * width).fill(Infinity);
    const sums = new Float64Array(count + 1);
    for (let lag = 1; lag <= maxLag; lag++) {
        sums[lag] = 0;
        for (let k = lag; k < count; k++) {
            sums[k + 1] = sums[k] + raw[k * width + lag];
        }
        for (let k = lag; k < count; k++) {
            const from = Math.max(lag, k - half);
            const to = Math.min(count - 1, k + half);
            smooth[k * width + lag] = (sums[to + 1] - sums[from]) / (to - from + 1);
        }
    }
    const peakBelow = (k, lag) => {
        let peak = 0;
        for (let l = 1; l < lag; l++) {
            peak = Math.max(peak, smooth[k * width + l]);
        }
        return peak;
    };
    const candidate = k => {
        const top = Math.min(maxLag, k);
        let peak = peakBelow(k, Math.min(minLag, top + 1));
        for (let lag = minLag; lag <= top; lag++) {
            const value = smooth[k * width + lag];
            if (peak >= floor && value <= ratio * peak) {
                let low = lag;
                while (low < top && smooth[k * width + low + 1] < smooth[k * width + low]) {
                    low++;
                }
                for (const divide of [3, 2]) {
                    const part = Math.round(low / divide);
                    if (part < minLag) {
                        continue;
                    }
                    for (let l = Math.max(minLag, part - 1); l <= part + 1; l++) {
                        if (smooth[k * width + l] <= hold * peakBelow(k, l) && peakBelow(k, l) >= floor) {
                            return { lag: l, peak: peakBelow(k, l) };
                        }
                    }
                }
                return { lag: low, peak: peakBelow(k, low) };
            }
            peak = Math.max(peak, value);
        }
        return null;
    };
    const runs = [];
    const close = run => {
        if (run && run.b - run.a + 1 >= Math.max(minLag, run.first * 0.8)) {
            runs.push(run);
        }
    };
    let run = null;
    for (let k = 1; k < count; k++) {
        if (run) {
            let best = Infinity;
            let bestLag = run.lag;
            for (let lag = Math.max(minLag, run.lag - 1); lag <= Math.min(maxLag, k, run.lag + 1); lag++) {
                if (smooth[k * width + lag] < best) {
                    best = smooth[k * width + lag];
                    bestLag = lag;
                }
            }
            const peak = peakBelow(k, bestLag);
            const drifted = Math.abs(bestLag - run.first) > Math.max(1.5, run.first * 0.2);
            if (!drifted && peak >= floor * 0.5 && best <= hold * peak) {
                run.b = k;
                run.lag = bestLag;
                run.lags.push(bestLag);
                run.peaks.push(peak);
                continue;
            }
            close(run);
            run = null;
        }
        const found = candidate(k);
        if (found) {
            run = { a: k, b: k, lag: found.lag, first: found.lag, lags: [found.lag], peaks: [found.peak] };
        }
    }
    close(run);
    const loops = [];
    for (const item of runs) {
        const lag = Math.round(medianOf(item.lags));
        const level = hold * medianOf(item.peaks);
        const near = k => {
            let best = Infinity;
            for (let l = Math.max(1, lag - 1); l <= Math.min(maxLag, k, lag + 1); l++) {
                best = Math.min(best, raw[k * width + l]);
            }
            return best;
        };
        let { a, b } = item;
        const edge = loops.length ? loops[loops.length - 1].end : 0;
        while (b + 1 < count && (near(b + 1) <= level || (b + 2 < count && near(b + 2) <= level))) {
            b++;
        }
        while (a - 1 >= Math.max(lag, edge) && (near(a - 1) <= level || (a - 2 >= Math.max(lag, edge) && near(a - 2) <= level))) {
            a--;
        }
        let before = 0;
        let at = 0;
        let after = 0;
        for (let k = a; k <= b; k++) {
            if (lag > 1 && lag + 1 <= Math.min(maxLag, k)) {
                before += smooth[k * width + lag - 1];
                at += smooth[k * width + lag];
                after += smooth[k * width + lag + 1];
            }
        }
        const bend = before - 2 * at + after;
        const period = lag + (bend > 0 ? Math.max(-0.5, Math.min(0.5, (before - after) / (2 * bend))) : 0);
        const start = Math.max(loops.length ? loops[loops.length - 1].end : 0, a - Math.round(period));
        if (b + 1 - start >= period * 1.5) {
            loops.push({ start, end: b + 1, period, change: '' });
        }
    }
    const sameMotion = (one, two) => {
        const first = grid.slice(one.start, one.start + Math.round(one.period));
        const second = grid.slice(two.start + Math.min(Math.round(two.period), Math.max(0, two.end - two.start - Math.round(two.period))), two.start + Math.min(two.end - two.start, Math.round(two.period * 2)));
        if (!first.length || !second.length) {
            return false;
        }
        const reach = Math.max(...first.map(frame => frameGap(frame, first[0])));
        const level = Math.max(0.1, reach * 0.45);
        const alike = second.filter(frame => Math.min(...first.map(other => frameGap(frame, other))) <= level).length;
        return alike >= second.length * 0.7;
    };
    for (let i = loops.length - 1; i > 0; i--) {
        const one = loops[i - 1];
        const two = loops[i];
        if (two.start - one.end > Math.max(1, Math.round(Math.max(one.period, two.period))) || !sameMotion(one, two)) {
            continue;
        }
        const [short, long] = one.period <= two.period ? [one.period, two.period] : [two.period, one.period];
        const times = Math.round(long / short);
        if (Math.abs(long - short * times) <= Math.max(0.6, long * 0.12) && times <= 3) {
            one.end = two.end;
            one.period = short;
            loops.splice(i, 1);
        } else {
            two.change = two.period < one.period ? 'faster' : 'slower';
        }
    }
    const patchGap = (one, two) => {
        if (!one || !two || one.length !== SCAN_SIDE * SCAN_SIDE * 3 || two.length !== one.length) {
            return 0;
        }
        let worst = 0;
        for (let py = 0; py < SCAN_SIDE; py += 2) {
            for (let px = 0; px < SCAN_SIDE; px += 2) {
                let sum = 0;
                for (let y = py; y < py + 2; y++) {
                    for (let x = px; x < px + 2; x++) {
                        for (let c = 0; c < 3; c++) {
                            const i = (y * SCAN_SIDE + x) * 3 + c;
                            sum += one[i] > two[i] ? one[i] - two[i] : two[i] - one[i];
                        }
                    }
                }
                worst = Math.max(worst, sum / 12);
            }
        }
        return worst;
    };
    for (let i = 0; i < loops.length; i++) {
        const loop = loops[i];
        const lag = Math.max(1, Math.round(loop.period));
        const gapAt = k => {
            let best = Infinity;
            for (let l = Math.max(1, lag - 1); l <= lag + 1 && k - l >= loop.start; l++) {
                best = Math.min(best, patchGap(grid[k], grid[k - l]));
            }
            return best === Infinity ? 0 : best;
        };
        const first = [];
        for (let k = loop.start + lag; k < Math.min(loop.end, loop.start + 2 * lag); k++) {
            first.push(gapAt(k));
        }
        const limit = Math.max(30, 2 * medianOf(first) + 10);
        const need = Math.max(2, Math.round(loop.period * 0.3));
        let run = 0;
        for (let k = loop.start + 2 * lag; k < loop.end; k++) {
            run = gapAt(k) > limit ? run + 1 : 0;
            if (run >= need) {
                const cut = k - run + 1;
                const rest = { start: cut, end: loop.end, period: loop.period, change: 'with something changed' };
                loop.end = cut;
                loops.splice(i + 1, 0, rest);
                break;
            }
        }
    }
    for (let i = loops.length - 1; i >= 0; i--) {
        const loop = loops[i];
        if (loop.end - loop.start < loop.period * 2.6 || (loop.end - loop.start) * step < 2) {
            if (loops[i + 1]) {
                loops[i + 1].change = '';
            }
            loops.splice(i, 1);
        }
    }
    const light = grid.map(frame => {
        let sum = 0;
        for (let i = 0; i < frame.length; i++) {
            sum += frame[i];
        }
        return sum / frame.length;
    });
    const soft = light.map((value, k) => (light[Math.max(0, k - 1)] + value + light[Math.min(count - 1, k + 1)]) / 3);
    const darkLevel = 18;
    const ramp = Math.round(3 / step);
    const skip = new Array(count).fill(false);
    const fadeFrom = (k, way) => {
        let edge = k;
        while (Math.abs(edge - k) < ramp) {
            const next = edge + way;
            if (next < 0 || next >= count || soft[next] - soft[edge] <= 0.25) {
                break;
            }
            edge = next;
        }
        if (edge === k) {
            return k;
        }
        const [a, b] = way < 0 ? [edge, k] : [k, edge];
        let jump = 0;
        for (let i = a + 1; i <= b; i++) {
            jump = Math.max(jump, Math.abs(light[i] - light[i - 1]));
        }
        const drop = Math.abs(light[edge] - light[k]);
        return drop > 25 && jump <= drop * 0.45 && Math.abs(edge - k) * step >= 0.25 ? edge : k;
    };
    for (let k = 0; k < count;) {
        if (light[k] >= darkLevel) {
            k++;
            continue;
        }
        let e = k;
        while (e < count && light[e] < darkLevel) {
            e++;
        }
        if (k === 0 || e === count || (e - k) * step >= 0.3) {
            const from = k > 0 ? fadeFrom(k, -1) : 0;
            const to = e < count ? fadeFrom(e - 1, 1) + 1 : count;
            for (let i = from; i < to; i++) {
                skip[i] = true;
            }
        }
        k = e;
    }
    for (const loop of loops) {
        while (loop.end > loop.start && skip[loop.end - 1]) {
            loop.end--;
        }
        while (loop.start < loop.end && skip[loop.start]) {
            loop.start++;
        }
    }
    const motion = grid.map((frame, k) => (k ? raw[k * width + 1] : 0));
    const cutLevel = Math.max(12, medianOf(motion.slice(1)) * 5);
    const cuts = [];
    motion.forEach((value, k) => {
        if (k && !skip[k] && !skip[k - 1] && value >= cutLevel && value >= 3 * Math.max(k > 1 ? motion[k - 1] : 0, k + 1 < count ? motion[k + 1] : 0) && !loops.some(loop => k > loop.start && k < loop.end)) {
            cuts.push(k);
        }
    });
    const burstGap = Math.round(1.5 / step);
    const bursts = [];
    for (let i = 0; i < cuts.length;) {
        let j = i;
        while (j + 1 < cuts.length && cuts[j + 1] - cuts[j] <= burstGap) {
            j++;
        }
        if (j - i + 1 >= 3) {
            let to = Math.min(count, cuts[j] + Math.round(1 / step));
            while (to > cuts[j] + 1 && skip[to - 1]) {
                to--;
            }
            bursts.push({ from: cuts[i], to, cuts: j - i + 1 });
        }
        i = j + 1;
    }
    const inBurst = k => bursts.find(burst => k >= burst.from && k < burst.to);
    const marksCut = cuts.filter(k => !inBurst(k) || inBurst(k).from === k);
    const calmSpan = Math.max(1, Math.round(0.5 / step));
    const quiet = grid.map((frame, k) => {
        if (!k) {
            return false;
        }
        let top = 0;
        for (let lag = 1; lag <= Math.min(calmSpan, k); lag++) {
            top = Math.max(top, raw[k * width + lag]);
        }
        return top < 0.02;
    });
    const stillMarks = [];
    for (let k = 1, from = -1; k <= count; k++) {
        if (k < count && quiet[k]) {
            from = from < 0 ? k : from;
        } else if (from >= 0) {
            if ((k - from) * step >= 1) {
                stillMarks.push(Math.max(0, from - calmSpan), k);
            }
            from = -1;
        }
    }
    const tiny = Math.max(1, Math.round(0.4 / step));
    const shortest = Math.max(tiny, Math.round(1.5 / step));
    const burstMarks = bursts.map(burst => burst.to);
    const build = limit => {
        const pieces = [];
        const piecesOf = (a, b) => {
            const marks = [...new Set([a, ...marksCut.filter(k => k > a && k < b), ...burstMarks.filter(k => k > a && k < b), ...stillMarks.filter(k => k > a && k < b), b])].sort((x, y) => x - y);
            for (let i = 0; i + 1 < marks.length; i++) {
                const x = marks[i];
                const y = marks[i + 1];
                const burst = inBurst(x);
                const calm = quiet.slice(Math.max(1, x), y);
                const kind = burst ? 'burst' : calm.length && calm.filter(Boolean).length >= calm.length * 0.6 ? 'still' : cuts.includes(x) ? 'cut' : 'action';
                if (kind === 'still') {
                    pieces.push({ start: x, end: y, kind });
                    continue;
                }
                const chunks = Math.max(1, Math.ceil((y - x) * step / Math.max(1, limit) - 0.001));
                for (let c = 0; c < chunks; c++) {
                    const from = x + Math.round((y - x) * c / chunks);
                    const to = x + Math.round((y - x) * (c + 1) / chunks);
                    if (to > from) {
                        pieces.push({ start: from, end: to, kind: c && kind === 'cut' ? 'action' : kind });
                    }
                }
            }
        };
        const gap = (a, b) => {
            for (let k = a; k < b;) {
                if (skip[k]) {
                    k++;
                    continue;
                }
                let e = k;
                while (e < b && !skip[e]) {
                    e++;
                }
                piecesOf(k, e);
                k = e;
            }
        };
        let cursor = 0;
        for (const loop of loops) {
            if (loop.start > cursor) {
                gap(cursor, loop.start);
            }
            if (loop.end > loop.start) {
                pieces.push({ ...loop, kind: 'loop' });
            }
            cursor = Math.max(cursor, loop.end);
        }
        if (cursor < count) {
            gap(cursor, count);
        }
        for (let changed = true; changed;) {
            changed = false;
            for (let i = 0; i < pieces.length; i++) {
                const piece = pieces[i];
                if (piece.kind === 'loop' || piece.end - piece.start >= shortest) {
                    continue;
                }
                const left = pieces[i - 1]?.kind !== 'loop' && pieces[i - 1]?.end === piece.start ? pieces[i - 1] : null;
                const right = pieces[i + 1]?.kind !== 'loop' && pieces[i + 1]?.start === piece.end ? pieces[i + 1] : null;
                const into = left && right ? (left.end - left.start <= right.end - right.start ? left : right) : left || right;
                if (into) {
                    const kinds = into === left ? [left.kind, piece.kind] : [piece.kind, right.kind];
                    into.start = Math.min(into.start, piece.start);
                    into.end = Math.max(into.end, piece.end);
                    into.kind = kinds.includes('burst') ? 'burst' : kinds[0] === 'cut' ? 'cut' : kinds.every(kind => kind === 'still') ? 'still' : 'action';
                } else if (piece.end - piece.start >= tiny) {
                    continue;
                }
                pieces.splice(i, 1);
                changed = true;
                i--;
            }
        }
        return pieces;
    };
    let longest = Math.max(1, maxPart);
    let pieces = build(longest);
    for (const factor of [1.5, 2, 3, 5]) {
        if (pieces.length <= maxParts || longest >= 30) {
            break;
        }
        longest = Math.min(30, Math.max(1, maxPart) * factor);
        pieces = build(longest);
    }
    const seconds = piece => (piece.end - piece.start) * step;
    let dropped = 0;
    while (pieces.length > maxParts) {
        let pick = 0;
        pieces.forEach((piece, i) => {
            if (seconds(piece) < seconds(pieces[pick])) {
                pick = i;
            }
        });
        pieces.splice(pick, 1);
        dropped++;
    }
    const round = value => Math.round(value * 1000) / 1000;
    const region = piece => [round(piece.start * step), round(Math.min(duration, piece.end * step))];
    const loopPart = piece => {
        const cycles = (piece.end - piece.start) / piece.period;
        const shown = Math.max(1, Math.min(Math.round(Number(repeats) || 3), Math.floor(cycles + 0.05), Math.floor(Math.max(1, maxPart) / (piece.period * step) + 0.001)));
        return { start: round(piece.start * step), end: round(Math.min(duration, (piece.start + piece.period * shown) * step)), kind: 'loop', cycles: Math.max(2, Math.round(cycles)), shown, period: round(piece.period * step), change: piece.change, region: region(piece) };
    };
    const parts = pieces.map(piece => (piece.kind === 'loop'
        ? loopPart(piece)
        : piece.kind === 'still' && (piece.end - piece.start) * step > 1.5
            ? { start: round(piece.start * step), end: round(Math.min(duration, piece.start * step + 1.5)), kind: 'still', region: region(piece) }
            : piece.kind === 'burst'
                ? { start: round(piece.start * step), end: round(Math.min(duration, piece.end * step)), kind: 'burst', cuts: cuts.filter(k => k >= piece.start && k < piece.end).length }
                : { start: round(piece.start * step), end: round(Math.min(duration, piece.end * step)), kind: piece.kind }));
    const skipped = [];
    for (let k = 0; k < count; k++) {
        if (skip[k] && (!k || !skip[k - 1])) {
            let e = k;
            while (e < count && skip[e]) {
                e++;
            }
            skipped.push([round(k * step), round(Math.min(duration, e * step))]);
        }
    }
    return { parts, loops: parts.filter(part => part.kind === 'loop').length, cuts: parts.filter(part => part.kind === 'cut').length, bursts: parts.filter(part => part.kind === 'burst').length, dropped, longest, skipped };
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

const SHEET_FRAMES = 4;

function maxPictures() {
    return Math.max(1, Math.min(16, Math.round(Number(settings().maxPictures) || 8)));
}

async function frameSheets(images, maxSide = 768) {
    const sheets = [];
    for (let start = 0; start < images.length; start += SHEET_FRAMES) {
        sheets.push(await frameSheet(images.slice(start, start + SHEET_FRAMES), maxSide, start));
    }
    return sheets;
}

function sheetWords(count, sheets) {
    return sheets > 1
        ? `${sheets} pictures holding ${count} moments, numbered 1 to ${count} in order across the pictures (picture 1 has moments 1 to ${Math.min(SHEET_FRAMES, count)}, picture 2 the next ones, and so on; in each picture left to right, then top to bottom)`
        : `one picture with ${count} moments, numbered 1 to ${count} (left to right, then top to bottom)`;
}

async function frameSheet(images, maxSide = 768, start = 0) {
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
        context.fillRect(x, y, font * (start + index >= 9 ? 2.1 : 1.5), font * 1.3);
        context.fillStyle = '#ffffff';
        context.font = `bold ${font}px sans-serif`;
        context.textBaseline = 'top';
        context.fillText(String(start + index + 1), x + font * 0.3, y + font * 0.15);
    });
    return canvas.toDataURL('image/jpeg', 0.85);
}

async function animationFrames(url, blob = null, most = 0, options = {}) {
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
        const sheetsAllowed = s.gifSheet ? maxPictures() * SHEET_FRAMES : maxPictures();
        const clip = options.timed ? await clipOf(url, data, decoder, count) : null;
        const wanted = Math.min(count, 32, most || 32, sheetsAllowed, Math.max(1, Math.round(Number(s.gifFrames) || 3)), clip ? framesForLength(clip.seconds) : 32);
        const size = Math.min(2048, Math.max(128, Number(s.gifFrameSize) || 768));
        const picks = clip ? timedPicks(clip.delays, wanted) : wanted === 1 ? [0] : [...new Set(Array.from({ length: wanted }, (_, i) => Math.round(i * (count - 1) / (wanted - 1))))];
        if (s.gifSheet && picks.length > 1) {
            const images = [];
            try {
                for (const frameIndex of picks) {
                    images.push((await decoder.decode({ frameIndex })).image);
                }
                const sheet = await frameSheets(images, size);
                sheet.count = images.length;
                sheet.sheet = true;
                sheet.clip = clip;
                Object.assign(sheet, { picks, total: count, times: clip ? picks.map(pick => frameStarts(clip.delays)[pick]) : null });
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
        frames.clip = clip;
        Object.assign(frames, { picks, total: count, times: clip ? picks.map(pick => frameStarts(clip.delays)[pick]) : null });
        return frames;
    } finally {
        decoder.close?.();
    }
}

const GIF_FRAMES_PER_SECOND = 2;
const clipInfo = new Map();

function gifDelays(bytes) {
    if (!bytes || bytes.length < 13 || bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) {
        return null;
    }
    let at = 13;
    if (bytes[10] & 0x80) {
        at += 3 * (2 ** ((bytes[10] & 7) + 1));
    }
    const delays = [];
    let delay = 0;
    const skip = () => {
        while (at < bytes.length) {
            const size = bytes[at];
            at += 1;
            if (!size) {
                return;
            }
            at += size;
        }
    };
    while (at < bytes.length) {
        const kind = bytes[at];
        if (kind === 0x21) {
            const label = bytes[at + 1];
            at += 2;
            if (label === 0xf9 && bytes[at] >= 4) {
                delay = bytes[at + 2] | (bytes[at + 3] << 8);
            }
            skip();
        } else if (kind === 0x2c) {
            const local = bytes[at + 9];
            at += 10;
            if (local & 0x80) {
                at += 3 * (2 ** ((local & 7) + 1));
            }
            at += 1;
            skip();
            delays.push(delay > 1 ? delay / 100 : 0.1);
            delay = 0;
        } else {
            break;
        }
    }
    return delays.length ? delays : null;
}

function frameStarts(delays) {
    const starts = [];
    let time = 0;
    (delays || []).forEach(delay => {
        starts.push(Math.round(time * 10) / 10);
        time += delay;
    });
    return starts;
}

const sentPictures = new Map();

function rememberSent(url, part, view) {
    if (!url || !view?.pictures?.length) {
        return;
    }
    const known = sentPictures.get(url) || {};
    sentPictures.delete(url);
    sentPictures.set(url, { ...known, [part]: { ...view, pictures: [...view.pictures], at: Date.now() } });
    while (sentPictures.size > 12) {
        sentPictures.delete(sentPictures.keys().next().value);
    }
}

function sentView(set) {
    return { pictures: [...set], moments: set.count || set.length, times: set.times || null, picks: set.picks || null, total: set.total || 0, seconds: set.clip?.seconds || 0, loop: Boolean(set.clip?.loop) };
}

function framesForLength(seconds) {
    return Math.max(SHEET_FRAMES, Math.round((Number(seconds) || 0) * GIF_FRAMES_PER_SECOND));
}

function timedPicks(delays, wanted) {
    const starts = [];
    let time = 0;
    delays.forEach(delay => {
        starts.push(time);
        time += delay;
    });
    const last = starts[starts.length - 1] || 0;
    if (wanted <= 1 || starts.length < 2) {
        return [0];
    }
    const picks = [];
    let index = 0;
    for (let i = 0; i < wanted; i++) {
        const target = i * last / (wanted - 1) + 1e-9;
        while (index + 1 < starts.length && starts[index + 1] <= target) {
            index++;
        }
        picks.push(index);
    }
    return [...new Set(picks)];
}

function framePixels(image, side = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext('2d');
    if (!context?.getImageData) {
        return null;
    }
    context.drawImage(image, 0, 0, side, side);
    return context.getImageData(0, 0, side, side).data;
}

function loopsBack(first, last, side = 32) {
    if (!first || !last || first.length !== last.length) {
        return false;
    }
    const block = 4;
    let worst = 0;
    let total = 0;
    let blocks = 0;
    for (let by = 0; by < side; by += block) {
        for (let bx = 0; bx < side; bx += block) {
            let sum = 0;
            for (let y = by; y < by + block; y++) {
                for (let x = bx; x < bx + block; x++) {
                    const i = (y * side + x) * 4;
                    sum += Math.abs(first[i] - last[i]) + Math.abs(first[i + 1] - last[i + 1]) + Math.abs(first[i + 2] - last[i + 2]);
                }
            }
            const gap = sum / (block * block * 3);
            worst = Math.max(worst, gap);
            total += gap;
            blocks += 1;
        }
    }
    return worst <= 10 && total / blocks <= 4;
}

async function clipOf(url, data, decoder, count) {
    if (clipInfo.has(url)) {
        return clipInfo.get(url);
    }
    let delays = null;
    try {
        delays = gifDelays(new Uint8Array(await data.slice(0, 16 * 1024 * 1024).arrayBuffer()));
    } catch (error) {
        delays = null;
    }
    if (!delays || delays.length !== count) {
        delays = Array.from({ length: count }, () => 0.1);
    }
    let loop = false;
    try {
        const first = (await decoder.decode({ frameIndex: 0 })).image;
        const last = (await decoder.decode({ frameIndex: count - 1 })).image;
        try {
            loop = loopsBack(framePixels(first), framePixels(last));
        } finally {
            first.close?.();
            last.close?.();
        }
    } catch (error) {
        loop = false;
    }
    const clip = { seconds: Math.round(delays.reduce((sum, delay) => sum + delay, 0) * 10) / 10, frames: count, delays, loop };
    clipInfo.set(url, clip);
    return clip;
}

function gifNoteText(set, shown, state = null) {
    const seconds = set.clip?.seconds || 0;
    const apart = seconds && set.count > 1 ? Math.round(seconds / set.count * 10) / 10 : 0;
    const loop = state === null ? Boolean(seconds && set.clip.loop) : state === 'loop';
    return fillTemplate(promptPart('gifNote'), { frames: shown, seconds: seconds || '', apart: apart || '', loop: loop ? 'yes' : '', long: seconds >= 5 ? 'yes' : '' });
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

async function uploadImage(picture, name = '') {
    const image = await blobToBase64(picture.blob);
    const upload = await fetchWithin('/api/images/upload', {
        method: 'POST',
        headers: ctx().getRequestHeaders(),
        body: JSON.stringify({ image, format: picture.format, ch_name: 'imagesearch', filename: name || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }),
    }, 180000);
    if (!upload.ok) {
        throw new Error(`SillyTavern could not save the picture (${upload.status}).`);
    }
    const data = await upload.json();
    return `/${String(data.path).replace(/\\/g, '/').replace(/^\/+/, '')}`;
}

const missingFiles = new Map();

function fileMissing(url) {
    if (!url || !String(url).startsWith('/user/')) {
        return Promise.resolve(false);
    }
    if (!missingFiles.has(url)) {
        const check = fetchWithin(url, { method: 'HEAD', cache: 'no-store' }, 15000).then(response => response.status === 404).catch(() => false);
        missingFiles.set(url, check);
        check.then(gone => {
            if (!gone && missingFiles.get(url) === check) {
                missingFiles.delete(url);
            }
        });
    }
    return missingFiles.get(url);
}

async function restoreFile(found, item) {
    if (item.video) {
        throw new Error('This one was made from a video: remove it from the library and make it again.');
    }
    const picture = await prepareDownload(item);
    const old = found.variant?.url || found.entry.url;
    const name = old.split('/').pop();
    const same = old.startsWith('/user/images/imagesearch/') && name.toLowerCase().endsWith(`.${String(picture.format).toLowerCase()}`);
    const src = await uploadImage(picture, same ? name.replace(/\.[^.]+$/, '') : '');
    missingFiles.delete(old);
    missingFiles.delete(src);
    if (src !== old) {
        if (found.variant) {
            found.variant.url = src;
        }
        if (found.entry.url === old) {
            found.entry.url = src;
        }
        descriptions.delete(old);
        await saveLibrary();
    }
    return src;
}

function libraryFile(url) {
    return Boolean(url) && (library.loaded ? urlInUse(url) : String(url).startsWith('/user/images/imagesearch/'));
}

function onMediaDeleted(url) {
    if (!url) {
        return;
    }
    missingFiles.set(url, Promise.resolve(true));
    if (library.loaded && urlInUse(url)) {
        toastr.warning('That picture is in your library, and its file is now gone from the server. To get it back, open it on its site in the picker and tap "Download again".', 'Image Search', { timeOut: 12000 });
    }
}

let mediaDeleteUrls = [];

function watchMediaDelete() {
    const chat = document.getElementById('chat');
    if (!chat || watchMediaDelete.on || typeof MutationObserver === 'undefined') {
        return;
    }
    watchMediaDelete.on = true;
    chat.addEventListener('click', event => {
        const button = event.target?.closest?.('.mes_media_delete');
        if (!button) {
            return;
        }
        const message = (ctx().chat || [])[Number(button.closest('.mes')?.getAttribute('mesid'))];
        mediaDeleteUrls = (Array.isArray(message?.extra?.media) ? message.extra.media : []).map(item => item?.url).filter(Boolean);
    }, true);
    new MutationObserver(records => {
        for (const record of records) {
            record.addedNodes.forEach(node => {
                const box = node.nodeType === 1 ? node.querySelector?.('#delete_media_files_checkbox') : null;
                if (!box || !settings().keepLibraryFiles || !mediaDeleteUrls.some(libraryFile)) {
                    return;
                }
                box.checked = false;
                box.closest('label')?.after(el('small', 'stis-delete-note', 'Unticked by Image Search: this message has a picture from your library. Tick it to delete the file anyway.'));
            });
        }
    }).observe(document.body, { childList: true });
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
    while (downloads.size > 4) {
        downloads.delete(downloads.keys().next().value);
    }
    return promise;
}

async function saveBest(item) {
    try {
        const picture = await prepareDownload(item);
        const src = await uploadImage(picture);
        if (downloads.get(item.img) && !item.video) {
            downloads.delete(item.img);
        }
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
    const labels = 'visual|expression|action|atmosphere|framing|changed|keywords?|description|variant\\s*\\d+|version\\s*\\d+|picture\\s*\\d+|step\\s*\\d+';
    const marks = [...String(raw || '').matchAll(new RegExp(`^[\\s*#>-]*\\**(${labels})\\**\\s*:\\s*(?:\\*\\*\\s*)?`, 'gim'))];
    const sections = {};
    const variants = {};
    let keywords = [];
    let changed = '';
    const source = String(raw || '');
    let plain = marks.length ? source.slice(0, marks[0].index) : source;
    marks.forEach((mark, index) => {
        const label = mark[1].toLowerCase().replace(/\s+/g, ' ');
        const end = index + 1 < marks.length ? marks[index + 1].index : source.length;
        const content = source.slice(mark.index + mark[0].length, end).replace(/\s+/g, ' ').trim();
        if (label.startsWith('keyword')) {
            keywords = parseKeywords(content);
        } else if (label === 'changed') {
            changed = content.slice(0, 500);
        } else if (label === 'description') {
            plain += ` ${content}`;
        } else if (/^(variant|version|picture|step) \d+$/.test(label)) {
            variants[Number(label.split(' ')[1])] = content.slice(0, 500);
        } else if (content) {
            sections[label] = content.slice(0, 700);
        }
    });
    const lead = String(plain).replace(/\s+/g, ' ').trim();
    if (lead && Object.keys(sections).length && !/^(sure|okay|ok|certainly|of course|here('s| is| are))\b/i.test(lead) && lead.length <= 600) {
        sections.visual = sections.visual ? `${lead.replace(/[:\s]+$/, ':')} ${sections.visual}`.slice(0, 900) : lead.slice(0, 700);
    }
    const text = renderSections(sections) || String(plain).replace(/\s+/g, ' ').trim().slice(0, 1500);
    return { text, sections, keywords, variants, changed };
}

function peopleLine(description) {
    const first = String(description || '').replace(/^\s*\**\s*visual\s*:\s*\**\s*/i, '');
    const match = first.match(/^([^:.\n]{3,90}?)\s*:/);
    return match && /\b(one|two|three|four|five|six|several|many|\d+|no)\b[^:]*\b(people|person|characters?|figures?|girls?|boys?|men|man|women|woman)\b/i.test(match[1]) ? match[1].trim() : '';
}

function peopleHint(tags) {
    const names = { girl: 'girl', boy: 'boy', other: 'other character' };
    const counted = [];
    let solo = false;
    let focus = false;
    for (const tag of (tags || []).map(normalizeTag)) {
        const number = tag.match(/^(\d+)\+?(girl|boy|other)s?$/);
        const many = tag.match(/^multiple_(girl|boy|other)s$/);
        if (number) {
            counted.push(`${number[1]} ${names[number[2]]}${number[1] === '1' ? '' : 's'}`);
        } else if (many) {
            counted.push(`several ${names[many[1]]}s`);
        } else if (tag === 'solo') {
            solo = true;
        } else if (tag === 'solo_focus') {
            focus = true;
        }
    }
    const text = [...new Set(counted)].join(', ');
    if (focus) {
        return `${text ? `${text}; ` : ''}solo focus (one main person, but someone else is there too)`;
    }
    return text || (solo ? 'solo (one person)' : '');
}

function lockedPrompt(locked, prompt) {
    return `The user checked this description of the picture and locked it as correct:\n\n${locked}\n\nRewrite it in the format asked below. Keep every fact it gives and never contradict it; keep its wording where it fits. Look at the picture only to add what the format asks for and the locked description does not say.\n\n${prompt}`;
}

const VIDEO_TAGS_NOTE = 'The tags were taken from the longer video this animation comes from, so some of them may not appear in it. Only describe what you can see; do not explain tags that are not visible.';

async function requestDescription(url, tags, blob = null, locked = '', note = '', extra = {}) {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    const profile = visionProfileId();
    if (!service || !profile) {
        throw new Error('No vision profile chosen in Image Search settings.');
    }
    const people = peopleHint(extra.peopleTags || tags);
    const info = extra.tagInfo ? importantTagInfo(tags) : '';
    const rules = fillTemplate(promptPart('describeRules'), { tag_info: info, tag_count: people ? `${people}${extra.peopleTags ? ' (for the whole group, so not everyone may be in this item)' : ''}` : '' });
    const asked = `${extra.before ? `${extra.before}\n\n` : ''}${note ? `${note}\n\n` : ''}${String(s.visionPrompt || DEFAULT_VISION_PROMPT).replace(/\{\{tags\}\}/g, () => tags.join(', ') || 'none')}${rules}`;
    const prompt = extra.wrap ? extra.wrap(asked) : locked ? lockedPrompt(locked, asked) : asked;
    const ask = async (text, images) => {
        const messages = [{ role: 'user', content: [{ type: 'text', text }, ...images.map(image => ({ type: 'image_url', image_url: { url: image } }))] }];
        const result = await modelRequest(service, profile, messages, Math.max(32, Number(s.visionMaxTokens) || 300), { stream: false, extractData: true, includePreset: false, includeInstruct: false }, samplers(0.3));
        return String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    };
    let frames = null;
    const timing = extra.timed ? { timed: true } : {};
    try {
        frames = await animationFrames(url, blob, 0, timing);
    } catch (error) {
        console.warn('[Image Search] could not read the animation frames', error);
    }
    let raw = '';
    const framesText = set => `${gifNoteText(set, set.sheet
        ? `You get ${sheetWords(set.count, set.length)}, evenly spread from the start to the end.`
        : `You get ${set.count} moments from it, in order, evenly spread from the start to the end.`, extra.loopState ?? null)}\n\n${prompt}`;
    if (extra.dryRun) {
        return frames?.count > 1 ? { dry: true, prompt: framesText(frames), view: sentView(frames) } : { dry: true, prompt, view: { pictures: [await imageDataUrl(url, blob)], moments: 0 } };
    }
    const askFrames = async set => {
        const text = framesText(set);
        const reply = await ask(text, set);
        rememberSent(url, 'describe', { ...sentView(set), prompt: text, tokens: Math.max(32, Number(s.visionMaxTokens) || 300), heat: 0.3 });
        return reply;
    };
    if (frames?.count > 1) {
        try {
            raw = await askFrames(frames);
        } catch (error) {
            console.warn('[Image Search] the vision model refused all the frames, trying fewer', error);
            if (frames.length > 1) {
                try {
                    const fewer = await animationFrames(url, blob, SHEET_FRAMES, timing);
                    raw = fewer?.count > 1 ? await askFrames(fewer) : '';
                } catch (again) {
                    console.warn('[Image Search] the vision model refused the frames, using the first one', again);
                }
            }
        }
    }
    if (!raw) {
        const still = await imageDataUrl(url, blob);
        raw = await ask(prompt, [still]);
        rememberSent(url, 'describe', { pictures: [still], moments: 0, seconds: frames?.clip?.seconds || 0, prompt, tokens: Math.max(32, Number(s.visionMaxTokens) || 300), heat: 0.3 });
    }
    const parsed = parseDescription(raw);
    parsed.raw = raw;
    parsed.animated = Boolean(frames?.length);
    parsed.clip = frames?.clip || null;
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
    let note = '';
    entry.promise = (tagsLater ? tagsLater.then(value => {
        entry.tags = summaryTags(Array.isArray(value) ? value : value?.tags);
        note = String(value?.note || '');
    }).catch(() => {}) : Promise.resolve())
        .then(() => requestDescription(url, entry.tags, blob, '', note, { tagInfo: true }))
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

const library = { entries: [], loaded: false, broken: false, loading: null, saving: Promise.resolve(), queued: null, tag: '', deleted: new Set(), details: { loaded: false, loading: null, store: {}, written: new Map(), tag: '' } };

function validEntry(entry) {
    return entry && typeof entry === 'object' && typeof entry.id === 'string' && typeof entry.url === 'string';
}

function cleanLock(lock) {
    return lock && typeof lock === 'object' && String(lock.text || '').trim() ? { text: String(lock.text), at: Number(lock.at) || Date.now() } : null;
}

function cleanSections(sections) {
    return sections && typeof sections === 'object' ? Object.fromEntries(SECTIONS.filter(([key]) => typeof sections[key] === 'string').map(([key]) => [key, sections[key]])) : {};
}

function cleanStrings(list, limit = 80) {
    return Array.isArray(list) ? list.map(String).filter(Boolean).slice(0, limit) : [];
}

function cleanItem(item, index, entry, grouped) {
    return {
        id: item.id,
        url: item.url,
        source: String(item.source || ''),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        diff: String(item.diff || ''),
        description: String(item.description || ''),
        sections: cleanSections(item.sections),
        keywords: cleanStrings(item.keywords, 16),
        seen: cleanStrings(item.seen, 60),
        cast: String(item.cast || '').slice(0, 300),
        beat: String(item.beat || '').slice(0, 300),
        clip: item.clip && Number(item.clip.seconds) > 0 ? { seconds: Number(item.clip.seconds), frames: Number(item.clip.frames) || 0, loop: Boolean(item.clip.loop) } : null,
        roleLock: Boolean(item.roleLock && item.role),
        loopSet: item.loopSet === 'loop' || item.loopSet === 'not' ? item.loopSet : '',
        implied: Array.isArray(item.implied) ? item.implied.filter(link => link?.tag).slice(0, 30).map(link => ({ tag: normalizeTag(link.tag), from: normalizeTag(link.from || '') })) : [],
        inferred: Array.isArray(item.inferred) ? item.inferred.filter(hit => hit?.tag).slice(0, 30).map(hit => ({ tag: normalizeTag(hit.tag), words: String(hit.words || '').slice(0, 120) })) : [],
        dropped: cleanStrings(item.dropped, 60),
        diffEdited: Boolean(item.diffEdited),
        shows: cleanStrings(item.shows, 80),
        role: cleanRole(item.role),
        added: cleanStrings(item.added, 40),
        fixes: cleanFixes(item.fixes),
        deduced: Array.isArray(item.deduced) ? item.deduced.filter(d => d && d.tag).slice(0, 20).map(d => ({ tag: String(d.tag), why: String(d.why || '').slice(0, 300) })) : [],
        before: item.before && typeof item.before === 'object' && item.before.description ? { description: String(item.before.description), sections: cleanSections(item.before.sections), keywords: cleanStrings(item.before.keywords, 16) } : null,
        lock: cleanLock(item.lock) || (grouped && index === 0 ? cleanLock(entry.lock) : null),
        card: cleanCard(item.card),
    };
}

function cleanFixes(fixes) {
    return Array.isArray(fixes) ? fixes.filter(fix => fix && fix.text).slice(-6).map(fix => ({ text: String(fix.text).slice(0, 600), tags: cleanStrings(fix.tags, 10), at: Number(fix.at) || Date.now() })) : [];
}

function fixesNote(fixes) {
    return fixes?.length ? `The user corrected an earlier description of this picture: ${fixes.slice(-3).map(fix => `"${fix.text}"${fix.tags.length ? ` (it shows: ${fix.tags.join(', ').replace(/_/g, ' ')})` : ''}`).join('; ')}. Keep these corrections.` : '';
}

function correctionPrompt(base, fix, asked, entry = null, item = null) {
    const place = item?.role ? `\n\nWhere it sits: it is the ${roleText(item.role)}${item.role.intensity ? ` (intensity ${item.role.intensity}/10)` : ''} of a ${groupWhat(entry)}${entry.arc ? ` shaped ${entry.arc}` : ''}.${item.diff ? ` Its story line so far: ${item.diff}` : ''}` : '';
    return `This is the description of this picture:\n\n${base}${place}\n\nThe user checked it against the picture and says: "${fix.text}"${fix.tags.length ? `\nThe user also says it shows: ${fix.tags.join(', ').replace(/_/g, ' ')}.` : ''}\nLook at the picture again and rewrite the description so it follows the user's correction. The correction wins over the tags and over the earlier description; keep everything else that is right.\n\nRewrite it in the format asked below.\n\n${asked}`;
}

async function correctDescription(entry, item, text, tags = []) {
    const fix = { text: String(text).replace(/\s+/g, ' ').trim().slice(0, 600), tags: [...new Set(tags.map(normalizeTag).filter(Boolean))].slice(0, 10), at: Date.now() };
    if (!fix.text) {
        return entry;
    }
    if (item) {
        const index = entry.variants.indexOf(item);
        item.fixes = [...item.fixes, fix].slice(-6);
        item.added = [...new Set([...item.added, ...fix.tags])];
        item.shows = [...new Set([...item.shows, ...fix.tags])];
        if (entry.report) {
            fix.tags.filter(tag => entry.report.notShown.includes(tag)).forEach(tag => {
                entry.report.notShown = entry.report.notShown.filter(other => other !== tag);
                entry.report.placed[tag] = [...new Set([...(entry.report.placed[tag] || []), index + 1])].sort((a, b) => a - b);
            });
        }
        const before = item.description;
        groupStep(entry, `Correcting item ${index + 1}…`);
        try {
            await describeItem(entry, index, null, { correction: fix });
            await refreshStory(entry, `the user corrected item ${index + 1} and this is true: ${fix.text}`);
            rememberFix(entry, item, before, fix);
        } finally {
            groupStep(entry, '');
        }
    } else {
        entry.fixes = [...entry.fixes, fix].slice(-6);
        entry.tags = [...new Set([...entry.tags, ...fix.tags])];
        const base = entry.lock?.text || entry.description;
        const result = await requestDescription(entry.url, entry.tags, null, '', entry.borrowed?.fromVideo ? VIDEO_TAGS_NOTE : '', { wrap: base ? asked => correctionPrompt(base, fix, asked) : null, tagInfo: true });
        entry.description = result.text;
        entry.sections = result.sections || {};
        entry.keywords = result.keywords || [];
        if (entry.lock) {
            entry.lock = { text: entry.description, at: Date.now() };
        }
        descriptions.set(entry.url, readyDescription(entry.url, entry.tags, entry.description));
        rememberFix(entry, null, base, fix);
    }
    await saveLibrary();
    scheduleLorebookSync();
    return entry;
}

function rememberFix(entry, item, before, fix) {
    const s = settings();
    const kind = item ? groupWhat(entry) : 'single picture';
    if (fix.tags.length) {
        fix.tags.forEach(tag => {
            rememberTag(tag, true, entry.site);
            saveTagNote(tag, { note: item ? plainNote(fix.text, entry) : fix.text, fromFix: true, lasts: false, role: item ? roleText(item.role) : '', story: item?.diff || '', kind });
        });
        return;
    }
    const log = Array.isArray(s.fixLog) ? s.fixLog : [];
    log.push({ text: fix.text, role: item ? roleText(item.role) : '', kind, before: String(before || '').slice(0, 300), at: fix.at });
    s.fixLog = log.slice(-40);
    save();
    renderFixLog();
}

function renderFixLog() {
    const box = document.getElementById('st_imagesearch_fix_log');
    if (!box) {
        return;
    }
    box.innerHTML = '';
    const log = Array.isArray(settings().fixLog) ? settings().fixLog : [];
    if (!log.length) {
        box.appendChild(el('small', 'stis-help', 'None yet. Corrections you send without a tag are kept here.'));
        return;
    }
    [...log].reverse().forEach(fix => {
        const row = el('div', 'stis-tag-note');
        const head = el('div', 'stis-tag-note-head');
        head.appendChild(el('b', '', fix.role ? `${fix.role} item` : fix.kind));
        head.append(` of a ${fix.kind}`);
        const remove = el('a', 'stis-tag-note-remove', '×');
        remove.href = '#';
        remove.title = 'Forget this correction';
        remove.addEventListener('click', event => {
            event.preventDefault();
            settings().fixLog = (settings().fixLog || []).filter(other => other !== fix);
            save();
            renderFixLog();
        });
        head.appendChild(remove);
        row.append(head, el('span', '', fix.text));
        box.appendChild(row);
    });
}

function cleanRole(role) {
    if (!role || typeof role !== 'object' || !String(role.main || '').trim()) {
        return null;
    }
    const intensity = Math.max(0, Math.min(10, Math.round(Number(role.intensity) || 0)));
    return { main: String(role.main).slice(0, 40), sub: String(role.sub || '').slice(0, 40), ...(intensity ? { intensity, why: String(role.why || '').slice(0, 200) } : {}) };
}

function cleanReport(report) {
    if (!report || typeof report !== 'object') {
        return null;
    }
    const tagMap = value => (value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).slice(0, 80).map(([tag, items]) => [String(tag), Array.isArray(items) ? items.map(Number).filter(Number.isFinite) : []])) : {});
    return {
        at: Number(report.at) || Date.now(),
        steps: report.steps && typeof report.steps === 'object' ? Object.fromEntries(Object.entries(report.steps).map(([key, value]) => [key, String(value)])) : {},
        missing: cleanStrings(report.missing),
        found: tagMap(report.found),
        notShown: cleanStrings(report.notShown),
        importance: Array.isArray(report.importance) ? report.importance.filter(item => item && item.tag).slice(0, 60).map(item => ({ tag: String(item.tag), important: Boolean(item.important), why: String(item.why || '').slice(0, 200), by: String(item.by || '') })) : [],
        decided: report.decided && typeof report.decided === 'object' ? Object.fromEntries(Object.entries(report.decided).filter(([, value]) => value === 'out' || value === 'important').slice(0, 80)) : {},
        placed: tagMap(report.placed),
        notes: report.notes && typeof report.notes === 'object' ? Object.fromEntries(Object.entries(report.notes).slice(0, 60).map(([tag, value]) => [String(tag), { note: String(value?.note || '').slice(0, 1200), lasts: Boolean(value?.lasts), byItem: value?.byItem && typeof value.byItem === 'object' ? Object.fromEntries(Object.entries(value.byItem).slice(0, 8).map(([number, text]) => [String(Number(number) || 0), String(text).slice(0, 400)])) : {} }])) : {},
        deduced: report.deduced && typeof report.deduced === 'object' ? Object.fromEntries(Object.entries(report.deduced).slice(0, 40).map(([tag, value]) => [String(tag), { items: Array.isArray(value?.items) ? value.items.map(Number).filter(Number.isFinite) : [], why: String(value?.why || '').slice(0, 300), lasts: Boolean(value?.lasts), ...(value?.confirmed ? { confirmed: true } : {}) }])) : {},
        verdict: String(report.verdict || ''),
        problems: Array.isArray(report.problems) ? report.problems.filter(item => item && item.problem).slice(0, 20).map(item => ({ item: Number(item.item) || 0, about: item.about === 'story' ? 'story' : 'description', problem: String(item.problem).slice(0, 300), redone: Boolean(item.redone) })) : [],
        errors: cleanStrings(report.errors, 12),
        storyReply: String(report.storyReply || '').slice(0, 4000),
        storyAsked: String(report.storyAsked || '').slice(0, 16000),
        deduceReply: String(report.deduceReply || '').slice(0, 3000),
        noteLog: cleanStrings(report.noteLog, 40),
        linked: report.linked && typeof report.linked === 'object' ? Object.fromEntries(Object.entries(report.linked).slice(0, 40).map(([tag, hits]) => [String(tag), cleanStrings(hits, 10)])) : {},
        linkReply: String(report.linkReply || '').slice(0, 2000),
        inText: report.inText && typeof report.inText === 'object' ? Object.fromEntries(Object.entries(report.inText).slice(0, 40).map(([tag, hits]) => [String(tag), cleanStrings(hits, 10)])) : {},
        inTextReply: String(report.inTextReply || '').slice(0, 2000),
        framework: report.framework === 'v3' ? 'v3' : '',
        board: tagMap(report.board),
        owned: tagMap(report.owned),
        implied: tagMap(report.implied),
        boardPeak: report.boardPeak && Number(report.boardPeak.item) ? { item: Number(report.boardPeak.item), why: String(report.boardPeak.why || '').slice(0, 200) } : null,
        boardReply: String(report.boardReply || '').slice(0, 4000),
        fixed: Array.isArray(report.fixed) ? report.fixed.filter(fix => fix && fix.item).slice(0, 20).map(fix => ({ item: Number(fix.item) || 0, role: Boolean(fix.role), problems: Number(fix.problems) || 0, kept: cleanStrings(fix.kept, 10), left: cleanStrings(fix.left, 10) })) : [],
        cost: report.cost && typeof report.cost === 'object' ? { vision: Number(report.cost.vision) || 0, text: Number(report.cost.text) || 0, seconds: Number(report.cost.seconds) || 0 } : null,
        facts: String(report.facts || '').slice(0, 1500),
        itemFacts: Array.isArray(report.itemFacts) ? report.itemFacts.slice(0, 8).map(text => String(text || '').slice(0, 1500)) : [],
        ownTags: Array.isArray(report.ownTags) ? report.ownTags.map(Number).filter(Boolean).slice(0, 8) : [],
        gender: report.gender && typeof report.gender === 'object' ? { word: String(report.gender.word || '').slice(0, 40), board: String(report.gender.board || '').slice(0, 60), items: (Array.isArray(report.gender.items) ? report.gender.items : []).map(Number).filter(Boolean).slice(0, 20), story: Boolean(report.gender.story) } : null,
        fit: Array.isArray(report.fit) ? report.fit.filter(item => item && item.item).slice(0, 20).map(item => ({ item: Number(item.item) || 0, fits: Boolean(item.fits), said: String(item.said || '').slice(0, 300), instead: String(item.instead || '').slice(0, 300), fixed: Boolean(item.fixed) })) : [],
        fitReply: String(report.fitReply || '').slice(0, 3000),
    };
}

function cleanEntry(entry) {
    const grouped = (entry.kind === 'set' || entry.kind === 'sequence') && Array.isArray(entry.variants) && entry.variants.length > 1;
    return {
        id: entry.id,
        url: entry.url,
        source: String(entry.source || ''),
        site: String(entry.site || ''),
        tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
        searchTags: Array.isArray(entry.searchTags) ? entry.searchTags.map(String) : [],
        description: String(entry.description || ''),
        sections: cleanSections(entry.sections),
        kind: entry.kind === 'set' || entry.kind === 'sequence' ? entry.kind : 'single',
        animated: Boolean(entry.animated),
        described: String(entry.described || ''),
        borrowed: entry.borrowed && typeof entry.borrowed === 'object' && entry.borrowed.site ? { site: String(entry.borrowed.site), id: String(entry.borrowed.id || ''), page: String(entry.borrowed.page || ''), how: String(entry.borrowed.how || ''), alike: Number(entry.borrowed.alike) || 0, fromVideo: Boolean(entry.borrowed.fromVideo), at: Number(entry.borrowed.at) || Date.now() } : null,
        fromVideo: entry.fromVideo && typeof entry.fromVideo === 'object' && Array.isArray(entry.fromVideo.parts) ? { video: String(entry.fromVideo.video || ''), duration: Number(entry.fromVideo.duration) || 0, parts: entry.fromVideo.parts.filter(part => part && typeof part === 'object').slice(0, MAX_PARTS).map(part => ({ start: Number(part.start) || 0, end: Number(part.end) || 0, kind: String(part.kind || '') })) } : null,
        huntReport: entry.huntReport && typeof entry.huntReport === 'object' && entry.huntReport.text ? { text: String(entry.huntReport.text), closest: Array.isArray(entry.huntReport.closest) ? entry.huntReport.closest.filter(item => item && item.page).slice(0, 3).map(item => ({ page: String(item.page), id: String(item.id || ''), alike: Number(item.alike) || 0 })) : [], at: Number(entry.huntReport.at) || 0 } : null,
        lock: grouped ? null : cleanLock(entry.lock),
        fixes: grouped ? [] : cleanFixes(entry.fixes),
        card: cleanCard(entry.card),
        variants: Array.isArray(entry.variants) ? entry.variants.filter(v => v && typeof v.id === 'string' && typeof v.url === 'string').map((v, index) => cleanItem(v, index, entry, grouped)) : [],
        fileTags: cleanStrings(entry.fileTags, 40),
        report: cleanReport(entry.report),
        attention: entry.attention && typeof entry.attention === 'object' ? { tags: cleanStrings(entry.attention.tags, 20), at: Number(entry.attention.at) || Date.now() } : null,
        arc: grouped ? String(entry.arc || '').slice(0, 300) : '',
        removedTags: grouped && entry.removedTags && typeof entry.removedTags === 'object' ? Object.fromEntries(Object.entries(entry.removedTags).slice(0, 40).map(([tag, info]) => [String(tag), { reason: String(info?.reason || '').slice(0, 400), by: info?.by === 'ai' ? 'ai' : 'you', ...(info?.confirmed ? { confirmed: true } : {}), at: Number(info?.at) || Date.now() }])) : {},
        keywords: Array.isArray(entry.keywords) ? entry.keywords.map(String) : [],
        wiKeys: Array.isArray(entry.wiKeys) ? entry.wiKeys.map(String) : null,
        characters: Array.isArray(entry.characters) ? entry.characters.map(String) : [],
        added: Number(entry.added) || Date.now(),
        lastUsed: Number(entry.lastUsed) || 0,
        used: Number(entry.used) || 0,
    };
}

function fileTag(response) {
    const headers = response?.headers;
    const tag = headers?.get?.('etag') || '';
    const modified = headers?.get?.('last-modified') || '';
    return tag || (modified ? `${modified}|${headers?.get?.('content-length') || ''}` : '');
}

async function libraryTag(size = null, name = LIBRARY_FILE) {
    try {
        const response = await fetchWithin(`/user/files/${name}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' }, 15000);
        if (response.status === 404) {
            return 'missing';
        }
        const length = Number(response.headers?.get?.('content-length'));
        if (!response.ok || (size !== null && Number.isFinite(length) && length !== size)) {
            return '';
        }
        return fileTag(response);
    } catch {
        return '';
    }
}

async function readLibraryFile(known = null) {
    const response = await fetchWithin(`/user/files/${LIBRARY_FILE}?t=${Date.now()}`, { cache: 'no-store' }, 60000);
    if (response.status === 404) {
        library.tag = 'missing';
        return [];
    }
    if (!response.ok) {
        throw new Error(`The picture library could not be read (${response.status}).`);
    }
    const tag = fileTag(response);
    const data = JSON.parse(await response.text());
    library.tag = tag;
    return (Array.isArray(data?.entries) ? data.entries : []).filter(entry => validEntry(entry) && !known?.has(entry.id)).map(cleanEntry);
}

const DETAILS_FILE = 'imagesearch-library-details.json';
const DETAIL_FIELDS = ['storyAsked', 'storyReply', 'boardReply', 'deduceReply', 'fitReply', 'linkReply', 'inTextReply'];

function reportDetails(report) {
    if (!report || !DETAIL_FIELDS.some(field => report[field])) {
        return null;
    }
    return Object.fromEntries(DETAIL_FIELDS.filter(field => report[field]).map(field => [field, report[field]]));
}

function detailsSig(at, fields) {
    return `${Number(at) || 0}:${DETAIL_FIELDS.map(field => String(fields?.[field] || '').length).join(',')}`;
}

function strippedEntries() {
    return library.entries.map(entry => {
        if (!reportDetails(entry.report)) {
            return entry;
        }
        const report = { ...entry.report };
        DETAIL_FIELDS.forEach(field => {
            delete report[field];
        });
        return { ...entry, report };
    });
}

function attachDetails(entries = library.entries) {
    const store = library.details.store;
    for (const entry of entries) {
        const kept = store[entry.id];
        if (kept && entry.report && Number(kept.at) === Number(entry.report.at) && !reportDetails(entry.report)) {
            DETAIL_FIELDS.forEach(field => {
                if (kept[field]) {
                    entry.report[field] = kept[field];
                }
            });
        }
    }
}

async function readDetailsFile() {
    const response = await fetchWithin(`/user/files/${DETAILS_FILE}?t=${Date.now()}`, { cache: 'no-store' }, 60000);
    if (response.status === 404) {
        return { tag: 'missing', store: {} };
    }
    if (!response.ok) {
        throw new Error(`The description details could not be read (${response.status}).`);
    }
    const tag = fileTag(response);
    let data = null;
    try {
        data = JSON.parse(await response.text());
    } catch {
        data = null;
    }
    const store = {};
    for (const [id, value] of Object.entries(data?.details && typeof data.details === 'object' ? data.details : {})) {
        if (value && typeof value === 'object') {
            store[id] = { at: Number(value.at) || 0, ...Object.fromEntries(DETAIL_FIELDS.filter(field => typeof value[field] === 'string' && value[field]).map(field => [field, value[field].slice(0, 16000)])) };
        }
    }
    return { tag, store };
}

function loadDetails() {
    const details = library.details;
    if (details.loaded) {
        return Promise.resolve();
    }
    if (!details.loading) {
        details.loading = readDetailsFile().then(({ tag, store }) => {
            details.store = store;
            details.tag = tag;
            details.written = new Map(Object.entries(store).map(([id, value]) => [id, detailsSig(value.at, value)]));
            details.loaded = true;
            attachDetails();
        }).catch(error => {
            console.warn('[Image Search] description details unavailable', error);
        }).finally(() => {
            details.loading = null;
        });
    }
    return details.loading;
}

async function uploadUserFile(name, data) {
    const response = await fetchWithin('/api/files/upload', {
        method: 'POST',
        headers: ctx().getRequestHeaders(),
        body: `{"name":${JSON.stringify(name)},"data":"${data}"}`,
    }, 180000);
    if (!response.ok) {
        throw new Error(`${name} could not be saved (${response.status}).`);
    }
}

async function saveDetails() {
    const details = library.details;
    if (!details.loaded) {
        await loadDetails();
        if (!details.loaded) {
            return;
        }
    }
    const out = {};
    const sigs = new Map();
    const keep = (id, at, fields) => {
        out[id] = { at, ...fields };
        sigs.set(id, detailsSig(at, fields));
    };
    for (const entry of library.entries) {
        const fields = reportDetails(entry.report);
        const stored = details.store[entry.id];
        if (fields) {
            keep(entry.id, entry.report.at, fields);
        } else if (entry.report && stored && Number(stored.at) === Number(entry.report.at)) {
            keep(entry.id, stored.at, stored);
        }
    }
    const dirty = sigs.size !== details.written.size || [...sigs].some(([id, sig]) => details.written.get(id) !== sig);
    if (!dirty) {
        return;
    }
    const tag = details.tag ? await libraryTag(null, DETAILS_FILE) : '';
    if (!tag || tag !== details.tag) {
        try {
            const remote = await readDetailsFile();
            const byId = new Map(library.entries.map(entry => [entry.id, entry]));
            for (const [id, value] of Object.entries(remote.store)) {
                const entry = byId.get(id);
                if (!out[id] && entry?.report && Number(entry.report.at) === Number(value.at)) {
                    keep(id, value.at, value);
                }
            }
        } catch {
        }
    }
    const { data, size } = await textToBase64(JSON.stringify({ version: 1, details: out }));
    await uploadUserFile(DETAILS_FILE, data);
    details.store = out;
    details.written = sigs;
    details.tag = await libraryTag(size, DETAILS_FILE);
}

const BACKUP_SLOTS = 3;
const BACKUP_EVERY = 12 * 3600 * 1000;

function backupName(slot) {
    return `imagesearch-library-backup-${slot + 1}.json`;
}

function libraryBackups() {
    const list = settings().libraryBackups;
    return Array.isArray(list) ? list.filter(item => item && Number.isInteger(item.slot) && item.slot >= 0 && item.slot < BACKUP_SLOTS).sort((a, b) => b.at - a.at) : [];
}

async function backUpLibrary(data, count, { now = false } = {}) {
    const list = libraryBackups();
    const newest = list[0];
    if (!now && newest && Date.now() - newest.at < BACKUP_EVERY) {
        return false;
    }
    if (!now && newest && count < newest.count * 0.5 && newest.count - count >= 3) {
        return false;
    }
    const used = new Set(list.map(item => item.slot));
    const slot = [...Array(BACKUP_SLOTS).keys()].find(index => !used.has(index)) ?? list[list.length - 1].slot;
    await uploadUserFile(backupName(slot), data);
    const s = settings();
    s.libraryBackups = [{ slot, at: Date.now(), count }, ...list.filter(item => item.slot !== slot)];
    save();
    return true;
}

async function backUpNow() {
    await loadLibrary();
    if (library.broken) {
        throw new Error('The picture library could not be read, so there is nothing to back up.');
    }
    const { data } = await textToBase64(JSON.stringify({ version: 1, entries: strippedEntries() }));
    await backUpLibrary(data, library.entries.length, { now: true });
}

async function restoreBackup(slot) {
    const response = await fetchWithin(`/user/files/${backupName(slot)}?t=${Date.now()}`, { cache: 'no-store' }, 60000);
    if (!response.ok) {
        throw new Error(`The backup could not be read (${response.status}).`);
    }
    const data = JSON.parse(await response.text());
    const restored = (Array.isArray(data?.entries) ? data.entries : []).filter(validEntry).map(cleanEntry);
    if (!restored.length) {
        throw new Error('The backup has no pictures.');
    }
    await loadLibrary();
    await library.saving;
    if (!library.broken && library.entries.length) {
        const { data: current } = await textToBase64(JSON.stringify({ version: 1, entries: strippedEntries() }));
        await uploadUserFile('imagesearch-library-before-restore.json', current);
    }
    const kept = new Set(restored.map(entry => entry.id));
    library.entries.filter(entry => !kept.has(entry.id)).forEach(entry => library.deleted.add(entry.id));
    restored.forEach(entry => library.deleted.delete(entry.id));
    library.entries = restored;
    library.broken = false;
    descriptions.clear();
    attachDetails();
    await saveLibrary();
    return restored.length;
}

async function loadLibrary(force = false) {
    if (library.loaded && !force && !(library.broken && Date.now() - (library.failedAt || 0) > 15000)) {
        return library.entries;
    }
    if (library.loading) {
        return library.loading;
    }
    library.loading = (async () => {
        try {
            const fresh = await readLibraryFile();
            if (library.broken && library.entries.length) {
                const ids = new Set(fresh.map(entry => entry.id));
                library.entries.filter(entry => !ids.has(entry.id) && !library.deleted.has(entry.id)).forEach(entry => fresh.push(entry));
            }
            library.entries = fresh;
            library.broken = false;
            attachDetails();
            loadDetails();
            scheduleFiling(6000);
            if (!library.pruned) {
                library.pruned = true;
                setTimeout(() => pruneThumbs().catch(() => {}), 30000);
            }
        } catch (error) {
            console.warn('[Image Search] library unavailable', error);
            library.broken = true;
            library.failedAt = Date.now();
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

async function textToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    if (typeof bytes.toBase64 === 'function') {
        return { data: bytes.toBase64(), size: bytes.length };
    }
    if (typeof FileReader === 'function' && typeof Blob === 'function') {
        return { data: await blobToBase64(new Blob([bytes])), size: bytes.length };
    }
    return { data: utf8ToBase64(text), size: bytes.length };
}

function saveLibrary({ skipSync = false, skipFiling = false } = {}) {
    const queued = library.queued;
    if (queued) {
        queued.skipSync = queued.skipSync && skipSync;
        queued.skipFiling = queued.skipFiling && skipFiling;
        return queued.promise;
    }
    const job = { skipSync, skipFiling, promise: null };
    library.queued = job;
    job.promise = library.saving.then(async () => {
        library.queued = null;
        if (library.broken) {
            await loadLibrary(true);
            if (library.broken) {
                throw new Error('The picture library could not be read, so it was not saved, to avoid overwriting it.');
            }
        }
        try {
            const tag = library.tag ? await libraryTag() : '';
            if (!tag || tag !== library.tag) {
                const remote = await readLibraryFile(new Set(library.entries.map(entry => entry.id)));
                const added = remote.filter(entry => !library.deleted.has(entry.id));
                added.forEach(entry => library.entries.push(entry));
                attachDetails(added);
            }
        } catch {
        }
        const { data, size } = await textToBase64(JSON.stringify({ version: 1, entries: strippedEntries() }));
        try {
            await uploadUserFile(LIBRARY_FILE, data);
        } catch (error) {
            library.tag = '';
            throw new Error(`The picture library could not be saved (${String(error?.message || error).match(/\((\d+)\)/)?.[1] || 'no answer'}).`);
        }
        library.tag = await libraryTag(size);
        await saveDetails().catch(error => console.warn('[Image Search] description details not saved', error));
        await backUpLibrary(data, library.entries.length).catch(error => console.warn('[Image Search] library backup failed', error));
        if (!job.skipSync) {
            scheduleLorebookSync();
        }
        if (!job.skipFiling) {
            scheduleFiling();
        }
    }).catch(error => {
        console.warn('[Image Search] library save failed', error);
        toastr.warning(String(error?.message || error), 'Image Search');
    });
    library.saving = job.promise;
    return job.promise;
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

const unitViews = new WeakMap();

function unitKey(entry, variant) {
    return variant && groupDescribed(entry) ? `${entry.id}#${variant.id}` : entry.id;
}

function unitView(entry, variant) {
    if (!variant || !groupDescribed(entry) || !entry.variants.includes(variant)) {
        return entry;
    }
    const known = unitViews.get(variant);
    if (known && known.unitOf === entry) {
        return known;
    }
    const view = Object.create(entry, {
        unitOf: { value: entry },
        item: { value: variant },
        unitKey: { value: `${entry.id}#${variant.id}` },
        description: { get: () => variant.description, enumerable: true },
        sections: { get: () => variant.sections || {}, enumerable: true },
        keywords: { get: () => (variant.keywords.length ? variant.keywords : entry.keywords), enumerable: true },
        tags: { get: () => (variant.shows.length ? variant.shows : variant.tags.length ? variant.tags : entry.tags), enumerable: true },
        card: {
            get: () => variant.card,
            set: value => {
                variant.card = value;
                if (entry.variants[0] === variant) {
                    entry.card = value;
                }
            },
            enumerable: true,
        },
    });
    unitViews.set(variant, view);
    return view;
}

function cardUnits(entries = library.entries) {
    return entries.flatMap(entry => (groupDescribed(entry) ? entry.variants.map(variant => unitView(entry, variant)) : [entry]));
}

function describedVariant(entry, variant) {
    if (isMulti(entry) && variant?.description) {
        const index = Math.max(0, entry.variants.findIndex(item => item.id === variant.id));
        const count = entry.variants.length;
        const moving = itemAnimated(entry, variant) ? ' (an animated picture, GIF)' : '';
        const head = entry.kind === 'sequence'
            ? `${entry.fromVideo ? `Part ${index + 1} of a video cut into ${count} parts` : `Picture ${index + 1} of a ${count}-picture sequence`}${moving}.`
            : `One of ${count} ${entry.fromVideo ? 'moments of the same video' : 'versions of the same scene'}${moving}.`;
        const arc = entry.arc ? ` Shape of the whole ${entry.kind === 'sequence' ? 'sequence' : 'group'}: ${entry.arc}.` : '';
        const story = itemStory(entry, variant, index);
        const changed = story ? `\n${story}` : '';
        return readyDescription(variant.url, variant.shows.length ? variant.shows : variant.tags.length ? variant.tags : entry.tags, `${head}${arc}\n${variant.description}${changed}`);
    }
    if (entry.kind === 'sequence' && isMulti(entry)) {
        const index = Math.max(0, entry.variants.findIndex(item => item.id === variant?.id));
        const count = entry.variants.length;
        const current = entry.variants[index];
        const what = entry.fromVideo ? `${count}-part video (animated GIFs)` : `${count}-picture sequence`;
        const text = index === 0
            ? `Picture 1 of a ${what}.\n${entry.description}`
            : `Picture ${index + 1} of a ${what}: ${current.diff || 'the next picture.'}\nThe sequence starts with: ${shortDescription(entry)}`;
        return readyDescription(current.url, current.tags?.length ? current.tags : entry.tags, entry.description ? text : '');
    }
    const isOther = variant && entry.kind === 'set' && variant.id !== entry.variants[0]?.id;
    const text = isOther && variant.diff ? `${entry.description}\n${entry.fromVideo ? 'This part' : 'This version'}: ${variant.diff}` : entry.description;
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
    const wasDescribed = groupDescribed(entry);
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
        entry.tags = main.tags?.length && (sequence || wasDescribed) ? main.tags : entry.tags;
        entry.kind = 'single';
        if (wasDescribed && main.description) {
            entry.description = main.description;
            entry.sections = main.sections;
            entry.keywords = main.keywords;
            entry.lock = main.lock;
            entry.card = main.card;
        }
        entry.report = null;
        entry.attention = null;
        entry.variants = [];
    } else if (wasDescribed) {
        if (!entry.variants[0].role) {
            entry.variants[0].diff = '';
        }
        if (entry.report) {
            entry.report.errors = [...entry.report.errors, `An item was removed after this was described; tap Redo all to check the group again.`].slice(-12);
        }
    }
    await saveLibrary();
    await deleteUnusedFiles([variant.url]);
    if (wasDescribed && isMulti(entry) && entry.variants.some(item => item.role)) {
        refreshStory(entry).then(done => (done ? saveLibrary() : null)).catch(error => console.warn('[Image Search] could not write the story lines again', error)).finally(() => groupStep(entry, ''));
    }
    if (sequence && wasFirst && !wasDescribed) {
        entry.lock = null;
        redoEntry(entry).catch(error => console.warn('[Image Search] could not describe the sequence again', error));
    }
}

async function partSheet(url, blob = null, maxSide = 768) {
    try {
        if (typeof ImageDecoder !== 'function') {
            throw new Error('no frame decoder');
        }
        const data = blob || await (await fetch(url)).blob();
        const decoder = new ImageDecoder({ data: new Uint8Array(await data.arrayBuffer()), type: 'image/gif' });
        const images = [];
        try {
            await decoder.tracks.ready;
            await decoder.completed?.catch(() => {});
            const total = decoder.tracks.selectedTrack?.frameCount || 1;
            const wanted = Math.min(total, 32, maxPictures() * SHEET_FRAMES, Math.max(2, Math.round(Number(settings().gifFrames) || 3)));
            const picks = [...new Set(Array.from({ length: wanted }, (_, i) => Math.round(i * (total - 1) / Math.max(1, wanted - 1))))];
            for (const frameIndex of picks) {
                images.push((await decoder.decode({ frameIndex })).image);
            }
            const sheets = await frameSheets(images, maxSide);
            sheets.count = images.length;
            return sheets;
        } finally {
            images.forEach(image => image.close?.());
            decoder.close?.();
        }
    } catch (error) {
        console.debug('[Image Search] could not make a frame sheet, sending the first frame', error);
        return imageDataUrl(url, blob, maxSide);
    }
}

const BLIND_PROMPT = 'List what you can see in this picture as image-board tags (Danbooru style: lowercase English words joined by underscores, like long_hair, school_uniform, holding_sword). Give 15 to 30 tags covering: how many people (1girl, 2boys, solo; count anyone only partly in view, like an arm or a figure in the shadows), each person\'s hair colour, length and style, eye colour, skin, clothing and accessories, objects held or used, pose and action, facial expression, the place and background, and the shot (close-up, upper_body, full_body). Only what is clearly visible. Reply with only the tags, separated by commas.';
const SERIES_TAG = /_\((series|anime|manga|game|novel|comic|film|movie|franchise|cartoon)\)$/;
const groupProgress = new Map();
const groupListeners = new Map();

function groupWhat(entry) {
    const count = entry.variants.length;
    if (entry.fromVideo) {
        return entry.kind === 'sequence' ? `video cut into ${count} animated parts, in order` : `set of ${count} separate moments (animated parts) from one video`;
    }
    const moving = entry.variants.filter(item => itemAnimated(entry, item)).length;
    const things = moving === count ? 'animated GIFs' : moving ? `items (${moving} animated GIF${moving === 1 ? '' : 's'} and ${count - moving} still picture${count - moving === 1 ? '' : 's'})` : 'pictures';
    return entry.kind === 'sequence' ? `sequence of ${count} ${things} that tell a story in this order` : `set of ${count} versions of the same scene`;
}

function groupDescribed(entry) {
    return isMulti(entry) && entry.variants.every(item => item.description);
}

function itemAnimated(entry, item) {
    return Boolean(entry.fromVideo) || isGifUrl(item.url);
}

async function itemPicture(entry, item, blob, size) {
    return itemAnimated(entry, item) ? partSheet(item.url, blob || null, size) : imageDataUrl(item.url, blob || null, size);
}

const LIST_MARK = /^\s*(?:[*•-]+\s*|\d+[.)]\s+)?/;

function parseTagReply(text) {
    return [...new Set(String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').split(/[,\n]+/).map(tag => normalizeTag(tag.replace(LIST_MARK, '').replace(/[`"*]/g, '').trim())))]
        .filter(tag => tag && tag !== 'none' && tag.length <= 60 && /^[a-z0-9_()\-'.:!?]+$/.test(tag));
}

function tagShape(tag) {
    return normalizeTag(tag).replace(/_\([^)]*\)$/, '').split(/[_-]+/).filter(Boolean).map(word => (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word)).sort().join(' ');
}

function checkableTags(entry) {
    const file = new Set(entry.fileTags || []);
    return [...new Set([...entry.tags, ...entry.variants.flatMap(item => item.tags || [])].map(normalizeTag))]
        .filter(tag => tag && !file.has(tag) && !META_TAG.test(tag) && !ANIMATED_TAGS.has(tag) && !SERIES_TAG.test(tag));
}

async function eachLimit(list, limit, work) {
    let next = 0;
    const run = async () => {
        while (next < list.length) {
            const index = next++;
            await work(list[index], index);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, list.length) }, run));
}

function cleanReply(result) {
    return String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

async function visionAsk(text, images, maxTokens = 300, temperature = 0.3) {
    const service = ctx().ConnectionManagerRequestService;
    const profile = visionProfileId();
    if (!service || !profile) {
        throw new Error('No vision profile chosen in Image Search settings.');
    }
    const messages = [{ role: 'user', content: [{ type: 'text', text }, ...images.map(url => ({ type: 'image_url', image_url: { url } }))] }];
    return cleanReply(await modelRequest(service, profile, messages, maxTokens, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, samplers(temperature)));
}

async function picturesOnlyAsk(images, maxTokens = 200) {
    const service = ctx().ConnectionManagerRequestService;
    const profile = visionProfileId();
    if (!service || !profile) {
        throw new Error('No vision profile chosen in Image Search settings.');
    }
    const send = content => modelRequest(service, profile, [{ role: 'user', content }], maxTokens, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, samplers(0.3));
    const pictures = images.map(url => ({ type: 'image_url', image_url: { url } }));
    try {
        return { reply: cleanReply(await send(pictures)), asked: '' };
    } catch (error) {
        const asked = 'Describe this briefly.';
        return { reply: cleanReply(await send([{ type: 'text', text: asked }, ...pictures])), asked, refused: String(error?.message || error).slice(0, 160) };
    }
}

async function textAsk(prompt, maxTokens = 600) {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    if (service && s.tagProfile) {
        return cleanReply(await modelRequest(service, s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), maxTokens, { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.2)));
    }
    if (!service || !visionProfileId()) {
        throw new Error('No tag profile or vision profile chosen in Image Search settings.');
    }
    return cleanReply(await modelRequest(service, visionProfileId(), [{ role: 'user', content: prompt }], maxTokens, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, samplers(0.2)));
}

function readTagLines(reply, allowed) {
    const found = new Map();
    for (const line of String(reply || '').split('\n')) {
        const match = line.replace(LIST_MARK, '').match(/^`?([^:`]+?)`?\s*[:=–—]\s*(.+)$/);
        if (!match) {
            continue;
        }
        const tag = normalizeTag(match[1].replace(/[*"]/g, ''));
        const numbers = /\bnone\b|\bno\b/i.test(match[2]) && !/\d/.test(match[2]) ? [] : (match[2].match(/\d+/g) || []).map(Number).filter(n => allowed.includes(n));
        if (tag) {
            found.set(tag, [...new Set([...(found.get(tag) || []), ...numbers])]);
        }
    }
    return found;
}

function importantTagInfo(tags) {
    const matter = rememberedTags().matter;
    const wanted = [...new Set((tags || []).map(normalizeTag))].filter(tag => matter.has(tag)).slice(0, 8);
    const missing = wanted.filter(tag => !settings().tagDefinitions?.[tag]);
    if (missing.length) {
        ensureDefinitions(missing).catch(() => null);
    }
    const lines = wanted.map(tag => {
        const notes = tagNotesFor(tag);
        const seen = notes.filter(note => !note.wrong && note.note).slice(-3).map(note => note.note);
        const wrong = [...notes.filter(note => note.wrong && note.note).slice(-2).map(note => note.note), ...removalNotesFor(tag).filter(note => !note.wrong && note.reason).slice(-2).map(note => note.reason)];
        const parts = [definitionLine(tag), seen.length || wrong.length ? `The user's notes: ${[...seen, ...wrong.map(text => `not when: ${text}`)].join('; ')}` : ''].filter(Boolean);
        return parts.length ? `- ${tag.replace(/_/g, ' ')}: ${parts.join(' ')}` : '';
    }).filter(Boolean);
    return lines.length ? `\n\nSome of this picture's tags matter to the user. What they mean (copied from the site's wiki) and what the user said about them in earlier pictures, as hints only: mention such a tag only if this picture shows it or clear signs of it.\n${lines.join('\n')}` : '';
}

function tagHints(tags) {
    const lines = tagHintLines(tags);
    return lines.length ? `\n\nWhat some of these tags mean (copied from the site's wiki) and what the user said about them in earlier pictures, as hints on how they show (count a tag only if this picture shows it or clear signs of it):\n${lines.join('\n')}` : '';
}

function tagHintLines(tags) {
    return tags.map(tag => {
        const notes = tagNotesFor(tag);
        const seen = notes.filter(note => !note.wrong && note.note).slice(-3).map(note => note.note);
        const wrong = [...notes.filter(note => note.wrong && note.note).slice(-2).map(note => note.note), ...removalNotesFor(tag).filter(note => !note.wrong && note.reason).slice(-2).map(note => note.reason)];
        const parts = [definitionLine(tag), seen.length || wrong.length ? `The user's notes: ${[...seen, ...wrong.map(text => `not when: ${text}`)].join('; ')}` : ''].filter(Boolean);
        return parts.length ? `- ${tag.replace(/_/g, ' ')}: ${parts.join(' ')}` : '';
    }).filter(Boolean);
}

async function findMissingTags(entry, pictures, tags, report) {
    const found = new Map(tags.map(tag => [tag, new Set()]));
    const hints = tagHints(tags);
    const count = entry.variants.length;
    const per = maxPictures();
    const groups = [];
    let current = [];
    let used = 0;
    entry.variants.forEach((item, index) => {
        const size = [].concat(pictures[index]).length;
        if (current.length && (used + size > per || current.length >= 4)) {
            groups.push(current);
            current = [];
            used = 0;
        }
        current.push(index);
        used += size;
    });
    if (current.length) {
        groups.push(current);
    }
    let together = true;
    for (const batch of groups) {
        if (!together) {
            break;
        }
        const images = batch.flatMap(index => [].concat(pictures[index]));
        let at = 0;
        const parts = batch.map(index => {
            const size = [].concat(pictures[index]).length;
            const from = at + 1;
            at += size;
            const animated = itemAnimated(entry, entry.variants[index]);
            return size > 1 || animated ? `item ${index + 1} is picture${size > 1 ? `s ${from} to ${at}` : ` ${from}`}${animated ? ' (an animation, its moments numbered in order)' : ''}` : `item ${index + 1} is picture ${from}`;
        });
        const plain = images.length === batch.length && !batch.some(index => itemAnimated(entry, entry.variants[index]));
        const text = plain
            ? `You get ${batch.length} picture${batch.length === 1 ? '' : 's'}, numbered ${batch[0] + 1} to ${batch[batch.length - 1] + 1} in this order. They are items of one ${groupWhat(entry)}.`
            : `You get ${images.length} picture${images.length === 1 ? '' : 's'}, numbered 1 to ${images.length}, showing items ${batch[0] + 1} to ${batch[batch.length - 1] + 1} of one ${groupWhat(entry)}: ${parts.join('; ')}. Answer with item numbers, not picture numbers.`;
        const filler = `${text} For each tag below, say which of these ${plain ? 'pictures' : 'items'} clearly show it. A tag can also name a known character or something happening. Reply with one line per tag, exactly like "tag: ${batch[0] + 1}, ${batch[batch.length - 1] + 1}" or "tag: none".\n\nTags:\n${tags.join('\n')}`;
        try {
            const reply = await visionAsk(`${filler}${hints}`, images, 60 + tags.length * 14, 0.1);
            const lines = readTagLines(reply, batch.map(index => index + 1));
            if (!lines.size) {
                throw new Error('the answer listed no tags');
            }
            lines.forEach((numbers, tag) => numbers.forEach(number => found.get(tag)?.add(number)));
        } catch (error) {
            console.warn('[Image Search] checking several pictures at once failed, checking them one by one', error);
            together = false;
        }
    }
    if (!together) {
        found.forEach(numbers => numbers.clear());
        const failures = [];
        await eachLimit(entry.variants, 2, async (item, index) => {
            try {
                const shown = [].concat(pictures[index]);
                const reply = await visionAsk(`This ${shown.length > 1 ? `item is shown as ${shown.length} pictures` : 'picture'} is item ${index + 1} of one ${groupWhat(entry)}${itemAnimated(entry, item) ? `, an animation shown as numbered moments${shown.length > 1 ? ' in order across the pictures' : ''}` : ''}. Which of these tags does it clearly show? A tag can also name a known character or something happening. Reply with only those tags, separated by commas, or "none".\n\nTags: ${tags.join(', ')}${hints}`, shown, 60 + tags.length * 10, 0.1);
                parseTagReply(reply).forEach(tag => found.get(tag)?.add(index + 1));
            } catch (error) {
                failures.push(`item ${index + 1}: ${error?.message || error}`);
            }
        });
        if (failures.length === count) {
            throw new Error(failures[0]);
        }
        failures.forEach(failure => report.errors.push(`Looking for the missing tags in ${failure}`));
    }
    report.steps.check = together ? 'together' : 'one by one';
    return found;
}

async function describeItem(entry, index, blob, { note = '', fallback = false, missed = [], why = {}, trusted = true, correction = null, roleFix = null, dry = false } = {}) {
    const item = entry.variants[index];
    const sequence = entry.kind === 'sequence';
    const before = index === 0 ? null : sequence ? entry.variants[index - 1] : entry.variants[0];
    const context = [`This ${itemAnimated(entry, item) ? 'GIF' : 'picture'} is item ${index + 1} of a ${groupWhat(entry)}.${item.role ? ` In the group it is the ${roleText(item.role)}.` : ''}`];
    const fresh = v3Entry(entry);
    if (fresh) {
        const board = boardLines(entry, index);
        if (board) {
            context.push(board);
        }
        const looped = loopLines(entry, index);
        if (looped) {
            context.push(looped);
        }
    }
    if (before?.description) {
        context.push(`${sequence ? `Item ${index} (the one before it)` : 'Item 1'} was described as:\n${before.description}\nCall the same people and things by the same words; if someone looks different, say so.`);
        const cast = peopleLine(before.description);
        if (cast) {
            context.push(`${sequence ? 'The item before' : 'Item 1'} counted: "${cast}". People do not vanish between items: if someone from it cannot be seen here, they are most likely still there out of view (behind someone, off screen, hidden by smoke or shadow). Count them anyway and say where they most likely are, like "Two people (one out of view, behind her)", unless this picture shows they left.`);
        }
    }
    const added = item.added.filter(tag => !missed.includes(tag)).concat(item.deduced.map(d => d.tag).filter(tag => !missed.includes(tag) && !item.added.includes(tag)));
    if (added.length) {
        context.push(`The user checked this picture and says it shows: ${added.join(', ').replace(/_/g, ' ')}. Mention them as far as the picture allows; never let them change what is visibly happening.`);
    }
    const fixes = fixesNote(item.fixes.filter(fix => fix !== correction));
    if (fixes) {
        context.push(fixes);
    }
    if (note) {
        context.push(`A reviewer noticed a problem in an earlier description of this item: ${note} Look at the picture again and fix it if the reviewer is right.`);
    }
    if (roleFix && item.role) {
        context.push(`This item's role is settled and correct: it is the ${roleText(item.role)}${item.role.intensity ? `, intensity ${item.role.intensity}/10` : ''}. An earlier description of it ${roleFix.said ? `said "${roleFix.said}", which` : ''} does not fit that role${roleFix.instead ? `; most likely ${roleFix.instead}` : ''}. Look at the picture again and describe this moment as the ${item.role.main}, following the user's rules for the roles:\n${String(settings().roleRules || '').trim()}`);
    }
    const own = item.tags.length ? item.tags : entry.tags;
    const tags = fallback || !item.shows.length ? own : item.shows;
    const tagNote = (fallback || !item.shows.length) && entry.fromVideo ? VIDEO_TAGS_NOTE : '';
    const base = missed.length || correction ? item.lock?.text || item.description : '';
    const wrap = !base ? null : correction ? asked => correctionPrompt(base, correction, asked, entry, item) : asked => missedPrompt(base, missed, item, asked, why);
    const parsed = await requestDescription(item.url, tags, blob || null, base ? '' : item.lock?.text || '', tagNote, { before: context.join('\n\n'), wrap, peopleTags: entry.tags, dryRun: dry, ...(fresh ? { loopState: loopState(entry, item, index) } : {}) });
    if (dry) {
        return parsed;
    }
    item.description = parsed.text;
    item.sections = parsed.sections || {};
    item.keywords = parsed.keywords || [];
    if (base && item.lock && trusted) {
        item.lock = { text: item.description, at: Date.now() };
    }
    descriptions.set(item.url, describedVariant(entry, item));
    return item;
}

function missedPrompt(base, missed, item, asked, why = {}) {
    const list = missed.join(', ').replace(/_/g, ' ');
    const reasons = missed.filter(tag => why[tag]).map(tag => `${tag.replace(/_/g, ' ')}: ${why[tag]}`);
    const meanings = missed.filter(definitionLine).map(tag => `${tag.replace(/_/g, ' ')}: ${definitionLine(tag)}`);
    return `This is the description of this picture:\n\n${base}\n\nThe user says it missed what ${missed.length === 1 ? 'this tag shows' : 'these tags show'}: ${list}.${meanings.length ? ` What ${missed.length === 1 ? 'it means' : 'they mean'} (copied from the site's wiki): ${meanings.join('; ')}.` : ''}${reasons.length ? ` Why: ${reasons.join('; ')}. It may happen off screen or only be implied; then say what most likely happened rather than describing it as seen.` : ''} Look at the picture again. Keep every fact the description gives and never contradict it; add what ${missed.length === 1 ? 'the tag shows' : 'the tags show'} only as far as the picture allows: if the picture does not show it, mention it briefly as likely off screen or implied, and keep describing what is visibly happening.${item.role ? ` This item is the ${roleText(item.role)} of its group${item.diff ? ` (${item.diff})` : ''}; if what was missed changes what is happening, say what happened.` : ''}\n\nRewrite it in the format asked below.\n\n${asked}`;
}

function roleText(role) {
    return role ? [role.main, role.sub].filter(Boolean).join(', ') : '';
}

async function rebuildSent(entry, item) {
    const out = { ...(sentPictures.get(item.url) || {}) };
    if (!out.describe?.prompt) {
        try {
            const dry = await dryPrompt(entry, item);
            out.describe = { ...dry.view, prompt: dry.prompt, rebuilt: true, tokens: Math.max(32, Number(settings().visionMaxTokens) || 300), heat: 0.3 };
        } catch (error) {
            console.warn('[Image Search] could not build the description prompt again', error);
            if (!out.describe) {
                out.describe = { pictures: [await imageDataUrl(item.url, null)], moments: 0, rebuilt: true };
            }
        }
    }
    const index = isMulti(entry) ? entry.variants.indexOf(item) : -1;
    if (!out.board?.prompt && index >= 0 && v3Entry(entry)) {
        out.board = { ...(await rebuildBoardView(entry, index)), rebuilt: true };
    }
    return out;
}

function sentPanel(entry, item) {
    const box = el('div', 'stis-sent');
    box.appendChild(el('small', 'stis-card-head', 'What the AI saw'));
    const body = el('div', 'stis-sent-body');
    body.appendChild(el('small', '', 'Getting the pictures and the prompt…'));
    box.appendChild(body);
    const clock = at => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const part = (title, view, rebuild = null) => {
        const wrap = el('div', 'stis-sent-part');
        const bits = [`${view.pictures.length} picture${view.pictures.length === 1 ? '' : 's'}`];
        if (view.moments) {
            bits.push(`${view.moments} moments`);
        }
        if (view.seconds) {
            bits.push(`from a ${view.seconds} s GIF${view.loop ? ' that loops' : ''}`);
        }
        wrap.appendChild(el('div', 'stis-sent-title', `${title}: ${bits.join(', ')} · ${view.rebuilt ? 'rebuilt with your current settings (what would be sent now)' : `exactly as sent at ${clock(view.at)}`}`));
        const said = el('details', 'stis-sent-prompt');
        said.open = true;
        const label = el('summary', '', view.rebuilt ? 'The prompt, with your current settings' : 'The prompt sent with these pictures');
        said.appendChild(label);
        if (view.together > view.pictures.length) {
            said.appendChild(el('small', 'stis-sent-moments', `It goes with ${view.together} pictures in all: this item's pictures below, and the other items' pictures. Sending it again sends them all.`));
        }
        wrap.appendChild(said);
        const marks = view.times?.length ? view.times : view.picks?.length ? view.picks : null;
        if (view.moments && marks) {
            wrap.appendChild(el('small', 'stis-sent-moments', `Moments: ${marks.map((value, at) => `${at + 1} · ${view.times?.length ? `${Number(value).toFixed(1)} s` : `frame ${value + 1}${view.total ? ` of ${view.total}` : ''}`}`).join(', ')}`));
        } else if (!view.moments && view.seconds) {
            wrap.appendChild(el('small', 'stis-sent-moments', 'Only the first moment of the GIF was sent.'));
        }
        view.pictures.forEach(src => {
            const image = el('img', 'stis-sent-img');
            image.src = src;
            image.alt = title;
            wrap.appendChild(image);
        });
        const prompted = el('div', 'stis-sent-answer stis-sent-prompted');
        if (view.prompt) {
            const area = el('textarea', 'text_pole stis-sent-prompt-text');
            area.value = view.prompt;
            area.rows = 10;
            const row = el('div', 'stis-role-buttons');
            const again = el('div', 'menu_button stis-sent-again', 'Send again with this prompt');
            again.title = 'Send the same pictures with the prompt above (edit it to try something else)';
            row.appendChild(again);
            let sent = view.prompt;
            const run = text => {
                prompted.innerHTML = '';
                prompted.appendChild(el('small', 'stis-sent-moments', 'Asking the vision model with the prompt and the pictures…'));
                visionAsk(text, view.batch || view.pictures, view.tokens || 300, view.heat ?? 0.3).then(reply => {
                    prompted.innerHTML = '';
                    prompted.appendChild(el('small', 'stis-sent-title', text === sent ? (view.rebuilt ? 'What it says now with this prompt and these pictures' : 'What it says now with the same prompt and pictures') : 'What it says with your edited prompt'));
                    prompted.appendChild(el('div', 'stis-entry-text', reply || 'No answer.'));
                }).catch(error => {
                    prompted.innerHTML = '';
                    prompted.appendChild(el('small', 'stis-sent-moments', `Could not ask the vision model: ${error?.message || error}`));
                });
            };
            again.addEventListener('click', () => run(area.value));
            if (rebuild && !view.rebuilt) {
                const current = el('div', 'menu_button', 'Show it with my current settings');
                current.title = 'Build the prompt again from your settings as they are now, without sending it';
                current.addEventListener('click', async () => {
                    current.textContent = 'Building…';
                    try {
                        sent = await rebuild();
                        area.value = sent;
                        label.textContent = 'The prompt, with your current settings';
                        current.remove();
                    } catch (error) {
                        current.textContent = 'Show it with my current settings';
                        toastr.warning(`Could not build the prompt: ${error?.message || error}`, 'Image Search');
                    }
                });
                row.appendChild(current);
            }
            said.append(area, row);
            wrap.appendChild(prompted);
            run(view.prompt);
        } else {
            said.appendChild(el('div', 'stis-entry-text stis-sent-prompt-text', 'The prompt could not be built for this picture. Describe it again and open this again.'));
        }
        const answer = el('div', 'stis-sent-answer');
        answer.appendChild(el('small', 'stis-sent-moments', 'Asking the vision model with these pictures only…'));
        wrap.appendChild(answer);
        picturesOnlyAsk(view.pictures).then(result => {
            answer.innerHTML = '';
            answer.appendChild(el('small', 'stis-sent-title', result.asked ? `What it says with only "${result.asked}" added (it refused the pictures alone: ${result.refused})` : 'What it says with the pictures only, nothing else'));
            answer.appendChild(el('div', 'stis-entry-text', result.reply || 'No answer.'));
        }).catch(error => {
            answer.innerHTML = '';
            answer.appendChild(el('small', 'stis-sent-moments', `Could not ask the vision model: ${error?.message || error}`));
        });
        return wrap;
    };
    (async () => {
        try {
            const seen = await rebuildSent(entry, item);
            body.innerHTML = '';
            if (seen.board) {
                const index = entry.variants.indexOf(item);
                body.appendChild(part('The look at the whole sequence', seen.board, async () => (await rebuildBoardView(entry, index)).prompt));
            }
            if (seen.describe) {
                body.appendChild(part(isMulti(entry) ? 'The description of this item' : 'The description', seen.describe, async () => (await dryPrompt(entry, item)).prompt));
            }
        } catch (error) {
            body.innerHTML = '';
            body.appendChild(el('small', '', `Could not get the pictures: ${error?.message || error}`));
        }
    })();
    return box;
}

function roleEditor(entry, item, redraw) {
    const box = el('div', 'stis-role-edit');
    box.hidden = true;
    const done = async () => {
        entry.arc = entry.variants.map(member => member.role?.main || '?').join(' → ');
        entry.variants.forEach(member => descriptions.set(member.url, describedVariant(entry, member)));
        await saveLibrary();
        redraw();
    };
    box.appendChild(el('small', 'stis-role-lock-state', item.roleLock ? 'Locked: Redo all and every story rewrite keep this role and intensity, and fit the others around it.' : 'Not locked: the story step may change this role.'));
    const row = el('div', 'stis-role-buttons');
    const lock = el('div', 'menu_button', item.roleLock ? 'Unlock role' : 'Lock role');
    const allLocked = entry.variants.every(member => !member.role || member.roleLock);
    const lockAll = el('div', 'menu_button', allLocked ? 'Unlock all roles' : 'Lock all roles');
    lock.title = 'Keep this role and intensity through Redo all and every story rewrite';
    lockAll.title = 'Keep every role and intensity of this sequence as it is now';
    lock.addEventListener('click', async () => {
        item.roleLock = !item.roleLock;
        if (!item.roleLock) {
            item.diffEdited = false;
        }
        await done();
    });
    lockAll.addEventListener('click', async () => {
        entry.variants.forEach(member => {
            member.roleLock = !allLocked && Boolean(member.role);
            if (!member.roleLock) {
                member.diffEdited = false;
            }
        });
        await done();
    });
    const form = el('div', 'stis-role-form');
    const main = el('select', 'text_pole');
    [...new Set([...STORY_ROLES, item.role.main])].forEach(role => {
        const option = el('option', '', role);
        option.value = role;
        main.appendChild(option);
    });
    main.value = item.role.main;
    const sub = el('input', 'text_pole');
    sub.value = item.role.sub || '';
    sub.placeholder = 'A second word, like running or relief';
    const level = el('input', 'text_pole');
    level.type = 'number';
    level.min = '1';
    level.max = '10';
    level.value = item.role.intensity ? String(item.role.intensity) : '';
    level.placeholder = 'Intensity, 1 to 10';
    const line = el('textarea', 'text_pole');
    line.rows = 3;
    line.value = item.diff || '';
    line.placeholder = 'Story line: what this moment means in the story';
    const index = entry.variants.indexOf(item);
    const detected = entry.fromVideo?.parts?.[index] ? (entry.fromVideo.parts[index].kind === 'loop' ? 'a loop' : 'not a loop') : item.clip?.loop ? 'a loop' : 'no loop found';
    const loop = el('select', 'text_pole stis-role-loop');
    [['', `Auto (${detected})`], ['loop', 'Loop'], ['not', 'Not a loop']].forEach(([value, text]) => {
        const option = el('option', '', text);
        option.value = value;
        loop.appendChild(option);
    });
    loop.value = item.loopSet || '';
    form.append(el('small', '', 'Role'), main, sub, el('small', '', 'Intensity (1 to 10)'), level, el('small', '', 'Story line'), line, el('small', '', 'Loop'), loop);
    const keep = async locked => {
        const intensity = Math.max(0, Math.min(10, Math.round(Number(level.value) || 0)));
        item.role = { main: main.value, sub: sub.value.replace(/\s+/g, ' ').trim().slice(0, 40), ...(intensity ? { intensity, why: intensity === item.role.intensity ? item.role.why || '' : 'set by you' } : {}) };
        const text = line.value.replace(/\s+/g, ' ').trim();
        if (text !== String(item.diff || '').trim()) {
            item.diff = text;
            item.diffEdited = true;
        }
        if (locked) {
            item.roleLock = true;
        }
        item.loopSet = loop.value;
        await done();
    };
    const buttons = el('div', 'stis-role-buttons');
    const save = el('div', 'menu_button', 'Save');
    const saveLock = el('div', 'menu_button', 'Save and lock');
    const cancel = el('div', 'menu_button', 'Cancel');
    save.addEventListener('click', () => keep(false));
    saveLock.addEventListener('click', () => keep(true));
    cancel.addEventListener('click', () => {
        box.hidden = true;
    });
    buttons.append(save, saveLock, cancel);
    form.appendChild(buttons);
    row.append(lock, lockAll);
    box.append(form, row);
    return box;
}

function itemStory(entry, item, index) {
    if (item.role && item.diff) {
        return `${entry.kind === 'set' && !entry.fromVideo ? 'This version' : 'Story'} (${roleText(item.role)}${item.role.intensity ? `, intensity ${item.role.intensity}/10` : ''}): ${item.diff}`;
    }
    if (index > 0 && item.diff) {
        return `${entry.kind === 'sequence' ? `What changed since the ${entry.fromVideo ? 'part' : 'picture'} before` : `How it differs from the first ${entry.fromVideo ? 'moment' : 'version'}`}: ${item.diff}`;
    }
    return '';
}

const STORY_ROLES = ['setup', 'build-up', 'action', 'pause', 'climax', 'aftermath', 'transition'];
const VERSION_ROLES = ['base', 'variation', 'escalation', 'alternate'];
const PART_HINTS = { loop: 'a loop that repeats', burst: 'fast action with many cuts', cut: 'starts right after a scene cut', still: 'barely moving', hand: 'cut by hand' };

function versionsOnly(entry) {
    return entry.kind === 'set' && !entry.fromVideo;
}

function storyPrompt(entry, notes = '', settled = '') {
    const versions = versionsOnly(entry);
    const timed = v3On(entry);
    const items = entry.variants.map((item, index) => {
        const part = entry.fromVideo?.parts[index];
        const looped = timed ? loopWords(entry, item, index) : '';
        const hint = part ? ` (${Math.max(0, part.start).toFixed(1)} s to ${Math.max(0, part.end).toFixed(1)} s of the video${PART_HINTS[part.kind] ? `, ${PART_HINTS[part.kind]}` : ''}${looped && item.loopSet ? `, ${looped}` : ''})` : timed && (item.clip?.seconds || looped) ? ` (a GIF${item.clip?.seconds ? `, ${item.clip.seconds} s long` : ''}${looped ? `, ${looped}` : ''})` : '';
        const tags = (item.shows.length ? item.shows : item.tags.length ? item.tags : entry.tags).concat(item.added.filter(tag => !item.shows.includes(tag)));
        const fixed = item.fixes.length ? `\nThe user's correction (true): ${item.fixes.slice(-2).map(fix => fix.text).join('; ')}` : '';
        return `${versions ? 'Version' : 'Item'} ${index + 1}${hint}:\nTags: ${tags.join(', ').replace(/_/g, ' ') || 'none'}\n${item.description}${fixed}`;
    }).join('\n\n');
    const values = { kind: groupWhat(entry), count: String(entry.variants.length), items, tags: entry.tags.join(', ').replace(/_/g, ' ') };
    const text = String((versions ? settings().versionsPrompt : settings().storyPrompt) || (versions ? DEFAULT_VERSIONS_PROMPT : DEFAULT_STORY_PROMPT)).replace(/\{\{(\w+)\}\}/g, (all, key) => values[key] ?? all);
    const ruled = text.includes(NO_NAMES_RULE) ? text : `${text}\n\n${NO_NAMES_RULE}`;
    const kept = settled ? `${ruled}\n\n${settled}` : ruled;
    return notes ? `${kept}\n\nFix these in the story lines: ${notes}` : kept;
}

function lockedRoles(entry) {
    return entry.variants.map((item, index) => (item.roleLock && item.role ? { item, index, role: { ...item.role }, diff: item.diff, edited: Boolean(item.diffEdited) } : null)).filter(Boolean);
}

function settledNote(locked) {
    return locked.length ? `The user set these roles and intensities: keep them exactly as they are, and fit the other items around them:\n${locked.map(lock => `- Item ${lock.index + 1}: ${roleText(lock.role)}${lock.role.intensity ? `, intensity ${lock.role.intensity}/10` : ''}${lock.edited && lock.diff ? ` (its story line, written by the user: ${lock.diff})` : ''}`).join('\n')}` : '';
}

function parseStory(reply, count, versions) {
    const roles = versions ? VERSION_ROLES : STORY_ROLES;
    const lines = new Map();
    for (const line of String(reply || '').split('\n')) {
        const rated = line.replace(/\*\*/g, '').match(/^\s*[-*•]?\s*intensity\s*(?:of\s*)?(?:item\s*)?(\d+)\s*[:=-]\s*(\d{1,2})(?:\s*\/\s*10)?\s*[,;:.–—-]*\s*(.*)$/i);
        if (rated) {
            lines.ratings = lines.ratings || new Map();
            lines.ratings.set(Number(rated[1]), { value: Math.max(1, Math.min(10, Number(rated[2]))), why: rated[3].replace(/\s+/g, ' ').trim().slice(0, 200) });
            continue;
        }
        const shape = line.replace(/\*\*/g, '').match(/^\s*shape\s*:\s*(.+)$/i);
        if (shape) {
            lines.shape = shape[1].replace(/\s*(?:->|=>|>|→)\s*/g, ' → ').replace(/\s+/g, ' ').trim().slice(0, 300);
            continue;
        }
        const match = line.replace(/\*\*/g, '').match(/^\s*[-*•]?\s*(?:item|part|picture|version)?\s*(\d+)\s*[.):-]\s*([^:]{1,60}?)\s*:\s*(.+)$/i);
        const number = Number(match?.[1]);
        if (!match || number < 1 || number > count || lines.has(number)) {
            continue;
        }
        const words = match[2].split(/\s*[,/|·–—]\s*/).map(word => word.toLowerCase().replace(/[()"[\]]/g, '').trim()).filter(Boolean);
        const main = roles.find(role => words[0] === role || words[0]?.replace(/\s+/g, '-') === role || words[0]?.replace(/-/g, ' ') === role) || roles.find(role => words[0]?.includes(role) || words[0]?.includes(role.replace('-', ' '))) || words[0] || '';
        const text = match[3].replace(/\s+/g, ' ').trim().slice(0, 500);
        if (main && text) {
            lines.set(number, { main: main.slice(0, 40), sub: words.slice(1).join(' ').slice(0, 40), text });
        }
    }
    return lines;
}

async function writeStory(entry, notes = '', report = entry.report) {
    const count = entry.variants.length;
    const locked = versionsOnly(entry) ? [] : lockedRoles(entry);
    const asked = storyPrompt(entry, notes, [settledNote(locked), v3On(entry) && !versionsOnly(entry) ? oneMovingHint(entry) : ''].filter(Boolean).join('\n\n'));
    const reply = await textAsk(asked, 200 + 130 * count);
    if (report) {
        report.storyReply = String(reply).slice(0, 4000);
        report.storyAsked = settings().roleCheck ? asked.slice(0, 16000) : '';
    }
    const lines = parseStory(reply, count, versionsOnly(entry));
    if (!lines.size) {
        throw new Error('the answer gave no story lines');
    }
    lines.forEach((line, number) => {
        const item = entry.variants[number - 1];
        const rating = lines.ratings?.get(number);
        item.role = { main: line.main, sub: line.sub, ...(rating ? { intensity: rating.value, why: rating.why } : {}) };
        item.diff = line.text;
    });
    locked.forEach(lock => {
        lock.item.role = lock.role;
        if (lock.edited) {
            lock.item.diff = lock.diff;
        }
    });
    entry.arc = versionsOnly(entry) ? '' : (!locked.length && lines.shape) || entry.variants.map(item => item.role?.main || '?').join(' → ');
    entry.variants.forEach(item => descriptions.set(item.url, describedVariant(entry, item)));
    return lines.size;
}

function tagNotesFor(tag) {
    const notes = settings().tagNotes?.[tag];
    return Array.isArray(notes) ? notes.filter(note => note && (note.note || note.wrong)) : [];
}

function removalNotesFor(tag) {
    const notes = settings().removalNotes?.[tag];
    return Array.isArray(notes) ? notes.filter(note => note && (note.reason || note.wrong)) : [];
}

function saveRemovalNote(tag, note) {
    const s = settings();
    const all = s.removalNotes && typeof s.removalNotes === 'object' ? s.removalNotes : {};
    all[tag] = [...(Array.isArray(all[tag]) ? all[tag] : []), { ...note, at: Date.now() }].slice(-12);
    s.removalNotes = all;
    save();
    renderTagNotes();
}

function removeTag(entry, tag, info) {
    const keep = list => list.filter(other => normalizeTag(other) !== tag);
    entry.tags = keep(entry.tags);
    entry.variants.forEach(item => {
        item.tags = keep(item.tags);
        item.shows = keep(item.shows);
        item.added = keep(item.added);
    });
    if (entry.report) {
        entry.report.notShown = entry.report.notShown.filter(other => other !== tag);
    }
    entry.removedTags = { ...(entry.removedTags || {}), [tag]: { ...info, at: Date.now() } };
}

function restoreTag(entry, tag) {
    if (!entry.tags.includes(tag)) {
        entry.tags = [...entry.tags, tag];
    }
    if (entry.report && !entry.report.notShown.includes(tag)) {
        entry.report.notShown = [...entry.report.notShown, tag];
        delete entry.report.decided[tag];
    }
    const removed = { ...(entry.removedTags || {}) };
    delete removed[tag];
    entry.removedTags = removed;
}

function plainNote(text, entry) {
    return String(text || '').replace(/\b(?:item|part|picture|pic|version|gif)s?\s*#?(\d+)\b/gi, (all, number) => {
        const role = roleText(entry.variants[Number(number) - 1]?.role);
        return role ? `the ${role} item` : 'another item';
    });
}

function saveTagNote(tag, note) {
    const s = settings();
    const all = s.tagNotes && typeof s.tagNotes === 'object' ? s.tagNotes : {};
    all[tag] = [...(Array.isArray(all[tag]) ? all[tag] : []), { ...note, at: Date.now() }].slice(-12);
    s.tagNotes = all;
    save();
    renderTagNotes();
}

let browsedTag = '';

function noteRow(note, onChange, onRemove, extra = '') {
    const row = el('div', 'stis-tag-note');
    const head = el('div', 'stis-tag-note-head');
    head.appendChild(el('small', 'stis-tag-note-kind', extra));
    if ('lasts' in note && !note.wrong) {
        const lasts = el('span', 'stis-fchip stis-tag-note-lasts', 'Lasts after');
        lasts.classList.toggle('stis-fchip-on', Boolean(note.lasts));
        lasts.addEventListener('click', () => {
            note.lasts = !note.lasts;
            lasts.classList.toggle('stis-fchip-on', note.lasts);
            onChange();
        });
        head.appendChild(lasts);
    }
    const remove = el('a', 'stis-tag-note-remove', '×');
    remove.href = '#';
    remove.title = 'Forget this';
    remove.addEventListener('click', event => {
        event.preventDefault();
        onRemove();
    });
    head.appendChild(remove);
    const key = 'reason' in note && !('note' in note) ? 'reason' : 'note';
    const text = el('input', 'text_pole stis-tag-note-text');
    text.type = 'text';
    text.value = note[key] || '';
    text.addEventListener('input', () => {
        note[key] = text.value;
        onChange();
    });
    row.append(head, text);
    if (note.story) {
        row.appendChild(el('small', 'stis-help', `That item's story line: ${note.story}`));
    }
    return row;
}

function renderTagNotes() {
    const box = document.getElementById('st_imagesearch_tag_notes');
    if (!box) {
        return;
    }
    box.innerHTML = '';
    const s = settings();
    const tags = [...new Set([...normalizeTagList(s.tagsMatter), ...Object.keys(s.tagNotes || {}).filter(tag => tagNotesFor(tag).length), ...Object.keys(s.removalNotes || {}).filter(tag => removalNotesFor(tag).length)])].sort();
    if (!tags.length) {
        box.appendChild(el('small', 'stis-help', 'None yet. Tags you mark as important in the library are listed here.'));
        return;
    }
    const list = el('div', 'stis-tag-browse');
    tags.forEach(tag => {
        const chip = el('span', 'stis-fchip stis-tag-browse-chip', tag.replace(/_/g, ' '));
        chip.dataset.tag = tag;
        const count = tagNotesFor(tag).length + removalNotesFor(tag).length;
        if (count) {
            chip.appendChild(el('small', 'stis-tag-browse-count', ` ${count}`));
        }
        chip.classList.toggle('stis-fchip-on', tag === browsedTag);
        chip.addEventListener('click', () => {
            browsedTag = browsedTag === tag ? '' : tag;
            renderTagNotes();
        });
        list.appendChild(chip);
    });
    box.appendChild(list);
    if (!browsedTag || !tags.includes(browsedTag)) {
        box.appendChild(el('small', 'stis-help', 'Tap a tag to see its definition and what you wrote.'));
        return;
    }
    const tag = browsedTag;
    const card = el('div', 'stis-tag-card');
    const title = el('div', 'stis-tag-card-title');
    title.appendChild(el('b', '', tag.replace(/_/g, ' ')));
    const meaning = s.tagDefinitions?.[tag];
    if (meaning?.url) {
        const link = el('a', 'stis-tag-def-source', `${meaning.site} wiki${meaning.title && meaning.title !== tag ? ` (${meaning.title.replace(/_/g, ' ')})` : ''}`);
        link.href = meaning.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        title.appendChild(link);
    }
    const again = el('a', 'stis-tag-note-remove', 'Fetch again');
    again.href = '#';
    again.title = 'Copy the definition from the wiki again';
    again.addEventListener('click', event => {
        event.preventDefault();
        again.textContent = 'Fetching…';
        ensureDefinitions([tag], '', { again: true }).finally(renderTagNotes);
    });
    title.appendChild(again);
    card.appendChild(title);
    card.appendChild(el('div', meaning?.text ? 'stis-tag-def' : 'stis-help', meaning?.text || (meaning?.none ? `No wiki entry found (${meaning.site}).` : definitionJobs.has(tag) ? 'Fetching the definition…' : 'No definition yet.')));
    const keep = () => save();
    const notes = tagNotesFor(tag);
    card.appendChild(el('div', 'stis-tag-card-head', `What you wrote${notes.length ? '' : ': nothing yet'}`));
    notes.forEach(note => {
        const label = `${note.wrong ? 'wrongly deduced' : note.confirmed ? 'deduced and confirmed' : note.fromFix ? 'from a correction' : 'placed'}${note.role ? ` in the ${note.role} item` : ''}${note.kind ? ` of a ${note.kind}` : ''}`;
        card.appendChild(noteRow(note, keep, () => {
            s.tagNotes[tag] = tagNotesFor(tag).filter(other => other !== note);
            if (!s.tagNotes[tag].length) {
                delete s.tagNotes[tag];
            }
            keep();
            renderTagNotes();
        }, label));
    });
    const removals = removalNotesFor(tag);
    if (removals.length) {
        card.appendChild(el('div', 'stis-tag-card-head', 'When it did not apply'));
        removals.forEach(note => {
            card.appendChild(noteRow(note, keep, () => {
                s.removalNotes[tag] = removalNotesFor(tag).filter(other => other !== note);
                if (!s.removalNotes[tag].length) {
                    delete s.removalNotes[tag];
                }
                keep();
                renderTagNotes();
            }, `${note.wrong ? 'taken out wrongly' : note.confirmed ? 'taken out by the AI, confirmed' : 'taken out'}${note.kind ? ` of a ${note.kind}` : ''}`));
        });
    }
    const add = el('div', 'stis-tag-note-add');
    const noteBox = el('input', 'text_pole');
    noteBox.type = 'text';
    noteBox.placeholder = 'Add a note: when it happens, and how to tell';
    const addButton = el('div', 'menu_button', 'Add note');
    addButton.addEventListener('click', () => {
        if (!noteBox.value.trim()) {
            return;
        }
        saveTagNote(tag, { note: noteBox.value.trim(), lasts: false, role: '', story: '', kind: '' });
    });
    add.append(noteBox, addButton);
    card.appendChild(add);
    box.appendChild(card);
}

function deducePrompt(entry, tags) {
    const items = entry.variants.map((item, index) => `Item ${index + 1}${item.role ? ` (${roleText(item.role)})` : ''}: ${[item.diff, item.sections?.action ? `Action: ${item.sections.action}` : ''].filter(Boolean).join(' ') || shortDescription({ ...entry, sections: item.sections, description: item.description })}`).join('\n');
    const notes = tags.flatMap(tag => tagNotesFor(tag).map(note => `- ${tag.replace(/_/g, ' ')}: ${note.wrong ? `once wrongly placed in the ${note.role || 'an'} item${note.story ? ` ("${note.story}")` : ''}; the user said why that was wrong: "${note.note || 'no reason given'}"` : note.fromFix ? `the user corrected a description${note.role ? ` of the ${note.role} item of a ${note.kind || 'group'}` : ''}${note.story ? ` ("${note.story}")` : ''}, saying it shows this tag: "${note.note}"` : `${note.confirmed ? 'it was deduced in' : 'the user placed it in'} the ${note.role || 'an'} item of a ${note.kind || 'group'}${note.story ? ` ("${note.story}")` : ''}${note.lasts ? ', and it lasted for the items after' : ''}, ${note.confirmed ? 'and the user confirmed it: ' : 'saying: '}"${note.note || 'no reason given'}"`}`));
    const definitions = tags.map(tag => (definitionLine(tag) ? `- ${tag.replace(/_/g, ' ')}: ${definitionLine(tag)}` : '')).filter(Boolean);
    const removals = tags.flatMap(tag => removalNotesFor(tag).slice(-4).map(note => `- ${tag.replace(/_/g, ' ')}: ${note.wrong ? `once taken out wrongly; the user said it did apply: "${note.reason}"` : `the user took it out of a ${note.kind || 'group'} as not applying there${note.confirmed ? ' (confirmed)' : ''}: "${note.reason || 'no reason given'}"`}`));
    return `These are the items of one ${groupWhat(entry)}, in order, with their roles and what happens:\n${items}\n\nThe group's site tags include ${tags.length === 1 ? 'this tag' : 'these tags'}, but nobody saw ${tags.length === 1 ? 'it' : 'them'} in any item: ${tags.join(', ').replace(/_/g, ' ')}.${definitions.length ? `\nWhat the tags mean, copied from the site's wiki (read this first):\n${definitions.join('\n')}` : ''}${notes.length ? `\nWhat the user said about such tags before:\n${notes.join('\n')}` : ''}${removals.length ? `\nWhen the user said such tags did not apply:\n${removals.join('\n')}` : ''}\n\nFor each tag, decide whether it most likely happens in one of the items, even off screen or only implied, judging from what happens and from the user's notes; or, when this group is like the cases where the user said it did not apply, that it does not apply here. Something that happened does not go away by itself: if it is a lasting state (an injury, torn or wet clothes, a mess), it lasts for the items after. Never place a tag in an item whose description shows something that does not fit it. Only place a tag when you are fairly sure; otherwise answer none.\n\nReply with one line per tag and nothing else, like:\ntag: item 3, lasts, because ...\ntag: item 2, because ...\ntag: remove, because ... (it does not apply to this group)\ntag: none, because ...`;
}

async function deduceTags(entry, tags, report = null) {
    const reply = await textAsk(deducePrompt(entry, tags), 80 + 70 * tags.length);
    if (report) {
        report.deduceReply = String(reply).slice(0, 3000);
    }
    const wanted = new Set(tags);
    const found = new Map();
    const declined = new Map();
    for (const line of reply.split('\n')) {
        const match = line.replace(LIST_MARK, '').replace(/\*\*/g, '').match(/^`?([^:`]+?)`?\s*:\s*(?:(none|remove)\b|(?:item|part|picture|version)?\s*(\d+)\s*(?:[,;]?\s*(lasts?)\b)?)[\s,;:.–—-]*(.*)$/i);
        if (!match) {
            continue;
        }
        const tag = normalizeTag(match[1].replace(/[*"]/g, ''));
        const number = Number(match[3]);
        if (wanted.has(tag) && /^remove$/i.test(match[2] || '') && !found.has(tag)) {
            found.set(tag, { remove: true, why: match[5].replace(/^because\s+/i, '').replace(/\s+/g, ' ').trim().slice(0, 300) || 'it does not apply here' });
            continue;
        }
        if (wanted.has(tag) && match[2] && !declined.has(tag)) {
            declined.set(tag, match[5].replace(/^because\s+/i, '').replace(/\s+/g, ' ').trim().slice(0, 300));
        }
        if (!wanted.has(tag) || found.has(tag) || match[2] || number < 1 || number > entry.variants.length) {
            continue;
        }
        found.set(tag, { item: number, lasts: Boolean(match[4]), why: match[5].replace(/^because\s+/i, '').replace(/\s+/g, ' ').trim().slice(0, 300) || 'it most likely happens here' });
    }
    if (report) {
        tags.forEach(tag => {
            const place = found.get(tag);
            report.noteLog.push(place?.remove ? `${tag.replace(/_/g, ' ')}: taken out from your notes as not applying here, because ${place.why}` : place ? `${tag.replace(/_/g, ' ')}: placed from your notes in item ${place.item}${place.lasts ? ' and after' : ''}, because ${place.why}` : declined.has(tag) ? `${tag.replace(/_/g, ' ')}: not placed, ${declined.get(tag) ? `because ${declined.get(tag)}` : 'no reason given'}` : `${tag.replace(/_/g, ' ')}: the answer did not mention it`);
        });
    }
    return found;
}

async function placeDeduced(entry, report, found) {
    const updates = new Map();
    for (const [tag, place] of found) {
        if (place.remove) {
            removeTag(entry, tag, { reason: place.why, by: 'ai' });
            report.notShown = report.notShown.filter(other => other !== tag);
            continue;
        }
        const numbers = (place.lasts ? entry.variants.map((item, index) => index + 1).filter(number => number >= place.item) : [place.item]);
        report.deduced[tag] = { items: numbers, why: place.why, lasts: place.lasts };
        report.notShown = report.notShown.filter(other => other !== tag);
        numbers.forEach(number => updates.set(number - 1, [...(updates.get(number - 1) || []), { tag, why: number === place.item ? place.why : `it happened in item ${place.item} and lasts` }]));
    }
    for (const [index, list] of [...updates].sort((a, b) => a[0] - b[0])) {
        const item = entry.variants[index];
        groupStep(entry, `Adding ${list.map(d => d.tag).join(', ').replace(/_/g, ' ')} to item ${index + 1}…`);
        item.before = item.before || { description: item.description, sections: item.sections, keywords: item.keywords };
        item.deduced = [...item.deduced.filter(d => !list.some(other => other.tag === d.tag)), ...list];
        item.shows = [...new Set([...item.shows, ...list.map(d => d.tag)])];
        try {
            await describeItem(entry, index, null, { trusted: false, missed: list.map(d => d.tag), why: Object.fromEntries(list.map(d => [d.tag, `it was not seen, but it most likely happens here: ${d.why}`])) });
        } catch (error) {
            report.errors.push(`Adding a deduced tag to item ${index + 1}: ${error?.message || error}`);
        }
    }
    return updates.size;
}

const WIKI_SOURCES = {
    danbooru: {
        url: (origin, tag) => `${origin}/wiki_pages/${encodeURIComponent(tag)}.json`,
        page: (origin, tag) => `${origin}/wiki_pages/${encodeURIComponent(tag)}`,
        read: data => (data && !Array.isArray(data) && !data.is_deleted ? data.body : ''),
        alias: (origin, tag) => `${origin}/tag_aliases.json?search%5Bantecedent_name%5D=${encodeURIComponent(tag)}&search%5Bstatus%5D=active&limit=1`,
    },
    e621: {
        url: (origin, tag) => `${origin}/wiki_pages.json?search%5Btitle%5D=${encodeURIComponent(tag)}&limit=1`,
        page: (origin, tag) => `${origin}/wiki_pages/show_or_new?title=${encodeURIComponent(tag)}`,
        read: (data, tag) => (Array.isArray(data) ? data.find(page => normalizeTag(page.title) === tag)?.body || '' : ''),
        alias: (origin, tag) => `${origin}/tag_aliases.json?search%5Bantecedent_name%5D=${encodeURIComponent(tag)}&search%5Bstatus%5D=active&limit=1`,
    },
    moebooru: {
        url: (origin, tag) => `${origin}/wiki.json?query=${encodeURIComponent(tag)}&limit=10`,
        page: (origin, tag) => `${origin}/wiki/show?title=${encodeURIComponent(tag)}`,
        read: (data, tag) => (Array.isArray(data) ? data.find(page => normalizeTag(page.title) === tag)?.body || '' : ''),
    },
    philomena: {
        url: (origin, tag) => `${origin}/api/v1/json/tags/${philomenaSlug(tag)}`,
        page: (origin, tag) => `${origin}/tags/${philomenaSlug(tag)}`,
        read: data => data?.tag?.description || data?.tag?.short_description || '',
    },
};

function philomenaSlug(tag) {
    const swaps = { '-': '-dash-', '/': '-fwslash-', '\\': '-bwslash-', ':': '-colon-', '.': '-dot-', '+': '-plus-' };
    return encodeURIComponent(tag.replace(/_/g, ' ').replace(/[-/\\:.+]/g, char => swaps[char])).replace(/%20/g, '+');
}

function definitionText(body) {
    const lines = String(body || '').replace(/\r/g, '').split('\n');
    const kept = [];
    for (const raw of lines) {
        const line = raw.trim();
        if (/^h[1-6]\.\s/i.test(line) || /^#{1,6}\s/.test(line)) {
            if (kept.some(text => text)) {
                break;
            }
            continue;
        }
        if (!line && kept.some(text => text)) {
            if (kept.join(' ').length > 120) {
                break;
            }
            continue;
        }
        if (/^\*+\s/.test(line) || /^(see also|related tags?)\b/i.test(line)) {
            if (kept.some(text => text)) {
                break;
            }
            continue;
        }
        kept.push(line);
    }
    const text = kept.join(' ')
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, (all, name) => name.replace(/_/g, ' '))
        .replace(/\{\{([^}]+)\}\}/g, (all, name) => name.replace(/_/g, ' '))
        .replace(/"([^"]+)":\[?(https?:\/\/[^\s\]]+|\/[^\s\]]+)\]?/g, '$1')
        .replace(/\[url=[^\]]*\]([^[]*)\[\/url\]/gi, '$1')
        .replace(/\[\/?(b|i|u|s|tn|spoiler|code|quote|expand)[^\]]*\]/gi, '')
        .replace(/<\/?[a-z][^>]*>/gi, '')
        .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    if (text.length <= 500) {
        return text;
    }
    const cut = text.slice(0, 500);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    return end > 150 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
}

const definitionJobs = new Map();
let definitionTimer = null;

async function wikiDefinition(domain, engineName, tag) {
    const source = WIKI_SOURCES[engineName];
    const origin = `https://${domain}`;
    const read = async name => {
        const result = await request(source.url(origin, name));
        if (result.status === 404) {
            return '';
        }
        if (!result.ok) {
            throw new Error(`${domain} answered ${result.status}`);
        }
        return definitionText(source.read(result.data, name));
    };
    let name = tag;
    let text = await read(name);
    if (!text && source.alias) {
        const alias = await request(source.alias(origin, tag));
        const target = Array.isArray(alias.data) ? normalizeTag(alias.data[0]?.consequent_name || '') : '';
        if (target && target !== tag) {
            name = target;
            text = await read(name);
        }
    }
    return text ? { text, site: domain, url: source.page(origin, name), title: name, at: Date.now() } : null;
}

async function findDefinition(tag, site = '') {
    const tries = [];
    const own = siteEntries().find(entry => entry.domain === site);
    if (own) {
        const engineName = await engineOf(own, [tag]).catch(() => '');
        if (WIKI_SOURCES[engineName]) {
            tries.push([own.domain, engineName]);
        }
    }
    if (!tries.some(([domain]) => DONMAI.test(domain))) {
        tries.push(['danbooru.donmai.us', 'danbooru']);
    }
    let failure = null;
    for (const [domain, engineName] of tries) {
        try {
            const found = await wikiDefinition(domain, engineName, tag);
            if (found) {
                return found;
            }
        } catch (error) {
            failure = error;
        }
    }
    if (failure && tries.length === 1) {
        throw failure;
    }
    return { none: true, at: Date.now(), site: tries.map(([domain]) => domain).join(', ') };
}

function tagDefinition(tag) {
    const found = settings().tagDefinitions?.[tag];
    return found && !found.none && found.text ? found : null;
}

async function ensureDefinitions(tags, site = '', { again = false } = {}) {
    const s = settings();
    const all = s.tagDefinitions && typeof s.tagDefinitions === 'object' ? s.tagDefinitions : (s.tagDefinitions = {});
    const month = 30 * 24 * 3600 * 1000;
    const wanted = [...new Set(tags.map(normalizeTag).filter(Boolean))].filter(tag => again || !all[tag] || (all[tag].none && Date.now() - (all[tag].at || 0) > month));
    await eachLimit(wanted, 2, async tag => {
        if (!definitionJobs.has(tag)) {
            definitionJobs.set(tag, findDefinition(tag, site).then(found => {
                all[tag] = found;
                save();
                renderDefinitions();
            }).catch(error => console.warn(`[Image Search] no definition for ${tag}`, error)).finally(() => definitionJobs.delete(tag)));
        }
        await definitionJobs.get(tag);
    });
    return Object.fromEntries(tags.map(tag => [tag, tagDefinition(tag)]).filter(([, found]) => found));
}

function definitionLine(tag) {
    const found = tagDefinition(tag);
    return found ? `Definition (${found.site} wiki): "${found.text}"` : '';
}

function renderDefinitions() {
    renderTagNotes();
}

function tagLinksFor(tag) {
    return (settings().tagLinks || []).filter(link => link && (link.a === tag || link.b === tag)).map(link => (link.a === tag ? link.b : link.a));
}

function saveTagLink(a, b, by) {
    const s = settings();
    const one = normalizeTag(a);
    const two = normalizeTag(b);
    if (!one || !two || one === two || tagShape(one) === tagShape(two)) {
        return false;
    }
    const links = Array.isArray(s.tagLinks) ? s.tagLinks : [];
    if (links.some(link => (link.a === one && link.b === two) || (link.a === two && link.b === one))) {
        return false;
    }
    links.push({ a: one, b: two, by, at: Date.now() });
    s.tagLinks = links.slice(-400);
    save();
    renderTagLinks();
    return true;
}

async function siteAliases(tags, site = '') {
    const month = 30 * 24 * 3600 * 1000;
    const known = deviceCache('tagAliasChecked');
    const wanted = tags.filter(tag => !known[tag] || Date.now() - known[tag] > month).slice(0, 12);
    if (!wanted.length) {
        return 0;
    }
    const own = siteEntries().find(entry => entry.domain === site);
    const engineName = own ? await engineOf(own, wanted).catch(() => '') : '';
    const domain = own && (engineName === 'danbooru' || engineName === 'e621') ? own.domain : 'danbooru.donmai.us';
    let made = 0;
    await eachLimit(wanted, 2, async tag => {
        try {
            const origin = `https://${domain}`;
            const [to, from] = await Promise.all([
                request(`${origin}/tag_aliases.json?search%5Bconsequent_name%5D=${encodeURIComponent(tag)}&search%5Bstatus%5D=active&limit=50`),
                request(`${origin}/tag_aliases.json?search%5Bantecedent_name%5D=${encodeURIComponent(tag)}&search%5Bstatus%5D=active&limit=5`),
            ]);
            const names = [...(Array.isArray(to.data) ? to.data.map(alias => alias.antecedent_name) : []), ...(Array.isArray(from.data) ? from.data.map(alias => alias.consequent_name) : [])];
            names.forEach(name => {
                if (saveTagLink(tag, name, 'site')) {
                    made += 1;
                }
            });
            keepDeviceCache('tagAliasChecked', { ...deviceCache('tagAliasChecked'), [tag]: Date.now() });
        } catch (error) {
            console.warn(`[Image Search] could not read the aliases of ${tag}`, error);
        }
    });
    const checked = Object.entries(deviceCache('tagAliasChecked'));
    if (checked.length > 1500) {
        keepDeviceCache('tagAliasChecked', Object.fromEntries(checked.sort((a, b) => b[1] - a[1]).slice(0, 1200)));
    }
    return made;
}

async function aiTagLinks(entry, tags, report) {
    const items = entry.variants.map((item, index) => `Item ${index + 1}: ${item.seen.join(', ') || 'nothing listed'}`).join('\n');
    const meanings = tags.map(tag => (definitionLine(tag) ? `- ${tag}: ${definitionLine(tag)}` : '')).filter(Boolean);
    const prompt = `Some image-board tags of a ${groupWhat(entry)} were not found. A first look at each picture, made without seeing the real tags, listed its own tags, maybe with other words for the same thing.\n\nTags not found: ${tags.join(', ')}${meanings.length ? `\nWhat they mean (copied from the site's wiki):\n${meanings.join('\n')}` : ''}\n\nWhat the first look listed:\n${items}\n\nFor each tag not found, say which items list a tag that means the same thing, only written differently: another word, another spelling or language, or more or less wording for the same visible thing. A tag that is only related does not count.\n\nReply with one line per tag not found and nothing else, like:\n${tags[0]}: item 2 = other_word\n${tags[0]}: none`;
    const reply = await textAsk(prompt, 60 + 50 * tags.length);
    report.linkReply = String(reply).slice(0, 2000);
    const found = new Map();
    for (const line of String(reply).split('\n')) {
        const match = line.replace(LIST_MARK, '').replace(/\*\*/g, '').match(/^`?([^:`]+?)`?\s*:\s*(.+)$/);
        const tag = normalizeTag(match?.[1] || '');
        if (!match || !tags.includes(tag) || /^none\b/i.test(match[2].trim())) {
            continue;
        }
        for (const part of match[2].split(/[;,](?=\s*(?:item|part|picture)?\s*\d)/i)) {
            const pair = part.match(/(?:item|part|picture)?\s*(\d+)\s*[=:(-]\s*`?([^`)]+?)`?\)?\s*$/i);
            const number = Number(pair?.[1]);
            const word = normalizeTag(pair?.[2] || '');
            const item = entry.variants[number - 1];
            if (item && word && item.seen.map(normalizeTag).includes(word)) {
                found.set(tag, [...(found.get(tag) || []), word]);
            }
        }
    }
    found.forEach((words, tag) => [...new Set(words)].forEach(word => saveTagLink(tag, word, 'ai')));
    return found;
}

function inTextPrompt(entry, tags) {
    const items = entry.variants.map((item, index) => `Item ${index + 1}: ${String(item.description || '').replace(/\s+/g, ' ').trim().slice(0, 1500) || 'no description'}`).join('\n');
    const hints = tagHintLines(tags);
    return `Some image-board tags of a ${groupWhat(entry)} were not found when its items were first looked at, but the descriptions written afterwards may already show them.\n\nTags not found: ${tags.join(', ')}${hints.length ? `\nWhat they mean (copied from the site's wiki) and what the user said about them in earlier pictures:\n${hints.join('\n')}` : ''}\n\nThe descriptions:\n${items}\n\nFor each tag not found, say which items' descriptions show it. Tags and pictures never match word for word: a tag counts when a description shows the same thing or something close to it, in any words, even if a detail differs or it shows only part of what the tag means. Say none only when no description points to it.\n\nReply with one line per tag not found and nothing else, with a few words from each description that shows it, like:\n${tags[0]}: item 1 = "a few words from it"; item 3 = "a few words from it"\n${tags[0]}: none`;
}

function echoesText(words, text) {
    const wordsOf = value => String(value).toLowerCase().match(/[a-z\u00c0-\u024f']{4,}/g) || [];
    const list = wordsOf(words);
    if (!list.length) {
        return true;
    }
    const known = new Set(wordsOf(text));
    return list.filter(word => known.has(word)).length * 2 >= list.length;
}

async function describedTags(entry, tags, report) {
    const reply = await textAsk(inTextPrompt(entry, tags), 60 + 60 * tags.length);
    report.inTextReply = String(reply).slice(0, 2000);
    const found = new Map();
    for (const line of String(reply).split('\n')) {
        const match = line.replace(LIST_MARK, '').replace(/\*\*/g, '').match(/^`?([^:`]+?)`?\s*:\s*(.+)$/);
        const tag = normalizeTag(match?.[1] || '');
        if (!match || !tags.includes(tag) || /^none\b/i.test(match[2].trim())) {
            continue;
        }
        for (const part of match[2].split(/;(?=\s*(?:items?|parts?|pictures?)?\s*\d)/i)) {
            const quoted = part.match(/["“]([^"”]+)["”]/);
            const words = (quoted?.[1] || part.split('=').slice(1).join('=')).replace(/\s+/g, ' ').trim().slice(0, 160);
            const numbers = [...new Set((part.split(/[=“"]/)[0].match(/\d+/g) || []).map(Number))].filter(number => entry.variants[number - 1]);
            if (!numbers.length || !numbers.some(number => echoesText(words, entry.variants[number - 1].description))) {
                continue;
            }
            const hits = found.get(tag) || [];
            numbers.filter(number => !hits.some(hit => hit.item === number)).forEach(number => hits.push({ item: number, words }));
            found.set(tag, hits);
        }
    }
    found.forEach(hits => hits.sort((a, b) => a.item - b.item));
    return found;
}

function renderSpellings() {
    const box = document.getElementById('st_imagesearch_spellings');
    if (!box) {
        return;
    }
    box.innerHTML = '';
    const store = spellingStore();
    const rows = Object.entries(store).flatMap(([domain, tags]) => Object.entries(tags || {}).map(([tag, value]) => ({ domain, tag, value })));
    if (!rows.length) {
        box.appendChild(el('small', 'stis-help', 'None yet. They are found as you search.'));
    }
    const words = { order: 'other order', link: 'your links', alias: 'site alias', ai: 'Tag model', you: 'by you' };
    rows.sort((a, b) => a.domain.localeCompare(b.domain) || a.tag.localeCompare(b.tag)).forEach(({ domain, tag, value }) => {
        const row = el('div', 'stis-tag-link');
        row.appendChild(el('span', '', `${domain}: ${tag.replace(/_/g, ' ')} → ${value.to ? value.to.replace(/_/g, ' ') : 'none'}`));
        row.appendChild(el('small', 'stis-tag-note-kind', ` ${words[value.by] || ''}`));
        const remove = el('a', 'stis-tag-note-remove', '×');
        remove.href = '#';
        remove.title = 'Forget this; it is looked for again at the next search';
        remove.addEventListener('click', event => {
            event.preventDefault();
            delete store[domain][tag];
            if (!Object.keys(store[domain]).length) {
                delete store[domain];
            }
            save();
            renderSpellings();
        });
        row.appendChild(remove);
        box.appendChild(row);
    });
    const add = el('div', 'stis-tag-note-add');
    const site = el('select', 'text_pole');
    siteEntries().forEach(entry => site.appendChild(el('option', '', entry.domain)));
    const one = el('input', 'text_pole');
    one.type = 'text';
    one.placeholder = 'tag';
    const two = el('input', 'text_pole');
    two.type = 'text';
    two.placeholder = "the site's own word (empty: none)";
    const button = el('div', 'menu_button', 'Add');
    button.addEventListener('click', () => {
        const tag = normalizeTag(one.value);
        if (!tag || !site.value) {
            return;
        }
        keepSpelling(site.value, tag, normalizeTag(two.value), 'you');
    });
    add.append(site, one, two, button);
    box.appendChild(add);
}

function renderTagLinks() {
    const box = document.getElementById('st_imagesearch_tag_links');
    if (!box) {
        return;
    }
    box.innerHTML = '';
    const s = settings();
    const links = Array.isArray(s.tagLinks) ? s.tagLinks : [];
    if (!links.length) {
        box.appendChild(el('small', 'stis-help', 'None yet. Links are made from the sites\' aliases and, for important tags not found, by the AI.'));
    }
    const words = { site: 'from the site', ai: 'by the AI', you: 'by you' };
    [...links].sort((x, y) => x.a.localeCompare(y.a)).forEach(link => {
        const row = el('div', 'stis-tag-link');
        row.appendChild(el('span', '', `${link.a.replace(/_/g, ' ')} = ${link.b.replace(/_/g, ' ')}`));
        row.appendChild(el('small', 'stis-tag-note-kind', ` ${words[link.by] || ''}`));
        const remove = el('a', 'stis-tag-note-remove', '×');
        remove.href = '#';
        remove.title = 'Forget this link';
        remove.addEventListener('click', event => {
            event.preventDefault();
            s.tagLinks = (s.tagLinks || []).filter(other => other !== link);
            save();
            renderTagLinks();
        });
        row.appendChild(remove);
        box.appendChild(row);
    });
    const add = el('div', 'stis-tag-note-add');
    const one = el('input', 'text_pole');
    one.type = 'text';
    one.placeholder = 'tag';
    const two = el('input', 'text_pole');
    two.type = 'text';
    two.placeholder = 'same tag, written differently';
    const button = el('div', 'menu_button', 'Link');
    button.addEventListener('click', () => {
        saveTagLink(one.value, two.value, 'you');
    });
    add.append(one, two, button);
    box.appendChild(add);
}

function rememberedTags() {
    const s = settings();
    return { matter: new Set(normalizeTagList(s.tagsMatter)), dont: new Set(normalizeTagList(s.tagsDontMatter)) };
}

function rememberTag(tag, important, site = '') {
    const s = settings();
    if (important) {
        ensureDefinitions([tag], site).catch(error => console.warn('[Image Search] could not fetch a tag definition', error));
    }
    const { matter, dont } = rememberedTags();
    (important ? dont : matter).delete(tag);
    (important ? matter : dont).add(tag);
    s.tagsMatter = [...matter].join('\n');
    s.tagsDontMatter = [...dont].join('\n');
    for (const [id, value] of [['st_imagesearch_tags_matter', s.tagsMatter], ['st_imagesearch_tags_dont_matter', s.tagsDontMatter]]) {
        const box = document.getElementById(id);
        if (box) {
            box.value = value;
        }
    }
    save();
}

function jsonIn(text) {
    const cleaned = String(text || '').replace(/```(?:json)?/gi, '');
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) {
        return null;
    }
    try {
        return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
        return null;
    }
}

async function reviewGroup(entry) {
    const blocks = entry.variants.map((item, index) => [`Item ${index + 1}:`, `Tags given: ${item.shows.join(', ').replace(/_/g, ' ') || 'none'}`, `First look: ${item.seen.join(', ').replace(/_/g, ' ') || 'none'}`, item.description, item.role ? `Role: ${roleText(item.role)}\nStory line: ${item.diff || 'not given'}` : '', item.deduced.length ? `Not seen, but placed here from the user's notes: ${item.deduced.map(d => `${d.tag.replace(/_/g, ' ')} (${d.why})`).join('; ')}` : ''].filter(Boolean).join('\n')).join('\n\n');
    const prompt = `You are checking the descriptions of the ${entry.variants.length} items of one ${groupWhat(entry)}. Each was written by someone looking at that picture. For each item you get the tags it was given, the tags a first look saw in it, its description, and its role and story line in the group.${entry.arc ? ` The shape given to the group: ${entry.arc}.` : ''}\n\nLook for these problems:\n- a tag given to an item that its description leaves out or contradicts (only tags about what can be seen);\n- the same person or thing described differently between items (hair, eyes, skin, clothing) with nothing in the story lines to explain it;\n- something described that is in neither the item's tags nor its first look, so it may be invented;\n- a story line that its description does not support (the roles and intensities are settled and correct: never question them);\n- a person or character called by a name in a description or story line (they must be he, she, they or described);\n- a person count that drops from one item to the next with nothing in the story to explain it (someone hidden or out of view still counts).\nOnly report real problems; most items have none.\n\nThen write an overview of the whole group: 1 to 2 sentences on who is in it and what happens from the first item to the last, without names.\n\nReply with only JSON like this:\n{"overview": "...", "keywords": ["...", "..."], "problems": [{"item": 2, "about": "description", "problem": "..."}]}\nUse "about": "story" for a problem with the role or story line, and "description" for the rest.\n\n${blocks}`;
    const data = jsonIn(await textAsk(prompt, 300 + 80 * entry.variants.length));
    if (!data) {
        throw new Error('the check gave no readable answer');
    }
    return {
        overview: String(data.overview || '').replace(/\s+/g, ' ').trim().slice(0, 600),
        keywords: Array.isArray(data.keywords) ? data.keywords.map(word => String(word).toLowerCase().trim()).filter(Boolean).slice(0, 12) : [],
        problems: Array.isArray(data.problems) ? data.problems.filter(item => item && item.problem).map(item => ({ item: Number(item.item) || 0, about: String(item.about || '').toLowerCase() === 'story' ? 'story' : 'description', problem: String(item.problem).replace(/\s+/g, ' ').trim().slice(0, 300) })) : [],
    };
}

function importancePrompt(entry, tags, missing) {
    const items = entry.variants.map((item, index) => `Item ${index + 1}: ${[item.sections?.action, item.diff].filter(Boolean).join(' ') || shortDescription({ ...entry, sections: item.sections, description: item.description })}`).join('\n');
    const { matter, dont } = rememberedTags();
    const remembered = [matter.size ? `Tags the user said matter: ${[...matter].slice(0, 40).join(', ')}.` : '', dont.size ? `Tags the user threw out as unimportant: ${[...dont].slice(0, 40).join(', ')}.` : ''].filter(Boolean);
    const rememberedText = remembered.length ? `${remembered.join(' ')} Judge similar tags the same way.` : '';
    const values = { kind: groupWhat(entry), count: String(entry.variants.length), items, tags: tags.join(', ') || 'none', missing: missing.join(', '), overview: entry.description || '', remembered: rememberedText };
    const template = String(settings().importancePrompt || DEFAULT_IMPORTANCE_PROMPT);
    const text = template.replace(/\{\{(\w+)\}\}/g, (all, key) => values[key] ?? all);
    const definitions = missing.map(tag => (definitionLine(tag) ? `- ${tag.replace(/_/g, ' ')}: ${definitionLine(tag)}` : '')).filter(Boolean);
    const withLists = rememberedText && !template.includes('{{remembered}}') ? `${text}\n\n${rememberedText}` : text;
    return definitions.length ? `${withLists}\n\nWhat the tags not found mean, copied from the site's wiki:\n${definitions.join('\n')}` : withLists;
}

async function judgeMissing(entry, tags, missing) {
    const reply = await textAsk(importancePrompt(entry, tags, missing), 120 + missing.length * 40);
    const wanted = new Set(missing);
    const judged = new Map();
    let verdict = '';
    for (const line of reply.split('\n')) {
        const end = line.match(/verdict\s*:\s*\**\s*(needs a look|fine)/i);
        if (end) {
            verdict = end[1].toLowerCase();
            continue;
        }
        const match = line.replace(LIST_MARK, '').match(/^`?([^:`]+?)`?\s*[:=–—]\s*\**\s*(important|minor)\b[\s*,.;:–—-]*(.*)$/i);
        if (!match) {
            continue;
        }
        const tag = normalizeTag(match[1].replace(/[*"]/g, ''));
        if (wanted.has(tag) && !judged.has(tag)) {
            judged.set(tag, { tag, important: match[2].toLowerCase() === 'important', why: match[3].replace(/^because\s+/i, '').replace(/\s+/g, ' ').trim().slice(0, 200) });
        }
    }
    if (!judged.size && !verdict) {
        throw new Error('the answer judged none of the tags');
    }
    const items = [...judged.values()];
    return { items, verdict: verdict || (items.some(item => item.important) ? 'needs a look' : 'fine') };
}

function groupStep(entry, text) {
    if (text) {
        groupProgress.set(entry.id, text);
    } else {
        groupProgress.delete(entry.id);
    }
    groupListeners.get(entry.id)?.(text);
    document.querySelectorAll('.stis-cell[data-entry]').forEach(cell => {
        if (cell.dataset.entry === entry.id) {
            cellProgress(cell, text);
        }
    });
}

function cellProgress(cell, text) {
    let mark = cell.querySelector('.stis-cell-progress');
    if (!text) {
        mark?.remove();
        return;
    }
    if (!mark) {
        mark = el('span', 'stis-cell-progress');
        cell.appendChild(mark);
    }
    const { step, total } = progressParts(text);
    mark.textContent = step ? `${step}/${total}` : '…';
    mark.title = text;
}

async function describeSet(entry, blobs = []) {
    const s = settings();
    if (!ctx().ConnectionManagerRequestService || !visionProfileId()) {
        throw new Error('No vision profile chosen in Image Search settings.');
    }
    if (v3On(entry)) {
        return describeSequence(entry, blobs);
    }
    const items = entry.variants;
    items.forEach(item => {
        item.deduced = [];
        item.before = null;
    });
    const count = items.length;
    const report = { at: Date.now(), steps: {}, missing: [], found: {}, notShown: [], importance: [], verdict: '', problems: [], errors: [], decided: {}, placed: {}, notes: {}, deduced: {}, noteLog: [], linked: {}, fit: [], inText: {} };
    const size = count > 3 ? 768 : 1024;
    const pictures = new Array(count);
    const picture = async index => {
        pictures[index] = pictures[index] || await itemPicture(entry, items[index], blobs[index], size);
        return pictures[index];
    };
    const checkable = checkableTags(entry);
    let assigned = null;
    try {
        if (s.groupBlind !== false && checkable.length) {
            groupStep(entry, `Looking at each of the ${count} items…`);
            await eachLimit(items, 2, async (item, index) => {
                try {
                    const shown = [].concat(await picture(index));
                    const frames = itemAnimated(entry, item) ? (shown.length > 1 ? `These ${shown.length} pictures show one short animation as numbered moments, in order across the pictures (left to right, then top to bottom in each); list tags for anything seen in any moment. ` : 'This picture is a short animation shown as numbered frames (left to right, then top to bottom); list tags for anything seen in any frame. ') : '';
                    item.seen = parseTagReply(await visionAsk(`${frames}${BLIND_PROMPT}`, shown, 260, 0.2)).slice(0, 40);
                } catch (error) {
                    item.seen = [];
                    report.errors.push(`First look at item ${index + 1}: ${error?.message || error}`);
                }
            });
            const shapes = items.map(item => new Set(item.seen.map(tagShape)));
            assigned = items.map(item => new Set(item.added.filter(tag => checkable.includes(tag))));
            const seenSomewhere = new Set();
            const missing = new Set();
            assigned.forEach(set => set.forEach(tag => seenSomewhere.add(tag)));
            for (const tag of checkable) {
                const shape = tagShape(tag);
                shapes.forEach((set, index) => {
                    if (set.has(shape)) {
                        assigned[index].add(tag);
                        seenSomewhere.add(tag);
                    }
                });
                if (!seenSomewhere.has(tag)) {
                    missing.add(tag);
                }
            }
            items.forEach((item, index) => (item.tags || []).map(normalizeTag).filter(tag => checkable.includes(tag) && !assigned[index].has(tag)).forEach(tag => missing.add(tag)));
            report.steps.blind = items.some(item => item.seen.length) ? 'on' : 'failed';
            const viaLinks = how => {
                for (const tag of [...missing]) {
                    const others = tagLinksFor(tag).map(tagShape);
                    if (!others.length) {
                        continue;
                    }
                    const hits = [];
                    shapes.forEach((set, index) => {
                        const word = items[index].seen.find(seen => others.includes(tagShape(seen)));
                        if (word) {
                            assigned[index].add(tag);
                            hits.push(`item ${index + 1} (${word.replace(/_/g, ' ')})`);
                        }
                    });
                    if (hits.length) {
                        seenSomewhere.add(tag);
                        missing.delete(tag);
                        report.linked[tag] = hits;
                        report.noteLog.push(`${tag.replace(/_/g, ' ')}: matched ${how}: ${hits.join(', ')}`);
                    }
                }
            };
            if (s.groupLink !== false) {
                viaLinks('through a link');
                const unseen = () => [...missing].filter(tag => !seenSomewhere.has(tag));
                if (unseen().length) {
                    await Promise.race([siteAliases(unseen(), entry.site), new Promise(done => setTimeout(done, 15000))]).catch(() => null);
                    viaLinks('through the site\'s aliases');
                }
                const important = unseen().filter(tag => rememberedTags().matter.has(tag));
                if (important.length && items.some(item => item.seen.length)) {
                    groupStep(entry, `Looking for ${important.length} important tag${important.length === 1 ? '' : 's'} written differently…`);
                    try {
                        await aiTagLinks(entry, important, report);
                        viaLinks('written differently (linked by the AI)');
                    } catch (error) {
                        report.errors.push(`Linking tags written differently: ${error?.message || error}`);
                    }
                }
            }
            report.missing = [...missing].filter(tag => !seenSomewhere.has(tag));
            if (missing.size) {
                groupStep(entry, `Looking for ${missing.size} tag${missing.size === 1 ? '' : 's'} in the items…`);
                await Promise.race([ensureDefinitions([...missing], entry.site), new Promise(done => setTimeout(done, 15000))]).catch(() => null);
                try {
                    const found = await findMissingTags(entry, await Promise.all(items.map((item, index) => picture(index))), [...missing], report);
                    found.forEach((numbers, tag) => {
                        if (numbers.size) {
                            report.found[tag] = [...numbers].sort((a, b) => a - b);
                            numbers.forEach(number => assigned[number - 1]?.add(tag));
                        }
                    });
                    [...missing].filter(tag => tagNotesFor(tag).some(note => note.note)).forEach(tag => {
                        const numbers = [...(found.get(tag) || [])].sort((a, b) => a - b);
                        report.noteLog.push(`${tag.replace(/_/g, ' ')}: your notes went to the second look as hints, ${numbers.length ? `and it was found in item ${numbers.join(', ')}` : 'and it was still not seen'}`);
                    });
                } catch (error) {
                    report.errors.push(`Looking for the missing tags: ${error?.message || error}`);
                    report.steps.check = 'failed';
                }
                report.notShown = report.missing.filter(tag => !report.found[tag]);
            } else {
                report.steps.check = 'not needed';
            }
        } else {
            report.steps.blind = s.groupBlind === false ? 'off' : 'no tags to check';
        }
        items.forEach((item, index) => {
            item.shows = assigned ? checkable.filter(tag => assigned[index].has(tag)) : [];
        });
        const fallback = !assigned || items.every(item => !item.shows.length);
        const describe = async (index, note = '') => {
            groupStep(entry, `Describing item ${index + 1} of ${count}…`);
            await describeItem(entry, index, blobs[index], { note, fallback });
        };
        try {
            await describe(0);
        } catch (error) {
            if (!items[0].description) {
                throw error;
            }
            report.errors.push(`Describing item 1: ${error?.message || error}`);
        }
        const rest = items.slice(1).map((item, index) => index + 1);
        const describeRest = async index => {
            try {
                await describe(index);
            } catch (error) {
                report.errors.push(`Describing item ${index + 1}: ${error?.message || error}`);
            }
        };
        if (entry.kind === 'sequence') {
            for (const index of rest) {
                await describeRest(index);
            }
        } else {
            await eachLimit(rest, 2, describeRest);
        }
        entry.description = items[0].description;
        entry.keywords = [...new Set(items.flatMap(item => item.keywords))].slice(0, 12);
        if (s.groupInText !== false && report.notShown.length && items.every(item => item.description)) {
            groupStep(entry, `Reading the descriptions for ${report.notShown.length} tag${report.notShown.length === 1 ? '' : 's'} not found…`);
            try {
                const found = await describedTags(entry, report.notShown, report);
                found.forEach((hits, tag) => {
                    hits.forEach(hit => {
                        const item = items[hit.item - 1];
                        item.shows = checkable.filter(other => other === tag || item.shows.includes(other));
                    });
                    report.inText[tag] = hits.map(hit => `item ${hit.item}${hit.words ? ` ("${hit.words}")` : ''}`);
                });
                report.notShown = report.notShown.filter(tag => !found.has(tag));
                report.steps.inText = found.size ? 'on' : 'none found';
            } catch (error) {
                report.errors.push(`Reading the descriptions for tags not found: ${error?.message || error}`);
                report.steps.inText = 'failed';
            }
        } else {
            report.steps.inText = !report.notShown.length ? 'not needed' : s.groupInText === false ? 'off' : 'skipped';
        }
        const storyOn = s.groupStory !== false && entry.kind === 'sequence';
        const story = async (notes = '', keep = false) => {
            groupStep(entry, keep ? 'Rewriting the story lines to fit the roles…' : 'Writing what each item means in the story…');
            try {
                if (keep) {
                    await keepRoles(entry, () => writeStory(entry, notes, report));
                } else {
                    await writeStory(entry, notes, report);
                }
                report.steps.story = 'on';
            } catch (error) {
                report.errors.push(`Story lines: ${error?.message || error}`);
                report.steps.story = report.steps.story === 'on' ? 'on' : 'failed';
            }
        };
        if (storyOn && items.every(item => item.description)) {
            await story();
            if (report.steps.story === 'on' && s.groupRoleFit !== false && String(s.roleRules || '').trim()) {
                try {
                    const fixed = await roleFit(entry, report, { fix: true });
                    report.steps.fit = fixed ? 'on' : 'all fit';
                    if (fixed) {
                        await story('', true);
                    }
                } catch (error) {
                    report.errors.push(`Role fit: ${error?.message || error}`);
                    report.steps.fit = 'failed';
                }
            } else {
                report.steps.fit = String(s.roleRules || '').trim() ? 'off' : 'no rules';
            }
        } else {
            items.forEach(item => {
                item.role = null;
                item.diff = '';
            });
            entry.arc = '';
            report.steps.story = entry.kind !== 'sequence' ? 'not for sets' : storyOn ? 'skipped' : 'off';
        }
        const mattering = rememberedTags().matter;
        const deducible = report.notShown.filter(tag => tagNotesFor(tag).length || removalNotesFor(tag).length || (mattering.has(tag) && tagDefinition(tag)));
        if (deducible.length && s.groupDeduce !== false && items.every(item => item.description)) {
            groupStep(entry, `Looking where ${deducible.length} tag${deducible.length === 1 ? '' : 's'} nobody saw could happen…`);
            try {
                const found = await deduceTags(entry, deducible, report);
                report.steps.deduce = found.size ? 'on' : 'none placed';
                if (found.size) {
                    await placeDeduced(entry, report, found);
                    if (report.steps.story === 'on') {
                        await story('', true);
                    }
                }
            } catch (error) {
                report.errors.push(`Deducing tags nobody saw: ${error?.message || error}`);
                report.steps.deduce = 'failed';
            }
        } else {
            report.steps.deduce = deducible.length ? 'off' : 'not needed';
        }
        if (s.groupReview !== false && items.every(item => item.description)) {
            groupStep(entry, 'Checking the descriptions together…');
            try {
                const review = await reviewGroup(entry);
                if (review.overview) {
                    entry.description = review.overview;
                }
                if (review.keywords.length) {
                    entry.keywords = review.keywords;
                }
                const byItem = new Map();
                const valid = review.problems.filter(problem => problem.item >= 1 && problem.item <= count);
                valid.filter(problem => problem.about !== 'story').forEach(problem => byItem.set(problem.item, [...(byItem.get(problem.item) || []), problem.problem]));
                const redone = new Set();
                for (const [number, problems] of byItem) {
                    if (items[number - 1].lock) {
                        continue;
                    }
                    try {
                        await describe(number - 1, problems.join(' '));
                        redone.add(number);
                    } catch (error) {
                        report.errors.push(`Describing item ${number} again: ${error?.message || error}`);
                    }
                }
                const storyNotes = valid.filter(problem => problem.about === 'story').map(problem => `item ${problem.item}: ${problem.problem}`);
                if (report.steps.story === 'on' && (redone.size || storyNotes.length)) {
                    await story(storyNotes.join(' '), true);
                }
                report.problems = valid.map(problem => ({ ...problem, redone: problem.about === 'story' ? report.steps.story === 'on' : redone.has(problem.item) }));
                report.steps.review = 'on';
            } catch (error) {
                report.errors.push(`Final check: ${error?.message || error}`);
                report.steps.review = 'failed';
            }
        } else {
            report.steps.review = s.groupReview === false ? 'off' : 'skipped';
        }
        if (report.notShown.length && s.groupImportance !== false) {
            const { matter, dont } = rememberedTags();
            report.notShown.filter(tag => matter.has(tag) || dont.has(tag)).forEach(tag => report.noteLog.push(`${tag.replace(/_/g, ' ')}: judged from your list, ${matter.has(tag) ? 'it matters' : 'it does not matter'}`));
            report.importance = report.notShown.filter(tag => matter.has(tag) || dont.has(tag)).map(tag => ({ tag, important: matter.has(tag), why: matter.has(tag) ? 'you marked it as important before' : 'you threw it out before', by: 'remembered' }));
            const ask = report.notShown.filter(tag => !matter.has(tag) && !dont.has(tag));
            let verdict = '';
            report.steps.importance = 'remembered';
            if (ask.length) {
                groupStep(entry, `Judging ${ask.length} tag${ask.length === 1 ? '' : 's'} not found…`);
                try {
                    const judged = await judgeMissing(entry, checkable, ask);
                    report.importance.push(...judged.items);
                    verdict = judged.verdict;
                    report.steps.importance = 'on';
                } catch (error) {
                    report.errors.push(`Judging the tags not found: ${error?.message || error}`);
                    report.steps.importance = 'failed';
                }
            }
            report.verdict = verdict === 'needs a look' || report.importance.some(item => item.important) ? 'needs a look' : verdict || (report.steps.importance === 'failed' ? '' : 'fine');
        } else {
            report.steps.importance = report.notShown.length ? 'off' : 'not needed';
        }
        const important = report.importance.filter(item => item.important).map(item => item.tag);
        entry.attention = report.verdict === 'needs a look' ? { tags: important.length ? important : [...report.notShown], at: Date.now() } : null;
        entry.sections = {};
        entry.lock = null;
        entry.described = visionHash();
        entry.report = report;
        items.forEach(item => descriptions.set(item.url, describedVariant(entry, item)));
        return entry;
    } finally {
        groupStep(entry, '');
    }
}

const V3_STEPS = [[/^Looking at all \d+ items together/, 'The whole sequence'], [/^Writing item \d+ of/, 'Describing the items'], [/^Finding the tags in/, 'Tags in the descriptions'], [/^Story:/, 'Story lines'], [/^Role fit:/, 'Role fit'], [/^Your notes:/, 'Tags from your notes'], [/^Sequence check/, 'Final check'], [/^Looking again at item/, 'Fixing the items'], [/^Story again/, 'Story lines, roles kept'], [/^Tags not found:/, 'Judging tags not found']];

function loopState(entry, item, index) {
    if (!item) {
        return '';
    }
    if (item.loopSet === 'loop' || item.loopSet === 'not') {
        return item.loopSet;
    }
    const part = entry?.fromVideo?.parts?.[index];
    if (part) {
        return part.kind === 'loop' ? 'loop' : 'not';
    }
    return item.clip?.loop ? 'loop' : '';
}

function loopWords(entry, item, index) {
    const state = loopState(entry, item, index);
    return state === 'loop' ? (item.loopSet === 'loop' ? 'a loop (set by the user)' : 'it loops') : state === 'not' && item.loopSet === 'not' ? 'not a loop (set by the user)' : '';
}

function loopLines(entry, index) {
    const items = entry.variants;
    const state = loopState(entry, items[index], index);
    const before = index > 0 ? loopState(entry, items[index - 1], index - 1) : '';
    const after = index + 1 < items.length ? loopState(entry, items[index + 1], index + 1) : '';
    if (state === 'loop') {
        return fillTemplate(promptPart('loopNote'), { before_loop: before === 'loop' ? 'yes' : '', before_not_loop: before === 'not' ? 'yes' : '', after_loop: after === 'loop' ? 'yes' : '', after_not_loop: after === 'not' ? 'yes' : '', first: index === 0 ? 'yes' : '', last: index === items.length - 1 ? 'yes' : '', number: index + 1 }).trim();
    }
    if (state === 'not') {
        return [before ? `The item before (item ${index}) is ${before === 'loop' ? 'a loop' : 'not a loop'}.` : '', 'This item is not a loop.', after ? `The item after (item ${index + 2}) is ${after === 'loop' ? 'a loop' : 'not a loop'}.` : ''].filter(Boolean).join(' ');
    }
    return '';
}

function oneMovingHint(entry) {
    const states = entry.variants.map((item, index) => loopState(entry, item, index));
    const loops = states.filter(state => state === 'loop').length;
    return entry.variants.length > 1 && loops === entry.variants.length - 1 ? fillTemplate(promptPart('oneMoving'), { item: states.findIndex(state => state !== 'loop') + 1 }).trim() : '';
}

function v3On(entry) {
    return settings().sequenceV3 !== false && entry?.kind === 'sequence';
}

function v3Entry(entry) {
    return v3On(entry) && entry.report?.framework === 'v3';
}

async function boardClip(entry, item, blob) {
    if (!itemAnimated(entry, item) || typeof ImageDecoder !== 'function') {
        return null;
    }
    let data = blob || null;
    if (!data) {
        const response = await fetch(item.url);
        data = response.ok ? await response.blob() : null;
    }
    const format = data ? await sniffFormat(data) : '';
    if (!format || !await isAnimated({ blob: data, format })) {
        return null;
    }
    const type = format === 'gif' ? 'image/gif' : format === 'webp' ? 'image/webp' : 'image/png';
    const decoder = new ImageDecoder({ data: new Uint8Array(await data.arrayBuffer()), type });
    try {
        await decoder.tracks.ready;
        await decoder.completed?.catch(() => {});
        const count = decoder.tracks.selectedTrack?.frameCount || 1;
        if (count < 2) {
            return null;
        }
        const clip = await clipOf(item.url, data, decoder, count);
        return { ...clip, data, type };
    } finally {
        decoder.close?.();
    }
}

async function boardSheets(clip, wanted) {
    const decoder = new ImageDecoder({ data: new Uint8Array(await clip.data.arrayBuffer()), type: clip.type });
    const images = [];
    try {
        await decoder.tracks.ready;
        await decoder.completed?.catch(() => {});
        const picks = timedPicks(clip.delays, Math.max(1, Math.min(wanted, clip.frames)));
        for (const frameIndex of picks) {
            images.push((await decoder.decode({ frameIndex })).image);
        }
        const starts = frameStarts(clip.delays);
        return { pictures: await frameSheets(images, 768), moments: images.length, seconds: clip.seconds, loop: clip.loop, picks, total: clip.frames, times: picks.map(pick => starts[pick]) };
    } finally {
        images.forEach(image => image.close?.());
        decoder.close?.();
    }
}

function boardFrames(clip) {
    return clip ? Math.min(clip.frames, 32, framesForLength(clip.seconds)) : 1;
}

function boardPlan(batch, clips, per) {
    const sheets = new Map(batch.map(index => [index, 1]));
    const want = index => Math.ceil(boardFrames(clips[index]) / SHEET_FRAMES);
    let spare = per - batch.length;
    while (spare > 0) {
        const next = batch.filter(index => sheets.get(index) < want(index)).sort((a, b) => (want(b) - sheets.get(b)) - (want(a) - sheets.get(a)) || (clips[b]?.seconds || 0) - (clips[a]?.seconds || 0))[0];
        if (next === undefined) {
            break;
        }
        sheets.set(next, sheets.get(next) + 1);
        spare -= 1;
    }
    return sheets;
}

async function boardStill(item, clip, blob) {
    return { pictures: [await imageDataUrl(item.url, blob || null, 768)], moments: 0, seconds: clip?.seconds || 0, loop: Boolean(clip?.loop) };
}

async function boardView(item, clip, sheets, blob) {
    if (!clip) {
        return boardStill(item, clip, blob);
    }
    try {
        return await boardSheets(clip, Math.min(boardFrames(clip), sheets * SHEET_FRAMES));
    } catch (error) {
        console.warn('[Image Search] could not make the frame sheets for the look at the whole sequence', error);
        return boardStill(item, clip, blob);
    }
}

async function rebuildBoardView(entry, index) {
    const clips = [];
    for (const [at, item] of entry.variants.entries()) {
        clips[at] = await boardClip(entry, item, null).catch(() => null);
    }
    const per = maxPictures();
    const start = Math.floor(index / per) * per;
    const batch = entry.variants.slice(start, start + per).map((item, at) => start + at);
    const sheets = boardPlan(batch, clips, per);
    const views = [];
    for (const at of batch) {
        views.push(await boardView(entry.variants[at], clips[at], sheets.get(at), null));
    }
    const earlier = entry.variants.slice(0, start).map((item, at) => (item.cast || item.beat ? `Item ${at + 1}: ${[item.cast, item.beat].filter(Boolean).join('; ')}` : '')).filter(Boolean).join('\n');
    const tags = checkableTags(entry);
    const all = views.flatMap(seen => seen.pictures);
    return { ...views[batch.indexOf(index)], prompt: boardPrompt(entry, batch, views, tags, earlier, entry.report?.facts || ''), together: all.length, batch: all, tokens: 160 + 120 * batch.length + 14 * tags.length, heat: 0.2 };
}

async function dryPrompt(entry, item) {
    const index = isMulti(entry) ? entry.variants.indexOf(item) : -1;
    if (index >= 0 && groupDescribed(entry)) {
        return v3Entry(entry) ? v3Describe(entry, index, null, { dry: true }, entry.report) : describeItem(entry, index, null, { dry: true });
    }
    return requestDescription(item.url || entry.url, entry.tags, null, entry.lock?.text || '', [entry.borrowed?.fromVideo ? VIDEO_TAGS_NOTE : '', fixesNote(entry.fixes)].filter(Boolean).join('\n\n'), { tagInfo: true, dryRun: true });
}

function boardPrompt(entry, batch, shown, tags, earlier, facts = '', again = '') {
    const count = entry.variants.length;
    const together = batch.length > 1;
    const round = value => Math.round(value * 10) / 10;
    const timing = index => {
        const part = entry.fromVideo?.parts?.[index];
        return part ? `${Math.max(0, part.start).toFixed(1)} s to ${Math.max(0, part.end).toFixed(1)} s of the video${PART_HINTS[part.kind] ? `, ${PART_HINTS[part.kind]}` : ''}` : '';
    };
    let next = 1;
    const parts = batch.map((index, at) => {
        const view = shown[at];
        const size = view.pictures.length;
        const from = next;
        next += size;
        const bits = [];
        if (view.moments) {
            bits.push(`an animation${view.seconds ? `, ${view.seconds} s long` : ''}: ${view.moments} moments in order${size > 1 ? ` across its ${size} pictures, numbered 1 to ${view.moments}` : ' on one sheet, numbered'}, left to right, then top to bottom${view.seconds && view.moments > 1 ? `, about ${round(view.seconds / view.moments)} s apart` : ''}`);
        } else if (view.seconds) {
            bits.push(`an animation, ${view.seconds} s long, shown here by its first moment only`);
        }
        const state = loopState(entry, entry.variants[index], index);
        if (state === 'loop' && !entry.fromVideo) {
            bits.push(entry.variants[index].loopSet === 'loop' ? 'the user says it is a loop: it repeats' : 'its last moment matches its first almost exactly, so it most likely repeats as a loop');
        } else if (state === 'not' && entry.variants[index].loopSet === 'not') {
            bits.push('the user says it is not a loop');
        }
        if (timing(index)) {
            bits.push(timing(index));
        }
        return `item ${index + 1} is ${size > 1 ? `pictures ${from} to ${from + size - 1}` : `picture ${from}`}${bits.length ? ` (${bits.join('; ')})` : ''}`;
    });
    const total = next - 1;
    const { matter } = rememberedTags();
    const hints = tagHintLines(tags.filter(tag => matter.has(tag) || tagNotesFor(tag).length || removalNotesFor(tag).length));
    const tagPart = tags.length ? `\n\nThen, for each of the sequence's tags below, say ${together ? 'which items show it' : 'whether this item shows it'} or clear signs of it. Tags never match a picture word for word: close enough counts, and a tag can also name something happening or a known character. Answer none only when no item shows it.` : '';
    const tagFormat = tags.length ? `\nTags:\na_tag: ${together ? '1, 3' : batch[0] + 1}\nanother_tag: none\n(one line for every tag below)` : '';
    const tagList = tags.length ? `\n\nThe sequence's tags:\n${tags.join('\n')}${hints.length ? `\n\nWhat some of these tags mean (copied from the site's wiki) and what the user said about them in earlier pictures, as hints on how they show:\n${hints.join('\n')}` : ''}` : '';
    const opening = together
        ? `You get ${total} pictures, showing ${batch.length === count ? `all ${count} items` : `items ${batch[0] + 1} to ${batch[batch.length - 1] + 1}`} of one ${groupWhat(entry)}: ${parts.join('; ')}. Look at all of them together before you answer. You are the only one who sees the whole sequence at once: each item will then be described by someone who sees only that item, and they will rely on what you say.`
        : `You get ${total === 1 ? 'one picture' : `${total} pictures`}: item ${batch[0] + 1} of one ${groupWhat(entry)}${parts[0].replace(/^item \d+ is pictures? [\d to]+/, '')}. Someone will describe it next and rely on what you say, so they know who is there and where this moment sits in the story.`;
    const ask = together ? 'For each item, give' : 'For this item, give';
    const peak = together ? '\nThen say which item is the emotional peak of the sequence: the most intense moment of emotion, not only of action.' : '';
    return `${opening}${facts ? `\n\n${facts}` : ''}${again ? `\n\n${again}` : ''}${earlier ? `\n\nWhat was seen in the items before ${together ? 'these' : 'this one'}:\n${earlier}` : ''}\n\n${ask}:\n- Cast: everyone there, counting anyone only partly in view (a hand, an arm, a silhouette, someone in the shadows) and anyone from the other items who is most likely still there out of view (say so). A few words each, and the same words for the same person in every item (the girl in the yellow raincoat; a man, only his arm in view).\n- Beat: one sentence on what happens in this item and how it follows from the item before.${peak}${tagPart}\n\nReply in exactly this format and nothing else:\nItem ${batch[0] + 1} cast: ...\nItem ${batch[0] + 1} beat: ...\n${together ? `Item ${batch[1] + 1} cast: ...\nItem ${batch[1] + 1} beat: ...\nPeak: item N, because ...` : ''}${tagFormat}${tagList}\n\n${NO_NAMES_RULE}`;
}

function readBoard(reply, batch, tags) {
    const allowed = batch.map(index => index + 1);
    const items = new Map();
    const wanted = new Set(tags);
    const found = new Map();
    let peak = null;
    let current = 0;
    const keep = (number, key, text) => {
        if (allowed.includes(number) && text) {
            items.set(number, { ...(items.get(number) || {}), [key]: text.replace(/\s+/g, ' ').trim().slice(0, 300) });
        }
    };
    for (const raw of String(reply || '').split('\n')) {
        const line = raw.replace(/\*\*/g, '').replace(/^\s*[-*•#]+\s*/, '').trim();
        const part = line.match(/^(?:item|part|picture)\s*(\d+)\s*[-–—:.)]*\s*(cast|beat)\s*[:=–—-]\s*(.+)$/i);
        if (part) {
            current = Number(part[1]);
            keep(current, part[2].toLowerCase(), part[3]);
            continue;
        }
        const head = line.match(/^(?:item|part|picture)\s*(\d+)\s*[:.)-]?\s*$/i);
        if (head) {
            current = Number(head[1]);
            continue;
        }
        const under = line.match(/^(cast|beat|who is there|what happens)\s*[:=–—-]\s*(.+)$/i);
        if (under && current) {
            keep(current, /^(cast|who)/i.test(under[1]) ? 'cast' : 'beat', under[2]);
            continue;
        }
        const top = line.match(/^peak\s*[:=–—-]\s*(?:item|part|picture)?\s*(\d+)[\s,;:.–—-]*(.*)$/i);
        if (top) {
            if (allowed.includes(Number(top[1])) && !peak) {
                peak = { item: Number(top[1]), why: top[2].replace(/^because\s+/i, '').replace(/\s+/g, ' ').trim().slice(0, 200) };
            }
            continue;
        }
        const pair = line.replace(LIST_MARK, '').match(/^`?([^:`]+?)`?\s*[:=–—]\s*(.+)$/);
        const tag = normalizeTag(String(pair?.[1] || '').replace(/[*"]/g, ''));
        if (!pair || !wanted.has(tag)) {
            continue;
        }
        const value = pair[2].replace(/(\d+)\s*(?:-|–|—|to)\s*(\d+)/gi, (all, from, to) => (Number(to) > Number(from) && Number(to) - Number(from) < 40 ? Array.from({ length: Number(to) - Number(from) + 1 }, (_, i) => Number(from) + i).join(', ') : all));
        let numbers = /^\s*(none|no)\b/i.test(value) ? [] : (value.match(/\d+/g) || []).map(Number).filter(number => allowed.includes(number));
        if (!numbers.length && /\b(all|every|each)\b/i.test(value) && !/^\s*(none|no)\b/i.test(value)) {
            numbers = allowed;
        }
        found.set(tag, [...new Set([...(found.get(tag) || []), ...numbers])]);
    }
    return { items, peak, found };
}

async function lookAtBoard(entry, blobs, tags, report, facts = '', again = '') {
    const items = entry.variants;
    const clips = [];
    for (const [index, item] of items.entries()) {
        try {
            clips[index] = await boardClip(entry, item, blobs[index]);
        } catch (error) {
            clips[index] = null;
            console.warn('[Image Search] could not read the GIF for the look at the whole sequence', error);
        }
        if (clips[index]) {
            item.clip = { seconds: clips[index].seconds, frames: clips[index].frames, loop: clips[index].loop };
        }
    }
    const per = maxPictures();
    const batches = [];
    for (let start = 0; start < items.length; start += per) {
        batches.push(items.slice(start, start + per).map((item, at) => start + at));
    }
    const still = index => boardStill(items[index], clips[index], blobs[index]);
    const view = (index, sheets) => boardView(items[index], clips[index], sheets, blobs[index]);
    const plan = batch => boardPlan(batch, clips, per);
    const found = new Map(tags.map(tag => [tag, new Set()]));
    const replies = [];
    let stills = false;
    let single = false;
    const earlierThan = first => items.slice(0, first).map((item, index) => (item.cast || item.beat ? `Item ${index + 1}: ${[item.cast, item.beat].filter(Boolean).join('; ')}` : '')).filter(Boolean).join('\n');
    const ask = async (batch, views) => {
        report.cost.vision += 1;
        const text = boardPrompt(entry, batch, views, tags, earlierThan(batch[0]), facts, again);
        const all = views.flatMap(seen => seen.pictures);
        const tokens = 160 + 120 * batch.length + 14 * tags.length;
        batch.forEach((index, at) => rememberSent(items[index].url, 'board', { ...views[at], prompt: text, together: all.length, batch: all, tokens, heat: 0.2 }));
        return visionAsk(text, all, tokens, 0.2);
    };
    const take = (reply, batch) => {
        replies.push(reply);
        const read = readBoard(reply, batch, tags);
        read.items.forEach((seen, number) => {
            const item = items[number - 1];
            item.cast = seen.cast || item.cast || '';
            item.beat = seen.beat || item.beat || '';
        });
        if (read.peak && batches.length === 1 && batch.length > 1) {
            report.boardPeak = read.peak;
        }
        read.found.forEach((numbers, tag) => numbers.forEach(number => found.get(tag)?.add(number)));
    };
    for (const batch of batches) {
        const sheets = plan(batch);
        const views = [];
        for (const index of batch) {
            views.push(await view(index, sheets.get(index)));
        }
        let reply = '';
        let failure = null;
        try {
            reply = await ask(batch, views);
        } catch (error) {
            const moving = views.some(seen => seen.moments || seen.pictures.length > 1);
            try {
                reply = await ask(batch, moving ? await Promise.all(batch.map(still)) : views);
                stills = stills || moving;
            } catch (again) {
                failure = again;
            }
        }
        if (reply) {
            take(reply, batch);
            continue;
        }
        if (batch.length > 1) {
            let any = false;
            for (const index of batch) {
                try {
                    take(await ask([index], [await view(index, Math.min(per, Math.ceil(boardFrames(clips[index]) / SHEET_FRAMES)))]), [index]);
                    any = true;
                } catch (error) {
                    failure = error;
                }
            }
            single = single || any;
            if (any) {
                continue;
            }
        }
        report.errors.push(`The whole sequence: ${failure?.message || failure}`);
    }
    report.boardReply = [report.boardReply, ...replies].filter(Boolean).join('\n\n').slice(-4000);
    report.steps.board = !replies.length ? 'failed' : single ? 'one by one' : stills ? 'stills only' : 'on';
    return replies.length ? found : null;
}

const FEMALE_TAG = /^(\d+\+?girls?|multiple_girls|female_focus|yuri|mature_female|female_child|genderswap_\(mtf\)|girl|woman|women|female)$/;
const MALE_TAG = /^(\d+\+?boys?|multiple_boys|male_focus|yaoi|mature_male|male_child|genderswap_\(ftm\)|boy|man|men|male|otoko_no_ko|trap|femboy|bishounen)$/;
const FEMALE_WORDS = /\b(girls?|wom[ae]n|she|her|hers|herself|lady|ladies|female|kunoichi|maiden)\b/i;
const MALE_WORDS = /\b(boys?|m[ae]n|he|him|his|himself|guy|male)\b/i;

function genderFacts(tags, characters = null) {
    const list = (tags || []).map(normalizeTag);
    const female = list.some(tag => FEMALE_TAG.test(tag)) || characters?.female > 0;
    const male = list.some(tag => MALE_TAG.test(tag)) || characters?.male > 0;
    const unlike = list.filter(tag => /^(otoko_no_ko|trap|femboy|crossdressing|androgynous|bishounen|reverse_trap|tomboy)$/.test(tag));
    const count = peopleHint(list);
    const lines = [];
    if (count) {
        lines.push(`The site's tags count: ${count}.`);
    }
    if (characters && (characters.male || characters.female)) {
        lines.push(`The characters the tags name are, from the site's wiki: ${[characters.male ? `${characters.male} male` : '', characters.female ? `${characters.female} female` : ''].filter(Boolean).join(' and ')}. Never use their names.`);
    }
    if (male && !female) {
        lines.push('No tag counts a girl or a woman: everyone the tags count is male. Someone who looks feminine (long hair, a slim build, a pretty face, a dress) is most likely one of the boys, androgynous or feminine-looking: call him he, unless the picture clearly shows a girl the tags missed.');
    } else if (female && !male) {
        lines.push('No tag counts a boy or a man: everyone the tags count is female. Someone who looks boyish (short hair, a broad build, plain clothes) is most likely one of the girls: call her she, unless the picture clearly shows a boy the tags missed.');
    }
    if (unlike.length) {
        lines.push(`The tags ${unlike.join(', ').replace(/_/g, ' ')} say someone's looks do not match their gender: go by the tags for who is male or female, not by looks.`);
    }
    return { onlyMale: male && !female, onlyFemale: female && !male, text: lines.length ? `Facts from the site's tags (trust them over a first impression):\n${lines.join('\n')}` : '' };
}

function genderClash(text, facts) {
    const value = String(text || '');
    const [wrong, right] = facts?.onlyMale ? [FEMALE_WORDS, MALE_WORDS] : facts?.onlyFemale ? [MALE_WORDS, FEMALE_WORDS] : [null, null];
    const found = wrong ? value.match(wrong) : null;
    return found && !right.test(value) ? found[0] : '';
}

function genderProblem(word, facts) {
    return facts.onlyMale
        ? `It calls someone "${word}", but no tag counts a girl or a woman and everyone the tags count is male: that person is most likely one of the boys, androgynous or feminine-looking. Describe him as he, unless the picture clearly shows a girl the tags missed.`
        : `It calls someone "${word}", but no tag counts a boy or a man and everyone the tags count is female: that person is most likely one of the girls. Describe her as she, unless the picture clearly shows a boy the tags missed.`;
}

async function tagImplications(tags, site = '') {
    const day = 24 * 3600 * 1000;
    const known = deviceCache('tagImplied');
    const unknown = tags.filter(tag => !known[tag] || Date.now() - (Number(known[tag].at) || 0) > (known[tag].to?.length ? 90 : 7) * day);
    if (unknown.length) {
        const own = siteEntries().find(entry => entry.domain === site);
        const engineName = own ? await engineOf(own, unknown).catch(() => '') : '';
        const origin = `https://${own && engineName === 'e621' ? own.domain : 'danbooru.donmai.us'}`;
        const next = { ...known };
        for (let start = 0; start < unknown.length; start += 40) {
            const part = unknown.slice(start, start + 40);
            const found = await request(`${origin}/tag_implications.json?search%5Bantecedent_name_comma%5D=${encodeURIComponent(part.join(','))}&search%5Bstatus%5D=active&limit=200`);
            const rows = Array.isArray(found?.data) ? found.data : [];
            if (rows.length && !rows.some(row => part.includes(normalizeTag(row?.antecedent_name || '')))) {
                continue;
            }
            part.forEach(tag => {
                next[tag] = { to: [...new Set(rows.filter(row => normalizeTag(row?.antecedent_name || '') === tag).map(row => normalizeTag(row?.consequent_name || '')).filter(Boolean))], at: Date.now() };
            });
        }
        keepDeviceCache('tagImplied', Object.fromEntries(Object.entries(next).sort((a, b) => (Number(b[1].at) || 0) - (Number(a[1].at) || 0)).slice(0, 800)));
    }
    const now = deviceCache('tagImplied');
    return new Map(tags.filter(tag => now[tag]?.to?.length).map(tag => [tag, now[tag].to]));
}

function itemTagsPrompt(entry, lacking) {
    const { matter } = rememberedTags();
    const all = [...new Set(lacking.flat())];
    const hints = tagHintLines(all.filter(tag => matter.has(tag) || tagNotesFor(tag).length || removalNotesFor(tag).length));
    const blocks = entry.variants.map((item, index) => (lacking[index].length ? `Item ${index + 1}:\nDescription: ${String(item.description || '').replace(/\s+/g, ' ').trim().slice(0, 1500)}\nTags it has: ${item.shows.join(', ') || 'none'}\nThe sequence's tags it does not have: ${lacking[index].join(', ')}` : '')).filter(Boolean).join('\n\n');
    return `Each item of a ${groupWhat(entry)} was described by someone looking at it, and has the tags that were seen in it. For each item below, say which of the sequence's tags it does not have yet its description shows, or clearly means. Tags never match a description word for word: a tag counts when the description shows the thing it names, in any words, or something that clearly goes with it; it does not count when it is only possible. Judge each item on its own description only: never give an item a tag just because another item has it.${hints.length ? `\n\nWhat some of these tags mean (copied from the site's wiki) and what the user said about them in earlier pictures:\n${hints.join('\n')}` : ''}\n\n${blocks}\n\nReply with one line per item above and nothing else, with a few words from its description for each tag it shows, like:\nItem 1: a_tag ("a few words from it"), another_tag ("a few words from it")\nItem 2: none`;
}

function readItemTags(entry, lacking, reply) {
    const found = new Map();
    for (const raw of String(reply || '').split('\n')) {
        const line = raw.replace(/\*\*/g, '').replace(/^\s*[-*•]+\s*/, '');
        const match = line.match(/^\s*(?:item|part|picture)\s*(\d+)\s*[:.)-]\s*(.+)$/i);
        const index = Number(match?.[1]) - 1;
        if (!match || !lacking[index]?.length || /^\s*none\b/i.test(match[2])) {
            continue;
        }
        const item = entry.variants[index];
        const quoted = [...match[2].matchAll(/([^,;()"“”]+?)\s*\(\s*["“]([^"”]+)["”]\s*\)/g)].map(hit => [hit[1], hit[2]]);
        const pairs = quoted.length ? quoted : match[2].split(/[,;]/).map(part => [part, '']);
        const hits = found.get(index) || [];
        pairs.forEach(([name, words]) => {
            const tag = normalizeTag(String(name).replace(/[`*"]/g, '').trim());
            if (lacking[index].includes(tag) && !hits.some(hit => hit.tag === tag) && (!words || echoesText(words, item.description))) {
                hits.push({ tag, words: String(words).replace(/\s+/g, ' ').trim().slice(0, 120) });
            }
        });
        if (hits.length) {
            found.set(index, hits);
        }
    }
    return found;
}

async function characterGenders(tags, site = '') {
    const day = 24 * 3600 * 1000;
    const known = deviceCache('characterGender');
    const unknown = tags.filter(tag => !known[tag] || Date.now() - (Number(known[tag].at) || 0) > 90 * day).slice(0, 40);
    if (unknown.length) {
        const own = siteEntries().find(entry => entry.domain === site);
        const engineName = own ? await engineOf(own, unknown).catch(() => '') : '';
        const origin = `https://${own && (engineName === 'danbooru' || engineName === 'e621') ? own.domain : 'danbooru.donmai.us'}`;
        const next = { ...known };
        const listed = await request(`${origin}/tags.json?search%5Bname_comma%5D=${encodeURIComponent(unknown.join(','))}&search%5Bcategory%5D=4&limit=50`);
        const characters = new Set((Array.isArray(listed?.data) ? listed.data : []).map(tag => normalizeTag(tag?.name || '')).filter(tag => unknown.includes(tag)));
        unknown.filter(tag => !characters.has(tag)).forEach(tag => {
            next[tag] = { g: '', at: Date.now() };
        });
        await eachLimit([...characters].slice(0, 8), 2, async tag => {
            try {
                const wiki = await request(`${origin}/wiki_pages/${encodeURIComponent(tag)}.json`);
                const body = String(wiki?.data?.body || '').slice(0, 3000).toLowerCase();
                const he = (body.match(/\b(he|him|his|himself)\b/g) || []).length;
                const she = (body.match(/\b(she|her|hers|herself)\b/g) || []).length;
                next[tag] = { g: he >= 2 && he >= 2 * she ? 'male' : she >= 2 && she >= 2 * he ? 'female' : '?', at: Date.now() };
            } catch (error) {
                next[tag] = { g: '?', at: Date.now() };
            }
        });
        keepDeviceCache('characterGender', Object.fromEntries(Object.entries(next).sort((a, b) => (Number(b[1].at) || 0) - (Number(a[1].at) || 0)).slice(0, 400)));
    }
    const now = deviceCache('characterGender');
    return { male: tags.filter(tag => now[tag]?.g === 'male').length, female: tags.filter(tag => now[tag]?.g === 'female').length };
}

function boardLines(entry, index) {
    const items = entry.variants;
    const item = items[index];
    if (!item?.cast && !item?.beat) {
        return '';
    }
    return fillTemplate(promptPart('boardNote'), { who: item.cast || '', what: item.beat || '', just_before: index > 0 ? items[index - 1].beat || '' : '', before_number: index, just_after: index + 1 < items.length ? items[index + 1].beat || '' : '', after_number: index + 2 });
}

function v3FixPrompt(item, base, { problems = [], roleFix = null, verify = [] }, asked) {
    const asks = [];
    if (roleFix && item.role) {
        asks.push(`Its role in the sequence is settled and correct: the ${roleText(item.role)}${item.role.intensity ? `, intensity ${item.role.intensity}/10` : ''}. The description ${roleFix.said ? `says "${roleFix.said}", which` : ''} does not fit that role${roleFix.instead ? `; most likely ${roleFix.instead}` : ''}. Describe this moment as the ${item.role.main}, following the user's rules for the roles:\n${String(settings().roleRules || '').trim()}`);
    }
    problems.forEach(problem => asks.push(`A check of the whole sequence noticed: ${problem} Fix it if the picture agrees; if the picture shows the description was right, keep it.`));
    if (verify.length) {
        const lines = verify.map(({ tag, why }) => {
            const hint = (tagHintLines([tag])[0] || '').replace(/^- [^:]+:\s*/, '');
            return `- ${tag.replace(/_/g, ' ')}: most likely because ${why}.${hint ? ` ${hint}` : ''}`;
        });
        asks.push(`Nobody saw ${verify.length === 1 ? 'this tag' : 'these tags'} of the sequence, but from the user's notes ${verify.length === 1 ? 'it most likely belongs' : 'they most likely belong'} to this moment, even off screen or only implied:\n${lines.join('\n')}\nIf the picture shows it or fits it, work it in (as likely off screen or implied when it cannot be seen). If the picture clearly goes against it, leave it out.`);
    }
    return fillTemplate(promptPart('againPrompt'), { description: base, asks: asks.map(text => `- ${text}`).join('\n'), prompt: asked, first_tag: verify[0]?.tag.replace(/_/g, ' ') || '', several: verify.length > 1 ? 'yes' : '' });
}

function readChecked(raw, verify) {
    const line = String((String(raw || '').match(/^[\s*#>-]*\**checked\**\s*:\s*(.+)$/im) || [])[1] || '').toLowerCase();
    const spots = verify.map(({ tag }) => {
        const words = tag.replace(/_/g, ' ');
        const at = [line.indexOf(words), line.indexOf(tag)].filter(spot => spot >= 0);
        return { tag, at: at.length ? Math.min(...at) : -1 };
    });
    const placed = spots.filter(spot => spot.at >= 0).sort((a, b) => a.at - b.at);
    const kept = [];
    const left = [];
    spots.forEach(spot => {
        if (spot.at < 0) {
            kept.push(spot.tag);
            return;
        }
        const next = placed.find(other => other.at > spot.at);
        const part = line.slice(spot.at, next ? next.at : line.length);
        if (/\b(left out|leave out|leaving it out|not kept|no sign|does not fit|doesn't fit)\b/.test(part)) {
            left.push({ tag: spot.tag, why: ((part.match(/because\s+(.+)$/) || [])[1] || '').replace(/[;,.\s]+$/, '').trim().slice(0, 200) });
        } else {
            kept.push(spot.tag);
        }
    });
    return { kept, left, said: Boolean(line) };
}

async function v3Describe(entry, index, blob, { problems = [], roleFix = null, verify = [], dry = false } = {}, report = null) {
    const item = entry.variants[index];
    const before = index > 0 ? entry.variants[index - 1] : null;
    const context = [`This ${itemAnimated(entry, item) ? 'GIF' : 'picture'} is item ${index + 1} of a ${groupWhat(entry)}.${item.role ? ` In the sequence it is the ${roleText(item.role)}${item.role.intensity ? `, intensity ${item.role.intensity}/10` : ''}${item.roleLock ? ' (set by the user)' : ''}.` : ''}`];
    const factsText = typeof report?.itemFacts?.[index] === 'string' ? report.itemFacts[index] : report?.facts;
    if (factsText) {
        context.push(factsText);
    }
    const board = boardLines(entry, index);
    if (board) {
        context.push(board);
    }
    const looped = loopLines(entry, index);
    if (looped) {
        context.push(looped);
    }
    if (before?.description) {
        context.push(`Item ${index} (the one before it) was described as:\n${before.description}\nCall the same people and things by the same words; if someone looks different, say so.`);
        const cast = peopleLine(before.description);
        if (cast) {
            context.push(`The item before counted: "${cast}". People do not vanish between items: if someone from it cannot be seen here, they are most likely still there out of view (behind someone, off screen, hidden by smoke or shadow). Count them anyway and say where they most likely are, like "Two people (one out of view, behind her)", unless this picture shows they left.`);
        }
    }
    if (item.added.length) {
        context.push(`The user checked this picture and says it shows: ${item.added.join(', ').replace(/_/g, ' ')}. Mention them as far as the picture allows; never let them change what is visibly happening.`);
    }
    const placed = item.deduced.map(d => d.tag).filter(tag => !item.added.includes(tag) && !verify.some(other => other.tag === tag));
    if (placed.length) {
        context.push(`Not seen, but placed here from the user's notes as most likely implied: ${placed.join(', ').replace(/_/g, ' ')}. Mention them only as far as the picture allows.`);
    }
    const fixes = fixesNote(item.fixes);
    if (fixes) {
        context.push(fixes);
    }
    const fixing = problems.length || roleFix || verify.length;
    const base = fixing ? item.lock?.text || item.description : '';
    const wrap = base ? asked => v3FixPrompt(item, base, { problems, roleFix, verify }, asked) : null;
    if (report?.cost && !dry) {
        report.cost.vision += 1;
    }
    const parsed = await requestDescription(item.url, item.shows, blob || null, base ? '' : item.lock?.text || '', '', { before: context.join('\n\n'), wrap, peopleTags: entry.tags, tagInfo: true, timed: true, dryRun: dry, loopState: loopState(entry, item, index) });
    if (dry) {
        return parsed;
    }
    if (parsed.clip) {
        item.clip = { seconds: parsed.clip.seconds, frames: parsed.clip.frames, loop: parsed.clip.loop };
    }
    let result = parsed;
    let checked = { kept: [], left: [], said: false };
    if (verify.length) {
        checked = readChecked(parsed.raw, verify);
        const again = parseDescription(String(parsed.raw || '').replace(/^[\s*#>-]*\**checked\**\s*:.*$/gim, ''));
        if (again.text) {
            result = { ...parsed, text: again.text, sections: again.sections, keywords: again.keywords };
        }
    }
    item.description = result.text;
    item.sections = result.sections || {};
    item.keywords = result.keywords || [];
    descriptions.set(item.url, describedVariant(entry, item));
    return checked;
}

function v3ReviewPrompt(entry, facts = '') {
    const blocks = entry.variants.map((item, index) => [`Item ${index + 1}:${item.clip?.seconds || loopWords(entry, item, index) ? ` (a GIF${item.clip?.seconds ? `, ${item.clip.seconds} s long` : ''}${loopWords(entry, item, index) ? `, ${loopWords(entry, item, index)}` : ''})` : ''}`, `First look at the whole sequence: ${[item.cast ? `who is there: ${item.cast}` : '', item.beat ? `what happens: ${item.beat}` : ''].filter(Boolean).join('; ') || 'none'}`, `Tags: ${item.shows.join(', ').replace(/_/g, ' ') || 'none'}`, item.description, item.role ? `Role: ${roleText(item.role)}${item.role.intensity ? `, intensity ${item.role.intensity}/10` : ''}\nStory line: ${item.diff || 'not given'}` : ''].filter(Boolean).join('\n')).join('\n\n');
    return `You are checking the descriptions of the ${entry.variants.length} items of one ${groupWhat(entry)}. Someone first looked at all the items together and said who is there and what happens in each; then each item was described by someone looking at it, who was told what that first look saw. For each item you get that first look, its tags, its description, and its role and story line.${entry.arc ? ` The shape given to the sequence: ${entry.arc}.` : ''}\n\nLook for these problems:\n- the description and the first look disagree on who is there or what happens (one of them may be wrong: say what differs, and the picture will be looked at again);\n- the same person or thing described differently between items (hair, eyes, skin, clothing) with nothing in the story lines to explain it;\n- a person count that drops from one item to the next with nothing to explain it (someone hidden or out of view still counts);\n- a person or character called by a name in a description or story line (they must be he, she, they or described);\n- a story line that its description does not support (the roles and intensities are settled and correct: never question them).\nTags never match a picture word for word: never report a tag that a description leaves out. Only report real problems; most items have none.\n\nThen write an overview of the whole sequence: 1 to 2 sentences on who is in it and what happens from the first item to the last, without names.${facts ? `\n\n${facts}` : ''}\n\nReply with only JSON like this:\n{"overview": "...", "keywords": ["...", "..."], "problems": [{"item": 2, "about": "description", "problem": "..."}]}\nUse "about": "story" for a problem with a story line, and "description" for the rest.\n\n${blocks}`;
}

async function v3Review(entry, report) {
    report.cost.text += 1;
    const data = jsonIn(await textAsk(v3ReviewPrompt(entry, report.facts || ''), 300 + 80 * entry.variants.length));
    if (!data) {
        throw new Error('the check gave no readable answer');
    }
    return {
        overview: String(data.overview || '').replace(/\s+/g, ' ').trim().slice(0, 600),
        keywords: Array.isArray(data.keywords) ? data.keywords.map(word => String(word).toLowerCase().trim()).filter(Boolean).slice(0, 12) : [],
        problems: Array.isArray(data.problems) ? data.problems.filter(item => item && item.problem).map(item => ({ item: Number(item.item) || 0, about: String(item.about || '').toLowerCase() === 'story' ? 'story' : 'description', problem: String(item.problem).replace(/\s+/g, ' ').trim().slice(0, 300) })) : [],
    };
}

function v3ReadFit(entry, reply) {
    const verdicts = new Map();
    for (const line of String(reply).split('\n')) {
        const match = line.replace(LIST_MARK, '').replace(/\*\*/g, '').match(/^\s*(?:item\s*)?(\d+)\s*[:.)-]\s*(.+)$/i);
        const number = Number(match?.[1]);
        if (!match || number < 1 || number > entry.variants.length || verdicts.has(number)) {
            continue;
        }
        const text = match[2].trim();
        if (/^fits\b/i.test(text)) {
            verdicts.set(number, { item: number, fits: true });
            continue;
        }
        const said = (text.match(/says?\s*[:"“]\s*([^"”]+)["”]?/i) || [])[1] || '';
        const instead = (text.match(/most likely\s*[:,]?\s*(.+)$/i) || [])[1] || '';
        verdicts.set(number, { item: number, fits: false, said: said.trim().slice(0, 300), instead: instead.replace(/\s+/g, ' ').trim().slice(0, 300) });
    }
    return [...verdicts.values()].sort((a, b) => a.item - b.item);
}

async function describeSequence(entry, blobs = []) {
    const s = settings();
    const items = entry.variants;
    const count = items.length;
    items.forEach(item => {
        item.deduced = [];
        item.before = null;
        item.seen = [];
        item.cast = '';
        item.beat = '';
        item.implied = [];
        item.inferred = [];
        item.dropped = Array.isArray(item.dropped) ? item.dropped : [];
        if (!item.roleLock) {
            item.role = null;
        }
        if (!item.roleLock || !item.diffEdited) {
            item.diff = '';
        }
    });
    entry.arc = '';
    const report = { framework: 'v3', at: Date.now(), steps: {}, missing: [], found: {}, notShown: [], importance: [], verdict: '', problems: [], errors: [], decided: {}, placed: {}, notes: {}, deduced: {}, noteLog: [], linked: {}, fit: [], inText: {}, board: {}, owned: {}, implied: {}, boardPeak: null, boardReply: '', fixed: [], cost: { vision: 0, text: 0, seconds: 0 }, facts: '', itemFacts: [], ownTags: [], gender: null };
    const checkable = checkableTags(entry);
    const ordered = list => checkable.filter(tag => list.includes(tag));
    const own = items.map(item => (item.tags || []).map(normalizeTag).filter(tag => checkable.includes(tag)));
    const distinct = new Set(own.map(list => [...new Set(list)].sort().join(' '))).size > 1;
    const trusted = items.map((item, index) => !entry.fromVideo && distinct && own[index].length > 0);
    report.ownTags = trusted.map((yes, index) => (yes ? index + 1 : 0)).filter(Boolean);
    try {
        const { matter } = rememberedTags();
        const hinted = checkable.filter(tag => matter.has(tag) || tagNotesFor(tag).length || removalNotesFor(tag).length);
        const lookup = tags => Promise.race([characterGenders(tags, entry.site), new Promise(done => setTimeout(() => done(null), 8000))]).catch(() => null);
        const characters = await lookup(checkable);
        const facts = genderFacts(entry.tags, characters);
        const itemFacts = await Promise.all(items.map(async (item, index) => (trusted[index] ? genderFacts(item.tags, await lookup(own[index])) : facts)));
        report.facts = facts.text;
        report.itemFacts = itemFacts.map(found => found.text);
        if (hinted.length) {
            await Promise.race([ensureDefinitions(hinted, entry.site), new Promise(done => setTimeout(done, 15000))]).catch(() => null);
        }
        const boardTags = trusted.every(Boolean) ? [] : checkable;
        const ownLines = items.map((item, index) => (trusted[index] ? `Item ${index + 1}: ${own[index].join(', ').replace(/_/g, ' ')}` : '')).filter(Boolean);
        const boardFacts = [facts.text, ownLines.length ? `Each of these pictures was tagged on its own by the site. Its own tags, as hints on who is there and what happens (the picture comes first):\n${ownLines.join('\n')}` : ''].filter(Boolean).join('\n\n');
        groupStep(entry, `Looking at all ${count} items together…`);
        let seen = null;
        try {
            seen = await lookAtBoard(entry, blobs, boardTags, report, boardFacts);
            const clash = items.map((item, index) => ({ index, word: genderClash(`${item.cast} ${item.beat}`, itemFacts[index]) })).filter(found => found.word);
            if (seen && clash.length) {
                const first = itemFacts[clash[0].index];
                report.gender = { word: clash[0].word, board: 'asked again', items: [] };
                const again = `Your first answer called someone "${clash[0].word}" (item ${clash.map(found => found.index + 1).join(', ')}), but ${first.onlyMale ? 'no tag counts a girl or a woman, and everyone the tags count is male' : 'no tag counts a boy or a man, and everyone the tags count is female'}${trusted[clash[0].index] ? ' in that item\'s own tags' : ''}. Look again: that person is most likely ${first.onlyMale ? 'one of the boys, androgynous or feminine-looking' : 'one of the girls'}. Answer again in the same format, for every item.`;
                const second = await lookAtBoard(entry, blobs, boardTags, report, boardFacts, again).catch(() => null);
                if (second) {
                    seen = second;
                }
                report.gender.board = items.some((item, index) => genderClash(`${item.cast} ${item.beat}`, itemFacts[index])) ? 'asked again, still says so' : 'asked again, fixed';
            }
        } catch (error) {
            report.errors.push(`The whole sequence: ${error?.message || error}`);
            report.steps.board = 'failed';
        }
        items.forEach((item, index) => {
            if (trusted[index]) {
                item.shows = checkable.filter(tag => (own[index].includes(tag) || item.added.includes(tag)) && !item.dropped.includes(tag));
                return;
            }
            item.shows = checkable.filter(tag => seen?.get(tag)?.has(index + 1) || item.added.includes(tag) || (distinct && own[index].includes(tag)));
            if (distinct) {
                own[index].filter(tag => !seen?.get(tag)?.has(index + 1) && !item.added.includes(tag)).forEach(tag => {
                    report.owned[tag] = [...(report.owned[tag] || []), index + 1];
                });
            }
        });
        const implies = await Promise.race([tagImplications(checkable, entry.site), new Promise(done => setTimeout(() => done(null), 8000))]).catch(() => null);
        if (implies?.size) {
            items.forEach((item, index) => {
                for (let round = 0; round < 3; round++) {
                    const next = item.shows.flatMap(tag => (implies.get(tag) || []).map(to => ({ tag: to, from: tag }))).filter(link => checkable.includes(link.tag) && !item.shows.includes(link.tag) && !item.dropped.includes(link.tag));
                    if (!next.length) {
                        break;
                    }
                    next.forEach(link => {
                        if (!item.shows.includes(link.tag)) {
                            item.shows = ordered([...item.shows, link.tag]);
                            item.implied.push(link);
                            report.implied[link.tag] = [...(report.implied[link.tag] || []), index + 1];
                        }
                    });
                }
            });
        }
        report.steps.implied = implies === null ? 'failed' : Object.keys(report.implied).length ? 'on' : 'none found';
        checkable.forEach(tag => {
            const numbers = items.map((item, index) => index + 1).filter(number => items[number - 1].shows.includes(tag));
            if (numbers.length) {
                report.board[tag] = numbers;
            }
        });
        report.missing = checkable.filter(tag => !report.board[tag]);
        report.notShown = [...report.missing];
        for (const [index] of items.entries()) {
            groupStep(entry, `Writing item ${index + 1} of ${count}…`);
            try {
                await v3Describe(entry, index, blobs[index], {}, report);
            } catch (error) {
                if (index === 0 && !items[0].description) {
                    throw error;
                }
                report.errors.push(`Describing item ${index + 1}: ${error?.message || error}`);
            }
        }
        report.steps.describe = items.every(item => item.description) ? 'on' : 'failed';
        entry.description = items[0].description;
        entry.keywords = [...new Set(items.flatMap(item => item.keywords))].slice(0, 12);
        const described = items.every(item => item.description);
        const lacking = items.map((item, index) => (trusted[index] ? [] : checkable.filter(tag => !item.shows.includes(tag) && !item.dropped.includes(tag))));
        if (described && lacking.some(list => list.length)) {
            if (report.notShown.length) {
                await Promise.race([ensureDefinitions(report.notShown, entry.site), new Promise(done => setTimeout(done, 10000))]).catch(() => null);
            }
            groupStep(entry, 'Finding the tags in the descriptions…');
            try {
                report.cost.text += 1;
                const reply = await textAsk(itemTagsPrompt(entry, lacking), 80 + 70 * count);
                report.inTextReply = String(reply).slice(0, 3000);
                const found = readItemTags(entry, lacking, reply);
                found.forEach((hits, index) => {
                    const item = items[index];
                    hits.forEach(hit => {
                        item.shows = ordered([...item.shows, hit.tag]);
                        item.inferred.push(hit);
                        report.inText[hit.tag] = [...(report.inText[hit.tag] || []), `item ${index + 1}${hit.words ? ` ("${hit.words}")` : ''}`];
                    });
                });
                report.notShown = report.notShown.filter(tag => !items.some(item => item.shows.includes(tag)));
                report.steps.inText = found.size ? 'on' : 'none found';
            } catch (error) {
                report.errors.push(`Finding the tags in the descriptions: ${error?.message || error}`);
                report.steps.inText = 'failed';
            }
        } else {
            report.steps.inText = !described ? 'skipped' : trusted.every(Boolean) ? 'own tags' : 'not needed';
        }
        if (described) {
            groupStep(entry, 'Story: intensity, roles and story lines…');
            try {
                report.cost.text += 1;
                await writeStory(entry, '', report);
                report.steps.story = 'on';
            } catch (error) {
                report.errors.push(`Story lines: ${error?.message || error}`);
                report.steps.story = 'failed';
            }
        } else {
            report.steps.story = 'skipped';
        }
        const storied = report.steps.story === 'on';
        if (!storied) {
            items.forEach(item => {
                item.role = null;
                item.diff = '';
            });
            entry.arc = '';
        }
        const rules = String(s.roleRules || '').trim();
        if (storied && rules && s.groupRoleFit !== false) {
            groupStep(entry, 'Role fit: checking each item against your rules…');
            try {
                report.cost.text += 1;
                const reply = await textAsk(roleFitPrompt(entry), 80 + 80 * count);
                report.fitReply = String(reply).slice(0, 3000);
                report.fit = v3ReadFit(entry, reply);
                report.steps.fit = report.fit.some(verdict => !verdict.fits) ? 'on' : 'all fit';
            } catch (error) {
                report.errors.push(`Role fit: ${error?.message || error}`);
                report.steps.fit = 'failed';
            }
        } else {
            report.steps.fit = !rules ? 'no rules' : s.groupRoleFit === false ? 'off' : 'skipped';
        }
        const verify = new Map();
        const proposed = new Map();
        const deducible = report.notShown.filter(tag => tagNotesFor(tag).length || removalNotesFor(tag).length || (matter.has(tag) && tagDefinition(tag)));
        if (deducible.length && described && s.groupDeduce !== false) {
            groupStep(entry, `Your notes: where ${deducible.length} tag${deducible.length === 1 ? '' : 's'} nobody saw could be…`);
            try {
                report.cost.text += 1;
                const found = await deduceTags(entry, deducible, report);
                found.forEach((place, tag) => {
                    if (place.remove) {
                        removeTag(entry, tag, { reason: place.why, by: 'ai' });
                        report.notShown = report.notShown.filter(other => other !== tag);
                        return;
                    }
                    proposed.set(tag, place);
                    const numbers = place.lasts ? items.map((item, index) => index + 1).filter(number => number >= place.item) : [place.item];
                    numbers.forEach(number => verify.set(number - 1, [...(verify.get(number - 1) || []), { tag, why: number === place.item ? place.why : `it happened in item ${place.item} and lasts` }]));
                });
                report.steps.deduce = found.size ? 'on' : 'none placed';
            } catch (error) {
                report.errors.push(`Tags from your notes: ${error?.message || error}`);
                report.steps.deduce = 'failed';
            }
        } else {
            report.steps.deduce = deducible.length ? (s.groupDeduce === false ? 'off' : 'skipped') : 'not needed';
        }
        let review = null;
        if (described) {
            groupStep(entry, 'Sequence check: reading everything together…');
            try {
                review = await v3Review(entry, report);
                if (review.overview) {
                    entry.description = review.overview;
                }
                if (review.keywords.length) {
                    entry.keywords = review.keywords;
                }
                report.steps.review = 'on';
            } catch (error) {
                report.errors.push(`Final check: ${error?.message || error}`);
                report.steps.review = 'failed';
            }
        } else {
            report.steps.review = 'skipped';
        }
        const problems = (review?.problems || []).filter(problem => problem.item >= 1 && problem.item <= count);
        const work = new Map();
        const need = index => work.get(index) || work.set(index, { problems: [], roleFix: null, verify: [] }).get(index);
        problems.filter(problem => problem.about !== 'story' && !items[problem.item - 1].lock).forEach(problem => need(problem.item - 1).problems.push(problem.problem));
        report.fit.filter(verdict => !verdict.fits && !items[verdict.item - 1]?.lock).forEach(verdict => {
            need(verdict.item - 1).roleFix = verdict;
        });
        verify.forEach((list, index) => {
            need(index).verify = list;
        });
        items.forEach((item, index) => {
            const word = genderClash(item.description, itemFacts[index]);
            if (word && !item.lock) {
                need(index).problems.push(genderProblem(word, itemFacts[index]));
                report.gender = { board: '', ...(report.gender || {}), word: report.gender?.word || word, items: [...(report.gender?.items || []), index + 1] };
            }
        });
        const redone = new Set();
        for (const [index, asks] of [...work].sort((a, b) => a[0] - b[0])) {
            const item = items[index];
            groupStep(entry, `Looking again at item ${index + 1}…`);
            if (asks.verify.length) {
                item.before = item.before || { description: item.description, sections: item.sections, keywords: item.keywords };
            }
            try {
                const checked = await v3Describe(entry, index, blobs[index], asks, report);
                redone.add(index + 1);
                checked.kept.forEach(tag => {
                    const place = asks.verify.find(other => other.tag === tag);
                    item.deduced = [...item.deduced.filter(d => d.tag !== tag), { tag, why: place?.why || '' }];
                    item.shows = ordered([...item.shows, tag]);
                });
                if (asks.verify.length && !checked.kept.length) {
                    item.before = null;
                }
                if (asks.roleFix) {
                    asks.roleFix.fixed = true;
                }
                report.fixed.push({ item: index + 1, role: Boolean(asks.roleFix), problems: asks.problems.length, kept: checked.kept, left: checked.left.map(left => `${left.tag}${left.why ? ` (${left.why})` : ''}`) });
                checked.left.forEach(left => report.noteLog.push(`${left.tag.replace(/_/g, ' ')}: looked for again in item ${index + 1} and left out${left.why ? `, because ${left.why}` : ''}`));
                checked.kept.forEach(tag => report.noteLog.push(`${tag.replace(/_/g, ' ')}: looked for again in item ${index + 1} and kept`));
            } catch (error) {
                report.errors.push(`Looking again at item ${index + 1}: ${error?.message || error}`);
            }
        }
        report.steps.fix = work.size ? (redone.size ? 'on' : 'failed') : 'nothing to fix';
        proposed.forEach((place, tag) => {
            const numbers = items.map((item, index) => index + 1).filter(number => items[number - 1].deduced.some(d => d.tag === tag));
            if (numbers.length) {
                report.deduced[tag] = { items: numbers, why: place.why, lasts: Boolean(place.lasts && numbers.length > 1) };
                report.notShown = report.notShown.filter(other => other !== tag);
            }
        });
        report.problems = problems.map(problem => ({ ...problem, redone: problem.about === 'story' ? storied : redone.has(problem.item) }));
        const storyNotes = problems.filter(problem => problem.about === 'story').map(problem => `item ${problem.item}: ${problem.problem}`);
        const storyClash = items.map((item, index) => ({ number: index + 1, word: genderClash(item.diff, itemFacts[index]), facts: itemFacts[index] })).filter(found => found.word);
        if (storyClash.length) {
            storyNotes.push(`the story lines of item ${storyClash.map(found => found.number).join(', ')} call someone "${storyClash[0].word}", but ${storyClash[0].facts.onlyMale ? 'everyone the tags count is male: use he for that person' : 'everyone the tags count is female: use she for that person'}.`);
            report.gender = { board: '', items: [], ...(report.gender || {}), word: report.gender?.word || storyClash[0].word, story: true };
        }
        if (storied && (redone.size || storyNotes.length)) {
            groupStep(entry, 'Story again: rewriting the story lines, roles kept…');
            try {
                report.cost.text += 1;
                await keepRoles(entry, () => writeStory(entry, storyNotes.join(' '), report));
                report.steps.again = 'on';
            } catch (error) {
                report.errors.push(`Story lines again: ${error?.message || error}`);
                report.steps.again = 'failed';
            }
        } else {
            report.steps.again = 'not needed';
        }
        if (report.notShown.length && s.groupImportance !== false) {
            const { dont } = rememberedTags();
            report.notShown.filter(tag => matter.has(tag) || dont.has(tag)).forEach(tag => report.noteLog.push(`${tag.replace(/_/g, ' ')}: judged from your list, ${matter.has(tag) ? 'it matters' : 'it does not matter'}`));
            report.importance = report.notShown.filter(tag => matter.has(tag) || dont.has(tag)).map(tag => ({ tag, important: matter.has(tag), why: matter.has(tag) ? 'you marked it as important before' : 'you threw it out before', by: 'remembered' }));
            const ask = report.notShown.filter(tag => !matter.has(tag) && !dont.has(tag));
            let verdict = '';
            report.steps.importance = 'remembered';
            if (ask.length) {
                groupStep(entry, `Tags not found: judging ${ask.length}…`);
                try {
                    report.cost.text += 1;
                    const judged = await judgeMissing(entry, checkable, ask);
                    report.importance.push(...judged.items);
                    verdict = judged.verdict;
                    report.steps.importance = 'on';
                } catch (error) {
                    report.errors.push(`Judging the tags not found: ${error?.message || error}`);
                    report.steps.importance = 'failed';
                }
            }
            report.verdict = verdict === 'needs a look' || report.importance.some(item => item.important) ? 'needs a look' : verdict || (report.steps.importance === 'failed' ? '' : 'fine');
        } else {
            report.steps.importance = report.notShown.length ? 'off' : 'not needed';
        }
        const important = report.importance.filter(item => item.important).map(item => item.tag);
        entry.attention = report.verdict === 'needs a look' ? { tags: important.length ? important : [...report.notShown], at: Date.now() } : null;
        report.cost.seconds = Math.round((Date.now() - report.at) / 1000);
        entry.sections = {};
        entry.lock = null;
        entry.described = visionHash();
        entry.report = report;
        items.forEach(item => descriptions.set(item.url, describedVariant(entry, item)));
        return entry;
    } finally {
        groupStep(entry, '');
    }
}

async function redoItem(entry, index) {
    const item = entry.variants[index];
    if (!item) {
        return entry;
    }
    groupStep(entry, `Describing item ${index + 1} of ${entry.variants.length}…`);
    try {
        await describeItem(entry, index, null, { fallback: !entry.variants.some(other => other.shows.length) });
        await refreshStory(entry);
    } finally {
        groupStep(entry, '');
    }
    if (index === 0 && !entry.report?.steps?.review) {
        entry.description = item.description;
    }
    await saveLibrary();
    return entry;
}

async function keepRoles(entry, run) {
    const roles = entry.variants.map(item => (item.role ? { ...item.role } : null));
    const arc = entry.arc;
    const result = await run();
    entry.variants.forEach((item, index) => {
        if (roles[index]) {
            item.role = roles[index];
        }
    });
    entry.arc = arc || entry.arc;
    entry.variants.forEach(item => descriptions.set(item.url, describedVariant(entry, item)));
    return result;
}

function roleFitPrompt(entry) {
    const timed = v3On(entry);
    const items = entry.variants.map((item, index) => `Item ${index + 1}${timed && (item.clip?.seconds || loopWords(entry, item, index)) ? ` (a GIF${item.clip?.seconds ? `, ${item.clip.seconds} s long` : ''}${loopWords(entry, item, index) ? `, ${loopWords(entry, item, index)}` : ''})` : ''}, the ${item.role ? roleText(item.role) : 'unknown role'}${item.role?.intensity ? `, intensity ${item.role.intensity}/10${item.role.why ? ` (${item.role.why})` : ''}` : ''}:\n${item.description}`).join('\n\n');
    return `These are the items of one ${groupWhat(entry)}, in order. Each item's role and intensity are settled and correct; its description was written before they were known, by someone looking at that item alone, so it may describe something that does not belong to that role.\n\nThe user's rules for the roles:\n${String(settings().roleRules || '').trim()}\n\n${items}\n\nFor each item, say whether its description fits its role under these rules. When it does not, quote the words that break the rule and say what the item most likely shows instead, as that role. Never change a role.\n\nReply with one line per item and nothing else, like:\n1: fits\n2: does not fit; says "the final blow"; most likely he raises his blade for the strike`;
}

async function roleFit(entry, report, { fix = false } = {}) {
    groupStep(entry, 'Checking each item fits its role…');
    const reply = await textAsk(roleFitPrompt(entry), 80 + 80 * entry.variants.length);
    report.fitReply = String(reply).slice(0, 3000);
    const verdicts = new Map();
    for (const line of String(reply).split('\n')) {
        const match = line.replace(LIST_MARK, '').replace(/\*\*/g, '').match(/^\s*(?:item\s*)?(\d+)\s*[:.)-]\s*(.+)$/i);
        const number = Number(match?.[1]);
        if (!match || number < 1 || number > entry.variants.length || verdicts.has(number)) {
            continue;
        }
        const text = match[2].trim();
        if (/^fits\b/i.test(text)) {
            verdicts.set(number, { item: number, fits: true });
            continue;
        }
        const said = (text.match(/says?\s*[:"“]\s*([^"”]+)["”]?/i) || [])[1] || '';
        const instead = (text.match(/most likely\s*[:,]?\s*(.+)$/i) || [])[1] || '';
        verdicts.set(number, { item: number, fits: false, said: said.trim().slice(0, 300), instead: instead.replace(/\s+/g, ' ').trim().slice(0, 300) });
    }
    report.fit = [...verdicts.values()].sort((a, b) => a.item - b.item);
    if (!fix) {
        return 0;
    }
    let fixed = 0;
    for (const verdict of report.fit.filter(item => !item.fits)) {
        const index = verdict.item - 1;
        const item = entry.variants[index];
        if (!item || item.lock) {
            continue;
        }
        groupStep(entry, `Fixing item ${verdict.item} to fit its role…`);
        try {
            await describeItem(entry, index, null, { roleFix: verdict });
            verdict.fixed = true;
            fixed += 1;
        } catch (error) {
            report.errors.push(`Fixing item ${verdict.item} to fit its role: ${error?.message || error}`);
        }
    }
    return fixed;
}

async function refreshStory(entry, notes = '') {
    if (settings().groupStory === false || entry.kind !== 'sequence' || !groupDescribed(entry) || !entry.variants.some(item => item.role)) {
        return false;
    }
    groupStep(entry, 'Rewriting the story lines to fit the roles…');
    try {
        await keepRoles(entry, () => writeStory(entry, notes));
        return true;
    } catch (error) {
        if (entry.report) {
            entry.report.errors = [...entry.report.errors, `Story lines: ${error?.message || error}`].slice(-12);
        }
        return false;
    }
}

async function applyTagChoices(entry, choices) {
    const report = entry.report;
    const updates = new Map();
    const restore = new Set();
    const judged = (tag, important, why) => {
        report.importance = [...report.importance.filter(item => item.tag !== tag), { tag, important, why, by: 'you' }];
    };
    const kind = groupWhat(entry);
    for (const [tag, choice] of choices) {
        const note = String(choice.note || '').replace(/\s+/g, ' ').trim().slice(0, 400);
        if (choice.kind === 'removed') {
            const removed = entry.removedTags?.[tag];
            if (!removed) {
                continue;
            }
            if (choice.state === 'wrong') {
                saveRemovalNote(tag, { wrong: true, reason: note || 'the user put it back', kind });
                restoreTag(entry, tag);
                report.noteLog = [...(report.noteLog || []), `${tag.replace(/_/g, ' ')}: the removal was wrong, put back${note ? `: ${note}` : ''}`].slice(-40);
            } else if (!removed.confirmed) {
                saveRemovalNote(tag, { confirmed: true, reason: removed.reason, kind });
                removed.confirmed = true;
            }
            continue;
        }
        if (choice.kind === 'deduced') {
            if (choice.state !== 'wrong') {
                const place = report.deduced[tag];
                if (place && !place.confirmed) {
                    const first = entry.variants[(place.items[0] || 1) - 1];
                    saveTagNote(tag, { note: plainNote(place.why, entry), confirmed: true, lasts: place.lasts, role: roleText(first?.role), story: first?.diff || '', kind });
                    place.confirmed = true;
                }
                continue;
            }
            const place = report.deduced[tag];
            const first = entry.variants[(place?.items[0] || 1) - 1];
            saveTagNote(tag, { wrong: true, note, role: roleText(first?.role), story: first?.diff || '', kind });
            (place?.items || []).forEach(number => {
                const item = entry.variants[number - 1];
                if (item) {
                    item.deduced = item.deduced.filter(d => d.tag !== tag);
                    item.shows = item.shows.filter(other => other !== tag || item.added.includes(tag));
                    restore.add(number - 1);
                }
            });
            delete report.deduced[tag];
            report.notShown = [...new Set([...report.notShown, tag])];
            report.notes[tag] = { note: `wrongly deduced${note ? `: ${note}` : ''}`, lasts: false };
            continue;
        }
        if (choice.state === 'nothere') {
            report.decided[tag] = 'nothere';
            judged(tag, true, note ? `not in this picture: ${note}` : 'not in this picture');
            rememberTag(tag, true, entry.site);
            removeTag(entry, tag, { reason: note, by: 'you' });
            saveRemovalNote(tag, { reason: plainNote(note, entry), kind });
            continue;
        }
        if (choice.state === 'out') {
            const keep = list => list.filter(other => normalizeTag(other) !== tag);
            entry.tags = keep(entry.tags);
            entry.variants.forEach(item => {
                item.tags = keep(item.tags);
                item.shows = keep(item.shows);
                item.added = keep(item.added);
            });
            report.notShown = report.notShown.filter(other => other !== tag);
            report.decided[tag] = 'out';
            judged(tag, false, note || 'you threw it out');
            rememberTag(tag, false, entry.site);
        } else if (choice.state === 'important') {
            report.decided[tag] = 'important';
            const tapped = [...choice.items].filter(number => number >= 1 && number <= entry.variants.length).sort((a, b) => a - b);
            const said = number => String((choice.shared ? note : choice.itemNotes?.get(number)) || (tapped.length === 1 ? note : '')).replace(/\s+/g, ' ').trim().slice(0, 400);
            const byItem = Object.fromEntries(tapped.filter(said).map(number => [number, said(number)]));
            const summary = tapped.length > 1 && !choice.shared ? tapped.filter(said).map(number => `item ${number}: ${said(number)}`).join('; ') : tapped.length ? said(tapped[0]) : note;
            judged(tag, true, summary || (tapped.length ? 'you placed it in the items that show it' : 'you marked it as important'));
            rememberTag(tag, true, entry.site);
            const numbers = tapped.length && choice.lasts ? entry.variants.map((item, index) => index + 1).filter(number => number >= tapped[0]) : tapped;
            if (summary || tapped.length) {
                report.notes[tag] = { note: summary, lasts: Boolean(choice.lasts), byItem };
            }
            if (tapped.length) {
                tapped.forEach(number => {
                    const item = entry.variants[number - 1];
                    saveTagNote(tag, { note: plainNote(said(number), entry), lasts: Boolean(choice.lasts), role: roleText(item.role), story: item.diff || '', kind });
                });
            } else if (note) {
                saveTagNote(tag, { note: plainNote(note, entry), lasts: false, role: '', story: '', kind });
            }
            if (numbers.length) {
                report.placed[tag] = numbers;
                report.notShown = report.notShown.filter(other => other !== tag);
                numbers.forEach(number => {
                    const why = tapped.includes(number)
                        ? (said(number) ? `the user says: ${said(number)}` : 'the user says it is there')
                        : `it happened in item ${tapped[0]} and lasts${said(tapped[0]) ? ` (${said(tapped[0])})` : ''}`;
                    updates.set(number - 1, [...(updates.get(number - 1) || []), { tag, why }]);
                });
            }
        }
    }
    const open = report.importance.filter(item => item.important && report.notShown.includes(item.tag) && !report.decided[item.tag]).map(item => item.tag);
    entry.attention = open.length ? { tags: open, at: Date.now() } : null;
    report.verdict = open.length ? 'needs a look' : 'fine (sorted by you)';
    try {
        for (const index of [...restore].sort((a, b) => a - b)) {
            const item = entry.variants[index];
            groupStep(entry, `Taking the wrong tag out of item ${index + 1}…`);
            if (item.before) {
                Object.assign(item, { description: item.before.description, sections: item.before.sections, keywords: item.before.keywords });
            }
            const again = [...item.deduced.map(d => d.tag), ...item.added.filter(tag => !updates.get(index)?.some(update => update.tag === tag))];
            if (!item.deduced.length) {
                item.before = null;
            }
            if (again.length) {
                try {
                    await describeItem(entry, index, null, { trusted: false, missed: again, why: Object.fromEntries(item.deduced.map(d => [d.tag, `it was not seen, but it most likely happens here: ${d.why}`]).concat(item.added.map(tag => [tag, report.notes[tag]?.byItem?.[index + 1] || report.notes[tag]?.note ? `the user says: ${report.notes[tag].byItem?.[index + 1] || report.notes[tag].note}` : 'the user says it is there']))) });
                } catch (error) {
                    report.errors = [...report.errors, `Updating item ${index + 1}: ${error?.message || error}`].slice(-12);
                }
            }
        }
        for (const [index, list] of [...updates].sort((a, b) => a[0] - b[0])) {
            const item = entry.variants[index];
            const tags = list.map(update => update.tag);
            groupStep(entry, `Updating item ${index + 1} with ${tags.join(', ').replace(/_/g, ' ')}…`);
            item.added = [...new Set([...item.added, ...tags])];
            item.shows = [...new Set([...item.shows, ...tags])];
            try {
                await describeItem(entry, index, null, { missed: tags, why: Object.fromEntries(list.map(update => [update.tag, update.why])) });
            } catch (error) {
                report.errors = [...report.errors, `Updating item ${index + 1}: ${error?.message || error}`].slice(-12);
            }
        }
        if (updates.size || restore.size) {
            await refreshStory(entry);
        }
        entry.variants.forEach(item => descriptions.set(item.url, describedVariant(entry, item)));
        await saveLibrary();
        scheduleLorebookSync();
    } finally {
        groupStep(entry, '');
    }
    return updates.size + restore.size;
}

async function redoEntry(entry, { save: saveNow = true } = {}) {
    if (isMulti(entry)) {
        await describeSet(entry);
    } else {
        const result = await requestDescription(entry.url, entry.tags, null, entry.lock?.text || '', [entry.borrowed?.fromVideo ? VIDEO_TAGS_NOTE : '', fixesNote(entry.fixes)].filter(Boolean).join('\n\n'), { tagInfo: true });
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
    const engine = ENGINES[settings().engines?.[domain] || (domain === DANBOORU ? 'danbooru' : '')];
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
const MAX_PARTS = 8;
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

function hashDrawable(drawable, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = 9;
    canvas.height = 8;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 9, 8);
    context.drawImage(drawable, 0, 0, 9, 8);
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
    return { bits, ratio: width && height ? width / height : 0 };
}

async function pictureBlob(source) {
    return source instanceof Blob ? source : String(source).startsWith('/') ? (await fetch(source)).blob() : (await downloadImage(source)).blob;
}

async function pictureHash(source) {
    const bitmap = await createImageBitmap(await pictureBlob(source));
    try {
        return hashDrawable(bitmap, bitmap.width, bitmap.height);
    } finally {
        bitmap.close?.();
    }
}

async function frameHashes(blob, count) {
    if (typeof ImageDecoder !== 'function') {
        return [];
    }
    const format = await sniffFormat(blob);
    const type = format === 'gif' ? 'image/gif' : format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : '';
    if (!type || (ImageDecoder.isTypeSupported && !await ImageDecoder.isTypeSupported(type))) {
        return [];
    }
    const decoder = new ImageDecoder({ data: new Uint8Array(await blob.arrayBuffer()), type });
    try {
        await decoder.tracks.ready;
        await decoder.completed?.catch(() => {});
        const total = decoder.tracks.selectedTrack?.frameCount || 1;
        const picks = total < 2 ? [0] : [...new Set(Array.from({ length: Math.min(count, total) }, (_, i) => Math.round(i * (total - 1) / Math.max(1, Math.min(count, total) - 1))))];
        const hashes = [];
        for (const frameIndex of picks) {
            const { image } = await decoder.decode({ frameIndex });
            try {
                hashes.push({ ...hashDrawable(image, image.displayWidth || image.codedWidth, image.displayHeight || image.codedHeight), frame: hashes.length + 1 });
            } finally {
                image.close?.();
            }
        }
        return hashes;
    } finally {
        decoder.close?.();
    }
}

async function ownHashes(entry, blob = null) {
    if (entryAnimated(entry)) {
        const frames = await frameHashes(blob || await pictureBlob(entry.url), 4).catch(() => []);
        if (frames.length) {
            return frames;
        }
    }
    return [{ ...await pictureHash(blob || entry.url), frame: 0 }];
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

const DANBOORU = 'danbooru.donmai.us';

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
    if (danbooruAccount() && own !== DANBOORU && !targets.some(target => target.site.domain === DANBOORU)) {
        targets.unshift({ site: { domain: DANBOORU, extra: '' }, engineName: 'danbooru', engine: ENGINES.danbooru, origin: `https://${DANBOORU}` });
    }
    return targets.sort((a, b) => (b.site.domain === DANBOORU) - (a.site.domain === DANBOORU));
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
            return post ? { ...huntMatch(target, post, 'same file', 100), target, post } : null;
        } catch (error) {
            console.debug(`[Image Search] md5 search failed on ${target.site.domain}`, error);
            return null;
        }
    }));
    return results.find(Boolean) || null;
}

const WIDE_TAGS = new Set(['1girl', '1boy', '2girls', '2boys', '3girls', '3boys', '4girls', 'multiple_girls', 'multiple_boys', '1other', 'solo', 'solo_focus', 'looking_at_viewer', 'simple_background', 'white_background', 'grey_background', 'highres', 'absurdres', 'lowres', 'animated', 'animated_gif', 'video', 'sound', 'gif', 'artist_name', 'signature', 'watermark', 'text', 'english_text', 'commentary', 'commentary_request', 'translated', 'comic', 'blush', 'smile', 'open_mouth', 'closed_mouth', 'standing', 'sitting', 'upper_body', 'full_body', 'cowboy_shot', 'female', 'male', 'girl', 'boy', 'woman', 'man']);

async function closestThumb(pool, owns, budget, report) {
    const queue = pool.slice(0, Math.max(0, budget.left));
    budget.left -= queue.length;
    let best = null;
    const worker = async () => {
        while (queue.length && !(best && best.distance <= 8)) {
            const candidate = queue.shift();
            try {
                const theirs = (await pictureHash(candidate.thumb)).bits;
                for (const own of owns) {
                    const distance = hashDistance(own.bits, theirs);
                    if (!best || distance < best.distance) {
                        best = { ...candidate, distance, frame: own.frame };
                    }
                }
                report.compared++;
            } catch (error) {
                console.debug('[Image Search] could not compare a thumbnail', candidate.thumb, error);
            }
        }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    if (best) {
        report.closest.push({ page: best.target.engine.postUrl(best.post, best.target.origin), id: String(best.post.id ?? ''), alike: Math.round((64 - best.distance) / 64 * 100) });
    }
    return best && best.distance <= 8 ? best : null;
}

function bothOrders(name) {
    const parts = name.split('_');
    return parts.length === 2 ? [name, `${parts[1]}_${parts[0]}`] : [name];
}

async function danbooruList(target, path) {
    const result = await request(`${target.origin}/${path}`);
    return result.ok && Array.isArray(result.data) ? result.data : [];
}

async function findArtist(target, entry, names, found) {
    const searched = (entry.searchTags || []).map(normalizeTag);
    const spellings = [...new Set(names.flatMap(bothOrders))];
    try {
        const artists = await danbooruList(target, `tags.json?search%5Bname_comma%5D=${encodeURIComponent(spellings.join(','))}&search%5Bcategory%5D=1&only=name,post_count&limit=100`);
        const hit = artists
            .filter(tag => tag?.name && Number(tag.post_count) > 0)
            .map(tag => ({ tag: normalizeTag(tag.name), from: names.find(name => bothOrders(name).includes(normalizeTag(tag.name))) || tag.name }))
            .sort((a, b) => searched.includes(b.from) - searched.includes(a.from))[0];
        if (hit) {
            return hit;
        }
    } catch (error) {
        console.debug('[Image Search] artist tag lookup failed', error);
    }
    const order = names.filter(name => !found.has(name)).sort((a, b) => searched.includes(b) - searched.includes(a)).slice(0, 4);
    for (const name of order) {
        try {
            const artist = (await danbooruList(target, `artists.json?search%5Bany_name_matches%5D=${encodeURIComponent(name)}&search%5Bis_deleted%5D=false&only=name&limit=1`))[0];
            if (artist?.name) {
                return { tag: normalizeTag(artist.name), from: name };
            }
        } catch (error) {
            console.debug('[Image Search] artist lookup failed', name, error);
        }
    }
    return null;
}

async function translateNames(target, entry, extra = []) {
    const domain = target.site.domain;
    const danbooru = domain === DANBOORU || target.engineName === 'danbooru';
    const names = extra.length ? extra : huntNames(entry);
    await lookupTags(domain, target.engineName, [...new Set(names.flatMap(bothOrders))]).catch(() => {});
    const found = new Map();
    for (const name of names) {
        const counts = bothOrders(name).map(tag => ({ tag, count: knownCount(domain, tag) }));
        const hit = counts.find(item => item.count > 0) || (counts.every(item => item.count === null) && !danbooru ? { tag: name, count: Number.MAX_SAFE_INTEGER } : null);
        if (hit) {
            found.set(name, hit);
        }
    }
    if (danbooru) {
        await Promise.all(names.filter(name => !found.has(name)).slice(0, 8).map(async name => {
            try {
                const tag = (await danbooruList(target, `tags.json?search%5Bname_or_alias_matches%5D=${encodeURIComponent(name)}&only=name,post_count&limit=1`))[0];
                if (tag?.name && Number(tag.post_count) > 0) {
                    found.set(name, { tag: normalizeTag(tag.name), count: Number(tag.post_count) });
                }
            } catch (error) {
                console.debug('[Image Search] alias lookup failed', name, error);
            }
        }));
    }
    const anchor = danbooru && !extra.length ? await findArtist(target, entry, names, found) : null;
    const tags = [...found.entries()].map(([from, hit]) => ({ ...hit, from })).filter(hit => !WIDE_TAGS.has(hit.tag)).sort((a, b) => a.count - b.count);
    if (extra.length) {
        return { anchor: null, tags };
    }
    let chosen = anchor;
    if (!chosen) {
        const searched = (entry.searchTags || []).map(normalizeTag);
        const pick = tags.find(hit => searched.includes(hit.from) && hit.count < Number.MAX_SAFE_INTEGER) || tags[0];
        chosen = pick ? { tag: pick.tag, from: pick.from } : null;
    }
    return { anchor: chosen, tags: chosen ? tags.filter(hit => hit.tag !== chosen.tag) : [] };
}

async function findByPairs(targets, entry, owns, md5, report, extra = []) {
    const tolerance = entryAnimated(entry) ? 0.15 : 0.04;
    const ratio = owns[0]?.ratio || 0;
    for (const target of targets) {
        const domain = target.site.domain;
        let names = report.anchors.get(domain);
        if (!names || extra.length) {
            const translated = await translateNames(target, entry, extra);
            if (!names) {
                names = translated;
                report.anchors.set(domain, names);
            } else {
                names = { anchor: names.anchor, tags: translated.tags.filter(hit => hit.tag !== names.anchor?.tag) };
            }
        }
        if (!names.anchor) {
            continue;
        }
        for (const hit of names.tags) {
            const pair = [names.anchor.tag, hit.tag];
            const key = `${domain} ${pair.join(' ')}`;
            if (report.tried.has(key)) {
                continue;
            }
            report.tried.add(key);
            report.pairs++;
            let posts = [];
            try {
                posts = await sitePosts(target, pair, 0);
            } catch (error) {
                console.debug(`[Image Search] pair search failed on ${domain}`, error);
                continue;
            }
            const pool = [];
            for (const post of posts) {
                if (sameFile(target, post, md5)) {
                    return { ...huntMatch(target, post, 'same file', 100), target, post, pair, frame: 0 };
                }
                const theirs = postRatio(post);
                const thumb = target.engine.thumb(post, target.origin);
                if (!thumb || report.seen.has(thumb) || (ratio && theirs && Math.abs(theirs - ratio) / ratio > tolerance)) {
                    continue;
                }
                report.seen.add(thumb);
                pool.push({ target, post, thumb });
            }
            const best = await closestThumb(pool.slice(0, 30), owns, report.budget, report);
            if (best) {
                return { ...huntMatch(target, best.post, 'alike', Math.round((64 - best.distance) / 64 * 100)), target, post: best.post, pair, frame: best.frame };
            }
            if (report.budget.left <= 0) {
                return null;
            }
        }
    }
    return null;
}

async function guessTags(entry, blob = null) {
    const service = ctx().ConnectionManagerRequestService;
    const profile = visionProfileId();
    if (!service || !profile) {
        return [];
    }
    const image = await imageDataUrl(entry.url, blob || null, 768);
    const prompt = 'Look at this picture and give 4 to 6 Danbooru tags for things that are clearly visible and specific to it: hair colour and length or style (blonde_hair, very_long_hair, twintails), eye colour (blue_eyes), clothing (school_uniform, kimono) and distinctive objects or features. Never give general tags such as 1girl, 1boy, solo, looking_at_viewer, simple_background or the number of people. Reply with only the tags, separated by commas.';
    const result = await modelRequest(service, profile, [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }] }], 80, { stream: false, extractData: true, includePreset: false, includeInstruct: false }, samplers(0.2));
    const text = String(typeof result === 'string' ? result : result?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
    return [...new Set(text.split(/[,\n]+/).map(tag => normalizeTag(tag.replace(/^[\s*•\-\d.]+/, '').replace(/[`"']/g, '').trim())))]
        .filter(tag => tag && /^[a-z0-9_()\-'.:]+$/.test(tag) && !WIDE_TAGS.has(tag)).slice(0, 6);
}

function isVideoPost(post) {
    const file = String(post.file_url || post.file?.url || '');
    const ext = String(post.file_ext || post.file?.ext || '').toLowerCase();
    return ['mp4', 'webm', 'zip', 'm4v'].includes(ext) || /\.(mp4|webm|zip|m4v)(\?|$)/i.test(file) || tagList(post.tag_string || post.tags).some(tag => /^(video|ugoira)$/i.test(tag));
}

async function groupTags(match, entry) {
    const { target, post } = match;
    const root = target.engine.parentId(post) || (target.engine.hasChildren(post) ? String(post.id) : '');
    if (!root) {
        return { tags: match.tags, note: '' };
    }
    const members = new Map([[String(post.id), post]]);
    for (const terms of target.engine.family(root)) {
        try {
            (await sitePosts(target, terms, 0)).forEach(member => members.set(String(member.id), member));
        } catch (error) {
            console.debug('[Image Search] could not read the group', terms, error);
        }
    }
    const group = [...members.values()];
    const video = entryAnimated(entry) ? group.find(isVideoPost) : null;
    if (video) {
        return { tags: target.engine.postTags(video).map(normalizeTag), note: `tags from its video version #${video.id}`, fromVideo: true };
    }
    return { tags: [...new Set(group.flatMap(member => target.engine.postTags(member).map(normalizeTag)))], note: group.length > 1 ? `tags from its group of ${group.length}` : '' };
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

function huntSummary(report, match) {
    const parts = [];
    report.anchors.forEach((names, domain) => {
        if (names.anchor) {
            parts.push(`${domain}: ${names.anchor.tag}${names.anchor.from !== names.anchor.tag ? ` (here: ${names.anchor.from})` : ''}`);
        }
    });
    const where = parts.length ? `${parts.join('; ')}. ` : '';
    const guessed = report.guessed.length ? ` The AI guessed: ${report.guessed.join(', ')}.` : report.asked ? ' The AI gave no specific tags to try.' : '';
    if (match) {
        const how = match.how === 'same file' ? 'the same file' : match.how.includes('IQDB') ? `${match.alike}% alike, found by IQDB` : `${match.alike}% alike${match.frame ? ` to frame ${match.frame}` : ''}`;
        const pair = match.pair ? ` with ${match.pair.join(' + ')}` : '';
        return `${where}Found post #${match.id} on ${match.domain}${pair}: ${how}${match.note ? `; ${match.note}` : ''}.${guessed}`;
    }
    const tried = report.pairs ? `Tried ${report.pairs} tag pair${report.pairs === 1 ? '' : 's'} and compared ${report.compared} picture${report.compared === 1 ? '' : 's'}; none was close enough.` : 'Found no tags to search with on your sites.';
    return `${where}${tried}${guessed}`;
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
    const report = { anchors: new Map(), tried: new Set(), seen: new Set(), closest: [], guessed: [], asked: false, pairs: 0, compared: 0, budget: { left: 120 } };
    let match = targets.length && md5 ? await findByMd5(targets, md5) : null;
    let owns = null;
    if (!match && targets.length) {
        owns = await ownHashes(entry, blob).catch(error => {
            console.debug('[Image Search] could not read the saved picture to compare it', error);
            return null;
        });
        if (owns?.length) {
            match = await findByPairs(targets, entry, owns, md5, report);
        }
    }
    if (!match && settings().huntIqdb && thumb) {
        match = await findOnIqdb(thumb, targets).catch(error => {
            console.debug('[Image Search] IQDB search failed', error);
            return null;
        });
    }
    if (!match && owns?.length && targets.some(target => report.anchors.get(target.site.domain)?.anchor)) {
        report.asked = Boolean(visionProfileId());
        report.guessed = await guessTags(entry, blob).catch(error => {
            console.debug('[Image Search] the AI could not guess tags', error);
            return [];
        });
        if (report.guessed.length) {
            match = await findByPairs(targets, entry, owns, md5, report, report.guessed);
        }
    }
    if (match?.target && match.post) {
        const group = await groupTags(match, entry);
        match.tags = group.tags.length ? group.tags : match.tags;
        match.note = group.note;
        match.fromVideo = Boolean(group.fromVideo);
    }
    const closest = report.closest.sort((a, b) => b.alike - a.alike).slice(0, 3).map(({ page, id, alike }) => ({ page, id, alike }));
    entry.huntReport = { text: huntSummary(report, match), closest: match ? [] : closest, at: Date.now() };
    if (!match?.tags.length) {
        return null;
    }
    entry.tags = summaryTags([...entry.tags, ...match.tags]);
    entry.borrowed = { site: match.domain, id: match.id, page: match.page, how: match.how, alike: match.alike, fromVideo: Boolean(match.fromVideo), at: Date.now() };
    if (entry.card && !entry.card.edited) {
        entry.card.basis = '';
    }
    return match;
}

const tagDrafts = new Map();

const tagPanelOpen = new Map();
const sectionOpen = new Map();
let moreOpen = false;
let libTagsOpen = false;

const GROUP_STEPS = [[/^Looking at each/, 'First look'], [/^Looking for (\d|important)/, 'Looking again for tags'], [/^Describing item/, 'Describing the items'], [/^Reading the descriptions/, 'Tags in the descriptions'], [/^Writing what each item/, 'Writing the story lines'], [/^(Checking each item fits|Fixing item \d+ to fit|Rewriting the story lines to fit)/, 'Checking the roles fit'], [/^(Looking where|Adding )/, 'Placing tags from your notes'], [/^Checking the descriptions/, 'Final check'], [/^Judging/, 'Judging tags not found']];

function progressParts(text) {
    const list = V3_STEPS.some(([test]) => test.test(text)) ? V3_STEPS : GROUP_STEPS;
    const step = list.findIndex(([test]) => test.test(text));
    return { step: step + 1, total: list.length };
}

function paintProgress(node, text) {
    node.innerHTML = '';
    node.hidden = !text;
    if (!text) {
        return;
    }
    const { step, total } = progressParts(text);
    node.appendChild(el('div', 'stis-progress-head', step ? `Working · step ${step} of ${total}` : 'Working'));
    node.appendChild(el('div', 'stis-progress-text', text));
    const track = el('div', 'stis-progress-track');
    const fill = el('div', 'stis-progress-fill');
    fill.style.width = `${step ? Math.round((step - 0.5) / total * 100) : 50}%`;
    track.appendChild(fill);
    node.appendChild(track);
}

function tagPanel(entry, onChange) {
    const report = entry.report;
    const deduced = Object.entries(report.deduced);
    const aiRemoved = Object.entries(entry.removedTags || {}).filter(([, removed]) => removed.by === 'ai');
    const unconfirmed = [...deduced, ...aiRemoved].filter(([, place]) => !place.confirmed);
    const box = el('details', `stis-tagfix${entry.attention ? ' stis-attention' : ''}`);
    const drafts = tagDrafts.get(entry.id) || new Map();
    tagDrafts.set(entry.id, drafts);
    const key = `${Boolean(entry.attention)}|${unconfirmed.length}|${report.at}`;
    const view = tagPanelOpen.get(entry.id)?.key === key ? tagPanelOpen.get(entry.id) : { open: Boolean(entry.attention || unconfirmed.length), row: '', key };
    tagPanelOpen.set(entry.id, view);
    box.open = view.open;
    box.addEventListener('toggle', () => {
        view.open = box.open;
    });
    const summary = el('summary', 'stis-tagfix-summary');
    if (entry.attention) {
        summary.appendChild(el('b', '', 'Needs a look · '));
    }
    summary.append([report.notShown.length ? `${report.notShown.length} tag${report.notShown.length === 1 ? '' : 's'} not found` : '', deduced.length ? `${deduced.length} deduced` : '', aiRemoved.length ? `${aiRemoved.length} taken out` : '', unconfirmed.length ? `${unconfirmed.length} to check` : ''].filter(Boolean).join(' · '));
    box.appendChild(summary);
    box.appendChild(el('small', 'stis-help stis-tagfix-help', `Tap a tag to sort it${entry.fromVideo ? ' (a tag not found may have been cut off with the parts)' : ''}. Done saves everything and updates the items.`));
    const done = el('div', 'menu_button stis-tagfix-done', 'Done');
    const startState = tag => (report.decided[tag] === 'important' ? 'important' : '');
    const wrote = choice => Boolean(choice.note.trim() || [...(choice.itemNotes?.values() || [])].some(text => text.trim()));
    const pending = ([tag, choice]) => (choice.kind === 'removed' ? Boolean(entry.removedTags?.[tag]) && (choice.state === 'wrong' || !entry.removedTags[tag].confirmed) : choice.kind === 'deduced' ? Boolean(report.deduced[tag]) && (choice.state === 'wrong' || !report.deduced[tag].confirmed) : report.notShown.includes(tag) && (choice.state !== startState(tag) || choice.items.size || wrote(choice) || choice.lasts));
    const refresh = () => done.classList.toggle('disabled', ![...drafts].some(pending));
    const rows = [];
    const openRow = tag => {
        view.row = view.row === tag ? '' : tag;
        rows.forEach(row => {
            row.body.hidden = row.tag !== view.row;
            row.node.classList.toggle('stis-tagfix-open', row.tag === view.row);
        });
    };
    const makeRow = (tag, extraClass) => {
        const node = el('div', `stis-tagfix-row${extraClass}`);
        node.dataset.tag = tag;
        const line = el('div', 'stis-tagfix-line');
        line.appendChild(el('span', 'stis-tagfix-tag', tag.replace(/_/g, ' ')));
        const state = el('small', 'stis-tagfix-state');
        line.append(state, el('i', 'fa-solid fa-chevron-down stis-tagfix-chevron'));
        line.addEventListener('click', () => openRow(tag));
        const body = el('div', 'stis-tagfix-body');
        body.hidden = view.row !== tag;
        node.classList.toggle('stis-tagfix-open', view.row === tag);
        node.append(line, body);
        rows.push({ tag, node, body });
        box.appendChild(node);
        return { node, state, body };
    };
    const itemChip = (index, item) => {
        const chip = el('span', 'stis-fchip stis-tagfix-item', String(index + 1));
        chip.title = `${entry.fromVideo ? 'Part' : entry.kind === 'sequence' ? 'Picture' : 'Version'} ${index + 1}${item.role ? ` (${roleText(item.role)})` : ''}: ${item.diff || shortDescription({ ...entry, sections: item.sections, description: item.description })}`;
        return chip;
    };
    const noteBox = (choice, placeholder, number = 0, after = null) => {
        const input = el('input', 'text_pole stis-tagfix-note');
        input.type = 'text';
        input.placeholder = placeholder;
        input.value = number ? choice.itemNotes.get(number) || '' : choice.note;
        input.addEventListener('input', () => {
            if (number) {
                choice.itemNotes.set(number, input.value);
            } else {
                choice.note = input.value;
            }
            after?.();
            refresh();
        });
        return input;
    };
    for (const tag of report.notShown) {
        const judged = report.importance.find(item => item.tag === tag);
        if (!drafts.has(tag) || drafts.get(tag).kind !== 'missing') {
            drafts.set(tag, { kind: 'missing', state: startState(tag), items: new Set(), note: '', itemNotes: new Map(), lasts: false });
        }
        const choice = drafts.get(tag);
        const { node, state, body } = makeRow(tag, '');
        const meaning = tagDefinition(tag);
        if (meaning) {
            body.appendChild(el('small', 'stis-tagfix-def', `${meaning.text} (${meaning.site} wiki)`));
        }
        if (judged?.why) {
            body.appendChild(el('small', 'stis-tagfix-why', `${judged.important ? 'Matters' : 'Minor'}: ${judged.why}`));
        }
        const chips = el('div', 'stis-tagfix-chips');
        const out = el('span', 'stis-fchip stis-tagfix-out', 'Doesn\'t matter');
        out.title = 'Unimportant everywhere: remembered on "Tags that do not matter" and left out of this group';
        const keep = el('span', 'stis-fchip stis-tagfix-keep', 'Important');
        const away = el('span', 'stis-fchip stis-tagfix-away', 'Not here');
        away.title = 'It matters in general but does not apply to this picture: it stays important, is taken out of this group (shown in red in its tags), and your reason is remembered';
        const shared = el('span', 'stis-fchip stis-tagfix-shared', 'One note');
        shared.title = 'Write one note for all the items you tapped instead of one each';
        const lasts = el('span', 'stis-fchip stis-tagfix-lasts', 'Lasts after');
        lasts.title = 'Once it happens it stays: also put it in every item after the first one you tapped';
        const numbers = entry.variants.map((item, index) => {
            const chip = itemChip(index, item);
            chip.addEventListener('click', () => {
                choice.items[choice.items.has(index + 1) ? 'delete' : 'add'](index + 1);
                if (choice.items.size) {
                    choice.state = 'important';
                }
                if (choice.items.has(index + 1) && choice.note.trim() && ![...choice.itemNotes.values()].some(text => text.trim())) {
                    choice.itemNotes.set(index + 1, choice.note);
                    choice.note = '';
                }
                paint();
            });
            return chip;
        });
        const notes = el('div', 'stis-tagfix-notes');
        const showState = () => {
            const tapped = [...choice.items].sort((a, b) => a - b);
            const text = choice.state === 'out' ? 'doesn\'t matter' : choice.state === 'nothere' ? `not here${wrote(choice) ? ' · note' : ''}`
                : tapped.length ? `→ ${tapped.join(', ')}${choice.lasts ? ' and after' : ''}${wrote(choice) ? ' · note' : ''}`
                    : choice.state === 'important' ? `important${wrote(choice) ? ' · note' : ''}`
                        : judged ? (judged.important ? 'matters' : 'minor') : 'not judged';
            state.textContent = text;
            state.classList.toggle('stis-tagfix-chosen', choice.state !== startState(tag) || tapped.length > 0);
        };
        const fillNotes = () => {
            notes.innerHTML = '';
            if (choice.state === 'nothere') {
                notes.appendChild(noteBox(choice, 'Why doesn\'t it apply here? (remembered for next time)', 0, showState));
                return;
            }
            if (choice.state !== 'important') {
                return;
            }
            const tapped = [...choice.items].sort((a, b) => a - b);
            shared.hidden = tapped.length < 2;
            if (choice.shared && tapped.length > 1) {
                notes.appendChild(noteBox(choice, `One note for items ${tapped.join(', ')}: what happens there? e.g. off screen, because…`, 0, showState));
                return;
            }
            if (!tapped.length) {
                notes.appendChild(noteBox(choice, 'Why does it matter? (optional)', 0, showState));
                return;
            }
            tapped.forEach(number => {
                const item = entry.variants[number - 1];
                const label = tapped.length > 1 ? `Item ${number}${item?.role ? ` (${roleText(item.role)})` : ''}: ` : '';
                notes.appendChild(noteBox(choice, `${label}what happens here? e.g. off screen, because…`, number, showState));
            });
        };
        const paint = () => {
            out.classList.toggle('stis-fchip-on', choice.state === 'out');
            keep.classList.toggle('stis-fchip-on', choice.state === 'important');
            away.classList.toggle('stis-fchip-on', choice.state === 'nothere');
            shared.classList.toggle('stis-fchip-on', Boolean(choice.shared));
            shared.hidden = choice.items.size < 2;
            lasts.classList.toggle('stis-fchip-on', choice.lasts);
            const first = Math.min(...choice.items);
            numbers.forEach((chip, index) => {
                chip.classList.toggle('stis-fchip-on', choice.items.has(index + 1));
                chip.classList.toggle('stis-tagfix-carried', choice.lasts && choice.items.size > 0 && index + 1 > first && !choice.items.has(index + 1));
            });
            node.classList.toggle('stis-tagfix-gone', choice.state === 'out' || choice.state === 'nothere');
            fillNotes();
            showState();
            refresh();
        };
        away.addEventListener('click', () => {
            choice.state = choice.state === 'nothere' ? '' : 'nothere';
            choice.items.clear();
            choice.lasts = false;
            paint();
        });
        shared.addEventListener('click', () => {
            choice.shared = !choice.shared;
            if (choice.shared && !choice.note.trim()) {
                choice.note = [...choice.itemNotes.values()].find(text => text.trim()) || '';
            }
            paint();
        });
        out.addEventListener('click', () => {
            choice.state = choice.state === 'out' ? '' : 'out';
            choice.items.clear();
            choice.lasts = false;
            paint();
        });
        keep.addEventListener('click', () => {
            choice.state = choice.state === 'important' ? '' : 'important';
            if (!choice.state) {
                choice.items.clear();
                choice.lasts = false;
            }
            paint();
        });
        lasts.addEventListener('click', () => {
            choice.lasts = !choice.lasts;
            if (choice.lasts) {
                choice.state = 'important';
            }
            paint();
        });
        chips.append(keep, away, out, el('small', 'stis-tagfix-in', 'in'), ...numbers, lasts, shared);
        body.append(chips, notes);
        paint();
    }
    for (const [tag, place] of deduced) {
        if (!drafts.has(tag) || drafts.get(tag).kind !== 'deduced') {
            drafts.set(tag, { kind: 'deduced', state: '', note: '' });
        }
        const choice = drafts.get(tag);
        const { node, state, body } = makeRow(tag, ' stis-tagfix-deduced');
        body.appendChild(el('small', 'stis-tagfix-why', `Deduced from your notes, in item ${place.items.join(', ')}${place.lasts ? ' (lasts)' : ''}: ${place.why}${place.confirmed ? ' (confirmed)' : ' · Done confirms it unless you tap Wrong'}`));
        const wrong = el('span', 'stis-fchip stis-tagfix-wrong', 'Wrong');
        const note = el('div', 'stis-tagfix-notes');
        const paint = () => {
            wrong.classList.toggle('stis-fchip-on', choice.state === 'wrong');
            node.classList.toggle('stis-tagfix-gone', choice.state === 'wrong');
            note.innerHTML = '';
            if (choice.state === 'wrong') {
                note.appendChild(noteBox(choice, 'Why is it wrong? (saved for next time)'));
            }
            state.textContent = choice.state === 'wrong' ? 'wrong' : `deduced → ${place.items.join(', ')}${place.confirmed ? ' ✓' : ''}`;
            state.classList.toggle('stis-tagfix-chosen', choice.state === 'wrong');
            refresh();
        };
        wrong.addEventListener('click', () => {
            choice.state = choice.state === 'wrong' ? '' : 'wrong';
            paint();
        });
        const chips = el('div', 'stis-tagfix-chips');
        chips.appendChild(wrong);
        body.append(chips, note);
        paint();
    }
    for (const [tag, removed] of aiRemoved) {
        if (!drafts.has(tag) || drafts.get(tag).kind !== 'removed') {
            drafts.set(tag, { kind: 'removed', state: '', note: '' });
        }
        const choice = drafts.get(tag);
        const { state, body } = makeRow(tag, ' stis-tagfix-deduced stis-tagfix-removed');
        body.appendChild(el('small', 'stis-tagfix-why', `Taken out from your notes, as not applying here: ${removed.reason || 'no reason given'}${removed.confirmed ? ' (confirmed)' : ' · Done confirms it unless you tap Wrong'}`));
        const wrong = el('span', 'stis-fchip stis-tagfix-wrong', 'Wrong');
        const note = el('div', 'stis-tagfix-notes');
        const paint = () => {
            wrong.classList.toggle('stis-fchip-on', choice.state === 'wrong');
            note.innerHTML = '';
            if (choice.state === 'wrong') {
                note.appendChild(noteBox(choice, 'Why does it apply after all? (saved for next time)'));
            }
            state.textContent = choice.state === 'wrong' ? 'put back' : `not here${removed.confirmed ? ' ✓' : ''}`;
            state.classList.toggle('stis-tagfix-chosen', choice.state === 'wrong');
            refresh();
        };
        wrong.addEventListener('click', () => {
            choice.state = choice.state === 'wrong' ? '' : 'wrong';
            paint();
        });
        const chips = el('div', 'stis-tagfix-chips');
        chips.appendChild(wrong);
        body.append(chips, note);
        paint();
    }
    const buttons = el('div', 'stis-tagfix-buttons');
    done.title = 'Save your choices and notes, confirm the deduced tags you did not mark wrong, and update the items you placed tags in (keeping their descriptions)';
    done.addEventListener('click', async () => {
        if (done.classList.contains('disabled') || groupProgress.has(entry.id)) {
            return;
        }
        done.classList.add('disabled');
        done.textContent = 'Updating…';
        const picked = [...drafts].filter(pending);
        tagDrafts.delete(entry.id);
        view.row = '';
        try {
            await applyTagChoices(entry, picked);
        } catch (error) {
            toastr.warning(`Could not update the items: ${error?.message || error}`, 'Image Search');
        }
        onChange?.();
    });
    buttons.appendChild(done);
    if (entry.attention) {
        const fine = el('a', 'stis-attention-fine', 'Mark as fine');
        fine.href = '#';
        fine.title = 'Clear this flag without changing anything; it comes back only if the group is described again and the tags still are not found';
        fine.addEventListener('click', async event => {
            event.preventDefault();
            entry.attention = null;
            report.verdict = 'fine (marked by you)';
            await saveLibrary();
            onChange?.();
        });
        buttons.appendChild(fine);
    }
    box.appendChild(buttons);
    refresh();
    return box;
}

function groupReportBox(entry, current) {
    const report = entry.report;
    const box = el('details', 'stis-group-report');
    const notShown = report.notShown.length;
    box.appendChild(el('summary', '', `How this was described${notShown ? ` · ${notShown} tag${notShown === 1 ? '' : 's'} not found` : ''}${report.problems.length ? ` · ${report.problems.length} fix${report.problems.length === 1 ? '' : 'es'}` : ''}`));
    const words = { on: 'done', off: 'off', failed: 'failed', together: 'all items together', 'one by one': 'one item at a time', 'not needed': 'not needed', skipped: 'skipped', 'no tags to check': 'no tags to check', remembered: 'from your past choices', 'none placed': 'none placed', 'all fit': 'all fit', 'no rules': 'no rules written', 'none found': 'none found', 'stills only': 'done with still pictures', 'nothing to fix': 'nothing to fix', 'own tags': 'not needed: each picture has its own tags' };
    const step = key => words[report.steps[key]] || report.steps[key] || 'not run';
    const v3 = report.framework === 'v3';
    const lines = [v3 ? `New steps (v3): whole sequence: ${step('board')} · site implications: ${step('implied')} · descriptions: ${step('describe')} · tags in the descriptions: ${step('inText')} · story lines: ${step('story')} · role fit: ${step('fit')} · tags from your notes: ${step('deduce')} · final check: ${step('review')} · looking again: ${step('fix')} · story again: ${step('again')} · judging tags not found: ${step('importance')}` : `First look without tags: ${step('blind')} · looking for tags not seen: ${step('check')} · tags in the descriptions: ${step('inText')} · story lines: ${step('story')} · role fit: ${step('fit')} · deducing tags nobody saw: ${step('deduce')} · final check: ${step('review')} · judging tags not found: ${step('importance')}`];
    if (report.ownTags?.length) {
        lines.push(report.ownTags.length === entry.variants.length ? 'Each picture kept its own tags from the site: no guessing which tag goes where.' : `Picture ${report.ownTags.join(', ')} kept ${report.ownTags.length === 1 ? 'its' : 'their'} own tags from the site; the others had none of their own, so their tags were placed by the look at the whole sequence.`);
    }
    const index = current ? entry.variants.indexOf(current) : -1;
    if (current && index >= 0) {
        lines.push(`${entry.fromVideo ? 'Part' : entry.kind === 'sequence' ? 'Picture' : 'Version'} ${index + 1} was given ${current.shows.length} tag${current.shows.length === 1 ? '' : 's'}: ${current.shows.join(', ').replace(/_/g, ' ') || 'none (its own or the group\'s tags were used)'}`);
        if (current.seen.length) {
            lines.push(`The first look saw: ${current.seen.join(', ').replace(/_/g, ' ')}`);
        }
        if (current.cast || current.beat) {
            lines.push(`The look at the whole sequence saw in it: ${[current.cast ? `who is there: ${current.cast}` : '', current.beat ? `what happens: ${current.beat}` : ''].filter(Boolean).join('; ')}`);
        }
    }
    if (v3 && report.cost) {
        lines.push(`This run: ${report.cost.vision + report.cost.text} requests (${report.cost.vision} vision, ${report.cost.text} text), ${report.cost.seconds} s`);
    }
    if (report.facts) {
        lines.push(report.facts.replace(/\n/g, ' '));
    }
    if (report.gender?.word) {
        lines.push(`Gender check: "${report.gender.word}" goes against the tags${[report.gender.board ? `; the look at the whole sequence was ${report.gender.board}` : '', report.gender.items.length ? `; item ${report.gender.items.join(', ')} looked at again` : '', report.gender.story ? '; story lines rewritten' : ''].join('')}`);
    }
    const timed = entry.variants.filter(item => item.clip?.seconds);
    if (v3 && timed.length) {
        lines.push(`GIF lengths: ${entry.variants.map((item, index) => (item.clip?.seconds ? `item ${index + 1} ${item.clip.seconds} s${loopState(entry, item, index) === 'loop' ? ` (loops${item.loopSet === 'loop' ? ', set by you' : ''})` : item.loopSet === 'not' ? ' (not a loop, set by you)' : ''}` : '')).filter(Boolean).join(', ')}`);
    }
    const owned = Object.entries(report.owned || {});
    if (owned.length) {
        lines.push(`From each picture's own tags (the look at the whole sequence did not see them): ${owned.map(([tag, items]) => `${tag.replace(/_/g, ' ')} (item ${items.join(', ')})`).join('; ')}`);
    }
    if (report.boardPeak) {
        const climax = entry.variants.findIndex(item => item.role?.main === 'climax') + 1;
        lines.push(`Second opinion on the peak: the look at the whole sequence felt item ${report.boardPeak.item} was the emotional peak${report.boardPeak.why ? ` (${report.boardPeak.why})` : ''}; ${climax ? (climax === report.boardPeak.item ? 'the story step agrees' : `the story step chose item ${climax} as the climax`) : 'the story step chose no climax'}`);
    }
    const found = Object.entries(report.found);
    if (found.length) {
        lines.push(`Found when looking again: ${found.map(([tag, items]) => `${tag.replace(/_/g, ' ')} (item ${items.join(', ')})`).join('; ')}`);
    }
    const implied = Object.entries(report.implied || {});
    if (implied.length) {
        lines.push(`From the site's tag implications: ${implied.map(([tag, items]) => `${tag.replace(/_/g, ' ')} (item ${items.join(', ')})`).join('; ')}`);
    }
    const inText = Object.entries(report.inText || {});
    if (inText.length) {
        lines.push(`${report.framework === 'v3' ? 'Found in the descriptions' : 'Already in the descriptions'}: ${inText.map(([tag, hits]) => `${tag.replace(/_/g, ' ')} (${hits.join(', ')})`).join('; ')}`);
    }
    if (notShown) {
        lines.push(`Not found in any item: ${report.notShown.join(', ').replace(/_/g, ' ')}${entry.fromVideo ? ' (maybe cut off when the parts were made)' : ''}`);
    }
    Object.entries(report.deduced).forEach(([tag, place]) => lines.push(`Deduced from your notes: ${tag.replace(/_/g, ' ')} in item ${place.items.join(', ')}${place.lasts ? ' (lasts)' : ''}, ${place.why}`));
    const placed = Object.entries(report.placed);
    if (placed.length) {
        lines.push(`Placed by you: ${placed.map(([tag, items]) => `${tag.replace(/_/g, ' ')} (item ${items.join(', ')})`).join('; ')}`);
    }
    report.importance.forEach(item => lines.push(`· ${item.tag.replace(/_/g, ' ')}: ${item.important ? 'matters' : 'minor'}${item.why ? `, ${item.why}` : ''}${item.by === 'you' || item.by === 'remembered' ? '' : ' (judged by the AI)'}`));
    if (report.verdict) {
        lines.push(`Verdict: ${report.verdict}`);
    }
    report.problems.forEach(problem => lines.push(`Final check, item ${problem.item}${problem.about === 'story' ? ' (story line)' : ''}: ${problem.problem}${problem.redone ? (problem.about === 'story' ? ' (written again)' : ' (described again)') : entry.variants[problem.item - 1]?.lock ? ' (locked, left as is)' : ''}`));
    (report.fixed || []).forEach(fix => lines.push(`Looked at again, item ${fix.item}: ${[fix.role ? 'to fit its role' : '', fix.problems ? `${fix.problems} problem${fix.problems === 1 ? '' : 's'} from the final check` : '', fix.kept.length ? `kept ${fix.kept.join(', ').replace(/_/g, ' ')} from your notes` : '', fix.left.length ? `left out ${fix.left.join(', ').replace(/_/g, ' ')}` : ''].filter(Boolean).join('; ') || 'done'}`));
    report.errors.forEach(error => lines.push(`Problem: ${error}`));
    lines.forEach(line => box.appendChild(el('small', 'stis-group-report-line', line)));
    report.fit.filter(item => !item.fits).forEach(item => lines.length && box.appendChild(el('small', 'stis-group-report-line', `Role fit, item ${item.item}: ${item.said ? `said "${item.said}"` : 'did not fit'}${item.instead ? `; most likely ${item.instead}` : ''}${item.fixed ? ' (described again)' : entry.variants[item.item - 1]?.lock ? ' (locked, left as is)' : ''}`)));
    if (report.noteLog.length) {
        box.appendChild(el('small', 'stis-group-report-line stis-group-report-head', 'Your tag notes at work:'));
        report.noteLog.forEach(line => box.appendChild(el('small', 'stis-group-report-line', `· ${line}`)));
    }
    if (report.boardReply) {
        const raw = el('details', 'stis-group-report-raw');
        raw.appendChild(el('summary', '', 'The answer of the look at the whole sequence'));
        raw.appendChild(el('small', 'stis-group-report-line stis-entry-text', report.boardReply));
        box.appendChild(raw);
    }
    if (report.inTextReply) {
        const raw = el('details', 'stis-group-report-raw');
        raw.appendChild(el('summary', '', 'The answer when reading the descriptions for tags'));
        raw.appendChild(el('small', 'stis-group-report-line stis-entry-text', report.inTextReply));
        box.appendChild(raw);
    }
    if (report.deduceReply) {
        const raw = el('details', 'stis-group-report-raw');
        raw.appendChild(el('summary', '', 'The answer when placing tags from your notes'));
        raw.appendChild(el('small', 'stis-group-report-line stis-entry-text', report.deduceReply));
        box.appendChild(raw);
    }
    if (report.storyReply) {
        const raw = el('details', 'stis-group-report-raw');
        raw.appendChild(el('summary', '', 'The story step\'s answer'));
        raw.appendChild(el('small', 'stis-group-report-line stis-entry-text', report.storyReply));
        box.appendChild(raw);
    }
    return box;
}

function huntReportBox(entry) {
    const box = el('small', 'stis-hunt-report', `Tag finder: ${entry.huntReport.text}`);
    if (entry.huntReport.closest?.length) {
        box.append(' Closest: ');
        entry.huntReport.closest.forEach((item, i) => {
            const link = el('a', '', `${item.id ? `#${item.id}` : 'post'} (${item.alike}%)`);
            link.href = item.page;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            box.append(...(i ? [', ', link] : [link]));
        });
    }
    return box;
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
            variants.push({ id: found.entry.id, url: found.entry.url, source: item.page, tags: summaryTags(item.tags), diff: '', lock: found.entry.lock });
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
    const fileTags = [...new Set([...members.flatMap(item => item.fileTags || []), ...absorbed.flatMap(e => e.fileTags || [])])];
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
        entry.fileTags = [...new Set([...(entry.fileTags || []), ...fileTags])];
        entry.used += carried.used;
        entry.lastUsed = Math.max(entry.lastUsed, carried.lastUsed);
        entry.characters = [...new Set([...entry.characters, ...carried.characters])];
    } else {
        entry = cleanEntry({ id: variants[0].id, url: variants[0].url, source: variants[0].source, site: hostOf(variants[0].source), tags, fileTags, searchTags, kind: 'set', variants, ...carried });
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

async function saveVideoParts(item, parts, kind, searchTags) {
    await loadLibrary();
    const ids = freshIds(parts.length);
    const variants = [];
    const blobs = [];
    for (let i = 0; i < parts.length; i++) {
        const url = await uploadImage({ blob: parts[i].gif.blob, format: 'gif' });
        variants.push({ id: ids[i], url, source: `${item.page}#t=${Math.round(parts[i].start * 100) / 100},${Math.round(parts[i].end * 100) / 100}`, tags: [], diff: '' });
        blobs.push(parts[i].gif.blob);
    }
    const entry = cleanEntry({ id: ids[0], url: variants[0].url, source: variants[0].source, site: hostOf(item.page), tags: summaryTags(item.tags), fileTags: item.fileTags || [], searchTags, kind: kind === 'set' ? 'set' : 'sequence', variants, animated: true, fromVideo: { video: item.video, parts, duration: Number(item.scan?.duration || videoLength(item)) || 0 } });
    library.deleted.delete(entry.id);
    library.entries.unshift(entry);
    await saveLibrary();
    const work = describeSet(entry, blobs)
        .then(() => saveLibrary())
        .then(() => true)
        .catch(error => {
            console.warn('[Image Search] describing the video parts failed', error);
            toastr.warning(`The parts were saved, but describing them failed: ${error?.message || error}`, 'Image Search');
            return false;
        });
    return { entry, work };
}

async function saveSequence(picks, searchTags) {
    await loadLibrary();
    const variants = [];
    const blobs = [];
    const failed = [];
    const fileTags = new Set();
    for (const pick of picks.slice(0, 8)) {
        if (pick.entry) {
            const picture = pick.variant || pick.entry;
            (pick.entry.fileTags || []).forEach(tag => fileTags.add(tag));
            variants.push({ url: picture.url, source: picture.source || pick.entry.source, tags: (picture.tags?.length ? picture.tags : pick.entry.tags).slice(), diff: '', lock: pick.variant ? pick.variant.lock : pick.entry.lock });
            blobs.push(null);
            continue;
        }
        const item = pick.item;
        (item.fileTags || []).forEach(tag => fileTags.add(tag));
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
    const entry = cleanEntry({ id: variants[0].id, url: variants[0].url, source: variants[0].source, site: hostOf(variants[0].source), tags: summaryTags(variants.flatMap(variant => variant.tags)), fileTags: [...fileTags], searchTags, kind: 'sequence', variants });
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
            if (!item.video && await fileMissing(found.variant?.url || found.entry.url)) {
                try {
                    await restoreFile(found, item);
                    toastr.info('Its file was gone from the server, so it was downloaded again.', 'Image Search');
                } catch (error) {
                    console.warn('[Image Search] could not download the missing file again', error);
                    toastr.warning(`Its file is gone from the server and could not be downloaded again (${String(error?.message || error).slice(0, 140)}).`, 'Image Search');
                }
            }
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
        return { tags: entry.tags, note: entry.borrowed?.fromVideo ? VIDEO_TAGS_NOTE : '' };
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
            fileTags: item.fileTags || [],
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

const derived = new WeakMap();

function cachedFor(owner, kind, sig, make) {
    if (!owner || typeof owner !== 'object') {
        return make();
    }
    let slot = derived.get(owner);
    if (!slot) {
        slot = {};
        derived.set(owner, slot);
    }
    const known = slot[kind];
    if (known && known.sig === sig) {
        return known.value;
    }
    const value = make();
    slot[kind] = { sig, value };
    return value;
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
    const extra = entry.item ? entry.item.diff || '' : entry.variants.map(variant => variant.diff || '').join(' ');
    const text = `${entry.description} ${extra}`;
    for (const word of cachedFor(entry, 'words', text, () => wordsOf(text))) {
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


function showRule() {
    return promptPart('showRule').replace(/\s+/g, ' ').trim();
}

function catalogLine(entry) {
    const summary = shortDescription(entry) || entry.tags.slice(0, 8).join(', ').replace(/_/g, ' ');
    if (entry.kind === 'sequence' && isMulti(entry)) {
        const later = entry.variants.slice(1).map(variant => `[pic:${variant.id}]`).join(', then ');
        return `[pic:${entry.variants[0].id}] ${summary} (picture 1 of a ${entry.variants.length}-picture sequence; show ${later} later, in that order)`;
    }
    if (isMulti(entry)) {
        return `[pic:${entry.variants[0].id}] ${summary} (${entry.fromVideo ? 'other moments of the same video' : 'other versions'}: ${entry.variants.slice(1).map(variant => `[pic:${variant.id}]`).join(', ')})`;
    }
    return `[pic:${entry.id}] ${summary}${entry.animated ? ' (animated)' : ''}`;
}

function inLore(entry) {
    return (!isMulti(entry) || Boolean(settings().groupsInLore)) && groupAllowed(entry);
}

function pictureCatalog(size) {
    const usable = library.entries.filter(entry => (entry.description || entry.tags.length) && inLore(entry));
    const recent = rankEntries(usable, { text: recentText(8), character: ctx().name2 || '' }).map(({ entry }) => entry).slice(0, size);
    if (!recent.length) {
        return '';
    }
    return [`${showRule()} Use only the tags listed here or in other saved-picture notes, never invent one, never mention the tag in your text, and show at most one picture per reply. Prefer a picture that has not been shown yet in this chat. Saved pictures:`, ...recent.map(catalogLine)].join('\n');
}

function catalogWiEntry(uid, depth) {
    return { ...newWiEntry(uid, depth), constant: true, selective: false, group: '', useGroupScoring: false, cooldown: null, order: 0, comment: CATALOG_COMMENT };
}

function pictureOffer(entry) {
    const rule = 'never mention the tag itself, and show at most one picture per reply.';
    const body = fullDescription(entry);
    const tags = tagsLine(entry.tags);
    if (groupDescribed(entry)) {
        const sequence = entry.kind === 'sequence';
        const lines = entry.variants.map((item, index) => `${entry.fromVideo ? 'Part' : sequence ? 'Picture' : 'Version'} ${index + 1} [pic:${item.id}]: ${[item.sections.action || shortDescription({ ...entry, sections: item.sections, description: item.description }), itemStory(entry, item, index)].filter(Boolean).join(' ')}`.replace(/\s+/g, ' ').trim());
        const intro = sequence ? `Saved ${entry.fromVideo ? 'video in parts' : 'picture sequence'}: ${entry.variants.length} real ${entry.fromVideo ? 'animated pictures (GIFs)' : 'pictures'} that tell a story in this order. ${showRule()} When the scene matches picture 1, you may show it; show the next ones in later replies, in order, as the story moves on. Never skip ahead.` : `Saved ${entry.fromVideo ? 'video moments' : 'picture set'}: ${entry.variants.length} real ${entry.fromVideo ? 'animated pictures (GIFs)' : 'pictures'}, versions of one scene. ${showRule()} If one fits the moment or the user asks for it, show that one.`;
        return [`${intro} Write the tag on its own line where the picture belongs; ${rule}`, entry.description ? `Overview: ${entry.description}` : '', entry.arc ? `Shape: ${entry.arc}` : '', ...lines, tags].filter(Boolean).join('\n');
    }
    if (entry.kind === 'sequence' && isMulti(entry)) {
        const steps = entry.variants.map((variant, index) => index === 0
            ? `Picture 1 [pic:${variant.id}]: as described above.`
            : `Picture ${index + 1} [pic:${variant.id}]: ${variant.diff || 'the next picture of the sequence.'}`);
        const intro = entry.fromVideo ? `Saved video in parts: ${entry.variants.length} real animated pictures (GIFs) cut from one video, in this order.` : `Saved picture sequence: ${entry.variants.length} real pictures that tell a story in this order.`;
        return [`${intro} ${showRule()} When the scene matches picture 1, you may show it; show the next ones in later replies, in order, as the story moves on. Never skip ahead. Write the tag on its own line where the picture belongs; ${rule}`, body, ...steps, tags].filter(Boolean).join('\n');
    }
    if (entry.kind === 'set' && entry.variants.length > 1) {
        const versions = entry.variants.map((variant, index) => index === 0
            ? `${entry.fromVideo ? 'Part' : 'Version'} 1 [pic:${variant.id}]: as described above.`
            : `${entry.fromVideo ? 'Part' : 'Version'} ${index + 1} [pic:${variant.id}]: ${variant.diff || (entry.fromVideo ? 'another moment of the same video.' : 'another version of the same picture.')}`);
        const intro = entry.fromVideo ? `Saved video moments: ${entry.variants.length} real animated pictures (GIFs), separate moments cut from one video.` : `Saved picture set: ${entry.variants.length} real pictures, versions of the same scene.`;
        return [`${intro} ${showRule()} If one fits the moment or the user asks for it, write its tag on its own line where it belongs; ${rule}`, body, ...versions, tags].filter(Boolean).join('\n');
    }
    return [`Saved picture [pic:${entry.id}], a real ${entry.animated ? 'animated picture (GIF)' : 'picture'}. ${showRule()} If it fits the moment or the user asks for it, write [pic:${entry.id}] on its own line where it belongs; ${rule}`, body, tags].filter(Boolean).join('\n');
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
    const loreEntries = library.entries.filter(inLore);
    const wanted = new Set(loreEntries.map(entry => entry.id));
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
    for (const [position, entry] of loreEntries.entries()) {
        if (position && position % 60 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
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
    const keptDisabled = [...disabledByUs].filter(id => wanted.has(id));
    if (keptDisabled.length !== s.wiDisabledByUs.length || keptDisabled.some((id, index) => s.wiDisabledByUs[index] !== id)) {
        s.wiDisabledByUs = keptDisabled;
        save();
    }
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
const CARD_VERSION = 6;
const RATING_LEVELS = ['general', 'sensitive', 'questionable', 'explicit'];
const RATING_NAMES = { general: 'General (SFW)', sensitive: 'Sensitive', questionable: 'Questionable', explicit: 'Explicit (R-18)' };
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

function isSide(person) {
    return /^(side|secondary|other)$/i.test(String(person.role || '').trim());
}

function isPartly(person) {
    return /^(partly|partial|part)$/i.test(String(person.view || '').trim());
}

function isMainPerson(person) {
    return !isBackground(person) && !isSide(person) && !isPartly(person);
}

const EMPTY_VALUE = /^(none|n\/a|unknown|unclear|-|not shown|not visible|not stated|"")$/;

function cleanPerson(person) {
    const out = isBackground(person) ? { role: 'background' } : isSide(person) ? { role: 'side' } : /^main$/i.test(String(person.role || '').trim()) ? { role: 'main' } : {};
    if (isPartly(person)) {
        out.view = 'partly';
        out.seen = String(person.seen ?? '').replace(/\s+/g, ' ').trim().slice(0, 80).toLowerCase();
    }
    const minor = !isMainPerson(person);
    const sideFields = minor ? new Set(personCategories().filter(category => category.side).flatMap(category => category.from)) : null;
    const suffixes = categorySuffixes();
    for (const [key, raw] of Object.entries(person).slice(0, 24)) {
        const field = slug(key);
        if (!field || field === 'role' || field === 'background' || field === 'name' || field === 'view' || field === 'seen' || typeof raw === 'object') {
            continue;
        }
        if (sideFields && !sideFields.has(field) && personCategories().some(category => category.from.includes(field))) {
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
        .filter(person => Object.entries(person).some(([key, value]) => key !== 'role' && key !== 'view' && value));
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
    const count = Number.parseInt(card.count, 10);
    const rating = String(card.rating || '').trim().toLowerCase().replace(/^safe$|^sfw$/, 'general').replace(/^r-?18$|^nsfw$/, 'explicit');
    return {
        people,
        scene,
        ...(Number.isFinite(count) && count >= 0 && count <= 30 ? { count } : {}),
        ...(RATING_LEVELS.includes(rating) ? { rating } : {}),
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
    const text = entry.item ? `${entry.item.description}\n${entry.item.diff}` : `${entry.description}\n${entry.variants.map(variant => variant.diff).join('\n')}`;
    return cachedFor(entry.item || entry, 'basis', text, () => String(hashText(text)));
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
    const keys = [...personCategories().map(category => category.id), ...Object.keys(person).filter(key => key !== 'role' && key !== 'view' && key !== 'seen')];
    const fields = [...new Set(keys)].filter(key => person[key]).map(key => `${key}: ${person[key]}`);
    const head = [...(person.role ? [`role: ${person.role}`] : []), ...(person.view === 'partly' ? ['view: partly', ...(person.seen ? [`seen: ${person.seen}`] : [])] : [])];
    return `Person: ${[...head, ...fields].join('; ')}`;
}

function cardToText(card) {
    const lines = [...(card.count !== undefined ? [`Count: ${card.count}`] : []), ...(card.rating ? [`Rating: ${card.rating}`] : []), ...card.people.map(personLine)];
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
        const match = line.match(/^\s*(person|scene|pose|mood|place|framing|moments?|count|rating)\s*\d*\s*:\s*(.*)$/i);
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

function intensityWords(level) {
    return level >= 9 ? 'a peak moment' : level >= 7 ? 'an intense moment' : level >= 4 ? 'a moment of rising or falling tension' : level > 0 ? 'a calm moment' : '';
}

function itemPlace(entry) {
    const item = entry.item;
    if (!item || entry.kind !== 'sequence') {
        return '';
    }
    const index = entry.variants.indexOf(item);
    const role = roleText(item.role);
    const level = Number(item.role?.intensity) || 0;
    const loop = loopState(entry, item, index) === 'loop';
    return [`Picture ${index + 1} of ${entry.variants.length} of a sequence${role ? `, the ${role}` : ''}${level ? `, intensity ${level} of 10 (${intensityWords(level)})` : ''}${loop ? ', a loop' : ''}.`, item.diff ? `Story: ${String(item.diff).replace(/\s+/g, ' ').trim()}` : ''].filter(Boolean).join(' ');
}

function meaningText(entry) {
    const card = entry.card;
    const action = String(entry.sections?.action || '').replace(/\s+/g, ' ').trim();
    return [itemPlace(entry), `${cardWho(card)}.`, card.pose.length ? `Pose: ${card.pose.join(', ')}.` : '', card.mood.length ? `Mood: ${card.mood.join(', ')}.` : '', card.place ? `Place: ${card.place}.` : '', card.moments.length ? `Story moments: ${card.moments.join('; ')}.` : '', action].filter(Boolean).join(' ').slice(0, 1200);
}

function cardSource(entry) {
    if (entry.item) {
        const index = entry.variants.indexOf(entry.item);
        return `Item ${index + 1} of a ${groupWhat(entry)}. ${entry.item.description.replace(/\s+/g, ' ').trim().slice(0, 900)}${itemStory(entry, entry.item, index) ? ` ${itemStory(entry, entry.item, index).replace(/\s+/g, ' ').slice(0, 600)}` : ''}`;
    }
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
    const sidePeople = people.filter(category => category.side);
    const example = { n: 1, count: 2, rating: 'general', people: [{ role: 'main', view: 'full', seen: '', ...Object.fromEntries(people.map(category => [category.id, categoryExample(category)])) }, { role: 'side', view: 'partly', seen: 'only an arm', ...Object.fromEntries(sidePeople.map(category => [category.id, categoryExample(category)])) }], ...(scene.length ? { scene: Object.fromEntries(scene.map(category => [category.id, categoryExample(category)])) } : {}), pose: [poses[0] || 'standing'], mood: [moods[0] || 'calm'], place: 'forest at night', framing: 'full body', moments: ['after being shoved', 'losing a fight', 'an ambush'] };
    const prompt = `${fillTemplate(promptPart('cardPrompt'), {
        poses: poses.join(', '),
        moods: moods.join(', '),
        fields: cardFieldRules(people),
        sidefields: sidePeople.length ? cardFieldRules(sidePeople) : '  (none)',
        scene: scene.length ? cardFieldRules(scene) : '',
        pictures: picturesBlock(batch),
    })}\n\nReply with only a JSON array, one object per picture, like this:\n${JSON.stringify([example])}`;
    const result = await modelRequest(service, s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), 150 + 300 * batch.length, { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.2));
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
    const prompt = `${fillTemplate(promptPart('cardUpdatePrompt'), {
        fields: people.length ? people.map(category => `  "${category.id}"${category.side ? ' (side)' : ''}: ${categoryHint(category)}`).join('\n') : '',
        scene: scene.length ? cardFieldRules(scene) : '',
        pictures: picturesBlock(batch, true),
    })}\n\nReply with only a JSON array, one object per picture, like this:\n${JSON.stringify([example])}`;
    const result = await modelRequest(service, s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), 100 + batch.length * (30 + 25 * list.length * 2), { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.2));
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
            person[category.id] = isMainPerson(person) || category.side ? fresh[category.id] || '' : '';
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
        const full = only || (s.cards ? cardUnits().filter(entry => needsCard(entry) && (filing.failed.get(entry.unitKey || entry.id) || 0) < 2).sort((a, b) => (b.kind === 'sequence') - (a.kind === 'sequence') || (b.added || 0) - (a.added || 0)) : []);
        const light = only || !loud ? [] : cardUnits().filter(entry => !full.includes(entry) && staleCategories(entry).length);
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
                filing.failed.delete(entry.unitKey || entry.id);
                return true;
            };
            let missed = await fileBatches(full, CARD_BATCH, requestCards, fill, false);
            if (missed.length && !filing.cancel) {
                filing.total += missed.length;
                filing.stage = 'retry';
                paintCardStatus();
                missed = await fileBatches(missed, Math.min(CARD_BATCH, 4), requestCards, fill);
            }
            missed.forEach(entry => filing.failed.set(entry.unitKey || entry.id, (filing.failed.get(entry.unitKey || entry.id) || 0) + 1));
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
    const version = categoriesVersion();
    for (const unit of cardUnits()) {
        if (unit.card) {
            const key = unit.unitKey || unit.id;
            const made = cachedFor(unit, 'meaning', `${version}|${key}|${unit.sections?.action || ''}|${JSON.stringify(unit.card)}`, () => {
                const text = meaningText(unit);
                return { text, hash: hashText(`${key}\n${text}`) };
            });
            items.set(made.hash, { entry: unit.unitOf || unit, key, text: made.text });
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
        if (item && !order.has(item.key)) {
            order.set(item.key, order.size);
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
    const described = cardUnits().filter(entry => entry.description);
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
        side: raw?.side === undefined ? SIDE_DEFAULT.includes(slug(raw?.id || raw?.label)) : Boolean(raw.side),
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

const SIDE_DEFAULT = ['gender', 'species', 'build'];

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

let categoryEpoch = 0;
let categoryBuilds = 0;

function categoriesChanged() {
    categoryEpoch++;
}

function categories() {
    const stored = storedCategories();
    if (categoryCache?.stored === stored && categoryCache.epoch === categoryEpoch && Date.now() - categoryCache.checked < 2000) {
        return categoryCache.enabled;
    }
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
            category.hash = String(hashText(JSON.stringify([category.id, category.question, category.scope, category.type, category.tags, ...(category.side !== SIDE_DEFAULT.includes(category.id) ? [category.side] : [])])));
            list.push(category);
        }
        const enabled = list.filter(category => category.enabled);
        categoryBuilds++;
        categoryCache = { version: categoryBuilds, key, list, enabled, person: enabled.filter(category => category.scope === 'person'), scene: enabled.filter(category => category.scope === 'picture'), suffixes: new Map(enabled.map(category => [category.id, (category.phrase.match(/\{value\}\s+(.+)$/) || [])[1] || ''])) };
    }
    categoryCache.stored = stored;
    categoryCache.epoch = categoryEpoch;
    categoryCache.checked = Date.now();
    return categoryCache.enabled;
}

function categoriesVersion() {
    categories();
    return categoryCache.version;
}

function personCategories() {
    categories();
    return categoryCache.person;
}

function sceneCategories() {
    categories();
    return categoryCache.scene;
}

function categorySuffixes() {
    categories();
    return categoryCache.suffixes;
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

function sideLooks(person, member, fromMessage = new Map()) {
    const out = { score: 0, parts: [] };
    for (const category of personCategories().filter(item => item.side)) {
        const result = compareValues(category, personValues(category, person), wantedValues(category, member, fromMessage));
        if (result.score > 0) {
            out.score += result.score;
            out.parts.push(...result.parts);
        }
    }
    return out;
}

function looksWeight() {
    const weight = Number(settings().looksWeight);
    return Number.isFinite(weight) ? Math.max(0, Math.min(100, weight)) / 100 : 1;
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
    const layered = (entry.card.v || 1) >= 6;
    const mains = layered ? people.filter(isMainPerson) : people;
    const minors = layered ? people.filter(person => !isMainPerson(person)) : [];
    const notes = [];
    const matched = [];
    let score = 0;
    let minorPoints = 0;
    const cap = lookRules().extraCap;
    const roled = cast.some(member => member.role) ? cast : cast.map((member, index) => ({ ...member, role: index === 0 ? 'main' : 'extra' }));
    const needMain = roled.some(member => member.role === 'main');
    let mainFound = false;
    const describe = item => `person ${item.index + 1} (${personHead(item.person) || item.person.seen || 'person'}${isPartly(item.person) ? ', partly in view' : isSide(item.person) ? ', side' : ''})`;
    for (const member of roled) {
        const main = member.role === 'main';
        notes.push(`${knownLine(member, fromMessage)}${main ? ' (main focus)' : ' (may also be in it)'}`);
        const tried = (mains.length || !main ? mains : people).map(person => ({ index: all.indexOf(person), person, ...compareLooks(person, member, fromMessage) }));
        const fits = tried.filter(item => !item.wrong && !matched.includes(item.index)).sort((x, y) => y.score - x.score);
        const others = main ? [] : minors.map(person => ({ index: all.indexOf(person), person, ...sideLooks(person, member, fromMessage) })).filter(item => item.score > 0 && !matched.includes(item.index)).sort((x, y) => y.score - x.score);
        const room = Math.max(0, cap - minorPoints);
        const best = fits[0];
        const bestOther = others[0];
        const fullPoints = best ? (main ? best.score : Math.min(best.score, cap)) : null;
        const otherPoints = bestOther ? Math.min(bestOther.score, room) : 0;
        if (best && (main || fullPoints >= otherPoints)) {
            matched.push(best.index);
            mainFound ||= main;
            score += fullPoints;
            notes.push(`${member.name} ↔ ${describe(best)}: ${best.parts.join(', ') || 'nothing to compare'} → ${signed(fullPoints)}${main ? '' : ` (may also be in it, at most ${signed(cap)})`}`);
        } else if (bestOther && otherPoints > 0) {
            matched.push(bestOther.index);
            minorPoints += otherPoints;
            score += otherPoints;
            notes.push(`${member.name} ↔ ${describe(bestOther)}: ${bestOther.parts.join(', ')} → ${signed(otherPoints)} (side people only add points; all of them together at most ${signed(cap)})`);
        } else if (main) {
            notes.push(`Nobody looks like ${member.name}: ${tried.map(item => `${describe(item)} ${item.wrong}`).join('; ') || 'no main person on the card'}`);
        } else {
            notes.push(`${member.name} is not in the picture: that is fine → 0`);
        }
    }
    const weight = looksWeight();
    if (weight !== 1 && score) {
        const weighed = Math.round(score * weight * 10) / 10;
        notes.push(`Looks weight ${Math.round(weight * 100)}%: ${signed(score)} → ${signed(weighed)}`);
        score = weighed;
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
    const text = `${parts.join(', ') || 'person'}${isPartly(person) ? `, partly in view${person.seen ? ` (${person.seen})` : ''}` : ''}`;
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
    check('side', 'Also for side people and people only partly in view (they can only add points)', SIDE_DEFAULT.includes(slug(raw.id || raw.label)));
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
    return Boolean(entry.description) && (!String(entry.description).trimStart().startsWith('Visual:') || (isMulti(entry) && (!groupDescribed(entry) || (settings().groupStory !== false && entry.kind === 'sequence' && !entry.variants.some(item => item.role)))));
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
    const result = await modelRequest(service, s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), 200 + 40 * list.length * members.length, { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.1));
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
    const asked = [message, String(pickOptions.wish || '').trim()].filter(Boolean).join('\n');
    const banned = ruledOut(asked);
    const fromMessage = messageValues(asked);
    const choices = pictureCandidates(`${cut ? '' : recentText(2)} ${withoutRuledOut(asked)} ${judgedNotes().join(' ')}`);
    timing.keywords = clock() - started;
    if (!choices.length) {
        return choices;
    }
    let order = null;
    let meaningFailed = false;
    const [rank, cast] = await Promise.all([
        timed('meaning', meaningRank(meaningQuery(asked || recentText(1)), Infinity)).catch(error => {
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
        const position = order?.get(choice.key || choice.entry.id);
        const keywords = Math.min(choice.score || 0, 24);
        const meaningPoints = position === undefined ? 0 : Math.round(18 * (1 - position / Math.max(order.size, 1)));
        const detail = looksDetail(choice.view || choice.entry, cast, fromMessage);
        const looks = detail.score;
        const shownPoints = choice.fresh ? 0 : -12;
        const nextPoints = choice.continues ? SEQUENCE_NEXT_POINTS : 0;
        const clashes = banned.filter(item => showsAction(choice.view || choice.entry, item));
        const bannedPoints = clashes.length ? -15 : 0;
        let meaningNote;
        if (!meaningSource()) {
            meaningNote = 'Meaning: search by meaning is off, so it does not count.';
        } else if (meaningFailed) {
            meaningNote = 'Meaning: the search did not work this time, so it does not count.';
        } else if (position !== undefined) {
            meaningNote = `Meaning: #${position + 1} of ${order.size} closest to the newest message → ${signed(meaningPoints)} (the closest gets +18, the farthest 0)`;
        } else if (!(choice.view || choice.entry).card) {
            meaningNote = 'Meaning: no filing card yet, so it is not in the search index → 0';
        } else {
            meaningNote = 'Meaning: not in the search index yet (it updates in the background) → 0';
        }
        choice.parts = { meaning: position === undefined ? null : position + 1, of: order?.size || 0, looks, keywords, shown: shownPoints, meaningPoints, cast: cast.length > 0, notes: [meaningNote, ...detail.notes.map(note => `Looks: ${note}`), `Keywords: words shared with ${cut ? 'your message' : 'the story'} and the character's looks → ${signed(keywords)} (at most +24)`, ...(cut ? [`Scene cut ("${cut}"): the old scene is left out of keywords, meaning and the AI's check`] : []), ...(clashes.length ? [`Your message rules out ${clashes.map(item => `"${item.word}"`).join(', ')}, and the picture shows it → ${signed(bannedPoints)}`] : []), ...(shownPoints ? [`Already shown in this chat → ${signed(shownPoints)}`] : []), ...(nextPoints ? [`Next item of a sequence already started in this chat → ${signed(nextPoints)}`] : [])] };
        choice.parts.meaningNote = choice.parts.notes.shift();
        choice.first = keywords + looks + shownPoints + bannedPoints + nextPoints;
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
        items.push((choice.view || choice.entry).card ? 'not in the search index' : 'no meaning match');
    }
    if (parts.cast && (choice.view || choice.entry).card?.people?.length) {
        items.push(`looks ${signed(parts.looks)}`);
    } else if (!(choice.view || choice.entry).card) {
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
        const told = card ? headCount(entry.sections?.visual || entry.description || '') : null;
        const differs = card && told !== null && card.count !== undefined && told !== card.count ? ` (count differs: the description says ${told})` : '';
        box.appendChild(el('small', 'stis-card-head', card ? `Filing card${card.edited ? ' (edited by you)' : ''}${!card.edited && needsCard(entry) ? ' (out of date)' : ''}${card.rating ? ` · ${RATING_NAMES[card.rating]}${ratingAllowed(entry) ? '' : ', not sent'}` : ''}${differs}` : entry.description ? 'No filing card yet.' : 'A filing card is made once the picture is described.'));
        if (editing) {
            const area = el('textarea', 'text_pole stis-card-edit');
            area.value = card ? cardToText(card) : 'Count: 1\nRating: general\nPerson: role: main; gender: ; species: ; skin: ; hair: ; build: ; outfit: ; features: \nPose: \nMood: \nPlace: \nFraming: \nMoments: ';
            const hint = el('small', 'stis-card-hint', `Count: everyone in the picture. Rating: ${RATING_LEVELS.join(', ')}. One Person line per person, fields: ${personCategories().map(category => category.id).join(', ')} (separated by ;). "role: main" for the main person, "role: side" for others (they only add points, with the fields marked for side people), "role: background" for people who do not count; "view: partly; seen: only an arm" for someone partly in view. Moments are separated by ;. Poses: ${listSetting(settings().poseList || DEFAULT_POSES).slice(0, 12).join(', ')}…`);
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
    const cards = groupDescribed(entry) ? [...new Set(cardUnits([entry]).flatMap(cardFacets))] : cardFacets(entry);
    return [...cards, ...(entryAnimated(entry) ? ['file:animated'] : []), ...(entry.attention ? ['check:needs a look'] : []), ...(isMulti(entry) && entry.variants.some(item => item.deduced?.length) ? ['check:deduced'] : [])];
}

const COUNT_WORDS = { one: 1, a: 1, an: 1, single: 1, lone: 1, solo: 1, two: 2, both: 2, pair: 2, couple: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function headCount(text) {
    const head = String(text || '').replace(/^\s*visual\s*:\s*/i, '').slice(0, 160).toLowerCase().replace(/^(?:a|an)\s+(?:single|lone)\s+/, 'one ');
    const match = head.match(/^(?:there (?:are|is) )?(\d+|one|a|an|single|lone|solo|two|both|pair|couple|three|four|five|six|seven|eight|nine|ten)\b(?: of)?\s+(?:people|persons?|characters?|figures?|men|women|man|woman|girls?|boys?|individuals?)\b/);
    if (!match) {
        return null;
    }
    const word = match[1];
    return /^\d+$/.test(word) ? Number(word) : COUNT_WORDS[word] ?? null;
}

function cardFacets(entry) {
    if (!entry.card) {
        return entry.description ? ['card:none'] : [];
    }
    return cachedFor(entry, 'facets', `${categoriesVersion()}|${JSON.stringify(entry.card)}`, () => readFacets(entry));
}

function readFacets(entry) {
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
    if (entry.card.rating) {
        keys.push(`rating:${entry.card.rating}`);
    }
    return [...new Set(keys)];
}

const sendState = { pending: null, busy: false };

function chatPictures() {
    const meta = ctx().chatMetadata;
    if (!meta || typeof meta !== 'object') {
        return { forced: null, packs: [] };
    }
    if (!meta.imagesearch || typeof meta.imagesearch !== 'object') {
        meta.imagesearch = {};
    }
    if (!Array.isArray(meta.imagesearch.packs)) {
        meta.imagesearch.packs = [];
    }
    if (meta.imagesearch.forced && !meta.imagesearch.forced.token) {
        meta.imagesearch.forced = null;
    }
    return meta.imagesearch;
}

function shownInChat() {
    const urls = new Set();
    for (const message of ctx().chat || []) {
        if (!message || message.is_system || !message.extra || typeof message.extra !== 'object') {
            continue;
        }
        (Array.isArray(message.extra.media) ? message.extra.media : []).forEach(item => {
            if (item?.url) {
                urls.add(item.url);
            }
        });
        if (typeof message.extra.image === 'string') {
            urls.add(message.extra.image);
        }
    }
    const ids = new Set();
    if (!urls.size) {
        return ids;
    }
    for (const entry of library.entries) {
        if (urls.has(entry.url)) {
            ids.add(entry.id);
        }
        (entry.variants || []).forEach(variant => {
            if (urls.has(variant.url)) {
                ids.add(variant.id);
            }
        });
    }
    return ids;
}

const PACK_LIMIT = 15;

function messageMark(message) {
    return message ? `${message.is_user ? 'user' : 'char'}|${message.name || ''}|${message.send_date || ''}` : '';
}

function packToken(message) {
    if (!message || message.is_user) {
        return '';
    }
    if (message.extra?.stis_pack) {
        return message.extra.stis_pack;
    }
    const info = Array.isArray(message.swipe_info) ? message.swipe_info.find(item => item?.extra?.stis_pack) : null;
    return info?.extra?.stis_pack || '';
}

function packOf(token) {
    return token ? chatPictures().packs.find(pack => pack.token === token) || null : null;
}

function keepPack(pack) {
    const record = chatPictures();
    record.packs = [...record.packs.filter(item => item.token !== pack.token), pack].slice(-PACK_LIMIT);
}

function packForRedo(type) {
    const record = chatPictures();
    const chat = ctx().chat || [];
    const last = chat[chat.length - 1];
    if (!last) {
        return null;
    }
    if (!last.is_user) {
        return packOf(packToken(last));
    }
    if (type !== 'regenerate') {
        return null;
    }
    const waiting = packOf(record.forced?.token);
    if (waiting && !Number.isInteger(waiting.reply)) {
        return waiting;
    }
    return record.packs.find(pack => pack.reply === chat.length && pack.before === messageMark(last)) || null;
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
        return next ? { entry, variant: next, fresh: true, continues: last >= 0 } : { entry, variant: entry.variants[0], fresh: false };
    }
    if (isMulti(entry)) {
        const variant = entry.variants.find(item => !shown.has(item.id));
        return variant ? { entry, variant, fresh: true } : { entry, variant: entry.variants[0], fresh: false };
    }
    return { entry, variant: null, fresh: !shown.has(entry.id) };
}

const ITEMS_PER_SET = 3;
const SEQUENCE_NEXT_POINTS = 100;

function ratingOf(view) {
    return view?.card?.rating || '';
}

function ratingAllowed(view) {
    const rating = ratingOf(view);
    const allowed = settings().sendRatings || {};
    return !rating || allowed[rating] !== false;
}

function groupAllowed(entry) {
    if (!isMulti(entry) || !groupDescribed(entry)) {
        return ratingAllowed(entry);
    }
    return entry.variants.every(variant => ratingAllowed(unitView(entry, variant)));
}

function pictureCandidates(text) {
    const shown = shownInChat();
    const words = wordsOf(text);
    const character = ctx().name2 || '';
    const units = [];
    for (const entry of library.entries.filter(item => item.description)) {
        if (groupDescribed(entry) && entry.kind === 'set') {
            const unshown = entry.variants.filter(item => !shown.has(item.id));
            (unshown.length ? unshown : entry.variants).forEach(variant => units.push({ entry, variant, fresh: unshown.length > 0 }));
        } else {
            units.push(nextPicture(entry, shown));
        }
    }
    units.forEach(choice => {
        choice.view = unitView(choice.entry, choice.variant);
        choice.key = unitKey(choice.entry, choice.variant);
    });
    const kept = units.filter(choice => ratingAllowed(choice.view));
    sendState.ratedOut = units.length - kept.length;
    units.length = 0;
    units.push(...kept);
    units.forEach(choice => {
        choice.score = scoreEntry(choice.view, words, new Set(), character);
    });
    units.sort((a, b) => b.score - a.score || (b.entry.lastUsed || b.entry.added) - (a.entry.lastUsed || a.entry.added));
    const perEntry = new Map();
    const choices = units.filter(choice => {
        const count = perEntry.get(choice.entry) || 0;
        perEntry.set(choice.entry, count + 1);
        return count < ITEMS_PER_SET;
    });
    return [...choices.filter(choice => choice.fresh), ...choices.filter(choice => !choice.fresh)];
}

function choiceLine(choice) {
    const { entry, variant } = choice;
    const view = choice.view || unitView(entry, variant);
    if (view.item) {
        const index = entry.variants.indexOf(view.item);
        const looks = view.card ? cardLine(view.card) : `Looks: ${String(view.sections.visual || view.description).replace(/\s+/g, ' ').trim().slice(0, 320)}`;
        const happening = [view.sections.action, itemStory(entry, view.item, index) ? `(${itemStory(entry, view.item, index)})` : ''].filter(Boolean).join(' ');
        const kind = entry.kind === 'sequence' ? ` (picture ${index + 1} of a ${entry.variants.length}-picture story sequence${entry.arc ? `: ${entry.arc}` : ''})` : ` (version ${index + 1} of ${entry.variants.length} of one scene)`;
        return `${looks} | Happening: ${happening.replace(/\s+/g, ' ').trim().slice(0, 420) || 'not described'}${kind}${choice.continues ? ' (the next picture of a sequence already shown in this chat)' : ''}${itemAnimated(entry, view.item) ? ' (animated)' : ''}`;
    }
    const index = variant ? Math.max(0, entry.variants.indexOf(variant)) : 0;
    const what = index > 0 && variant.diff ? variant.diff : entry.sections?.action || '';
    const kind = entry.kind === 'sequence' && isMulti(entry) ? ` (picture ${index + 1} of a ${entry.variants.length}-picture story sequence)` : '';
    const looks = entry.card ? cardLine(entry.card) : `Looks: ${String(entry.sections?.visual || shortDescription(entry)).replace(/\s+/g, ' ').trim().slice(0, 320)}`;
    return `${looks} | Happening: ${what.replace(/\s+/g, ' ').trim().slice(0, 200) || 'not described'}${kind}${choice.continues ? ' (the next picture of a sequence already shown in this chat)' : ''}${entry.animated ? ' (animated)' : ''}`;
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

const STORY_NEWEST = 3000;
const STORY_OLDER = 600;

function storyText(text, limit) {
    const clean = cleanForPrompt(text);
    if (clean.length <= limit) {
        return clean;
    }
    const head = Math.round(limit * 0.4);
    return `${clean.slice(0, head).trim()} … ${clean.slice(-(limit - head)).trim()}`;
}

function storyLines(count = 4) {
    const list = (ctx().chat || [])
        .filter(message => message && !message.is_system && typeof message.mes === 'string')
        .slice(-count);
    return list.map((message, index) => {
        const newest = index === list.length - 1;
        return `${message.name || (message.is_user ? 'User' : 'Character')}${newest ? ' (newest message, already happened)' : ''}: ${storyText(message.mes, newest ? STORY_NEWEST : STORY_OLDER)}`;
    }).join('\n');
}

function judgedNotes() {
    const plan = castPlan();
    const allowed = new Set([plan.main, ...plan.extras].filter(Boolean).map(member => member.name.toLowerCase()));
    return appearanceNotes().filter(line => [...allowed].some(name => line.toLowerCase().startsWith(`${name} (`)));
}

function castLooks() {
    return [...lastCast.map(member => `${member.name} (look sheet): ${judgeWho(member)}`), ...judgedNotes()];
}

function pickContext(message) {
    const c = ctx();
    const user = c.name1 || 'The user';
    const looks = castLooks();
    const cut = sceneCut(message);
    const wish = String(pickOptions.wish || '').trim();
    const banned = ruledOut([message, wish].filter(Boolean).join('\n'));
    const story = cut ? `(The newest message starts a new scene with "${cut}": what happened before does not count.)` : storyLines() || '(start of the story)';
    const plan = castPlan();
    const everyone = [...sceneMembers(), personaMember()].filter(Boolean);
    const left = everyone.filter(member => member !== plan.main && !plan.extras.includes(member) && member.key !== plan.main?.key && !plan.extras.some(extra => extra.key === member.key)).map(member => member.name);
    const focus = plan.main ? `\nThe picture must show ${plan.main.name}: judge looks against ${plan.main.name} first.${plan.extras.length ? ` ${plan.extras.map(member => member.name).join(', ')} may also be in it, but does not have to be.` : ''}` : '';
    const ignoreUser = focus + (left.length ? `\n${left.join(', ')} ${left.length > 1 ? 'are' : 'is'} not part of this check: never judge a picture by whether ${left.join(' or ')} ${left.length > 1 ? 'are' : 'is'} in it or how they look, and do not mention them in your reasons.` : '');
    const rules = (banned.length ? `\nThe newest message rules out: ${banned.map(item => item.phrase).join('; ')}. Any picture showing that is wrong: rank it last.` : '') + (wish ? `\n${user} also says what the picture should be about (below): for the action, it counts as much as the newest message.` : '') + ignoreUser;
    return `A roleplay continues. ${user} just wrote the newest message below, and the reply to it will come with one saved picture. Choose that picture.\nJudge in this order:\n1. Looks: the people in the picture must look like the characters in the scene: gender, species, age, build, skin and hair colour. How the hair is styled or how long it is does not matter, and neither do clothes. A picture of someone who looks different is wrong, even if the action fits.\n2. Action: the picture must show what the newest message says happens, or its direct result (if someone gets pushed, a picture of them falling fits better than one of them standing). Read it carefully: if it says something does not happen, a picture showing it is wrong.\nWhere it happens (the place or the background) does not matter.${rules}\n\nHow the characters look:\n${looks.join('\n') || '(only what the story says)'}\n\nStory so far:\n${story}\n\nNewest message from ${user}:\n${message || '(no new message: the story simply continues)'}${wish ? `\n\nWhat ${user} wants the picture to be about:\n${wish}` : ''}`;
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
    const result = await modelRequest(service, s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), 120 + 40 * shortlist.length, { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.2));
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

function forceInstruction(choice, lead = '') {
    const c = ctx();
    const described = describedVariant(choice.entry, choice.variant);
    return fillTemplate(promptPart('forcePrompt'), {
        picture: described.text || tagsLine(choice.entry.tags),
        lead: String(lead || '').trim(),
        continues: continuesText(choice),
        marker: settings().inlinePictures !== false ? 'yes' : '',
        user: c.name1 || 'the user',
        char: c.name2 || 'the character',
    }).trim();
}

function setForcePrompt(text) {
    ctx().setExtensionPrompt?.(PROMPT_KEY, text, 1, 0, false, 0);
}

function clearForcePrompt() {
    ctx().setExtensionPrompt?.(PROMPT_KEY, '', 1, 0, false, 0);
}

function newPackToken() {
    return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function forcePicture(choice, send = {}) {
    const text = forceInstruction(choice, send.lead);
    sendState.pending = { token: newPackToken(), pic: choiceId(choice), text, lead: String(send.lead || '').trim(), wish: String(send.wish || '').trim(), typed: String(send.typed || '').trim(), options: Array.isArray(send.options) ? send.options.slice(0, 3) : [], at: Date.now() };
    setForcePrompt(text);
    const button = document.getElementById('send_but');
    if (button) {
        button.click();
    } else {
        sendState.pending = null;
        clearForcePrompt();
        toastr.warning('Could not find SillyTavern\'s send button.', 'Image Search');
    }
}

function sequencePlace(choice, shown = shownInChat()) {
    const entry = choice.entry;
    if (entry.kind !== 'sequence' || !isMulti(entry) || !choice.variant) {
        return null;
    }
    const index = entry.variants.findIndex(item => item.id === choice.variant.id);
    const before = index > 0 ? entry.variants[index - 1] : null;
    if (!before || !shown.has(before.id)) {
        return null;
    }
    return { index, count: entry.variants.length, item: entry.variants[index], before, role: roleText(entry.variants[index].role), beforeRole: roleText(before.role) };
}

function continuesText(choice) {
    const place = sequencePlace(choice);
    if (!place) {
        return '';
    }
    const entry = choice.entry;
    const before = itemStory(entry, place.before, place.index - 1) || place.before.sections?.action || place.before.diff || (place.index === 1 ? entry.sections?.action : '') || 'the moment before';
    return `it is picture ${place.index + 1} of ${place.count}${place.role ? `, the ${place.role}` : ''}; picture ${place.index}${place.beforeRole ? `, the ${place.beforeRole}` : ''}, shown before it, was: ${String(before).replace(/\s+/g, ' ').trim()}`;
}

function nextStep(choice) {
    const entry = choice.entry;
    if (entry.kind !== 'sequence' || !isMulti(entry) || !choice.variant) {
        return '';
    }
    const index = entry.variants.findIndex(item => item.id === choice.variant.id);
    const next = index >= 0 ? entry.variants[index + 1] : null;
    if (!next) {
        return '';
    }
    return `Item ${index + 2} of ${entry.variants.length}: ${itemStory(entry, next, index + 1) || next.diff || 'the next picture.'}`;
}

function leadInPrompt(choice, send = {}) {
    const c = ctx();
    const focus = castPlan().main?.name || '';
    return fillTemplate(promptPart('leadPrompt'), {
        user: c.name1 || 'The user',
        char: c.name2 || 'The character',
        focus,
        looks: castLooks().join('\n') || '(only what the story says)',
        story: storyLines(6) || '(start of the story)',
        typed: String(send.typed || '').trim(),
        wish: String(send.wish || '').trim(),
        picture: describedVariant(choice.entry, choice.variant).text || tagsLine(choice.entry.tags),
        next: nextStep(choice),
        continues: continuesText(choice),
    }).trim();
}

function readLeadIns(reply) {
    const text = String(reply || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
    const items = [];
    let current = null;
    for (const raw of text.split('\n')) {
        const line = raw.replace(/\*\*/g, '').trim();
        const match = line.match(/^(?:[-*•]\s*)?(?:option|way)?\s*#?([1-9])\s*[.):\-–—]\s*(.+)$/i);
        if (match) {
            current = { text: match[2].trim() };
            items.push(current);
        } else if (current && line && items.length <= 3) {
            current.text += ` ${line}`;
        } else if (!line) {
            current = null;
        }
    }
    let options = items.map(item => item.text.trim()).filter(Boolean);
    if (!options.length) {
        options = text.split(/\n\s*\n/).map(part => part.replace(/\s+/g, ' ').trim()).filter(part => part.length > 12);
    }
    return options.slice(0, 3);
}

async function leadInOptions(choice, send) {
    const s = settings();
    const service = ctx().ConnectionManagerRequestService;
    if (!service || !s.tagProfile) {
        throw new Error('no Tag model is set in the settings');
    }
    const prompt = leadInPrompt(choice, send);
    const result = await modelRequest(service, s.tagProfile, service.constructPrompt([{ role: 'user', content: prompt }], s.tagProfile), 600, { stream: false, extractData: true, includePreset: false, includeInstruct: true }, samplers(0.8));
    const options = readLeadIns(typeof result === 'string' ? result : result?.content || '');
    if (!options.length) {
        throw new Error('the answer had no options');
    }
    return options;
}

function askLeadIn(choice, send) {
    const c = ctx();
    return new Promise(resolve => {
        let answer = null;
        let options = [];
        let picked = 0;
        let asking = false;
        const root = el('div', 'stis-leadin');
        const head = el('div', 'stis-leadin-head');
        const thumb = el('img', 'stis-leadin-img');
        thumb.alt = '';
        showThumb(thumb, (choice.variant || choice.entry).url);
        head.append(thumb, el('b', '', 'How the story gets there'));
        const status = el('small', 'stis-leadin-status');
        const list = el('div', 'stis-leadin-list');
        const ownRow = el('label', 'stis-leadin-option stis-leadin-own');
        const ownPick = el('input');
        ownPick.type = 'radio';
        ownPick.name = 'stis_leadin_pick';
        const own = el('textarea', 'text_pole');
        own.rows = 2;
        own.placeholder = 'Or write your own';
        ownRow.append(ownPick, own);
        const bar = el('div', 'stis-sendcard-bar');
        const go = el('div', 'menu_button stis-use', 'Send');
        const again = el('div', 'menu_button', 'New options');
        const plain = el('div', 'menu_button', 'Without');
        plain.title = 'Send the picture without a way in';
        const cancel = el('div', 'menu_button', 'Cancel');
        bar.append(go, again, plain, cancel);
        root.append(head, status, list, ownRow, bar);
        const popup = new c.Popup(root, c.POPUP_TYPE.DISPLAY, '', { animation: 'fast', allowVerticalScrolling: true, onClose: () => resolve(answer) });
        const rows = () => [...list.querySelectorAll('.stis-leadin-option')];
        const mark = () => {
            rows().forEach((row, index) => {
                row.querySelector('input').checked = index === picked;
            });
            ownPick.checked = picked === -1;
        };
        const draw = () => {
            list.textContent = '';
            options.forEach((option, index) => {
                const row = el('label', 'stis-leadin-option');
                const pick = el('input');
                pick.type = 'radio';
                pick.name = 'stis_leadin_pick';
                const area = el('textarea', 'text_pole');
                area.rows = 3;
                area.value = option;
                const choose = () => {
                    picked = index;
                    mark();
                };
                pick.addEventListener('change', choose);
                area.addEventListener('focus', choose);
                area.addEventListener('input', () => {
                    options[index] = area.value;
                });
                row.append(pick, area);
                list.appendChild(row);
            });
            if (picked >= options.length) {
                picked = options.length ? 0 : -1;
            }
            mark();
        };
        const ask = async () => {
            if (asking) {
                return;
            }
            asking = true;
            again.classList.add('stis-disabled');
            status.textContent = options.length ? 'Writing new options…' : 'Writing 3 ways to get there…';
            try {
                options = await leadInOptions(choice, send);
                picked = picked === -1 && own.value.trim() ? -1 : 0;
                status.textContent = 'Pick one, edit it if you like, or write your own.';
            } catch (error) {
                console.warn('[Image Search] lead-in options failed', error);
                status.textContent = `Could not write the options (${String(error?.message || error).slice(0, 140)}). Write your own, or send without.`;
                if (!options.length) {
                    picked = -1;
                }
            } finally {
                asking = false;
                again.classList.remove('stis-disabled');
            }
            draw();
        };
        ownPick.addEventListener('change', () => {
            picked = -1;
            mark();
        });
        own.addEventListener('focus', () => {
            picked = -1;
            mark();
        });
        go.addEventListener('click', async () => {
            const lead = picked === -1 ? own.value.trim() : String(options[picked] || '').trim();
            if (!lead) {
                status.textContent = picked === -1 ? 'Write your way first, pick one above, or send without.' : 'This one is empty: write something, pick another, or send without.';
                return;
            }
            answer = { lead, options: options.slice(0, 3) };
            await popup.completeCancelled();
        });
        again.addEventListener('click', ask);
        plain.addEventListener('click', async () => {
            answer = { lead: '', options: options.slice(0, 3) };
            await popup.completeCancelled();
        });
        cancel.addEventListener('click', () => popup.completeCancelled());
        popup.show();
        ask();
    });
}

async function bringIn(choice, send = {}) {
    if (!send.mix) {
        forcePicture(choice, send);
        return;
    }
    const answer = await askLeadIn(choice, send);
    if (answer) {
        forcePicture(choice, { ...send, lead: answer.lead, options: answer.options });
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
    const seq = el('div', 'stis-sendcard-seq');
    const score = el('small', 'stis-sendcard-score');
    score.title = 'Tap to see how this picture was ranked';
    const looksBox = el('div', 'stis-sendcard-looks');
    let showLooks = false;
    score.addEventListener('click', () => {
        showLooks = !showLooks;
        draw();
    });
    const browseBox = el('div', 'stis-sendcard-browse');
    browseBox.hidden = true;
    const grid = el('div', 'stis-sendcard-grid');
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
    root.append(note, img, seq, why, text, score, looksBox, sheets, browseBox, fix, bar);
    const shownNow = shownInChat();
    let media = null;
    const popup = new c.Popup(root, c.POPUP_TYPE.DISPLAY, '', {
        animation: 'fast',
        allowVerticalScrolling: true,
        onClose: () => {
            media?.close();
            img.removeAttribute('src');
            grid.querySelectorAll('img').forEach(cellImg => cellImg.removeAttribute('src'));
            releaseMedia(root);
            if (!state.pickerOpen) {
                dropThumbJobs();
            }
        },
    });
    const draw = () => {
        const choice = options[index];
        img.src = (choice.variant || choice.entry).url;
        const step = sequencePlace(choice, shownNow);
        seq.hidden = !step;
        seq.textContent = step ? `Next of a sequence already shown in this chat: picture ${step.index + 1} of ${step.count}${step.role ? ` · ${step.role}` : ''}` : '';
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
        await bringIn(choice, session.send || {});
    });
    another.addEventListener('click', () => {
        if (index < options.length - 1) {
            index++;
            draw();
        }
    });
    const filter = { words: '', kind: 'all', moving: false, aiOnly: false, facets: new Set() };
    const facetsOf = choice => (choice.variant?.card ? [...cardFacets(choice.variant), ...(itemAnimated(choice.entry, choice.variant) ? ['file:animated'] : [])] : entryFacets(choice.entry));
    const movesOf = choice => (choice.variant ? itemAnimated(choice.entry, choice.variant) : entryAnimated(choice.entry));
    const kindOfChoice = choice => (isMulti(choice.entry) ? choice.entry.kind : 'single');
    const hayOf = choice => {
        const { entry, variant } = choice;
        const card = (variant?.card || entry.card) ? cardToText(variant?.card || entry.card) : '';
        return `${entry.tags.join(' ')} ${entry.description} ${variant ? `${variant.description || ''} ${variant.diff || ''}` : ''} ${entry.characters.join(' ')} ${card}`.toLowerCase().replace(/_/g, ' ');
    };
    const find = el('input', 'text_pole stis-sendcard-find');
    find.type = 'search';
    find.placeholder = 'search these pictures';
    const chips = el('div', 'stis-sendcard-chips');
    const facetBox = el('details', 'stis-lib-more stis-sendcard-facets');
    const shown = el('small', 'stis-sendcard-count');
    browseBox.append(find, chips, facetBox, shown, grid);
    const chip = (label, on, title, click) => {
        const item = el('span', 'stis-fchip', label);
        item.classList.toggle('stis-fchip-on', on);
        if (title) {
            item.title = title;
        }
        item.addEventListener('click', click);
        return item;
    };
    const drawChips = () => {
        chips.innerHTML = '';
        for (const [key, label] of [['all', 'All'], ['single', 'Singles'], ['set', 'Sets'], ['sequence', 'Sequences']]) {
            chips.appendChild(chip(label, filter.kind === key, '', () => {
                filter.kind = key;
                drawGrid();
            }));
        }
        chips.appendChild(chip('Animated', filter.moving, 'Only GIFs and video parts', () => {
            filter.moving = !filter.moving;
            drawGrid();
        }));
        if (aiOrder.size) {
            chips.appendChild(chip(`AI's picks ${aiOrder.size}`, filter.aiOnly, 'Only the pictures the AI ranked', () => {
                filter.aiOnly = !filter.aiOnly;
                drawGrid();
            }));
        }
        const clear = chip('Clear all', false, 'Show every picture again', () => {
            filter.words = '';
            find.value = '';
            filter.kind = 'all';
            filter.moving = false;
            filter.aiOnly = false;
            filter.facets.clear();
            drawGrid();
        });
        clear.hidden = !filter.words && filter.kind === 'all' && !filter.moving && !filter.aiOnly && !filter.facets.size;
        chips.appendChild(clear);
    };
    const drawFacets = () => {
        const wasOpen = facetBox.open;
        facetBox.innerHTML = '';
        const counts = new Map();
        options.forEach(choice => facetsOf(choice).forEach(key => counts.set(key, (counts.get(key) || 0) + 1)));
        facetBox.appendChild(el('summary', '', filter.facets.size ? `Filters (${filter.facets.size} on)` : 'Filters: who, pose, mood'));
        const groups = [['pose', 'Pose'], ['mood', 'Mood'], ...categories().map(category => [category.id, category.label])];
        for (const [group, label] of groups) {
            const keys = [...counts.keys()].filter(key => key.startsWith(`${group}:`)).sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
            if (!keys.length) {
                continue;
            }
            const row = el('div', 'stis-lib-filter-row');
            row.appendChild(el('small', 'stis-lib-filter-label', label));
            for (const key of keys) {
                row.appendChild(chip(`${key.slice(group.length + 1)} ${counts.get(key)}`, filter.facets.has(key), '', () => {
                    filter.facets[filter.facets.has(key) ? 'delete' : 'add'](key);
                    drawGrid();
                }));
            }
            facetBox.appendChild(row);
        }
        facetBox.hidden = facetBox.childElementCount < 2;
        facetBox.open = wasOpen;
    };
    const drawGrid = () => {
        drawChips();
        drawFacets();
        media?.close();
        grid.querySelectorAll('img').forEach(cellImg => cellImg.removeAttribute('src'));
        grid.innerHTML = '';
        media = gridMedia(grid, settings().libAnimate !== false);
        const words = [...wordsOf(filter.words)];
        const list = options.filter(choice => (filter.kind === 'all' || kindOfChoice(choice) === filter.kind)
            && (!filter.moving || movesOf(choice))
            && (!filter.aiOnly || aiOrder.has(choice))
            && (!filter.facets.size || [...filter.facets].every(key => facetsOf(choice).includes(key)))
            && (!words.length || words.every(word => hayOf(choice).includes(word))));
        shown.textContent = list.length === options.length ? `${options.length} pictures, in the order of this send` : `${list.length} of ${options.length} pictures`;
        if (!list.length) {
            grid.appendChild(el('div', 'stis-status', 'Nothing matches. Clear all shows every picture.'));
            return;
        }
        for (const choice of list) {
            const position = options.indexOf(choice);
            const cell = el('div', 'stis-sendcard-cell');
            cell.classList.toggle('stis-sendcard-current', position === index);
            const thumb = el('img');
            thumb.alt = '';
            thumb.draggable = false;
            thumb.dataset.full = (choice.variant || choice.entry).url;
            cell.title = shortDescription(choice.entry);
            cell.append(thumb, el('span', 'stis-sendcard-num', String(position + 1)));
            const moves = movesOf(choice);
            media.add(thumb, moves);
            if (moves && !media.animates) {
                const moving = el('span', 'stis-anim-badge');
                moving.appendChild(el('i', 'fa-solid fa-play'));
                cell.appendChild(moving);
            }
            cell.addEventListener('click', () => {
                index = position;
                browseBox.hidden = true;
                media?.close();
                draw();
            });
            grid.appendChild(cell);
        }
    };
    let findTimer = null;
    find.addEventListener('input', () => {
        clearTimeout(findTimer);
        findTimer = setTimeout(() => {
            filter.words = find.value;
            drawGrid();
        }, 250);
    });
    browse.addEventListener('click', () => {
        browseBox.hidden = !browseBox.hidden;
        if (browseBox.hidden) {
            media?.close();
            return;
        }
        drawGrid();
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
    return { focus: s.pickFocus === 'user' ? 'user' : 'char', main: String(s.pickMain || ''), allowOther: typeof s.pickAllowOther === 'boolean' ? s.pickAllowOther : s.pickWithUser !== false, wish: '', mix: s.pickMix !== false };
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
        const wishLabel = el('div', 'stis-label', 'What should the picture be about? (optional)');
        const wish = el('textarea', 'text_pole stis-sendopts-wish');
        wish.id = 'stis_sendopts_wish';
        wish.rows = 2;
        wish.placeholder = 'He finally gives in and laughs';
        const wishHelp = el('small', 'stis-sendopts-hint', 'Helps choose the picture, together with what is in the chat box, and goes to the ways in.');
        const mixLabel = el('label', 'checkbox_label');
        const mix = el('input');
        mix.type = 'checkbox';
        mix.id = 'stis_sendopts_mix';
        mix.checked = stored.mix;
        mixLabel.append(mix, el('span', '', ' Suggest 3 ways to bring it in'));
        const bar = el('div', 'stis-sendcard-bar');
        const go = el('div', 'menu_button stis-use', 'Choose picture');
        const cancel = el('div', 'menu_button', 'Cancel');
        bar.append(go, cancel);
        root.append(row, label, hint, wishLabel, wish, wishHelp, mixLabel, bar);
        const popup = new c.Popup(root, c.POPUP_TYPE.DISPLAY, '', { animation: 'fast', onClose: () => resolve(answer) });
        go.addEventListener('click', async () => {
            answer = { focus: focus.value === 'user' ? 'user' : 'char', main: focus.value === 'user' ? stored.main : focus.value.slice(5), allowOther: box.checked, wish: wish.value.trim(), mix: mix.checked };
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
            toastr.info(sendState.ratedOut ? `All ${sendState.ratedOut} described pictures are left out by "Ratings it may send" in the settings.` : 'The library has no described pictures yet. Save some from the picker first.', 'Image Search');
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
    const send = { typed: message, wish: choices.wish || '', mix: Boolean(choices.mix) };
    if (s.confirmPicture || noneFits) {
        showPictureCard({ message, cast, timing, options, noneFits, reasons, noneWhy, picked: aiPicked, shortlist, ranks, send });
    } else {
        await bringIn(options[0], send);
    }
}

function attachPicture(message, entry, variant, note = 'shown in the story', line = null) {
    if (!message.extra || typeof message.extra !== 'object') {
        message.extra = {};
    }
    if (!Array.isArray(message.extra.media)) {
        message.extra.media = [];
    }
    const url = variant?.url || entry.url;
    let media = message.extra.media.find(item => item.url === url);
    if (!media) {
        media = { type: 'image', url, title: pictureNote(describedVariant(entry, variant), note), append_title: true, source: 'upload' };
        message.extra.media.push(media);
    }
    if (Number.isInteger(line)) {
        media.stis_line = line;
    }
    noteUse(entry, message.name || ctx().name2 || '');
}

const PICTURE_MARK = /\[\s*picture\s*\]/gi;

function hasWords(text) {
    return /[^\s*_~>]/.test(String(text || ''));
}

function cutMarks(text, pattern) {
    const kept = [];
    const found = [];
    for (const line of String(text || '').split('\n')) {
        const hits = [...line.matchAll(pattern)];
        if (!hits.length) {
            kept.push(line);
            continue;
        }
        const place = kept.filter(hasWords).length + (hasWords(line.slice(0, hits[0].index)) ? 1 : 0);
        hits.forEach(hit => found.push({ hit, line: place }));
        const rest = line.replace(pattern, '').replace(/[ \t]{2,}/g, ' ').trimEnd();
        if (hasWords(rest)) {
            kept.push(rest);
        }
    }
    return { text: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(), found };
}

const LINE_BLOCKS = new Set(['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'DT', 'DD', 'TR']);
const SKIP_BLOCKS = new Set(['HR', 'TEXTAREA', 'SCRIPT', 'STYLE']);

function textSpots(root) {
    const spots = [];
    const walk = node => {
        for (const child of node.children) {
            if (child.classList.contains('stis-inline') || SKIP_BLOCKS.has(child.tagName)) {
                continue;
            }
            if (child.tagName === 'BR') {
                spots.push(child);
                continue;
            }
            if (child.tagName !== 'PRE') {
                walk(child);
            }
            if (LINE_BLOCKS.has(child.tagName) && !endsWithBreak(child)) {
                spots.push(child);
            }
        }
    };
    walk(root);
    return spots;
}

function endsWithBreak(node) {
    for (let child = node.lastChild; child; child = child.previousSibling) {
        if (child.nodeType === 3 && !child.textContent.trim()) {
            continue;
        }
        return child.nodeType === 1 && child.tagName === 'BR';
    }
    return false;
}

function placeInline(block) {
    if (!block?.querySelector) {
        return;
    }
    const message = (ctx().chat || [])[Number(block.getAttribute('mesid'))];
    const media = Array.isArray(message?.extra?.media) ? message.extra.media : [];
    const text = block.querySelector('.mes_text');
    const wrapper = block.querySelector('.mes_media_wrapper');
    if (!text || !wrapper || (!media.some(item => Number.isInteger(item?.stis_line)) && !text.querySelector('.stis-inline'))) {
        return;
    }
    const off = settings().inlinePictures === false || Boolean(text.querySelector('textarea')) || block.getAttribute('data-media-display') === 'gallery';
    const sources = [...wrapper.children].filter(node => node.classList.contains('mes_img_container'));
    const wanted = off ? [] : sources.map(node => ({ node, index: Number(node.getAttribute('data-index')) })).filter(item => Number.isInteger(media[item.index]?.stis_line));
    const copies = [...text.querySelectorAll('.stis-inline')];
    const settled = wanted.every(item => item.node.classList.contains('stis-inline-src') && copies.some(copy => copy.getAttribute('data-index') === String(item.index))) && copies.length === wanted.length && sources.every(node => wanted.some(item => item.node === node) || !node.classList.contains('stis-inline-src'));
    if (settled) {
        return;
    }
    copies.forEach(copy => copy.remove());
    sources.forEach(node => node.classList.toggle('stis-inline-src', wanted.some(item => item.node === node)));
    if (!wanted.length) {
        return;
    }
    const spots = textSpots(text);
    const after = new Map();
    wanted.sort((a, b) => media[a.index].stis_line - media[b.index].stis_line || a.index - b.index).forEach(({ node, index }) => {
        const copy = node.cloneNode(true);
        copy.classList.remove('stis-inline-src');
        copy.classList.add('stis-inline');
        const line = Math.max(0, media[index].stis_line);
        const spot = line === 0 ? null : spots[Math.min(line, spots.length) - 1] || null;
        const anchor = after.get(line) || spot;
        if (anchor) {
            anchor.after(copy);
        } else if (line === 0) {
            text.prepend(copy);
        } else {
            text.appendChild(copy);
        }
        after.set(line, copy);
    });
}

let inlineWatch = null;

function watchInline() {
    const chat = document.getElementById('chat');
    if (!chat || inlineWatch || typeof MutationObserver === 'undefined') {
        return;
    }
    inlineWatch = new MutationObserver(records => {
        const blocks = new Set();
        for (const record of records) {
            const target = record.target;
            if (target === chat) {
                record.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('mes')) {
                        blocks.add(node);
                    }
                });
                continue;
            }
            const block = target.nodeType === 1 ? target.closest('.mes') : target.parentElement?.closest('.mes');
            if (block) {
                blocks.add(block);
            }
        }
        blocks.forEach(placeInline);
    });
    inlineWatch.observe(chat, { childList: true, subtree: true });
}

function placeAllInline() {
    document.querySelectorAll('#chat .mes').forEach(placeInline);
}

function armPack(pack) {
    const record = chatPictures();
    record.forced = { token: pack.token, armed: true, at: Date.now() };
    setForcePrompt(pack.text || '');
}

function onGenerationStarted(type, _options, dryRun) {
    if (dryRun || type === 'quiet' || type === 'impersonate') {
        return;
    }
    const record = chatPictures();
    if (sendState.pending && Date.now() - (sendState.pending.at || 0) > 15000) {
        sendState.pending = null;
    }
    if (sendState.pending) {
        const pack = { ...sendState.pending, reply: null, before: '' };
        sendState.pending = null;
        keepPack(pack);
        armPack(pack);
        return;
    }
    if (type === 'swipe' || type === 'regenerate') {
        const pack = packForRedo(type);
        if (pack?.text) {
            armPack(pack);
            return;
        }
    }
    const waiting = record.forced?.armed ? packOf(record.forced.token) : null;
    if (waiting && !Number.isInteger(waiting.reply) && ctx().groupId && Date.now() - (record.forced.at || 0) < 60000) {
        return;
    }
    record.forced = type === 'continue' && record.forced ? { ...record.forced, armed: false } : null;
    clearForcePrompt();
}

async function onForcedReply(messageId, type) {
    const c = ctx();
    const record = chatPictures();
    if (!record.forced?.armed) {
        return;
    }
    const pack = packOf(record.forced.token);
    record.forced.armed = false;
    clearForcePrompt();
    const id = Number(messageId);
    const message = c.chat[id];
    if (!pack || !message || message.is_user || message.is_system) {
        return;
    }
    await loadLibrary();
    const found = resolvePic(pack.pic);
    if (!found) {
        return;
    }
    pack.reply = id;
    pack.before = messageMark(c.chat[id - 1]);
    if (!message.extra || typeof message.extra !== 'object') {
        message.extra = {};
    }
    message.extra.stis_pack = pack.token;
    const cut = typeof message.mes === 'string' ? cutMarks(message.mes, PICTURE_MARK) : { text: '', found: [] };
    if (cut.found.length) {
        setMessageText(message, cut.text);
    }
    attachPicture(message, found.entry, found.variant, 'shown in the story', cut.found[0]?.line ?? null);
    saveLibrary();
    syncCurrentSwipe(message);
    if (document.querySelector(`#chat .mes[mesid="${id}"]`)) {
        c.updateMessageBlock(id, message);
    }
    if (!savedAfterReply(type)) {
        await c.saveChat();
    }
}

const SAVED_AFTER = new Set(['normal', 'swipe', 'regenerate', 'continue', 'append', 'appendFinal']);

function savedAfterReply(type) {
    return type === undefined || SAVED_AFTER.has(type);
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

async function onAiPictures(messageId, type) {
    const s = settings();
    const c = ctx();
    const id = Number(messageId);
    const message = c.chat[id];
    if (!s.enabled || !message || message.is_user || message.is_system || typeof message.mes !== 'string' || !/\[pic:|\[\s*picture\s*\]/i.test(message.mes)) {
        return;
    }
    await loadLibrary();
    const cut = cutMarks(cutMarks(message.mes, PICTURE_MARK).text, PIC_TAG);
    setMessageText(message, cut.text);
    const lines = new Map();
    cut.found.forEach(({ hit, line }) => {
        const pid = hit[1].toLowerCase();
        if (!lines.has(pid)) {
            lines.set(pid, line);
        }
    });
    const pictures = [...lines.keys()].map(pid => ({ pid, found: resolvePic(pid) })).filter(item => item.found).slice(0, 2);
    if (pictures.length) {
        for (const { pid, found } of pictures) {
            attachPicture(message, found.entry, found.variant, 'shown in the story', lines.get(pid));
        }
        saveLibrary();
    }
    syncCurrentSwipe(message);
    if (document.querySelector(`#chat .mes[mesid="${id}"]`)) {
        c.updateMessageBlock(id, message);
    }
    if (!savedAfterReply(type)) {
        await c.saveChat();
    }
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
    const cut = cutMarks(message.mes, LOCAL_IMAGE_MD);
    const found = cut.found.map(item => item.hit);
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
    for (const [position, match] of found.entries()) {
        const url = match[2];
        let media = message.extra.media.find(item => item.url === url);
        if (!media) {
            media = { type: 'image', url, title: match[1], source: 'upload', stis_line: cut.found[position].line };
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
    message.mes = cut.text;
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
    const sources = throughFirefox(item.thumb)
        ? [() => firefoxImageUrl(item.thumb), fresh ? freshUrl(item.thumb) : item.thumb, site, fetcherLink(item.thumb)].filter(Boolean)
        : [fresh ? freshUrl(item.thumb) : item.thumb, site, fetcherLink(item.thumb), server, site && !identified ? proxyUrl(site) : ''].filter(Boolean);
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
    if (throughFirefox(item.img || item.thumb)) {
        const quick = firefox.ready.get(item.anim || item.img) || firefox.ready.get(item.thumb);
        if (quick) {
            img.src = quick;
        }
        cycleSources(img, [...new Set([() => firefoxImageUrl(item.anim || item.img), item.anim ? () => firefoxImageUrl(item.img) : '', () => firefoxImageUrl(item.thumb), item.anim, item.img].filter(Boolean))]);
        return;
    }
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
    if (!entries.length && !pixivOn()) {
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
        libBar: el('div', 'stis-lib-bar'),
        libOrder: el('div', 'stis-lib-order'),
        libSize: el('div', 'menu_button stis-lib-size'),
        libClear: el('div', 'menu_button stis-lib-clear', 'Clear all'),
        selectToggle: el('div', 'menu_button stis-tab stis-select-btn'),
        sites: el('div', 'stis-sites'),
        pixivBar: el('div', 'stis-pixiv-bar'),
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
    ui.libClear.title = 'Remove the search and every filter, and show the whole library';
    ui.libBar.append(ui.libOrder, ui.libClear, ui.libSize);
    ui.libraryView.append(ui.libSearch, ui.libBar, ui.libFilters, ui.libGrid);
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
    if (pixivOn()) {
        const option = el('option', '', 'Pixiv');
        option.value = PIXIV;
        ui.site.appendChild(option);
    }
    ui.site.value = s.lastSite === PIXIV && pixivOn() ? PIXIV : activeDomain() || (pixivOn() ? PIXIV : '');
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
    ui.root.append(ui.tabs, ui.who, ui.top, ui.complete, ui.sites, ui.pixivBar, ui.favs, ui.chipMenu, ui.lookBar, ui.status, ui.debug, ui.blocked, ui.check, ui.grid, ui.libraryView, ui.selectBar, ui.preview);
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
            if (DONMAI.test(trouble.host) && !canSetAgent()) {
                row.appendChild(el('small', 'stis-help', 'This browser does not let SillyTavern tell Danbooru whose program it is (Chrome and browsers built on it refuse), so Danbooru blocks its pictures here. Open SillyTavern in Firefox for Danbooru.'));
            } else if (DONMAI.test(trouble.host) && !danbooruIdentity.id) {
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
    let libMedia = null;
    const libFilter = new Set();
    let libMoreOpen = false;
    let reps = [];
    let gridFamilies = new Map();
    const lengthCells = new WeakMap();
    const lengthWatch = typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting && lengthCells.has(entry.target)) {
                const ask = lengthCells.get(entry.target);
                lengthCells.delete(entry.target);
                lengthWatch.unobserve(entry.target);
                ask();
            }
        }), { rootMargin: '200px' })
        : { observe: cell => lengthCells.get(cell)?.(), unobserve() {}, disconnect() {} };
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

    function renderPixivBar() {
        ui.pixivBar.innerHTML = '';
        ui.pixivBar.hidden = ui.site.value !== PIXIV || !ui.libraryView.hidden;
        if (ui.pixivBar.hidden) {
            return;
        }
        const p = pixivSettings();
        const group = (label, key, choices) => {
            const row = el('span', 'stis-pixiv-group');
            row.appendChild(el('small', 'stis-lib-filter-label', label));
            for (const [value, text, title] of choices) {
                const chip = el('span', 'stis-fchip', text);
                chip.classList.toggle('stis-fchip-on', (p[key] ?? choices[0][0]) === value);
                if (title) {
                    chip.title = title;
                }
                chip.addEventListener('click', () => {
                    p[key] = value;
                    save();
                    renderPixivBar();
                    runSearch();
                });
                row.appendChild(chip);
            }
            ui.pixivBar.appendChild(row);
        };
        group('Kind', 'kind', [['all', 'All'], ['illust', 'Illustrations'], ['manga', 'Manga'], ['ugoira', 'Animated', 'Pixiv animations, saved as GIFs']]);
        group('Order', 'order', [['date_d', 'Newest'], ['date', 'Oldest']]);
        group('Match', 'match', [['s_tag', 'Part of a tag'], ['s_tag_full', 'Whole tag'], ['s_tc', 'Title and caption']]);
        group('AI', 'hideAi', [[false, 'Show'], [true, 'Hide', 'Leave out works marked as AI-generated']]);
        const shortcuts = el('span', 'stis-pixiv-group');
        shortcuts.appendChild(el('small', 'stis-lib-filter-label', 'Yours'));
        for (const [word, text, title] of [['pixiv:bookmarks', 'Bookmarks', 'Your public Pixiv bookmarks'], ['pixiv:following', 'Following', 'New works of the artists you follow']]) {
            const chip = el('span', 'stis-fchip', text);
            chip.title = title;
            chip.classList.toggle('stis-fchip-on', tags.length === 1 && tags[0] === word);
            chip.addEventListener('click', () => {
                setTags([word], true, [word]);
                tagsChanged();
                renderPixivBar();
            });
            shortcuts.appendChild(chip);
        }
        ui.pixivBar.appendChild(shortcuts);
        ui.pixivBar.appendChild(el('small', 'stis-help', 'Paste a Pixiv link (a work or an artist) as a tag to open it. Every search here is one request to Pixiv, so nothing is fetched until you ask.'));
    }

    function renderSites() {
        renderPixivBar();
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
            (browse.siteNotes || []).forEach(note => line('Site word:', note));
            [browse.skipped || []].flat().filter(Boolean).forEach(note => line('No site word:', note));
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

    let animOnly = false;
    const hiddenAnim = family => family.members.filter(member => member !== family.rep && animatedItem(member) && !animatedItem(family.rep));
    const groupPending = family => !family.loaded && family.members.some(mayHaveFamily) && supportsFamily(family.rep);
    const lengthLimits = () => ({ min: Math.max(0, Number(s.videoMin) || 0), max: Math.max(0, Number(s.videoMax) || 0) });
    const videoFits = item => {
        if (!item?.video) {
            return true;
        }
        const { min, max } = lengthLimits();
        if (!min && !max) {
            return true;
        }
        const seconds = videoLength(item);
        if (!seconds) {
            return videoLengths.has(item.video) || needsVideoCopy(item.video) ? true : null;
        }
        return seconds >= min && (!max || seconds <= max);
    };
    const showFamilyCell = family => {
        if (!family.cell) {
            return;
        }
        const fits = videoFits(family.rep);
        const animated = family.members.some(member => animatedItem(member) && videoFits(member) !== false);
        const pending = groupPending(family);
        const waitAnim = animOnly && !animated && pending;
        family.cell.hidden = fits === false || (animOnly && !animated && !pending);
        family.cell.classList.toggle('stis-cell-checking', !family.cell.hidden && (waitAnim || fits === null));
    };
    const lengthBox = el('span', 'stis-length-filter');
    const lengthInput = (key, label) => {
        const input = el('input', 'text_pole stis-length-input');
        Object.assign(input, { type: 'number', min: '0', step: '1', placeholder: 'any', inputMode: 'numeric' });
        input.value = Number(s[key]) > 0 ? String(s[key]) : '';
        input.title = label;
        input.addEventListener('change', () => {
            s[key] = Math.max(0, Math.round(Number(input.value) || 0));
            input.value = s[key] ? String(s[key]) : '';
            save();
            gridFamilies.forEach(showFamilyCell);
            updateAnimChip();
        });
        return input;
    };
    lengthBox.append(el('i', 'fa-solid fa-film'), el('span', '', ' Videos'), lengthInput('videoMin', 'Hide videos shorter than this many seconds (empty: no limit)'), el('span', '', 'to'), lengthInput('videoMax', 'Hide videos longer than this many seconds (empty: no limit)'), el('span', '', 's'));
    lengthBox.title = 'Only show videos whose length is in this range, in seconds; videos whose length is not known yet stay dimmed until it is';
    const familyBadge = family => {
        const pages = family.loaded ? 0 : Number(family.rep.pageCount) || 0;
        const count = Math.max(family.members.length, pages);
        const more = !pages && (groupPending(family) || (family.members.some(mayHaveFamily) && !family.loaded));
        const inside = hiddenAnim(family);
        family.badge.innerHTML = '';
        family.badge.hidden = count < 2 && !more;
        family.badge.classList.toggle('stis-set-badge-anim', inside.length > 0);
        if (!family.badge.hidden) {
            family.badge.appendChild(el('i', 'fa-solid fa-clone'));
            family.badge.appendChild(document.createTextNode(` ${count}${more ? '+' : ''}`));
            if (inside.length) {
                family.badge.appendChild(document.createTextNode(' '));
                family.badge.appendChild(el('i', 'fa-solid fa-play'));
            }
        }
        family.badge.title = inside.length ? `This group has ${inside.length === 1 ? (inside[0].video ? 'a video' : 'an animated picture') : `${inside.length} videos or animated pictures`}: open it to see` : '';
        showFamilyCell(family);
        updateAnimChip();
    };
    const mergeFamily = (family, members) => {
        family.loaded = true;
        const seen = new Set(family.members.map(member => member.img));
        members.forEach(member => {
            if (!seen.has(member.img)) {
                seen.add(member.img);
                family.members.push(member);
            }
        });
        familyBadge(family);
    };
    const groupQueue = [];
    let groupBusy = 0;
    const nextGroup = () => {
        while (groupBusy < 2 && groupQueue.length && !closed) {
            const family = groupQueue.shift();
            if (family.loaded || !family.cell?.isConnected) {
                family.checking = false;
                continue;
            }
            groupBusy++;
            fetchFamily(family.rep)
                .then(members => mergeFamily(family, members))
                .catch(() => {
                    family.loaded = true;
                    familyBadge(family);
                })
                .finally(() => {
                    family.checking = false;
                    groupBusy--;
                    nextGroup();
                });
        }
    };
    const checkGroup = family => {
        if (family.checking || !groupPending(family) || family.rep.domain === PIXIV) {
            return;
        }
        family.checking = true;
        groupQueue.push(family);
        nextGroup();
    };
    const groupCells = new WeakMap();
    const groupWatch = typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(entries => entries.forEach(entry => {
            const family = entry.isIntersecting && groupCells.get(entry.target);
            if (family) {
                groupCells.delete(entry.target);
                groupWatch.unobserve(entry.target);
                checkGroup(family);
            }
        }), { rootMargin: '300px' })
        : { observe: cell => groupCells.get(cell) && checkGroup(groupCells.get(cell)), unobserve() {}, disconnect() {} };
    const animChip = el('span', 'stis-fchip stis-anim-chip');
    animChip.title = 'Show only videos, GIFs and groups that have one inside';
    animChip.addEventListener('click', () => {
        animOnly = !animOnly;
        gridFamilies.forEach(family => {
            showFamilyCell(family);
            if (animOnly && groupPending(family)) {
                checkGroup(family);
            }
        });
        updateAnimChip();
    });
    function updateAnimChip() {
        animChip.classList.toggle('stis-fchip-on', animOnly);
        animChip.innerHTML = '';
        animChip.appendChild(el('i', 'fa-solid fa-play'));
        const shown = [...gridFamilies.values()].filter(family => !family.cell?.hidden && family.members.some(member => animatedItem(member) && videoFits(member) !== false)).length;
        const checking = [...gridFamilies.values()].filter(groupPending).length;
        animChip.appendChild(document.createTextNode(` Animated only${animOnly ? ` (${shown}${checking ? `, checking ${checking} groups` : ''})` : ''}`));
    }
    ui.lookBar.prepend(animChip, lengthBox);

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
                const length = el('span', 'stis-video-length');
                const showLength = seconds => {
                    length.textContent = seconds ? lengthText(seconds) : '';
                    length.hidden = !seconds;
                    const known = gridFamilies.get(key);
                    if (known) {
                        showFamilyCell(known);
                        updateAnimChip();
                    }
                };
                length.hidden = true;
                Object.defineProperty(showLength, 'isConnected', { get: () => play.isConnected });
                play.appendChild(length);
                cell.appendChild(play);
                if (videoLength(item)) {
                    showLength(videoLength(item));
                } else {
                    lengthCells.set(cell, () => askLength(item.video, showLength));
                    lengthWatch.observe(cell);
                }
            }
            const family = { rep: item, members: [item], badge, loaded: false, cell };
            gridFamilies.set(key, family);
            familyBadge(family);
            if (groupPending(family) && item.domain !== PIXIV) {
                groupCells.set(cell, family);
                groupWatch.observe(cell);
            }
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
            const left = [browse.skipped || []].flat().filter(Boolean).length ? ` (${[browse.skipped].flat().filter(Boolean).join('; ')}: make it preferred, or give the site's own word under Settings → Tags across sites.)` : '';
            setStatus(`${browse.required.length ? 'No pictures with the required tags. Make one preferred or remove it.' : 'No pictures found.'}${left}`);
        } else {
            const sorted = browse.preferred.length ? ', best matches first' : '';
            const failed = browse.siteErrors?.length ? ` (${browse.siteErrors.length} site(s) failed, see debug)` : '';
            const notes = [...(browse.siteNotes || []), ...[browse.skipped || []].flat().filter(Boolean)];
            setStatus(`${browse.items.length}${browse.done ? '' : '+'} picture(s) on ${siteLabel(browse.domain)}${sorted}${failed}${notes.length ? ` · ${notes.slice(0, 3).join(' · ')}${notes.length > 3 ? ' …' : ''}` : ''}`);
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
        groupQueue.length = 0;
        updateAnimChip();
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
        releaseMedia(ui.preview);
        ui.preview.innerHTML = '';
        ui.preview.hidden = true;
        previewState = null;
    }

    async function videoTrouble(url, player) {
        const code = player.error?.code;
        try {
            if (await pickReader() === 'software') {
                const info = await decoderInput(url);
                const names = { hevc: 'H.265 (HEVC)', av1: 'AV1', h264: 'H.264', vp9: 'VP9', vp8: 'VP8', prores: 'ProRes', mpeg4: 'MPEG-4' };
                return `This browser cannot play this video${info.codec ? `, made in ${names[info.codec] || info.codec}` : ''}. Make GIF and Find parts still work: they use the built-in reader.`;
            }
        } catch (error) {
            return `The video file looks damaged: ${error?.message || error}`;
        }
        return `This browser cannot play this video (${code === 3 ? 'it could not decode it' : code === 4 ? 'unknown format' : `error ${code || '?'}`}).`;
    }

    function playPreviewVideo(player, url, note) {
        let tries = 0;
        const say = text => {
            note.textContent = text;
            note.hidden = !text;
        };
        const copy = async fresh => {
            videoRoutes.set(url, 'copy');
            if (fresh) {
                forgetVideo(url);
            }
            say(fresh ? 'The video did not play; downloading it again through SillyTavern…' : 'Loading the video through SillyTavern…');
            try {
                const objectUrl = await videoPlayUrl(url);
                if (player.isConnected) {
                    player.src = objectUrl;
                    say('');
                }
            } catch (error) {
                if (player.isConnected) {
                    say(`${error?.message || error}${needsVideoCopy(url) && !agentFor(url)['User-Agent'] ? ' Add your Danbooru account under Setup in the settings.' : ''} `);
                    const retry = el('a', 'stis-clip-back', 'Try again');
                    retry.href = '#';
                    retry.addEventListener('click', event => {
                        event.preventDefault();
                        copy(true);
                    });
                    note.appendChild(retry);
                }
            }
        };
        player.addEventListener('error', async () => {
            if (!player.isConnected || !player.getAttribute('src')) {
                return;
            }
            tries++;
            console.warn('[Image Search] the video did not play', url, player.error?.code, player.error?.message, tries);
            if (tries <= 2 && !String(player.getAttribute('src')).startsWith('blob:')) {
                copy(false);
            } else if (tries <= 2) {
                copy(true);
            } else {
                say('Checking the video…');
                const text = await videoTrouble(url, player);
                if (player.isConnected) {
                    say(text);
                }
            }
        });
        if (needsVideoCopy(url) || videoRoutes.get(url) === 'copy') {
            copy(false);
        } else {
            say('');
            player.src = url;
        }
    }

    function previewShell(src, sourceUrl, target, kind) {
        previewState = { kind, target };
        releaseMedia(ui.preview);
        ui.preview.innerHTML = '';
        ui.preview.scrollTop = 0;
        const main = el('div', 'stis-preview-main');
        const isVideo = typeof src !== 'string' && Boolean(src?.video);
        const img = el(isVideo ? 'video' : 'img', 'stis-preview-img');
        let videoNote = null;
        img.draggable = false;
        if (typeof src === 'string') {
            img.src = src;
        } else if (isVideo) {
            Object.assign(img, { muted: true, loop: true, playsInline: true, autoplay: true, controls: true });
            videoNote = el('small', 'stis-video-note');
            if (needsVideoCopy(src.video)) {
                if (agentFor(src.img)['User-Agent']) {
                    serverImageUrl(src.img).then(url => {
                        if (!img.src) {
                            img.poster = url;
                        }
                    }).catch(() => {});
                }
            } else {
                img.poster = src.img;
            }
            playPreviewVideo(img, src.video, videoNote);
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
        main.append(...[img, videoNote, bar].filter(Boolean));
        const below = el('div', 'stis-preview-more');
        ui.preview.append(main, below);
        ui.preview.hidden = false;
        return { bar, img, link, main, below };
    }

    function variantStrip(members, current, onChoose, numbered = false, owner = null) {
        const strip = el('div', 'stis-variants');
        members.forEach((member, index) => {
            const wrap = el('span', 'stis-variant-wrap');
            const thumb = el('img', 'stis-variant');
            thumb.alt = numbered ? `Picture ${index + 1}` : `Version ${index + 1}`;
            thumb.draggable = false;
            if (member.thumb) {
                setThumbSource(thumb, member);
            } else {
                showThumb(thumb, member.url);
            }
            thumb.classList.toggle('stis-variant-on', member === current);
            thumb.addEventListener('click', () => onChoose(member));
            wrap.appendChild(thumb);
            if (animatedItem(member)) {
                const looped = owner?.kind === 'sequence' && loopState(owner, member, index) === 'loop';
                const mark = el('span', `stis-variant-anim${looped ? ' stis-variant-loop' : ''}`);
                mark.appendChild(el('i', `fa-solid ${looped ? 'fa-repeat' : 'fa-play'}`));
                mark.title = looped ? (member.loopSet === 'loop' ? 'Loop (set by you)' : 'Loop (it repeats)') : member.video ? 'Video' : 'Animated';
                wrap.appendChild(mark);
            }
            if (numbered) {
                wrap.appendChild(el('span', 'stis-variant-num', String(index + 1)));
            }
            if (owner && member.role) {
                const waiting = member.deduced?.some(d => !owner.report?.deduced?.[d.tag]?.confirmed);
                const label = el('span', `stis-variant-role${member.roleLock ? ' stis-variant-role-locked' : ''}`, `${waiting ? '⚠ ' : ''}${member.role.main}${member.role.intensity ? ` · ${member.role.intensity}` : ''}`);
                if (member.roleLock) {
                    label.prepend(el('i', 'fa-solid fa-lock'));
                }
                label.title = `${roleText(member.role)}${member.role.intensity ? `, intensity ${member.role.intensity}/10` : ''}${member.roleLock ? ' · locked by you' : ''}${waiting ? ' · has a deduced tag to check' : ''}`;
                wrap.appendChild(label);
                wrap.classList.add('stis-variant-wrap-role');
            }
            strip.appendChild(wrap);
        });
        return strip;
    }

    function tagSection(tagNames, below, folded = false, removed = null, onRestore = null) {
        const gone = removed && typeof removed === 'object' ? removed : {};
        const unique = [...new Set([...(tagNames || []).map(normalizeTag).filter(Boolean), ...Object.keys(gone)])];
        const box = el('div', `stis-tagbox${folded ? ' stis-tagbox-folded' : ''}`);
        const head = el('div', 'stis-tagbox-head');
        head.append(el('span', '', `Tags (${unique.length})`), el('i', 'fa-solid fa-chevron-down'));
        head.title = 'All the tags of this picture';
        const holder = el('div', 'stis-tagbox-tags');
        const actions = el('div', 'stis-tagbox-actions');
        const fold = open => {
            holder.hidden = !open;
            actions.hidden = !open;
            box.classList.toggle('stis-tagbox-open', open);
        };
        if (folded) {
            fold(libTagsOpen);
        }
        head.addEventListener('click', () => {
            if (folded) {
                libTagsOpen = holder.hidden;
                fold(libTagsOpen);
                return;
            }
            if (typeof ui.preview.scrollTo === 'function') {
                ui.preview.scrollTo({ top: box.offsetTop, behavior: 'smooth' });
            }
        });
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
        const goneInfo = el('div', 'stis-tagpick-gone-info');
        goneInfo.hidden = true;
        unique.forEach(tag => {
            const chip = el('span', 'stis-tagpick');
            chip.append(el('span', 'stis-tagpick-star', '★'), el('span', '', tag));
            chip.title = tags.includes(tag) ? 'Already in the search' : 'Tap to select';
            if (gone[tag]) {
                chip.classList.add('stis-tagpick-removed');
                chip.title = 'Taken out: it does not apply to this picture. Tap to see why';
                chip.addEventListener('click', () => {
                    const open = goneInfo.hidden || goneInfo.dataset.tag !== tag;
                    goneInfo.innerHTML = '';
                    goneInfo.hidden = !open;
                    goneInfo.dataset.tag = tag;
                    if (!open) {
                        return;
                    }
                    goneInfo.appendChild(el('span', '', `${tag.replace(/_/g, ' ')}: not in this picture${gone[tag].reason ? `, because ${gone[tag].reason}` : ''} (${gone[tag].by === 'ai' ? 'taken out by the AI from your notes' : 'taken out by you'}). It no longer counts for searches. `));
                    const back = el('a', 'stis-tagpick-restore', 'Put it back');
                    back.href = '#';
                    back.addEventListener('click', event => {
                        event.preventDefault();
                        onRestore?.(tag);
                    });
                    goneInfo.appendChild(back);
                });
                chip.querySelector('.stis-tagpick-star').hidden = true;
                holder.appendChild(chip);
                return;
            }
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
        box.append(head, holder, goneInfo, actions);
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

    const rangeLoops = new WeakMap();

    function stopRange(video) {
        const state = rangeLoops.get(video);
        if (state) {
            clearInterval(state.timer);
            rangeLoops.delete(video);
        }
    }

    function loopRange(video, start, end) {
        stopRange(video);
        const state = { start, end, timer: 0 };
        state.timer = setInterval(() => {
            if (!video.isConnected) {
                stopRange(video);
                return;
            }
            const time = Number(video.currentTime) || 0;
            if (time >= state.end - 0.03 || time < state.start - 0.3) {
                video.currentTime = state.start;
            }
        }, 40);
        rangeLoops.set(video, state);
        try {
            video.currentTime = start;
        } catch {
            return;
        }
        Promise.resolve(video.play?.()).catch(() => {});
    }

    function videoTools(current, player) {
        const fmt = value => (Math.round((Number(value) || 0) * 10) / 10).toFixed(1);
        const tools = { step: 0.1, busy: '', playing: -1, cardVideo: null, cards: [], head: null, footText: '', footStatus: null };
        current.parts = Array.isArray(current.parts) ? current.parts : [];
        const durationOf = () => current.scan?.duration || (Number.isFinite(player.duration) && player.duration > 0 ? player.duration : 0) || Math.max(0, ...current.parts.map(part => part.end));
        const partColor = index => `hsl(${(index * 67 + 200) % 360}, 65%, 50%)`;
        const rows = el('div', 'stis-video-tools');
        const clip = el('div', 'stis-clip');
        decoder.note = text => {
            const target = tools.busy === 'scan' ? partsStatus : tools.busy === 'make' ? tools.footStatus : status;
            if (target?.isConnected && text) {
                target.textContent = text;
            }
        };
        const startInput = el('input', 'text_pole stis-clip-at');
        Object.assign(startInput, { type: 'number', min: '0', step: '0.1', value: fmt(current.clipStart) });
        startInput.title = 'Where the GIF starts, in seconds';
        const startHere = el('div', 'menu_button', 'Start here');
        startHere.title = 'Start the GIF where the video is now';
        const length = el('input', 'text_pole stis-clip-len');
        Object.assign(length, { type: 'number', min: '1', max: '30', step: '1', value: String(current.clipSeconds || s.gifSeconds || 6) });
        length.title = 'Seconds of video in the GIF';
        const playClip = el('div', 'menu_button stis-clip-play', 'Play clip');
        playClip.title = 'Play only this part of the video, looping';
        const make = el('div', 'menu_button', 'Make GIF');
        const status = el('small', 'stis-clip-status');
        const clipStart = () => Math.max(0, Number(current.clipStart) || 0);
        const clipLength = () => Math.min(30, Math.max(1, Number(current.clipSeconds) || Number(length.value) || 6));
        let madeGif = null;
        const showVideo = () => {
            if (madeGif) {
                URL.revokeObjectURL(madeGif.src);
            }
            madeGif?.remove();
            madeGif = null;
            player.hidden = false;
        };
        const reset = () => {
            downloads.delete(current.img);
            status.textContent = '';
            make.textContent = 'Make GIF';
            showVideo();
        };
        const replayClip = () => {
            if (rangeLoops.has(player)) {
                loopRange(player, clipStart(), clipStart() + clipLength());
            }
        };
        const setStart = value => {
            current.clipStart = Math.max(0, Math.round((Number(value) || 0) * 10) / 10);
            startInput.value = fmt(current.clipStart);
            reset();
            replayClip();
        };
        startInput.addEventListener('change', () => setStart(startInput.value));
        startHere.addEventListener('click', () => setStart(player.currentTime));
        length.addEventListener('input', () => {
            current.clipSeconds = Math.min(30, Math.max(1, Number(length.value) || 6));
            reset();
            replayClip();
        });
        playClip.addEventListener('click', () => {
            if (rangeLoops.has(player)) {
                stopRange(player);
                player.pause?.();
                playClip.textContent = 'Play clip';
                return;
            }
            stopCard();
            showVideo();
            loopRange(player, clipStart(), clipStart() + clipLength());
            playClip.textContent = 'Stop clip';
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
                status.textContent = `GIF ready: ${(picture.blob.size / 1048576).toFixed(1)} MB, ${picture.frames} frames. Use it or save it. `;
                make.textContent = 'Make again';
                if (previewState?.variant === current && player.isConnected) {
                    stopRange(player);
                    player.pause?.();
                    playClip.textContent = 'Play clip';
                    madeGif = el('img', 'stis-preview-img');
                    madeGif.alt = '';
                    madeGif.dataset.stisMade = '1';
                    madeGif.src = URL.createObjectURL(picture.blob);
                    player.before(madeGif);
                    player.hidden = true;
                    const back = el('a', 'stis-clip-back', 'Show the video');
                    back.href = '#';
                    back.addEventListener('click', event => {
                        event.preventDefault();
                        showVideo();
                        back.remove();
                    });
                    status.appendChild(back);
                }
            } catch (error) {
                make.textContent = 'Make GIF';
                status.textContent = `Could not make the GIF: ${error?.message || error}`;
            }
        });
        const total = el('span', 'stis-clip-total');
        const showTotal = () => {
            const seconds = durationOf() || videoLength(current);
            total.textContent = seconds ? `Video ${lengthText(seconds)}` : '';
            total.hidden = !seconds;
            if (seconds && !current.duration) {
                videoLengths.set(current.video, seconds);
            }
        };
        player.addEventListener('loadedmetadata', showTotal);
        showTotal();
        clip.append(total, el('span', 'stis-clip-start', 'Start'), startInput, el('span', '', 's'), startHere, el('span', '', 'Length'), length, el('span', '', 's'), playClip, make, status);

        const partsRow = el('div', 'stis-clip stis-parts-row');
        const findParts = el('div', 'menu_button stis-find-parts', 'Find parts');
        findParts.title = 'Read the whole video, find where loops stop and something changes, and propose parts';
        const addClip = el('div', 'menu_button stis-add-clip', 'Add clip');
        addClip.title = 'Add the clip set above (start and length) to the parts';
        const partsStatus = el('small', 'stis-clip-status stis-parts-status');
        partsRow.append(findParts, addClip, partsStatus);
        rows.append(clip, partsRow);
        const panel = el('div', 'stis-parts');

        const releasePart = part => {
            if (part.gif?.url) {
                URL.revokeObjectURL(part.gif.url);
            }
            part.gif = null;
        };
        const stillAt = time => {
            const stills = current.scan?.stills || [];
            let best = null;
            stills.forEach(still => {
                if (!best || Math.abs(still.time - time) < Math.abs(best.time - time)) {
                    best = still;
                }
            });
            return best?.url || '';
        };

        const partNote = part => {
            const base = part.kind === 'loop' ? `Loop ×${part.cycles} in the video, ${fmt(part.period)} s each${part.change ? `: the loop before, ${part.change}` : ''}; GIF holds ${part.shown || 1}`
                : part.kind === 'burst' ? `Fast action, ${part.cuts || 'many'} cuts` : part.kind === 'cut' ? 'After a cut' : part.kind === 'still' ? 'Still' : part.kind === 'hand' ? 'Added by hand' : 'Action';
            return part.edited ? `${base} (edited)` : base;
        };
        const moveHead = time => {
            const duration = durationOf();
            if (tools.head && duration) {
                tools.head.style.left = `${Math.min(100, Math.max(0, time / duration * 100))}%`;
            }
        };
        player.addEventListener('timeupdate', () => {
            if (tools.playing < 0) {
                moveHead(Number(player.currentTime) || 0);
            }
        });

        function stopCard() {
            const video = tools.cardVideo;
            if (video) {
                stopRange(video);
                video.pause?.();
                video.removeAttribute('src');
                video.load?.();
                video.remove();
            }
            tools.cards.forEach(card => card.classList.remove('stis-part-on'));
            tools.cardVideo = null;
            tools.playing = -1;
        }

        async function playCard(index) {
            const part = current.parts[index];
            const card = tools.cards[index];
            if (!part || !card) {
                return;
            }
            stopCard();
            stopRange(player);
            player.pause?.();
            playClip.textContent = 'Play clip';
            const video = el('video', 'stis-part-video');
            Object.assign(video, { muted: true, playsInline: true, controls: false });
            video.setAttribute('playsinline', '');
            card.querySelector('.stis-part-media').appendChild(video);
            card.classList.add('stis-part-on');
            tools.cardVideo = video;
            tools.playing = index;
            video.addEventListener('timeupdate', () => moveHead(Number(video.currentTime) || 0));
            video.addEventListener('error', async () => {
                if (tools.cardVideo !== video || String(video.getAttribute('src') || '').startsWith('blob:')) {
                    return;
                }
                videoRoutes.set(current.video, 'copy');
                try {
                    video.src = await videoPlayUrl(current.video);
                    if (tools.cardVideo === video) {
                        loopRange(video, part.start, part.end);
                    }
                } catch (error) {
                    partsStatus.textContent = `Could not play the part: ${error?.message || error}`;
                }
            });
            try {
                video.src = await videoPlayUrl(current.video);
                if (tools.cardVideo === video) {
                    loopRange(video, part.start, part.end);
                }
            } catch (error) {
                if (tools.cardVideo === video) {
                    stopCard();
                    partsStatus.textContent = `Could not play the part: ${error?.message || error}`;
                }
            }
        }

        const editable = () => !tools.busy;
        const changed = (part, edited = true) => {
            if (part.gif) {
                releasePart(part);
                part.changed = true;
            }
            part.error = '';
            part.edited = part.edited || edited;
            tools.saved = '';
        };
        const rerender = index => {
            const replay = tools.playing === index ? index : -1;
            stopCard();
            renderParts();
            if (replay >= 0) {
                playCard(replay);
            }
        };
        function movePart(index, edge, delta) {
            const part = current.parts[index];
            if (!part || !editable()) {
                return;
            }
            const duration = durationOf() || Infinity;
            const round = value => Math.round(value * 100) / 100;
            if (edge === 'start') {
                part.start = round(Math.max(0, Math.min(part.end - 0.1, part.start + delta)));
            } else {
                part.end = round(Math.min(duration, Math.max(part.start + 0.1, part.end + delta)));
            }
            part.region = null;
            changed(part);
            rerender(index);
        }
        function splitPart(index) {
            const part = current.parts[index];
            if (!part || !editable()) {
                return;
            }
            if (current.parts.length >= MAX_PARTS) {
                partsStatus.textContent = `${MAX_PARTS} parts at most.`;
                return;
            }
            const playing = tools.playing === index && tools.cardVideo ? Number(tools.cardVideo.currentTime) : NaN;
            const at = playing > part.start + 0.1 && playing < part.end - 0.1 ? playing : (part.start + part.end) / 2;
            const cut = Math.round(at * 100) / 100;
            stopCard();
            releasePart(part);
            const first = { start: part.start, end: cut, kind: 'hand', still: part.still };
            const second = { start: cut, end: part.end, kind: 'hand', still: current.scan ? stillAt((cut + part.end) / 2) : part.still };
            current.parts.splice(index, 1, first, second);
            tools.saved = '';
            renderParts();
        }
        function mergePart(index) {
            const one = current.parts[index];
            const two = current.parts[index + 1];
            if (!one || !two || !editable()) {
                return;
            }
            stopCard();
            releasePart(one);
            releasePart(two);
            current.parts.splice(index, 2, { start: Math.min(one.start, two.start), end: Math.max(one.end, two.end), kind: 'hand', still: one.still });
            tools.saved = '';
            renderParts();
        }
        function removePart(index) {
            if (!current.parts[index] || !editable()) {
                return;
            }
            stopCard();
            releasePart(current.parts[index]);
            current.parts.splice(index, 1);
            tools.saved = '';
            renderParts();
        }

        async function makeParts(list) {
            if (tools.busy || !list.length) {
                return;
            }
            tools.busy = 'make';
            stopCard();
            list.forEach(part => {
                releasePart(part);
                part.error = '';
            });
            tools.footText = 'Making the GIFs…';
            renderParts();
            const numbers = list.map(part => current.parts.indexOf(part) + 1);
            try {
                await makePartGifs(current.video, list.map(part => ({ start: part.start, end: part.end })), (i, share) => {
                    tools.footText = `Making part ${numbers[i]} (${i + 1} of ${list.length})… ${Math.round(share * 100)}%`;
                    if (tools.footStatus) {
                        tools.footStatus.textContent = tools.footText;
                    }
                }, (i, made, error) => {
                    const part = list[i];
                    if (!current.parts.includes(part)) {
                        return;
                    }
                    if (made) {
                        part.gif = { blob: made.blob, url: URL.createObjectURL(made.blob), frames: made.frames, size: made.blob.size, how: made.how || '' };
                        part.changed = false;
                    } else {
                        part.error = String(error?.message || error);
                    }
                    renderParts();
                });
                tools.footText = list.every(part => part.gif) ? 'Check the GIFs, then save.' : 'Some parts could not be made: make them again or remove them.';
            } catch (error) {
                tools.footText = `Could not make the GIFs: ${error?.message || error}`;
            }
            tools.busy = '';
            tools.saved = '';
            renderParts();
        }

        async function saveParts(kind) {
            const ready = current.parts.length >= 2 && current.parts.every(part => part.gif);
            if (tools.busy || !ready || tools.saved) {
                return;
            }
            tools.busy = 'save';
            tools.footText = 'Saving…';
            renderParts();
            try {
                const { entry, work } = await saveVideoParts(current, current.parts, kind, [...tags]);
                tools.saved = kind;
                tools.footText = `Saved in the library as a ${kind} of ${entry.variants.length} GIFs. It is being described.`;
                updateLibraryTab();
                work.then(ok => ok && toastr.success(`The ${kind} is described and in the lorebook.`, 'Image Search'));
            } catch (error) {
                tools.footText = `Could not save: ${error?.message || error}`;
            }
            tools.busy = '';
            renderParts();
        }

        function iconButton(icon, title, onClick) {
            const button = el('span', 'stis-part-btn');
            button.appendChild(el('i', icon));
            button.title = title;
            button.addEventListener('click', onClick);
            return button;
        }

        function partCard(part, index) {
            const card = el('div', 'stis-part');
            card.style.borderLeftColor = partColor(index);
            const media = el('div', 'stis-part-media');
            const picture = part.gif?.url || part.still;
            if (picture) {
                const img = el('img');
                img.alt = '';
                img.src = picture;
                media.appendChild(img);
            } else {
                media.appendChild(el('i', 'fa-solid fa-film stis-part-blank'));
            }
            const play = el('span', 'stis-part-play');
            play.appendChild(el('i', 'fa-solid fa-play'));
            media.appendChild(play);
            media.title = 'Tap to play this part from the video, looping; tap again to stop';
            media.addEventListener('click', () => (tools.playing === index ? stopCard() : playCard(index)));
            const info = el('div', 'stis-part-info');
            const title = el('div', 'stis-part-title');
            title.append(el('b', '', `Part ${index + 1}`), el('span', 'stis-part-time', ` ${fmt(part.start)}–${fmt(part.end)} s (${fmt(part.end - part.start)} s)`));
            info.append(title, el('small', 'stis-part-note', partNote(part)));
            const gifLine = part.error ? `Could not make it: ${part.error}` : part.gif ? `GIF ${(part.gif.size / 1048576).toFixed(1)} MB · ${part.gif.frames} frames${s.debug && part.gif.how ? ` · read by ${part.gif.how}` : ''}` : part.changed ? 'Changed: make it again' : 'GIF not made yet';
            info.appendChild(el('small', `stis-part-gif${part.error ? ' stis-part-error' : ''}`, gifLine));
            const controls = el('div', 'stis-part-controls');
            const nudge = (label, edge, sign) => {
                const button = el('span', 'stis-part-btn', label);
                button.title = `${sign < 0 ? 'Earlier' : 'Later'} ${edge} by ${tools.step} s`;
                button.addEventListener('click', () => movePart(index, edge, sign * tools.step));
                return button;
            };
            controls.append(el('small', '', 'Start'), nudge('−', 'start', -1), nudge('+', 'start', 1), el('small', '', 'End'), nudge('−', 'end', -1), nudge('+', 'end', 1));
            const split = iconButton('fa-solid fa-scissors', 'Split this part where it is playing, or in the middle', () => splitPart(index));
            const merge = iconButton('fa-solid fa-link', 'Merge with the next part', () => mergePart(index));
            merge.hidden = index === current.parts.length - 1;
            const remake = iconButton('fa-solid fa-rotate', 'Make this GIF again', () => makeParts([part]));
            remake.hidden = !part.gif && !part.error;
            const remove = iconButton('fa-solid fa-xmark', 'Remove this part', () => removePart(index));
            controls.append(split, merge, remake, remove);
            info.appendChild(controls);
            card.append(media, info);
            return card;
        }

        function renderParts() {
            stopCard();
            panel.innerHTML = '';
            tools.cards = [];
            tools.head = null;
            tools.footStatus = null;
            panel.hidden = !current.parts.length;
            addClip.classList.toggle('disabled', current.parts.length >= MAX_PARTS);
            if (!current.parts.length) {
                return;
            }
            const duration = durationOf();
            const head = el('div', 'stis-parts-head');
            head.appendChild(el('b', '', `Parts (${current.parts.length})`));
            const steps = el('span', 'stis-parts-steps');
            steps.appendChild(el('small', '', 'Step'));
            [0.1, 1].forEach(value => {
                const chip = el('span', 'stis-fchip', `${value} s`);
                chip.classList.toggle('stis-fchip-on', tools.step === value);
                chip.addEventListener('click', () => {
                    tools.step = value;
                    renderParts();
                });
                steps.appendChild(chip);
            });
            const clear = el('div', 'menu_button stis-parts-clear', 'Clear parts');
            clear.title = 'Remove every part';
            clear.addEventListener('click', () => {
                if (tools.busy) {
                    return;
                }
                if (current.parts.some(part => part.gif) && clear.textContent !== 'Tap again to clear') {
                    clear.textContent = 'Tap again to clear';
                    return;
                }
                current.parts.forEach(releasePart);
                current.parts = [];
                current.skipped = [];
                tools.saved = '';
                tools.footText = '';
                renderParts();
            });
            head.append(steps, clear);
            const line = el('div', 'stis-timeline');
            if (duration) {
                const place = (node, from, to) => {
                    node.style.left = `${Math.max(0, from / duration * 100)}%`;
                    node.style.width = `${Math.max(0.8, (to - from) / duration * 100)}%`;
                };
                (current.skipped || []).forEach(([from, to]) => {
                    const gone = el('div', 'stis-timeline-skip');
                    place(gone, from, to);
                    gone.title = `${fmt(from)}–${fmt(to)} s: black or fading, left out`;
                    line.appendChild(gone);
                });
                current.parts.forEach((part, index) => {
                    if (part.region) {
                        const region = el('div', 'stis-timeline-region');
                        place(region, part.region[0], part.region[1]);
                        region.style.background = partColor(index);
                        line.appendChild(region);
                    }
                    const segment = el('div', 'stis-timeline-part');
                    place(segment, part.start, part.end);
                    segment.style.background = partColor(index);
                    segment.title = `Part ${index + 1}: ${fmt(part.start)}–${fmt(part.end)} s`;
                    segment.addEventListener('click', () => playCard(index));
                    line.appendChild(segment);
                });
                tools.head = el('div', 'stis-timeline-head');
                line.appendChild(tools.head);
                moveHead(Number(player.currentTime) || 0);
            }
            const list = el('div', 'stis-part-list');
            current.parts.forEach((part, index) => {
                const card = partCard(part, index);
                tools.cards.push(card);
                list.appendChild(card);
            });
            const foot = el('div', 'stis-clip stis-parts-foot');
            const waiting = current.parts.filter(part => !part.gif);
            const makeAll = el('div', 'menu_button stis-parts-make', tools.busy === 'make' ? 'Making…' : waiting.length ? `Make GIFs (${waiting.length})` : 'All GIFs made');
            makeAll.title = 'Make the GIFs of the parts that have none yet';
            makeAll.classList.toggle('disabled', !waiting.length || Boolean(tools.busy));
            makeAll.addEventListener('click', () => makeParts(current.parts.filter(part => !part.gif)));
            const ready = current.parts.length >= 2 && current.parts.every(part => part.gif) && !tools.busy;
            const saveSequence = el('div', 'menu_button stis-parts-save', tools.saved === 'sequence' ? 'Saved as sequence' : 'Save as sequence');
            saveSequence.title = 'Parts in order: the AI shows them one after another as the story moves on';
            const saveSet = el('div', 'menu_button stis-parts-save', tools.saved === 'set' ? 'Saved as set' : 'Save as set');
            saveSet.title = 'Separate moments: the AI shows whichever part fits';
            [saveSequence, saveSet].forEach(button => {
                button.classList.toggle('disabled', !ready || Boolean(tools.saved));
                button.hidden = !(s.saveLocal && s.keepLibrary);
            });
            saveSequence.addEventListener('click', () => saveParts('sequence'));
            saveSet.addEventListener('click', () => saveParts('set'));
            const hint = current.parts.length < 2 ? 'Saving needs at least 2 parts.' : current.parts.some(part => !part.gif) ? 'Make the GIFs to check them, then save.' : '';
            tools.footStatus = el('small', 'stis-clip-status', tools.footText || hint);
            foot.append(makeAll, saveSequence, saveSet, tools.footStatus);
            panel.append(head, line, list, foot);
        }

        let scanStop = false;
        findParts.addEventListener('click', async () => {
            if (tools.busy === 'scan') {
                scanStop = true;
                findParts.textContent = 'Stopping…';
                return;
            }
            if (tools.busy) {
                return;
            }
            if (current.parts.some(part => part.gif) && findParts.textContent !== 'Tap again to replace the parts') {
                findParts.textContent = 'Tap again to replace the parts';
                return;
            }
            tools.busy = 'scan';
            scanStop = false;
            stopCard();
            findParts.textContent = 'Stop';
            partsStatus.textContent = 'Reading the video…';
            try {
                const scan = await scanVideo(current.video, share => {
                    if (!scanStop) {
                        partsStatus.textContent = `Reading the video… ${Math.round(share * 100)}%`;
                    }
                }, () => scanStop || closed || !panel.isConnected);
                partsStatus.textContent = 'Finding the parts…';
                await new Promise(resolve => setTimeout(resolve, 30));
                const maxPart = Math.min(30, Math.max(1, Number(s.gifSeconds) || 6));
                const found = splitVideo(scan, { maxPart, sense: s.splitSense, maxParts: MAX_PARTS, repeats: Math.min(5, Math.max(1, Math.round(Number(s.loopRepeats) || 3))) });
                current.scan = scan;
                current.skipped = found.skipped;
                current.parts.forEach(releasePart);
                current.parts = found.parts.map(part => ({ ...part, still: stillAt((part.start + part.end) / 2) }));
                tools.saved = '';
                tools.footText = '';
                const count = current.parts.length;
                const loops = found.loops ? `${found.loops} loop${found.loops === 1 ? '' : 's'}` : 'no loop';
                const left = found.dropped ? ` ${found.dropped} short part${found.dropped === 1 ? ' was' : 's were'} left out (${MAX_PARTS} at most); add ${found.dropped === 1 ? 'it' : 'them'} by hand if needed.` : '';
                const longer = found.longest > maxPart ? ` Parts are up to ${Math.round(found.longest)} s long so the whole video fits in ${MAX_PARTS} parts.` : '';
                const read = ` Read ${scan.samples.length} pictures in ${Math.round(scan.ms / 1000)} s (${scan.how}).`;
                const darkSeconds = found.skipped.reduce((sum, [from, to]) => sum + to - from, 0);
                const dark = darkSeconds >= 0.3 ? ` Left out ${fmt(darkSeconds)} s of black and fades.` : '';
                partsStatus.textContent = scan.moving === false
                    ? `The picture never changed while the video was read, so there is nothing to split. If the video does move, this browser is not giving its pictures: try Chrome.${read}`
                    : `Found ${count} part${count === 1 ? '' : 's'}: ${loops}${found.bursts ? `, ${found.bursts} of fast action` : ''}${found.cuts ? `, ${found.cuts} after a cut` : ''}.${dark}${left}${longer} Tap a part to play it.${read}`;
            } catch (error) {
                partsStatus.textContent = scanStop ? 'Stopped.' : `Could not read the video: ${error?.message || error}`;
            }
            tools.busy = '';
            findParts.textContent = 'Find parts';
            renderParts();
        });
        addClip.addEventListener('click', () => {
            if (tools.busy) {
                return;
            }
            if (current.parts.length >= MAX_PARTS) {
                partsStatus.textContent = `${MAX_PARTS} parts at most.`;
                return;
            }
            const start = clipStart();
            const duration = durationOf();
            const end = Math.max(start + 0.1, duration ? Math.min(duration, start + clipLength()) : start + clipLength());
            const part = { start, end, kind: 'hand', still: current.scan?.how === 'built-in reader' ? stillAt((start + end) / 2) : '' };
            current.parts.push(part);
            current.parts.sort((a, b) => a.start - b.start);
            tools.saved = '';
            partsStatus.textContent = `Added ${fmt(start)}–${fmt(end)} s.`;
            renderParts();
            if (!part.still) {
                partStill(current.video, player, (start + end) / 2).then(url => {
                    if (url && current.parts.includes(part) && !part.still) {
                        part.still = url;
                        renderParts();
                    }
                }).catch(() => {});
            }
        });
        renderParts();
        return { rows, panel };
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
        const actionRow = el('div', 'stis-actions');
        const use = el('div', 'menu_button stis-use', 'Use this');
        use.addEventListener('click', () => pick(current, use));
        actionRow.append(use);
        bar.after(actionRow);
        if (current.video && s.saveLocal) {
            const tools = videoTools(current, img);
            bar.before(tools.rows);
            below.appendChild(tools.panel);
        }
        const drawStrip = () => {
            stripHolder.innerHTML = '';
            if (family && family.members.length > 1) {
                stripHolder.appendChild(variantStrip(family.members, current, member => showPreview(item, member)));
            }
            setButton.hidden = !family || family.members.length < 2 || !s.saveLocal || !s.keepLibrary;
        };
        const setButton = el('div', 'menu_button stis-act-set', 'Save set');
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
                mergeFamily(family, members);
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
            const keep = el('div', 'menu_button stis-act-keep');
            keep.title = 'Save it in the library without adding it to the chat; you can keep browsing';
            const paintKeep = () => {
                const state = saveState(current);
                const found = library.loaded ? findBySource(current.page) : null;
                keep.textContent = keep.dataset.restoring ? 'Downloading again…' : state === 'queued' || state === 'saving' ? 'Saving…' : found ? (found.entry.kind === 'set' ? 'In a saved set' : 'In library') : state === 'failed' ? 'Retry saving' : 'Save to library';
                const shown = current;
                if (found && !current.video && !keep.dataset.restoring) {
                    fileMissing(found.variant?.url || found.entry.url).then(gone => {
                        if (gone && previewState?.paintKeep === paintKeep && shown === current && !keep.dataset.restoring) {
                            keep.textContent = 'Download again';
                            keep.title = 'This picture is in your library, but its file is gone from the server: download it again from the site, keeping its description';
                        }
                    });
                }
            };
            previewState.paintKeep = paintKeep;
            paintKeep();
            loadLibrary().then(() => {
                if (previewState?.paintKeep === paintKeep) {
                    paintKeep();
                }
            });
            keep.addEventListener('click', () => {
                if (keep.textContent === 'Download again') {
                    const found = findBySource(current.page);
                    if (!found) {
                        return;
                    }
                    keep.dataset.restoring = '1';
                    paintKeep();
                    restoreFile(found, current).then(() => {
                        toastr.success('Downloaded again. Its description and everything else are kept.', 'Image Search');
                        updateLibraryTab();
                    }).catch(error => {
                        toastr.warning(String(error?.message || error), 'Image Search');
                    }).finally(() => {
                        delete keep.dataset.restoring;
                        keep.title = 'Save it in the library without adding it to the chat; you can keep browsing';
                        if (previewState?.paintKeep === paintKeep) {
                            paintKeep();
                        }
                    });
                    return;
                }
                if (keep.textContent !== 'Save to library' && keep.textContent !== 'Retry saving') {
                    return;
                }
                queueSave(current, [...tags]);
                paintKeep();
            });
            actionRow.append(keep, setButton);
        }
        if (selecting) {
            actionRow.append(selectButton(itemPick(current)));
        }
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
        const navCount = bar.childElementCount;
        previewState.variant = current;
        if (multi) {
            bar.before(variantStrip(entry.variants, current, variant => showEntry(entry, variant), sequence, entry));
        }
        const index = multi ? Math.max(0, entry.variants.indexOf(current)) : 0;
        const itemized = groupDescribed(entry) && Boolean(current);
        const target = itemized ? current : entry;
        const info = el('div', 'stis-entry-info');
        const section = (key, title, open) => {
            const box = el('details', `stis-sec stis-sec-${key}`);
            box.open = sectionOpen.has(key) ? sectionOpen.get(key) : open;
            box.addEventListener('toggle', () => sectionOpen.set(key, box.open));
            box.appendChild(el('summary', 'stis-sec-title', title));
            info.appendChild(box);
            return box;
        };
        const itemName = `${entry.fromVideo ? 'Part' : sequence ? 'Picture' : 'Version'} ${index + 1}`;
        let roleBox = null;
        const desc = section('desc', itemized ? `${itemName}${current.role ? ` · ${roleText(current.role)}` : ''}` : 'Description', true);
        if (itemized) {
            desc.appendChild(el('div', 'stis-entry-text', current.description));
            if (itemStory(entry, current, index)) {
                desc.appendChild(el('div', 'stis-entry-text stis-entry-changed', itemStory(entry, current, index)));
            }
            const added = [...(current.implied || []).map(link => ({ tag: link.tag, how: `the site's implications, from ${link.from.replace(/_/g, ' ')}` })), ...(current.inferred || []).map(hit => ({ tag: hit.tag, how: hit.words ? `found in its description: "${hit.words}"` : 'found in its description' }))].filter(add => current.shows.includes(add.tag));
            if (sequence && added.length) {
                const line = el('div', 'stis-entry-text stis-entry-deduced stis-added-tags');
                line.appendChild(el('span', '', 'Tags added for this item: '));
                added.forEach((add, at) => {
                    const chip = el('span', 'stis-added-tag', `${add.tag.replace(/_/g, ' ')} (${add.how})`);
                    const drop = el('i', 'fa-solid fa-xmark stis-added-drop');
                    drop.title = `Take ${add.tag.replace(/_/g, ' ')} off this item (Redo all will not add it again)`;
                    drop.addEventListener('click', async () => {
                        current.shows = current.shows.filter(tag => tag !== add.tag);
                        current.implied = (current.implied || []).filter(link => link.tag !== add.tag);
                        current.inferred = (current.inferred || []).filter(hit => hit.tag !== add.tag);
                        current.dropped = [...new Set([...(current.dropped || []), add.tag])];
                        descriptions.set(current.url, describedVariant(entry, current));
                        await saveLibrary();
                        showEntry(entry, current);
                    });
                    chip.appendChild(drop);
                    line.appendChild(chip);
                    if (at < added.length - 1) {
                        line.appendChild(document.createTextNode('; '));
                    }
                });
                desc.appendChild(line);
            }
            if (sequence && current.role) {
                if (current.roleLock) {
                    const locked = el('div', 'stis-entry-text stis-role-locked', ' Role and intensity locked by you');
                    locked.prepend(el('i', 'fa-solid fa-lock'));
                    desc.appendChild(locked);
                }
                roleBox = roleEditor(entry, current, () => showEntry(entry, current));
                desc.appendChild(roleBox);
            }
            if (current.deduced.length) {
                desc.appendChild(el('div', 'stis-entry-text stis-entry-deduced', `Deduced, not seen: ${current.deduced.map(d => `${d.tag.replace(/_/g, ' ')} (${d.why})`).join('; ')}`));
            }
        } else {
            desc.appendChild(el('div', 'stis-entry-text', entry.description || 'No description yet. One is made the next time you use it, or tap Redo.'));
            if (multi && index > 0) {
                desc.appendChild(el('div', 'stis-entry-text', sequence ? `Picture ${index + 1}: ${current.diff || 'not described yet.'}` : `This version: ${current.diff || 'no difference noted yet.'}`));
            }
        }
        const fixSpot = el('div', 'stis-fix-spot');
        desc.appendChild(fixSpot);
        if (multi) {
            const progress = el('div', 'stis-group-progress');
            paintProgress(progress, groupProgress.get(entry.id) || '');
            bar.before(progress);
            groupListeners.set(entry.id, text => {
                if (!progress.isConnected) {
                    groupListeners.delete(entry.id);
                    return;
                }
                paintProgress(progress, text);
                if (!text && !closed && previewState?.target === entry) {
                    showEntry(entry, entry.variants.includes(current) ? current : null);
                    renderLibrary();
                }
            });
        }
        const covered = entry.fromVideo ? entry.fromVideo.parts.reduce((sum, part) => sum + Math.max(0, part.end - part.start), 0) : 0;
        const videoLine = entry.fromVideo ? `${entry.fromVideo.parts.length} parts of a video · ${lengthText(covered)}${entry.fromVideo.duration ? ` of ${lengthText(entry.fromVideo.duration)}` : ''}` : '';
        const kindLine = entry.fromVideo ? `${sequence ? 'Sequence' : 'Set'}: ${videoLine}` : multi ? (sequence ? `Sequence of ${entry.variants.length} pictures` : `Set of ${entry.variants.length} versions`) : '';
        const lockedItems = multi ? entry.variants.filter(item => item.lock).length : 0;
        const meta = [kindLine, entry.lock ? 'Description locked' : lockedItems ? `${lockedItems} item${lockedItems === 1 ? '' : 's'} locked` : '', borrowedLine(entry), entry.characters.length ? `Used with: ${entry.characters.join(', ')}` : '', `Used ${entry.used} time(s)`].filter(Boolean).join(' · ');
        desc.appendChild(el('small', 'stis-entry-meta', meta));
        if (!multi && entry.huntReport?.text) {
            desc.appendChild(huntReportBox(entry));
        }
        if (multi && entry.report && (entry.report.notShown.length || Object.keys(entry.report.deduced).length || Object.values(entry.removedTags || {}).some(removed => removed.by === 'ai'))) {
            info.appendChild(tagPanel(entry, () => {
                if (!closed && previewState?.target === entry) {
                    showEntry(entry, current);
                    renderLibrary();
                }
            }));
        }
        if (itemized && ((entry.description && entry.description !== current.description) || entry.arc)) {
            const shape = section('shape', 'Shape and overview', false);
            if (entry.arc) {
                shape.appendChild(el('div', 'stis-entry-overview stis-entry-arc', `Shape: ${entry.arc}`));
            }
            if (entry.description && entry.description !== current.description) {
                shape.appendChild(el('div', 'stis-entry-overview', `Overview: ${entry.description}`));
            }
        }
        if (multi && entry.report) {
            info.appendChild(groupReportBox(entry, current));
        }
        if (s.roleCheck && sequence && itemized && entry.report?.storyReply) {
            const roles = section('roles', 'Intensity check', true);
            const rated = entry.variants.map(item => item.role?.intensity || 0);
            const top = Math.max(0, ...rated);
            entry.variants.forEach((item, number) => {
                const line = el('div', `stis-role-line stis-intensity-line${item === current ? ' stis-role-current' : ''}`);
                const head = el('div', 'stis-intensity-head');
                head.appendChild(el('b', '', `${number + 1}`));
                const track = el('span', 'stis-intensity-track');
                const fill = el('span', 'stis-intensity-fill');
                fill.style.width = `${(rated[number] || 0) * 10}%`;
                track.appendChild(fill);
                head.append(track, el('b', 'stis-intensity-value', rated[number] ? `${rated[number]}/10` : '?'));
                if (item.role?.main === 'climax') {
                    head.appendChild(el('span', 'stis-intensity-climax', 'climax'));
                }
                line.appendChild(head);
                if (item.role?.why) {
                    line.appendChild(el('div', 'stis-role-story', item.role.why));
                }
                roles.appendChild(line);
            });
            const climax = entry.variants.findIndex(item => item.role?.main === 'climax');
            const highest = rated.map((value, index) => (value === top && top ? index + 1 : 0)).filter(Boolean);
            if (top) {
                roles.appendChild(el('div', `stis-role-line${climax >= 0 && !highest.includes(climax + 1) ? ' stis-role-differs' : ''}`, `Highest intensity: item ${highest.join(' and ')} · climax: ${climax >= 0 ? `item ${climax + 1}` : 'none'}`));
            }
            if (entry.report.fit?.length) {
                roles.appendChild(el('div', 'stis-role-line stis-group-report-head', 'Role fit'));
                entry.report.fit.forEach(verdict => roles.appendChild(el('div', `stis-role-line${verdict.fits ? '' : ' stis-role-differs'}`, `${verdict.item}: ${verdict.fits ? 'fits' : `does not fit${verdict.said ? `, says "${verdict.said}"` : ''}${verdict.instead ? `; most likely ${verdict.instead}` : ''}${verdict.fixed ? ' (described again)' : ''}`}`)));
                if (entry.report.fitReply) {
                    const raw = el('details', 'stis-group-report-raw');
                    raw.appendChild(el('summary', '', 'The role fit answer'));
                    raw.appendChild(el('small', 'stis-group-report-line stis-entry-text', entry.report.fitReply));
                    roles.appendChild(raw);
                }
            }
            const after = el('details', 'stis-group-report-raw stis-intensity-roles');
            after.appendChild(el('summary', '', `Roles and story lines${entry.arc ? ` · ${entry.arc}` : ''}`));
            entry.variants.forEach((item, number) => {
                const line = el('div', 'stis-role-line');
                line.appendChild(el('b', '', `${number + 1} · ${item.role ? roleText(item.role) : 'no role'}`));
                if (item.diff) {
                    line.appendChild(el('div', 'stis-role-story', item.diff));
                }
                after.appendChild(line);
            });
            roles.appendChild(after);
            if (entry.report.storyAsked) {
                const asked = el('details', 'stis-group-report-raw');
                asked.appendChild(el('summary', '', 'The prompt sent'));
                asked.appendChild(el('small', 'stis-group-report-line stis-entry-text', entry.report.storyAsked));
                roles.appendChild(asked);
            }
            const answer = el('details', 'stis-group-report-raw');
            answer.appendChild(el('summary', '', 'The answer'));
            answer.appendChild(el('small', 'stis-group-report-line stis-entry-text', entry.report.storyReply));
            roles.appendChild(answer);
        }
        section('card', 'Filing card', false).appendChild(cardBox(itemized ? unitView(entry, current) : entry, () => {
            if (!closed) {
                renderLibFilters();
            }
        }));
        bar.after(info);
        const working = multi && groupProgress.has(entry.id);
        const redoLabel = itemized ? (current.lock ? 'Update item' : 'Redo item') : entry.lock ? 'Update' : multi ? 'Redo all' : 'Redo';
        const redo = el('div', 'menu_button stis-act-redo', redoLabel);
        redo.title = itemized ? (current.lock ? 'Bring this item\'s locked description up to the current format, keeping what it says' : 'Describe only this item again, with its own tags and the item before as context') : entry.lock ? 'Bring the locked description up to the current description format, keeping what it says; unlock to describe from scratch' : multi ? 'Describe every item again, from the first look to the final check' : 'Describe this picture again';
        redo.classList.toggle('disabled', working);
        redo.addEventListener('click', async () => {
            if (redo.textContent !== redoLabel || groupProgress.has(entry.id)) {
                return;
            }
            redo.textContent = target.lock ? 'Updating…' : 'Describing…';
            try {
                if (itemized) {
                    await redoItem(entry, index);
                } else {
                    await redoEntry(entry);
                }
                if (!closed && previewState?.target === entry) {
                    showEntry(entry, current);
                }
            } catch (error) {
                redo.textContent = redoLabel;
                toastr.warning(`Could not describe the picture: ${error?.message || error}`, 'Image Search');
            }
        });
        const redoAll = itemized ? confirmButton('Redo all', `Tap again to describe all ${entry.variants.length} items again`, async button => {
            if (groupProgress.has(entry.id)) {
                return;
            }
            button.textContent = 'Describing…';
            try {
                await redoEntry(entry);
                if (!closed && previewState?.target === entry) {
                    showEntry(entry, current);
                }
            } catch (error) {
                button.textContent = 'Redo all';
                toastr.warning(`Could not describe the ${sequence ? 'sequence' : 'set'}: ${error?.message || error}`, 'Image Search');
            }
        }) : null;
        if (redoAll) {
            redoAll.title = 'Describe every item again, from the first look to the final check; locked items are updated, not started over';
            redoAll.classList.toggle('disabled', working);
        }
        const lockText = itemized ? current.description : entry.description;
        const lock = target.lock
            ? confirmButton('Unlock', 'Tap again to unlock', async () => {
                target.lock = null;
                await saveLibrary();
                if (!closed && previewState?.target === entry) {
                    showEntry(entry, current);
                    renderLibrary();
                }
            })
            : el('div', 'menu_button', 'Lock');
        lock.title = target.lock ? 'Let Redo describe this from scratch again' : itemized ? 'Keep this item\'s description: later redos only bring it up to date instead of starting over' : 'Keep this description: later redos only bring it up to date instead of starting over';
        if (!target.lock) {
            lock.classList.toggle('disabled', !lockText || (multi && !itemized));
            lock.addEventListener('click', async () => {
                if (!lockText || (multi && !itemized)) {
                    return;
                }
                target.lock = { text: lockText, at: Date.now() };
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
        const fixButton = el('div', 'menu_button stis-act-fix', 'Correct');
        fixButton.title = itemized ? 'Tell the AI what is wrong in this item\'s description; only this item is rewritten, and your correction is kept for later redos' : 'Tell the AI what is wrong in this description; it is rewritten, and your correction is kept for later redos';
        fixButton.classList.toggle('disabled', (multi && !itemized) || !(itemized ? current.description : entry.description));
        fixButton.addEventListener('click', () => {
            if (fixButton.classList.contains('disabled')) {
                return;
            }
            if (fixSpot.childElementCount) {
                fixSpot.innerHTML = '';
                return;
            }
            const form = el('div', 'stis-fix-form');
            const what = el('textarea', 'text_pole stis-fix-text');
            what.rows = 3;
            what.placeholder = 'What is wrong? e.g. she is not hurt here, she is laughing; the man behind her holds a sword';
            const tagBox = el('input', 'text_pole stis-fix-tags');
            tagBox.type = 'text';
            tagBox.placeholder = 'Tags it shows (optional), e.g. laughing, sword';
            const send = el('div', 'menu_button stis-fix-send', 'Send');
            const cancel = el('div', 'menu_button', 'Cancel');
            cancel.addEventListener('click', () => {
                fixSpot.innerHTML = '';
            });
            send.addEventListener('click', async () => {
                if (send.classList.contains('disabled') || !what.value.trim() || groupProgress.has(entry.id)) {
                    return;
                }
                send.classList.add('disabled');
                send.textContent = 'Correcting…';
                try {
                    await correctDescription(entry, itemized ? current : null, what.value, normalizeTagList(tagBox.value));
                    if (!closed && previewState?.target === entry) {
                        showEntry(entry, current);
                        renderLibrary();
                    }
                } catch (error) {
                    send.classList.remove('disabled');
                    send.textContent = 'Send';
                    toastr.warning(`Could not correct the description: ${error?.message || error}`, 'Image Search');
                }
            });
            const row = el('div', 'stis-fix-buttons');
            row.append(send, cancel);
            form.append(what, tagBox, row);
            fixSpot.appendChild(form);
            what.focus();
        });
        bar.append(...[redo, redoAll, lock, fixButton].filter(Boolean));
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
                        await saveLibrary();
                        toastr.info(entry.huntReport?.text || 'This picture was not found on your other sites.', 'Image Search', { timeOut: 12000 });
                        if (!closed && previewState?.target === entry) {
                            showEntry(entry, current);
                        }
                        return;
                    }
                    hunt.textContent = entry.lock ? 'Updating…' : 'Describing…';
                    await redoEntry(entry);
                    toastr.success(`${entry.huntReport?.text || borrowedLine(entry)} Described and filed again.`, 'Image Search', { timeOut: 12000 });
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
        if (multi) {
            const other = sequence ? 'set' : 'sequence';
            const convert = confirmButton(`Make it a ${other}`, `Tap again: it becomes a ${other} and is described again from scratch`, async button => {
                if (groupProgress.has(entry.id)) {
                    return;
                }
                button.textContent = 'Describing…';
                entry.kind = other;
                entry.variants.forEach(item => {
                    item.role = null;
                    item.diff = '';
                });
                entry.arc = '';
                try {
                    await redoEntry(entry);
                } catch (error) {
                    toastr.warning(`Could not describe the ${other}: ${error?.message || error}`, 'Image Search');
                }
                await saveLibrary();
                scheduleLorebookSync();
                if (!closed && previewState?.target === entry) {
                    showEntry(entry, current);
                    renderLibrary();
                }
            });
            convert.title = sequence ? 'Versions to use on their own, with no story order: every item is described again' : 'Pictures that tell a story in order: every item is described again, with roles and story lines';
            bar.append(convert);
        }
        if (itemized ? current.description : entry.description) {
            const sent = el('div', 'menu_button stis-sent-button', 'What the AI saw');
            sent.title = 'The pictures the vision model got for this item, with the time of each moment in the GIF';
            sent.addEventListener('click', () => {
                const shown = desc.querySelector('.stis-sent');
                if (shown) {
                    shown.remove();
                    return;
                }
                desc.open = true;
                desc.appendChild(sentPanel(entry, itemized ? current : current || entry));
            });
            bar.append(sent);
        }
        const use = el('div', 'menu_button stis-use', 'Use this');
        use.addEventListener('click', () => pickEntry(entry, use, current));
        const actions = [...bar.children].slice(navCount);
        const main = [use, fixButton, redo];
        if (roleBox) {
            const roleButton = el('div', 'menu_button stis-role-open stis-act-role', 'Edit role');
            roleButton.title = 'Change, lock or unlock the role, intensity and story line of this item';
            roleButton.addEventListener('click', () => {
                desc.open = true;
                roleBox.hidden = !roleBox.hidden;
                if (!roleBox.hidden) {
                    roleBox.scrollIntoView?.({ block: 'nearest' });
                }
            });
            main.splice(2, 0, roleButton);
        }
        if (s.roleCheck && sequence && groupDescribed(entry)) {
            const check = el('div', 'menu_button stis-role-check', 'Check intensity');
            check.title = 'Run only the story step (intensity, then roles) on the descriptions this sequence already has, and stop there';
            check.classList.toggle('disabled', groupProgress.has(entry.id));
            check.addEventListener('click', async () => {
                if (check.classList.contains('disabled') || groupProgress.has(entry.id)) {
                    return;
                }
                check.classList.add('disabled');
                check.textContent = 'Checking…';
                entry.report = entry.report || cleanReport({});
                groupStep(entry, 'Writing what each item means in the story…');
                try {
                    await writeStory(entry, '', entry.report);
                    entry.report.steps.story = 'on';
                    sectionOpen.set('roles', true);
                    await saveLibrary();
                } catch (error) {
                    toastr.warning(`Could not check the intensity: ${error?.message || error}`, 'Image Search');
                } finally {
                    groupStep(entry, '');
                }
            });
            main.push(check);
            if (String(s.roleRules || '').trim() && entry.variants.every(item => item.role)) {
                const fit = el('div', 'menu_button stis-role-check', 'Check role fit');
                fit.title = 'Check each description against its role with your role rules, without changing anything';
                fit.classList.toggle('disabled', groupProgress.has(entry.id));
                fit.addEventListener('click', async () => {
                    if (fit.classList.contains('disabled') || groupProgress.has(entry.id)) {
                        return;
                    }
                    fit.classList.add('disabled');
                    fit.textContent = 'Checking…';
                    entry.report = entry.report || cleanReport({});
                    try {
                        await roleFit(entry, entry.report, { fix: false });
                        sectionOpen.set('roles', true);
                        await saveLibrary();
                    } catch (error) {
                        toastr.warning(`Could not check the role fit: ${error?.message || error}`, 'Image Search');
                    } finally {
                        groupStep(entry, '');
                    }
                });
                main.push(fit);
            }
        }
        const moreRow = el('div', 'stis-more-row');
        moreRow.append(...actions.filter(button => !main.includes(button)));
        moreRow.hidden = !moreOpen;
        const moreButton = el('div', 'menu_button stis-more-button');
        moreButton.appendChild(el('i', 'fa-solid fa-ellipsis'));
        moreButton.title = 'More: redo all, lock, delete…';
        moreButton.classList.toggle('stis-more-on', moreOpen);
        moreButton.addEventListener('click', () => {
            moreOpen = !moreOpen;
            moreRow.hidden = !moreOpen;
            moreButton.classList.toggle('stis-more-on', moreOpen);
        });
        const actionRow = el('div', 'stis-actions');
        actionRow.append(...main, moreButton);
        bar.after(actionRow);
        actionRow.after(moreRow);
        tagSection(current?.tags?.length ? current.tags : entry.tags, below, true, multi ? entry.removedTags : null, async tag => {
            const removed = entry.removedTags?.[tag];
            if (removed?.by === 'ai' && !removed.confirmed) {
                saveRemovalNote(tag, { wrong: true, reason: 'the user put it back', kind: groupWhat(entry) });
            }
            restoreTag(entry, tag);
            await saveLibrary();
            if (!closed && previewState?.target === entry) {
                showEntry(entry, current);
                renderLibrary();
            }
        });
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
        const groups = [['check', 'Check', ui.libFilters], ['file', 'Type', ui.libFilters], ['pose', 'Pose', ui.libFilters], ['mood', 'Mood', ui.libFilters], ...categories().map(category => [category.id, category.label, more])];
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

    const LIB_ORDERS = [['fit', 'Best fit', 'Pictures that fit the chat and the tags first'], ['new', 'Newest', 'Last saved first'], ['used', 'Last used', 'Last sent first']];

    const LIB_KINDS = [['all', 'All'], ['single', 'Singles'], ['set', 'Sets'], ['sequence', 'Sequences']];

    function kindOf(entry) {
        return isMulti(entry) ? entry.kind : 'single';
    }

    function renderLibBar() {
        ui.libOrder.innerHTML = '';
        const kind = LIB_KINDS.some(([key]) => key === s.libKind) ? s.libKind : 'all';
        const kinds = el('span', 'stis-lib-kinds');
        for (const [key, label] of LIB_KINDS) {
            const chip = el('span', 'stis-fchip stis-lib-kind', label);
            chip.dataset.kind = key;
            chip.classList.toggle('stis-fchip-on', key === kind);
            chip.addEventListener('click', () => {
                s.libKind = key;
                save();
                ui.libGrid.scrollTop = 0;
                renderLibrary();
            });
            kinds.appendChild(chip);
        }
        ui.libOrder.appendChild(kinds);
        ui.libOrder.appendChild(el('small', 'stis-lib-filter-label', 'Order'));
        const order = LIB_ORDERS.some(([key]) => key === s.libOrder) ? s.libOrder : 'fit';
        for (const [key, label, title] of LIB_ORDERS) {
            const chip = el('span', 'stis-fchip', label);
            chip.title = title;
            chip.classList.toggle('stis-fchip-on', key === order);
            chip.addEventListener('click', () => {
                s.libOrder = key;
                save();
                ui.libGrid.scrollTop = 0;
                renderLibrary();
            });
            ui.libOrder.appendChild(chip);
        }
        ui.libClear.hidden = !libFilter.size && !ui.libSearch.value.trim() && (!s.libKind || s.libKind === 'all');
        ui.libSize.innerHTML = '';
        ui.libSize.appendChild(el('i', s.libSmall ? 'fa-solid fa-table-cells-large' : 'fa-solid fa-table-cells'));
        ui.libSize.title = s.libSmall ? 'Bigger pictures, 2 per row' : 'Smaller pictures, 3 per row';
        ui.libGrid.classList.toggle('stis-grid-small', Boolean(s.libSmall));
    }

    function orderEntries(ranked) {
        const time = entry => (s.libOrder === 'used' ? entry.lastUsed || 0 : entry.added || 0);
        return s.libOrder === 'new' || s.libOrder === 'used' ? [...ranked].sort((a, b) => time(b.entry) - time(a.entry) || (b.entry.added || 0) - (a.entry.added || 0)) : ranked;
    }

    async function renderLibrary() {
        await loadLibrary();
        if (closed) {
            return;
        }
        updateLibraryTab();
        renderLibFilters();
        renderLibBar();
        const scroll = ui.libGrid.scrollTop;
        ui.libGrid.innerHTML = '';
        const query = [...wordsOf(ui.libSearch.value)];
        let ranked = rankEntries(library.entries, { text: recentText(2), tags, character: selectedLookName() || ctx().name2 || '' });
        if (query.length) {
            ranked = ranked.filter(({ entry }) => {
                const hay = `${entry.tags.join(' ')} ${entry.description} ${entry.variants.map(variant => `${variant.diff} ${variant.description}`).join(' ')} ${entry.characters.join(' ')} ${entry.card ? cardToText(entry.card) : ''}`.toLowerCase().replace(/_/g, ' ');
                return query.every(word => hay.includes(word));
            });
        }
        if (libFilter.size) {
            ranked = ranked.filter(({ entry }) => {
                const facets = entryFacets(entry);
                return [...libFilter].every(key => facets.includes(key));
            });
        }
        if (s.libKind && s.libKind !== 'all') {
            ranked = ranked.filter(({ entry }) => kindOf(entry) === s.libKind);
        }
        ranked = orderEntries(ranked);
        libraryOrder = ranked.map(({ entry }) => entry);
        if (!ranked.length) {
            const message = library.broken ? 'The library could not be read.' : library.entries.length ? 'Nothing matches. Clear all shows the whole library.' : 'Pictures you pick are saved here.';
            ui.libGrid.appendChild(el('div', 'stis-status', message));
            return;
        }
        libMedia?.close();
        libMedia = gridMedia(ui.libGrid, s.libAnimate !== false);
        for (const entry of libraryOrder) {
            const cell = el('div', 'stis-cell');
            const img = el('img');
            img.alt = '';
            img.draggable = false;
            img.dataset.full = entry.url;
            img.onerror = () => cell.classList.add('stis-broken');
            cell.title = shortDescription(entry);
            cell.dataset.entry = entry.id;
            cell.appendChild(img);
            const moves = entry.animated || itemAnimated(entry, entry);
            libMedia.add(img, moves);
            if (!libMedia.animates && (moves || entry.variants.some(item => itemAnimated(entry, item)))) {
                const moving = el('span', 'stis-anim-badge');
                moving.appendChild(el('i', 'fa-solid fa-play'));
                moving.title = 'Animated (GIF): it plays in the preview';
                cell.appendChild(moving);
            }
            if (groupProgress.has(entry.id)) {
                cellProgress(cell, groupProgress.get(entry.id));
            }
            if (isMulti(entry)) {
                const badge = el('span', 'stis-set-badge');
                badge.appendChild(el('i', entry.kind === 'sequence' ? 'fa-solid fa-film' : 'fa-solid fa-clone'));
                badge.appendChild(document.createTextNode(` ${entry.variants.length}`));
                badge.title = entry.kind === 'sequence' ? 'Sequence' : 'Set of versions';
                cell.appendChild(badge);
            }
            if (entry.lock || (isMulti(entry) && entry.variants.some(item => item.lock))) {
                const locked = el('span', 'stis-lock-badge');
                locked.appendChild(el('i', 'fa-solid fa-lock'));
                locked.title = entry.lock ? 'Description locked' : 'Some items have a locked description';
                cell.appendChild(locked);
            }
            if (!entry.attention && isMulti(entry) && (entry.variants.some(item => item.deduced?.length) || Object.values(entry.removedTags || {}).some(removed => removed.by === 'ai' && !removed.confirmed))) {
                const flag = el('span', 'stis-attention-badge stis-deduced-badge');
                flag.appendChild(el('i', 'fa-solid fa-wand-magic-sparkles'));
                flag.title = 'Some tags were deduced from your notes; check them in the preview';
                cell.appendChild(flag);
            }
            if (entry.attention) {
                const flag = el('span', 'stis-attention-badge');
                flag.appendChild(el('i', 'fa-solid fa-triangle-exclamation'));
                flag.title = `Needs a look: ${entry.attention.tags.join(', ').replace(/_/g, ' ') || 'tags not found in any item'}`;
                cell.appendChild(flag);
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
        releaseMedia(ui.preview);
        ui.preview.innerHTML = '';
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
    ui.libClear.addEventListener('click', () => {
        clearTimeout(libTimer);
        ui.libSearch.value = '';
        libFilter.clear();
        s.libKind = 'all';
        ui.libGrid.scrollTop = 0;
        renderLibrary();
    });
    ui.libSize.addEventListener('click', () => {
        s.libSmall = !s.libSmall;
        save();
        renderLibBar();
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
        touchX = event.target?.closest?.('.stis-variants, .stis-entry-info, .stis-tagbox, .stis-clip, .stis-card, .stis-video-tools, .stis-parts, video') ? null : touch.clientX;
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
            libMedia?.close();
            dropThumbJobs();
            dropFirefoxBlobs();
            lengthWatch.disconnect();
            lengthQueue.length = 0;
            groupWatch.disconnect();
            groupQueue.length = 0;
            releaseMedia(ui.root);
            decoder.note = null;
            idleDecoder(5000);
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
                        <details class="stis-set stis-prompt-parts" id="st_imagesearch_pixiv_box">
                            <summary class="stis-label">Pixiv</summary>
                            <small class="stis-help">Pixiv has no public way in for programs, so it goes through the Pixiv bridge: a small plugin in SillyTavern's server that uses your own Pixiv login and says honestly what it is. It asks Pixiv only when you search, open a work or save one, one request at a time and spaced out; searches are kept for 15 minutes, it pauses by itself when Pixiv asks it to slow down, and it stops at the daily limit below. Pixiv is a choice of its own in the picker and never part of All sites. Your login stays on the server, in SillyTavern's data folder.</small>
                            <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_pixiv"> <span>Search Pixiv</span></label>
                            <small id="st_imagesearch_pixiv_status" class="stis-help"></small>
                            <div class="st-imagesearch-row"><input type="password" id="st_imagesearch_pixiv_cookie" class="text_pole" placeholder="PHPSESSID" autocomplete="off"><div id="st_imagesearch_pixiv_login" class="menu_button">Log in</div><div id="st_imagesearch_pixiv_logout" class="menu_button">Log out</div></div>
                            <small class="stis-help">Your login is the PHPSESSID cookie of a browser where you are logged in to Pixiv (on a computer: open pixiv.net, press F12, Storage or Application → Cookies → www.pixiv.net → PHPSESSID, copy its value). It looks like 12345678_AbCdEf…. Without it, Pixiv shows no R-18 works and no bookmarks or follows. For R-18, also turn it on in your Pixiv account settings.</small>
                            <div class="st-imagesearch-row"><span>Pixiv requests a day, at most</span><input type="number" min="20" max="5000" id="st_imagesearch_pixiv_limit" class="text_pole"></div>
                            <div id="st_imagesearch_pixiv_check" class="menu_button">Check the bridge</div>
                        </details>
                        <details class="stis-set stis-prompt-parts">
                            <summary class="stis-label">Tags across sites</summary>
                            <small class="stis-help">Each site has its own words: uzumaki_naruto on one, naruto_uzumaki on another, female instead of 1girl on e621. Before a search, each required tag is checked on each site; when the site does not use it, its own word is found from the other order of a two-part name, your links ("Same tag, written differently"), the site's aliases, and last the Tag model choosing among the site's real tags. What is found is remembered here; when a site has no word for a required tag, the search there goes on with the tag as typed and the status line says so. Preferred and left-out tags only use what is already known.</small>
                            <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_spell_ai"> <span>Ask the Tag model when a site has no such tag</span></label>
                            <div id="st_imagesearch_spellings" class="stis-tag-notes"></div>
                            <div class="stis-label">Prompt (to the Tag model)</div>
                            <textarea id="st_imagesearch_spell_prompt" class="text_pole" rows="6"></textarea>
                            <small class="stis-help">Filled in: {{tag}}, {{meaning}} (the tag's wiki definition, when known), {{site}}, {{candidates}} (the site's real tags that share a word with it). {{#meaning}}…{{/meaning}}: only when there is one. The answer is one tag from the list, or none.</small>
                            <div id="st_imagesearch_spell_prompt_reset" class="menu_button">Reset this prompt</div>
                        </details>
                        <div class="stis-set">
                            <div class="st-imagesearch-row"><span>Danbooru account</span><input type="text" id="st_imagesearch_danbooru_account" class="text_pole" placeholder="name or user ID"></div>
                            <small class="stis-help">Danbooru asks programs to say whose they are, and puts programs that pretend to be a browser through a check. With your account, SillyTavern's server tells Danbooru it is SillyImageSearch for your account number, as Danbooru asks. Your name is enough; no API key is needed. Works in Firefox; Chrome does not let pages say this.</small>
                            <small id="st_imagesearch_danbooru_status" class="stis-help"></small>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Site accounts</div>
                            <small class="stis-help">For a site that refuses SillyTavern's server (403) or asks for a key: make an account there, copy the API key from your account settings on the site, and put it here with your name (on Gelbooru, your user ID). It stays in your settings. It is sent the way that kind of site expects (Danbooru and e621: login and api_key; Gelbooru: user_id and api_key; Moebooru: login and password_hash; Philomena: key), and SillyTavern's server tells the site honestly that it is SillyImageSearch for your account. A key already written on a site's line in the list above is used as it is.</small>
                            <div id="st_imagesearch_accounts" class="stis-accounts"></div>
                            <small id="st_imagesearch_firefox_status" class="stis-help"></small>
                            <small class="stis-help">"Through Firefox": for a site whose Cloudflare check stops SillyTavern's server, the SillyImageSearch Fetcher add-on asks it from Firefox itself, with your browser and the pass you got there, as if you browsed the site. It only asks when you search, one request a second, and only sites you allowed in it. When the pass runs out, Firefox opens the site for a moment so you can pass the check, then comes back. The add-on is in the extension's folder firefox-fetcher; how to install it is in the README.</small>
                            <div id="st_imagesearch_check_sites" class="menu_button">Check every site</div>
                            <small class="stis-help">Tries one small search on each site in the list (or tap Check on one site) and says what each one needs and how SillyTavern's server said who was asking. A site behind a Cloudflare check cannot be reached by SillyTavern's server; an account sometimes lets it through, otherwise only the site can.</small>
                            <div id="st_imagesearch_site_report" class="stis-site-report"></div>
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
                        <div class="stis-set"><div class="st-imagesearch-row stis-range-row"><span>Finding parts</span><input type="range" min="1" max="5" step="1" id="st_imagesearch_split_sense"><b id="st_imagesearch_split_sense_value" class="stis-range-value"></b></div><small class="stis-help">How easily "Find parts" sees a loop in a video. Strict finds fewer loops and makes fewer mistakes; loose finds loops that change a little. Parts that are not loops are at most the GIF length above.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row stis-range-row"><span>Loop repeats in a GIF</span><input type="range" min="1" max="5" step="1" id="st_imagesearch_loop_repeats"><b id="st_imagesearch_loop_repeats_value" class="stis-range-value"></b></div><small class="stis-help">When "Find parts" finds a loop, its GIF holds this many full turns of it (fewer if they do not fit in the GIF length), cut so it loops without a jump.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Reading videos</span><select id="st_imagesearch_video_reader" class="text_pole"><option value="auto">Automatic</option><option value="browser">The browser</option><option value="software">Built-in reader</option></select></div><small class="stis-help">Making GIFs and finding parts need the pictures of the video. Some browsers cannot give them (Firefox for Android gives black or purple). The built-in reader always works and is faster: it is downloaded once (32 MB) and kept. Automatic uses it, and uses the browser only if it cannot be downloaded.</small></div>
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
                        <div class="stis-set"><div class="stis-label">Library backups</div><div id="st_imagesearch_backups" class="stis-backups"></div><div id="st_imagesearch_backup_now" class="menu_button">Back up now</div><small class="stis-help">The last 3 copies of the library: descriptions, roles, locks and notes, not the picture files. A copy is made at the first save after 12 hours (not when the library suddenly lost most of its pictures). Restore puts one back; the library as it was is kept in imagesearch-library-before-restore.json.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_lib_animate"> <span>Play GIFs in the library</span></label><small class="stis-help">Only the ones on screen play (6 at most); the others show a small still copy, so a big library does not run the phone out of memory. Off: still copies only, with a play badge, the lightest.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_keep_files"> <span>Keep library files when a picture is deleted from a message</span></label><small class="stis-help">SillyTavern's "Delete media from message?" ticks "Also delete files from server" by default. On: it is unticked when the message has a picture from your library, so the library keeps its file (tick it to delete anyway). If a library file is gone, open the picture on its site in the picker and tap "Download again": it comes back with its description.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_attach"> <span>Attach saved pictures to messages</span></label><small class="stis-help">So vision models can see them.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_hunt"> <span>Find tags for tag-poor pictures</span></label><small class="stis-help">When a saved picture has fewer than ${FEW_TAGS} tags, look for it on your other sites (and on Danbooru when your Danbooru account is set) and take their tags before describing it. It searches the artist with each other tag, compares 4 frames of a GIF, then asks the vision model for a few specific tags to try.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_hunt_iqdb"> <span>Also ask IQDB</span></label><small class="stis-help">A free lookalike search, when the picture is not found on your sites.</small></div>
                        <div class="stis-set st-imagesearch-library">
                            <div id="st_imagesearch_lib_count" class="stis-label">Library</div>
                            <div class="st-imagesearch-row stis-wrap">
                                <div id="st_imagesearch_redo_all" class="menu_button" title="Describe every saved picture again with the vision model">Redo all descriptions</div>
                                <div id="st_imagesearch_redo_old" class="menu_button" title="Describe again only the pictures described with an older description prompt, and the sets and sequences that still have one description for all their items or no story lines">Redo out-of-date descriptions</div>
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
                        <div class="stis-set"><div class="st-imagesearch-row stis-range-row"><span>GIF frames sent</span><input type="range" min="1" max="32" step="1" id="st_imagesearch_gif_frames"><b id="st_imagesearch_gif_frames_value" class="stis-range-value"></b></div><small class="stis-help">Spread from the start to the end of the GIF. More frames show more of the motion, and cost more. On a sheet, frames go 4 to a picture (2×2) so each stays big, numbered in order across the pictures.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Most pictures in one request</span><input type="number" min="1" max="16" id="st_imagesearch_max_pictures" class="text_pole"></div><small class="stis-help">Frames are cut to fit (4 per picture on a sheet), and the second look sends fewer items at once. Lower it if your vision model refuses many pictures.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>GIF frame size</span><select id="st_imagesearch_gif_size" class="text_pole"><option value="384">384 px (cheapest)</option><option value="512">512 px</option><option value="768">768 px (default)</option><option value="1024">1024 px</option><option value="1536">1536 px</option><option value="2048">2048 px (most detail)</option></select></div></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_gif_sheet"> <span>GIF frames on sheets</span></label><small class="stis-help">On: 4 frames per numbered picture (2×2), so up to 32 frames fit in 8 pictures. Off: one picture per frame, so at most as many frames as "Most pictures in one request".</small></div>
                        <div class="stis-set">
                            <div class="stis-label">Description prompt</div>
                            <textarea id="st_imagesearch_vision_prompt" class="text_pole"></textarea>
                            <small class="stis-help">{{tags}} is filled in.</small>
                            <div id="st_imagesearch_vision_reset" class="menu_button">Reset description prompt</div>
                        </div>
                        <details class="stis-set stis-prompt-parts">
                            <summary class="stis-label">The rest of the description prompt</summary>
                            <small class="stis-help">Everything else the vision model gets around your description prompt ("What the AI saw" shows how it all comes together). Left empty or reset, the default is used. A part between {{#name}} and {{/name}} is only kept when that thing applies.</small>
                            <div class="stis-label">GIF note (at the very top, for GIFs)</div>
                            <textarea id="st_imagesearch_gif_note" class="text_pole" rows="5"></textarea>
                            <small class="stis-help">Filled in: {{frames}} (how many moments and how they are laid out), {{seconds}} (the GIF's length), {{apart}} (seconds between moments). {{#seconds}}…{{/seconds}}: only when the length is known; {{#loop}}…{{/loop}}: only for a GIF whose last moment matches its first; {{#long}}…{{/long}}: only for GIFs of 5 s or more.</small>
                            <div id="st_imagesearch_gif_note_reset" class="menu_button">Reset GIF note</div>
                            <div class="stis-label">Rules after the description prompt (every picture)</div>
                            <textarea id="st_imagesearch_describe_rules" class="text_pole" rows="8"></textarea>
                            <small class="stis-help">Filled in: {{tag_info}} (the definitions and your notes for the picture's important tags), {{tag_count}} (who the tags count). {{#tag_count}}…{{/tag_count}}: only when the tags count people.</small>
                            <div id="st_imagesearch_describe_rules_reset" class="menu_button">Reset rules</div>
                            <div class="stis-label">What the look at the whole sequence saw (new sequence steps)</div>
                            <textarea id="st_imagesearch_board_note" class="text_pole" rows="6"></textarea>
                            <small class="stis-help">Given to each item of a sequence. Filled in: {{who}}, {{what}}, {{just_before}} and {{before_number}} (the item before), {{just_after}} and {{after_number}} (the item after).</small>
                            <div id="st_imagesearch_board_note_reset" class="menu_button">Reset this part</div>
                            <div class="stis-label">Loop note (new sequence steps)</div>
                            <textarea id="st_imagesearch_loop_note" class="text_pole" rows="6"></textarea>
                            <small class="stis-help">Given to an item of a sequence that is a loop (its last moment matches its first, or you set it in Edit role). An item that is not a loop only gets the plain facts ("The item before is a loop. This item is not a loop. The item after is…"). {{#before_loop}}…{{/before_loop}} and {{#before_not_loop}}…{{/before_not_loop}}: the item before; {{#after_loop}}…{{/after_loop}} and {{#after_not_loop}}…{{/after_not_loop}}: the item after (an item whose loop is not known shows neither); {{#first}}…{{/first}}, {{#last}}…{{/last}}; {{number}}.</small>
                            <div id="st_imagesearch_loop_note_reset" class="menu_button">Reset the loop note</div>
                            <div class="stis-label">Looking again at an item (new sequence steps)</div>
                            <textarea id="st_imagesearch_again_prompt" class="text_pole" rows="8"></textarea>
                            <small class="stis-help">Used when an item is looked at again to fix its role, a problem from the final check or a tag from your notes. Filled in: {{description}} (its description so far), {{asks}} (what to fix), {{prompt}} (the whole description prompt), {{first_tag}} with {{#several}}…{{/several}} for the "Checked:" line (keep "Checked:" so the answer can be read).</small>
                            <div id="st_imagesearch_again_prompt_reset" class="menu_button">Reset this part</div>
                        </details>
                        <div class="stis-set"><div class="stis-label">Sets and sequences</div><small class="stis-help">Each item gets its own description, made with the tags it shows and the item before it, then a role and a story line. About 2 requests per item, plus 3.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_sequence_v3"> <span>New sequence steps (v3)</span></label><small class="stis-help">Sequences only. One look at all the items together first (who is there, what happens, which tags each item shows), then each item is described knowing where it sits in the story. The story uses your prompt. Role fit, your notes and the final check only collect what needs fixing; then each item that needs it is looked at again once, and the story lines rewritten once. Off: the steps below, as before.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_group_blind"> <span>First look without tags</span></label><small class="stis-help">The vision model lists what it sees in each item without the tags, so each tag goes to the items that show it. Tags it misses are looked for again in all items.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_group_in_text"> <span>Tags in the descriptions</span></label><small class="stis-help">After the items are described, one text request reads the descriptions for the tags still not found: a tag they already show, in any words and even if a detail differs, goes to those items without changing their descriptions, so it is not judged as missing.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_group_story"> <span>Story lines</span></label><small class="stis-help">Sequences only. One text request (tag profile) reads all the descriptions and gives each item an intensity, a role (main and finer, like climax, finishing blow) and a line on what the moment means: what was happening, what is happening, and so what. Sets are versions to use on their own, so they get no roles.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_group_deduce"> <span>Deduce tags nobody saw</span></label><small class="stis-help">When a tag found in no item has notes from you (below), one text request reads the story lines and your notes and places it where it most likely happens, even off screen; a lasting one stays for the items after. Deduced tags are marked in the library so you can tell it when it is wrong.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_group_review"> <span>Final check</span></label><small class="stis-help">One more request reads all the descriptions together, writes the overview and points out mistakes; items with a mistake are described once more.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_group_importance"> <span>Judge tags not found</span></label><small class="stis-help">When tags are in no item, the prompt below decides whether they matter. If they do, the group is marked "Needs a look" in the library (filter: Check).</small></div>
                        <div class="stis-set">
                            <div class="stis-label">Prompt for tags not found</div>
                            <textarea id="st_imagesearch_importance_prompt" class="text_pole"></textarea>
                            <small class="stis-help">Filled in: {{kind}} (what the group is), {{count}}, {{items}} (what each item shows), {{tags}} (all its tags), {{missing}} (the tags not found), {{overview}}. The answer needs a "tag: important" or "tag: minor" line per tag and a "Verdict: needs a look" or "Verdict: fine" line.</small>
                            <div id="st_imagesearch_importance_reset" class="menu_button">Reset this prompt</div>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Story prompt (sequences)</div>
                            <textarea id="st_imagesearch_story_prompt" class="text_pole"></textarea>
                            <small class="stis-help">Filled in: {{kind}}, {{count}}, {{items}} (each item's tags and description, with the part's place in the video), {{tags}}. The answer needs one line per item, like "2. main action, climax: ...".</small>
                            <div id="st_imagesearch_story_reset" class="menu_button">Reset this prompt</div>
                            <div class="stis-label">Story hint when only one item isn't a loop (new sequence steps)</div>
                            <textarea id="st_imagesearch_one_moving" class="text_pole" rows="3"></textarea>
                            <small class="stis-help">Added after your story prompt when every item but one is a loop (detected, or set by you in Edit role). Filled in: {{item}} (the item that isn't a loop).</small>
                            <div id="st_imagesearch_one_moving_reset" class="menu_button">Reset this hint</div>
                        </div>
                        <div class="stis-set">
                            <label class="checkbox_label"><input type="checkbox" id="st_imagesearch_group_role_fit"> <span>Role fit</span></label>
                            <div class="stis-label">Role rules</div>
                            <textarea id="st_imagesearch_role_rules" class="text_pole" placeholder="build-up: never the finishing move or the outcome; if it looks like it, it is most likely the wind-up or a feint"></textarea>
                            <small class="stis-help">Right after the story lines, one text request checks each item's description against its role with these rules (roles are trusted). Items that do not fit are described again as their role, then the story lines are rewritten with the roles kept. Empty = skipped.</small>
                        </div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_role_check"> <span>Intensity check (for testing)</span></label><small class="stis-help">Adds "Check intensity" to a sequence in the library: it runs only the story step on the descriptions it already has (one quick text request, no pictures) and stops there. The preview then shows each item's intensity with its reason and which one became the climax, then the roles, the exact prompt sent and the answer, so you can tweak the story prompt above and check again.</small></div>
                        <div class="stis-set">
                            <div class="stis-label">Tags that matter</div>
                            <textarea id="st_imagesearch_tags_matter" class="text_pole" placeholder="one per line"></textarea>
                            <div class="stis-label">Tags that do not matter</div>
                            <textarea id="st_imagesearch_tags_dont_matter" class="text_pole" placeholder="one per line"></textarea>
                            <small class="stis-help">Filled in when you sort the tags not found in a group (Important, Doesn't matter). A tag not found that is on these lists is judged by your choice without asking; the others are judged with these lists as examples.</small>
                        </div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_group_link"> <span>Link tags written differently</span></label><small class="stis-help">After the first look, a real tag also counts as seen when the first look wrote it another way: from the links below, then the site's aliases (fetched once), then, only for important tags still not found, one text request that links them. Links are remembered, so next time the tag is matched at once.</small></div>
                        <div class="stis-set">
                            <div class="stis-label">Same tag, written differently</div>
                            <div id="st_imagesearch_tag_links" class="stis-tag-notes"></div>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Corrections without a tag</div>
                            <div id="st_imagesearch_fix_log" class="stis-tag-notes"></div>
                            <small class="stis-help">Kept as a record only: the picture is fixed and keeps your correction for its later redos.</small>
                        </div>
                        <div class="stis-set">
                            <div class="stis-label">Important tags</div>
                            <div id="st_imagesearch_tag_notes" class="stis-tag-notes"></div>
                            <small class="stis-help">Each tag that matters, with its definition copied from the site's wiki (read only, first in every check) and what you wrote: where you placed it and why, corrections, deductions you confirmed or marked wrong, and when it did not apply (the last 12 of each). Edit, remove or add notes.</small>
                        </div>
                    </div>
                </details>
                <details class="stis-section" data-section="send">
                    <summary><span class="stis-section-title">Picture send</span><small class="stis-section-sum" data-sum="send"></small></summary>
                    <div class="stis-section-body">
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_sendbutton"> <span>Picture button next to Send</span></label></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_confirmpic"> <span>Show the picture before sending</span></label></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_pickwindow"> <span>Ask for the main focus first</span></label><small class="stis-help">Who the picture is about, who else may be in it, and what you want the picture to be about.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_pick_mix"> <span>Suggest ways to bring it in</span></label><small class="stis-help">After you choose the picture, the Tag model reads the story, what is in the chat box, what you want and the whole picture description, and writes 3 ways for the story to get there. Edit one, write your own, or send without. The window that asks for the main focus can turn it off for one send. A swipe or regenerate of that reply sends exactly the same again.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_inline"> <span>Pictures between the lines</span></label><small class="stis-help">The reply's AI writes [picture] where the picture belongs, and the picture is shown there instead of under the message. If it forgets, the picture stays under the message. Pictures in your own message, and the ones the AI shows on its own, go where they were written too.</small></div>
                        <details class="stis-set stis-prompt-parts">
                            <summary class="stis-label">Picture send prompts</summary>
                            <div class="stis-label">Reply instruction (to the reply's AI)</div>
                            <textarea id="st_imagesearch_force_prompt" class="text_pole" rows="8"></textarea>
                            <small class="stis-help">Filled in: {{picture}} (the picture's whole description), {{lead}} (the way in you chose), {{continues}} (where the picture is in a sequence already shown in this chat, and what the picture before it was), {{user}}, {{char}}. {{#marker}}…{{/marker}}: only when "Pictures between the lines" is on (keep [picture] in it, it is how the place is found); {{#lead}}…{{/lead}}: only when you chose a way in; {{#continues}}…{{/continues}}: only when the picture continues a sequence.</small>
                            <div id="st_imagesearch_force_prompt_reset" class="menu_button">Reset this prompt</div>
                            <div class="stis-label">Ways in (to the Tag model)</div>
                            <textarea id="st_imagesearch_lead_prompt" class="text_pole" rows="10"></textarea>
                            <small class="stis-help">Filled in: {{story}}, {{typed}} (the chat box), {{wish}} (what you want), {{picture}}, {{focus}} (the main focus), {{looks}}, {{next}} (the next item of a sequence), {{continues}} (where the picture is in a sequence already shown in this chat), {{user}}, {{char}}. {{#typed}}…{{/typed}}, {{#wish}}…{{/wish}}, {{#focus}}…{{/focus}}, {{#continues}}…{{/continues}} and {{#next}}…{{/next}}: only when there is one. The answer needs lines like "1. …".</small>
                            <div id="st_imagesearch_lead_prompt_reset" class="menu_button">Reset this prompt</div>
                        </details>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Pictures the AI compares</span><input type="number" min="5" max="60" id="st_imagesearch_pick_shortlist" class="text_pole"></div><small class="stis-help">Fewer is faster; a good picture ranked lower is not seen by the AI.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Search by meaning</span><select id="st_imagesearch_meaning" class="text_pole"><option value="nanogpt">NanoGPT (uses your NanoGPT key)</option><option value="transformers">Local, on the SillyTavern server (free, slow on phones, downloads a model the first time)</option><option value="openai">OpenAI (needs an OpenAI key in SillyTavern)</option><option value="off">Off (keywords only)</option></select></div></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Embedding model</span><input type="text" id="st_imagesearch_meaning_model" class="text_pole" placeholder="text-embedding-3-small"></div><small class="stis-help">Empty = the default.</small></div>
                        <div class="stis-set"><div class="st-imagesearch-row"><span>Kept before meaning ranking</span><input type="number" min="5" max="500" id="st_imagesearch_first_pass" class="text_pole"></div><small class="stis-help">The best pictures by looks and keywords that go on to be ranked by meaning.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_aishow"> <span>AI may show pictures</span></label><small class="stis-help">Saved pictures are offered through the lorebook "${LOREBOOK}": one entry per picture, triggered by its keywords, at most one per reply. Keep that lorebook on; your keyword edits are kept.</small></div>
                        <div class="stis-set"><label class="checkbox_label"><input type="checkbox" id="st_imagesearch_groups_lore"> <span>Also offer sets and sequences</span></label><small class="stis-help">Off: only single pictures are in the lorebook, and sets and sequences come only through the picture send. On: each set or sequence gets one entry with a line per item.</small></div>
                        <details class="stis-set stis-prompt-parts">
                            <summary class="stis-label">Lorebook rule</summary>
                            <textarea id="st_imagesearch_show_rule" class="text_pole" rows="7"></textarea>
                            <small class="stis-help">Starts every picture entry in the lorebook "${LOREBOOK}" and the list of pictures always listed: it tells the AI how to show a picture. Keep [pic:…] in it. Changes reach the lorebook a moment after you stop typing.</small>
                            <div id="st_imagesearch_show_rule_reset" class="menu_button">Reset this prompt</div>
                        </details>
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
                            <div class="st-imagesearch-row"><span>Most another person can add (side people and people partly in view together, too)</span><input type="number" id="st_imagesearch_rule_extra" class="text_pole"></div>
                            <div class="st-imagesearch-row"><span>Looks weight, % (100 = as is; lower lets what happens count more than looks)</span><input type="number" min="0" max="100" id="st_imagesearch_looks_weight" class="text_pole"></div>
                            <small class="stis-help">Only the main person of a picture can lower its score. Side people and people only partly in view are filled with the categories ticked "Also for side people" and can only add points.</small>
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
                        <div class="stis-set">
                            <div class="stis-label">Ratings it may send</div>
                            <div class="st-imagesearch-row stis-wrap" id="st_imagesearch_send_ratings"></div>
                            <small class="stis-help">Every filing card gets a rating, judged on everything the picture shows: nudity and sex, but also violence, blood, gore and anything disturbing. A picture or item whose rating is not ticked is never sent, offered in the lorebook or shown to the AI that picks. Pictures without a card yet are not held back.</small>
                        </div>
                        <details class="stis-set stis-prompt-parts">
                            <summary class="stis-label">Filing prompts</summary>
                            <div class="stis-label">Making cards</div>
                            <textarea id="st_imagesearch_card_prompt" class="text_pole" rows="10"></textarea>
                            <small class="stis-help">Filled in: {{poses}}, {{moods}}, {{fields}} (the person categories), {{sidefields}} (those ticked for side people), {{scene}} (the picture categories), {{pictures}} (the batch). {{#scene}}…{{/scene}}: only when there are picture categories. The JSON shape of the answer is added after your text.</small>
                            <div id="st_imagesearch_card_prompt_reset" class="menu_button">Reset this prompt</div>
                            <div class="stis-label">Updating cards (after a category changes)</div>
                            <textarea id="st_imagesearch_card_update_prompt" class="text_pole" rows="6"></textarea>
                            <small class="stis-help">Filled in: {{fields}}, {{scene}}, {{pictures}}. {{#fields}}…{{/fields}} and {{#scene}}…{{/scene}}: only when there are some.</small>
                            <div id="st_imagesearch_card_update_prompt_reset" class="menu_button">Reset this prompt</div>
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
        danbooruStatus.textContent = !account ? '' : danbooruIdentity.pending ? `Looking up ${account}…` : danbooruIdentity.id && danbooruIdentity.account === account ? (canSetAgent() ? `Danbooru sees: ${danbooruAgent()}` : `Found user #${danbooruIdentity.id}, but this browser (Chrome and browsers built on it) does not let SillyTavern tell Danbooru, so Danbooru will still block pictures here. Use Firefox for Danbooru.`) : danbooruIdentity.error;
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
    const renderAccounts = () => {
        const box = document.getElementById('st_imagesearch_accounts');
        box.innerHTML = '';
        const entries = siteEntries();
        if (!entries.length) {
            box.appendChild(el('small', 'stis-help', 'Add sites to the list above first.'));
            return;
        }
        for (const entry of entries) {
            const saved = siteAccounts()[entry.domain] || {};
            const row = el('div', 'st-imagesearch-row stis-account');
            row.appendChild(el('span', 'stis-account-site', entry.domain));
            const login = el('input', 'text_pole');
            login.type = 'text';
            login.placeholder = 'name or user ID';
            login.value = saved.login || '';
            login.autocomplete = 'off';
            const key = el('input', 'text_pole');
            key.type = 'password';
            key.placeholder = 'API key';
            key.value = saved.key || '';
            key.autocomplete = 'off';
            const keep = () => {
                const name = login.value.trim();
                const secret = key.value.trim().replace(/^.*[?&](?:api_key|key|password_hash)=([^&\s]+).*$/, '$1');
                if (secret !== key.value.trim()) {
                    key.value = secret;
                }
                if (name || secret) {
                    siteAccounts()[entry.domain] = { login: name, key: secret };
                } else {
                    delete siteAccounts()[entry.domain];
                }
                delete s.engines[entry.domain];
                delete s.termLimits?.[entry.domain];
                clearTagCache();
                save();
            };
            login.addEventListener('change', keep);
            key.addEventListener('change', keep);
            const kind = el('select', 'text_pole');
            kind.title = 'What kind of board it is. Choosing it means the extension asks only that kind of address.';
            [['', 'Kind: find out by itself'], ...Object.entries(KIND_NAMES).map(([value, name]) => [value, `Kind: ${name}`])].forEach(([value, name]) => {
                const option = el('option', '', name);
                option.value = value;
                kind.appendChild(option);
            });
            kind.value = siteKind(entry.domain);
            kind.addEventListener('change', () => {
                s.siteKinds = { ...(s.siteKinds || {}) };
                if (kind.value) {
                    s.siteKinds[entry.domain] = kind.value;
                } else {
                    delete s.siteKinds[entry.domain];
                }
                delete s.engines[entry.domain];
                delete s.termLimits?.[entry.domain];
                clearTagCache();
                save();
            });
            const viaLabel = el('label', 'checkbox_label stis-account-via');
            const via = el('input');
            via.type = 'checkbox';
            via.checked = Boolean(s.viaFirefox?.[entry.domain]);
            via.addEventListener('change', () => {
                s.viaFirefox = { ...(s.viaFirefox || {}) };
                if (via.checked) {
                    s.viaFirefox[entry.domain] = true;
                } else {
                    delete s.viaFirefox[entry.domain];
                }
                delete s.engines[entry.domain];
                clearTagCache();
                save();
                showFirefox();
            });
            viaLabel.append(via, el('span', '', ' Through Firefox (needs the Fetcher add-on)'));
            const check = el('div', 'menu_button', 'Check');
            check.title = `Try one small search on ${entry.domain}`;
            const result = el('small', 'stis-site-line');
            check.addEventListener('click', async () => {
                keep();
                check.classList.add('disabled');
                await checkSite(siteEntries().find(item => item.domain === entry.domain) || entry, result);
                check.classList.remove('disabled');
            });
            row.append(login, key, kind, viaLabel, check, result);
            box.appendChild(row);
        }
    };
    const showFirefox = async () => {
        const line = document.getElementById('st_imagesearch_firefox_status');
        const wanted = Object.keys(s.viaFirefox || {}).filter(site => s.viaFirefox[site]);
        if (!wanted.length) {
            line.textContent = '';
            return;
        }
        const hello = await firefoxHello(true);
        line.textContent = hello.version ? `Fetcher add-on ${hello.version} found. Allowed in it: ${hello.sites?.length ? hello.sites.join(', ') : 'none yet (it asks the first time)'}.` : 'The Fetcher add-on did not answer: it is not installed in this Firefox, or SillyTavern is not on 127.0.0.1 or localhost.';
    };
    renderAccounts();
    showFirefox();
    document.getElementById('st_imagesearch_sites').addEventListener('change', renderAccounts);
    const checkSite = async (entry, line) => {
        const agent = agentFor(`https://${entry.domain}/`)['User-Agent'];
        const said = throughFirefox(`https://${entry.domain}/`) ? 'Asked through Firefox: your own browser and its pass, as if you browsed the site.' : accountFor(entry.domain) ? (agent ? `Sent as: ${agent}${/(?:api_key|key|password_hash)=/.test(siteEntries().find(item => item.domain === entry.domain)?.extra || '') || accountFor(entry.domain)?.key ? ', with your key' : ''}.` : 'This browser does not let pages say who is asking, so it went as your browser.') : DONMAI.test(entry.domain) && agent ? `Sent as: ${agent}.` : 'No account for it, so it went as your browser.';
        line.textContent = `${entry.domain}: checking…`;
        delete s.engines[entry.domain];
        let verdict;
        const tried = [];
        try {
            const engineName = await engineOf(entry, []);
            (siteProbes[entry.domain] || []).forEach(probe => tried.push(`${probe.kind} (${probe.address}): ${probe.answer}`));
            if (!engineName || engineName === 'none') {
                verdict = siteVerdict(siteAnswers[entry.domain] || 'not a kind of image board the extension knows', entry.domain);
            } else {
                const fresh = siteEntries().find(item => item.domain === entry.domain) || entry;
                const engine = ENGINES[engineName];
                const address = shortAddress(engine.url(`https://${entry.domain}`, engine.tags([], s.ratings, false, excludedTags()), fresh.extra, 0));
                try {
                    const { items } = await fetchPage(fresh, engineName, [], 0, [], []);
                    tried.push(`${KIND_NAMES[engineName] || engineName} search (${address}): ${items.length} pictures`);
                    verdict = `works (${KIND_NAMES[engineName] || engineName}${accountFor(entry.domain) ? ', with your account' : ''}), ${items.length} pictures on a first page.`;
                } catch (error) {
                    tried.push(`${KIND_NAMES[engineName] || engineName} search (${address}): ${String(error?.message || error).replace(`${entry.domain} answered `, '')}`);
                    throw error;
                }
            }
        } catch (error) {
            verdict = siteVerdict(String(error?.message || error), entry.domain);
        }
        line.textContent = `${entry.domain}: ${verdict} ${said}${tried.length ? `\nTried:\n${tried.map(item => `• ${item}`).join('\n')}` : ''}`;
        save();
        showEngines();
    };
    document.getElementById('st_imagesearch_check_sites').addEventListener('click', async () => {
        const report = document.getElementById('st_imagesearch_site_report');
        report.innerHTML = '';
        for (const entry of siteEntries()) {
            const line = el('div', 'stis-site-line');
            report.appendChild(line);
            await checkSite(entry, line);
        }
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
    bind('st_imagesearch_keep_files', 'keepLibraryFiles', 'checked');
    bind('st_imagesearch_lib_animate', 'libAnimate', 'checked');
    const backupBox = document.getElementById('st_imagesearch_backups');
    const drawBackups = () => {
        backupBox.textContent = '';
        const list = libraryBackups();
        if (!list.length) {
            backupBox.appendChild(el('small', 'stis-help', 'No copy yet: the first one is made at the next save.'));
        }
        list.forEach(item => {
            const row = el('div', 'stis-backup-row');
            row.appendChild(el('span', '', `${new Date(item.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · ${item.count} picture${item.count === 1 ? '' : 's'}`));
            const restore = el('div', 'menu_button', 'Restore');
            confirmClicks(restore, 'Restore', 'Tap again to restore', async () => {
                restore.textContent = 'Restoring…';
                try {
                    const count = await restoreBackup(item.slot);
                    toastr.success(`Restored ${count} picture${count === 1 ? '' : 's'} from the copy of ${new Date(item.at).toLocaleString()}.`, 'Image Search');
                } catch (error) {
                    toastr.warning(String(error?.message || error), 'Image Search');
                }
                drawBackups();
            });
            row.appendChild(restore);
            backupBox.appendChild(row);
        });
    };
    drawBackups();
    const backupNow = document.getElementById('st_imagesearch_backup_now');
    backupNow.addEventListener('click', async () => {
        if (backupNow.textContent !== 'Back up now') {
            return;
        }
        backupNow.textContent = 'Backing up…';
        try {
            await backUpNow();
            toastr.success('The library is backed up.', 'Image Search');
        } catch (error) {
            toastr.warning(String(error?.message || error), 'Image Search');
        }
        backupNow.textContent = 'Back up now';
        drawBackups();
    });
    bind('st_imagesearch_aishow', 'aiShow', 'checked', () => scheduleLorebookSync({ activate: true }));
    bind('st_imagesearch_spell_ai', 'spellAi', 'checked');
    const pixivBox = document.getElementById('st_imagesearch_pixiv');
    const pixivStatus = document.getElementById('st_imagesearch_pixiv_status');
    const pixivLimit = document.getElementById('st_imagesearch_pixiv_limit');
    const showPixiv = async () => {
        pixivStatus.textContent = 'Checking the bridge…';
        try {
            const st = await bridgeCall('/status');
            const who = st.loggedIn ? `logged in as ${st.userName || 'you'} (#${st.userId})` : 'not logged in (no R-18, bookmarks or follows)';
            const pause = st.pausedFor ? ` · paused ${Math.ceil(st.pausedFor / 60)} min (Pixiv asked)` : '';
            pixivStatus.textContent = `Bridge ${st.version} running · ${who} · ${st.today} of ${st.limit} requests today${pause}${st.lastError ? ` · last answer: ${st.lastError}` : ''}`;
            pixivLimit.value = String(st.limit);
            pixivSettings().limit = st.limit;
        } catch (error) {
            pixivStatus.textContent = `${String(error?.message || error)} It comes with the SillyTavern copy on the "sillytavern-pixiv" branch of github.com/mrd558955-cell/SillyImageSearch (ST-android: Manage ST → install from GitHub), and needs enableServerPlugins: true in SillyTavern's config.yaml.`;
        }
    };
    pixivBox.checked = pixivOn();
    pixivLimit.value = String(pixivSettings().limit || 400);
    pixivBox.addEventListener('change', () => {
        pixivSettings().enabled = pixivBox.checked;
        save();
        if (pixivBox.checked) {
            showPixiv();
        }
    });
    document.getElementById('st_imagesearch_pixiv_check').addEventListener('click', showPixiv);
    document.getElementById('st_imagesearch_pixiv_login').addEventListener('click', async () => {
        const field = document.getElementById('st_imagesearch_pixiv_cookie');
        if (!field.value.trim()) {
            return;
        }
        pixivStatus.textContent = 'Logging in…';
        try {
            await bridgeCall('/login', { cookie: field.value.trim() });
            field.value = '';
            await showPixiv();
        } catch (error) {
            pixivStatus.textContent = String(error?.message || error);
        }
    });
    document.getElementById('st_imagesearch_pixiv_logout').addEventListener('click', async () => {
        try {
            await bridgeCall('/logout', {});
        } catch (error) {
            pixivStatus.textContent = String(error?.message || error);
            return;
        }
        showPixiv();
    });
    pixivLimit.addEventListener('change', async () => {
        const limit = Math.max(20, Math.min(5000, Number(pixivLimit.value) || 400));
        pixivSettings().limit = limit;
        save();
        try {
            await bridgeCall('/settings', { limit });
            showPixiv();
        } catch (error) {
            pixivStatus.textContent = String(error?.message || error);
        }
    });
    bind('st_imagesearch_groups_lore', 'groupsInLore', 'checked', () => scheduleLorebookSync());
    bind('st_imagesearch_group_blind', 'groupBlind', 'checked');
    bind('st_imagesearch_group_story', 'groupStory', 'checked');
    bind('st_imagesearch_group_deduce', 'groupDeduce', 'checked');
    renderTagNotes();
    renderFixLog();
    renderDefinitions();
    renderTagLinks();
    renderSpellings();
    bind('st_imagesearch_group_link', 'groupLink', 'checked');
    bind('st_imagesearch_group_in_text', 'groupInText', 'checked');
    bind('st_imagesearch_sequence_v3', 'sequenceV3', 'checked');
    bind('st_imagesearch_group_review', 'groupReview', 'checked');
    bind('st_imagesearch_story_prompt', 'storyPrompt');
    bind('st_imagesearch_role_check', 'roleCheck', 'checked');
    bind('st_imagesearch_group_role_fit', 'groupRoleFit', 'checked');
    bind('st_imagesearch_role_rules', 'roleRules');
    bind('st_imagesearch_tags_matter', 'tagsMatter', 'value', () => {
        clearTimeout(definitionTimer);
        definitionTimer = setTimeout(() => {
            renderDefinitions();
            ensureDefinitions(normalizeTagList(s.tagsMatter)).catch(() => null);
        }, 1500);
    });
    bind('st_imagesearch_tags_dont_matter', 'tagsDontMatter');
    for (const [id, key, value] of [['st_imagesearch_story_reset', 'storyPrompt', DEFAULT_STORY_PROMPT]]) {
        document.getElementById(id).addEventListener('click', () => {
            s[key] = value;
            document.getElementById(id.replace('_reset', '_prompt')).value = value;
            save();
        });
    }
    bind('st_imagesearch_group_importance', 'groupImportance', 'checked');
    bind('st_imagesearch_importance_prompt', 'importancePrompt');
    document.getElementById('st_imagesearch_importance_reset').addEventListener('click', () => {
        s.importancePrompt = DEFAULT_IMPORTANCE_PROMPT;
        document.getElementById('st_imagesearch_importance_prompt').value = DEFAULT_IMPORTANCE_PROMPT;
        save();
    });
    bind('st_imagesearch_aishow_depth', 'aiShowDepth', 'number', () => scheduleLorebookSync());
    bind('st_imagesearch_catalog_size', 'catalogSize', 'number', () => scheduleLorebookSync());
    bind('st_imagesearch_sendbutton', 'sendButton', 'checked', updateButtons);
    bind('st_imagesearch_confirmpic', 'confirmPicture', 'checked');
    bind('st_imagesearch_pickwindow', 'pickWindow', 'checked');
    bind('st_imagesearch_pick_mix', 'pickMix', 'checked');
    bind('st_imagesearch_inline', 'inlinePictures', 'checked', placeAllInline);
    bind('st_imagesearch_vision_tokens', 'visionMaxTokens', 'number');
    bind('st_imagesearch_describe_wait', 'describeWaitSec', 'number');
    const framesValue = document.getElementById('st_imagesearch_gif_frames_value');
    const showFrames = () => {
        const count = Math.min(32, Math.max(1, Math.round(Number(s.gifFrames) || 3)));
        const sheets = Math.ceil(count / SHEET_FRAMES);
        framesValue.textContent = `${count} frame${count === 1 ? '' : 's'}${s.gifSheet && count > 1 ? ` · ${sheets} picture${sheets === 1 ? '' : 's'}` : ''}`;
    };
    bind('st_imagesearch_gif_frames', 'gifFrames', 'number', showFrames);
    bind('st_imagesearch_max_pictures', 'maxPictures', 'number');
    const senseValue = document.getElementById('st_imagesearch_split_sense_value');
    const senseNames = ['', 'strict', 'a bit strict', 'normal', 'a bit loose', 'loose'];
    const showSense = () => {
        senseValue.textContent = senseNames[Math.min(5, Math.max(1, Math.round(Number(s.splitSense) || 3)))];
    };
    bind('st_imagesearch_split_sense', 'splitSense', 'number', showSense);
    const repeatsValue = document.getElementById('st_imagesearch_loop_repeats_value');
    const showRepeats = () => {
        const count = Math.min(5, Math.max(1, Math.round(Number(s.loopRepeats) || 3)));
        repeatsValue.textContent = `${count} turn${count === 1 ? '' : 's'}`;
    };
    bind('st_imagesearch_loop_repeats', 'loopRepeats', 'number', showRepeats);
    document.getElementById('st_imagesearch_loop_repeats').value = String(Math.min(5, Math.max(1, Math.round(Number(s.loopRepeats) || 3))));
    showRepeats();
    document.getElementById('st_imagesearch_split_sense').value = String(Math.min(5, Math.max(1, Math.round(Number(s.splitSense) || 3))));
    showSense();
    document.getElementById('st_imagesearch_gif_frames').value = String(Math.min(32, Math.max(1, Math.round(Number(s.gifFrames) || 3))));
    showFrames();
    bind('st_imagesearch_gif_size', 'gifFrameSize', 'number');
    bind('st_imagesearch_video_reader', 'videoReader');
    if (!document.getElementById('st_imagesearch_video_reader').value) {
        document.getElementById('st_imagesearch_video_reader').value = 'auto';
    }
    if (!document.getElementById('st_imagesearch_gif_size').value) {
        document.getElementById('st_imagesearch_gif_size').value = '768';
    }
    bind('st_imagesearch_gif_sheet', 'gifSheet', 'checked');
    bind('st_imagesearch_hunt', 'huntTags', 'checked');
    bind('st_imagesearch_hunt_iqdb', 'huntIqdb', 'checked');
    bind('st_imagesearch_vision_prompt', 'visionPrompt');
    [['st_imagesearch_gif_note', 'gifNote'], ['st_imagesearch_describe_rules', 'describeRules'], ['st_imagesearch_board_note', 'boardNote'], ['st_imagesearch_again_prompt', 'againPrompt'], ['st_imagesearch_loop_note', 'loopNote'], ['st_imagesearch_one_moving', 'oneMoving'], ['st_imagesearch_force_prompt', 'forcePrompt'], ['st_imagesearch_lead_prompt', 'leadPrompt'], ['st_imagesearch_show_rule', 'showRule'], ['st_imagesearch_spell_prompt', 'spellPrompt'], ['st_imagesearch_card_prompt', 'cardPrompt'], ['st_imagesearch_card_update_prompt', 'cardUpdatePrompt']].forEach(([id, key]) => {
        const area = document.getElementById(id);
        area.value = promptPart(key);
        const changed = () => {
            save();
            if (key === 'showRule') {
                scheduleLorebookSync();
            }
        };
        area.addEventListener('input', () => {
            s[key] = area.value.trim() === PROMPT_PARTS[key].trim() ? '' : area.value;
            changed();
        });
        document.getElementById(`${id}_reset`).addEventListener('click', () => {
            s[key] = '';
            area.value = PROMPT_PARTS[key];
            changed();
        });
    });
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
        categoriesChanged();
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
            categoriesChanged();
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
        categoriesChanged();
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
        if (!cardUnits().some(entry => needsCard(entry) || staleCategories(entry).length)) {
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
    const weightBox = document.getElementById('st_imagesearch_looks_weight');
    weightBox.value = String(Math.round(looksWeight() * 100));
    weightBox.addEventListener('input', () => {
        const value = Number(weightBox.value);
        s.looksWeight = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 100;
        save();
    });
    const ratingsRow = document.getElementById('st_imagesearch_send_ratings');
    s.sendRatings = { general: true, sensitive: true, questionable: true, explicit: true, ...(s.sendRatings || {}) };
    for (const level of RATING_LEVELS) {
        const label = el('label', 'checkbox_label');
        const box = el('input');
        box.type = 'checkbox';
        box.checked = s.sendRatings[level] !== false;
        box.addEventListener('change', () => {
            s.sendRatings[level] = box.checked;
            save();
            scheduleLorebookSync();
        });
        label.append(box, el('span', '', ` ${RATING_NAMES[level]}`));
        ratingsRow.appendChild(label);
    }
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
        await fileCards({ only: cardUnits().filter(entry => entry.description && !entry.card?.edited), loud: true });
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
        const count = list.filter(entry => entry.lock || (isMulti(entry) && entry.variants.some(item => item.lock))).length;
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
    DEVICE_CACHES.forEach(name => deviceCache(name));
    watchInline();
    watchMediaDelete();
    c.eventSource.on(c.eventTypes.APP_READY, addButtons);
    c.eventSource.on(c.eventTypes.APP_READY, watchInline);
    c.eventSource.on(c.eventTypes.APP_READY, watchMediaDelete);
    if (c.eventTypes.MEDIA_ATTACHMENT_DELETED) {
        c.eventSource.on(c.eventTypes.MEDIA_ATTACHMENT_DELETED, onMediaDeleted);
    }
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
