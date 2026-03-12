/**
 * Obsidian Web Clipper - Options Page Script
 * Handles loading and saving extension settings.
 */

const DEFAULTS = {
    apiUrl: 'https://127.0.0.1:27124',
    apiKey: '',
    defaultFolder: '',
    githubFolder: '',
    includeDescription: true,
    includeStats: true,
    includeTags: true,
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();

    document.getElementById('settings-form').addEventListener('submit', handleSave);
    document.getElementById('btn-reset').addEventListener('click', handleReset);
    document.getElementById('btn-test').addEventListener('click', handleTestConnection);
    document.getElementById('btn-toggle-key').addEventListener('click', toggleApiKeyVisibility);
});

async function loadSettings() {
    const settings = await getSettings();

    document.getElementById('api-url').value = settings.apiUrl || DEFAULTS.apiUrl;
    document.getElementById('api-key').value = settings.apiKey || '';
    document.getElementById('default-folder').value = settings.defaultFolder || '';
    document.getElementById('github-folder').value = settings.githubFolder || '';
    document.getElementById('include-description').checked = settings.includeDescription !== false;
    document.getElementById('include-stats').checked = settings.includeStats !== false;
    document.getElementById('include-tags').checked = settings.includeTags !== false;
}

async function handleSave(e) {
    e.preventDefault();

    const settings = {
        apiUrl: document.getElementById('api-url').value.trim(),
        apiKey: document.getElementById('api-key').value.trim(),
        defaultFolder: document.getElementById('default-folder').value.trim(),
        githubFolder: document.getElementById('github-folder').value.trim(),
        includeDescription: document.getElementById('include-description').checked,
        includeStats: document.getElementById('include-stats').checked,
        includeTags: document.getElementById('include-tags').checked,
    };

    await chrome.storage.sync.set(settings);
    showStatus('success', 'Settings saved successfully.');
}

async function handleReset() {
    await chrome.storage.sync.set(DEFAULTS);
    await loadSettings();
    showStatus('success', 'Settings reset to defaults.');
}

async function handleTestConnection() {
    const apiUrl = document.getElementById('api-url').value.trim();
    const apiKey = document.getElementById('api-key').value.trim();
    const statusEl = document.getElementById('connection-status');

    statusEl.textContent = 'Testing...';
    statusEl.className = 'connection-status';

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'testConnection',
            apiUrl,
            apiKey,
        });

        if (response.success) {
            statusEl.textContent = 'Connected!';
            statusEl.className = 'connection-status success';
        } else {
            statusEl.textContent = 'Failed: ' + response.error;
            statusEl.className = 'connection-status error';
        }
    } catch (e) {
        statusEl.textContent = 'Error: ' + e.message;
        statusEl.className = 'connection-status error';
    }
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('api-key');
    const btn = document.getElementById('btn-toggle-key');
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Hide';
    } else {
        input.type = 'password';
        btn.textContent = 'Show';
    }
}

function showStatus(type, message) {
    const el = document.getElementById('status-message');
    el.className = `status-message ${type}`;
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULTS, resolve);
    });
}
