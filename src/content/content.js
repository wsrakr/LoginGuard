// Content script bridge that exposes current-page scan results to the popup.
(() => {
  const CONTENT_STATE_KEY = "__loginGuardContentInitialized";
  const MESSAGE_TYPE = "LOGIN_GUARD_ANALYZE";
  const LAB_PLAN_MESSAGE_TYPE = "LOGIN_GUARD_CREATE_LAB_PLAN";
  const BASELINE_OBSERVATION_MESSAGE_TYPE = "LOGIN_GUARD_RUN_BASELINE_OBSERVATION";

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

    if (message?.type === BASELINE_OBSERVATION_MESSAGE_TYPE) {
      handleBaselineObservationMessage(message, sendResponse);
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
      const executionGuard = globalThis.LoginGuardLabExecutionGuard;

      if (!labRunner) {
        throw new Error("LoginGuard Lab Runner was not loaded.");
      }

      const labPlan = labRunner.createLabTestPlan(document, message.context || {});
      const executionReadiness = executionGuard?.evaluateExecutionReadiness
        ? executionGuard.evaluateExecutionReadiness(labPlan)
        : {
            allowed: false,
            reason: "LoginGuard Lab Execution Guard was not loaded.",
            allowedCategories: [],
            blockedCategories: [],
            safetyNote: "Lab Mode execution readiness could not be evaluated. No tests were executed.",
          };

      sendResponse({
        ok: true,
        labPlan,
        executionReadiness,
      });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error.message,
      });
    }
  }

  function handleBaselineObservationMessage(message, sendResponse) {
    try {
      const baselineExecutor = globalThis.LoginGuardLabBaselineExecutor;

      if (!baselineExecutor) {
        throw new Error("LoginGuard Lab Baseline Executor was not loaded.");
      }

      sendResponse({
        ok: true,
        executionResult: baselineExecutor.runBaselineObservation({
          document,
          labPlan: message.labPlan || null,
          readiness: message.readiness || null,
          baselineObservationPlan: message.baselineObservationPlan || null,
          userConfirmed: message.userConfirmed === true,
        }),
      });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error.message,
      });
    }
  }
})();
