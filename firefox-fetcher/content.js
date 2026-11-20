'use strict';

window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) {
        return;
    }
    const message = event.data;
    if (!message || message.source !== 'stis-page' || typeof message.id !== 'string') {
        return;
    }
    browser.runtime.sendMessage({ ...message, page: location.origin }).then(reply => {
        window.postMessage({ source: 'stis-fetcher', id: message.id, ...reply }, location.origin);
    }, error => {
        window.postMessage({ source: 'stis-fetcher', id: message.id, ok: false, error: String(error?.message || error) }, location.origin);
    });
});

window.postMessage({ source: 'stis-fetcher', id: 'ready', version: browser.runtime.getManifest().version }, location.origin);
