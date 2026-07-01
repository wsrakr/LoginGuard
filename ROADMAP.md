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
