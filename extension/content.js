// PromptSEONest Content Script
// Runs on stock platform upload pages

(function() {
  const url = window.location.href;
  let platform = null;

  if (url.includes('stock.adobe.com') || url.includes('upload.stock.adobe.com')) {
    platform = 'adobe_stock';
  } else if (url.includes('contributor.shutterstock.com')) {
    platform = 'shutterstock';
  } else if (url.includes('contributor.freepik.com')) {
    platform = 'freepik';
  }

  if (platform) {
    chrome.runtime.sendMessage({ type: 'PLATFORM_DETECTED', platform });
  }
})();
