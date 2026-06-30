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
}

function renderUnsupportedPage(url) {
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
}

function renderError(error) {
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
