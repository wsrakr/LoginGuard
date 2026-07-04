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

    const report = {
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
    const explainer = getFindingExplainer();

    return {
      ...report,
      plainLanguageSummary: explainer.buildPlainLanguageSummary(report),
      explainedFindings: report.findings.map((finding) => explainer.explainFinding(finding, report)),
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
      "## Plain Language Summary",
      "",
      `- What did LoginGuard find? ${toMarkdownText(report.plainLanguageSummary.whatWasFound)}`,
      `- Why does it matter? ${toMarkdownText(report.plainLanguageSummary.whyItMatters)}`,
      `- What should be fixed first? ${toMarkdownText(report.plainLanguageSummary.whatToFixFirst)}`,
      `- What did LoginGuard not do? ${toMarkdownText(report.plainLanguageSummary.whatWasNotDone)}`,
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
          appendMarkdownFinding(lines, finding, index, report);
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

  function buildAiAnalystPrompt(analysis) {
    const jsonReport = buildJsonReport(analysis);
    const lines = [
      "You are a defensive web security analyst reviewing a LoginGuard report.",
      "Write for both business stakeholders and developers. Be clear, practical, and professional.",
      "",
      "Safety rules:",
      "- Do not provide exploit steps.",
      "- Do not suggest unauthorized testing.",
      "- Do not claim the page is fully secure.",
      "- Do not provide payloads, bypass instructions, brute-force workflows, or credential collection guidance.",
      "- Focus on defensive remediation and reporting.",
      "- Treat local development context as different from a deployed production authentication page.",
      "",
      "Requested output sections:",
      "1. Executive summary for non-technical stakeholders",
      "2. Technical summary for developers/security teams",
      "3. Prioritized findings",
      "4. Developer task list",
      "5. Safe remediation suggestions",
      "6. Context and false-positive notes",
      "7. Manual verification checklist",
      "",
      "Output guidance:",
      "- Use concise headings and bullets.",
      "- Separate business impact from developer implementation details.",
      "- Prioritize work by severity, confidence, and deployment context.",
      "- Call out local development context when it changes interpretation.",
      "- Keep remediation suggestions defensive and reviewable.",
      "",
      "Use the LoginGuard report data below. Do not infer access to page HTML, cookies, tokens, storage contents, credentials, or form values.",
      "",
      "## LoginGuard JSON Report",
      "",
      "```json",
      JSON.stringify(jsonReport, null, 2),
      "```",
    ];

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

  function appendMarkdownFinding(lines, finding, index, report) {
    const explainedFinding = getFindingExplainer().explainFinding(finding, report);

    lines.push(
      `#### ${index + 1}. ${toMarkdownText(explainedFinding.plainTitle || finding.title || "Untitled finding")}`,
      "",
      `- Plain summary: ${toMarkdownText(explainedFinding.plainSummary)}`,
      `- Why it matters: ${toMarkdownText(explainedFinding.whyItMatters)}`,
      `- Risk label: ${toMarkdownText(explainedFinding.riskLabel)}`,
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
      `- Technical detail: ${toMarkdownText(explainedFinding.technicalDetail)}`,
      "",
    );
  }

  function getFindingExplainer() {
    if (globalThis.LoginGuardFindingExplainer) {
      return globalThis.LoginGuardFindingExplainer;
    }

    return {
      buildPlainLanguageSummary: buildFallbackPlainLanguageSummary,
      explainFinding: explainFallbackFinding,
    };
  }

  function buildFallbackPlainLanguageSummary(report) {
    return {
      mainResult: `${report.authentication?.type || "Unknown"} authentication review.`,
      context: report.securitySummary?.isLocalContext
        ? "This appears to be a local development or lab page."
        : "This appears to be a deployed or non-local page.",
      riskLevel: String(report.risk?.level || "unknown"),
      topRecommendation: "Review the normalized findings and apply the highest-priority recommendations first.",
      whatWasFound: `LoginGuard produced ${Array.isArray(report.findings) ? report.findings.length : 0} normalized findings from passive analysis.`,
      whyItMatters: "Authentication surfaces should be reviewed carefully because users may rely on them for account access.",
      whatToFixFirst: "Start with high or medium severity findings, then review lower severity context.",
      whatWasNotDone: "LoginGuard did not submit forms, collect credentials, run payloads, or prove the page is fully secure.",
      safetyNote: report.safetyNote || SAFETY_NOTE,
    };
  }

  function explainFallbackFinding(finding) {
    return {
      id: String(finding?.id || ""),
      title: String(finding?.title || "Untitled finding"),
      plainTitle: String(finding?.title || "Security finding"),
      plainSummary: String(finding?.summary || "LoginGuard found an item that should be reviewed."),
      whyItMatters: "This finding adds context for a defensive review of the current page.",
      riskLabel: String(finding?.severity || "info"),
      recommendedAction: String(finding?.recommendation || "Review this finding manually."),
      technicalDetail: `Technical ID: ${String(finding?.id || "unknown")}`,
    };
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
    buildAiAnalystPrompt,
    buildJsonReport,
    buildMarkdownReport,
  };
})();
