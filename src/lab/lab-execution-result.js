// Lab Mode execution result helpers for future local-only execution reporting.
(() => {
  const SAFETY_NOTE = "Lab Mode execution result helpers only create report records. They do not execute tests, submit forms, or read input values.";
  const RESULT_STATUSES = new Set(["planned", "blocked", "skipped", "error"]);

  function createPlannedResult(category, reason) {
    return createResult("planned", category, reason || "This category is planned for future local Lab Mode execution.");
  }

  function createBlockedResult(category, reason) {
    return createResult("blocked", category, reason || "This category is blocked by the Lab Mode execution guard.");
  }

  function createSkippedResult(category, reason) {
    return createResult("skipped", category, reason || "This category was skipped. No test was executed.");
  }

  function createErrorResult(category, reason) {
    return createResult("error", category, reason || "This category could not be prepared for reporting. No test was executed.");
  }

  function buildInitialExecutionResults(readiness) {
    const allowedCategories = Array.isArray(readiness?.allowedCategories)
      ? readiness.allowedCategories
      : [];
    const blockedCategories = Array.isArray(readiness?.blockedCategories)
      ? readiness.blockedCategories
      : [];

    return [
      ...allowedCategories.map((category) => createPlannedResult(
        category,
        "This category passed execution readiness and is recorded as planned only.",
      )),
      ...blockedCategories.map((category) => createBlockedResult(
        category,
        "This category did not pass execution readiness and remains blocked.",
      )),
    ];
  }

  function createResult(status, category, reason) {
    const safeStatus = RESULT_STATUSES.has(status) ? status : "error";
    const safeCategory = String(category || "unknown-category");

    return {
      id: `${safeStatus}:${safeCategory}`,
      category: safeCategory,
      status: safeStatus,
      startedAt: null,
      finishedAt: null,
      observations: [],
      reason: String(reason || "No reason was provided."),
      safetyNote: SAFETY_NOTE,
    };
  }

  globalThis.LoginGuardLabExecutionResult = {
    createPlannedResult,
    createBlockedResult,
    createSkippedResult,
    createErrorResult,
    buildInitialExecutionResults,
  };
})();
