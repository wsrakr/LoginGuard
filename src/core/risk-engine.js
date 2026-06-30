// Risk engine turns module results into a simple defensive summary.
(() => {
  function summarize(results) {
    const summary = [
      getHttpsSummary(results.https),
      getAuthSummary(results.auth, results.login),
      getFieldSummary(results.login.fields.counts),
    ];

    return {
      level: getOverallLevel(results),
      summary,
    };
  }

  function getHttpsSummary(httpsResult) {
    return httpsResult.usesHttps
      ? "The page is loaded over HTTPS."
      : "The page is not using HTTPS. Credentials entered here may be exposed in transit.";
  }

  function getAuthSummary(authResult, loginResult) {
    return authResult.type !== "Unknown" || loginResult.authenticationDetected
      ? `Authentication Type: ${authResult.type}. Classification Confidence: ${authResult.confidence} (${authResult.score}%).`
      : "No clear authentication page was detected on the current page.";
  }

  function getFieldSummary(fieldCounts) {
    return `Detected fields: ${fieldCounts.password} password and ${fieldCounts.username + fieldCounts.email} username/email.`;
  }

  function getOverallLevel(results) {
    const authenticationDetected = results.auth.type !== "Unknown" || results.login.authenticationDetected;

    if (!results.https.usesHttps && authenticationDetected) {
      return "high";
    }

    if (!results.https.usesHttps || authenticationDetected) {
      return "medium";
    }

    return "low";
  }

  globalThis.LoginGuardRiskEngine = {
    summarize,
  };
})();
