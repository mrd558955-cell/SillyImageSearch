'use strict';

const site = new URLSearchParams(location.search).get('site') || '';
document.getElementById('site').textContent = site;
document.getElementById('site2').textContent = site;
const answer = allowed => browser.runtime.sendMessage({ type: 'approved', site, allowed });
document.getElementById('allow').addEventListener('click', () => answer(true));
document.getElementById('deny').addEventListener('click', () => answer(false));
