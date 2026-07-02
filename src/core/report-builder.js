// Builds local-only reports from sanitized LoginGuard scan results.
(() => {
  const SAFETY_NOTE = "LoginGuard performs passive local analysis. No forms were submitted and no credentials were collected.";

  function buildJsonReport(analysis) {
    const modules = analysis.modules || {};
    const login = modules.login || {};
    const auth = modules.auth || {};
    const security = analysis.security || {};
    const https = analysis.https || modules.https || {};
    const risk = analysis.risk || null;
    const usernameFields = toFiniteNumber(login.usernameFields);
    const emailFields = toFiniteNumber(login.emailFields);
    const passwordFields = toFiniteNumber(login.passwordFields);

    return {
      project: "LoginGuard",
      generatedAt: new Date().toISOString(),
      url: String(analysis.url || ""),
      origin: getReportOrigin(analysis),
      securitySummary: {
        usesHttps: Boolean(security.usesHttps),
        protocol: String(security.protocol || ""),
        isLocalContext: Boolean(https.isLocalContext),
        localContextReason: https.localContextReason || null,
      },
      authentication: {
        type: String(auth.type || analysis.authenticationType || "Unknown"),
        confidence: String(auth.confidence || analysis.confidence || "Unknown"),
        confidenceScore: toFiniteNumber(auth.score ?? analysis.confidenceScore),
      },
      fieldCounts: {
        password: passwordFields,
        username: usernameFields,
        email: emailFields,
        usernameOrEmail: usernameFields + emailFields,
      },
      findings: sanitizeFindings(analysis.findings),
      risk: risk ? {
        level: String(risk.level || "unknown"),
        summary: sanitizeStringArray(risk.summary),
      } : null,
      safetyNote: SAFETY_NOTE,
    };
  }

  function buildMarkdownReport(analysis) {
    const report = buildJsonReport(analysis);
    const security = report.securitySummary;
    const auth = report.authentication;
    const fields = report.fieldCounts;
    const risk = report.risk || {};
    const findings = Array.isArray(report.findings) ? report.findings : [];
    const groupedFindings = groupFindingsByCategory(findings);
    const lines = [
      "# LoginGuard Report",
      "",
      `Generated: ${toMarkdownText(report.generatedAt)}`,
      `URL: ${toMarkdownText(report.url)}`,
      `Origin: ${toMarkdownText(report.origin)}`,
      "",
      "## Executive Summary",
      "",
      createExecutiveSummary(report),
      "",
      "## Security Summary",
      "",
      `- HTTPS: ${security.usesHttps ? "Yes" : "No"}`,
      `- Protocol: ${toMarkdownText(security.protocol || "unknown")}`,
      `- Local context: ${security.isLocalContext ? "Yes" : "No"}`,
    ];

    if (security.localContextReason) {
      lines.push(`- Local context reason: ${toMarkdownText(security.localContextReason)}`);
    }

    lines.push(
      "",
      "## Authentication",
      "",
      `- Type: ${toMarkdownText(auth.type)}`,
      `- Confidence: ${toMarkdownText(auth.confidence)} (${auth.confidenceScore}%)`,
      "",
      "## Field Counts",
      "",
      `- Password fields: ${fields.password}`,
      `- Username fields: ${fields.username}`,
      `- Email fields: ${fields.email}`,
      `- Username/email fields: ${fields.usernameOrEmail}`,
      "",
      "## Risk",
      "",
      `- Level: ${toMarkdownText(risk.level || "unknown")}`,
    );

    if (Array.isArray(risk.summary) && risk.summary.length > 0) {
      lines.push("- Summary:");
      risk.summary.forEach((item) => {
        lines.push(`  - ${toMarkdownText(item)}`);
      });
    }

    lines.push("", "## Findings", "");

    if (findings.length === 0) {
      lines.push("No normalized findings were available for this scan.");
    } else {
      groupedFindings.forEach((group) => {
        lines.push(`### ${group.label}`, "");
        group.findings.forEach((finding, index) => {
          appendMarkdownFinding(lines, finding, index);
        });
      });
    }

    lines.push(
      "## Safety Note",
      "",
      toMarkdownText(report.safetyNote),
      "",
    );

    return lines.join("\n");
  }

  function createExecutiveSummary(report) {
    const authType = toMarkdownText(report.authentication.type || "Unknown");
    const riskLevel = toMarkdownText(report.risk?.level || "unknown");
    const localContextText = report.securitySummary.isLocalContext
      ? "The page appears to be running in a local development context."
      : "The page does not appear to be running in a local development context.";
    const interpretation = report.securitySummary.isLocalContext
      ? "Use these findings as local development guidance before reviewing a deployed authentication surface."
      : "Use these findings as defensive review guidance for the currently opened page; they do not prove whether the page is secure.";

    return `LoginGuard classified this page as ${authType} with an overall risk level of ${riskLevel}. ${localContextText} ${interpretation}`;
  }

  function groupFindingsByCategory(findings) {
    const groups = [
      { key: "transport", label: "Transport", findings: [] },
      { key: "authentication", label: "Authentication", findings: [] },
      { key: "headers", label: "Headers", findings: [] },
      { key: "other", label: "Other", findings: [] },
    ];

    findings.forEach((finding) => {
      const group = groups.find((item) => item.key === normalizeFindingCategory(finding.category))
        || groups[groups.length - 1];

      group.findings.push(finding);
    });

    return groups.filter((group) => group.findings.length > 0);
  }

  function normalizeFindingCategory(category) {
    const normalizedCategory = String(category || "").toLowerCase();

    if (normalizedCategory === "transport") {
      return "transport";
    }

    if (normalizedCategory === "authentication") {
      return "authentication";
    }

    if (normalizedCategory === "headers") {
      return "headers";
    }

    return "other";
  }

  function appendMarkdownFinding(lines, finding, index) {
    lines.push(
      `#### ${index + 1}. ${toMarkdownText(finding.title || "Untitled finding")}`,
      "",
      `- Severity: ${toMarkdownText(finding.severity)}`,
      `- Status: ${toMarkdownText(finding.status)}`,
      `- Confidence: ${toFiniteNumber(finding.confidence)}%`,
      `- Summary: ${toMarkdownText(finding.summary || "No summary available.")}`,
    );

    if (Array.isArray(finding.evidence) && finding.evidence.length > 0) {
      lines.push("- Evidence:");
      finding.evidence.forEach((item) => {
        lines.push(`  - ${toMarkdownText(item)}`);
      });
    }

    lines.push(
      `- Recommendation: ${toMarkdownText(finding.recommendation || "Review this finding manually.")}`,
      "",
    );
  }

  function getReportOrigin(analysis) {
    if (analysis.origin) {
      return String(analysis.origin);
    }

    try {
      return new URL(analysis.url).origin;
    } catch {
      return "";
    }
  }

  function sanitizeFindings(findings) {
    if (!Array.isArray(findings)) {
      return [];
    }

    return findings.map((finding) => ({
      id: String(finding?.id || ""),
      source: String(finding?.source || ""),
      category: String(finding?.category || ""),
      status: String(finding?.status || "unknown"),
      severity: String(finding?.severity || "info"),
      confidence: toFiniteNumber(finding?.confidence),
      title: String(finding?.title || ""),
      summary: String(finding?.summary || ""),
      evidence: sanitizeStringArray(finding?.evidence),
      recommendation: String(finding?.recommendation || ""),
    }));
  }

  function sanitizeStringArray(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => String(item));
  }

  function toMarkdownText(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toFiniteNumber(value) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  globalThis.LoginGuardReportBuilder = {
    buildJsonReport,
    buildMarkdownReport,
  };
})();
