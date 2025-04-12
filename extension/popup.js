let isConnected = false;

function connectToWebSocket() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "connectWebSocket" }, (response) => {
      if (response && response.success) {
        resolve();
      } else {
        const error = new Error("Failed to connect to WebSocket");
        console.error(error);
        updateConnectionStatus(false);
        reject(error);
      }
    });
  });
}

function displayError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = "Error: " + message;
}

function sendMessage(message) {
  chrome.runtime.sendMessage({ action: "sendMessage", message: message });
}

function sendTracksToServer(selectedTracks) {
  sendMessage({ type: "download", payload: selectedTracks });
  cleanDownloadProgress();
  selectedTracks.forEach((track) => {
    updateDownloadProgress(track.id, "downloading", track.artist, track.name);
  });
  displayError("");
}

function cleanTrackLists() {
  const selectedTracksDiv = document.getElementById("selected-tracks");
  const downloadProgressDiv = document.getElementById("download-progress");

  if (selectedTracksDiv) {
    selectedTracksDiv.innerHTML = "";
  }

  cleanDownloadProgress();
}

function cleanDownloadProgress() {
  const downloadProgressDiv = document.getElementById("download-progress");
  if (downloadProgressDiv) {
  }

  if (downloadProgressDiv) {
    downloadProgressDiv.innerHTML = "";
  }
}

function addTrackToSelected(track) {
  const selectedTracksDiv = document.getElementById("selected-tracks");
  if (!selectedTracksDiv) {
    console.error("selected-tracks div not found");
    return;
  }

  const trackElement = document.getElementById(`selected-${track.id}`);
  if (trackElement) {
    return;
  }

  const newTrackElement = document.createElement("div");
  newTrackElement.id = `selected-${track.id}`;
  newTrackElement.textContent = `${track.artist} - ${track.name} (ID: ${track.id})`;
  selectedTracksDiv.appendChild(newTrackElement);
}

function removeTrackFromSelected(trackId) {
  const selectedTracksDiv = document.getElementById("selected-tracks");
  if (!selectedTracksDiv) {
    console.error("selected-tracks div not found");
    return;
  }

  const trackElement = document.getElementById(`selected-${trackId}`);
  if (trackElement) {
    selectedTracksDiv.removeChild(trackElement);
  }
}

function displaySelectedTracks(selectedTracks) {
  const selectedTracksDiv = document.getElementById("selected-tracks");
  if (!selectedTracksDiv) {
    console.error("selected-tracks div not found");
    return;
  }

  selectedTracksDiv.innerHTML = "";

  selectedTracks.forEach((track) => {
    const newTrackElement = document.createElement("div");
    newTrackElement.id = `selected-${track.id}`;
    newTrackElement.textContent = `${track.artist} - ${track.name} (ID: ${track.id})`;
    selectedTracksDiv.appendChild(newTrackElement);
  });
}

function updateDownloadProgress(trackId, status) {
  const downloadProgressDiv = document.getElementById("download-progress");
  if (!downloadProgressDiv) {
    console.error("download-progress div not found");
    return;
  }

  let trackElement = document.getElementById(`download-${trackId}`);
  if (!trackElement) {
    trackElement = document.createElement("div");
    trackElement.id = `download-${trackId}`;
    downloadProgressDiv.appendChild(trackElement);
  }

  let message = "";
  switch (status) {
    case "downloading":
      message = `Downloading: ${trackElement.textContent}`;
      break;
    case "completed":
      message = `Completed: ${trackElement.textContent}`;
      break;
    case "error":
      message = `Error: ${trackElement.textContent}`;
      break;
    default:
      message = `Unknown status: ${status} for ${trackElement.textContent}`;
  }
  if (trackElement) {
    trackElement.textContent = message;
  }
}

function updateConnectionStatus(status) {
  isConnected = status;
  const statusDiv = document.getElementById("connection-status");
  if (statusDiv) {
    statusDiv.textContent = isConnected
      ? "Connected to BeatportDL"
      : "Disconnected from BeatportDL";
    statusDiv.style.color = isConnected ? "green" : "red";
  }
}

function displayMessage(message) {
  const messageDiv = document.getElementById("message-display");
  if (messageDiv) {
    messageDiv.textContent = message;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await connectToWebSocket();
    console.log("Popup connected to WebSocket");

    if (!popupLoaded) {
      cleanTrackLists();

      chrome.storage.local.get("selectedTracks", (data) => {
        try {
          const selectedTracks = data.selectedTracks || [];
          selectedTracks.forEach((track) => {
            addTrackToSelected(track);
          });
        } catch (error) {
          console.error("Error processing selected tracks from storage:", error);
          displayError("Error loading selected tracks");
        }
      });

      popupLoaded = true;
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        if (request.type === "add") {
          addTrackToSelected(request.track);
        console.log("Popup received message:", request.message);
      }
    });

    const sendTracksButton = document.getElementById("send-tracks");
    sendTracksButton.addEventListener("click", () => {
      chrome.storage.local.get("selectedTracks", (data) => {
        const selectedTracks = data.selectedTracks || [];
        sendTracksToServer(selectedTracks);
      });
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        if (request.type === "progress") {
          updateDownloadProgress(
            request.track.id,
            request.status,
            request.track.artist,
            request.track.name
          );
        } else if (request.type === "message") {
          console.log("Popup received message:", request.message);
        }
      } catch (error) {
        console.error("Error handling message:", error);
        displayError("Error updating track progress");
      }
      sendResponse({ received: true });
    });
  } catch (error) {
    console.error("Popup failed to connect to WebSocket:", error);
  }
});