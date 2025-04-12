--- a/extension/background.js
+++ b/extension/background.js

 let nativePort = null;
 
 function connectNative() {
   nativePort = chrome.runtime.connectNative('com.bpcrab.downloader');
 
   nativePort.onConnect.addListener(() => {
     console.log('Connected to native messaging host.');
   });
 
   nativePort.onMessage.addListener((message) => {
     try {
         console.log('Received message from native host:', message);
     } catch (error) {
       console.error('Error parsing message from native host:', error);
     }
   });
 
   nativePort.onDisconnect.addListener(() => {
     console.log('Disconnected from native messaging host.');
     nativePort = null
   });
 }
 
 function sendMessageToNativeHost(message) {
     try {
         if (nativePort) {
             nativePort.postMessage(message);
         }
     } catch (error) {
         console.error("Error sending message to native host:", error)
     }
 }
 
 chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
   if (request.url) {
       sendMessageToNativeHost({url: request.url});
   } else {
     sendMessageToNativeHost(request);
   }
 
   sendResponse({ received: true });
   return true
 });
 
 connectNative();
