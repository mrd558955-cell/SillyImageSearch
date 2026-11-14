# Image Search for SillyTavern

Click the images icon next to the chat box (or the wand menu, or `/imgsearch tags`) to open a picker. Tags are suggested by a small model from the latest messages, pictures come from the image boards you list in the settings, and the one you pick lands in the chat box without being sent.

## Setup

1. In API Connections, pick a fast model that does not think (e.g. NanoGPT `deepseek/deepseek-v4.1-flash`), save it as a connection profile called `Tags`, then switch back to your main profile.
2. In the Image Search settings, choose `Tags` as the tag profile.
3. List image boards, one per line (e.g. `safebooru.org`, `danbooru.donmai.us`).
4. For the AI to see picked pictures: keep "Save picked pictures" and "Attach saved pictures" on, turn on "Send inline media" in the Chat Completion settings, and use a main model that accepts images.

Saving pictures needs `enableCorsProxy: true` in `config.yaml`, or the Cloudflare image fetcher.

For testing updates without reinstalling, see [St-image-loader](https://github.com/mrd558955-cell/St-image-loader).
