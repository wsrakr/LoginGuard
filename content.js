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
      const analyzer = globalThis.LoginGuardDomUtils;

      if (!analyzer) {
        throw new Error("LoginGuard DOM utilities were not loaded.");
      }

      sendResponse({
        ok: true,
        analysis: analyzer.analyzeLoginSurface(document),
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
