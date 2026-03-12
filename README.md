# Obsidian Web Clipper

A Chrome & Firefox extension to save web pages to Obsidian via the [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api). Supports vault folder selection, tag extraction, and special handling for GitHub repositories.

![screenshot](https://placehold.co/340x400?text=Web+Clipper+Popup)

## Features

- Save any web page as a Markdown note directly to your Obsidian vault
- Automatically extracts title, description, and tags from the page
- GitHub repository pages get enriched metadata: stars, forks, language, topics, homepage
- Configurable default folders (separate folder for GitHub repos)
- Tag toggle — deselect tags you don't want before saving
- Add extra notes in the popup before saving
- Dark-themed popup, light/dark adaptive settings page

## Requirements

- [Obsidian](https://obsidian.md) with the [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) installed and enabled
- Chrome 88+ or Firefox 91+

## Installation

### Chrome (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the project folder

### Firefox (Temporary Add-on)

1. Clone or download this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the `manifest.firefox.json` file from the project folder

## Setup

### 1. Install the Local REST API plugin in Obsidian

1. In Obsidian, open **Settings → Community plugins**
2. Search for **Local REST API** and install it
3. Enable the plugin
4. Go to **Settings → Local REST API**
5. The plugin starts an HTTPS server on `https://127.0.0.1:27124` by default with a self-signed certificate

### 2. Accept the SSL certificate (HTTPS only)

Because the plugin uses a self-signed certificate, your browser needs to trust it once:

1. Open `https://127.0.0.1:27124` in your browser
2. Click **Advanced → Proceed to 127.0.0.1 (unsafe)**
3. You only need to do this once per browser profile

> If you prefer to skip this step, you can disable HTTPS in the plugin settings and use `http://127.0.0.1:27123` instead.

### 3. Configure the extension

1. Click the extension icon in the toolbar
2. Click the **settings gear** icon (or right-click the extension → Options)
3. Fill in:
   - **API URL**: `https://127.0.0.1:27124` (default, HTTPS) or `http://127.0.0.1:27123` (HTTP)
   - **API Key**: copy from Obsidian → Settings → Local REST API → API Key
4. Click **Test Connection** — you should see "Connected!"
5. Optionally set a **Default Folder** (e.g. `Clippings`) and a separate **GitHub Repos Folder** (e.g. `Clippings/GitHub`)
6. Click **Save Settings**

## Usage

1. Navigate to any web page you want to clip
2. Click the **Obsidian Web Clipper** extension icon
3. The popup pre-fills:
   - **Title** — from the page's `og:title` or `<title>`
   - **Folder** — from your default settings
   - **Tags** — extracted from the page (click a tag to deselect it)
4. Optionally add notes in the **Extra notes** field
5. Click **Save to Obsidian**

The note is saved as a Markdown file with YAML frontmatter:

```markdown
---
title: "github.com/owner/repo"
url: "https://github.com/owner/repo"
description: "A short description"
stars: 1234
forks: 56
language: TypeScript
date_saved: 2026-03-12
tags:
  - github
  - typescript
  - obsidian
---

# github.com/owner/repo

> A short description

**URL:** https://github.com/owner/repo
**Stars:** 1234 | **Forks:** 56
**Language:** TypeScript
```

## Project Structure

```
obsidian-web-clipper/
├── manifest.json           # Chrome (Manifest V3)
├── manifest.firefox.json   # Firefox (Manifest V2)
├── icons/                  # Extension icons (16, 32, 48, 128px)
├── popup/
│   ├── popup.html          # Popup UI
│   ├── popup.css           # Popup styles (dark theme)
│   └── popup.js            # Popup logic
├── options/
│   ├── options.html        # Settings page
│   ├── options.css         # Settings styles (light/dark)
│   └── options.js          # Settings logic
├── background/
│   └── background.js       # Service worker: API calls & message routing
└── content/
    └── content.js          # Page data extraction
```

## Troubleshooting

| Problem | Solution |
|---|---|
| "Failed to fetch" on HTTPS | Open `https://127.0.0.1:27124` in your browser and accept the certificate |
| "Obsidian API not configured" | Open extension settings and fill in the API URL and key |
| "Could not extract page data" | Refresh the page and try again; some pages block content scripts |
| Note saves to wrong folder | Check the folder path in the popup before saving; no leading `/` needed |
| Tags not showing on GitHub | GitHub occasionally changes its DOM; try refreshing the page |

## License

MIT
