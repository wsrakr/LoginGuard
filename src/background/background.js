// Background service worker for lifecycle events and passive response-header capture.
importScripts("../platform/browser-api.js");

const browserApi = globalThis.LoginGuardBrowserApi;
const extensionApi = globalThis.browser || globalThis.chrome || null;
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

browserApi?.getRuntime()?.onInstalled?.addListener(({ reason }) => {
  if (reason === "install") {
    console.info("LoginGuard installed. Analysis runs only from the popup on the active tab.");
  }
});

extensionApi?.webRequest?.onHeadersReceived?.addListener(
  captureSecurityHeaders,
  {
    urls: ["http://*/*", "https://*/*"],
    types: ["main_frame"],
  },
  ["responseHeaders"],
);

browserApi?.getRuntime()?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message?.type !== GET_SECURITY_HEADERS_MESSAGE) {
    return false;
  }

  browserApi.storageGet("session", getHeaderStorageKey(message.tabId))
    .then((items) => {
      const snapshot = items?.[getHeaderStorageKey(message.tabId)] || null;

      sendResponse({
        ok: true,
        snapshot: isSnapshotForUrl(snapshot, message.url) ? snapshot : null,
      });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error.message || "Security header storage is not available.",
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

  browserApi.storageSet("session", {
    [getHeaderStorageKey(details.tabId)]: snapshot,
  }).catch(() => {
    // Header capture is best-effort; popup analysis can continue without a snapshot.
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
