// Scanner orchestrates read-only modules against the current document and URL.
(() => {
  function scan(rootDocument) {
    const modules = globalThis.LoginGuardModules || {};
    const httpsResult = modules.https.check(rootDocument.location);
    const loginResult = modules.login.detect(rootDocument);
    const risk = globalThis.LoginGuardRiskEngine.summarize({
      https: httpsResult,
      login: loginResult,
    });

    return {
      url: httpsResult.url,
      origin: httpsResult.origin,
      security: {
        usesHttps: httpsResult.usesHttps,
        protocol: httpsResult.protocol,
      },
      hasLoginForm: loginResult.loginDetected,
      loginDetected: loginResult.loginDetected,
      authenticationDetected: loginResult.authenticationDetected,
      authenticationType: loginResult.type,
      confidence: loginResult.confidence,
      confidenceScore: loginResult.confidenceScore,
      reasons: loginResult.reasons,
      fields: loginResult.fields,
      forms: loginResult.forms,
      modules: {
        https: httpsResult,
        login: loginResult,
      },
      risk,
    };
  }

  globalThis.LoginGuardScanner = {
    scan,
  };
})();
