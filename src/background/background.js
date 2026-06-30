// Background service worker for lifecycle events and passive response-header capture.
const SECURITY_HEADER_NAMES = [
  "content-security-policy",
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
];

const GET_SECURITY_HEADERS_MESSAGE = "LOGIN_GUARD_GET_SECURITY_HEADERS";

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    console.info("LoginGuard installed. Analysis runs only from the popup on the active tab.");
  }
});

chrome.webRequest.onHeadersReceived.addListener(
  captureSecurityHeaders,
  {
    urls: ["http://*/*", "https://*/*"],
    types: ["main_frame"],
  },
  ["responseHeaders"],
);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== GET_SECURITY_HEADERS_MESSAGE) {
    return false;
  }

  chrome.storage.session.get(getHeaderStorageKey(message.tabId), (items) => {
    const snapshot = items[getHeaderStorageKey(message.tabId)] || null;

    sendResponse({
      ok: true,
      snapshot: isSnapshotForUrl(snapshot, message.url) ? snapshot : null,
    });
  });

  return true;
});

function captureSecurityHeaders(details) {
  if (details.tabId < 0) {
    return;
  }

  const headers = extractSecurityHeaders(details.responseHeaders || []);
  const snapshot = {
    url: details.url,
    capturedAt: Date.now(),
    headers,
  };

  chrome.storage.session.set({
    [getHeaderStorageKey(details.tabId)]: snapshot,
  });
}

function extractSecurityHeaders(responseHeaders) {
  return responseHeaders.reduce((headers, header) => {
    const name = header.name.toLowerCase();

    if (SECURITY_HEADER_NAMES.includes(name)) {
      headers[name] = header.value || "";
    }

    return headers;
  }, {});
}

function getHeaderStorageKey(tabId) {
  return `securityHeaders:${tabId}`;
}

function isSnapshotForUrl(snapshot, url) {
  if (!snapshot || !url) {
    return false;
  }

  return snapshot.url === url;
}
