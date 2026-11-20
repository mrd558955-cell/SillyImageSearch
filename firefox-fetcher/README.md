# SillyImageSearch Fetcher (Firefox add-on)

For image boards whose Cloudflare check stops SillyTavern's server. With this add-on, the Image Search extension asks those sites from Firefox itself: your own browser, with the pass you got there, as if you browsed the site.

- It only asks sites you allowed (it shows an Allow page the first time a site is used; remove them in the add-on's settings).
- It only asks when you search or open a picture: searches one a second per site, pictures 4 at a time per site, like the site's own pages load them.
- When the site stops requests sent from the add-on itself, it asks from a quiet tab of that site instead (one tab per site, closed after 2 minutes unused; closing it yourself is fine, a new one opens when needed, and if Firefox does not load a tab in the background it is shown for a moment, then you're back in SillyTavern), the same as the site's own pages do.
- When even that tab gets the check, it shows the blocked address in that tab once so you can pass it, then goes back to SillyTavern. If you don't pass it, it waits a minute before asking again.
- It only talks to SillyTavern pages on 127.0.0.1 or localhost.
- Every step gives up after a while (1 minute for a search, 3 for a picture or video) instead of waiting forever.
- It collects nothing and sends nothing anywhere else.

## Install (Firefox for Android)

Firefox only keeps add-ons that Mozilla has signed. Signing is free and takes a few minutes:

1. On addons.mozilla.org, log in with a Mozilla account and open the Developer Hub → Submit a New Add-on → **On your own** (not listed on the site).
2. Upload `sillyimagesearch-fetcher-1.3.0.zip` (the files of this folder, zipped with `manifest.json` at the top). Mozilla checks it automatically and gives you a signed `.xpi` to download.
3. On the phone: Firefox → Settings → About Firefox → tap the Firefox logo 5 times ("Debug menu enabled") → back to Settings → **Install extension from file** → pick the `.xpi`.
4. In SillyTavern: Image Search settings → Setup → Site accounts → tick **Through Firefox** on the site's row → Check.

To update: Developer Hub → the add-on → Upload a New Version → the new zip, then install the new `.xpi` over the old one the same way.

If "Install extension from file" does not show up in your Firefox, Firefox Nightly for Android has it.
