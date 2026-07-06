# JSON Report

LoginGuard can copy a local JSON report after a page scan completes. The report is designed for developer notes, manual review, classroom exercises, local fixtures, and authorized defensive assessment workflows.

The report is generated from the current analysis result already shown in the popup. LoginGuard copies the JSON text to the clipboard and does not send the report anywhere.

This feature does not prove that a page is secure. It records browser-visible signals that LoginGuard detected during passive local analysis.

## How It Works

1. Open a page you own, administer, study in a lab, or have explicit permission to assess.
2. Open the LoginGuard extension popup.
3. Wait for the scan result to appear.
4. Click **Copy JSON Report**.
5. Paste the copied JSON into a local note, issue, test record, or documentation file as needed.

The copied report is generated locally from the latest popup analysis result. LoginGuard does not perform form submission, credential collection, hidden telemetry, or background upload as part of report generation.

## Included Fields

| Field | Description |
| --- | --- |
| `project` | Project name, currently `LoginGuard`. |
| `generatedAt` | ISO timestamp for when the local report was generated. |
| `url` | Current scanned page URL. |
| `origin` | Origin derived from the scanned URL. |
| `securitySummary` | Summary-level transport context, including HTTPS and local development context signals. |
| `authentication` | Authentication classification summary, confidence label, and confidence score. |
| `fieldCounts` | Counts for detected password, username, and email fields. |
| `findings` | Normalized finding objects produced by LoginGuard modules. |
| `websiteCheckSummary` | Short owner/developer summary with result, risk, main issue, meaning, recommended fix, and safe-check reminder. |
| `plainLanguageSummary` | Human-friendly summary for non-technical readers, including what was found, why it matters, what to fix first, and what LoginGuard did not do. |
| `explainedFindings` | Plain-language explanations derived from normalized findings while preserving technical IDs in `technicalDetail`. |
| `risk` | Risk level and summary text when available. |
| `safetyNote` | Reminder that LoginGuard performs passive local analysis only. |

`websiteCheckSummary` is the simplest report layer. It is designed for website owners and developers who want to understand the current login page quickly before reading the technical findings.

| Website Check Field | Description |
| --- | --- |
| `result` | Whether LoginGuard detected a login/authentication surface. |
| `risk` | Overall risk label from the current passive scan. |
| `mainIssue` | Highest-priority plain-language issue to review first. |
| `whatItMeans` | Short explanation of the issue. |
| `whatToFix` | Defensive next step. |
| `safeCheck` | Reminder that the check was passive and local. |

Each finding uses the normalized finding shape:

| Finding Field | Description |
| --- | --- |
| `id` | Stable finding identifier. |
| `source` | Module or component that produced the finding. |
| `category` | Finding category, such as transport, authentication, or headers. |
| `status` | Finding status, such as pass, warning, fail, info, or unknown. |
| `severity` | Severity level used for defensive review. |
| `confidence` | Numeric confidence score from 0 to 100. |
| `title` | Short finding title. |
| `summary` | Plain-language explanation of what was observed. |
| `evidence` | Small list of safe evidence strings. |
| `recommendation` | Defensive recommendation or review guidance. |

`explainedFindings` are generated from the normalized findings and are intended to make reports easier to share with product owners, students, and non-specialist stakeholders. They do not replace the technical `findings` array.

Each explained finding includes:

| Explained Field | Description |
| --- | --- |
| `id` | Same technical finding identifier used by the normalized finding. |
| `title` | Original technical finding title. |
| `plainTitle` | Friendly title, such as `Connection security` or `Content Security Policy is missing`. |
| `plainSummary` | Short explanation of what LoginGuard observed. |
| `whyItMatters` | Defensive context for why the finding should be reviewed. |
| `riskLabel` | Human-friendly priority label. |
| `recommendedAction` | Plain defensive next step. |
| `technicalDetail` | Compact technical metadata for developers and security reviewers. |

## Excluded Data

LoginGuard reports are intentionally narrow. They do not include:

- Credentials.
- Form values.
- Cookies.
- Tokens.
- Page HTML.
- `localStorage` or `sessionStorage` contents.

The report should be safe to use for local notes and issue tracking, but users should still review copied data before sharing it outside their team or lab.

## Example

```json
{
  "project": "LoginGuard",
  "generatedAt": "2026-07-02T15:30:00.000Z",
  "url": "http://localhost:8080/fixtures/login-basic/",
  "origin": "http://localhost:8080",
  "securitySummary": {
    "usesHttps": false,
    "protocol": "http:",
    "isLocalContext": true,
    "localContextReason": "localhost is a local development host."
  },
  "authentication": {
    "type": "Login",
    "confidence": "High",
    "confidenceScore": 100
  },
  "fieldCounts": {
    "password": 1,
    "username": 0,
    "email": 1,
    "usernameOrEmail": 1
  },
  "findings": [
    {
      "id": "https.protocol",
      "source": "https-checker",
      "category": "transport",
      "status": "info",
      "severity": "low",
      "confidence": 100,
      "title": "Local HTTP development context",
      "summary": "The current page is using HTTP in a local development context.",
      "evidence": ["Protocol: http:"],
      "recommendation": "Use HTTPS for deployed authentication pages; HTTP on localhost is acceptable for local fixture testing."
    }
  ],
  "websiteCheckSummary": {
    "result": "Login page detected.",
    "risk": "low",
    "mainIssue": "Connection security",
    "whatItMeans": "The page is using a local development connection. This can be acceptable for fixtures, but production login pages should use HTTPS.",
    "whatToFix": "Use HTTPS for deployed authentication pages; HTTP on localhost is acceptable for local fixture testing.",
    "safeCheck": "Passive local check only. No forms were submitted and no credentials were collected."
  },
  "plainLanguageSummary": {
    "mainResult": "Login authentication surface detected.",
    "context": "This appears to be a local development or lab page.",
    "riskLevel": "low",
    "topRecommendation": "Use HTTPS for deployed authentication pages; HTTP on localhost is acceptable for local fixture testing.",
    "whatWasNotDone": "LoginGuard did not submit forms, read credentials, run payloads, perform brute force, or prove the page is fully secure."
  },
  "explainedFindings": [
    {
      "id": "https.protocol",
      "plainTitle": "Connection security",
      "riskLabel": "Low priority",
      "recommendedAction": "Use HTTPS for deployed authentication pages; HTTP on localhost is acceptable for local fixture testing."
    }
  ],
  "risk": {
    "level": "low",
    "summary": ["Local HTTP was detected in a development context."]
  },
  "safetyNote": "LoginGuard performs passive local analysis. No forms were submitted and no credentials were collected."
}
```

## Local Development Contexts

LoginGuard recognizes local development contexts such as `localhost`, `127.0.0.1`, `::1`, and hosts ending in `.localhost`.

HTTP on localhost is still reported as **Not HTTPS**, but the finding is treated differently from a real deployed HTTP authentication page. Local fixture testing often runs over HTTP, while production authentication pages should use HTTPS before users enter credentials.

When a page is served from a local development context, JSON reports may still include missing security header findings. Those findings remain visible, but missing headers from localhost fixtures may use severity `"low"` because simple local development servers often omit production security headers.

Real deployed authentication pages should still include appropriate production security headers. A low-severity local fixture report does not prove that a production page is secure.

## Safety Boundary

JSON reports are for authorized, defensive, and educational use. Do not use LoginGuard reports to assess third-party systems without permission, and do not treat a clean or low-risk report as proof that an authentication page is secure.
