// Lab Mode execution confirmation gate. This decides only; it never executes tests.
(() => {
  const CATEGORY = "baseline-submit-observation";
  const SAFETY_NOTE = "Lab Mode execution confirmation only evaluates whether future execution may proceed. It does not submit forms, execute tests, or read input values.";

  function evaluateExecutionConfirmation({
    labPlan,
    readiness,
    baselineObservationPlan,
    userConfirmed,
  } = {}) {
    if (userConfirmed !== true) {
      return createResult(false, "Execution confirmation is refused because the user has not explicitly confirmed.");
    }

    if (!labPlan || labPlan.allowed !== true) {
      return createResult(false, "Execution confirmation is refused because the Lab Mode plan is missing or not allowed.");
    }

    if (!readiness || readiness.allowed !== true) {
      return createResult(false, "Execution confirmation is refused because execution readiness is missing or not allowed.");
    }

    if (!baselineObservationPlan) {
      return createResult(false, "Execution confirmation is refused because no baseline observation plan was provided.");
    }

    if (baselineObservationPlan.status !== "planned") {
      return createResult(false, "Execution confirmation is refused because the baseline observation plan is not planned.");
    }

    if (!categoryIsAllowed(readiness)) {
      return createResult(false, "Execution confirmation is refused because baseline-submit-observation is not an allowed readiness category.");
    }

    return createResult(true, "Execution confirmation passed for the baseline-submit-observation category.");
  }

  function categoryIsAllowed(readiness) {
    return Array.isArray(readiness?.allowedCategories)
      && readiness.allowedCategories.includes(CATEGORY);
  }

  function createResult(allowed, reason) {
    return {
      confirmed: Boolean(allowed),
      allowed: Boolean(allowed),
      reason: String(reason),
      category: CATEGORY,
      safetyNote: SAFETY_NOTE,
    };
  }

  globalThis.LoginGuardLabExecutionConfirmation = {
    evaluateExecutionConfirmation,
  };
})();
