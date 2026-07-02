// Popup controller that requests active-tab analysis and renders the result.
const MESSAGE_TYPE = "LOGIN_GUARD_ANALYZE";
const LAB_PLAN_MESSAGE_TYPE = "LOGIN_GUARD_CREATE_LAB_PLAN";
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
let reportSection = null;
let reportStatus = null;
let labSection = null;
let labDetails = null;
let labReportStatus = null;
let currentAnalysis = null;
let currentLabPlan = null;
let reportBuilderLoadPromise = null;
let labReportLoadPromise = null;

document.addEventListener("DOMContentLoaded", () => {
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
  const labPlan = await sendLabPlanMessage(tab.id, tab.url);
  renderAnalysis(analysis, labPlan);
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
        resolve({
          allowed: false,
          url: url || "",
          reason: response?.error || lastError?.message || "Lab Mode plan could not be created.",
          tests: [],
          safetyNote: "Lab Mode preview is unavailable for this page.",
        });
        return;
      }

      const labPlan = response.labPlan || {};
      resolve({
        ...labPlan,
        url: labPlan.url || url || "",
      });
    });
  });
}

function renderAnalysis(analysis, labPlan) {
  currentAnalysis = analysis;

  const login = analysis.modules.login;
  const auth = analysis.modules.auth;
  const usernameOrEmailFields = login.usernameFields + login.emailFields;

  elements.currentUrl.textContent = analysis.url;

  setCard(cards.https, elements.httpsStatus, analysis.security.usesHttps ? "HTTPS" : "Not HTTPS", analysis.security.usesHttps ? "safe" : "danger");
  setCard(cards.login, elements.loginStatus, analysis.authenticationDetected ? "Yes" : "No", analysis.authenticationDetected ? "safe" : "warning");
  setCard(cards.authType, elements.authTypeStatus, auth.type, auth.type === "Unknown" ? "warning" : "safe");
  setCard(cards.confidence, elements.confidenceStatus, `${auth.confidence} (${auth.score}%)`, getConfidenceState(auth.score));
  setCard(cards.fields, elements.fieldStatus, `${login.passwordFields} / ${usernameOrEmailFields}`, login.passwordFields > 0 || usernameOrEmailFields > 0 ? "safe" : "warning");

  renderSummary([
    ...analysis.risk.summary,
    `Password fields: ${login.passwordFields}.`,
    `Username/email fields: ${usernameOrEmailFields}.`,
    ...auth.reasons.map((reason) => `Reason: ${reason}.`),
    "No forms were submitted and no data left this page.",
  ]);

  renderHeaders(analysis.modules.headers);
  renderFindings(analysis.findings);
  renderReportControls(analysis);
  renderLabModePreview(labPlan);
}

function renderUnsupportedPage(url) {
  currentAnalysis = null;
  currentLabPlan = null;

  setCard(cards.https, elements.httpsStatus, "N/A", "warning");
  setCard(cards.login, elements.loginStatus, "Unavailable", "warning");
  setCard(cards.authType, elements.authTypeStatus, "N/A", "warning");
  setCard(cards.confidence, elements.confidenceStatus, "N/A", "warning");
  setCard(cards.fields, elements.fieldStatus, "Unavailable", "warning");

  renderSummary([
    "LoginGuard can inspect regular HTTP and HTTPS web pages.",
    `This page cannot be analyzed from the popup: ${url || "unknown URL"}.`,
  ]);
  renderHeaderItems(["Security headers are unavailable for this page."]);
  hideFindings();
  hideReportControls();
  hideLabModePreview();
}

function renderError(error) {
  currentAnalysis = null;
  currentLabPlan = null;

  setCard(cards.https, elements.httpsStatus, "Error", "danger");
  setCard(cards.login, elements.loginStatus, "Error", "danger");
  setCard(cards.authType, elements.authTypeStatus, "Error", "danger");
  setCard(cards.confidence, elements.confidenceStatus, "Error", "danger");
  setCard(cards.fields, elements.fieldStatus, "Error", "danger");

  renderSummary([
    "The current page could not be analyzed.",
    error.message,
  ]);
  renderHeaderItems(["Security headers could not be analyzed."]);
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

  const shell = document.querySelector(".popup-shell");
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const list = document.createElement("div");

  section.className = "panel findings-panel";
  section.setAttribute("aria-labelledby", "findings-heading");
  heading.id = "findings-heading";
  heading.textContent = "Findings";
  list.className = "findings-list";

  section.append(heading, list);
  if (reportSection) {
    shell.insertBefore(section, reportSection);
  } else {
    shell.append(section);
  }

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
  const jsonButton = document.createElement("button");
  const markdownButton = document.createElement("button");
  const aiPromptButton = document.createElement("button");
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
  aiPromptButton.textContent = "Copy AI Analyst Prompt";
  status.className = "report-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  jsonButton.addEventListener("click", copyCurrentJsonReport);
  markdownButton.addEventListener("click", copyCurrentMarkdownReport);
  aiPromptButton.addEventListener("click", copyCurrentAiAnalystPrompt);

  actions.append(jsonButton, markdownButton, aiPromptButton);
  section.append(heading, actions, status);
  shell.append(section);

  reportSection = section;
  reportStatus = status;
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

    await navigator.clipboard.writeText(reportBuilder.buildAiAnalystPrompt(currentAnalysis));
    setReportStatus("AI analyst prompt copied locally.", "success");
  } catch (error) {
    setReportStatus(`Could not copy AI analyst prompt: ${error.message}`, "error");
  }
}

async function getReportBuilder() {
  if (globalThis.LoginGuardReportBuilder) {
    return globalThis.LoginGuardReportBuilder;
  }

  if (!reportBuilderLoadPromise) {
    reportBuilderLoadPromise = import(chrome.runtime.getURL("src/core/report-builder.js"))
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

function renderLabModePreview(labPlan) {
  if (!labPlan) {
    currentLabPlan = null;
    hideLabModePreview();
    return;
  }

  currentLabPlan = labPlan;
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
  const categoriesBlock = createLabCategoriesBlock(plannedCategories);
  const safetyNote = document.createElement("p");

  safetyNote.className = "lab-safety-note";
  safetyNote.textContent = labPlan.safetyNote || "Lab Mode preview did not execute tests.";

  labSection.dataset.state = labPlan.allowed ? "allowed" : "refused";
  labDetails.replaceChildren(...items, categoriesBlock, safetyNote);
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
  const status = document.createElement("p");

  section.className = "panel lab-panel";
  section.setAttribute("aria-labelledby", "lab-heading");
  heading.id = "lab-heading";
  heading.textContent = "Lab Mode Preview";
  details.className = "lab-details";
  actions.className = "lab-report-actions";
  jsonButton.type = "button";
  jsonButton.className = "report-button";
  jsonButton.textContent = "Copy Lab JSON Report";
  markdownButton.type = "button";
  markdownButton.className = "report-button";
  markdownButton.textContent = "Copy Lab Markdown Report";
  status.className = "lab-report-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  jsonButton.addEventListener("click", copyCurrentLabJsonReport);
  markdownButton.addEventListener("click", copyCurrentLabMarkdownReport);

  actions.append(jsonButton, markdownButton);
  section.append(heading, details, actions, status);
  shell.append(section);

  labSection = section;
  labDetails = details;
  labReportStatus = status;
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
    const reportJson = JSON.stringify(labReport.buildLabJsonReport(currentLabPlan), null, 2);
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

    await navigator.clipboard.writeText(labReport.buildLabMarkdownReport(currentLabPlan));
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
    labReportLoadPromise = import(chrome.runtime.getURL("src/lab/lab-report.js"))
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
  const block = document.createElement("div");
  const label = document.createElement("p");
  const list = document.createElement("ul");
  const categoryItems = categories.length > 0 ? categories : ["No planned categories for this page."];

  block.className = "lab-categories";
  label.className = "lab-categories-label";
  label.textContent = "Planned categories";
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

function hideLabModePreview() {
  if (!labSection) {
    return;
  }

  labSection.remove();
  labSection = null;
  labDetails = null;
  labReportStatus = null;
  currentLabPlan = null;
}

function getConfidenceState(confidenceScore) {
  if (confidenceScore >= 65) {
    return "safe";
  }

  if (confidenceScore >= 50) {
    return "warning";
  }

  return "warning";
}

function isInspectableUrl(url) {
  return /^https?:\/\//i.test(url || "");
}
