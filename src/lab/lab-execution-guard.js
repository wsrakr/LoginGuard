// Lab Mode execution guard: decides whether future Lab tests may run.
(() => {
  const SAFETY_NOTE = "Lab Mode execution guard only evaluates readiness. It does not execute tests, submit forms, or read input values.";
  const FUTURE_SAFE_CATEGORIES = new Set([
    "baseline-submit-observation",
    "empty-fields-observation",
    "response-message-comparison",
  ]);

  function evaluateExecutionReadiness(labPlan) {
    if (!labPlan) {
      return createResult({
        allowed: false,
        reason: "Lab Mode execution is refused because no lab plan was provided.",
      });
    }

    if (labPlan.allowed !== true) {
      const categories = getPlannedCategories(labPlan);

      return createResult({
        allowed: false,
        reason: "Lab Mode execution is refused because the lab plan is not allowed.",
        blockedCategories: categories,
      });
    }

    if (!labPlan.url) {
      const categories = getPlannedCategories(labPlan);

      return createResult({
        allowed: false,
        reason: "Lab Mode execution is refused because the lab plan URL is missing.",
        blockedCategories: categories,
      });
    }

    const labContext = globalThis.LoginGuardLabContext;
    const contextDecision = labContext?.isAllowedLabUrl
      ? labContext.isAllowedLabUrl(labPlan.url)
      : { allowed: false, reason: "Lab Mode context detector is unavailable." };

    if (!contextDecision.allowed) {
      const categories = getPlannedCategories(labPlan);

      return createResult({
        allowed: false,
        reason: `Lab Mode execution is refused because the URL is not an approved lab context. ${contextDecision.reason}`,
        blockedCategories: categories,
      });
    }

    const categories = getPlannedCategories(labPlan);

    if (categories.length === 0) {
      return createResult({
        allowed: false,
        reason: "Lab Mode execution is refused because no planned test categories were provided.",
      });
    }

    const allowedCategories = categories.filter((category) => FUTURE_SAFE_CATEGORIES.has(category));
    const blockedCategories = categories.filter((category) => !FUTURE_SAFE_CATEGORIES.has(category));

    if (allowedCategories.length === 0) {
      return createResult({
        allowed: false,
        reason: "Lab Mode execution is refused because no planned categories are currently approved for future execution.",
        allowedCategories,
        blockedCategories,
      });
    }

    return createResult({
      allowed: true,
      reason: blockedCategories.length > 0
        ? "Lab Mode execution readiness passed for approved categories. Unsupported categories remain blocked."
        : "Lab Mode execution readiness passed for approved categories.",
      allowedCategories,
      blockedCategories,
    });
  }

  function getPlannedCategories(labPlan) {
    if (!Array.isArray(labPlan?.tests)) {
      return [];
    }

    return labPlan.tests
      .map((test) => String(test?.category || ""))
      .filter(Boolean);
  }

  function createResult({
    allowed,
    reason,
    categories = [],
    allowedCategories = [],
    blockedCategories = [],
  }) {
    const categoryList = categories.length > 0 ? categories : [...allowedCategories, ...blockedCategories];

    return {
      allowed: Boolean(allowed),
      reason: String(reason),
      allowedCategories: allowedCategories.length > 0
        ? [...allowedCategories]
        : (allowed ? categoryList.filter((category) => FUTURE_SAFE_CATEGORIES.has(category)) : []),
      blockedCategories: blockedCategories.length > 0
        ? [...blockedCategories]
        : categoryList.filter((category) => !allowed || !FUTURE_SAFE_CATEGORIES.has(category)),
      safetyNote: SAFETY_NOTE,
    };
  }

  globalThis.LoginGuardLabExecutionGuard = {
    evaluateExecutionReadiness,
  };
})();
