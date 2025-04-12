console.log("content.js loaded");

if (window.location.href.includes("beatport.com")) {
    const url = window.location.href;

    if (url.includes("/track/")) {
        // For individual track pages
        chrome.runtime.sendMessage({ url: url });
    } else {
        // For other pages (e.g., releases, playlists)
        const trackLinks = [];
        document.querySelectorAll('a[href*="/track/"]').forEach(link => {
            trackLinks.push(link.href);
        });

        if (trackLinks.length > 0) {
            trackLinks.forEach(trackUrl => {
                chrome.runtime.sendMessage({ url: trackUrl });
            });
        }
    }
}
```
```json
{
  "manifest_version": 3,
  "name": "Beatport Downloader",
  "version": "1.0",
  "description": "Download Beatport tracks using a Go app",
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "*://*.beatport.com/*"
      ],
      "js": [
        "content.js"
      ]
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png"
  },
  "permissions": [
    "activeTab",
    "storage",
    "webNavigation"
  ],
  "action": {
    "default_popup": "popup.html"
  }
}