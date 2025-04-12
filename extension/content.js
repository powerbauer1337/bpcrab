console.log("content.js loaded");

if (window.location.href.includes("beatport.com")) {
    const url = window.location.href;

    if (url.includes("/track/")) {
        chrome.runtime.sendMessage({ url: url });
    } else {
        document.querySelectorAll('a[href*="/track/"]').forEach(link => {
            chrome.runtime.sendMessage({ url: link.href });
        });
    }
}