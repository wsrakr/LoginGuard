// Lab Mode empty-fields observation planner. This creates metadata only and never executes tests.
(() => {
  const CATEGORY = "empty-fields-observation";
  const SAFETY_NOTE = "Empty fields observation planning only records approved metadata. It does not submit forms, read input values, clear fields, modify inputs, change values, or execute tests.";
  const OBSERVATIONS_PLANNED = [
    "current-url-before-empty-fields-observation",
    "target-form-count",
    "empty-fields-precondition-metadata",
    "form-method-and-action-presence",
    "submit-control-presence-if-available",
    "expected-no-input-value-reading",
  ];

  function buildEmptyFieldsObservationPlan(labPlan, readiness) {
    const plan = labPlan || {};

    if (!labPlan) {
      return createPlan({
        status: "blocked",
        reason: "Empty fields observation planning is blocked because no Lab Mode plan was provided.",
        targetForms: [],
      });
    }

    if (plan.allowed !== true) {
      return createPlan({
        status: "blocked",
        reason: "Empty fields observation planning is blocked because the Lab Mode plan is not allowed.",
        targetForms: [],
      });
    }

    if (!readiness) {
      return createPlan({
        status: "blocked",
        reason: "Empty fields observation planning is blocked because execution readiness was not provided.",
        targetForms: [],
      });
    }

    if (readiness.allowed !== true) {
      return createPlan({
        status: "blocked",
        reason: "Empty fields observation planning is blocked because execution readiness is not allowed.",
        targetForms: [],
      });
    }

    if (!categoryIsAllowed(readiness)) {
      return createPlan({
        status: "blocked",
        reason: "Empty fields observation planning is blocked because the empty-fields category is not allowed by readiness.",
        targetForms: [],
      });
    }

    return createPlan({
      status: "planned",
      reason: "Empty fields observation planning is ready for a future local metadata-only observation.",
      targetForms: sanitizeTargetForms(plan.detectedForms),
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
      submitControlPresent: Boolean(form?.submitControlPresent),
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
      status: ["planned", "blocked"].includes(status) ? status : "blocked",
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

  globalThis.LoginGuardLabEmptyFieldsObservation = {
    buildEmptyFieldsObservationPlan,
  };
})();
