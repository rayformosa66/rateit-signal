// Service worker for RateIt Signal.
// Keeps the extension registered and available for chrome.tabs.query calls from the popup.

chrome.runtime.onInstalled.addListener(() => {
  console.log('RateIt Signal installed.');
});
