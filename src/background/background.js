// Background service worker for extension lifecycle events.
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    console.info("LoginGuard installed. Analysis runs only from the popup on the active tab.");
  }
});
