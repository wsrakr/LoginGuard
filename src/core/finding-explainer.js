// Converts technical LoginGuard findings into plain-language explanations.
(() => {
  const DEFAULT_SAFETY_NOTE = "LoginGuard performed passive local analysis. It did not submit forms, collect credentials, run payloads, or prove the page is fully secure.";

  const HEADER_LABELS = {
    "content-security-policy": "Content Security Policy is missing",
    "strict-transport-security": "Strict Transport Security is missing",
    "x-frame-options": "Clickjacking protection header is missing",
    "x-content-type-options": "Content type protection header is missing",
    "referrer-policy": "Referrer privacy policy is missing",
    "permissions-policy": "Browser feature permissions policy is missing",
    "cross-origin-opener-policy": "Cross-origin opener protection is missing",
    "cross-origin-embedder-policy": "Cross-origin embedder protection is missing",
    "cross-origin-resource-policy": "Cross-origin resource protection is missing",
  };

  function explainFinding(finding, context = {}) {
    const safeFinding = sanitizeFinding(finding);
    const friendlyType = getFriendlyType(safeFinding);

    return {
      id: safeFinding.id,
      title: safeFinding.title,
      plainTitle: friendlyType.plainTitle,
      plainSummary: buildPlainSummary(safeFinding, context, friendlyType),
      whyItMatters: buildWhyItMatters(safeFinding, friendlyType),
      riskLabel: getRiskLabel(safeFinding),
      recommendedAction: buildRecommendedAction(safeFinding, context, friendlyType),
      technicalDetail: buildTechnicalDetail(safeFinding),
    };
  }

  function buildPlainLanguageSummary(report = {}) {
    const authentication = report.authentication || {};
    const securitySummary = report.securitySummary || {};
    const findings = Array.isArray(report.findings) ? report.findings : [];
    const explainedFindings = findings.map((finding) => explainFinding(finding, report));
    const topFinding = findTopFinding(explainedFindings);
    const authType = String(authentication.type || "Unknown");
    const hasAuthPage = authType !== "Unknown" || Boolean(authentication.loginDetected);
    const localContext = Boolean(securitySummary.isLocalContext);
    const riskLevel = String(report.risk?.level || "unknown");

    return {
      mainResult: hasAuthPage
        ? `${authType} authentication surface detected.`
        : "No clear authentication surface was detected.",
      context: localContext
        ? "This appears to be a local development or lab page."
        : "This appears to be a deployed or non-local page.",
      riskLevel,
      topRecommendation: topFinding?.recommendedAction || "Review the findings and apply the highest-priority defensive recommendations first.",
      whatWasFound: buildWhatWasFound(authType, hasAuthPage, findings.length, localContext),
      whyItMatters: buildSummaryWhyItMatters(localContext, topFinding),
      whatToFixFirst: buildWhatToFixFirst(topFinding, riskLevel),
      whatWasNotDone: "LoginGuard did not submit forms, read credentials, run payloads, perform brute force, or prove the page is fully secure.",
      safetyNote: report.safetyNote || DEFAULT_SAFETY_NOTE,
    };
  }

  function sanitizeFinding(finding) {
    return {
      id: String(finding?.id || ""),
      source: String(finding?.source || ""),
      category: String(finding?.category || ""),
      status: String(finding?.status || "unknown"),
      severity: String(finding?.severity || "info"),
      confidence: toFiniteNumber(finding?.confidence),
      title: String(finding?.title || "Untitled finding"),
      summary: String(finding?.summary || ""),
      evidence: Array.isArray(finding?.evidence) ? finding.evidence.map((item) => String(item)) : [],
      recommendation: String(finding?.recommendation || ""),
    };
  }

  function getFriendlyType(finding) {
    const id = finding.id.toLowerCase();
    const source = finding.source.toLowerCase();
    const category = finding.category.toLowerCase();
    const title = finding.title.toLowerCase();
    const headerName = getHeaderName(id, title);

    if (headerName) {
      return {
        type: "headers",
        plainTitle: HEADER_LABELS[headerName] || `${toTitleCase(headerName)} header is missing`,
      };
    }

    if (id === "https.protocol" || category === "transport" || source.includes("https")) {
      return {
        type: "transport",
        plainTitle: "Connection security",
      };
    }

    if (id === "auth.classification" || source.includes("auth")) {
      return {
        type: "authentication",
        plainTitle: "Login page detected",
      };
    }

    if (id === "login.surface" || source.includes("login")) {
      return {
        type: "login-surface",
        plainTitle: "Authentication form detected",
      };
    }

    return {
      type: "other",
      plainTitle: finding.title || "Security finding",
    };
  }

  function getHeaderName(id, title) {
    const combined = `${id} ${title}`;

    return Object.keys(HEADER_LABELS).find((headerName) => combined.includes(headerName)) || "";
  }

  function buildPlainSummary(finding, context, friendlyType) {
    if (friendlyType.type === "transport") {
      return context.securitySummary?.isLocalContext
        ? "The page is using a local development connection. This can be acceptable for fixtures, but production login pages should use HTTPS."
        : finding.summary || "LoginGuard checked whether the current page is using HTTPS.";
    }

    if (friendlyType.type === "headers") {
      return finding.status === "pass"
        ? "LoginGuard found this security header."
        : "LoginGuard did not see this browser security header in the available page signals.";
    }

    if (friendlyType.type === "authentication" || friendlyType.type === "login-surface") {
      return finding.summary || "LoginGuard found signs that this page handles authentication.";
    }

    return finding.summary || "LoginGuard found an item that should be reviewed.";
  }

  function buildWhyItMatters(finding, friendlyType) {
    if (friendlyType.type === "transport") {
      return "Authentication pages should protect data in transit. HTTPS is expected for deployed login and account pages.";
    }

    if (friendlyType.type === "headers") {
      return "Security headers help browsers apply safer defaults and reduce common client-side risks.";
    }

    if (friendlyType.type === "authentication" || friendlyType.type === "login-surface") {
      return "Authentication pages are sensitive because users may enter account identifiers or passwords.";
    }

    if (finding.severity === "high") {
      return "This finding may affect how safely users interact with the page and should be reviewed promptly.";
    }

    return "This finding adds context for a defensive review of the current page.";
  }

  function buildRecommendedAction(finding, context, friendlyType) {
    if (finding.recommendation) {
      return finding.recommendation;
    }

    if (friendlyType.type === "transport") {
      return context.securitySummary?.isLocalContext
        ? "Use HTTPS for deployed authentication pages; local HTTP can be acceptable for development fixtures."
        : "Enable HTTPS before using this page for real authentication workflows.";
    }

    if (friendlyType.type === "headers") {
      return "Review whether this header should be configured for the deployed application.";
    }

    if (friendlyType.type === "authentication" || friendlyType.type === "login-surface") {
      return "Review the authentication page with appropriate HTTPS, headers, and secure development checks.";
    }

    return "Review this finding manually and document any accepted risk or remediation.";
  }

  function getRiskLabel(finding) {
    const severity = finding.severity.toLowerCase();
    const status = finding.status.toLowerCase();

    if (severity === "high" || status === "fail") {
      return "High priority";
    }

    if (severity === "medium" || status === "warning") {
      return "Medium priority";
    }

    if (severity === "low") {
      return "Low priority";
    }

    return "Informational";
  }

  function buildTechnicalDetail(finding) {
    return [
      `Technical ID: ${finding.id || "unknown"}`,
      `Source: ${finding.source || "unknown"}`,
      `Category: ${finding.category || "unknown"}`,
      `Status: ${finding.status || "unknown"}`,
      `Severity: ${finding.severity || "info"}`,
      `Confidence: ${finding.confidence}%`,
    ].join("; ");
  }

  function findTopFinding(explainedFindings) {
    const priorityOrder = {
      "High priority": 0,
      "Medium priority": 1,
      "Low priority": 2,
      Informational: 3,
    };

    return [...explainedFindings].sort((left, right) => (
      (priorityOrder[left.riskLabel] ?? 99) - (priorityOrder[right.riskLabel] ?? 99)
    ))[0] || null;
  }

  function buildWhatWasFound(authType, hasAuthPage, findingCount, localContext) {
    const authText = hasAuthPage
      ? `LoginGuard found signs of a ${authType} page.`
      : "LoginGuard did not find a clear login or account page.";
    const contextText = localContext
      ? "The page appears to be running in a local development context."
      : "The page does not appear to be running in a local development context.";

    return `${authText} It produced ${findingCount} normalized finding${findingCount === 1 ? "" : "s"}. ${contextText}`;
  }

  function buildSummaryWhyItMatters(localContext, topFinding) {
    if (topFinding) {
      return topFinding.whyItMatters;
    }

    return localContext
      ? "Local fixture findings are useful for development review, but they do not represent a production security guarantee."
      : "Authentication surfaces deserve careful review because users may rely on them to protect account access.";
  }

  function buildWhatToFixFirst(topFinding, riskLevel) {
    if (topFinding) {
      return `${topFinding.riskLabel}: ${topFinding.recommendedAction}`;
    }

    return riskLevel === "unknown"
      ? "Review the page manually because no normalized findings were available."
      : "Start with any high or medium risk items, then document remaining informational findings.";
  }

  function toTitleCase(value) {
    return String(value || "")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function toFiniteNumber(value) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  globalThis.LoginGuardFindingExplainer = {
    buildPlainLanguageSummary,
    explainFinding,
  };
})();
