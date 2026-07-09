// Persistent Lab Mode page for safe local metadata observation and reports.
const LAB_PLAN_MESSAGE_TYPE = "LOGIN_GUARD_CREATE_LAB_PLAN";
const BASELINE_OBSERVATION_MESSAGE_TYPE = "LOGIN_GUARD_RUN_BASELINE_OBSERVATION";
const INJECTION_FILES = [
  "src/utils/dom-utils.js",
  "src/modules/https/https-checker.js",
  "src/modules/auth/auth-classifier.js",
  "src/modules/login/login-detector.js",
  "src/modules/headers/header-scanner.js",
  "src/core/normalizers.js",
  "src/core/risk-engine.js",
  "src/core/scanner.js",
  "src/lab/lab-context.js",
  "src/lab/lab-execution-guard.js",
  "src/lab/lab-execution-confirmation.js",
  "src/lab/lab-baseline-observation.js",
  "src/lab/lab-empty-fields-observation.js",
  "src/lab/lab-baseline-executor.js",
  "src/lab/lab-runner.js",
  "src/content/content.js",
];

const elements = {
  targetUrl: document.querySelector("#target-url"),
  topSummary: document.querySelector("#top-summary"),
  sessionStatus: document.querySelector("#session-status"),
  actionStatus: document.querySelector("#action-status"),
  plainLabSummary: document.querySelector("#plain-lab-summary"),
  labSummary: document.querySelector("#lab-summary"),
  readinessSummary: document.querySelector("#readiness-summary"),
  plannedCategories: document.querySelector("#planned-categories"),
  plannedCategoryDetails: document.querySelector("#planned-category-details"),
  initialExecutionResults: document.querySelector("#initial-execution-results"),
  safetyBoundaries: document.querySelector("#safety-boundaries"),
  baselinePlan: document.querySelector("#baseline-plan"),
  baselineObservations: document.querySelector("#baseline-observations"),
  emptyFieldsPlan: document.querySelector("#empty-fields-plan"),
  emptyFieldsObservations: document.querySelector("#empty-fields-observations"),
  responseMessagePlan: null,
  responseMessageObservations: null,
  confirmationSummary: document.querySelector("#confirmation-summary"),
  executionResult: document.querySelector("#execution-result"),
  executionObservations: document.querySelector("#execution-observations"),
  refreshButton: document.querySelector("#refresh-session"),
  runButton: document.querySelector("#run-baseline"),
  copyJsonButton: document.querySelector("#copy-json"),
  copyMarkdownButton: document.querySelector("#copy-markdown"),
};

let targetTabId = null;
let targetUrl = "";
let labPlan = null;
let executionReadiness = null;
let baselineObservationPlan = null;
let emptyFieldsObservationPlan = null;
let responseMessageComparisonPlan = null;
let executionConfirmation = null;
let baselineExecutionResult = null;
let labReportLoadPromise = null;
let baselinePlannerLoadPromise = null;
let emptyFieldsPlannerLoadPromise = null;
let responseMessagePlannerLoadPromise = null;
let confirmationLoadPromise = null;
let labCheckRegistryLoadPromise = null;
let executionResultHelperLoadPromise = null;
let browserApiLoadPromise = null;

document.addEventListener("DOMContentLoaded", () => {
  organizeLabSessionLayout();
  elements.refreshButton.addEventListener("click", refreshSession);
  elements.runButton.addEventListener("click", runBaselineObservation);
  elements.copyJsonButton.addEventListener("click", copyLabJsonReport);
  elements.copyMarkdownButton.addEventListener("click", copyLabMarkdownReport);

  refreshSession();
});

async function refreshSession() {
  setStatus(elements.sessionStatus, "Loading Lab Session target...", "");
  clearSessionState();

  try {
    const browserApi = await getBrowserApi();
    const tab = await resolveTargetTab();

    if (!tab || typeof tab.id !== "number" || !isInspectableUrl(tab.url)) {
      renderNoSupportedTab();
      return;
    }

    targetTabId = tab.id;
    targetUrl = tab.url || "";
    elements.targetUrl.textContent = targetUrl;

    await browserApi.executeScript({
      target: { tabId: targetTabId },
      files: INJECTION_FILES,
    });

    const labModeResult = await sendLabPlanMessage(targetTabId, targetUrl);
    await getLabCheckRegistry().catch(() => null);
    labPlan = labModeResult.labPlan;
    executionReadiness = labModeResult.executionReadiness;
    baselineObservationPlan = await buildBaselineObservationPlan(labPlan, executionReadiness);
    emptyFieldsObservationPlan = await buildEmptyFieldsObservationPlan(labPlan, executionReadiness);
    responseMessageComparisonPlan = await buildResponseMessageComparisonPlan(labPlan, executionReadiness);
    executionConfirmation = await buildExecutionConfirmation(labPlan, executionReadiness, baselineObservationPlan, false);

    renderSession();
    setStatus(elements.sessionStatus, "Lab Session is ready. This page can stay open while you copy reports.", "success");
  } catch (error) {
    renderNoSupportedTab(error.message);
  }
}

function clearSessionState() {
  labPlan = null;
  executionReadiness = null;
  baselineObservationPlan = null;
  emptyFieldsObservationPlan = null;
  responseMessageComparisonPlan = null;
  executionConfirmation = null;
  baselineExecutionResult = null;
  renderSession();
}

async function resolveTargetTab() {
  const browserApi = await getBrowserApi();
  const params = new URLSearchParams(globalThis.location.search);
  const tabId = Number(params.get("tabId"));

  if (Number.isInteger(tabId) && tabId > 0) {
    try {
      return await browserApi.getTab(tabId);
    } catch (_error) {
      return null;
    }
  }

  const currentSessionTab = await browserApi.getCurrentTab();

  if (typeof currentSessionTab?.openerTabId === "number") {
    try {
      return await browserApi.getTab(currentSessionTab.openerTabId);
    } catch (_error) {
      return null;
    }
  }

  return browserApi.getActiveTab();
}

function renderNoSupportedTab(reason = "") {
  targetTabId = null;
  targetUrl = "";
  elements.targetUrl.textContent = "No supported lab target selected.";
  setStatus(
    elements.sessionStatus,
    reason || "Open a local lab fixture tab first, then return to this Lab Session page.",
    "error",
  );
  renderSession();
}

function renderSession() {
  const plainSummary = buildPlainLabSessionSummary();
  const generatedAt = labPlan?.generatedAt || "Not generated yet";
  const boundarySummary = "No form submission, input value reading, credential collection, payload execution, navigation, or response body collection.";

  renderDetails(elements.topSummary, [
    ["Target URL", targetUrl || "No supported target selected."],
    ["Lab Mode status", labPlan?.allowed ? "Allowed local lab context" : "Not available for this target"],
    ["Last generated", generatedAt],
    ["Safety boundary", boundarySummary],
  ]);

  renderDetails(elements.plainLabSummary, [
    ["What happened?", plainSummary.whatHappened],
    ["Check completed", plainSummary.checkCompleted],
    ["What should I look at?", plainSummary.whatToLookAt],
  ]);

  renderDetails(elements.labSummary, [
    ["Lab Mode status", labPlan?.allowed ? "Allowed" : "Refused"],
    ["Reason", labPlan?.reason || (labPlan?.allowed ? "Approved local lab context." : "No Lab Mode plan available.")],
    ["Detected forms", String(Array.isArray(labPlan?.detectedForms) ? labPlan.detectedForms.length : 0)],
    ["Detected inputs", String(Array.isArray(labPlan?.detectedInputs) ? labPlan.detectedInputs.length : 0)],
  ]);

  renderDetails(elements.readinessSummary, [
    ["Status", executionReadiness?.allowed ? "Allowed" : "Refused"],
    ["Reason", executionReadiness?.reason || "Execution readiness is unavailable."],
    ["Allowed categories", joinList(executionReadiness?.allowedCategories)],
    ["Blocked categories", joinList(executionReadiness?.blockedCategories)],
  ]);

  renderLabChecks(elements.plannedCategories, getLabCheckDefinitions(getKnownLabCheckCategories()), "Lab check definitions are not available yet.");
  renderList(
    elements.plannedCategoryDetails,
    getPlannedCategories(labPlan),
    "No planned technical categories are available for this target.",
  );
  renderInitialExecutionResults(elements.initialExecutionResults);
  renderList(elements.safetyBoundaries, [
    "Submit forms.",
    "Read passwords or input values.",
    "Modify input values.",
    "Collect credentials.",
    "Run payloads.",
    "Navigate the page.",
    "Collect response bodies.",
  ], "Safety boundary details are unavailable.");

  renderDetails(elements.baselinePlan, [
    ["Status", baselineObservationPlan?.status || "skipped"],
    ["Reason", baselineObservationPlan?.reason || "Baseline observation plan is unavailable."],
    ["Target forms", String(Array.isArray(baselineObservationPlan?.targetForms) ? baselineObservationPlan.targetForms.length : 0)],
  ]);
  renderList(elements.baselineObservations, baselineObservationPlan?.observationsPlanned || [], "No observations are currently planned.");

  renderDetails(elements.emptyFieldsPlan, [
    ["Status", emptyFieldsObservationPlan?.status || "blocked"],
    ["Reason", emptyFieldsObservationPlan?.reason || "Empty Fields Observation Planner is not available."],
    ["Target forms", String(Array.isArray(emptyFieldsObservationPlan?.targetForms) ? emptyFieldsObservationPlan.targetForms.length : 0)],
  ]);
  renderList(elements.emptyFieldsObservations, emptyFieldsObservationPlan?.observationsPlanned || [], "No observations are currently planned.");

  renderDetails(elements.responseMessagePlan, [
    ["Status", responseMessageComparisonPlan?.status || "blocked"],
    ["Reason", responseMessageComparisonPlan?.reason || "Response Message Comparison Planner is not available."],
    ["Target forms", String(Array.isArray(responseMessageComparisonPlan?.targetForms) ? responseMessageComparisonPlan.targetForms.length : 0)],
    ["Safety note", responseMessageComparisonPlan?.safetyNote || "Response Message Comparison Planner is not available."],
  ]);
  renderList(elements.responseMessageObservations, responseMessageComparisonPlan?.observationsPlanned || [], "No observations are currently planned.");

  renderDetails(elements.confirmationSummary, [
    ["Confirmed", executionConfirmation?.confirmed ? "Yes" : "No"],
    ["Allowed", executionConfirmation?.allowed ? "Yes" : "No"],
    ["Reason", executionConfirmation?.reason || "Execution confirmation is unavailable."],
    ["Category", executionConfirmation?.category || "baseline-submit-observation"],
  ]);

  renderDetails(elements.executionResult, [
    ["Status", baselineExecutionResult?.status || "Not run"],
    ["Reason", baselineExecutionResult?.reason || "No baseline observation has been run yet."],
    ["Observations", String(Array.isArray(baselineExecutionResult?.observations) ? baselineExecutionResult.observations.length : 0)],
  ]);
  renderList(
    elements.executionObservations,
    Array.isArray(baselineExecutionResult?.observations)
      ? baselineExecutionResult.observations.map((observation) => observation?.name).filter(Boolean)
      : [],
    "No observation result names recorded.",
  );

  updateRunButton();
}

function buildPlainLabSessionSummary() {
  const formCount = Array.isArray(labPlan?.detectedForms) ? labPlan.detectedForms.length : 0;
  const inputCount = Array.isArray(labPlan?.detectedInputs) ? labPlan.detectedInputs.length : 0;
  const baselineWasRun = baselineExecutionResult?.status === "executed";
  const allowedText = labPlan?.allowed
    ? "Lab Mode is available for this approved local lab page."
    : "Lab Mode is refused or no supported local lab page is selected.";
  const readinessText = executionReadiness?.allowed
    ? "Approved lab checks are available."
    : "Lab checks are currently refused or unavailable.";
  const observationText = baselineWasRun
    ? "A baseline observation has been completed."
    : "No baseline observation has been run yet.";

  return {
    whatHappened: `${allowedText} ${readinessText} ${observationText}`,
    checkCompleted: "LoginGuard did not submit forms, trigger clicks, read input values, change values, collect credentials, run payloads, or navigate the page.",
    whatToLookAt: `Review the ${formCount} detected form(s), ${inputCount} detected input metadata item(s), available checks, and any baseline observation result before copying a report.`,
  };
}

function organizeLabSessionLayout() {
  const subtitle = document.querySelector(".subtitle");
  const targetPanel = elements.targetUrl.closest(".panel");
  const overviewPanel = elements.plainLabSummary.closest(".panel");
  const checksPanel = elements.plannedCategories.closest(".panel");
  const safetyPanel = elements.safetyBoundaries.closest(".panel");
  const rawCategoriesPanel = elements.plannedCategoryDetails.closest(".panel");
  const initialExecutionResultsPanel = elements.initialExecutionResults.closest(".panel");
  const resultPanel = elements.executionResult.closest(".panel");
  const actionsPanel = elements.copyJsonButton.closest(".panel");
  const responseMessagePanel = createResponseMessageComparisonPanel();
  const technicalPanels = [
    document.querySelector(".grid"),
    rawCategoriesPanel,
    initialExecutionResultsPanel,
    elements.baselinePlan.closest(".panel"),
    elements.emptyFieldsPlan.closest(".panel"),
    responseMessagePanel,
    elements.confirmationSummary.closest(".panel"),
  ].filter(Boolean);
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const content = document.createElement("div");

  if (subtitle) {
    subtitle.textContent = "Persistent workspace for authorized lab checks";
  }

  setPanelHeading(overviewPanel, "Lab overview");
  setPanelHeading(checksPanel, "Available lab checks");
  setPanelHeading(safetyPanel, "Safety Boundaries");
  setPanelHeading(resultPanel, "Latest result");
  setPanelHeading(actionsPanel, "Reports");
  setPanelHeading(targetPanel, "Session summary");

  details.className = "panel technical-details";
  summary.textContent = "Technical details";
  content.className = "technical-details-content";
  details.append(summary, content);
  technicalPanels.forEach((panel) => content.append(panel));

  if (overviewPanel && checksPanel && safetyPanel && resultPanel && actionsPanel) {
    overviewPanel.after(checksPanel);
    checksPanel.after(safetyPanel);
    safetyPanel.after(resultPanel);
    resultPanel.after(actionsPanel);
    actionsPanel.after(details);
  }
}

function createResponseMessageComparisonPanel() {
  const panel = document.createElement("section");
  const heading = document.createElement("h2");
  const details = document.createElement("dl");
  const observations = document.createElement("ul");

  panel.className = "panel";
  heading.textContent = "Response Message Comparison Plan";
  details.className = "detail-list";
  observations.className = "item-list";
  panel.append(heading, details, observations);
  elements.responseMessagePlan = details;
  elements.responseMessageObservations = observations;

  return panel;
}

function setPanelHeading(panel, text) {
  const heading = panel?.querySelector("h2");

  if (heading) {
    heading.textContent = text;
  }
}

function renderDetails(container, rows) {
  container.replaceChildren(
    ...rows.map(([label, value]) => {
      const wrapper = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");

      wrapper.className = "detail-row";
      term.textContent = label;
      description.textContent = value;
      wrapper.append(term, description);

      return wrapper;
    }),
  );
}

function renderList(container, items, emptyText) {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : [emptyText];

  container.replaceChildren(
    ...safeItems.map((item) => {
      const listItem = document.createElement("li");

      listItem.textContent = String(item);

      return listItem;
    }),
  );
}

function renderLabChecks(container, checks, emptyText) {
  const checkItems = Array.isArray(checks) && checks.length > 0 ? checks : [];

  if (checkItems.length === 0) {
    renderList(container, [], emptyText);
    return;
  }

  container.replaceChildren(
    ...checkItems.map((check) => {
      const listItem = document.createElement("li");
      const header = document.createElement("div");
      const title = document.createElement("strong");
      const description = document.createElement("span");
      const purpose = document.createElement("span");
      const safetyLevel = document.createElement("span");
      const badge = document.createElement("span");

      listItem.className = "check-card";
      header.className = "check-card-header";
      title.className = "check-title";
      title.textContent = check.label || check.category || "Unknown Lab Check";
      badge.className = `check-badge ${getCheckBadgeClass(check)}`;
      badge.textContent = check.defaultStatusLabel || check.availability || "Unknown";
      description.textContent = check.shortDescription || "No description available.";
      purpose.className = "check-purpose";
      purpose.textContent = check.userPurpose || "Review this lab check manually.";
      safetyLevel.className = "check-safety";
      safetyLevel.textContent = `Safety level: ${formatSafetyLevel(check.safetyLevel)}`;
      header.append(title, badge);
      listItem.append(header, description, purpose, safetyLevel);

      return listItem;
    }),
  );
}

async function renderInitialExecutionResults(container) {
  try {
    const helper = await getExecutionResultHelper();
    const initialResults = helper.buildInitialExecutionResults(executionReadiness);
    const labels = initialResults.map((result) => {
      const definition = getLabCheckDefinitions([result.category])[0];
      const label = definition?.label || result.category;

      return `${label}: ${result.status} - ${result.reason}`;
    });

    renderList(container, labels, "No initial execution results are available.");
  } catch {
    renderList(container, [], "Initial execution result helper is not available.");
  }
}

function getCheckBadgeClass(definition) {
  const availability = String(definition?.availability || "").toLowerCase();
  const statusLabel = String(definition?.defaultStatusLabel || "").toLowerCase();

  if (availability === "available" || statusLabel === "available") {
    return "available";
  }

  if (availability === "planned" || statusLabel === "planned") {
    return "planned";
  }

  if (availability === "blocked" || statusLabel.includes("blocked")) {
    return "blocked";
  }

  return "unknown";
}

function updateRunButton() {
  const canRun = labPlan?.allowed === true
    && executionReadiness?.allowed === true
    && baselineObservationPlan?.status === "planned"
    && typeof targetTabId === "number";

  elements.runButton.classList.toggle("is-hidden", !canRun);
  elements.runButton.disabled = !canRun;
}

async function runBaselineObservation() {
  if (!targetTabId || !labPlan || !executionReadiness || !baselineObservationPlan) {
    setStatus(elements.actionStatus, "Baseline observation is not ready.", "error");
    return;
  }

  try {
    const result = await sendBaselineObservationMessage(targetTabId, {
      labPlan,
      readiness: executionReadiness,
      baselineObservationPlan,
      userConfirmed: true,
    });

    baselineExecutionResult = result;
    executionConfirmation = await buildExecutionConfirmation(labPlan, executionReadiness, baselineObservationPlan, true);
    renderSession();
    setStatus(elements.actionStatus, "Baseline observation completed with approved metadata only.", "success");
  } catch (error) {
    setStatus(elements.actionStatus, `Could not run baseline observation: ${error.message}`, "error");
  }
}

async function copyLabJsonReport() {
  try {
    const labReport = await getLabReportBuilder();
    const reportJson = JSON.stringify(labReport.buildLabJsonReport(
      labPlan,
      executionReadiness,
      getExecutedLabResults(),
    ), null, 2);

    JSON.parse(reportJson);
    await navigator.clipboard.writeText(reportJson);
    setStatus(elements.actionStatus, "Lab JSON report copied locally.", "success");
  } catch (error) {
    setStatus(elements.actionStatus, `Could not copy Lab JSON report: ${error.message}`, "error");
  }
}

async function copyLabMarkdownReport() {
  try {
    const labReport = await getLabReportBuilder();

    await navigator.clipboard.writeText(labReport.buildLabMarkdownReport(
      labPlan,
      executionReadiness,
      getExecutedLabResults(),
    ));
    setStatus(elements.actionStatus, "Lab Markdown report copied locally.", "success");
  } catch (error) {
    setStatus(elements.actionStatus, `Could not copy Lab Markdown report: ${error.message}`, "error");
  }
}

async function sendLabPlanMessage(tabId, url) {
  try {
    const browserApi = await getBrowserApi();
    const response = await browserApi.sendTabMessage(tabId, {
      type: LAB_PLAN_MESSAGE_TYPE,
      context: { url },
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Lab Mode plan could not be created.");
    }

    const safeLabPlan = response.labPlan || {};
    return {
      labPlan: {
        ...safeLabPlan,
        url: safeLabPlan.url || url || "",
      },
      executionReadiness: response.executionReadiness || createFallbackExecutionReadiness("Lab Mode execution readiness was not returned."),
    };
  } catch (error) {
    const reason = error.message || "Lab Mode plan could not be created.";
    return {
      labPlan: {
        allowed: false,
        url: url || "",
        reason,
        tests: [],
        safetyNote: "Lab Mode preview is unavailable for this page.",
      },
      executionReadiness: createFallbackExecutionReadiness(reason),
    };
  }
}

function sendBaselineObservationMessage(tabId, payload) {
  return getBrowserApi()
    .then((browserApi) => browserApi.sendTabMessage(tabId, {
      type: BASELINE_OBSERVATION_MESSAGE_TYPE,
      ...payload,
    }))
    .then((response) => {
      if (!response || !response.ok) {
        throw new Error(response?.error || "Baseline observation could not be run.");
      }

      return response.result || response.executionResult;
    });
}

async function buildBaselineObservationPlan(currentLabPlan, currentReadiness) {
  const planner = await getBaselinePlanner();

  return planner.buildBaselineObservationPlan(currentLabPlan, currentReadiness);
}

async function buildEmptyFieldsObservationPlan(currentLabPlan, currentReadiness) {
  const planner = await getEmptyFieldsPlanner();

  return planner.buildEmptyFieldsObservationPlan(currentLabPlan, currentReadiness);
}

async function buildResponseMessageComparisonPlan(currentLabPlan, currentReadiness) {
  try {
    const planner = await getResponseMessagePlanner();

    return planner.buildResponseMessageComparisonPlan(currentLabPlan, currentReadiness);
  } catch {
    return {
      category: "response-message-comparison",
      status: "blocked",
      reason: "Response Message Comparison Planner is not available.",
      targetForms: [],
      observationsPlanned: [],
      safetyNote: "Response Message Comparison Planner is not available.",
    };
  }
}

async function buildExecutionConfirmation(currentLabPlan, currentReadiness, currentBaselinePlan, userConfirmed) {
  const confirmationGate = await getExecutionConfirmationGate();

  return confirmationGate.evaluateExecutionConfirmation({
    labPlan: currentLabPlan,
    readiness: currentReadiness,
    baselineObservationPlan: currentBaselinePlan,
    userConfirmed,
  });
}

async function getBaselinePlanner() {
  if (globalThis.LoginGuardLabBaselineObservation) {
    return globalThis.LoginGuardLabBaselineObservation;
  }

  if (!baselinePlannerLoadPromise) {
    baselinePlannerLoadPromise = import(getExtensionUrl("src/lab/lab-baseline-observation.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabBaselineObservation) {
          throw new Error("LoginGuard Lab baseline observation planner was not loaded.");
        }

        return globalThis.LoginGuardLabBaselineObservation;
      })
      .catch((error) => {
        baselinePlannerLoadPromise = null;
        throw error;
      });
  }

  return baselinePlannerLoadPromise;
}

async function getEmptyFieldsPlanner() {
  if (globalThis.LoginGuardLabEmptyFieldsObservation) {
    return globalThis.LoginGuardLabEmptyFieldsObservation;
  }

  if (!emptyFieldsPlannerLoadPromise) {
    emptyFieldsPlannerLoadPromise = import(getExtensionUrl("src/lab/lab-empty-fields-observation.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabEmptyFieldsObservation) {
          throw new Error("LoginGuard Lab empty fields observation planner was not loaded.");
        }

        return globalThis.LoginGuardLabEmptyFieldsObservation;
      })
      .catch((error) => {
        emptyFieldsPlannerLoadPromise = null;
        throw error;
      });
  }

  return emptyFieldsPlannerLoadPromise;
}

async function getResponseMessagePlanner() {
  if (globalThis.LoginGuardLabResponseMessageComparison) {
    return globalThis.LoginGuardLabResponseMessageComparison;
  }

  if (!responseMessagePlannerLoadPromise) {
    responseMessagePlannerLoadPromise = import(getExtensionUrl("src/lab/lab-response-message-comparison.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabResponseMessageComparison) {
          throw new Error("LoginGuard Lab response message comparison planner was not loaded.");
        }

        return globalThis.LoginGuardLabResponseMessageComparison;
      })
      .catch((error) => {
        responseMessagePlannerLoadPromise = null;
        throw error;
      });
  }

  return responseMessagePlannerLoadPromise;
}

async function getExecutionConfirmationGate() {
  if (globalThis.LoginGuardLabExecutionConfirmation) {
    return globalThis.LoginGuardLabExecutionConfirmation;
  }

  if (!confirmationLoadPromise) {
    confirmationLoadPromise = import(getExtensionUrl("src/lab/lab-execution-confirmation.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabExecutionConfirmation) {
          throw new Error("LoginGuard Lab execution confirmation gate was not loaded.");
        }

        return globalThis.LoginGuardLabExecutionConfirmation;
      })
      .catch((error) => {
        confirmationLoadPromise = null;
        throw error;
      });
  }

  return confirmationLoadPromise;
}

async function getLabReportBuilder() {
  if (globalThis.LoginGuardLabReport) {
    return globalThis.LoginGuardLabReport;
  }

  if (!labReportLoadPromise) {
    labReportLoadPromise = import(getExtensionUrl("src/lab/lab-execution-result.js"))
      .then(() => import(getExtensionUrl("src/lab/lab-baseline-observation.js")))
      .then(() => import(getExtensionUrl("src/lab/lab-empty-fields-observation.js")))
      .then(() => import(getExtensionUrl("src/lab/lab-response-message-comparison.js")))
      .then(() => import(getExtensionUrl("src/lab/lab-check-registry.js")))
      .then(() => import(getExtensionUrl("src/lab/lab-report.js")))
      .then(() => {
        if (!globalThis.LoginGuardLabReport) {
          throw new Error("LoginGuard Lab report builder was not loaded.");
        }

        return globalThis.LoginGuardLabReport;
      })
      .catch((error) => {
        labReportLoadPromise = null;
        throw error;
      });
  }

  return labReportLoadPromise;
}

async function getLabCheckRegistry() {
  if (globalThis.LoginGuardLabCheckRegistry) {
    return globalThis.LoginGuardLabCheckRegistry;
  }

  if (!labCheckRegistryLoadPromise) {
    labCheckRegistryLoadPromise = import(getExtensionUrl("src/lab/lab-check-registry.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabCheckRegistry) {
          throw new Error("LoginGuard Lab check registry was not loaded.");
        }

        return globalThis.LoginGuardLabCheckRegistry;
      })
      .catch((error) => {
        labCheckRegistryLoadPromise = null;
        throw error;
      });
  }

  return labCheckRegistryLoadPromise;
}

async function getExecutionResultHelper() {
  if (globalThis.LoginGuardLabExecutionResult) {
    return globalThis.LoginGuardLabExecutionResult;
  }

  if (!executionResultHelperLoadPromise) {
    executionResultHelperLoadPromise = import(getExtensionUrl("src/lab/lab-execution-result.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabExecutionResult) {
          throw new Error("LoginGuard Lab execution result helper was not loaded.");
        }

        return globalThis.LoginGuardLabExecutionResult;
      })
      .catch((error) => {
        executionResultHelperLoadPromise = null;
        throw error;
      });
  }

  return executionResultHelperLoadPromise;
}

async function getBrowserApi() {
  if (globalThis.LoginGuardBrowserApi) {
    return globalThis.LoginGuardBrowserApi;
  }

  if (!browserApiLoadPromise) {
    const adapterUrl = new URL("../platform/browser-api.js", globalThis.location.href).href;

    browserApiLoadPromise = import(adapterUrl)
      .then(() => {
        if (!globalThis.LoginGuardBrowserApi) {
          throw new Error("LoginGuard browser API adapter was not loaded.");
        }

        return globalThis.LoginGuardBrowserApi;
      })
      .catch((error) => {
        browserApiLoadPromise = null;
        throw error;
      });
  }

  return browserApiLoadPromise;
}

function getExtensionUrl(path) {
  const url = globalThis.LoginGuardBrowserApi?.getRuntimeUrl(path);

  if (!url) {
    throw new Error("Extension URL generation is not available.");
  }

  return url;
}

function setStatus(element, message, state) {
  element.textContent = message;

  if (state) {
    element.dataset.state = state;
    return;
  }

  delete element.dataset.state;
}

function getPlannedCategories(currentLabPlan) {
  if (!Array.isArray(currentLabPlan?.tests)) {
    return [];
  }

  return currentLabPlan.tests
    .map((test) => test?.category)
    .filter(Boolean);
}

function getFriendlyLabCheckNames(categories) {
  const labels = {
    "baseline-submit-observation": "Baseline observation",
    "empty-fields-observation": "Empty fields observation",
    "response-message-comparison": "Response message comparison",
    "invalid-synthetic-credentials-observation": "Synthetic credential observation",
  };

  return categories.map((category) => labels[category] || category);
}

function getKnownLabCheckCategories() {
  const categories = [
    "baseline-submit-observation",
    "empty-fields-observation",
    "invalid-synthetic-credentials-observation",
    "response-message-comparison",
  ];

  return categories;
}

function getLabCheckDefinitions(categories) {
  const registry = globalThis.LoginGuardLabCheckRegistry;

  if (registry?.listCheckDefinitions) {
    return registry.listCheckDefinitions(categories);
  }

  return categories.map((category) => ({
    category,
    label: getFriendlyLabCheckNames([category])[0],
    shortDescription: "No description available.",
    userPurpose: "Review this lab check manually.",
    availability: "unknown",
    safetyLevel: "unknown",
    defaultStatusLabel: "Unknown",
  }));
}

function formatSafetyLevel(safetyLevel) {
  return String(safetyLevel || "unknown")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Unknown";
}

function joinList(items) {
  return Array.isArray(items) && items.length > 0 ? items.join(", ") : "None";
}

function getExecutedLabResults() {
  return baselineExecutionResult ? [baselineExecutionResult] : [];
}

function createFallbackExecutionReadiness(reason) {
  return {
    allowed: false,
    reason,
    allowedCategories: [],
    blockedCategories: [],
    safetyNote: "Lab Mode execution readiness could not be evaluated. No tests were executed.",
  };
}

function isInspectableUrl(url) {
  return /^https?:\/\//i.test(url || "");
}
