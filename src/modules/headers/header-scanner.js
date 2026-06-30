// Security Headers Scanner: passive analysis of captured headers and DOM-visible meta signals.
(() => {
  const MODULE_ID = "header-scanner";
  const HEADER_DEFINITIONS = Object.freeze([
    {
      key: "content-security-policy",
      name: "Content-Security-Policy",
      recommendation: "Add a Content-Security-Policy header to reduce script injection and content loading risk.",
      metaSelectors: ["meta[http-equiv='Content-Security-Policy' i]"],
    },
    {
      key: "strict-transport-security",
      name: "Strict-Transport-Security",
      recommendation: "Add Strict-Transport-Security on HTTPS responses to require future HTTPS connections.",
      metaSelectors: [],
    },
    {
      key: "x-frame-options",
      name: "X-Frame-Options",
      recommendation: "Add X-Frame-Options or an equivalent CSP frame-ancestors directive to reduce clickjacking risk.",
      metaSelectors: [],
    },
    {
      key: "x-content-type-options",
      name: "X-Content-Type-Options",
      recommendation: "Add X-Content-Type-Options: nosniff to reduce MIME sniffing risk.",
      metaSelectors: [],
    },
    {
      key: "referrer-policy",
      name: "Referrer-Policy",
      recommendation: "Add a Referrer-Policy header to control how much URL information is shared as referrer data.",
      metaSelectors: ["meta[name='referrer' i]", "meta[http-equiv='Referrer-Policy' i]"],
    },
    {
      key: "permissions-policy",
      name: "Permissions-Policy",
      recommendation: "Add a Permissions-Policy header to limit access to powerful browser features.",
      metaSelectors: [],
    },
    {
      key: "cross-origin-opener-policy",
      name: "Cross-Origin-Opener-Policy",
      recommendation: "Add Cross-Origin-Opener-Policy to isolate browsing contexts where appropriate.",
      metaSelectors: [],
    },
    {
      key: "cross-origin-embedder-policy",
      name: "Cross-Origin-Embedder-Policy",
      recommendation: "Add Cross-Origin-Embedder-Policy when cross-origin isolation is required.",
      metaSelectors: [],
    },
    {
      key: "cross-origin-resource-policy",
      name: "Cross-Origin-Resource-Policy",
      recommendation: "Add Cross-Origin-Resource-Policy to control which origins may load this resource.",
      metaSelectors: [],
    },
  ]);

  function scan(rootDocument, context = {}) {
    const responseHeaders = normalizeHeaders(context.responseHeaders?.headers || {});
    const responseHeadersAvailable = Boolean(context.responseHeaders);
    const headers = HEADER_DEFINITIONS.map((definition) => inspectHeader(rootDocument, definition, responseHeaders));
    const recommendations = headers
      .filter((header) => header.status === "Missing")
      .map((header) => header.recommendation);

    return {
      id: MODULE_ID,
      responseHeadersAvailable,
      capturedUrl: context.responseHeaders?.url || null,
      presentCount: headers.filter((header) => header.status === "Present").length,
      missingCount: headers.filter((header) => header.status === "Missing").length,
      headers,
      recommendations,
    };
  }

  function inspectHeader(rootDocument, definition, responseHeaders) {
    if (Object.prototype.hasOwnProperty.call(responseHeaders, definition.key)) {
      return buildHeaderResult(definition, "Present", "response-header", responseHeaders[definition.key]);
    }

    const metaValue = findMetaValue(rootDocument, definition.metaSelectors);

    if (metaValue !== null) {
      return buildHeaderResult(definition, "Present", "meta", metaValue);
    }

    return buildHeaderResult(definition, "Missing", "not-observed", null);
  }

  function buildHeaderResult(definition, status, source, value) {
    return {
      name: definition.name,
      status,
      source,
      value,
      recommendation: status === "Missing" ? definition.recommendation : null,
    };
  }

  function normalizeHeaders(headers) {
    return Object.entries(headers).reduce((normalized, [name, value]) => {
      normalized[name.toLowerCase()] = value;
      return normalized;
    }, {});
  }

  function findMetaValue(rootDocument, selectors) {
    for (const selector of selectors) {
      const element = rootDocument.querySelector(selector);

      if (element) {
        return element.getAttribute("content") || "";
      }
    }

    return null;
  }

  globalThis.LoginGuardModules = globalThis.LoginGuardModules || {};
  globalThis.LoginGuardModules.headers = {
    scan,
  };
})();
