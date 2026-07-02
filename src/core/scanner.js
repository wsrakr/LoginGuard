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

    return [];
  }

  globalThis.LoginGuardScanner = {
    scan,
  };
})();
