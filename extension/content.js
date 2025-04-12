// content.js

function injectButton() {
  const downloadButton = document.createElement('button');
  downloadButton.id = 'send-to-downloader';
  downloadButton.textContent = 'Send to Downloader';
  downloadButton.style.display = 'none'; // Initially hidden
  downloadButton.style.position = 'absolute';
  const container = document.querySelector('.sticky-header + div');
  if (container) {
    container.style.position = 'relative';
  }
  downloadButton.style.bottom = '20px';
  downloadButton.style.right = '20px';
  downloadButton.style.padding = '10px 20px';
  downloadButton.style.backgroundColor = '#007bff';
  downloadButton.style.color = 'white';
  downloadButton.style.border = 'none';
  downloadButton.style.borderRadius = '5px';
  downloadButton.style.cursor = 'pointer';
  downloadButton.style.zIndex = '1000';
  document.body.appendChild(downloadButton);

  downloadButton.addEventListener('click', sendTracksToServer);
  console.log('Button injected and event listener added.');
}

function getTrackInfo(row) {
  try {
    const trackId = row.closest('[data-track-id]')?.dataset.trackId;
    const titleElement = row.querySelector('.buk-track-title');
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
    const artistElements = row.querySelectorAll('.buk-track-artists');
    const artist = Array.from(artistElements).map(a => a.textContent.trim()).join(', ') || 'Unknown Artist';

    if (!trackId) {
      console.error('Track ID not found for row:', row);
      return null;
    }

    return { id: trackId, title: title, artist: artist };
  } catch (error) {
    console.error('Error getting track info:', error);
    return null;
  }
}

function addTrackToSelection(trackInfo) {
  if (!trackInfo) return;
  try {
    chrome.storage.local.get({ selectedTracks: [] }, (result) => {
      let selectedTracks = result.selectedTracks;
      const existingTrackIndex = selectedTracks.findIndex(track => track.id === trackInfo.id);
      if (existingTrackIndex === -1) {
        selectedTracks.push(trackInfo);
        chrome.storage.local.set({ selectedTracks: selectedTracks }, () => {
          updateTrackRow(trackInfo.id, true);
          updateButtonVisibility();
          sendTracksToPopup(selectedTracks);
        });
      }
    });
  } catch (error) {
    console.error('Error adding track to selection:', error);
  }
}

function removeTrackFromSelection(trackId) {
  if (!trackId) return;
  try {
    chrome.storage.local.get({ selectedTracks: [] }, (result) => {
      let selectedTracks = result.selectedTracks;
      const existingTrackIndex = selectedTracks.findIndex(track => track.id === trackId);
      if (existingTrackIndex !== -1) {
        selectedTracks.splice(existingTrackIndex, 1);
        chrome.storage.local.set({ selectedTracks: selectedTracks }, () => {
          updateTrackRow(trackId, false);
          updateButtonVisibility();
          sendTracksToPopup(selectedTracks);
        });
      }
    });
  } catch (error) {
    console.error('Error removing track from selection:', error);
  }
}

function updateTrackRow(trackId, isSelected) {
  try {
    const trackRow = document.querySelector(`.bucket-item[data-track-id="${trackId}"]`);
    if (trackRow) {
      const trackLink = trackRow.querySelector('a');
      if (trackLink) {
        if (isSelected) {
          trackLink.style.color = 'lightblue';
          trackRow.classList.add('selected');
        } else {
          trackLink.style.color = '';
          trackRow.classList.remove('selected');
        }
      }
    }
  } catch (error) {
    console.error('Error updating track row:', error);
  }
}

function markTrackAsDownloaded(trackId) {
  try {
    const trackRow = document.querySelector(`.bucket-item[data-track-id="${trackId}"]`);
    if (trackRow) {
      const trackLink = trackRow.querySelector('a');
      if (trackLink) {
        trackLink.style.textDecoration = 'line-through';
        trackLink.style.color = 'gray';
        trackRow.classList.add('downloaded');
      }
    }
  } catch (error) {
    console.error('Error marking track as downloaded:', error);
  }
}

function unmarkTrackAsDownloaded(trackId) {
  try {
    const trackRow = document.querySelector(`.bucket-item[data-track-id="${trackId}"]`);
    if (trackRow) {
      const trackLink = trackRow.querySelector('a');
      if (trackLink) {
        trackLink.style.textDecoration = 'none';
        trackLink.style.color = '';
        trackRow.classList.remove('downloaded');
      }
    }
  } catch (error) {
    console.error('Error unmarking track as downloaded:', error);
  }
}

function updateAllTracks() {
  try {
    chrome.storage.local.get({ selectedTracks: [], downloadedTracks: [] }, (result) => {
      const selectedTracks = result.selectedTracks;
      const downloadedTracks = result.downloadedTracks;
      const trackRows = document.querySelectorAll('.bucket-item');

      trackRows.forEach(row => {
        const trackInfo = getTrackInfo(row);
        if (trackInfo) {
          const isSelected = selectedTracks.some(track => track.id === trackInfo.id);
          const isDownloaded = downloadedTracks.includes(trackInfo.id);

          updateTrackRow(trackInfo.id, isSelected);
          if (isDownloaded) {
            markTrackAsDownloaded(trackInfo.id);
          } else {
            unmarkTrackAsDownloaded(trackInfo.id);
          }
        }
      });
      console.log('All tracks updated based on storage.');
    });
  } catch (error) {
    console.error('Error updating all tracks:', error);
  }
}

function getAllTracks() {
  try {
    const trackRows = document.querySelectorAll('.bucket-item');
    const tracks = [];
    trackRows.forEach(row => {
      const trackInfo = getTrackInfo(row);
      if (trackInfo) {
        tracks.push(trackInfo);
      }
    });
    return tracks;
  } catch (error) {
    console.error('Error getting all tracks:', error);
    return [];
  }
}

function updateButtonVisibility() {
  try {
    chrome.storage.local.get({ selectedTracks: [] }, (result) => {
      const downloadButton = document.getElementById('send-to-downloader');
      if (downloadButton) {
        downloadButton.style.display = result.selectedTracks.length > 0 ? 'block' : 'none';
      }
    });
  } catch (error) {
    console.error('Error updating button visibility:', error);
  }
}

function sendTracksToServer() {
  try {
    chrome.storage.local.get({ selectedTracks: [] }, (result) => {
      const selectedTracks = result.selectedTracks;
      if (selectedTracks.length > 0) {
        chrome.runtime.sendMessage({ type: 'download', tracks: selectedTracks });
      }
    });
  } catch (error) {
    console.error('Error sending tracks to server:', error);
  }
}

function sendTracksToPopup(tracks) {
  try {
    chrome.runtime.sendMessage({ type: 'updateSelectedTracks', tracks: tracks });
  } catch (error) {
    console.error('Error sending tracks to popup:', error);
  }
}

function handleTrackClick(event) {
    const row = event.target?.closest('.bucket-item');
    if (row) {
      const trackInfo = getTrackInfo(row);
      if (trackInfo && !row.classList.contains('downloaded')) {
        if (row.classList.contains('selected')) {
          removeTrackFromSelection(trackInfo.id);
        } else {
          addTrackToSelection(trackInfo);
        }
      }
    }
  } catch (error) {
    console.error('Error handling track click:', error);
  }
}

let tracksLoaded = false;

function updateContent() {
  if (!tracksLoaded) {
    injectButton();
    tracksLoaded = true;
  }
  updateAllTracks();
  updateButtonVisibility();
}

const observer = new MutationObserver(() => {
  if (document.querySelectorAll('.bucket-item').length > 0) {
    updateContent();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
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