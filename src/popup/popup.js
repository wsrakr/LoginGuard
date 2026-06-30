// Popup controller that requests active-tab analysis and renders the result.
const MESSAGE_TYPE = "LOGIN_GUARD_ANALYZE";
const INJECTION_FILES = [
  "src/utils/dom-utils.js",
  "src/modules/https/https-checker.js",
  "src/modules/auth/auth-classifier.js",
  "src/modules/login/login-detector.js",
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

  const analysis = await sendAnalyzeMessage(tab.id);
  renderAnalysis(analysis);
}

function sendAnalyzeMessage(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: MESSAGE_TYPE }, (response) => {
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
