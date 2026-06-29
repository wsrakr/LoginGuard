// HTTPS checker module inspects only the current page URL protocol.
(() => {
  const MODULE_ID = "https-checker";

  function check(location) {
    return {
      id: MODULE_ID,
      url: location.href,
      origin: location.origin,
      protocol: location.protocol.replace(":", ""),
      usesHttps: location.protocol === "https:",
    };
  }

  globalThis.LoginGuardModules = globalThis.LoginGuardModules || {};
  globalThis.LoginGuardModules.https = {
    check,
  };
})();
