// Lab Mode context detector for local and explicitly safe training targets.
(() => {
  const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

  function isAllowedLabUrl(urlOrLocation) {
    const parsedUrl = parseUrl(urlOrLocation);

    if (!parsedUrl) {
      return createResult({
        allowed: false,
        reason: "URL is missing or malformed.",
      });
    }

    if (!SUPPORTED_PROTOCOLS.has(parsedUrl.protocol)) {
      return createResult({
        allowed: false,
        reason: `Unsupported protocol for Lab Mode: ${parsedUrl.protocol || "unknown"}.`,
        parsedUrl,
      });
    }

    const host = normalizeHost(parsedUrl.hostname);

    if (isLocalLabHost(host)) {
      return createResult({
        allowed: true,
        reason: "URL is allowed for Lab Mode because it uses a local lab host.",
        parsedUrl,
        host,
      });
    }

    return createResult({
      allowed: false,
      reason: "URL is not an allowed local Lab Mode target.",
      parsedUrl,
      host,
    });
  }

  function parseUrl(urlOrLocation) {
    if (!urlOrLocation) {
      return null;
    }

    try {
      if (urlOrLocation instanceof URL) {
        return urlOrLocation;
      }

      if (typeof urlOrLocation === "string") {
        return new URL(urlOrLocation);
      }

      if (typeof urlOrLocation.href === "string") {
        return new URL(urlOrLocation.href);
      }
    } catch {
      return null;
    }

    return null;
  }

  function normalizeHost(hostname) {
    return String(hostname || "")
      .replace(/^\[|\]$/g, "")
      .toLowerCase();
  }

  function isLocalLabHost(host) {
    return host === "localhost"
      || host === "127.0.0.1"
      || host === "::1"
      || host.endsWith(".localhost");
  }

  function createResult({ allowed, reason, parsedUrl = null, host = null }) {
    return {
      allowed: Boolean(allowed),
      reason: String(reason),
      normalizedUrl: parsedUrl ? parsedUrl.href : null,
      host,
      protocol: parsedUrl ? parsedUrl.protocol : null,
    };
  }

  globalThis.LoginGuardLabContext = {
    isAllowedLabUrl,
  };
})();
