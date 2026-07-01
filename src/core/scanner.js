// Scanner orchestrates read-only modules against the current document and URL.
(() => {
  function scan(rootDocument, scanContext = {}) {
    const modules = globalThis.LoginGuardModules || {};
    const httpsResult = modules.https.check(rootDocument.location);
    const authResult = modules.auth.classify(rootDocument);
    const loginResult = modules.login.detect(rootDocument);
    const headersResult = modules.headers.scan(rootDocument, {
      responseHeaders: scanContext.responseHeaders,
    });
    const moduleResults = {
      https: httpsResult,
      auth: authResult,
      login: loginResult,
      headers: headersResult,
    };
    const normalizedFindings = normalizeScanResults(moduleResults);

    moduleResults.findings = normalizedFindings;

    const risk = globalThis.LoginGuardRiskEngine.summarize(moduleResults);

    return {
      url: httpsResult.url,
      origin: httpsResult.origin,
      https: httpsResult,
      auth: authResult,
      login: loginResult,
      headers: headersResult,
      findings: normalizedFindings,
      security: {
        usesHttps: httpsResult.usesHttps,
        protocol: httpsResult.protocol,
      },
      hasLoginForm: loginResult.loginDetected,
      loginDetected: loginResult.loginDetected,
      authenticationDetected: authResult.type !== "Unknown" || loginResult.authenticationDetected,
      authenticationType: authResult.type,
      confidence: authResult.confidence,
      confidenceScore: authResult.score,
      reasons: authResult.reasons,
      fields: loginResult.fields,
      forms: loginResult.forms,
      modules: {
        auth: authResult,
        headers: headersResult,
        https: httpsResult,
        login: loginResult,
      },
      risk,
    };
  }

  function normalizeScanResults(results) {
    const normalizers = globalThis.LoginGuardNormalizers;

    if (normalizers?.normalizeScanResults) {
      return normalizers.normalizeScanResults(results);
    }

    return createFallbackFindings(results);
  }

  function createFallbackFindings(results) {
    if (!results) {
      return [];
    }

    return [
      ...normalizeHttpsFallback(results.https),
      ...normalizeAuthFallback(results.auth),
      ...normalizeLoginFallback(results.login),
      ...normalizeHeadersFallback(results.headers),
    ];
  }

  function normalizeHttpsFallback(result) {
    if (!result) {
      return [];
    }

    return [createFinding({
      id: "https.protocol",
      source: result.id || "https-checker",
      category: "transport",
      status: result.usesHttps ? "pass" : "fail",
      severity: result.usesHttps ? "info" : "high",
      confidence: 100,
      title: result.usesHttps ? "HTTPS is used" : "HTTPS is not used",
      summary: result.usesHttps ? "The current page is loaded over HTTPS." : "The current page is not loaded over HTTPS.",
      evidence: [`Protocol: ${result.protocol || "unknown"}`],
      recommendation: result.usesHttps ? "Continue serving authentication pages over HTTPS." : "Serve authentication pages over HTTPS before users enter credentials.",
    })];
  }

  function normalizeAuthFallback(result) {
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
      summary: knownType ? `The page was classified as ${result.type}.` : "The page did not match a specific authentication type with strong confidence.",
      evidence: normalizeEvidence(result.reasons),
      recommendation: knownType ? "Review the detected authentication flow and confirm expected security controls are present." : "Review the page manually if it is expected to be part of an authentication flow.",
    })];
  }

  function normalizeLoginFallback(result) {
    if (!result) {
      return [];
    }

    const detected = Boolean(result.authenticationDetected || result.loginDetected);
    const fieldCounts = result.fields?.counts || {};

    return [createFinding({
      id: "login.surface",
      source: result.id || "login-detector",
      category: "authentication",
      status: detected ? "info" : "unknown",
      severity: "info",
      confidence: toConfidenceNumber(result.confidenceScore),
      title: detected ? "Authentication surface detected" : "Authentication surface not clearly detected",
      summary: detected ? "LoginGuard detected fields or controls commonly used in authentication flows." : "LoginGuard did not detect a clear authentication form or area.",
      evidence: [
        `Password fields: ${numberOrZero(result.passwordFields ?? fieldCounts.password)}`,
        `Username fields: ${numberOrZero(result.usernameFields ?? fieldCounts.username)}`,
        `Email fields: ${numberOrZero(result.emailFields ?? fieldCounts.email)}`,
        `Submit buttons: ${numberOrZero(result.submitButtons)}`,
        ...normalizeEvidence(result.reasons),
      ],
      recommendation: detected ? "Review detected fields, labels, submit controls, and surrounding page context." : "No action is required unless this page is expected to contain an authentication flow.",
    })];
  }

  function normalizeHeadersFallback(result) {
    if (!result) {
      return [];
    }

    return (result.headers || []).map((header) => {
      const present = header.status === "Present";

      return createFinding({
        id: `headers.${slugify(header.name)}`,
        source: result.id || "header-scanner",
        category: "headers",
        status: present ? "pass" : "warning",
        severity: present ? "info" : "medium",
        confidence: result.responseHeadersAvailable || header.source === "meta" ? 100 : 60,
        title: `${header.name}: ${present ? "Present" : "Missing"}`,
        summary: present ? `${header.name} was observed from ${header.source}.` : `${header.name} was not observed for this page load.`,
        evidence: present ? [`Source: ${header.source}`] : [],
        recommendation: header.recommendation || "No recommendation.",
      });
    });
  }

  function createFinding(finding) {
    return {
      id: String(finding.id || "unknown.finding"),
      source: String(finding.source || "unknown"),
      category: String(finding.category || "general"),
      status: ["pass", "warning", "fail", "info", "unknown"].includes(finding.status) ? finding.status : "unknown",
      severity: ["info", "low", "medium", "high"].includes(finding.severity) ? finding.severity : "info",
      confidence: toConfidenceNumber(finding.confidence),
      title: String(finding.title || "Untitled finding"),
      summary: String(finding.summary || ""),
      evidence: normalizeEvidence(finding.evidence),
      recommendation: String(finding.recommendation || ""),
    };
  }

  function normalizeEvidence(evidence) {
    return Array.isArray(evidence) ? evidence.filter(Boolean).map((item) => String(item)) : [];
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

  globalThis.LoginGuardScanner = {
    scan,
  };
})();
