// Lab Mode baseline observation planner. This creates metadata only and never executes tests.
(() => {
  const CATEGORY = "baseline-submit-observation";
  const SAFETY_NOTE = "Baseline observation planning only records approved metadata. It does not submit forms, create inputs, execute tests, read input values, or change values.";
  const OBSERVATIONS_PLANNED = [
    "current-url-before-action",
    "form-method-and-action-presence",
    "auth-like-input-metadata",
    "submit-control-presence-if-available",
  ];

  function buildBaselineObservationPlan(labPlan, readiness) {
    const plan = labPlan || {};
    const targetForms = sanitizeTargetForms(plan.detectedForms);

    if (plan.allowed !== true) {
      return createPlan({
        status: "blocked",
        reason: "Baseline observation planning is blocked because the Lab Mode plan is not allowed.",
        targetForms: [],
      });
    }

    if (readiness?.allowed !== true) {
      return createPlan({
        status: "blocked",
        reason: "Baseline observation planning is blocked because execution readiness is not allowed.",
        targetForms: [],
      });
    }

    if (!categoryIsAllowed(readiness)) {
      return createPlan({
        status: "blocked",
        reason: "Baseline observation planning is blocked because the baseline category is not allowed by readiness.",
        targetForms: [],
      });
    }

    if (targetForms.length === 0) {
      return createPlan({
        status: "skipped",
        reason: "Baseline observation planning was skipped because no detected forms were available in the Lab Mode plan.",
        targetForms: [],
      });
    }

    return createPlan({
      status: "planned",
      reason: "Baseline observation planning is ready for future local Lab Mode observation.",
      targetForms,
      observationsPlanned: OBSERVATIONS_PLANNED,
    });
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
    }));
  }

  function createPlan({
    status,
    reason,
    targetForms,
    observationsPlanned = [],
  }) {
    return {
      category: CATEGORY,
      status: ["planned", "blocked", "skipped"].includes(status) ? status : "skipped",
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

  globalThis.LoginGuardLabBaselineObservation = {
    buildBaselineObservationPlan,
  };
})();
