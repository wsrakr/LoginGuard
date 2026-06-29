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
    return loginResult.hasLoginForm
      ? `Login indicators were found in ${loginResult.forms.length} form area${loginResult.forms.length === 1 ? "" : "s"}.`
      : "No clear login form was detected on the current page.";
  }

  function getFieldSummary(fieldCounts) {
    return `Detected fields: ${fieldCounts.username} username, ${fieldCounts.email} email, ${fieldCounts.password} password.`;
  }

  function getOverallLevel(results) {
    if (!results.https.usesHttps && results.login.hasLoginForm) {
      return "high";
    }

    if (!results.https.usesHttps || results.login.hasLoginForm) {
      return "medium";
    }

    return "low";
  }

  globalThis.LoginGuardRiskEngine = {
    summarize,
  };
})();
