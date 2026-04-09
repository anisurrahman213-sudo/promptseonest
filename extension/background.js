// PromptSEONest Background Service Worker

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'promptseonest-analyze',
    title: 'Generate Metadata with PromptSEONest',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'promptseonest-analyze' && info.srcUrl) {
    // Store the image URL and open popup
    chrome.storage.local.set({ pendingImageUrl: info.srcUrl }, () => {
      // Open popup programmatically isn't possible in MV3,
      // so we open the popup page in a new window
      chrome.windows.create({
        url: 'popup.html?image=' + encodeURIComponent(info.srcUrl),
        type: 'popup',
        width: 450,
        height: 620
      });
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PLATFORM_DETECTED') {
    chrome.storage.local.set({ detectedPlatform: msg.platform });
  }
  return true;
});
