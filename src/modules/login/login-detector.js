// Login Detection Engine: read-only authentication surface detection.
(() => {
  const MODULE_ID = "login-detector";
  const FIELD_TYPES = Object.freeze({
    USERNAME: "username",
    EMAIL: "email",
    PASSWORD: "password",
  });
  const CONFIDENCE = Object.freeze({
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
    NONE: "None",
  });

  const LOGIN_TEXT_PATTERN = /\b(log\s*in|login|sign\s*in|signin|authenticate|account|password|continue)\b/i;
  const REGISTRATION_TEXT_PATTERN = /\b(create\s+account|sign\s*up|signup|register|registration|join|new\s+account)\b/i;
  const SUBMIT_TEXT_PATTERN = /\b(log\s*in|login|sign\s*in|signin|sign\s*up|signup|register|create\s+account|submit|continue|next|enter)\b/i;
  const VIRTUAL_CONTAINER_SELECTOR = [
    "[role='form']",
    "[data-testid*='login' i]",
    "[data-testid*='signup' i]",
    "[data-testid*='register' i]",
    "[data-test*='login' i]",
    "[data-test*='signup' i]",
    "[data-test*='register' i]",
    "[class*='login' i]",
    "[class*='signup' i]",
    "[class*='register' i]",
    "[id*='login' i]",
    "[id*='signup' i]",
    "[id*='register' i]",
    "section",
    "main",
    "div",
  ].join(",");

  function detect(rootDocument) {
    const domUtils = globalThis.LoginGuardDomUtils;
    const fields = detectFields(rootDocument);
    const submitButtons = detectSubmitButtons(rootDocument);
    const candidates = [
      ...detectNativeFormCandidates(rootDocument, fields, submitButtons),
      ...detectVirtualFormCandidates(rootDocument, fields, submitButtons),
    ];
    const bestCandidate = getBestCandidate(candidates);
    const counts = countFieldTypes(fields);
    const submitButtonCount = submitButtons.length;
    const type = classifyAuthenticationType(rootDocument, bestCandidate);
    const reasons = buildReasons(rootDocument, counts, submitButtonCount, type);
    const confidenceScore = calculateConfidenceScore(counts, submitButtonCount, reasons);
    const authenticationDetected = confidenceScore >= 50;
    const confidence = scoreToConfidenceLabel(confidenceScore);

    return {
      id: MODULE_ID,
      authenticationDetected,
      type,
      confidence,
      confidenceScore,
      reasons,
      loginDetected: authenticationDetected,
      passwordFields: counts.password,
      usernameFields: counts.username,
      emailFields: counts.email,
      submitButtons: submitButtonCount,
      hasLoginForm: authenticationDetected,
      fields: {
        counts: {
          username: counts.username,
          email: counts.email,
          password: counts.password,
          total: fields.length,
        },
        items: fields.map(toPublicFieldSummary),
      },
      forms: candidates,
      candidates,
      summary: {
        usernameOrEmailFields: counts.username + counts.email,
        nativeForms: candidates.filter((candidate) => candidate.kind === "form").length,
        virtualForms: candidates.filter((candidate) => candidate.kind === "virtual").length,
      },
      // Keep an example shape close to the public API requested for module consumers.
      result: {
        loginDetected: authenticationDetected,
        authenticationDetected,
        type,
        passwordFields: counts.password,
        usernameFields: counts.username,
        emailFields: counts.email,
        submitButtons: submitButtonCount,
        confidence: `${confidenceScore}%`,
        reasons,
      },
    };
  }

  function detectFields(rootDocument) {
    return globalThis.LoginGuardDomUtils
      .getVisibleInputs(rootDocument)
      .map((input) => ({
        element: input,
        classification: classifyInput(input),
      }))
      .filter((field) => Boolean(field.classification));
  }

  function classifyInput(input) {
    const type = (input.getAttribute("type") || "text").trim().toLowerCase();
    const searchableText = globalThis.LoginGuardDomUtils.getSearchableFieldText(input);

    if (type === "password") {
      return FIELD_TYPES.PASSWORD;
    }

    if (type === "email" || /\be-?mail\b/i.test(searchableText)) {
      return FIELD_TYPES.EMAIL;
    }

    if (!["text", "search", "tel", "url", ""].includes(type)) {
      return null;
    }

    if (/\b(user(name)?|login|account|identifier|userid|user-id)\b/i.test(searchableText)) {
      return FIELD_TYPES.USERNAME;
    }

    return null;
  }

  function detectSubmitButtons(rootDocument) {
    return globalThis.LoginGuardDomUtils
      .getVisibleButtons(rootDocument)
      .filter(isSubmitControl)
      .map((element) => ({
        element,
        text: getControlText(element),
        type: (element.getAttribute("type") || element.tagName).toLowerCase(),
      }));
  }

  function isSubmitControl(element) {
    const tagName = element.tagName.toLowerCase();
    const type = (element.getAttribute("type") || "").toLowerCase();
    const text = getControlText(element);

    if (tagName === "input") {
      return type === "submit" || SUBMIT_TEXT_PATTERN.test(text);
    }

    if (tagName === "button") {
      return type === "" || type === "submit" || SUBMIT_TEXT_PATTERN.test(text);
    }

    return element.getAttribute("role") === "button" && SUBMIT_TEXT_PATTERN.test(text);
  }

  function detectNativeFormCandidates(rootDocument, fields, submitButtons) {
    return Array.from(rootDocument.querySelectorAll("form"))
      .map((form, index) => buildCandidate({
        element: form,
        fields: fields.filter((field) => form.contains(field.element)),
        submitButtons: submitButtons.filter((button) => form.contains(button.element)),
        index,
        kind: "form",
      }))
      .filter(isMeaningfulCandidate);
  }

  function detectVirtualFormCandidates(rootDocument, fields, submitButtons) {
    const unownedFields = fields.filter((field) => !field.element.closest("form"));
    const containers = new Set();
    const sharedContainer = getCommonAncestor(unownedFields.map((field) => field.element));

    for (const field of unownedFields) {
      const container = field.element.closest(VIRTUAL_CONTAINER_SELECTOR) || rootDocument.body;

      if (container) {
        containers.add(container);
      }
    }

    if (sharedContainer) {
      containers.add(sharedContainer);
    }

    return Array.from(containers)
      .map((container, index) => buildCandidate({
        element: container,
        fields: unownedFields.filter((field) => container.contains(field.element)),
        submitButtons: submitButtons.filter((button) => !button.element.closest("form") && container.contains(button.element)),
        index,
        kind: "virtual",
      }))
      .filter(isMeaningfulCandidate);
  }

  function getCommonAncestor(elements) {
    if (elements.length === 0) {
      return null;
    }

    const [firstElement, ...remainingElements] = elements;
    let candidate = firstElement.parentElement;

    while (candidate && remainingElements.some((element) => !candidate.contains(element))) {
      candidate = candidate.parentElement;
    }

    return candidate;
  }

  function buildCandidate({ element, fields, submitButtons, index, kind }) {
    const fieldCounts = countFieldTypes(fields);
    const candidateText = getCandidateText(element);
    const loginTextFound = LOGIN_TEXT_PATTERN.test(candidateText);
    const registrationTextFound = REGISTRATION_TEXT_PATTERN.test(candidateText);
    const score = calculateScore(fieldCounts, submitButtons.length, loginTextFound || registrationTextFound);

    return {
      kind,
      index,
      id: element.id || null,
      name: element.getAttribute("name") || null,
      action: kind === "form" ? element.getAttribute("action") || null : null,
      method: kind === "form" ? (element.getAttribute("method") || "get").toLowerCase() : null,
      loginDetected: score >= 3,
      confidence: scoreToConfidence(score),
      score,
      passwordFields: fieldCounts.password,
      usernameFields: fieldCounts.username,
      emailFields: fieldCounts.email,
      submitButtons: submitButtons.length,
      fieldCounts: {
        username: fieldCounts.username,
        email: fieldCounts.email,
        password: fieldCounts.password,
        total: fields.length,
      },
      hasLoginText: loginTextFound,
      hasRegistrationText: registrationTextFound,
      isLoginCandidate: score >= 3,
    };
  }

  function calculateScore(fieldCounts, submitButtonCount, loginTextFound) {
    let score = 0;

    if (fieldCounts.password > 0) {
      score += 4;
    }

    if (fieldCounts.username + fieldCounts.email > 0) {
      score += 2;
    }

    if (submitButtonCount > 0) {
      score += 1;
    }

    if (loginTextFound) {
      score += 1;
    }

    return score;
  }

  function scoreToConfidence(score) {
    if (score >= 7) {
      return CONFIDENCE.HIGH;
    }

    if (score >= 5) {
      return CONFIDENCE.MEDIUM;
    }

    if (score >= 3) {
      return CONFIDENCE.LOW;
    }

    return CONFIDENCE.NONE;
  }

  function scoreToConfidenceLabel(confidenceScore) {
    if (confidenceScore >= 85) {
      return CONFIDENCE.HIGH;
    }

    if (confidenceScore >= 65) {
      return CONFIDENCE.MEDIUM;
    }

    if (confidenceScore >= 50) {
      return CONFIDENCE.LOW;
    }

    return CONFIDENCE.NONE;
  }

  function isMeaningfulCandidate(candidate) {
    return candidate.fieldCounts.total > 0 || candidate.submitButtons > 0 || candidate.hasLoginText || candidate.hasRegistrationText;
  }

  function countFieldTypes(fields) {
    return fields.reduce((counts, field) => {
      counts[field.classification] += 1;
      return counts;
    }, {
      username: 0,
      email: 0,
      password: 0,
    });
  }

  function getBestCandidate(candidates) {
    return [...candidates].sort((left, right) => right.score - left.score)[0] || null;
  }

  function classifyAuthenticationType(rootDocument, bestCandidate) {
    const title = rootDocument.title || "";
    const candidateText = bestCandidate ? [
      bestCandidate.id,
      bestCandidate.name,
      bestCandidate.hasRegistrationText ? "register" : "",
      bestCandidate.hasLoginText ? "login" : "",
    ].join(" ") : "";
    const pageText = `${title} ${candidateText}`;

    if (REGISTRATION_TEXT_PATTERN.test(pageText)) {
      return "Registration";
    }

    if (LOGIN_TEXT_PATTERN.test(pageText)) {
      return "Login";
    }

    return "Unknown";
  }

  function buildReasons(rootDocument, fieldCounts, submitButtonCount, type) {
    const reasons = [];

    if (fieldCounts.password > 0) {
      reasons.push("Password field found");
    }

    if (fieldCounts.email > 0) {
      reasons.push("Email field found");
    }

    if (fieldCounts.username > 0) {
      reasons.push("Username field found");
    }

    if (submitButtonCount > 0) {
      reasons.push("Submit button");
    }

    const titleMatch = getAuthenticationTitleMatch(rootDocument.title || "", type);

    if (titleMatch) {
      reasons.push(`Page title contains "${titleMatch}"`);
    }

    return reasons;
  }

  function getAuthenticationTitleMatch(title, type) {
    if (type === "Registration") {
      return findFirstPatternMatch(title, [
        /create\s+account/i,
        /sign\s*up/i,
        /register/i,
        /registration/i,
      ]);
    }

    if (type === "Login") {
      return findFirstPatternMatch(title, [
        /log\s*in/i,
        /login/i,
        /sign\s*in/i,
      ]);
    }

    return null;
  }

  function findFirstPatternMatch(value, patterns) {
    for (const pattern of patterns) {
      const match = value.match(pattern);

      if (match) {
        return match[0];
      }
    }

    return null;
  }

  function calculateConfidenceScore(fieldCounts, submitButtonCount, reasons) {
    let confidenceScore = 0;

    if (fieldCounts.password > 0) {
      confidenceScore += 50;
    }

    if (fieldCounts.email > 0 || fieldCounts.username > 0) {
      confidenceScore += 20;
    }

    if (submitButtonCount > 0) {
      confidenceScore += 18;
    }

    if (reasons.some((reason) => reason.startsWith("Page title contains"))) {
      confidenceScore += 10;
    }

    return Math.min(confidenceScore, 98);
  }

  function toPublicFieldSummary({ element, classification }) {
    return {
      type: classification,
      inputType: (element.getAttribute("type") || "text").toLowerCase(),
      name: element.getAttribute("name") || null,
      id: element.id || null,
      autocomplete: element.getAttribute("autocomplete") || null,
      required: element.required,
    };
  }

  function getCandidateText(element) {
    return [
      element.id,
      element.getAttribute("class"),
      element.getAttribute("aria-label"),
      globalThis.LoginGuardDomUtils.getElementText(element),
    ]
      .filter(Boolean)
      .join(" ");
  }

  function getControlText(element) {
    return [
      element.getAttribute("value"),
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      globalThis.LoginGuardDomUtils.getElementText(element),
    ]
      .filter(Boolean)
      .join(" ");
  }

  globalThis.LoginGuardModules = globalThis.LoginGuardModules || {};
  globalThis.LoginGuardModules.login = {
    detect,
  };
})();
