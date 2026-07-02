// Lab Mode report builder for safe test plan previews. No tests are executed here.
(() => {
  const DEFAULT_SAFETY_NOTE = "Lab Mode report generated locally. No Lab Mode tests were executed, no forms were submitted, and no credentials were collected.";

  function buildLabJsonReport(labPlan) {
    const plan = labPlan || {};
    const detectedForms = sanitizeDetectedForms(plan.detectedForms);
    const detectedInputs = sanitizeDetectedInputs(plan.detectedInputs);
    const plannedTestCategories = getPlannedTestCategories(plan.tests);

    return {
      project: "LoginGuard",
      mode: "Lab Mode",
      generatedAt: new Date().toISOString(),
      allowed: Boolean(plan.allowed),
      url: String(plan.url || ""),
      reason: String(plan.reason || getDefaultReason(plan)),
      detectedForms,
      detectedFormCount: detectedForms.length,
      detectedInputs,
      detectedInputCount: detectedInputs.length,
      plannedTestCategories,
      executedTests: [],
      safetyNote: String(plan.safetyNote || DEFAULT_SAFETY_NOTE),
    };
  }

  function buildLabMarkdownReport(labPlan) {
    const report = buildLabJsonReport(labPlan);
    const lines = [
      "# LoginGuard Lab Mode Report",
      "",
      `Generated: ${toMarkdownText(report.generatedAt)}`,
      `Lab Mode status: ${report.allowed ? "Allowed" : "Refused"}`,
      `URL: ${toMarkdownText(report.url || "Unavailable")}`,
      `Reason: ${toMarkdownText(report.reason)}`,
      "",
      "## Detected Forms",
      "",
    ];

    if (report.detectedForms.length === 0) {
      lines.push("No forms were included in this Lab Mode plan.");
    } else {
      report.detectedForms.forEach((form) => {
        lines.push(
          `- Form ${form.index}: method=${toMarkdownText(form.method)}, actionPresent=${form.actionPresent}, inputs=${form.inputCount}, authLikeInputs=${form.authLikeInputCount}, hasPasswordField=${form.hasPasswordField}`,
        );
      });
    }

    lines.push("", "## Detected Inputs", "");

    if (report.detectedInputs.length === 0) {
      lines.push("No authentication-like inputs were included in this Lab Mode plan.");
    } else {
      report.detectedInputs.forEach((input) => {
        lines.push(
          `- Input ${input.index}: type=${toMarkdownText(input.type)}, name=${toMarkdownText(input.name || "none")}, id=${toMarkdownText(input.id || "none")}, autocomplete=${toMarkdownText(input.autocomplete || "none")}, placeholderPresent=${input.placeholderPresent}`,
        );
      });
    }

    lines.push("", "## Planned Test Categories", "");

    if (report.plannedTestCategories.length === 0) {
      lines.push("No planned test categories were included.");
    } else {
      report.plannedTestCategories.forEach((category) => {
        lines.push(`- ${toMarkdownText(category)}`);
      });
    }

    lines.push(
      "",
      "## Executed Tests",
      "",
      "None. Lab Mode Preview does not execute tests yet.",
      "",
      "## Safety Note",
      "",
      toMarkdownText(report.safetyNote),
      "",
    );

    return lines.join("\n");
  }

  function sanitizeDetectedForms(forms) {
    if (!Array.isArray(forms)) {
      return [];
    }

    return forms.map((form) => ({
      index: toFiniteNumber(form?.index),
      id: String(form?.id || ""),
      name: String(form?.name || ""),
      method: String(form?.method || ""),
      actionPresent: Boolean(form?.actionPresent),
      inputCount: toFiniteNumber(form?.inputCount),
      authLikeInputCount: toFiniteNumber(form?.authLikeInputCount),
      hasPasswordField: Boolean(form?.hasPasswordField),
    }));
  }

  function sanitizeDetectedInputs(inputs) {
    if (!Array.isArray(inputs)) {
      return [];
    }

    return inputs.map((input) => ({
      index: toFiniteNumber(input?.index),
      type: String(input?.type || ""),
      name: String(input?.name || ""),
      id: String(input?.id || ""),
      autocomplete: String(input?.autocomplete || ""),
      placeholderPresent: Boolean(input?.placeholderPresent),
    }));
  }

  function getPlannedTestCategories(tests) {
    if (!Array.isArray(tests)) {
      return [];
    }

    return tests
      .map((test) => String(test?.category || ""))
      .filter(Boolean);
  }

  function getDefaultReason(plan) {
    return plan.allowed
      ? "Lab Mode plan was created for an approved local lab context."
      : "Lab Mode was refused for this context.";
  }

  function toMarkdownText(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toFiniteNumber(value) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  globalThis.LoginGuardLabReport = {
    buildLabJsonReport,
    buildLabMarkdownReport,
  };
})();
