// Lab Runner skeleton: creates safe local test plans without executing tests.
(() => {
  const REFUSAL_SAFETY_NOTE = "Lab Mode refused to run because this page is not an approved local lab context.";
  const PLAN_SAFETY_NOTE = "Lab Mode created a local test plan only. No forms were submitted and no credentials were collected.";
  const PLANNED_TEST_CATEGORIES = [
    "baseline-submit-observation",
    "empty-fields-observation",
    "invalid-synthetic-credentials-observation",
    "response-message-comparison",
  ];
  const AUTH_INPUT_TYPES = new Set([
    "email",
    "password",
    "search",
    "tel",
    "text",
    "url",
  ]);

  function createLabTestPlan(rootDocument, context = {}) {
    const labContext = globalThis.LoginGuardLabContext;
    const location = rootDocument?.location || context.location || context.url;
    const labDecision = labContext?.isAllowedLabUrl
      ? labContext.isAllowedLabUrl(location)
      : createContextUnavailableResult();

    if (!labDecision.allowed) {
      return {
        allowed: false,
        reason: labDecision.reason,
        tests: [],
        safetyNote: REFUSAL_SAFETY_NOTE,
      };
    }

    const detectedForms = collectForms(rootDocument);
    const detectedInputs = collectAuthLikeInputs(rootDocument);

    return {
      allowed: true,
      url: labDecision.normalizedUrl || normalizeDocumentUrl(location),
      generatedAt: new Date().toISOString(),
      detectedForms,
      detectedInputs,
      tests: createPlannedTests(detectedForms, detectedInputs),
      safetyNote: PLAN_SAFETY_NOTE,
    };
  }

  function collectForms(rootDocument) {
    if (!canQuery(rootDocument)) {
      return [];
    }

    return Array.from(rootDocument.querySelectorAll("form")).map((form, index) => {
      const inputs = Array.from(form.querySelectorAll("input"));

      return {
        index,
        id: getAttributeValue(form, "id"),
        name: getAttributeValue(form, "name"),
        method: normalizeMethod(getAttributeValue(form, "method")),
        actionPresent: form.hasAttribute("action"),
        inputCount: inputs.length,
        authLikeInputCount: inputs.filter(isAuthLikeInput).length,
        hasPasswordField: inputs.some((input) => getInputType(input) === "password"),
      };
    });
  }

  function collectAuthLikeInputs(rootDocument) {
    if (!canQuery(rootDocument)) {
      return [];
    }

    return Array.from(rootDocument.querySelectorAll("input"))
      .filter(isAuthLikeInput)
      .map((input, index) => ({
        index,
        type: getInputType(input),
        name: getAttributeValue(input, "name"),
        id: getAttributeValue(input, "id"),
        autocomplete: getAttributeValue(input, "autocomplete"),
        placeholderPresent: input.hasAttribute("placeholder"),
      }));
  }

  function createPlannedTests(detectedForms, detectedInputs) {
    if (detectedForms.length === 0 && detectedInputs.length === 0) {
      return [];
    }

    return PLANNED_TEST_CATEGORIES.map((category) => ({
      category,
      plannedOnly: true,
      executable: false,
      target: detectedForms.length > 0 ? "detected-form" : "detected-input-region",
      safetyNote: "Planned observation only; this skeleton does not submit forms or provide test values.",
    }));
  }

  function isAuthLikeInput(input) {
    const type = getInputType(input);

    if (AUTH_INPUT_TYPES.has(type)) {
      return true;
    }

    return hasAuthKeyword(getAttributeValue(input, "name"))
      || hasAuthKeyword(getAttributeValue(input, "id"))
      || hasAuthKeyword(getAttributeValue(input, "autocomplete"));
  }

  function getInputType(input) {
    return String(getAttributeValue(input, "type") || "text").toLowerCase();
  }

  function getAttributeValue(element, attributeName) {
    const value = element.getAttribute(attributeName);

    return value ? String(value) : "";
  }

  function hasAuthKeyword(value) {
    return /user|email|login|password|passcode|otp|code|mfa|2fa/i.test(value || "");
  }

  function normalizeMethod(method) {
    return method ? String(method).toLowerCase() : "get";
  }

  function normalizeDocumentUrl(location) {
    if (!location) {
      return "";
    }

    if (typeof location === "string") {
      return location;
    }

    return typeof location.href === "string" ? location.href : "";
  }

  function canQuery(rootDocument) {
    return rootDocument && typeof rootDocument.querySelectorAll === "function";
  }

  function createContextUnavailableResult() {
    return {
      allowed: false,
      reason: "Lab Mode context detector is unavailable.",
    };
  }

  globalThis.LoginGuardLabRunner = {
    createLabTestPlan,
  };
})();
