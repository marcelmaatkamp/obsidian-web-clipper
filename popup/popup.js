/**
 * Obsidian Web Clipper - Popup Script
 * Handles user interaction in the extension popup.
 */

let pageData = null;
let selectedTags = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    // Wire up settings button
                            document.getElementById('btn-options').addEventListener('click', () => {
                                  chrome.runtime.openOptionsPage();
                            });

                            // Wire up save button
                            document.getElementById('btn-save').addEventListener('click', handleSave);

                            // Load settings and page data
                            await init();
});

async function init() {
    const settings = await getSettings();

  // Pre-fill folder from settings
  if (settings.defaultFolder) {
        document.getElementById('note-folder').value = settings.defaultFolder;
  }

  // Check if API is configured
  if (!settings.apiUrl) {
        showStatus('warning', 'Obsidian API not configured. Click the settings icon to set up.');
        return;
  }

  // Extract page data from content script
  try {
        pageData = await getPageData();
        populateForm(pageData, settings);
        document.getElementById('btn-save').disabled = false;
  } catch (e) {
        showStatus('error', 'Could not extract page data: ' + e.message);
  }
}

/**
 * Populate form fields with extracted page data
 */
function populateForm(data, settings) {
    // Title
  const titleInput = document.getElementById('note-title');
    titleInput.value = data.title || document.title || '';

  // Folder - use per-type defaults if configured
  const folderInput = document.getElementById('note-folder');
    if (!folderInput.value) {
          if (data.type === 'github_repo' && settings.githubFolder) {
                  folderInput.value = settings.githubFolder;
          } else if (settings.defaultFolder) {
                  folderInput.value = settings.defaultFolder;
          }
    }

  // Tags
  const tagsContainer = document.getElementById('tags-container');
    tagsContainer.innerHTML = '';

  const tags = data.tags || [];
    if (tags.length === 0) {
          tagsContainer.innerHTML = '<span class="no-tags">No tags found</span>';
          return;
    }

  // All tags selected by default
  tags.forEach(tag => {
        selectedTags.add(tag);
        const el = document.createElement('span');
        el.className = 'tag';
        el.textContent = tag;
        el.dataset.tag = tag;
        el.addEventListener('click', () => toggleTag(el, tag));
        tagsContainer.appendChild(el);
  });
}

/**
 * Toggle tag selection
 */
function toggleTag(el, tag) {
    if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
          el.classList.add('deselected');
    } else {
          selectedTags.add(tag);
          el.classList.remove('deselected');
    }
}

/**
 * Build the markdown note content
 */
function buildNoteContent(data, title, folder, extraNotes, tags) {
    const tagsYaml = tags.length > 0
      ? 'tags:\n' + tags.map(t => `  - ${t}`).join('\n')
          : 'tags: []';

  const frontmatter = [
        '---',
        `title: "${title.replace(/"/g, '\\"')}"`,
        `url: "${data.url}"`,
        data.description ? `description: "${data.description.replace(/"/g, '\\"')}"` : '',
        data.stars ? `stars: ${data.stars}` : '',
        data.forks ? `forks: ${data.forks}` : '',
        data.watchers ? `watchers: ${data.watchers}` : '',
        data.language ? `language: ${data.language}` : '',
        data.license ? `license: "${data.license}"` : '',
        `date_saved: ${data.date_saved}`,
        tagsYaml,
        '---',
      ].filter(Boolean).join('\n');

  const body = [
        `# ${title}`,
        '',
        data.description ? `> ${data.description}` : '',
        '',
        `**URL:** ${data.url}`,
        data.website ? `**Website:** ${data.website}` : '',
        (data.stars || data.forks) ? `**Stars:** ${data.stars || 'N/A'} | **Forks:** ${data.forks || 'N/A'}` : '',
        data.language ? `**Language:** ${data.language}` : '',
        '',
        extraNotes ? `## Notes\n\n${extraNotes}` : '',
      ].filter(line => line !== undefined && line !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  return frontmatter + '\n\n' + body + '\n';
}

/**
 * Handle save button click
 */
async function handleSave() {
    const title = document.getElementById('note-title').value.trim();
    const folder = document.getElementById('note-folder').value.trim();
    const extraNotes = document.getElementById('note-extra').value.trim();

  if (!title) {
        showStatus('error', 'Please enter a title for the note.');
        return;
  }

  const activeTags = Array.from(selectedTags);
    const content = buildNoteContent(pageData || {
          url: 'unknown',
          date_saved: new Date().toISOString().split('T')[0],
    }, title, folder, extraNotes, activeTags);

  // Show loading state
  document.getElementById('content').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    hideStatus();

  try {
        const response = await chrome.runtime.sendMessage({
                action: 'saveToObsidian',
                data: { title, content, folder },
        });

      document.getElementById('loading').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');

      if (response.success) {
              showStatus('success', `Saved to: ${response.result.filePath}`);
              document.getElementById('btn-save').textContent = 'Saved!';
              document.getElementById('btn-save').disabled = true;
      } else {
              showStatus('error', response.error || 'Unknown error occurred.');
      }
  } catch (e) {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');
        showStatus('error', 'Extension error: ' + e.message);
  }
}

/**
 * Get page data from content script via background
 */
function getPageData() {
    return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: 'getPageData' }, (response) => {
                  if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                  } else if (response && response.error) {
                            reject(new Error(response.error));
                  } else {
                            resolve(response || {});
                  }
          });
    });
}

/**
 * Get settings from storage
 */
function getSettings() {
    return new Promise((resolve) => {
          chrome.storage.sync.get({
                  apiUrl: 'https://127.0.0.1:27124',
                  apiKey: '',
                  defaultFolder: '',
                  githubFolder: '',
          }, resolve);
    });
}

/**
 * Show status bar message
 */
function showStatus(type, message) {
    const bar = document.getElementById('status-bar');
    bar.className = `status-bar ${type}`;
    bar.textContent = message;
    bar.classList.remove('hidden');
}

function hideStatus() {
    document.getElementById('status-bar').classList.add('hidden');
}
