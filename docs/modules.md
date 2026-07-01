# LoginGuard Modules

LoginGuard modules are focused analysis units. Each module inspects a specific area of the currently opened page or browser-visible metadata and returns structured results.

## Module Contract

| Field | Description |
| --- | --- |
| `id` | Stable module identifier. |
| `type` | Finding or classification type when applicable. |
| `confidence` | Human-readable confidence such as Low, Medium, or High. |
| `score` | Numeric score when scoring applies. |
| `reasons` | Short explanations for findings. |
| `recommendations` | Developer-focused remediation guidance when applicable. |

## Authentication

| Area | Description |
| --- | --- |
| Purpose | Classify authentication-related pages and identify the flow type. |
| Inputs | Page title, headings, button text, link text, input types, placeholders, labels, and URL path keywords. |
| Outputs | Type, confidence, score, and reasons. |
| Responsibilities | Detect Login, Registration, Password Recovery, Password Reset, MFA / 2FA, SSO, and Unknown page types. |

## Headers

| Area | Description |
| --- | --- |
| Purpose | Assess common browser security headers when available. |
| Inputs | Passive response-header snapshot and DOM-visible meta policy fallbacks. |
| Outputs | Present / Missing status, source, value when safe to display, and recommendations. |
| Responsibilities | Check CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, COEP, and CORP. |

## Cookies

| Area | Description |
| --- | --- |
| Purpose | Review browser-visible cookie security attributes. |
| Inputs | Cookie metadata available to the extension and browser APIs. |
| Outputs | Cookie attribute findings, risk notes, and recommendations. |
| Responsibilities | Assess Secure, SameSite, domain, path, expiration, and visibility constraints without collecting secret values. |

## Password

| Area | Description |
| --- | --- |
| Purpose | Inspect visible password policy and UX signals. |
| Inputs | Password fields, labels, placeholders, visible policy text, autocomplete attributes, and form structure. |
| Outputs | Policy indicators, missing signal notes, and developer recommendations. |
| Responsibilities | Identify policy guidance, confirm-password patterns, autocomplete usage, and safe UX indicators without reading entered passwords. |

## CSRF

| Area | Description |
| --- | --- |
| Purpose | Passively inspect forms for CSRF protection indicators. |
| Inputs | Form metadata, hidden field names, meta tags, and visible framework markers. |
| Outputs | Protection indicators, confidence, and recommendations. |
| Responsibilities | Detect likely CSRF token presence or absence without submitting requests. |

## JWT

| Area | Description |
| --- | --- |
| Purpose | Identify browser-visible JWT usage signals safely. |
| Inputs | Storage keys, cookie names, and visible configuration names where permitted by browser APIs. |
| Outputs | Presence indicators, storage-location notes, and recommendations. |
| Responsibilities | Flag risky storage patterns without decoding secrets or exfiltrating token values. |

## Session

| Area | Description |
| --- | --- |
| Purpose | Analyze visible session-management signals. |
| Inputs | Cookie metadata, storage usage indicators, logout links, session-related text, and browser-visible attributes. |
| Outputs | Session hardening notes and recommendations. |
| Responsibilities | Review session cookie posture, logout discoverability, and client-side storage risks without collecting session data. |

## Risk

| Area | Description |
| --- | --- |
| Purpose | Normalize module results into consistent risk summaries. |
| Inputs | Structured outputs from all modules. |
| Outputs | Severity, score, summary, finding categories, and remediation priorities. |
| Responsibilities | Provide consistent scoring and avoid overstating passive findings. |

## Reports

| Area | Description |
| --- | --- |
| Purpose | Generate local reports for authorized assessments. |
| Inputs | Scanner results, module findings, timestamps, and optional user-provided project context. |
| Outputs | Local report formats such as Markdown, JSON, or HTML. |
| Responsibilities | Preserve privacy, avoid sensitive data, and make findings shareable with developers. |

## Plugins

| Area | Description |
| --- | --- |
| Purpose | Allow reviewed third-party defensive modules. |
| Inputs | Plugin manifests, declared permissions, and module code. |
| Outputs | Registered modules and structured findings. |
| Responsibilities | Enforce module boundaries, version compatibility, and safety requirements. |

## Module Safety Rules

- Do not submit forms.
- Do not inject payloads.
- Do not automate attacks.
- Do not collect credentials.
- Do not exfiltrate page data.
- Do not make hidden network requests.
- Keep outputs concise, explainable, and useful for secure development.
