// Popup controller that requests active-tab analysis and renders the result.
const MESSAGE_TYPE = "LOGIN_GUARD_ANALYZE";
const LAB_PLAN_MESSAGE_TYPE = "LOGIN_GUARD_CREATE_LAB_PLAN";
const BASELINE_OBSERVATION_MESSAGE_TYPE = "LOGIN_GUARD_RUN_BASELINE_OBSERVATION";
const GET_SECURITY_HEADERS_MESSAGE = "LOGIN_GUARD_GET_SECURITY_HEADERS";
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
  currentUrl: document.querySelector("#current-url"),
  httpsStatus: document.querySelector("#https-status"),
  loginStatus: document.querySelector("#login-status"),
  authTypeStatus: document.querySelector("#auth-type-status"),
  confidenceStatus: document.querySelector("#confidence-status"),
  fieldStatus: document.querySelector("#field-status"),
  summaryList: document.querySelector("#security-summary"),
  headersList: document.querySelector("#security-headers"),
};

const cards = {
  https: elements.httpsStatus.closest(".status-card"),
  login: elements.loginStatus.closest(".status-card"),
  authType: elements.authTypeStatus.closest(".status-card"),
  confidence: elements.confidenceStatus.closest(".status-card"),
  fields: elements.fieldStatus.closest(".status-card"),
};

let findingsSection = null;
let findingsList = null;
let humanSummarySection = null;
let humanSummaryDetails = null;
let websiteTechnicalDetails = null;
let websiteTechnicalContent = null;
let reportSection = null;
let reportStatus = null;
let labSection = null;
let labDetails = null;
let labTechnicalDetails = null;
let labReportStatus = null;
let labRunButton = null;
let labExecutionResultBlock = null;
let currentAnalysis = null;
let currentLabPlan = null;
let currentExecutionReadiness = null;
let currentBaselineObservationPlan = null;
let currentBaselineExecutionResult = null;
let reportBuilderLoadPromise = null;
let labReportLoadPromise = null;
let labBaselinePlannerLoadPromise = null;
let labEmptyFieldsPlannerLoadPromise = null;
let labResponseMessagePlannerLoadPromise = null;
let labExecutionConfirmationLoadPromise = null;
let labCheckRegistryLoadPromise = null;

document.addEventListener("DOMContentLoaded", () => {
  organizeWebsiteTechnicalDetails();
  runPageCheck().catch((error) => {
    renderError(error);
  });
});

async function runPageCheck() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || typeof tab.id !== "number") {
    throw new Error("No active tab is available.");
  }

  elements.currentUrl.textContent = tab.url || "Unavailable";

  if (!isInspectableUrl(tab.url)) {
    renderUnsupportedPage(tab.url);
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: INJECTION_FILES,
  });

  const responseHeaders = await getSecurityHeaders(tab.id, tab.url);
  const analysis = await sendAnalyzeMessage(tab.id, responseHeaders);
  const labModeResult = await sendLabPlanMessage(tab.id, tab.url);
  await getLabCheckRegistry().catch(() => null);
  renderAnalysis(analysis, labModeResult.labPlan, labModeResult.executionReadiness);
}

function sendAnalyzeMessage(tabId, responseHeaders) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, {
      type: MESSAGE_TYPE,
      responseHeaders,
    }, (response) => {
      const lastError = chrome.runtime.lastError;

      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }

      if (!response || !response.ok) {
        reject(new Error(response?.error || "The page could not be analyzed."));
        return;
      }

      resolve(response.analysis);
    });
  });
}

function getSecurityHeaders(tabId, url) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: GET_SECURITY_HEADERS_MESSAGE,
      tabId,
      url,
    }, (response) => {
      const lastError = chrome.runtime.lastError;

      if (lastError || !response?.ok) {
        resolve(null);
        return;
      }

      resolve(response.snapshot);
    });
  });
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
        const labPlan = {
          allowed: false,
          url: url || "",
          reason,
          tests: [],
          safetyNote: "Lab Mode preview is unavailable for this page.",
        };

        resolve({
          labPlan,
          executionReadiness: createFallbackExecutionReadiness(reason),
        });
        return;
      }

      const labPlan = response.labPlan || {};
      resolve({
        labPlan: {
          ...labPlan,
          url: labPlan.url || url || "",
        },
        executionReadiness: response.executionReadiness || createFallbackExecutionReadiness("Lab Mode execution readiness was not returned."),
      });
    });
  });
}

function renderAnalysis(analysis, labPlan, executionReadiness) {
  currentAnalysis = analysis;

  const login = analysis.modules.login;
  const auth = analysis.modules.auth;
  const usernameOrEmailFields = login.usernameFields + login.emailFields;

  elements.currentUrl.textContent = analysis.url;

  setCard(cards.https, elements.httpsStatus, analysis.security.usesHttps ? "HTTPS" : "Needs attention", analysis.security.usesHttps ? "ready" : "attention");
  setCard(cards.login, elements.loginStatus, analysis.authenticationDetected ? "Detected" : "Not detected", analysis.authenticationDetected ? "ready" : "attention");
  setCard(cards.authType, elements.authTypeStatus, auth.type, auth.type === "Unknown" ? "attention" : "ready");
  setCard(cards.confidence, elements.confidenceStatus, `${auth.confidence} (${auth.score}%)`, getConfidenceState(auth.score));
  setCard(cards.fields, elements.fieldStatus, `${login.passwordFields} / ${usernameOrEmailFields}`, login.passwordFields > 0 || usernameOrEmailFields > 0 ? "ready" : "attention");

  renderSummary([
    ...analysis.risk.summary,
    `Password fields: ${login.passwordFields}.`,
    `Username/email fields: ${usernameOrEmailFields}.`,
    ...auth.reasons.map((reason) => `Reason: ${reason}.`),
    "Check completed: no forms were submitted, no passwords were read, and no values were changed.",
  ]);

  renderHeaders(analysis.modules.headers);
  renderHumanSummary(analysis);
  renderFindings(analysis.findings);
  renderReportControls(analysis);
  renderLabModePreview(labPlan, executionReadiness);
}

function renderUnsupportedPage(url) {
  currentAnalysis = null;
  currentLabPlan = null;
  currentExecutionReadiness = null;
  currentBaselineObservationPlan = null;
  currentBaselineExecutionResult = null;

  setCard(cards.https, elements.httpsStatus, "N/A", "attention");
  setCard(cards.login, elements.loginStatus, "Unavailable", "attention");
  setCard(cards.authType, elements.authTypeStatus, "N/A", "attention");
  setCard(cards.confidence, elements.confidenceStatus, "N/A", "attention");
  setCard(cards.fields, elements.fieldStatus, "Unavailable", "attention");

  renderSummary([
    "LoginGuard can inspect regular HTTP and HTTPS web pages.",
    `This page cannot be analyzed from the popup: ${url || "unknown URL"}.`,
  ]);
  renderHeaderItems(["Security headers are unavailable for this page."]);
  hideHumanSummary();
  hideFindings();
  hideReportControls();
  hideLabModePreview();
}

function renderError(error) {
  currentAnalysis = null;
  currentLabPlan = null;
  currentExecutionReadiness = null;
  currentBaselineObservationPlan = null;
  currentBaselineExecutionResult = null;

  setCard(cards.https, elements.httpsStatus, "Needs attention", "attention");
  setCard(cards.login, elements.loginStatus, "Needs attention", "attention");
  setCard(cards.authType, elements.authTypeStatus, "Needs attention", "attention");
  setCard(cards.confidence, elements.confidenceStatus, "Needs attention", "attention");
  setCard(cards.fields, elements.fieldStatus, "Needs attention", "attention");

  renderSummary([
    "The current page could not be analyzed.",
    error.message,
  ]);
  renderHeaderItems(["Security headers could not be analyzed."]);
  hideHumanSummary();
  hideFindings();
  hideReportControls();
  hideLabModePreview();
}

function setCard(card, valueElement, text, state) {
  card.dataset.state = state;
  valueElement.textContent = text;
}

function renderSummary(items) {
  elements.summaryList.replaceChildren(
    ...items.map((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      return listItem;
    }),
  );
}

function renderHeaders(headersResult) {
  const availabilityNote = headersResult.responseHeadersAvailable
    ? []
    : ["Response headers were not captured for this page load; DOM-visible meta policies were checked where possible."];
  const headerItems = headersResult.headers.map((header) => {
    const recommendation = header.recommendation ? ` Recommendation: ${header.recommendation}` : "";

    return `${header.name}: ${header.status}.${recommendation}`;
  });

  renderHeaderItems([...availabilityNote, ...headerItems]);
}

function renderHeaderItems(items) {
  elements.headersList.replaceChildren(
    ...items.map((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      return listItem;
    }),
  );
}

function renderHumanSummary(analysis) {
  ensureHumanSummarySection();
  fillHumanSummary({
    result: "Checking the current page...",
    readiness: "Checking production readiness...",
    priority: "unknown",
    mainIssue: "Preparing Website Check summary.",
    whatItMeans: "LoginGuard is reviewing browser-visible login page signals.",
    whatToFix: "Review the result once analysis finishes.",
    checkCompleted: "Passive local check only.",
  });

  getReportBuilder()
    .then((reportBuilder) => {
      if (currentAnalysis !== analysis) {
        return;
      }

      const report = reportBuilder.buildJsonReport(analysis);
      fillHumanSummary(report.websiteCheckSummary || {});
    })
    .catch((error) => {
      fillHumanSummary({
        result: "Website Check summary is unavailable.",
        priority: analysis?.risk?.level || "unknown",
        mainIssue: "Summary could not be built.",
        whatItMeans: "The technical scan result may still be available below.",
        whatToFix: "Review the technical details manually.",
        checkCompleted: `Passive check only. Error: ${error.message}`,
      });
    });
}

function ensureHumanSummarySection() {
  if (humanSummarySection && humanSummaryDetails) {
    return;
  }

  const shell = document.querySelector(".popup-shell");
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const details = document.createElement("div");

  section.className = "panel human-summary-panel";
  section.setAttribute("aria-labelledby", "human-summary-heading");
  heading.id = "human-summary-heading";
  heading.textContent = "Website Check";
  details.className = "human-summary-list";

  section.append(heading, details);

  const urlPanel = document.querySelector(".url-panel");

  if (urlPanel?.parentNode === shell) {
    urlPanel.after(section);
  } else if (findingsSection) {
    shell.insertBefore(section, findingsSection);
  } else if (reportSection) {
    shell.insertBefore(section, reportSection);
  } else {
    shell.append(section);
  }

  humanSummarySection = section;
  humanSummaryDetails = details;
}

function fillHumanSummary(summary) {
  if (!humanSummaryDetails) {
    return;
  }

  humanSummaryDetails.replaceChildren(
    createHumanSummaryRow("Result", summary.result || summary.mainResult || summary.whatWasFound || "No summary available."),
    createHumanSummaryRow("Production readiness", summary.readiness || "Check completed; review findings before production."),
    createHumanSummaryRow("Priority", summary.priority || summary.risk || summary.riskLevel || "unknown"),
    createHumanSummaryRow("Main issue", summary.mainIssue || "No main issue was selected."),
    createHumanSummaryRow("What it means", summary.whatItMeans || summary.whyItMatters || "Review the technical details for context."),
    createHumanSummaryRow("What to fix", summary.whatToFix || summary.topRecommendation || summary.whatToFixFirst || "Review the findings below."),
    createHumanSummaryRow("Check completed", summary.checkCompleted || summary.safeCheck || summary.safetyNote || summary.whatWasNotDone || "No forms were submitted, no passwords were read, and no values were changed."),
  );
}

function createHumanSummaryRow(label, value) {
  const row = document.createElement("p");
  const labelElement = document.createElement("span");
  const valueElement = document.createElement("strong");

  row.className = "human-summary-row";
  labelElement.textContent = label;
  valueElement.textContent = value;
  row.append(labelElement, valueElement);

  return row;
}

function hideHumanSummary() {
  if (!humanSummarySection) {
    return;
  }

  humanSummarySection.remove();
  humanSummarySection = null;
  humanSummaryDetails = null;
}

function organizeWebsiteTechnicalDetails() {
  if (websiteTechnicalDetails && websiteTechnicalContent) {
    return;
  }

  const shell = document.querySelector(".popup-shell");
  const summaryGrid = document.querySelector(".summary");
  const reasonsPanel = elements.summaryList.closest(".panel");
  const headersPanel = elements.headersList.closest(".panel");
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const content = document.createElement("div");

  details.className = "panel technical-details";
  summary.textContent = "Technical details";
  content.className = "technical-details-content";
  details.append(summary, content);

  [summaryGrid, reasonsPanel, headersPanel].forEach((node) => {
    if (node) {
      content.append(node);
    }
  });

  shell.append(details);
  websiteTechnicalDetails = details;
  websiteTechnicalContent = content;
}

function renderFindings(findings) {
  if (!Array.isArray(findings) || findings.length === 0) {
    hideFindings();
    return;
  }

  ensureFindingsSection();

  findingsList.replaceChildren(
    ...findings.map(createFindingCard),
  );
}

function ensureFindingsSection() {
  if (findingsSection && findingsList) {
    return;
  }

  const shell = websiteTechnicalContent || document.querySelector(".popup-shell");
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const list = document.createElement("div");

  section.className = "panel findings-panel";
  section.setAttribute("aria-labelledby", "findings-heading");
  heading.id = "findings-heading";
  heading.textContent = "Technical findings";
  list.className = "findings-list";

  section.append(heading, list);
  shell.append(section);

  findingsSection = section;
  findingsList = list;
}

function createFindingCard(finding) {
  const card = document.createElement("article");
  const title = document.createElement("h3");
  const meta = document.createElement("div");
  const summary = document.createElement("p");
  const recommendation = document.createElement("p");

  card.className = "finding-card";
  title.textContent = finding.title || "Untitled finding";
  meta.className = "finding-meta";
  summary.className = "finding-summary";
  summary.textContent = finding.summary || "No summary available.";
  recommendation.className = "finding-recommendation";
  recommendation.textContent = `Recommendation: ${finding.recommendation || "Review this finding manually."}`;

  meta.append(
    createFindingBadge("Severity", finding.severity || "unknown"),
    createFindingBadge("Status", finding.status || "unknown"),
    createFindingBadge("Confidence", `${Number.isFinite(Number(finding.confidence)) ? finding.confidence : 0}%`),
  );

  card.append(title, meta, summary);

  if (Array.isArray(finding.evidence) && finding.evidence.length > 0) {
    card.append(createEvidenceList(finding.evidence));
  }

  card.append(recommendation);

  return card;
}

function createFindingBadge(label, value) {
  const badge = document.createElement("span");

  badge.className = "finding-badge";
  badge.textContent = `${label}: ${value}`;

  return badge;
}

function createEvidenceList(evidence) {
  const list = document.createElement("ul");

  list.className = "finding-evidence";
  list.replaceChildren(
    ...evidence.map((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      return listItem;
    }),
  );

  return list;
}

function hideFindings() {
  if (!findingsSection) {
    return;
  }

  findingsSection.remove();
  findingsSection = null;
  findingsList = null;
}

function renderReportControls(analysis) {
  if (!analysis) {
    hideReportControls();
    return;
  }

  ensureReportSection();
  setReportStatus("", "");
}

function ensureReportSection() {
  if (reportSection && reportStatus) {
    return;
  }

  const shell = document.querySelector(".popup-shell");
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const actions = document.createElement("div");
  const aiPromptHelper = document.createElement("p");
  const jsonButton = document.createElement("button");
  const markdownButton = document.createElement("button");
  const aiPromptButton = document.createElement("button");
  const fullAiPromptButton = document.createElement("button");
  const labSessionButton = document.createElement("button");
  const status = document.createElement("p");

  section.className = "panel report-panel";
  section.setAttribute("aria-labelledby", "report-heading");
  heading.id = "report-heading";
  heading.textContent = "Report";
  actions.className = "report-actions";
  jsonButton.type = "button";
  jsonButton.className = "report-button";
  jsonButton.textContent = "Copy JSON Report";
  markdownButton.type = "button";
  markdownButton.className = "report-button";
  markdownButton.textContent = "Copy Markdown Report";
  aiPromptButton.type = "button";
  aiPromptButton.className = "report-button";
  aiPromptButton.textContent = "Copy Prompt for AI Review";
  fullAiPromptButton.type = "button";
  fullAiPromptButton.className = "report-button";
  fullAiPromptButton.textContent = "Copy Full Technical AI Prompt";
  aiPromptHelper.className = "report-helper";
  aiPromptHelper.textContent =
    "Short prompt: copies a short local prompt for optional AI review. No data is sent automatically. Full prompt: copies a longer technical prompt with the full report for deeper review.";
  labSessionButton.type = "button";
  labSessionButton.className = "report-button";
  labSessionButton.textContent = "Open Lab Session";
  status.className = "report-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  jsonButton.addEventListener("click", copyCurrentJsonReport);
  markdownButton.addEventListener("click", copyCurrentMarkdownReport);
  aiPromptButton.addEventListener("click", copyCurrentAiAnalystPrompt);
  fullAiPromptButton.addEventListener("click", copyCurrentFullTechnicalAiPrompt);
  labSessionButton.addEventListener("click", openLabSessionPage);

  actions.append(jsonButton, markdownButton, aiPromptButton, fullAiPromptButton, labSessionButton);
  section.append(heading, actions, aiPromptHelper, status);
  shell.append(section);

  reportSection = section;
  reportStatus = status;
}

async function openLabSessionPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const createProperties = {
      url: chrome.runtime.getURL("src/lab/lab-session.html"),
      active: true,
    };

    if (tab?.id) {
      createProperties.openerTabId = tab.id;
    }

    await chrome.tabs.create(createProperties);
  } catch (error) {
    setReportStatus(`Could not open Lab Session: ${error.message}`, "error");
  }
}

async function copyCurrentJsonReport() {
  if (!currentAnalysis) {
    setReportStatus("No completed analysis is available to copy.", "error");
    return;
  }

  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      throw new Error("Clipboard access is not available in this context.");
    }

    const reportBuilder = await getReportBuilder();
    const reportJson = JSON.stringify(reportBuilder.buildJsonReport(currentAnalysis), null, 2);
    JSON.parse(reportJson);

    await navigator.clipboard.writeText(reportJson);
    setReportStatus("JSON report copied locally.", "success");
  } catch (error) {
    setReportStatus(`Could not copy JSON report: ${error.message}`, "error");
  }
}

async function copyCurrentMarkdownReport() {
  if (!currentAnalysis) {
    setReportStatus("No completed analysis is available to copy.", "error");
    return;
  }

  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      throw new Error("Clipboard access is not available in this context.");
    }

    const reportBuilder = await getReportBuilder();

    await navigator.clipboard.writeText(reportBuilder.buildMarkdownReport(currentAnalysis));
    setReportStatus("Markdown report copied locally.", "success");
  } catch (error) {
    setReportStatus(`Could not copy Markdown report: ${error.message}`, "error");
  }
}

async function copyCurrentAiAnalystPrompt() {
  if (!currentAnalysis) {
    setReportStatus("No completed analysis is available to copy.", "error");
    return;
  }

  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      throw new Error("Clipboard access is not available in this context.");
    }

    const reportBuilder = await getReportBuilder();

    const buildPrompt = reportBuilder.buildAiReviewPrompt || reportBuilder.buildAiAnalystPrompt;

    await navigator.clipboard.writeText(buildPrompt(currentAnalysis));
    setReportStatus("Prompt for AI review copied locally.", "success");
  } catch (error) {
    setReportStatus(`Could not copy prompt for AI review: ${error.message}`, "error");
  }
}

async function copyCurrentFullTechnicalAiPrompt() {
  if (!currentAnalysis) {
    setReportStatus("No completed analysis is available to copy.", "error");
    return;
  }

  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      throw new Error("Clipboard access is not available in this context.");
    }

    const reportBuilder = await getReportBuilder();

    if (typeof reportBuilder.buildFullTechnicalAiReviewPrompt !== "function") {
      throw new Error("Full technical prompt builder is not available.");
    }

    await navigator.clipboard.writeText(reportBuilder.buildFullTechnicalAiReviewPrompt(currentAnalysis));
    setReportStatus("Full technical AI prompt copied locally.", "success");
  } catch (error) {
    setReportStatus(`Could not copy full technical AI prompt: ${error.message}`, "error");
  }
}

async function getReportBuilder() {
  if (globalThis.LoginGuardReportBuilder) {
    return globalThis.LoginGuardReportBuilder;
  }

  if (!reportBuilderLoadPromise) {
    reportBuilderLoadPromise = import(chrome.runtime.getURL("src/core/finding-explainer.js"))
      .then(() => import(chrome.runtime.getURL("src/core/report-builder.js")))
      .then(() => {
        if (!globalThis.LoginGuardReportBuilder) {
          throw new Error("LoginGuard report builder was not loaded.");
        }

        return globalThis.LoginGuardReportBuilder;
      })
      .catch((error) => {
        reportBuilderLoadPromise = null;
        throw error;
      });
  }

  return reportBuilderLoadPromise;
}

function setReportStatus(message, state) {
  if (!reportStatus) {
    return;
  }

  reportStatus.textContent = message;

  if (state) {
    reportStatus.dataset.state = state;
    return;
  }

  delete reportStatus.dataset.state;
}

function setLabReportStatus(message, state) {
  if (!labReportStatus) {
    return;
  }

  labReportStatus.textContent = message;

  if (state) {
    labReportStatus.dataset.state = state;
    return;
  }

  delete labReportStatus.dataset.state;
}

function hideReportControls() {
  if (!reportSection) {
    return;
  }

  reportSection.remove();
  reportSection = null;
  reportStatus = null;
}

function renderLabModePreview(labPlan, executionReadiness) {
  if (!labPlan) {
    currentLabPlan = null;
    currentExecutionReadiness = null;
    currentBaselineObservationPlan = null;
    currentBaselineExecutionResult = null;
    hideLabModePreview();
    return;
  }

  currentLabPlan = labPlan;
  currentExecutionReadiness = executionReadiness || createFallbackExecutionReadiness("Lab Mode execution readiness was not evaluated.");
  currentBaselineObservationPlan = null;
  currentBaselineExecutionResult = null;
  ensureLabModeSection();

  const statusText = labPlan.allowed ? "Allowed" : "Refused";
  const plannedCategories = Array.isArray(labPlan.tests)
    ? labPlan.tests.map((test) => test?.category).filter(Boolean)
    : [];
  const items = [
    createLabDetailRow("Lab Mode status", statusText),
    createLabDetailRow("Reason", labPlan.reason || (labPlan.allowed ? "Approved local lab context." : "Not approved for Lab Mode.")),
    createLabDetailRow("Detected forms", String(Array.isArray(labPlan.detectedForms) ? labPlan.detectedForms.length : 0)),
    createLabDetailRow("Detected inputs", String(Array.isArray(labPlan.detectedInputs) ? labPlan.detectedInputs.length : 0)),
  ];
  const availableChecksBlock = createLabCheckListBlock("Available checks", getLabCheckDefinitions(plannedCategories), "No lab checks are available for this page.");
  const categoriesBlock = createLabCategoriesBlock(plannedCategories);
  const readinessBlock = createExecutionReadinessBlock(currentExecutionReadiness);
  const baselineBlock = createBaselineObservationBlock(labPlan, currentExecutionReadiness);
  const emptyFieldsBlock = createEmptyFieldsObservationBlock(labPlan, currentExecutionReadiness);
  const responseMessageBlock = createResponseMessageComparisonBlock(labPlan, currentExecutionReadiness);
  const confirmationBlock = createExecutionConfirmationBlock(labPlan, currentExecutionReadiness);
  const executionResultBlock = createBaselineExecutionResultBlock();
  const safetyNote = document.createElement("p");

  safetyNote.className = "lab-safety-note";
  safetyNote.textContent = labPlan.safetyNote || "Lab Mode preview did not execute tests.";

  labSection.dataset.state = labPlan.allowed ? "allowed" : "refused";
  labDetails.replaceChildren(
    ...items,
    availableChecksBlock,
    safetyNote,
    createLabTechnicalDetailsBlock(categoriesBlock, readinessBlock, baselineBlock, emptyFieldsBlock, responseMessageBlock, confirmationBlock, executionResultBlock),
  );
  updateBaselineRunButton();
  setLabReportStatus("", "");
}

function ensureLabModeSection() {
  if (labSection && labDetails && labReportStatus) {
    return;
  }

  const shell = document.querySelector(".popup-shell");
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const details = document.createElement("div");
  const actions = document.createElement("div");
  const jsonButton = document.createElement("button");
  const markdownButton = document.createElement("button");
  const labSessionButton = document.createElement("button");
  const runButton = document.createElement("button");
  const status = document.createElement("p");

  section.className = "panel lab-panel";
  section.setAttribute("aria-labelledby", "lab-heading");
  heading.id = "lab-heading";
  heading.textContent = "Lab Mode";
  details.className = "lab-details";
  actions.className = "lab-report-actions";
  jsonButton.type = "button";
  jsonButton.className = "report-button";
  jsonButton.textContent = "Copy Lab JSON Report";
  markdownButton.type = "button";
  markdownButton.className = "report-button";
  markdownButton.textContent = "Copy Lab Markdown Report";
  labSessionButton.type = "button";
  labSessionButton.className = "report-button";
  labSessionButton.textContent = "Open Lab Session";
  runButton.type = "button";
  runButton.className = "report-button lab-run-button is-hidden";
  runButton.textContent = "Run Baseline Observation";
  status.className = "lab-report-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  jsonButton.addEventListener("click", copyCurrentLabJsonReport);
  markdownButton.addEventListener("click", copyCurrentLabMarkdownReport);
  labSessionButton.addEventListener("click", openLabSessionPage);
  runButton.addEventListener("click", runCurrentBaselineObservation);

  actions.append(runButton, jsonButton, markdownButton, labSessionButton);
  section.append(heading, details, actions, status);
  shell.append(section);

  labSection = section;
  labDetails = details;
  labReportStatus = status;
  labRunButton = runButton;
}

async function copyCurrentLabJsonReport() {
  if (!currentLabPlan) {
    setLabReportStatus("No Lab Mode plan is available to copy.", "error");
    return;
  }

  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      throw new Error("Clipboard access is not available in this context.");
    }

    const labReport = await getLabReportBuilder();
    const reportJson = JSON.stringify(labReport.buildLabJsonReport(
      currentLabPlan,
      currentExecutionReadiness,
      getExecutedLabResults(),
    ), null, 2);
    JSON.parse(reportJson);

    await navigator.clipboard.writeText(reportJson);
    setLabReportStatus("Lab JSON report copied locally.", "success");
  } catch (error) {
    setLabReportStatus(`Could not copy Lab JSON report: ${error.message}`, "error");
  }
}

async function copyCurrentLabMarkdownReport() {
  if (!currentLabPlan) {
    setLabReportStatus("No Lab Mode plan is available to copy.", "error");
    return;
  }

  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      throw new Error("Clipboard access is not available in this context.");
    }

    const labReport = await getLabReportBuilder();

    await navigator.clipboard.writeText(labReport.buildLabMarkdownReport(
      currentLabPlan,
      currentExecutionReadiness,
      getExecutedLabResults(),
    ));
    setLabReportStatus("Lab Markdown report copied locally.", "success");
  } catch (error) {
    setLabReportStatus(`Could not copy Lab Markdown report: ${error.message}`, "error");
  }
}

async function getLabReportBuilder() {
  if (globalThis.LoginGuardLabReport) {
    return globalThis.LoginGuardLabReport;
  }

  if (!labReportLoadPromise) {
    labReportLoadPromise = import(chrome.runtime.getURL("src/lab/lab-execution-result.js"))
      .then(() => import(chrome.runtime.getURL("src/lab/lab-baseline-observation.js")))
      .then(() => import(chrome.runtime.getURL("src/lab/lab-empty-fields-observation.js")))
      .then(() => import(chrome.runtime.getURL("src/lab/lab-check-registry.js")))
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

function createLabDetailRow(label, value) {
  const row = document.createElement("p");
  const labelElement = document.createElement("span");
  const valueElement = document.createElement("strong");

  row.className = "lab-detail-row";
  labelElement.textContent = label;
  valueElement.textContent = value;
  row.append(labelElement, valueElement);

  return row;
}

function createLabCategoriesBlock(categories) {
  return createLabCategoryListBlock("Planned categories", categories, "No planned categories for this page.");
}

function createLabCheckListBlock(labelText, checks, emptyText) {
  const block = document.createElement("div");
  const label = document.createElement("p");
  const list = document.createElement("ul");
  const checkItems = Array.isArray(checks) && checks.length > 0 ? checks : [];

  block.className = "lab-categories lab-checks";
  label.className = "lab-categories-label";
  label.textContent = labelText;
  list.className = "lab-check-list";

  if (checkItems.length === 0) {
    const item = document.createElement("li");
    item.textContent = emptyText;
    list.append(item);
  } else {
    list.replaceChildren(...checkItems.map(createLabCheckListItem));
  }

  block.append(label, list);

  return block;
}

function createLabTechnicalDetailsBlock(...children) {
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const content = document.createElement("div");

  details.className = "lab-technical-details";
  summary.textContent = "Lab technical details";
  content.className = "lab-technical-content";
  content.replaceChildren(...children);
  details.append(summary, content);
  labTechnicalDetails = details;

  return details;
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

function createLabCheckListItem(definition) {
  const item = document.createElement("li");
  const header = document.createElement("div");
  const title = document.createElement("strong");
  const description = document.createElement("span");
  const badge = document.createElement("span");

  item.className = "check-card";
  header.className = "check-card-header";
  title.className = "check-title";
  title.textContent = definition.label || definition.category || "Unknown Lab Check";
  badge.className = `check-badge ${getCheckBadgeClass(definition)}`;
  badge.textContent = definition.defaultStatusLabel || definition.availability || "Unknown";
  description.textContent = definition.shortDescription || "No description available.";
  header.append(title, badge);
  item.append(header, description);

  return item;
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

async function getLabCheckRegistry() {
  if (globalThis.LoginGuardLabCheckRegistry) {
    return globalThis.LoginGuardLabCheckRegistry;
  }

  if (!labCheckRegistryLoadPromise) {
    labCheckRegistryLoadPromise = import(chrome.runtime.getURL("src/lab/lab-check-registry.js"))
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

function createExecutionReadinessBlock(readiness) {
  const block = document.createElement("div");
  const title = document.createElement("p");
  const safetyNote = document.createElement("p");
  const allowedCategories = Array.isArray(readiness?.allowedCategories) ? readiness.allowedCategories : [];
  const blockedCategories = Array.isArray(readiness?.blockedCategories) ? readiness.blockedCategories : [];

  block.className = "lab-readiness";
  title.className = "lab-readiness-title";
  title.textContent = "Execution Readiness";
  safetyNote.className = "lab-safety-note";
  safetyNote.textContent = readiness?.safetyNote || "Lab Mode execution readiness is display-only. No tests were executed.";

  block.replaceChildren(
    title,
    createLabDetailRow("Status", readiness?.allowed ? "Allowed" : "Refused"),
    createLabDetailRow("Reason", readiness?.reason || "Execution readiness could not be evaluated."),
    createLabCategoryListBlock("Allowed categories", allowedCategories, "No categories currently allowed."),
    createLabCategoryListBlock("Blocked categories", blockedCategories, "No categories currently blocked."),
    safetyNote,
  );

  return block;
}

function createBaselineObservationBlock(labPlan, readiness) {
  const block = document.createElement("div");

  block.className = "lab-readiness lab-baseline-plan";
  fillBaselineObservationBlock(
    block,
    createUnavailableBaselinePlan("Baseline observation planner is loading. No plan was executed."),
  );

  getLabBaselinePlanner()
    .then((planner) => {
      if (currentLabPlan !== labPlan || currentExecutionReadiness !== readiness) {
        return;
      }

      const baselinePlan = planner.buildBaselineObservationPlan(labPlan, readiness);
      currentBaselineObservationPlan = baselinePlan;
      fillBaselineObservationBlock(block, baselinePlan);
      updateBaselineRunButton();
    })
    .catch((error) => {
      fillBaselineObservationBlock(
        block,
        createUnavailableBaselinePlan(`Baseline observation planner is unavailable: ${error.message}`),
      );
    });

  return block;
}

function createEmptyFieldsObservationBlock(labPlan, readiness) {
  const block = document.createElement("div");

  block.className = "lab-readiness lab-empty-fields-plan";
  fillEmptyFieldsObservationBlock(
    block,
    createUnavailableEmptyFieldsPlan("Empty Fields Observation Planner is not available."),
  );

  getLabEmptyFieldsPlanner()
    .then((planner) => {
      if (currentLabPlan !== labPlan || currentExecutionReadiness !== readiness) {
        return;
      }

      const emptyFieldsPlan = planner.buildEmptyFieldsObservationPlan(labPlan, readiness);
      fillEmptyFieldsObservationBlock(block, emptyFieldsPlan);
    })
    .catch(() => {
      fillEmptyFieldsObservationBlock(
        block,
        createUnavailableEmptyFieldsPlan("Empty Fields Observation Planner is not available."),
      );
    });

  return block;
}

function createResponseMessageComparisonBlock(labPlan, readiness) {
  const block = document.createElement("div");

  block.className = "lab-readiness lab-response-message-plan";
  fillResponseMessageComparisonBlock(
    block,
    createUnavailableResponseMessagePlan("Response Message Comparison Planner is not available."),
  );

  getLabResponseMessagePlanner()
    .then((planner) => {
      if (currentLabPlan !== labPlan || currentExecutionReadiness !== readiness) {
        return;
      }

      const plan = planner.buildResponseMessageComparisonPlan(labPlan, readiness);
      fillResponseMessageComparisonBlock(block, plan);
    })
    .catch(() => {
      fillResponseMessageComparisonBlock(
        block,
        createUnavailableResponseMessagePlan("Response Message Comparison Planner is not available."),
      );
    });

  return block;
}

function createExecutionConfirmationBlock(labPlan, readiness) {
  const block = document.createElement("div");

  block.className = "lab-readiness lab-execution-confirmation";
  fillExecutionConfirmationBlock(
    block,
    createUnavailableExecutionConfirmation("Execution confirmation gate is loading. No tests were executed."),
  );

  Promise.all([getLabBaselinePlanner(), getLabExecutionConfirmationGate()])
    .then(([planner, confirmationGate]) => {
      if (currentLabPlan !== labPlan || currentExecutionReadiness !== readiness) {
        return;
      }

      const baselineObservationPlan = planner.buildBaselineObservationPlan(labPlan, readiness);
      const confirmation = confirmationGate.evaluateExecutionConfirmation({
        labPlan,
        readiness,
        baselineObservationPlan,
        userConfirmed: false,
      });

      fillExecutionConfirmationBlock(block, confirmation);
    })
    .catch((error) => {
      fillExecutionConfirmationBlock(
        block,
        createUnavailableExecutionConfirmation(`Execution confirmation gate is unavailable: ${error.message}`),
      );
    });

  return block;
}

function createBaselineExecutionResultBlock() {
  const block = document.createElement("div");

  block.className = "lab-readiness lab-baseline-result";
  labExecutionResultBlock = block;
  fillBaselineExecutionResultBlock(block, currentBaselineExecutionResult);

  return block;
}

function fillBaselineObservationBlock(block, baselinePlan) {
  const title = document.createElement("p");
  const safetyNote = document.createElement("p");
  const targetForms = Array.isArray(baselinePlan?.targetForms) ? baselinePlan.targetForms : [];
  const observationsPlanned = Array.isArray(baselinePlan?.observationsPlanned)
    ? baselinePlan.observationsPlanned
    : [];

  title.className = "lab-readiness-title";
  title.textContent = "Baseline Observation Plan";
  safetyNote.className = "lab-safety-note";
  safetyNote.textContent = baselinePlan?.safetyNote || "Baseline observation planning is preview-only. No tests were executed.";

  block.replaceChildren(
    title,
    createLabDetailRow("Status", baselinePlan?.status || "skipped"),
    createLabDetailRow("Reason", baselinePlan?.reason || "Baseline observation plan is unavailable."),
    createLabDetailRow("Target forms", String(targetForms.length)),
    createLabCategoryListBlock("Observations planned", observationsPlanned, "No observations are currently planned."),
    safetyNote,
  );
}

function fillEmptyFieldsObservationBlock(block, emptyFieldsPlan) {
  const title = document.createElement("p");
  const safetyNote = document.createElement("p");
  const targetForms = Array.isArray(emptyFieldsPlan?.targetForms) ? emptyFieldsPlan.targetForms : [];
  const observationsPlanned = Array.isArray(emptyFieldsPlan?.observationsPlanned)
    ? emptyFieldsPlan.observationsPlanned
    : [];

  title.className = "lab-readiness-title";
  title.textContent = "Empty Fields Observation Plan";
  safetyNote.className = "lab-safety-note";
  safetyNote.textContent = emptyFieldsPlan?.safetyNote || "Empty fields observation planning is preview-only. No tests were executed.";

  block.replaceChildren(
    title,
    createLabDetailRow("Status", emptyFieldsPlan?.status || "blocked"),
    createLabDetailRow("Reason", emptyFieldsPlan?.reason || "Empty Fields Observation Planner is not available."),
    createLabDetailRow("Target forms", String(targetForms.length)),
    createLabCategoryListBlock("Observations planned", observationsPlanned, "No observations are currently planned."),
    safetyNote,
  );
}

function fillResponseMessageComparisonBlock(block, plan) {
  const title = document.createElement("p");
  const safetyNote = document.createElement("p");
  const targetForms = Array.isArray(plan?.targetForms) ? plan.targetForms : [];
  const observationsPlanned = Array.isArray(plan?.observationsPlanned)
    ? plan.observationsPlanned
    : [];

  title.className = "lab-readiness-title";
  title.textContent = "Response Message Comparison Plan";
  safetyNote.className = "lab-safety-note";
  safetyNote.textContent = plan?.safetyNote || "Response Message Comparison Planner is not available.";

  block.replaceChildren(
    title,
    createLabDetailRow("Status", plan?.status || "blocked"),
    createLabDetailRow("Reason", plan?.reason || "Response Message Comparison Planner is not available."),
    createLabDetailRow("Target forms", String(targetForms.length)),
    createLabCategoryListBlock("Observations planned", observationsPlanned, "No observations are currently planned."),
    safetyNote,
  );
}

function fillExecutionConfirmationBlock(block, confirmation) {
  const title = document.createElement("p");
  const safetyNote = document.createElement("p");

  title.className = "lab-readiness-title";
  title.textContent = "Execution Confirmation";
  safetyNote.className = "lab-safety-note";
  safetyNote.textContent = confirmation?.safetyNote || "Execution confirmation is preview-only. No tests were executed.";

  block.replaceChildren(
    title,
    createLabDetailRow("Confirmed", confirmation?.confirmed ? "Yes" : "No"),
    createLabDetailRow("Allowed", confirmation?.allowed ? "Yes" : "No"),
    createLabDetailRow("Reason", confirmation?.reason || "Execution confirmation is unavailable."),
    createLabDetailRow("Category", confirmation?.category || "baseline-submit-observation"),
    safetyNote,
  );
}

function fillBaselineExecutionResultBlock(block, result) {
  const title = document.createElement("p");

  title.className = "lab-readiness-title";
  title.textContent = "Baseline Observation Result";

  if (!result) {
    const note = document.createElement("p");

    note.className = "lab-safety-note";
    note.textContent = "No baseline observation has been run yet.";
    block.replaceChildren(title, note);
    return;
  }

  block.replaceChildren(
    title,
    createLabDetailRow("Status", result.status || "unknown"),
    createLabDetailRow("Reason", result.reason || "No reason provided."),
    createLabDetailRow("Observations", String(Array.isArray(result.observations) ? result.observations.length : 0)),
    createLabCategoryListBlock(
      "Observation names",
      Array.isArray(result.observations) ? result.observations.map((observation) => observation?.name).filter(Boolean) : [],
      "No observation names recorded.",
    ),
    createLabSafetyNote(result.safetyNote || "Baseline observation recorded approved metadata only."),
  );
}

function createLabSafetyNote(text) {
  const note = document.createElement("p");

  note.className = "lab-safety-note";
  note.textContent = text;

  return note;
}

function createUnavailableBaselinePlan(reason) {
  return {
    status: "skipped",
    reason,
    targetForms: [],
    observationsPlanned: [],
    safetyNote: "Baseline observation planning was not executed. No forms were submitted and no input values were read.",
  };
}

function createUnavailableEmptyFieldsPlan(reason) {
  return {
    status: "blocked",
    reason,
    targetForms: [],
    observationsPlanned: [],
    safetyNote: "Empty fields observation planning was not executed. No forms were submitted and no input values were read, cleared, or modified.",
  };
}

function createUnavailableResponseMessagePlan(reason) {
  return {
    status: "blocked",
    reason,
    targetForms: [],
    observationsPlanned: [],
    safetyNote: "Response message comparison planning was not executed. No forms were submitted and no response bodies or input values were collected.",
  };
}

function createUnavailableExecutionConfirmation(reason) {
  return {
    confirmed: false,
    allowed: false,
    reason,
    category: "baseline-submit-observation",
    safetyNote: "Execution confirmation was not evaluated. No tests were executed and no forms were submitted.",
  };
}

async function getLabBaselinePlanner() {
  if (globalThis.LoginGuardLabBaselineObservation) {
    return globalThis.LoginGuardLabBaselineObservation;
  }

  if (!labBaselinePlannerLoadPromise) {
    labBaselinePlannerLoadPromise = import(chrome.runtime.getURL("src/lab/lab-baseline-observation.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabBaselineObservation) {
          throw new Error("LoginGuard Lab baseline observation planner was not loaded.");
        }

        return globalThis.LoginGuardLabBaselineObservation;
      })
      .catch((error) => {
        labBaselinePlannerLoadPromise = null;
        throw error;
      });
  }

  return labBaselinePlannerLoadPromise;
}

async function getLabEmptyFieldsPlanner() {
  if (globalThis.LoginGuardLabEmptyFieldsObservation) {
    return globalThis.LoginGuardLabEmptyFieldsObservation;
  }

  if (!labEmptyFieldsPlannerLoadPromise) {
    labEmptyFieldsPlannerLoadPromise = import(chrome.runtime.getURL("src/lab/lab-empty-fields-observation.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabEmptyFieldsObservation) {
          throw new Error("LoginGuard Lab empty fields observation planner was not loaded.");
        }

        return globalThis.LoginGuardLabEmptyFieldsObservation;
      })
      .catch((error) => {
        labEmptyFieldsPlannerLoadPromise = null;
        throw error;
      });
  }

  return labEmptyFieldsPlannerLoadPromise;
}

async function getLabResponseMessagePlanner() {
  if (globalThis.LoginGuardLabResponseMessageComparison) {
    return globalThis.LoginGuardLabResponseMessageComparison;
  }

  if (!labResponseMessagePlannerLoadPromise) {
    labResponseMessagePlannerLoadPromise = import(chrome.runtime.getURL("src/lab/lab-response-message-comparison.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabResponseMessageComparison) {
          throw new Error("LoginGuard Lab response message comparison planner was not loaded.");
        }

        return globalThis.LoginGuardLabResponseMessageComparison;
      })
      .catch((error) => {
        labResponseMessagePlannerLoadPromise = null;
        throw error;
      });
  }

  return labResponseMessagePlannerLoadPromise;
}

async function getLabExecutionConfirmationGate() {
  if (globalThis.LoginGuardLabExecutionConfirmation) {
    return globalThis.LoginGuardLabExecutionConfirmation;
  }

  if (!labExecutionConfirmationLoadPromise) {
    labExecutionConfirmationLoadPromise = import(chrome.runtime.getURL("src/lab/lab-execution-confirmation.js"))
      .then(() => {
        if (!globalThis.LoginGuardLabExecutionConfirmation) {
          throw new Error("LoginGuard Lab execution confirmation gate was not loaded.");
        }

        return globalThis.LoginGuardLabExecutionConfirmation;
      })
      .catch((error) => {
        labExecutionConfirmationLoadPromise = null;
        throw error;
      });
  }

  return labExecutionConfirmationLoadPromise;
}

async function runCurrentBaselineObservation() {
  if (!currentLabPlan || !currentExecutionReadiness || !currentBaselineObservationPlan) {
    setLabReportStatus("Baseline observation is not ready for this page.", "error");
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || typeof tab.id !== "number") {
      throw new Error("No active tab is available.");
    }

    const executionResult = await sendBaselineObservationMessage(tab.id, {
      labPlan: currentLabPlan,
      readiness: currentExecutionReadiness,
      baselineObservationPlan: currentBaselineObservationPlan,
      userConfirmed: true,
    });

    currentBaselineExecutionResult = executionResult;
    fillBaselineExecutionResultBlock(labExecutionResultBlock, executionResult);
    setLabReportStatus("Baseline observation completed with approved metadata only.", "success");
  } catch (error) {
    setLabReportStatus(`Could not run baseline observation: ${error.message}`, "error");
  }
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

function updateBaselineRunButton() {
  if (!labRunButton) {
    return;
  }

  const canRun = currentLabPlan?.allowed === true
    && currentExecutionReadiness?.allowed === true
    && currentBaselineObservationPlan?.status === "planned";

  labRunButton.classList.toggle("is-hidden", !canRun);
  labRunButton.disabled = !canRun;
}

function getExecutedLabResults() {
  return currentBaselineExecutionResult ? [currentBaselineExecutionResult] : [];
}

function createLabCategoryListBlock(labelText, categories, emptyText) {
  const block = document.createElement("div");
  const label = document.createElement("p");
  const list = document.createElement("ul");
  const categoryItems = categories.length > 0 ? categories : [emptyText];

  block.className = "lab-categories";
  label.className = "lab-categories-label";
  label.textContent = labelText;
  list.className = "lab-category-list";
  list.replaceChildren(
    ...categoryItems.map((category) => {
      const item = document.createElement("li");
      item.textContent = category;
      return item;
    }),
  );

  block.append(label, list);

  return block;
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

function hideLabModePreview() {
  if (!labSection) {
    return;
  }

  labSection.remove();
  labSection = null;
  labDetails = null;
  labTechnicalDetails = null;
  labReportStatus = null;
  labRunButton = null;
  labExecutionResultBlock = null;
  currentLabPlan = null;
  currentExecutionReadiness = null;
  currentBaselineObservationPlan = null;
  currentBaselineExecutionResult = null;
}

function getConfidenceState(confidenceScore) {
  if (confidenceScore >= 65) {
    return "ready";
  }

  if (confidenceScore >= 50) {
    return "attention";
  }

  return "attention";
}

function isInspectableUrl(url) {
  return /^https?:\/\//i.test(url || "");
}
