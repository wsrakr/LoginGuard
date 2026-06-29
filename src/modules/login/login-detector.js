// Login detector module finds login-form signals without reading field values.
(() => {
  const MODULE_ID = "login-detector";

  function detect(rootDocument) {
    const domUtils = globalThis.LoginGuardDomUtils;
    const fields = domUtils.findCredentialFields(rootDocument);
    const forms = summarizeForms(rootDocument, fields);

    return {
      id: MODULE_ID,
      hasLoginForm: forms.some((form) => form.isLoginCandidate),
      fields: {
        counts: domUtils.countFields(fields),
        items: fields.map(domUtils.toPublicFieldSummary),
      },
      forms,
    };
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
    const domUtils = globalThis.LoginGuardDomUtils;
    const containedFields = fields.filter((field) => form.contains(field.element));
    const fieldCounts = domUtils.countFields(containedFields);
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
    const fieldCounts = globalThis.LoginGuardDomUtils.countFields(fields);

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
      const formText = form ? globalThis.LoginGuardDomUtils.getElementText(form).toLowerCase() : "";
      return /sign\s*in|log\s*in|login|continue|account/.test(formText);
    }

    return false;
  }

  globalThis.LoginGuardModules = globalThis.LoginGuardModules || {};
  globalThis.LoginGuardModules.login = {
    detect,
  };
})();
