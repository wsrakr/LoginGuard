// Lab Mode baseline observation executor v0. Records safe metadata only; never submits forms.
(() => {
  const CATEGORY = "baseline-submit-observation";
  const SAFETY_NOTE = "Baseline Observation Executor v0 records safe metadata only. It does not submit forms, trigger events, create inputs, or read input values.";

  function runBaselineObservation({
    document: rootDocument,
    labPlan,
    readiness,
    baselineObservationPlan,
    userConfirmed,
  } = {}) {
    const confirmationGate = globalThis.LoginGuardLabExecutionConfirmation;
    const confirmation = confirmationGate?.evaluateExecutionConfirmation
      ? confirmationGate.evaluateExecutionConfirmation({
          labPlan,
          readiness,
          baselineObservationPlan,
          userConfirmed,
        })
      : {
          allowed: false,
          reason: "Lab Mode execution confirmation gate is unavailable.",
          safetyNote: "No baseline observation was executed because confirmation could not be evaluated.",
        };

    if (!confirmation.allowed) {
      return {
        id: createId("blocked"),
        category: CATEGORY,
        status: "blocked",
        startedAt: null,
        finishedAt: null,
        observations: [],
        reason: confirmation.reason,
        safetyNote: confirmation.safetyNote || SAFETY_NOTE,
      };
    }

    const startedAt = new Date().toISOString();
    const observations = collectSafeObservations(rootDocument, baselineObservationPlan);
    const finishedAt = new Date().toISOString();

    return {
      id: createId("executed"),
      category: CATEGORY,
      status: "executed",
      startedAt,
      finishedAt,
      observations,
      reason: "Baseline observation completed with safe metadata only.",
      safetyNote: SAFETY_NOTE,
    };
  }

  function collectSafeObservations(rootDocument, baselineObservationPlan) {
    const forms = canQuery(rootDocument)
      ? Array.from(rootDocument.querySelectorAll("form"))
      : [];
    const targetForms = Array.isArray(baselineObservationPlan?.targetForms)
      ? baselineObservationPlan.targetForms
      : [];

    return [
      createObservation("current-url-before-observation", {
        url: getSanitizedDocumentUrl(rootDocument),
      }),
      createObservation("form-count", {
        count: forms.length,
      }),
      createObservation("target-form-count", {
        count: targetForms.length,
      }),
      createObservation("form-method-and-action-presence", {
        forms: targetForms.map((form) => ({
          index: toFiniteNumber(form?.index),
          method: String(form?.method || ""),
          actionPresent: Boolean(form?.actionPresent),
        })),
      }),
      createObservation("auth-like-input-metadata-count", {
        count: targetForms.reduce((total, form) => total + toFiniteNumber(form?.authLikeInputCount), 0),
      }),
      createObservation("submit-control-presence-if-available", {
        forms: targetForms.map((form) => ({
          index: toFiniteNumber(form?.index),
          submitControlPresent: hasSubmitControl(forms[toFiniteNumber(form?.index)]),
        })),
      }),
    ];
  }

  function hasSubmitControl(form) {
    if (!form || typeof form.querySelector !== "function") {
      return false;
    }

    return Boolean(form.querySelector("button, input[type='submit'], input[type='button']"));
  }

  function createObservation(name, data) {
    return {
      name,
      data,
      safetyNote: "Observation contains safe metadata only and no input values.",
    };
  }

  function createId(status) {
    return `${status}:${CATEGORY}:${Date.now()}`;
  }

  function getSanitizedDocumentUrl(rootDocument) {
    const href = String(rootDocument?.location?.href || "");

    if (!href) {
      return "";
    }

    try {
      const url = new URL(href);

      return `${url.origin}${url.pathname}`;
    } catch (_error) {
      return href.split("#")[0].split("?")[0];
    }
  }

  function canQuery(rootDocument) {
    return rootDocument && typeof rootDocument.querySelectorAll === "function";
  }

  function toFiniteNumber(value) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  globalThis.LoginGuardLabBaselineExecutor = {
    runBaselineObservation,
  };
})();
