import { Client } from './client.js';

document.getElementById('loading').textContent = "Loading...";
document.getElementById('loading').style.display = 'block';

document.addEventListener('DOMContentLoaded', () => {
    window.client = new Client();
    window.client.init();
});
