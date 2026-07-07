# Changelog

All notable changes to LoginGuard will be documented in this file.

This project uses a simple changelog format for early prototype milestones. LoginGuard is defensive, authorized-use only, and passive by default.

## Unreleased

### Added

- Added Lab Mode JSON and Markdown report copy from the local Lab Mode test plan preview.
- Added Lab Mode Safe Execution Confirmation Gate.
- Added popup preview for execution confirmation status.
- Added Baseline Observation Executor v0 for approved metadata-only lab observation.
- Added persistent Lab Session page for Lab Mode results.
- Added Empty Fields Observation Planner for Lab Mode.
- Added Human-Friendly Findings Layer.
- Added plain-language summaries to reports and UI.
- Added Lab Mode Check Registry for clearer lab check labels.
- Added browser support planning documentation for future Firefox compatibility.

### Changed

- Fixed Lab Session opening so it uses a persistent normal extension tab.
- Refined Lab Mode report safety note wording for metadata-only baseline observation results.
- Refined UI around Website Check and Lab Mode.
- Improved product language for website owners and pentesters.
- Refreshed README to reflect Website Check and Lab Mode product positioning.
- Improved Lab Mode check cards with availability badges.
- Added v0.2.0 roadmap direction for Lab Check System and Firefox groundwork.

## v0.0.1 - Prototype Foundation

Date: 2026-07-02

This early milestone establishes the LoginGuard prototype foundation. It is not a production-ready release.

### Added

- Established `PROJECT.md` as the source of truth for project identity, architecture direction, safety boundaries, product vision, and AI development guidance.
- Aligned `README.md`, `ROADMAP.md`, and `SECURITY.md` with the defensive, authorized-use project direction.
- Added passive current-page analysis through the Chrome Extension popup workflow.
- Added authentication surface detection for login-like fields and controls.
- Added authentication type classification for common authentication page types.
- Added HTTPS detection and local development context handling.
- Added passive security header findings when browser-observed response headers are available.
- Added a normalized findings layer for shared finding structure.
- Added popup rendering for findings, reasons, security headers, and summaries.
- Added local JSON report copy.
- Added local Markdown report copy.
- Added AI Analyst Prompt copy for local, optional defensive analysis.
- Extracted report generation into a reusable core report builder.
- Added local safe fixtures for manual testing.
- Added a manual test matrix for local fixture behavior.
- Added Lab Mode context detection for local/authorized lab contexts.
- Added Lab Mode test plan preview without executing tests.
- Added Lab Mode documentation.

### Safety Boundaries

- Passive Mode does not submit forms.
- LoginGuard does not collect credentials.
- LoginGuard does not perform brute force.
- LoginGuard does not execute payloads.
- Lab Mode Preview does not execute tests yet.

### Next

- Improve report documentation and examples.
- Add a Lab Mode report builder.
- Explore an HTML report preview.
- Document the business monitoring model.
- Continue shaping the future AI analyst layer.
