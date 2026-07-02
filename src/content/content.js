// Content script bridge that exposes current-page scan results to the popup.
(() => {
  const CONTENT_STATE_KEY = "__loginGuardContentInitialized";
  const MESSAGE_TYPE = "LOGIN_GUARD_ANALYZE";
  const LAB_PLAN_MESSAGE_TYPE = "LOGIN_GUARD_CREATE_LAB_PLAN";

  if (globalThis[CONTENT_STATE_KEY]) {
    return;
  }

  globalThis[CONTENT_STATE_KEY] = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === MESSAGE_TYPE) {
      handleAnalyzeMessage(message, sendResponse);
      return false;
    }

    if (message?.type === LAB_PLAN_MESSAGE_TYPE) {
      handleLabPlanMessage(message, sendResponse);
      return false;
    }

    return false;
  });

  function handleAnalyzeMessage(message, sendResponse) {
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
  }

  function handleLabPlanMessage(message, sendResponse) {
    try {
      const labRunner = globalThis.LoginGuardLabRunner;

      if (!labRunner) {
        throw new Error("LoginGuard Lab Runner was not loaded.");
      }

      sendResponse({
        ok: true,
        labPlan: labRunner.createLabTestPlan(document, message.context || {}),
      });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error.message,
      });
    }
  }
})();
