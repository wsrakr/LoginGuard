# LoginGuard Roadmap

This roadmap describes the planned evolution of LoginGuard from a defensive Chrome Extension into a modular browser security platform.

Dates are intentionally omitted until release planning is formalized. Scope may change as the project matures, but the defensive and authorized-use boundaries are fixed.

## Release Plan

| Version | Theme | Goals |
| --- | --- | --- |
| v0.1 | Authentication Detection | Detect authentication-related forms, password fields, username/email fields, submit controls, and SPA-style authentication areas. |
| v0.2 | Authentication Classification | Classify pages as Login, Registration, Password Recovery, Password Reset, MFA / 2FA, SSO, or Unknown with confidence and reasons. |
| v0.3 | Security Headers | Inspect common security headers when browser APIs expose them and provide Present / Missing results with recommendations. |
| v0.4 | Cookie Analyzer | Analyze browser-visible cookie security attributes such as Secure, HttpOnly visibility constraints, SameSite, domain, path, and expiration where available. |
| v0.5 | Password Policy | Assess visible password policy signals and developer-facing UX indicators without collecting entered passwords. |
| v0.6 | CSRF Detection | Passively inspect forms and page metadata for CSRF protection indicators without submitting requests. |
| v0.7 | Risk Engine | Introduce consistent risk scoring, severity levels, finding categories, and remediation guidance. |
| v0.8 | Reporting | Add local report generation for authorized assessments, with export controls and privacy protections. |
| v0.9 | Plugin System | Define a plugin API, module manifest format, lifecycle hooks, and safety requirements. |
| v1.0 | Stable Release | Stabilize architecture, documentation, module contracts, permissions, and release process. |

## Future Platform Capabilities

| Area | Direction |
| --- | --- |
| CLI | Local command-line workflows for repeatable authorized analysis and report generation. |
| Dashboard | Web-based interface for reviewing local findings, trends, and project reports. |
| REST API | Optional local or self-hosted API for integrating approved analysis results into developer workflows. |
| Plugin Marketplace | Curated registry of defensive, reviewed LoginGuard plugins. |
| Enterprise Edition | Governance, policy controls, team reporting, and integration features for organizations. |

## Guiding Constraints

- No offensive payloads.
- No unauthorized testing support.
- No form submission.
- No brute force behavior.
- No credential collection.
- No hidden telemetry.
- No exfiltration of user or page data.
- Current-page, local-first analysis remains the default model.

## Release Quality Bar

Each release should include:

- Clear user-facing documentation.
- Updated module documentation.
- Security and privacy impact notes.
- Manual extension loading verification.
- Syntax checks for changed JavaScript files.
- Changelog entries.
