// Content script bridge that exposes current-page scan results to the popup.
(() => {
  const CONTENT_STATE_KEY = "__loginGuardContentInitialized";
  const MESSAGE_TYPE = "LOGIN_GUARD_ANALYZE";

  if (globalThis[CONTENT_STATE_KEY]) {
    return;
  }

  globalThis[CONTENT_STATE_KEY] = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== MESSAGE_TYPE) {
      return false;
    }

    try {
      const scanner = globalThis.LoginGuardScanner;

      if (!scanner) {
        throw new Error("LoginGuard scanner was not loaded.");
      }

      sendResponse({
        ok: true,
        analysis: scanner.scan(document, {
          responseHeaders: message.responseHeaders || null,
        }),
      });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error.message,
      });
    }

    return false;
  });
})();
