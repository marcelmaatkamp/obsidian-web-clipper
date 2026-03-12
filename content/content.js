/**
 * Obsidian Web Clipper - Content Script
 * Extracts page metadata, content, and tags from the current web page.
 * Handles special extraction for GitHub repositories.
 */

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractPageData') {
          try {
                  const data = extractPageData();
                  sendResponse(data);
          } catch (e) {
                  sendResponse({ error: e.message });
          }
    }
    return true;
});

/**
 * Extract all relevant data from the current page
 */
function extractPageData() {
    const url = window.location.href;
    const isGitHub = window.location.hostname === 'github.com';

  const data = {
        url,
        title: getPageTitle(),
        description: getMetaDescription(),
        tags: [],
        date_saved: new Date().toISOString().split('T')[0],
        type: 'webpage',
  };

  if (isGitHub) {
        return extractGitHubData(data);
  }

  return data;
}

/**
 * Get page title, cleaned up
 */
function getPageTitle() {
    // Try og:title first
  const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) return ogTitle.content.trim();
    return document.title.trim();
}

/**
 * Get meta description
 */
function getMetaDescription() {
    const selectors = [
          'meta[property="og:description"]',
          'meta[name="description"]',
          'meta[name="twitter:description"]',
        ];
    for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.content) return el.content.trim();
    }
    return '';
}

/**
 * GitHub-specific data extraction
 */
function extractGitHubData(baseData) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const isRepo = pathParts.length >= 2;

  if (!isRepo) return baseData;

  const owner = pathParts[0];
    const repo = pathParts[1];

  // Extract topics/tags
  const topicLinks = document.querySelectorAll('a[data-octo-click="topic_click"], .topic-tag, [class*="topic"]');
    const tags = new Set();
    tags.add('github');
    topicLinks.forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 0 && text.length < 50) tags.add(text);
    });

  // Also try the repository topics from the sidebar
  const topicEls = document.querySelectorAll('a[href*="/topics/"]');
    topicEls.forEach(el => {
          const href = el.getAttribute('href') || '';
          const match = href.match(/\/topics\/(.+)/);
          if (match) tags.add(match[1]);
    });

  // Extract stats
  const starsEl = document.querySelector('#repo-stars-counter-star, [data-view-component="true"].Counter');
    const statsText = {};

  // Stars
  const starsLink = document.querySelector('a[href$="/stargazers"] .Counter, #repo-stars-counter-star');
    if (starsLink) statsText.stars = starsLink.textContent.trim();

  // Forks
  const forksLink = document.querySelector('a[href$="/forks"] .Counter, #repo-network-counter');
    if (forksLink) statsText.forks = forksLink.textContent.trim();

  // Language
  const langEl = document.querySelector('[data-language], .repository-lang-stats-numbers span, span[itemprop="programmingLanguage"]');
    if (langEl) statsText.language = langEl.textContent.trim();

  // Get the about description from sidebar
  const aboutDesc = document.querySelector('.f4.my-3, .BorderGrid-cell p.my-3');
    const description = aboutDesc
      ? aboutDesc.textContent.trim()
          : baseData.description;

  // Website/homepage
  const websiteEl = document.querySelector('a[rel~="nofollow"][data-view-component="true"]');
    if (websiteEl) statsText.website = websiteEl.href;

  return {
        ...baseData,
        title: `github.com/${owner}/${repo}`,
        description,
        tags: Array.from(tags),
        type: 'github_repo',
        owner,
        repo,
        ...statsText,
  };
}
