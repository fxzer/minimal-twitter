// Used by the manifest v3 extension

chrome.runtime.onInstalled.addListener((object) => {
  if (object.reason !== "install") {
    return;
  }

  const targetUrl = `https://typefully.com/minimal-twitter/welcome`;

  if (targetUrl) {
    chrome.tabs.create({
      url: targetUrl,
    });

    // Reload any open Twitter/X tabs
    chrome.tabs.query({ url: "*://twitter.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id);
      });
    });
    chrome.tabs.query({ url: "*://x.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id);
      });
    });
  }
});
