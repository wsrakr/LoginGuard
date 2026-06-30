// Scanner orchestrates read-only modules against the current document and URL.
(() => {
  function scan(rootDocument) {
    const modules = globalThis.LoginGuardModules || {};
    const httpsResult = modules.https.check(rootDocument.location);
    const authResult = modules.auth.classify(rootDocument);
    const loginResult = modules.login.detect(rootDocument);
    const risk = globalThis.LoginGuardRiskEngine.summarize({
      https: httpsResult,
      auth: authResult,
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
      authenticationDetected: authResult.type !== "Unknown" || loginResult.authenticationDetected,
      authenticationType: authResult.type,
      confidence: authResult.confidence,
      confidenceScore: authResult.score,
      reasons: authResult.reasons,
      fields: loginResult.fields,
      forms: loginResult.forms,
      modules: {
        auth: authResult,
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
