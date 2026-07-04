// Lab Mode report builder for safe test plan previews. No tests are executed here.
(() => {
  const DEFAULT_SAFETY_NOTE = "Lab Mode report generated locally. No Lab Mode tests were executed, no forms were submitted, and no credentials were collected.";

  function buildLabJsonReport(labPlan, executionReadiness) {
    const plan = labPlan || {};
    const detectedForms = sanitizeDetectedForms(plan.detectedForms);
    const detectedInputs = sanitizeDetectedInputs(plan.detectedInputs);
    const plannedTestCategories = getPlannedTestCategories(plan.tests);
    const readiness = sanitizeExecutionReadiness(executionReadiness);
    const initialExecutionResults = buildInitialExecutionResults(readiness);
    const baselineObservationPlan = buildBaselineObservationPlan(plan, readiness);

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
      executionReadiness: readiness,
      initialExecutionResults,
      baselineObservationPlan,
      executedTests: [],
      safetyNote: String(plan.safetyNote || DEFAULT_SAFETY_NOTE),
    };
  }

  function buildLabMarkdownReport(labPlan, executionReadiness) {
    const report = buildLabJsonReport(labPlan, executionReadiness);
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

    lines.push("", "## Execution Readiness", "");
    lines.push(`Status: ${report.executionReadiness.allowed ? "Allowed" : "Refused"}`);
    lines.push(`Reason: ${toMarkdownText(report.executionReadiness.reason)}`);
    appendCategoryLines(lines, "Allowed categories", report.executionReadiness.allowedCategories);
    appendCategoryLines(lines, "Blocked categories", report.executionReadiness.blockedCategories);
    lines.push(`Safety note: ${toMarkdownText(report.executionReadiness.safetyNote)}`);

    lines.push("", "## Initial Execution Results", "");

    if (report.initialExecutionResults.length === 0) {
      lines.push("No initial execution result records were created because execution readiness was not available.");
    } else {
      report.initialExecutionResults.forEach((result) => {
        lines.push(
          `- ${toMarkdownText(result.category)}: status=${toMarkdownText(result.status)}, reason=${toMarkdownText(result.reason)}, safetyNote=${toMarkdownText(result.safetyNote)}`,
        );
      });
    }

    lines.push("", "## Baseline Observation Plan", "");
    lines.push(`Status: ${toMarkdownText(report.baselineObservationPlan.status)}`);
    lines.push(`Reason: ${toMarkdownText(report.baselineObservationPlan.reason)}`);

    if (report.baselineObservationPlan.targetForms.length === 0) {
      lines.push("Target forms: none.");
    } else {
      lines.push("Target forms:");
      report.baselineObservationPlan.targetForms.forEach((form) => {
        lines.push(
          `- Form ${form.index}: method=${toMarkdownText(form.method)}, actionPresent=${form.actionPresent}, inputs=${form.inputCount}, authLikeInputs=${form.authLikeInputCount}, hasPasswordField=${form.hasPasswordField}`,
        );
      });
    }

    appendCategoryLines(lines, "Observations planned", report.baselineObservationPlan.observationsPlanned);
    lines.push(`Safety note: ${toMarkdownText(report.baselineObservationPlan.safetyNote)}`);

    lines.push("", "## Executed Tests", "");
    lines.push("None. Lab Mode Preview does not execute tests yet.");
    lines.push("", "## Safety Note", "");
    lines.push(toMarkdownText(report.safetyNote), "");

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

  function sanitizeExecutionReadiness(readiness) {
    if (!readiness) {
      return {
        allowed: false,
        reason: "Execution readiness was not available when this report was generated.",
        allowedCategories: [],
        blockedCategories: [],
        safetyNote: "Execution readiness was not available. No tests were executed.",
      };
    }

    return {
      allowed: Boolean(readiness.allowed),
      reason: String(readiness.reason || "Execution readiness did not include a reason."),
      allowedCategories: sanitizeCategoryList(readiness.allowedCategories),
      blockedCategories: sanitizeCategoryList(readiness.blockedCategories),
      safetyNote: String(readiness.safetyNote || "Execution readiness is report-only. No tests were executed."),
    };
  }

  function buildInitialExecutionResults(readiness) {
    const resultBuilder = globalThis.LoginGuardLabExecutionResult;

    if (!resultBuilder?.buildInitialExecutionResults) {
      return [];
    }

    return resultBuilder.buildInitialExecutionResults(readiness).map(sanitizeExecutionResult);
  }

  function buildBaselineObservationPlan(labPlan, readiness) {
    const baselinePlanner = globalThis.LoginGuardLabBaselineObservation;

    if (!baselinePlanner?.buildBaselineObservationPlan) {
      return {
        category: "baseline-submit-observation",
        status: "skipped",
        reason: "Baseline observation planner was not available when this report was generated.",
        targetForms: [],
        observationsPlanned: [],
        safetyNote: "Baseline observation planning was not available. No tests were executed.",
      };
    }

    return sanitizeBaselineObservationPlan(
      baselinePlanner.buildBaselineObservationPlan(labPlan, readiness),
    );
  }

  function sanitizeBaselineObservationPlan(plan) {
    return {
      category: String(plan?.category || "baseline-submit-observation"),
      status: ["planned", "blocked", "skipped"].includes(plan?.status) ? plan.status : "skipped",
      reason: String(plan?.reason || ""),
      targetForms: sanitizeBaselineTargetForms(plan?.targetForms),
      observationsPlanned: sanitizeCategoryList(plan?.observationsPlanned),
      safetyNote: String(plan?.safetyNote || ""),
    };
  }

  function sanitizeBaselineTargetForms(forms) {
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

  function sanitizeExecutionResult(result) {
    return {
      id: String(result?.id || ""),
      category: String(result?.category || ""),
      status: String(result?.status || ""),
      startedAt: null,
      finishedAt: null,
      observations: [],
      reason: String(result?.reason || ""),
      safetyNote: String(result?.safetyNote || ""),
    };
  }

  function sanitizeCategoryList(categories) {
    if (!Array.isArray(categories)) {
      return [];
    }

    return categories
      .map((category) => String(category || ""))
      .filter(Boolean);
  }

  function appendCategoryLines(lines, label, categories) {
    lines.push(`${label}:`);

    if (categories.length === 0) {
      lines.push("- None.");
      return;
    }

    categories.forEach((category) => {
      lines.push(`- ${toMarkdownText(category)}`);
    });
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
