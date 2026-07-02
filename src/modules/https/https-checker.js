// HTTPS checker module inspects only the current page URL protocol.
(() => {
  const MODULE_ID = "https-checker";

  function check(location) {
    const url = getLocationValue(location, "href");
    const origin = getLocationValue(location, "origin");
    const protocolValue = getLocationValue(location, "protocol");
    const hostname = getHostname(location, url);
    const localContextReason = getLocalContextReason(hostname);

    return {
      id: MODULE_ID,
      url,
      origin,
      protocol: protocolValue.replace(":", ""),
      usesHttps: protocolValue === "https:",
      isLocalContext: Boolean(localContextReason),
      localContextReason,
    };
  }

  function getLocationValue(location, key) {
    return typeof location?.[key] === "string" ? location[key] : "";
  }

  function getHostname(location, url) {
    const locationHostname = getLocationValue(location, "hostname");

    if (locationHostname) {
      return locationHostname;
    }

    try {
      return url ? new URL(url).hostname : "";
    } catch (_error) {
      return "";
    }
  }

  function getLocalContextReason(hostname) {
    const normalizedHostname = normalizeHostname(hostname);

    if (normalizedHostname === "localhost") {
      return "Host is localhost.";
    }

    if (normalizedHostname === "127.0.0.1") {
      return "Host is IPv4 loopback.";
    }

    if (normalizedHostname === "::1") {
      return "Host is IPv6 loopback.";
    }

    if (normalizedHostname.endsWith(".localhost")) {
      return "Host uses the .localhost development suffix.";
    }

    return null;
  }

  function normalizeHostname(hostname) {
    return String(hostname || "")
      .trim()
      .toLowerCase()
      .replace(/^\[(.*)\]$/, "$1")
      .replace(/\.$/, "");
  }

  globalThis.LoginGuardModules = globalThis.LoginGuardModules || {};
  globalThis.LoginGuardModules.https = {
    check,
  };
})();
