# Pixiv bridge

A SillyTavern server plugin that lets the Image Search extension search and save Pixiv works.

- It uses your own Pixiv login (the PHPSESSID cookie, pasted once in the Image Search settings). The login is kept in SillyTavern's data folder (`data/_pixiv-bridge/state.json`, readable by its owner only) and is never sent back to the browser.
- It says what it is: its User-Agent is `SillyImageSearch-PixivBridge/<version> (SillyTavern server plugin; +https://github.com/mrd558955-cell/SillyImageSearch)`.
- It asks Pixiv only when you search, open a work or save one: one request at a time, about 1.5 s apart. Searches are kept for 15 minutes. When Pixiv answers 429 or 403 it pauses (2 minutes, doubling up to 30), and it stops at a daily limit you set (400 by default).
- Pictures come only from Pixiv's picture server (pximg.net), with the "came from pixiv.net" header Pixiv asks for.

## Install

1. Put this folder in SillyTavern's `plugins` folder (as `plugins/pixiv-bridge`, with `index.cjs` in it).
2. Set `enableServerPlugins: true` in SillyTavern's `config.yaml` and restart SillyTavern.
3. In Image Search settings → Setup → Pixiv, tick "Search Pixiv" and press "Check the bridge".

On ST-android, the plugins folder cannot be reached by hand: install the SillyTavern copy from the `sillytavern-pixiv` branch of this repository instead (Manage ST → install from GitHub → `mrd558955-cell/SillyImageSearch`, branch `sillytavern-pixiv`). It is SillyTavern 1.19.0, unchanged, with this plugin in its `plugins` folder; your data and config are kept.
