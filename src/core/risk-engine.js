// Risk engine turns module results into a simple defensive summary.
(() => {
  function summarize(results) {
    const summary = [
      getHttpsSummary(results.https),
      getAuthSummary(results.auth, results.login),
      getFieldSummary(results.login.fields.counts),
      getHeadersSummary(results.headers),
    ];

    return {
      level: getOverallLevel(results),
      summary,
    };
  }

  function getHttpsSummary(httpsResult) {
    if (httpsResult.usesHttps) {
      return "The page is loaded over HTTPS.";
    }

    if (httpsResult.isLocalContext) {
      return "The page is using HTTP in a local development context.";
    }

    return "The page is not using HTTPS. Credentials entered here may be exposed in transit.";
  }

  function getAuthSummary(authResult, loginResult) {
    return authResult.type !== "Unknown" || loginResult.authenticationDetected
      ? `Authentication Type: ${authResult.type}. Classification Confidence: ${authResult.confidence} (${authResult.score}%).`
      : "No clear authentication page was detected on the current page.";
  }

  function getFieldSummary(fieldCounts) {
    return `Detected fields: ${fieldCounts.password} password and ${fieldCounts.username + fieldCounts.email} username/email.`;
  }

  function getHeadersSummary(headersResult) {
    return `Security headers: ${headersResult.presentCount} present, ${headersResult.missingCount} missing.`;
  }

  function getOverallLevel(results) {
    if (Array.isArray(results.findings) && results.findings.length > 0) {
      return getOverallLevelFromFindings(results.findings);
    }

    const authenticationDetected = results.auth.type !== "Unknown" || results.login.authenticationDetected;
    const nonLocalHttp = !results.https.usesHttps && !results.https.isLocalContext;

    if (nonLocalHttp && authenticationDetected) {
      return "high";
    }

    if (nonLocalHttp || authenticationDetected) {
      return "medium";
    }

    return "low";
  }

  function getOverallLevelFromFindings(findings) {
    if (findings.some((finding) => finding.severity === "high" || finding.status === "fail")) {
      return "high";
    }

    if (findings.some((finding) => finding.severity === "medium" || finding.status === "warning")) {
      return "medium";
    }

    return "low";
  }

  globalThis.LoginGuardRiskEngine = {
    summarize,
  };
})();
