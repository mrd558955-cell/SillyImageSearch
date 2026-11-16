# Image Search for SillyTavern

Click the images icon next to the chat box (or the wand menu, or `/imgsearch tags`) to open a picker. Tags are suggested by a small model from the latest messages, pictures come from the image boards you list in the settings, and the one you pick lands in the chat box without being sent.

## Setup

1. In API Connections, pick a fast model that does not think (e.g. NanoGPT `deepseek/deepseek-v4.1-flash`), save it as a connection profile called `Tags`, then switch back to your main profile.
2. In the Image Search settings, choose `Tags` as the tag profile.
3. List image boards, one per line (e.g. `safebooru.org`, `danbooru.donmai.us`).
4. For the AI to see picked pictures: keep "Save picked pictures" and "Attach saved pictures" on, turn on "Send inline media" in the Chat Completion settings, and use a main model that accepts images.

Saving pictures needs `enableCorsProxy: true` in `config.yaml`, or the Cloudflare image fetcher.

With more than one image board listed, "All sites" in the picker searches them all at once; the site switches under the tag box leave some out. Typing two letters or more in the tag box suggests matching tags from the sites, favorites first.

Scroll down in a picture's preview to see all its tags: select some to add them to the search, mark them as favorites (the ★ row under the tag box), or leave out pictures that have them. The left-out list is in the settings ("Leave out pictures with these tags").

## Library

Pictures you pick are kept in the library (Library tab in the picker) and offered to the AI through the lorebook "Image Search Pictures". In the library you can redo a picture's description or delete it (the file is deleted too). The settings have "Redo all descriptions" and "Delete everything".

The picture button next to Send sends your message and makes the reply come with a picture from the library: the AI picks the one that best fits what happens next, you can check it first (Send / Another / Cancel), and the reply is written to match it. Swiping keeps the same picture. The lorebook also lists the pictures that fit the current chat best (re-checked every 10 messages), so the AI can bring one in by itself.

Each described picture gets a filing card from the tag model: who is in it (gender, species, skin, hair, build, outfit, features), pose, mood, place, framing and a few story moments it could illustrate. The cards go into SillyTavern's vector search (NanoGPT embeddings by default, or the local model), so the picture button finds pictures by meaning, not shared words. Ranking is done in two steps: first by looks and keywords, then by meaning. Looks compare each picture with the character's look sheet (gender, age group from child to old, species, hair colour, build, height, skin, eyes, features, outfit; close colours like black and brown cost less), filled once by the tag model from the whole character card and editable under "Characters' looks"; your persona is not compared. A mismatch costs about what a match earns, and a field the picture's card does not show costs 1. The best 50 (a setting) are then ranked again by meaning. A scene cut in your message ("the next day", "hours later", "---") leaves the old scene out, and actions your message rules out ("no kissing") push pictures showing them down. Pressing the picture button first opens a small window where you choose whether the AI should take you (your persona) into account. The best matches go to the AI, which ranks every one of them with a short reason, shown on the card ("AI #3 of 30: …"); the card also shows how each picture was found. Cards can be read and edited in the library preview, and the Library tab has filters for who, pose and mood. The pose and mood lists are in the settings, under "Finding pictures".

Videos show up with a play badge (turn this off with "Include videos"). In the preview, play it, tap "Start here", set the seconds and "Make GIF"; the GIF is made on your device and used like any picture. Animated pictures are described from their first, middle and last frame. Length, width and frames per second are in the settings.

The bookmark button on a picture saves it to the library in the background without adding it to the chat, so you can keep browsing.

"Select" lets you tap pictures in story order (from different searches and from the library) and "Save as sequence". The lorebook entry tells the AI to show them one at a time, in order, as the story moves on.

Some posts have other versions on the site (parent and child posts). They share one cell in the grid, with a count in the corner. Open it to see every version; "Save set" keeps them as one library entry, with one full description and what is different in each version.

For testing updates without reinstalling, see [St-image-loader](https://github.com/mrd558955-cell/St-image-loader).
