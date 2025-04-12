// background.js

function connectToWebSocket() {
  let ws = new WebSocket('ws://localhost:8080');

  ws.addEventListener('open', (event) => {
    console.log('Connected to WebSocket server');
  });

  ws.addEventListener('message', (event) => {
    console.log('Message from server:', event.data);
    try {
      const message = JSON.parse(event.data);
    } catch (e) {
      console.error("Invalid JSON from server", e);
    }
  });

  ws.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
    setTimeout(connectToWebSocket, 1000);
  });

  ws.addEventListener('close', (event) => {
    console.log('Disconnected from WebSocket server. Reconnecting...');
    setTimeout(connectToWebSocket, 1000);
  });

  return ws
}

function sendMessage(message, websocket) {
  if (websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(message));
  } else {
    console.error('WebSocket is not open.');
    connectToWebSocket()
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.url) {
    sendMessage({ url: request.url }, ws);
  }
});