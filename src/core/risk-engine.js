// Risk engine turns module results into a simple defensive summary.
(() => {
  function summarize(results) {
    const summary = [
      getHttpsSummary(results.https),
      getLoginSummary(results.login),
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

  function getLoginSummary(loginResult) {
    return loginResult.authenticationDetected
      ? `Authentication Page: Yes. Type: ${loginResult.type}. Confidence: ${loginResult.confidenceScore}%.`
      : "No clear authentication page was detected on the current page.";
  }

  function getFieldSummary(fieldCounts) {
    return `Detected fields: ${fieldCounts.password} password and ${fieldCounts.username + fieldCounts.email} username/email.`;
  }

  function getOverallLevel(results) {
    if (!results.https.usesHttps && results.login.authenticationDetected) {
      return "high";
    }

    if (!results.https.usesHttps || results.login.authenticationDetected) {
      return "medium";
    }

    return "low";
  }

  globalThis.LoginGuardRiskEngine = {
    summarize,
  };
})();
