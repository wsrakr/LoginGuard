// Shared DOM helpers for read-only LoginGuard modules.
(() => {
  const FIELD_TYPES = Object.freeze({
    USERNAME: "username",
    EMAIL: "email",
    PASSWORD: "password",
  });

  const TEXT_FIELD_TYPES = new Set(["", "text", "search", "tel", "url"]);
  const USERNAME_HINTS = ["user", "username", "login", "account", "identifier"];
  const EMAIL_HINTS = ["email", "e-mail", "mail"];

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

  function getVisibleInputs(rootDocument) {
    return Array.from(rootDocument.querySelectorAll("input")).filter(isVisibleElement);
  }

  function getVisibleButtons(rootDocument) {
    return Array.from(rootDocument.querySelectorAll("button, input[type='button'], input[type='submit'], [role='button']"))
      .filter(isVisibleElement);
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

    return isVisibleElement(input);
  }

  function isVisibleElement(element) {
    if (element.disabled || element.getAttribute("aria-hidden") === "true") {
      return false;
    }

    const style = element.ownerDocument.defaultView.getComputedStyle(element);

    return style.visibility !== "hidden"
      && style.display !== "none"
      && element.getClientRects().length > 0;
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
    countFields,
    findCredentialFields,
    getSearchableFieldText,
    getElementText,
    getVisibleButtons,
    getVisibleInputs,
    isVisibleElement,
    toPublicFieldSummary,
  };
})();
