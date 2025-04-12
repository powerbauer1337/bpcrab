let nativePort = null;

function connectNative() {
  nativePort = chrome.runtime.connectNative('com.bpcrab.downloader');
  nativePort.onMessage.addListener(handleNativeMessage);
  nativePort.onDisconnect.addListener(handleNativeDisconnect);
}

function displayError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = 'Error: ' + message;
  }
}

function sendMessage(message) {
  try {
    nativePort.postMessage(message);
  } catch (error) {
    console.error('Failed to send message to native host:', error);
    displayError('Failed to send message to native host');
  }
}

function sendTracksToServer(selectedTracks) {
  sendMessage({ type: 'download', payload: selectedTracks });
  cleanDownloadProgress();
  selectedTracks.forEach((track) => {
    updateDownloadProgress(track.id, 'downloading', track.artist, track.name);
  });
  displayError('');
}

function cleanTrackLists() {
  const selectedTracksDiv = document.getElementById('selected-tracks');
  const downloadProgressDiv = document.getElementById('download-progress');

  if (selectedTracksDiv) {
    selectedTracksDiv.innerHTML = '';
  }

  cleanDownloadProgress();
}

function cleanDownloadProgress() {
  const downloadProgressDiv = document.getElementById('download-progress');
  if (downloadProgressDiv) {
    downloadProgressDiv.innerHTML = '';
  }
}

function addTrackToSelected(track) {
  const selectedTracksDiv = document.getElementById('selected-tracks');
  if (!selectedTracksDiv) {
    console.error('selected-tracks div not found');
    return;
  }

  const trackElement = document.getElementById(`selected-${track.id}`);
  if (trackElement) {
    return;
  }

  const newTrackElement = document.createElement('div');
  newTrackElement.id = `selected-${track.id}`;
  newTrackElement.textContent = `${track.artist} - ${track.name} (ID: ${track.id})`;
  selectedTracksDiv.appendChild(newTrackElement);
}

function removeTrackFromSelected(trackId) {
  const selectedTracksDiv = document.getElementById('selected-tracks');
  if (!selectedTracksDiv) {
    console.error('selected-tracks div not found');
    return;
  }

  const trackElement = document.getElementById(`selected-${trackId}`);
  if (trackElement) {
    selectedTracksDiv.removeChild(trackElement);
  }
}

function displaySelectedTracks(selectedTracks) {
  const selectedTracksDiv = document.getElementById('selected-tracks');
  if (!selectedTracksDiv) {
    console.error('selected-tracks div not found');
    return;
  }

  selectedTracksDiv.innerHTML = '';

  selectedTracks.forEach((track) => {
    const newTrackElement = document.createElement('div');
    newTrackElement.id = `selected-${track.id}`;
    newTrackElement.textContent = `${track.artist} - ${track.name} (ID: ${track.id})`;
    selectedTracksDiv.appendChild(newTrackElement);
  });
}

function updateDownloadProgress(trackId, status, artist, name) {
  const downloadProgressDiv = document.getElementById('download-progress');
  if (!downloadProgressDiv) {
    console.error('download-progress div not found');
    return;
  }

  let trackElement = document.getElementById(`download-${trackId}`);
  if (!trackElement) {
    trackElement = document.createElement('div');
    trackElement.id = `download-${trackId}`;
    downloadProgressDiv.appendChild(trackElement);
  }
    
  if(trackElement){
      let message = `${artist} - ${name}: `;
      switch (status) {
        case 'downloading':
          message += `Downloading`;
          break;
        case 'completed':
          message += `Completed`;
          break;
        case 'error':
          message += `Error`;
          break;
        default:
          message += `Unknown status: ${status}`;
      }
      trackElement.textContent = message;
  }
}

function displayMessage(message) {
  const messageDiv = document.getElementById('message-display');
  if (messageDiv) {
    messageDiv.textContent = message;
  }
}

function handleNativeMessage(message) {
  try{
      console.log('Popup received message from Native Host:', message);
      if (message.type === 'progress') {
        updateDownloadProgress(message.track.id, message.status, message.track.artist, message.track.name);
      } else if (message.type === 'message') {
        displayMessage(message.content);
      }
  } catch(e){
    console.error("Invalid JSON received from native app")
  }
}

function handleNativeDisconnect() {
  console.log('Disconnected from native messaging host');
  displayError('Disconnected from native messaging host');
  nativePort = null;
}

document.addEventListener('DOMContentLoaded', () => {
  connectNative();
  
  chrome.storage.local.get('selectedTracks', (data) => {
    try {
      const selectedTracks = data.selectedTracks || [];
      selectedTracks.forEach((track) => {
        addTrackToSelected(track);
      });
    } catch (error) {
      console.error('Error processing selected tracks from storage:', error);
      displayError('Error loading selected tracks');
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'add') {
      addTrackToSelected(request.track);
    } else if(request.type === "progress"){
        updateDownloadProgress(request.track.id, request.status, request.track.artist, request.track.name)
    } else if(request.type === "message"){
        displayMessage(request.message)
    }

  });

  const sendTracksButton = document.getElementById('send-tracks');
  sendTracksButton.addEventListener('click', () => {
    chrome.storage.local.get('selectedTracks', (data) => {
      const selectedTracks = data.selectedTracks || [];
      sendTracksToServer(selectedTracks);
    });
  });
});