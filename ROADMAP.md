# LoginGuard Roadmap

LoginGuard is a defensive, authorized, passive-by-default browser security project. This roadmap translates the project direction from [PROJECT.md](PROJECT.md) into a practical 6+ month development plan for a small open-source project.

The roadmap is intentionally conservative. LoginGuard should grow slowly, safely, and with clear documentation.

## Current Status

**Status:** Current

LoginGuard currently exists as a Manifest V3 Chrome Extension with a modular source structure.

Current capabilities include:

- Active-tab popup workflow.
- HTTPS check.
- Authentication surface detection.
- Authentication page classification.
- Security headers scanner when browser-observed response headers are available.
- Basic popup rendering of findings, confidence, reasons, and recommendations.
- Governance, security, contribution, and project direction documentation.

Current limitations:

- Module output is not fully standardized yet.
- Risk scoring is still basic.
- There are no automated tests or local fixture pages yet.
- Reports are not implemented.
- Cookie, password policy, CSRF, UX, accessibility, and privacy modules are future work.

## Phase 0: Documentation and Foundation

**Status:** Current

Goal: make the project understandable, safe, and contributor-ready.

Tasks:

- Keep `PROJECT.md` as the source of truth.
- Keep `README.md` short, public-facing, and aligned with `PROJECT.md`.
- Maintain `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and issue templates.
- Expand architecture and module documentation as implementation stabilizes.
- Document every permission and its privacy impact.
- Keep all documentation clear about defensive, authorized, passive analysis.

Exit criteria:

- New contributors can understand the project purpose in under 10 minutes.
- Safety boundaries are visible in core docs.
- Roadmap and project constitution agree.

## Phase 1: Extension Stability

**Status:** Next

Goal: make the current Chrome Extension reliable for manual use.

Tasks:

- Verify extension loading in Chrome development mode.
- Review popup behavior on HTTP, HTTPS, localhost, and unsupported browser pages.
- Improve error handling for pages where content scripts cannot run.
- Confirm security header capture behavior after page refresh.
- Keep permissions minimal and documented.
- Improve README setup instructions if manual testing reveals friction.
- Create a manual test checklist.

Deliverables:

- Stable extension loading workflow.
- Manual QA checklist.
- Clear known-limitations notes.
- Updated screenshots if the popup UI changes.

## Phase 2: Module System

**Status:** Planned

Goal: make modules consistent, isolated, and easier to extend.

Tasks:

- Define a stable module result schema.
- Add a lightweight module registry.
- Normalize fields such as `id`, `name`, `category`, `status`, `severity`, `confidence`, `reasons`, `evidence`, and `recommendations`.
- Separate module execution from popup rendering.
- Document module authoring rules in `docs/`.
- Ensure modules remain passive and do not modify target pages.

Deliverables:

- Module contract documentation.
- Module registry or equivalent orchestration pattern.
- Updated scanner architecture.
- Existing modules adapted to the shared output shape.

## Phase 3: Finding Model and Risk Engine

**Status:** Planned

Goal: make findings explainable and risk scoring conservative.

Tasks:

- Define severity levels: Info, Low, Medium, High, Critical.
- Define confidence scoring guidance.
- Ensure every risk score includes reasons.
- Distinguish missing signals from confirmed vulnerabilities.
- Add recommendation mapping for common findings.
- Improve summary wording to avoid exaggerated claims.
- Add risk engine documentation.

Deliverables:

- Finding schema.
- Risk scoring rules.
- Recommendation model.
- Cleaner popup summaries based on normalized findings.

## Phase 4: Local Reports and Fixtures

**Status:** Planned

Goal: make analysis repeatable and useful for authorized review.

Tasks:

- Add safe local fixture pages for common authentication scenarios.
- Add fixtures for login, registration, password reset, MFA / 2FA, SSO, no-auth pages, and header combinations.
- Add local-only report export design.
- Implement a first local report format after the finding model stabilizes.
- Ensure reports exclude credentials, tokens, cookies, and sensitive form values.
- Document how to interpret reports.

Deliverables:

- Local fixture set.
- Report schema.
- First local report export, such as JSON or Markdown.
- Report privacy notes.

## Phase 5: UX, Accessibility, and Privacy Modules

**Status:** Planned

Goal: expand assessment coverage while keeping modules passive and educational.

Tasks:

- Add a secure authentication UX module.
- Add an accessibility signal module for authentication forms.
- Add a passive privacy/resource signal module.
- Explore cookie analysis using browser-visible attributes only.
- Explore password policy signals without reading entered passwords.
- Explore CSRF indicators without submitting forms.
- Keep every module documented with inputs, outputs, responsibilities, privacy impact, and boundaries.

Deliverables:

- UX module.
- Accessibility module.
- Privacy or cookie module prototype.
- Updated module documentation.
- Updated popup grouping for additional modules.

## Phase 6: v0.1.0 Release Readiness

**Status:** Planned

Goal: prepare the first stable educational Chrome Extension release.

Tasks:

- Complete manual testing across supported page types.
- Reduce obvious false positives in authentication detection and classification.
- Stabilize module output contracts.
- Confirm permissions and privacy documentation.
- Update README, PROJECT, ROADMAP, SECURITY, CONTRIBUTING, and CHANGELOG.
- Add release screenshots or short demo material.
- Triage open issues.
- Prepare a release checklist.

Deliverables:

- `v0.1.0` release candidate.
- Stable Chrome Extension development-mode install flow.
- Documented known limitations.
- Changelog entry.
- Public issue list for post-release work.

## Future Ecosystem Ideas

**Status:** Future

These ideas are long-term possibilities, not current commitments.

## Public Report System

**Status:** Planned

Goal: turn local findings into polished reports for authorized review without overstating certainty.

Tasks:

- Polish the basic public report experience.
- Keep the copy JSON report workflow local and explicit.
- Explore future HTML and Markdown report formats.
- Create a public demo report using safe fixture data.
- Add safe explanations for non-technical users.
- Keep report language clear that findings are browser-visible signals, not a guarantee of security.

Deliverables:

- Improved report schema.
- Example public demo report.
- Report interpretation guidance.
- Future HTML or Markdown report prototype.

## Business Monitoring Foundation

**Status:** Future

Goal: define a future authorized team workflow for monitoring authentication surfaces owned or administered by an organization.

Tasks:

- Define an authorized domain inventory model.
- Define a scan target model for approved assets.
- Design a one-time scan concept.
- Design a scheduled scan concept.
- Design scan history storage with privacy controls.
- Design report comparison and change detection.
- Explore a dashboard concept for teams.
- Explore alerting concepts for meaningful changes.

Deliverables:

- Business monitoring architecture notes.
- Authorized asset and scope model.
- Dashboard concept.
- Alerting concept.

This layer must not become hidden crawling, unauthorized public-site monitoring, or attack automation.

## AI Analyst Layer

**Status:** Future

Goal: explore AI-assisted report explanation and prioritization while keeping LoginGuard defensive and authorized-use only.

Tasks:

- Explain report findings in beginner-friendly language.
- Prioritize risk based on severity, confidence, and evidence.
- Generate developer task lists from findings.
- Generate executive summaries from report data.
- Add false-positive notes and uncertainty explanations.
- Suggest safe remediation guidance.

Deliverables:

- AI analyst design principles.
- Prompting and privacy model.
- Example safe report explanation.
- Human-review workflow for generated tasks.

The AI Analyst Layer should explain and organize defensive work. It must not perform unauthorized testing, generate offensive instructions, or claim that a system is secure without evidence.

## Fix Assistant Direction

**Status:** Future

Goal: explore safe remediation assistance that helps developers review and apply defensive hardening changes.

Tasks:

- Suggest fixes for missing or weak security headers.
- Provide framework-specific guidance where appropriate.
- Provide configuration snippets for review.
- Explain tradeoffs and deployment considerations.
- Require human review before any changes are applied.
- Avoid automatic unsafe changes.

Deliverables:

- Safe remediation guidance model.
- Example security header fix suggestions.
- Framework guidance templates.
- Human-review checklist.

The Fix Assistant should support defensive hardening only. It must not produce bypass guidance, exploit construction, or risky automatic changes.

## Lab Mode Future Execution

**Status:** Future

Goal: define future controlled Lab Mode execution for local, private, intentionally vulnerable, CTF, and explicitly authorized training environments.

Passive Mode remains the default LoginGuard behavior. Lab Mode must be separated from Passive Mode in implementation, UI, documentation, and safety controls. It should refuse to run on normal public websites and should never weaken the default passive extension workflow.

Milestones:

1. Lab context detector for `localhost`, `127.0.0.1`, `::1`, `.localhost`, and future explicit lab allowlists.
2. Lab Mode UI gate requiring clear user enablement before any lab-only behavior is available.
3. Local-only test runner skeleton for safe, intentionally scoped lab workflows.
4. Safe synthetic test input registry for harmless training values only.
5. Form interaction wrapper with strict scope checks and no real credential handling.
6. Response observation layer for status, redirects, visible message changes, and observable session changes without storing secrets.
7. Lab report builder for structured local reports after lab tests.
8. Local vulnerable fixture pages for controlled education and regression testing.
9. Manual test matrix for Lab Mode behavior and refusal cases.
10. Safety refusal behavior for non-local and non-allowlisted targets.

Future Lab Mode execution must remain local-only or explicitly allowlisted, generate structured lab reports, and refuse public targets.

Lab Mode out of scope:

- Brute force.
- Password spraying.
- Credential harvesting.
- Public-site attack automation.
- CAPTCHA bypass.
- MFA bypass.
- Bypass logic.
- Stealth or evasion.

Lab Mode should support safe CTF and local lab learning only. It should not provide offensive third-party testing workflows or real exploit payload lists.

| Area | Direction |
| --- | --- |
| CLI | Local command-line workflows for repeatable authorized analysis. |
| Web Dashboard | Local or self-hosted dashboard for reviewing reports and trends. |
| Plugin SDK | Safe extension points for reviewed defensive modules. |
| Community Modules | Contributor-built modules with documented safety boundaries. |
| Documentation Website | Public docs, module authoring guide, and learning material. |
| Local Lab Mode | Optional mode for local, private, intentionally vulnerable training pages only. |
| Browser Compatibility | Support notes or adapters for Chromium-based browsers first, then other browsers if practical. |

Future ecosystem work must remain aligned with `PROJECT.md`: passive by default, local-first, privacy-preserving, and authorized-use only.

## Out of Scope

The following are not part of LoginGuard:

- Brute force.
- Credential stuffing.
- Credential collection.
- Form submission automation.
- Exploit payloads.
- Payload spraying.
- Phishing workflows.
- Authentication bypass features.
- Hidden scanning.
- Background crawling.
- Unauthorized third-party testing.
- Stealth or evasion behavior.
- Telemetry without explicit user consent.

If a proposed feature increases misuse risk, it should not be added to the default product.

## Roadmap Review Rhythm

Review this roadmap at the end of each phase or when a major architectural decision changes.

Each update should answer:

- What is current?
- What is next?
- What is planned?
- What is future-only?
- Are safety boundaries still clear?
- Does the roadmap still match `PROJECT.md`?
