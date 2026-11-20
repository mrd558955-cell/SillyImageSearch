'use strict';

async function draw() {
    const { sites } = await browser.storage.local.get({ sites: [] });
    const list = document.getElementById('list');
    list.textContent = '';
    document.getElementById('none').hidden = sites.length > 0;
    for (const site of sites) {
        const item = document.createElement('li');
        item.textContent = site;
        const remove = document.createElement('button');
        remove.textContent = 'Remove';
        remove.addEventListener('click', async () => {
            const { sites: now } = await browser.storage.local.get({ sites: [] });
            await browser.storage.local.set({ sites: now.filter(name => name !== site) });
            draw();
        });
        item.appendChild(remove);
        list.appendChild(item);
    }
}

draw();
