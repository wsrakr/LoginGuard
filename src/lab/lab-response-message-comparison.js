// Lab Mode response-message comparison planner. This creates metadata only and never executes tests.
(() => {
  const CATEGORY = "response-message-comparison";
  const SAFETY_NOTE = "Response message comparison planning only records approved metadata. It does not submit forms, collect response bodies, read or modify input values, or execute tests.";
  const OBSERVATIONS_PLANNED = [
    "current-url-before-response-message-comparison",
    "target-form-count",
    "response-message-region-metadata-if-available",
    "form-method-and-action-presence",
    "submit-control-presence-if-available",
    "expected-no-response-body-collection",
    "expected-no-input-value-reading",
  ];

  function buildResponseMessageComparisonPlan(labPlan, readiness) {
    if (!labPlan) {
      return createPlan(
        "blocked",
        "Response message comparison planning is blocked because no Lab Mode plan was provided.",
      );
    }

    if (labPlan.allowed !== true) {
      return createPlan(
        "blocked",
        "Response message comparison planning is blocked because the Lab Mode plan is not allowed.",
      );
    }

    if (!readiness) {
      return createPlan(
        "blocked",
        "Response message comparison planning is blocked because execution readiness was not provided.",
      );
    }

    if (readiness.allowed !== true) {
      return createPlan(
        "blocked",
        "Response message comparison planning is blocked because execution readiness is not allowed.",
      );
    }

    if (!categoryIsAllowed(readiness)) {
      return createPlan(
        "blocked",
        "Response message comparison planning is blocked because the response-message category is not allowed by readiness.",
      );
    }

    return createPlan(
      "planned",
      "Response message comparison is planned for a future controlled local lab check.",
      sanitizeTargetForms(labPlan.detectedForms),
      OBSERVATIONS_PLANNED,
    );
  }

  function categoryIsAllowed(readiness) {
    return Array.isArray(readiness?.allowedCategories)
      && readiness.allowedCategories.includes(CATEGORY);
  }

  function sanitizeTargetForms(forms) {
    if (!Array.isArray(forms)) {
      return [];
    }

    return forms.map((form) => ({
      index: toFiniteNumber(form?.index),
      method: String(form?.method || ""),
      actionPresent: Boolean(form?.actionPresent),
      inputCount: toFiniteNumber(form?.inputCount),
      authLikeInputCount: toFiniteNumber(form?.authLikeInputCount),
      hasPasswordField: Boolean(form?.hasPasswordField),
      submitControlPresent: Boolean(form?.submitControlPresent),
    }));
  }

  function createPlan(status, reason, targetForms = [], observationsPlanned = []) {
    return {
      category: CATEGORY,
      status: status === "planned" ? "planned" : "blocked",
      reason: String(reason || "No reason was provided."),
      targetForms: Array.isArray(targetForms) ? targetForms : [],
      observationsPlanned: Array.isArray(observationsPlanned) ? [...observationsPlanned] : [],
      safetyNote: SAFETY_NOTE,
    };
  }

  function toFiniteNumber(value) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  globalThis.LoginGuardLabResponseMessageComparison = {
    buildResponseMessageComparisonPlan,
  };
})();
