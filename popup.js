const MESSAGE_TYPE = "LOGIN_GUARD_ANALYZE";
const INJECTION_FILES = ["utils/dom-utils.js", "content.js"];

const elements = {
  currentUrl: document.querySelector("#current-url"),
  httpsStatus: document.querySelector("#https-status"),
  loginStatus: document.querySelector("#login-status"),
  fieldStatus: document.querySelector("#field-status"),
  summaryList: document.querySelector("#security-summary"),
};

const cards = {
  https: elements.httpsStatus.closest(".status-card"),
  login: elements.loginStatus.closest(".status-card"),
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
  const fieldCounts = analysis.fields.counts;
  const totalTrackedFields = fieldCounts.username + fieldCounts.email + fieldCounts.password;

  elements.currentUrl.textContent = analysis.url;

  setCard(cards.https, elements.httpsStatus, analysis.security.usesHttps ? "HTTPS" : "Not HTTPS", analysis.security.usesHttps ? "safe" : "danger");
  setCard(cards.login, elements.loginStatus, analysis.hasLoginForm ? "Detected" : "Not found", analysis.hasLoginForm ? "safe" : "warning");
  setCard(cards.fields, elements.fieldStatus, `${totalTrackedFields} found`, totalTrackedFields > 0 ? "safe" : "warning");

  renderSummary([
    analysis.security.usesHttps
      ? "The page is loaded over HTTPS."
      : "The page is not using HTTPS. Credentials entered here may be exposed in transit.",
    analysis.hasLoginForm
      ? `Login indicators were found in ${analysis.forms.length} form area${analysis.forms.length === 1 ? "" : "s"}.`
      : "No clear login form was detected on the current page.",
    `Detected fields: ${fieldCounts.username} username, ${fieldCounts.email} email, ${fieldCounts.password} password.`,
    "No forms were submitted and no data left this page.",
  ]);
}

function renderUnsupportedPage(url) {
  setCard(cards.https, elements.httpsStatus, "N/A", "warning");
  setCard(cards.login, elements.loginStatus, "Unavailable", "warning");
  setCard(cards.fields, elements.fieldStatus, "Unavailable", "warning");

  renderSummary([
    "LoginGuard can inspect regular HTTP and HTTPS web pages.",
    `This page cannot be analyzed from the popup: ${url || "unknown URL"}.`,
  ]);
}

function renderError(error) {
  setCard(cards.https, elements.httpsStatus, "Error", "danger");
  setCard(cards.login, elements.loginStatus, "Error", "danger");
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

function isInspectableUrl(url) {
  return /^https?:\/\//i.test(url || "");
}
