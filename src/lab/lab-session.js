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
  sessionStatus: document.querySelector("#session-status"),
  actionStatus: document.querySelector("#action-status"),
  plainLabSummary: document.querySelector("#plain-lab-summary"),
  labSummary: document.querySelector("#lab-summary"),
  readinessSummary: document.querySelector("#readiness-summary"),
  plannedCategories: document.querySelector("#planned-categories"),
  baselinePlan: document.querySelector("#baseline-plan"),
  baselineObservations: document.querySelector("#baseline-observations"),
  emptyFieldsPlan: document.querySelector("#empty-fields-plan"),
  emptyFieldsObservations: document.querySelector("#empty-fields-observations"),
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
let executionConfirmation = null;
let baselineExecutionResult = null;
let labReportLoadPromise = null;
let baselinePlannerLoadPromise = null;
let emptyFieldsPlannerLoadPromise = null;
let confirmationLoadPromise = null;

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
    const tab = await resolveTargetTab();

    if (!tab || typeof tab.id !== "number" || !isInspectableUrl(tab.url)) {
      renderNoSupportedTab();
      return;
    }

    targetTabId = tab.id;
    targetUrl = tab.url || "";
    elements.targetUrl.textContent = targetUrl;

    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      files: INJECTION_FILES,
    });

    const labModeResult = await sendLabPlanMessage(targetTabId, targetUrl);
    labPlan = labModeResult.labPlan;
    executionReadiness = labModeResult.executionReadiness;
    baselineObservationPlan = await buildBaselineObservationPlan(labPlan, executionReadiness);
    emptyFieldsObservationPlan = await buildEmptyFieldsObservationPlan(labPlan, executionReadiness);
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
  executionConfirmation = null;
  baselineExecutionResult = null;
  renderSession();
}

async function resolveTargetTab() {
  const params = new URLSearchParams(globalThis.location.search);
  const tabId = Number(params.get("tabId"));

  if (Number.isInteger(tabId) && tabId > 0) {
    try {
      return await chrome.tabs.get(tabId);
    } catch (_error) {
      return null;
    }
  }

  const currentSessionTab = await chrome.tabs.getCurrent();

  if (typeof currentSessionTab?.openerTabId === "number") {
    try {
      return await chrome.tabs.get(currentSessionTab.openerTabId);
    } catch (_error) {
      return null;
    }
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  return activeTab;
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

  renderList(elements.plannedCategories, getFriendlyLabCheckNames(getPlannedCategories(labPlan)), "No lab checks are available for this target.");

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
  const overviewPanel = elements.plainLabSummary.closest(".panel");
  const checksPanel = elements.plannedCategories.closest(".panel");
  const resultPanel = elements.executionResult.closest(".panel");
  const actionsPanel = elements.copyJsonButton.closest(".panel");
  const technicalPanels = [
    document.querySelector(".grid"),
    elements.baselinePlan.closest(".panel"),
    elements.emptyFieldsPlan.closest(".panel"),
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
  setPanelHeading(resultPanel, "Latest result");
  setPanelHeading(actionsPanel, "Reports");

  details.className = "panel technical-details";
  summary.textContent = "Technical details";
  content.className = "technical-details-content";
  details.append(summary, content);
  technicalPanels.forEach((panel) => content.append(panel));

  if (overviewPanel && checksPanel && resultPanel && actionsPanel) {
    overviewPanel.after(checksPanel);
    checksPanel.after(resultPanel);
    resultPanel.after(actionsPanel);
    actionsPanel.after(details);
  }
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

function sendLabPlanMessage(tabId, url) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, {
      type: LAB_PLAN_MESSAGE_TYPE,
      context: { url },
    }, (response) => {
      const lastError = chrome.runtime.lastError;

      if (lastError || !response?.ok) {
        const reason = response?.error || lastError?.message || "Lab Mode plan could not be created.";

        resolve({
          labPlan: {
            allowed: false,
            url: url || "",
            reason,
            tests: [],
            safetyNote: "Lab Mode preview is unavailable for this page.",
          },
          executionReadiness: createFallbackExecutionReadiness(reason),
        });
        return;
      }

      const safeLabPlan = response.labPlan || {};

      resolve({
        labPlan: {
          ...safeLabPlan,
          url: safeLabPlan.url || url || "",
        },
        executionReadiness: response.executionReadiness || createFallbackExecutionReadiness("Lab Mode execution readiness was not returned."),
      });
    });
  });
}

function sendBaselineObservationMessage(tabId, payload) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, {
      type: BASELINE_OBSERVATION_MESSAGE_TYPE,
      ...payload,
    }, (response) => {
      const lastError = chrome.runtime.lastError;

      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }

      if (!response || !response.ok) {
        reject(new Error(response?.error || "Baseline observation could not be run."));
        return;
      }

      resolve(response.result || response.executionResult);
    });
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
    baselinePlannerLoadPromise = import(chrome.runtime.getURL("src/lab/lab-baseline-observation.js"))
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
    emptyFieldsPlannerLoadPromise = import(chrome.runtime.getURL("src/lab/lab-empty-fields-observation.js"))
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

async function getExecutionConfirmationGate() {
  if (globalThis.LoginGuardLabExecutionConfirmation) {
    return globalThis.LoginGuardLabExecutionConfirmation;
  }

  if (!confirmationLoadPromise) {
    confirmationLoadPromise = import(chrome.runtime.getURL("src/lab/lab-execution-confirmation.js"))
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
    labReportLoadPromise = import(chrome.runtime.getURL("src/lab/lab-execution-result.js"))
      .then(() => import(chrome.runtime.getURL("src/lab/lab-baseline-observation.js")))
      .then(() => import(chrome.runtime.getURL("src/lab/lab-empty-fields-observation.js")))
      .then(() => import(chrome.runtime.getURL("src/lab/lab-report.js")))
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
