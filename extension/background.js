// background.js

let ws;
let selectedTracks = [];

function connectToWebSocket() {
    ws = new WebSocket('ws://localhost:8080');

    ws.addEventListener('open', (event) => {
        console.log('Successfully connected to WebSocket server');
    });

    ws.addEventListener('message', (event) => {
        console.log('Received message from server:', event.data);
    });

    ws.addEventListener('error', (event) => {
        console.error('WebSocket connection error:', event);
        setTimeout(connectToWebSocket, 1000);
    });

    ws.addEventListener('close', (event) => {
        console.log('Disconnected from WebSocket server. Attempting to reconnect...');
        setTimeout(connectToWebSocket, 1000);
    });

    window.sendMessage = (message) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        } else {
            console.error('Failed to send message: WebSocket is not open.');
        }
    };
}

connectToWebSocket();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateSelectedTracks") {
        selectedTracks = request.tracks;
    } else if (request.action === "getSelectedTracks") {
        sendResponse({ tracks: selectedTracks });
        return true; // Keep the channel open for the response
    }
});