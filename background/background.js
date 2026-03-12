/**
 * Obsidian Web Clipper - Background Service Worker
 * Handles communication between popup and content scripts,
 * and makes API calls to the Obsidian Local REST API.
 */

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveToObsidian') {
          handleSaveToObsidian(message.data)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true; // Keep message channel open for async response
    }

                                       if (message.action === 'getPageData') {
                                             // Forward request to content script in active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'extractPageData' }, (response) => {
                                    sendResponse(response);
                        });
              }
      });
                                             return true;
                                       }

                                       if (message.action === 'testConnection') {
                                             testObsidianConnection(message.apiUrl, message.apiKey)
                                               .then(result => sendResponse({ success: true, result }))
                                               .catch(error => sendResponse({ success: false, error: error.message }));
                                             return true;
                                       }
});

/**
 * Save a note to Obsidian via the Local REST API plugin
 */
async function handleSaveToObsidian(data) {
    const settings = await getSettings();

  if (!settings.apiUrl) {
        throw new Error('Obsidian API URL not configured. Please open extension options.');
  }

  const { title, content, folder } = data;
    const targetFolder = folder || settings.defaultFolder || '';
    const cleanTitle = sanitizeFilename(title);
    const filePath = targetFolder
      ? `${targetFolder.replace(/\/+$/, '')}/${cleanTitle}.md`
          : `${cleanTitle}.md`;

  const apiUrl = settings.apiUrl.replace(/\/+$/, '');
    const url = `${apiUrl}/vault/${encodeURIComponent(filePath)}`;

  const headers = {
        'Content-Type': 'text/markdown',
        'Accept': 'application/json',
  };

  if (settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: content,
  });

  if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Obsidian API error ${response.status}: ${errorText}`);
  }

  return { filePath };
}

/**
 * Test connection to Obsidian REST API
 */
async function testObsidianConnection(apiUrl, apiKey) {
    const url = `${apiUrl.replace(/\/+$/, '')}/`;
    const headers = { 'Accept': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    let response;
    try {
        response = await fetch(url, { headers });
    } catch (e) {
        if (apiUrl.startsWith('https') && e.message && e.message.includes('Failed to fetch')) {
            throw new Error(
                'SSL certificate not trusted. Open ' + url + ' in a browser tab, accept the certificate warning, then try again.'
            );
        }
        throw e;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

/**
 * Get settings from storage
 */
async function getSettings() {
    return new Promise((resolve) => {
          chrome.storage.sync.get({
                  apiUrl: 'https://127.0.0.1:27124',
                  apiKey: '',
                  defaultFolder: '',
                  defaultVault: '',
          }, resolve);
    });
}

/**
 * Sanitize a string to be a valid filename
 */
function sanitizeFilename(name) {
    return name
      .replace(/[\\/:*?"<>|#^[\]]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200) || 'Untitled';
}
