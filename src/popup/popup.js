// Popup controller that requests active-tab analysis and renders the result.
const MESSAGE_TYPE = "LOGIN_GUARD_ANALYZE";
const GET_SECURITY_HEADERS_MESSAGE = "LOGIN_GUARD_GET_SECURITY_HEADERS";
const INJECTION_FILES = [
  "src/utils/dom-utils.js",
  "src/modules/https/https-checker.js",
  "src/modules/auth/auth-classifier.js",
  "src/modules/login/login-detector.js",
  "src/modules/headers/header-scanner.js",
  "src/core/risk-engine.js",
  "src/core/scanner.js",
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
let currentAnalysis = null;

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
  renderAnalysis(analysis);
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

function renderAnalysis(analysis) {
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
}

function renderUnsupportedPage(url) {
  currentAnalysis = null;

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
}

function renderError(error) {
  currentAnalysis = null;

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
  const button = document.createElement("button");
  const status = document.createElement("p");

  section.className = "panel report-panel";
  section.setAttribute("aria-labelledby", "report-heading");
  heading.id = "report-heading";
  heading.textContent = "Report";
  button.type = "button";
  button.className = "report-button";
  button.textContent = "Copy JSON Report";
  status.className = "report-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  button.addEventListener("click", copyCurrentJsonReport);

  section.append(heading, button, status);
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

    const reportJson = JSON.stringify(buildJsonReport(currentAnalysis), null, 2);
    JSON.parse(reportJson);

    await navigator.clipboard.writeText(reportJson);
    setReportStatus("JSON report copied locally.", "success");
  } catch (error) {
    setReportStatus(`Could not copy JSON report: ${error.message}`, "error");
  }
}

function buildJsonReport(analysis) {
  const modules = analysis.modules || {};
  const login = modules.login || {};
  const auth = modules.auth || {};
  const security = analysis.security || {};
  const https = analysis.https || modules.https || {};
  const risk = analysis.risk || null;
  const usernameFields = toFiniteNumber(login.usernameFields);
  const emailFields = toFiniteNumber(login.emailFields);
  const passwordFields = toFiniteNumber(login.passwordFields);

  return {
    project: "LoginGuard",
    generatedAt: new Date().toISOString(),
    url: String(analysis.url || ""),
    origin: getReportOrigin(analysis),
    securitySummary: {
      usesHttps: Boolean(security.usesHttps),
      protocol: String(security.protocol || ""),
      isLocalContext: Boolean(https.isLocalContext),
      localContextReason: https.localContextReason || null,
    },
    authentication: {
      type: String(auth.type || analysis.authenticationType || "Unknown"),
      confidence: String(auth.confidence || analysis.confidence || "Unknown"),
      confidenceScore: toFiniteNumber(auth.score ?? analysis.confidenceScore),
    },
    fieldCounts: {
      password: passwordFields,
      username: usernameFields,
      email: emailFields,
      usernameOrEmail: usernameFields + emailFields,
    },
    findings: sanitizeFindings(analysis.findings),
    risk: risk ? {
      level: String(risk.level || "unknown"),
      summary: sanitizeStringArray(risk.summary),
    } : null,
    safetyNote: "LoginGuard performs passive local analysis. No forms were submitted and no credentials were collected.",
  };
}

function getReportOrigin(analysis) {
  if (analysis.origin) {
    return String(analysis.origin);
  }

  try {
    return new URL(analysis.url).origin;
  } catch {
    return "";
  }
}

function sanitizeFindings(findings) {
  if (!Array.isArray(findings)) {
    return [];
  }

  return findings.map((finding) => ({
    id: String(finding?.id || ""),
    source: String(finding?.source || ""),
    category: String(finding?.category || ""),
    status: String(finding?.status || "unknown"),
    severity: String(finding?.severity || "info"),
    confidence: toFiniteNumber(finding?.confidence),
    title: String(finding?.title || ""),
    summary: String(finding?.summary || ""),
    evidence: sanitizeStringArray(finding?.evidence),
    recommendation: String(finding?.recommendation || ""),
  }));
}

function sanitizeStringArray(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => String(item));
}

function toFiniteNumber(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
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

function hideReportControls() {
  if (!reportSection) {
    return;
  }

  reportSection.remove();
  reportSection = null;
  reportStatus = null;
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
