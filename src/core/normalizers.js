// Normalizes module-specific outputs into shared finding objects.
(() => {
  const DEFAULT_CONFIDENCE = 100;

  function normalizeHttpsResult(result) {
    if (!result) {
      return [];
    }

    const usesHttps = Boolean(result.usesHttps);
    const isLocalHttp = !usesHttps && Boolean(result.isLocalContext);

    return [createFinding({
      id: "https.protocol",
      source: result.id || "https-checker",
      category: "transport",
      status: getHttpsStatus(usesHttps, isLocalHttp),
      severity: getHttpsSeverity(usesHttps, isLocalHttp),
      confidence: DEFAULT_CONFIDENCE,
      title: getHttpsTitle(usesHttps, isLocalHttp),
      summary: getHttpsSummary(result, usesHttps, isLocalHttp),
      evidence: getHttpsEvidence(result),
      recommendation: getHttpsRecommendation(usesHttps, isLocalHttp),
    })];
  }

  function getHttpsStatus(usesHttps, isLocalHttp) {
    if (usesHttps) {
      return "pass";
    }

    return isLocalHttp ? "info" : "fail";
  }

  function getHttpsSeverity(usesHttps, isLocalHttp) {
    if (usesHttps) {
      return "info";
    }

    return isLocalHttp ? "low" : "high";
  }

  function getHttpsTitle(usesHttps, isLocalHttp) {
    if (usesHttps) {
      return "HTTPS is used";
    }

    return isLocalHttp ? "Local HTTP development context" : "HTTPS is not used";
  }

  function getHttpsSummary(result, usesHttps, isLocalHttp) {
    if (usesHttps) {
      return "The current page is loaded over HTTPS.";
    }

    if (isLocalHttp) {
      return "The current page is using HTTP in a local development context.";
    }

    return "The current page is not loaded over HTTPS.";
  }

  function getHttpsEvidence(result) {
    return [
      `Protocol: ${result.protocol || "unknown"}`,
      result.isLocalContext ? `Local context: ${result.localContextReason || "Detected local development host."}` : null,
    ].filter(Boolean);
  }

  function getHttpsRecommendation(usesHttps, isLocalHttp) {
    if (usesHttps) {
      return "Continue serving authentication pages over HTTPS.";
    }

    if (isLocalHttp) {
      return "Use HTTPS for deployed authentication pages; HTTP on localhost is acceptable for local fixture testing.";
    }

    return "Serve authentication pages over HTTPS before users enter credentials.";
  }

  function normalizeAuthResult(result) {
    if (!result) {
      return [];
    }

    const knownType = result.type && result.type !== "Unknown";

    return [createFinding({
      id: "auth.classification",
      source: result.id || "auth-classifier",
      category: "authentication",
      status: knownType ? "info" : "unknown",
      severity: "info",
      confidence: toConfidenceNumber(result.score),
      title: knownType ? `${result.type} page detected` : "Authentication type unknown",
      summary: knownType
        ? `The page was classified as ${result.type}.`
        : "The page did not match a specific authentication type with strong confidence.",
      evidence: normalizeEvidence(result.reasons),
      recommendation: knownType
        ? "Review the detected authentication flow and confirm expected security controls are present."
        : "Review the page manually if it is expected to be part of an authentication flow.",
    })];
  }

  function normalizeLoginResult(result) {
    if (!result) {
      return [];
    }

    const detected = Boolean(result.authenticationDetected || result.loginDetected);
    const fieldCounts = result.fields?.counts || {};
    const evidence = [
      `Password fields: ${numberOrZero(result.passwordFields ?? fieldCounts.password)}`,
      `Username fields: ${numberOrZero(result.usernameFields ?? fieldCounts.username)}`,
      `Email fields: ${numberOrZero(result.emailFields ?? fieldCounts.email)}`,
      `Submit buttons: ${numberOrZero(result.submitButtons)}`,
      ...normalizeEvidence(result.reasons),
    ];

    return [createFinding({
      id: "login.surface",
      source: result.id || "login-detector",
      category: "authentication",
      status: detected ? "info" : "unknown",
      severity: "info",
      confidence: toConfidenceNumber(result.confidenceScore),
      title: detected ? "Authentication surface detected" : "Authentication surface not clearly detected",
      summary: detected
        ? "LoginGuard detected fields or controls commonly used in authentication flows."
        : "LoginGuard did not detect a clear authentication form or area.",
      evidence,
      recommendation: detected
        ? "Review detected fields, labels, submit controls, and surrounding page context."
        : "No action is required unless this page is expected to contain an authentication flow.",
    })];
  }

  function normalizeHeadersResult(result, options = {}) {
    if (!result) {
      return [];
    }

    const isLocalContext = Boolean(options.isLocalContext);

    return (result.headers || []).map((header) => {
      const present = header.status === "Present";
      const missingLocalHeader = !present && isLocalContext;

      return createFinding({
        id: `headers.${slugify(header.name)}`,
        source: result.id || "header-scanner",
        category: "headers",
        status: present ? "pass" : "warning",
        severity: getHeaderSeverity(present, missingLocalHeader),
        confidence: result.responseHeadersAvailable || header.source === "meta" ? 100 : 60,
        title: `${header.name}: ${present ? "Present" : "Missing"}`,
        summary: getHeaderSummary(header, present, missingLocalHeader),
        evidence: present ? [`Source: ${header.source}`] : [],
        recommendation: getHeaderRecommendation(header, present, missingLocalHeader),
      });
    });
  }

  function getHeaderSeverity(present, missingLocalHeader) {
    if (present) {
      return "info";
    }

    return missingLocalHeader ? "low" : "medium";
  }

  function getHeaderSummary(header, present, missingLocalHeader) {
    if (present) {
      return `${header.name} was observed from ${header.source}.`;
    }

    if (missingLocalHeader) {
      return `${header.name} was not observed for this local development page load. Local development servers often omit production security headers.`;
    }

    return `${header.name} was not observed for this page load.`;
  }

  function getHeaderRecommendation(header, present, missingLocalHeader) {
    if (present) {
      return header.recommendation || "No recommendation.";
    }

    if (missingLocalHeader) {
      return `${header.recommendation || "Review this header before deployment."} Local fixtures may omit this header, but deployed authentication pages should include appropriate production security headers.`;
    }

    return header.recommendation || "No recommendation.";
  }

  function normalizeScanResults(results) {
    if (!results) {
      return [];
    }

    const isLocalContext = Boolean(results.https?.isLocalContext);

    return [
      ...normalizeHttpsResult(results.https),
      ...normalizeAuthResult(results.auth),
      ...normalizeLoginResult(results.login),
      ...normalizeHeadersResult(results.headers, { isLocalContext }),
    ];
  }

  function createFinding(finding) {
    return {
      id: String(finding.id || "unknown.finding"),
      source: String(finding.source || "unknown"),
      category: String(finding.category || "general"),
      status: normalizeStatus(finding.status),
      severity: normalizeSeverity(finding.severity),
      confidence: toConfidenceNumber(finding.confidence),
      title: String(finding.title || "Untitled finding"),
      summary: String(finding.summary || ""),
      evidence: normalizeEvidence(finding.evidence),
      recommendation: String(finding.recommendation || ""),
    };
  }

  function normalizeStatus(status) {
    return ["pass", "warning", "fail", "info", "unknown"].includes(status) ? status : "unknown";
  }

  function normalizeSeverity(severity) {
    return ["info", "low", "medium", "high"].includes(severity) ? severity : "info";
  }

  function normalizeEvidence(evidence) {
    if (!Array.isArray(evidence)) {
      return [];
    }

    return evidence.filter(Boolean).map((item) => String(item));
  }

  function toConfidenceNumber(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(numericValue)));
  }

  function numberOrZero(value) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  function slugify(value) {
    return String(value || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  globalThis.LoginGuardNormalizers = {
    normalizeHttpsResult,
    normalizeAuthResult,
    normalizeLoginResult,
    normalizeHeadersResult,
    normalizeScanResults,
  };
})();
