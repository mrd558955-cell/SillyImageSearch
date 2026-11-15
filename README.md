# Image Search for SillyTavern

Click the images icon next to the chat box (or the wand menu, or `/imgsearch tags`) to open a picker. Tags are suggested by a small model from the latest messages, pictures come from the image boards you list in the settings, and the one you pick lands in the chat box without being sent.

## Setup

1. In API Connections, pick a fast model that does not think (e.g. NanoGPT `deepseek/deepseek-v4.1-flash`), save it as a connection profile called `Tags`, then switch back to your main profile.
2. In the Image Search settings, choose `Tags` as the tag profile.
3. List image boards, one per line (e.g. `safebooru.org`, `danbooru.donmai.us`).
4. For the AI to see picked pictures: keep "Save picked pictures" and "Attach saved pictures" on, turn on "Send inline media" in the Chat Completion settings, and use a main model that accepts images.

Saving pictures needs `enableCorsProxy: true` in `config.yaml`, or the Cloudflare image fetcher.

With more than one image board listed, "All sites" in the picker searches them all at once. Typing two letters or more in the tag box suggests matching tags from the sites.

## Library

Pictures you pick are kept in the library (Library tab in the picker) and offered to the AI through the lorebook "Image Search Pictures". In the library you can redo a picture's description or delete it (the file is deleted too). The settings have "Redo all descriptions" and "Delete everything".

Some posts have other versions on the site (parent and child posts). They share one cell in the grid, with a count in the corner. Open it to see every version; "Save set" keeps them as one library entry, with one full description and what is different in each version.

For testing updates without reinstalling, see [St-image-loader](https://github.com/mrd558955-cell/St-image-loader).
