(() => {
  const FIELD_TYPES = Object.freeze({
    USERNAME: "username",
    EMAIL: "email",
    PASSWORD: "password",
  });

  const TEXT_FIELD_TYPES = new Set(["", "text", "search", "tel", "url"]);
  const USERNAME_HINTS = ["user", "username", "login", "account", "identifier"];
  const EMAIL_HINTS = ["email", "e-mail", "mail"];

  /**
   * Builds a small, serializable summary of login-related DOM signals.
   * The function reads element metadata only. It does not read field values,
   * submit forms, call page functions, or perform network activity.
   */
  function analyzeLoginSurface(rootDocument) {
    const fields = findCredentialFields(rootDocument);
    const forms = summarizeForms(rootDocument, fields);

    return {
      url: rootDocument.location.href,
      origin: rootDocument.location.origin,
      security: {
        usesHttps: rootDocument.location.protocol === "https:",
        protocol: rootDocument.location.protocol.replace(":", ""),
      },
      hasLoginForm: forms.some((form) => form.isLoginCandidate),
      fields: {
        counts: countFields(fields),
        items: fields.map(toPublicFieldSummary),
      },
      forms,
    };
  }

  function findCredentialFields(rootDocument) {
    const inputs = Array.from(rootDocument.querySelectorAll("input"));

    return inputs
      .filter(isVisibleInput)
      .map((input) => ({
        element: input,
        classification: classifyInput(input),
      }))
      .filter((field) => Boolean(field.classification));
  }

  function classifyInput(input) {
    const type = (input.getAttribute("type") || "").trim().toLowerCase();

    if (type === "password") {
      return FIELD_TYPES.PASSWORD;
    }

    if (type === "email") {
      return FIELD_TYPES.EMAIL;
    }

    if (!TEXT_FIELD_TYPES.has(type)) {
      return null;
    }

    const searchableText = getSearchableFieldText(input);

    if (containsAny(searchableText, EMAIL_HINTS)) {
      return FIELD_TYPES.EMAIL;
    }

    if (containsAny(searchableText, USERNAME_HINTS)) {
      return FIELD_TYPES.USERNAME;
    }

    return null;
  }

  function summarizeForms(rootDocument, fields) {
    const nativeForms = Array.from(rootDocument.querySelectorAll("form"));
    const formSummaries = nativeForms.map((form, index) => summarizeForm(form, fields, index));
    const unownedFields = fields.filter((field) => !field.element.closest("form"));

    if (unownedFields.length > 0) {
      formSummaries.push(summarizeVirtualForm(unownedFields, formSummaries.length));
    }

    return formSummaries.filter((summary) => summary.fieldCounts.total > 0 || summary.isLoginCandidate);
  }

  function summarizeForm(form, fields, index) {
    const containedFields = fields.filter((field) => form.contains(field.element));
    const fieldCounts = countFields(containedFields);
    const action = form.getAttribute("action") || "";
    const method = (form.getAttribute("method") || "get").toLowerCase();
    const autocomplete = form.getAttribute("autocomplete") || "";

    return {
      id: form.id || null,
      name: form.getAttribute("name") || null,
      index,
      action: action || null,
      method,
      autocomplete: autocomplete || null,
      fieldCounts,
      isLoginCandidate: isLoginCandidate(fieldCounts, form),
    };
  }

  function summarizeVirtualForm(fields, index) {
    const fieldCounts = countFields(fields);

    return {
      id: null,
      name: null,
      index,
      action: null,
      method: null,
      autocomplete: null,
      fieldCounts,
      isLoginCandidate: isLoginCandidate(fieldCounts),
    };
  }

  function isLoginCandidate(fieldCounts, form) {
    if (fieldCounts.password > 0) {
      return true;
    }

    if (fieldCounts.email > 0 || fieldCounts.username > 0) {
      const formText = form ? getElementText(form).toLowerCase() : "";
      return /sign\s*in|log\s*in|login|continue|account/.test(formText);
    }

    return false;
  }

  function countFields(fields) {
    const counts = {
      username: 0,
      email: 0,
      password: 0,
      total: fields.length,
    };

    for (const field of fields) {
      counts[field.classification] += 1;
    }

    return counts;
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

  function isVisibleInput(input) {
    if (input.disabled || input.type === "hidden") {
      return false;
    }

    const style = input.ownerDocument.defaultView.getComputedStyle(input);

    return style.visibility !== "hidden"
      && style.display !== "none"
      && input.getClientRects().length > 0;
  }

  function getSearchableFieldText(input) {
    return [
      input.getAttribute("type"),
      input.getAttribute("name"),
      input.id,
      input.getAttribute("autocomplete"),
      input.getAttribute("aria-label"),
      input.getAttribute("placeholder"),
      getLabelText(input),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function getLabelText(input) {
    const labels = Array.from(input.labels || []);
    const ariaLabelledBy = input.getAttribute("aria-labelledby");

    if (ariaLabelledBy) {
      const referencedLabels = ariaLabelledBy
        .split(/\s+/)
        .map((id) => input.ownerDocument.getElementById(id))
        .filter(Boolean);

      labels.push(...referencedLabels);
    }

    return labels.map(getElementText).join(" ");
  }

  function getElementText(element) {
    return (element.textContent || "").replace(/\s+/g, " ").trim();
  }

  function containsAny(value, hints) {
    return hints.some((hint) => value.includes(hint));
  }

  globalThis.LoginGuardDomUtils = {
    analyzeLoginSurface,
  };
})();
