chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    console.info("LoginGuard installed. DOM analysis runs only from the popup on the active tab.");
  }
});
