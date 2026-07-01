# LoginGuard PROJECT.md

## 1. Source of Truth

This file is the source of truth for the LoginGuard project.

Every major product decision, architecture decision, safety boundary, feature direction, module rule, and long-term development plan should be aligned with this document.

If another file conflicts with this file, this file wins.

Related files have narrower roles:

* `README.md` is the public-facing project introduction.
* `ROADMAP.md` is the milestone and release planning document.
* `SECURITY.md` explains responsible disclosure and security boundaries.
* `CONTRIBUTING.md` explains how others can contribute.
* `PROJECT.md` defines what LoginGuard is, what it is not, and how it should grow.

---

# 2. Project Identity

## Project Name

LoginGuard

## Current Form

LoginGuard currently starts as a browser extension.

The first implementation is a Chrome Extension built with Manifest V3. It performs passive, local, browser-based inspection of the active tab after the user opens the extension popup.

## Long-Term Identity

LoginGuard is not only a Chrome extension.

LoginGuard is a defensive authentication-surface security assessment ecosystem.

The extension is the first user-facing product, but the long-term project should grow into a modular framework that helps developers, students, security researchers, and security teams understand login page security before credentials are submitted.

---

# 3. One-Sentence Vision

LoginGuard helps users safely inspect login pages, detect risky authentication implementation patterns, and learn secure login design through passive, authorized, browser-based analysis.

---

# 4. Product Vision

LoginGuard should become a practical, educational, and developer-friendly security assistant for authentication surfaces.

The project focuses on login pages, registration pages, password reset flows, MFA/2FA flows, SSO pages, and other authentication-related user interfaces.

The goal is not to attack websites.

The goal is to help people understand whether an authentication page has visible security weaknesses, missing protections, confusing UX patterns, or risky implementation signals.

LoginGuard should be useful for:

* Developers reviewing their own login pages.
* Students learning web security.
* Security researchers working in authorized environments.
* Internal teams performing lightweight authentication surface reviews.
* Educators demonstrating secure login design.
* Bug bounty learners working only within authorized scope.
* Open-source maintainers who want a safer authentication checklist.

---

# 5. Core Principles

## 5.1 Defensive First

LoginGuard is a defensive tool.

Every feature should help users understand, improve, document, or teach secure authentication.

LoginGuard must not become an offensive exploitation toolkit.

## 5.2 Authorization Required

LoginGuard should only be used on systems the user owns, administers, studies in a lab, or has explicit permission to assess.

The project should repeatedly communicate this boundary in documentation and UI where appropriate.

## 5.3 Passive by Default

The default behavior must be passive.

Passive means:

* No form submission.
* No credential collection.
* No password interception.
* No brute force.
* No exploit payloads.
* No hidden network requests.
* No scanning unrelated pages.
* No bypass attempts.
* No automated interaction with authentication systems.

## 5.4 Local First

LoginGuard should process findings locally whenever possible.

The extension should not send inspected page data to external services by default.

If future versions ever introduce optional cloud features, they must be explicit, documented, opt-in, privacy-preserving, and safe.

## 5.5 Explain, Do Not Exploit

LoginGuard should explain risks and give remediation guidance.

It should not provide instructions that help attack third-party systems.

Findings should be written for defensive use:

* What was detected?
* Why does it matter?
* What is the risk?
* How can a developer fix it?
* How confident is the detection?

## 5.6 Modular Architecture

LoginGuard should grow through small, focused modules.

Each module should inspect one area of the page or browser-observable security posture and return structured findings.

## 5.7 Educational Value

LoginGuard should teach while it scans.

Every finding should help the user learn secure authentication concepts.

The long-term project should include labs, fixtures, examples, documentation, and beginner-friendly explanations.

---

# 6. What LoginGuard Is

LoginGuard is:

* A browser-based authentication security assessment framework.
* A Chrome Extension in its first implementation.
* A passive login page inspection tool.
* A modular security education project.
* A local-first defensive analysis system.
* A project for authorized testing only.
* A long-term ecosystem around authentication security.

---

# 7. What LoginGuard Is Not

LoginGuard is not:

* A hacking tool.
* A phishing tool.
* A credential harvester.
* A brute-force tool.
* A vulnerability exploitation framework.
* A scanner for attacking third-party websites.
* A tool for bypassing authentication.
* A tool for stealing, storing, or transmitting passwords.
* A replacement for professional penetration testing.
* A guarantee that a login page is secure.

---

# 8. Current Project State

The current project is a Chrome Extension with a modular structure.

Current capabilities include:

* Detecting whether the current page uses HTTPS.
* Displaying the current page URL.
* Detecting likely login forms.
* Detecting username, email, and password fields.
* Detecting likely submit buttons.
* Detecting SPA-style login areas that do not use a native form tag.
* Classifying authentication-related pages.
* Estimating authentication confidence.
* Listing detection reasons.
* Checking common security headers when browser-observed response headers are available.
* Showing present or missing security header status.
* Providing short recommendations.
* Running passive browser-based analysis from the current active tab.
* Avoiding form submission, payload delivery, brute force behavior, and active attack workflows.

Current module-like areas include:

* `src/core/scanner.js`
* `src/core/risk-engine.js`
* `src/modules/auth/auth-classifier.js`
* `src/modules/headers/header-scanner.js`
* `src/modules/login/login-detector.js`
* `src/modules/https/https-checker.js`
* `src/utils/dom-utils.js`
* `src/content/content.js`
* `src/popup/popup.js`

---

# 9. Long-Term Ecosystem Direction

LoginGuard should grow in phases.

The Chrome extension is Phase 1.

The future ecosystem may include:

1. Browser Extension
2. Module Framework
3. Local Report Generator
4. Educational Lab Pages
5. Secure Login Checklist
6. Authentication Pattern Library
7. Developer Documentation
8. Test Fixtures
9. Example Vulnerable and Secure Login Pages
10. CLI Companion Tool
11. Local Desktop Dashboard
12. Browser Compatibility Layer
13. Security Learning Mode
14. Team/Teaching Mode
15. Optional Integrations for Authorized Internal Use

Not all of these must be built immediately.

The project should grow slowly, safely, and consistently.

---

# 10. Product Layers

## 10.1 Extension Layer

The extension is the primary user-facing interface.

Responsibilities:

* Analyze the current active tab.
* Show a clear security summary.
* Display module findings.
* Explain detected risks.
* Provide remediation guidance.
* Keep analysis local.
* Avoid unsafe behavior.

## 10.2 Core Engine Layer

The core engine coordinates modules.

Responsibilities:

* Run modules safely.
* Normalize module results.
* Combine findings.
* Calculate summary state.
* Manage confidence scoring.
* Prevent side effects.
* Keep the module interface stable.

## 10.3 Module Layer

Modules perform focused checks.

A module should:

* Inspect one topic.
* Return structured data.
* Avoid side effects.
* Avoid network activity unless explicitly allowed by a future safe design.
* Include confidence.
* Include remediation guidance.
* Be independently testable.

## 10.4 Risk Engine Layer

The risk engine converts module results into user-facing meaning.

Responsibilities:

* Assign severity.
* Group findings.
* Summarize overall posture.
* Avoid overstating certainty.
* Distinguish between confirmed findings and weak signals.
* Produce beginner-friendly explanations.

## 10.5 Reporting Layer

The reporting layer should eventually generate local reports.

Reports should include:

* Page URL.
* Scan timestamp.
* Module results.
* Findings.
* Severity.
* Confidence.
* Evidence.
* Remediation.
* Safety disclaimer.
* Scope reminder.

Reports should be local-first.

## 10.6 Education Layer

The education layer should help users learn.

It may include:

* Secure login checklist.
* Example login pages.
* Safe lab pages.
* Explanations of headers.
* Explanations of MFA/2FA.
* Explanations of authentication UX.
* Documentation for students.
* Documentation for developers.

---

# 11. Safety Boundaries

LoginGuard must not include:

* Credential capture.
* Password logging.
* Token stealing.
* Cookie stealing.
* Session hijacking.
* Brute-force logic.
* Password spraying.
* Exploit payloads.
* SQL injection payload delivery.
* XSS payload delivery.
* CSRF attack automation.
* CAPTCHA bypass.
* MFA bypass.
* Phishing page generation.
* Form auto-submission.
* Hidden background scanning.
* Unauthorized data exfiltration.
* Stealth behavior.
* Evasion behavior.
* Any feature designed to attack third-party systems.

LoginGuard may include:

* Passive DOM inspection.
* Passive URL inspection.
* Passive protocol checks.
* Browser-observed security header checks.
* Local-only reporting.
* Educational explanations.
* Secure development recommendations.
* Authorized lab support.
* Test fixtures.
* Defensive checklists.

---

# 12. Permission Philosophy

The extension should request the minimum permissions needed for the current feature set.

Every permission must have a clear reason.

Current permission categories may include:

* `activeTab` for analyzing the current active page after user action.
* `scripting` for injecting read-only analysis logic.
* `webRequest` for observing completed main-frame response headers.
* `storage` for short-lived local/session state.
* Host permissions only when required for browser-observed security header visibility.

Permissions must not be used for hidden scanning or unauthorized monitoring.

---

# 13. Privacy Philosophy

LoginGuard should not collect credentials.

LoginGuard should not store passwords.

LoginGuard should not transmit page data externally by default.

LoginGuard should avoid storing sensitive page content.

If future features require storing reports, reports should be:

* Local by default.
* User-controlled.
* Clear about what is included.
* Easy to delete.
* Free from credentials and secrets.

---

# 14. Module Design Standard

Every module should follow this conceptual interface:

```js
{
  id: "module-id",
  name: "Human Readable Module Name",
  category: "authentication | headers | ux | privacy | accessibility | education",
  run(context) {
    return {
      status: "pass | warning | fail | info | unknown",
      severity: "info | low | medium | high",
      confidence: 0-100,
      title: "Finding title",
      summary: "Short explanation",
      evidence: [],
      remediation: "How to fix or improve this",
      references: []
    };
  }
}
```

This exact interface may evolve, but the principle should remain stable.

Modules should return structured findings, not random strings.

---

# 15. Finding Quality Standard

Every finding should answer:

1. What did LoginGuard detect?
2. Why does it matter?
3. How confident is the result?
4. What evidence supports the result?
5. What should a developer do next?
6. Is this a confirmed issue or only a signal?

Bad finding:

> Security header missing.

Good finding:

> Content-Security-Policy was not observed in the browser response headers. CSP helps reduce the impact of certain injection issues by restricting which scripts, styles, and resources the browser is allowed to load. Add a strict CSP policy and test it carefully in report-only mode before enforcing it.

---

# 16. Severity Model

LoginGuard should use a conservative severity model.

Severity should not exaggerate.

Suggested severity levels:

## Info

Useful information, not necessarily a risk.

## Low

Minor weakness or missing best practice.

## Medium

Meaningful security concern that should be reviewed.

## High

Important risk signal that may expose users or authentication flows to serious issues.

## Unknown

Insufficient evidence.

The tool should avoid claiming “vulnerable” unless the evidence is strong.

Preferred language:

* “Missing”
* “Not observed”
* “Potentially risky”
* “Review recommended”
* “May indicate”
* “Detected signal”

Avoid careless language:

* “Exploitable”
* “Definitely vulnerable”
* “Can be hacked”
* “Critical” without proof

---

# 17. Confidence Model

Confidence should show how reliable a finding is.

Suggested model:

* 90–100: Strong evidence.
* 70–89: Good evidence.
* 40–69: Partial evidence.
* 1–39: Weak signal.
* 0: Unknown or not enough information.

Confidence is not severity.

A high-confidence low-severity finding is possible.

A low-confidence medium-severity finding is also possible.

---

# 18. Initial Module Categories

## 18.1 HTTPS Module

Checks whether the current page is loaded over HTTPS.

Possible findings:

* HTTPS used.
* HTTP used.
* Localhost/lab context detected.
* Mixed context warning, if detectable later.

## 18.2 Login Detection Module

Detects whether the page appears to contain an authentication form or authentication area.

Signals:

* Password field.
* Email field.
* Username field.
* Submit button.
* Form element.
* SPA login container.
* Login-related labels.
* Login-related placeholders.
* Login-related headings.
* Login-related URL paths.

## 18.3 Authentication Classifier Module

Classifies page type.

Possible categories:

* Login
* Registration
* Password Recovery
* Password Reset
* MFA / 2FA
* SSO
* Unknown

## 18.4 Security Headers Module

Checks browser-observed security headers where available.

Possible headers:

* Content-Security-Policy
* Strict-Transport-Security
* X-Frame-Options
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* Cross-Origin-Opener-Policy
* Cross-Origin-Resource-Policy
* Cross-Origin-Embedder-Policy

## 18.5 Secure UX Module

Future module for login UX safety.

Possible checks:

* Password visibility toggle clarity.
* Clear submit button.
* Dangerous autocomplete patterns.
* Missing password manager compatibility hints.
* Confusing login/register flows.
* Insecure copywriting signals.

## 18.6 Accessibility Module

Future module for authentication accessibility.

Possible checks:

* Labels connected to inputs.
* Keyboard navigability.
* Focus order.
* Button names.
* Error message accessibility.
* ARIA misuse.
* Color contrast.

## 18.7 Privacy Module

Future module for privacy-related signals.

Possible checks:

* Third-party scripts on login pages.
* Excessive trackers on auth pages.
* Suspicious external resources.
* Unclear privacy links.

This module must remain passive.

---

# 19. Recommended Repository Structure

Long-term structure may evolve toward:

```text
.
|-- manifest.json
|-- README.md
|-- PROJECT.md
|-- ROADMAP.md
|-- SECURITY.md
|-- CONTRIBUTING.md
|-- CHANGELOG.md
|-- LICENSE
|-- assets/
|   `-- icons/
|-- docs/
|   |-- architecture.md
|   |-- module-authoring.md
|   |-- finding-model.md
|   |-- security-boundaries.md
|   |-- secure-login-checklist.md
|   |-- labs.md
|   `-- examples.md
|-- fixtures/
|   |-- login-basic/
|   |-- login-spa/
|   |-- register-basic/
|   |-- password-reset/
|   |-- mfa/
|   `-- insecure-examples/
|-- src/
|   |-- background/
|   |-- content/
|   |-- core/
|   |-- modules/
|   |   |-- auth/
|   |   |-- headers/
|   |   |-- https/
|   |   |-- login/
|   |   |-- ux/
|   |   |-- accessibility/
|   |   `-- privacy/
|   |-- popup/
|   |-- reporting/
|   |-- storage/
|   `-- utils/
`-- tests/
    |-- unit/
    |-- fixtures/
    `-- integration/
```

The current repository does not need to immediately match this structure.

This is the long-term direction.

---

# 20. Six-Month Development Direction

The project should be developed slowly and consistently over at least six months.

The goal is not to add many random features.

The goal is to build a serious, clean, defensible, documented security project.

## Month 1: Foundation and Cleanup

Focus:

* Stabilize current extension.
* Clean architecture.
* Improve naming.
* Make current modules reliable.
* Improve README, PROJECT, ROADMAP, SECURITY.
* Create basic test fixtures.
* Document current behavior.
* Ensure all safety boundaries are clear.

Deliverables:

* Stable extension loading in Chrome.
* Clear popup UI.
* Clean module folders.
* Updated documentation.
* First test pages.
* Basic manual test checklist.

## Month 2: Module System

Focus:

* Formalize module interface.
* Add module registry.
* Normalize findings.
* Add severity and confidence.
* Improve risk engine.
* Make rendering module-independent.
* Add module authoring documentation.

Deliverables:

* Module contract.
* Module registry.
* Finding schema.
* Better UI rendering.
* Developer docs.

## Month 3: Assessment Quality

Focus:

* Improve login detection accuracy.
* Improve authentication classification.
* Improve security header explanations.
* Add remediation text.
* Add evidence display.
* Add confidence scoring.
* Reduce false positives.

Deliverables:

* Better login detector.
* Better auth classifier.
* Better header scanner.
* Structured findings.
* Improved popup explanations.

## Month 4: Reporting and Labs

Focus:

* Add local-only report export.
* Add lab pages.
* Add secure and insecure examples.
* Add educational walkthroughs.
* Add secure login checklist.
* Add report templates.

Deliverables:

* Local JSON report.
* Local HTML or Markdown report.
* Fixture pages.
* Documentation for students.
* Secure login checklist.

## Month 5: UX, Accessibility, and Privacy Modules

Focus:

* Add secure UX checks.
* Add accessibility checks.
* Add passive privacy/resource checks.
* Improve popup design.
* Improve finding grouping.
* Add filtering by severity/category.

Deliverables:

* UX module.
* Accessibility module.
* Privacy signal module.
* Cleaner UI.
* Better educational explanations.

## Month 6: Stabilization and Public Quality

Focus:

* Testing.
* Documentation.
* Refactoring.
* Bug fixes.
* Release preparation.
* Contribution readiness.
* Browser compatibility notes.
* Demo material.

Deliverables:

* v0.1 release candidate.
* Complete README.
* Complete PROJECT.
* Complete ROADMAP.
* Complete SECURITY.
* Complete CONTRIBUTING.
* Demo screenshots.
* Example reports.
* Issue templates.

---

# 21. Daily Development Rule

This project is intended to be developed daily or near-daily.

Each development session should produce at least one of the following:

* A small code improvement.
* A documentation improvement.
* A test fixture.
* A bug fix.
* A UI improvement.
* A module improvement.
* A clearer finding.
* A safer boundary.
* A better example.
* A cleaned-up file.
* A GitHub issue.
* A commit.

Small consistent progress is preferred over large unfocused rewrites.

---

# 22. Suggested Daily Workflow

Use this workflow when returning to the project:

1. Read `PROJECT.md`.
2. Check `ROADMAP.md`.
3. Pick one small task.
4. Create or update an issue.
5. Make the change.
6. Test manually.
7. Update documentation if needed.
8. Commit with a clear message.
9. Write what changed in `CHANGELOG.md` if relevant.
10. Decide the next small task.

---

# 23. AI Assistant Usage Rule

When using ChatGPT, Claude, Copilot, or another AI assistant, provide the assistant with:

1. The GitHub repository link.
2. The current task.
3. The relevant files.
4. This `PROJECT.md`.
5. The safety boundaries.

AI assistants should treat `PROJECT.md` as the source of truth.

Do not ask an AI assistant to add offensive features.

Do not ask for hidden scanning, credential capture, exploit payloads, brute force, bypass logic, or phishing behavior.

Good AI prompt pattern:

```text
You are helping me develop LoginGuard.

Repository:
https://github.com/wsrakr/LoginGuard

Treat PROJECT.md as the source of truth.

Current task:
[describe one small task]

Rules:
- Defensive use only.
- Passive analysis only unless PROJECT.md explicitly allows otherwise.
- No credential collection.
- No form submission.
- No exploit payloads.
- No brute force.
- Keep code modular.
- Update documentation if needed.

Relevant files:
[paste files]
```

---

# 24. Coding Standards

LoginGuard code should be:

* Clear.
* Modular.
* Readable.
* Defensive.
* Easy to test.
* Easy to explain.
* Conservative in claims.
* Free from hidden behavior.

Prefer:

* Small functions.
* Clear names.
* Structured return objects.
* Comments where logic is subtle.
* Consistent module format.
* Explicit safety checks.

Avoid:

* Large unstructured files.
* Unclear magic values.
* Overconfident security claims.
* Hidden side effects.
* Unnecessary permissions.
* Remote dependencies without reason.
* Mixing UI, scanning logic, and risk logic in the same place.

---

# 25. Documentation Standards

Documentation should be beginner-friendly but technically correct.

Every major feature should explain:

* What it does.
* Why it exists.
* How it works at a high level.
* What it does not do.
* What the safety boundary is.
* How to test it.
* How to interpret results.

Documentation should avoid hype.

Preferred tone:

* Clear.
* Honest.
* Defensive.
* Educational.
* Practical.

---

# 26. UI/UX Direction

The popup UI should be clear and calm.

It should not scare users.

It should not claim a page is “safe” or “hacked.”

Suggested UI sections:

1. Page Summary
2. Authentication Detection
3. Security Headers
4. Findings
5. Recommendations
6. Export / Copy Report
7. Learning Notes

Suggested labels:

* Good
* Review
* Warning
* Not Observed
* Unknown
* Needs Attention

Avoid labels like:

* Hacked
* Exploitable
* Dangerous
* Critical
* Unsafe

unless strong evidence and careful wording exist.

---

# 27. Testing Philosophy

LoginGuard needs tests because login pages vary a lot.

Testing should include:

* Native form login pages.
* SPA login pages.
* Registration pages.
* Password reset pages.
* MFA pages.
* SSO pages.
* Pages with no login.
* Pages with misleading text.
* Pages with multiple forms.
* Pages with hidden fields.
* Pages with accessibility issues.
* Pages with different header combinations.

Fixtures should be local and safe.

---

# 28. Local Fixtures

The project should include local test pages.

Example fixture categories:

```text
fixtures/
|-- login-basic/
|-- login-no-form/
|-- login-spa/
|-- register-basic/
|-- password-reset/
|-- mfa-basic/
|-- sso-basic/
|-- no-login/
|-- weak-headers/
|-- good-headers/
`-- accessibility-cases/
```

Fixtures should not include real credentials.

Fixtures should not send data anywhere.

---

# 29. Report Design

Future reports should be local-only by default.

A report may include:

* Project name.
* Scan timestamp.
* Page URL.
* Browser context.
* Overall summary.
* Findings by category.
* Severity.
* Confidence.
* Evidence.
* Remediation.
* Safety note.
* Scope reminder.

A report should not include:

* Passwords.
* Tokens.
* Cookies.
* Session IDs.
* Full page HTML unless explicitly and safely handled.
* Sensitive form values.

---

# 30. Versioning Direction

Before a public release, LoginGuard can use internal milestone labels.

Suggested versions:

* `v0.0.x` early development
* `v0.1.0` first stable educational extension
* `v0.2.0` module system release
* `v0.3.0` reporting and labs release
* `v0.4.0` UX/accessibility/privacy modules
* `v1.0.0` mature defensive framework release

Do not rush `v1.0.0`.

---

# 31. GitHub Issue Strategy

Use GitHub Issues as the project task board.

Suggested labels:

* `type: feature`
* `type: bug`
* `type: docs`
* `type: refactor`
* `type: test`
* `type: ui`
* `type: security-boundary`
* `area: extension`
* `area: core`
* `area: module`
* `area: popup`
* `area: docs`
* `priority: low`
* `priority: medium`
* `priority: high`
* `good first issue`

Every issue should be small enough to complete in a focused session.

---

# 32. Commit Style

Use clear commit messages.

Examples:

```text
docs: expand project vision and safety boundaries
feat: add module registry skeleton
refactor: normalize login detector result format
fix: handle pages without document forms
test: add fixture for SPA login page
ui: improve findings layout in popup
```

---

# 33. Contribution Rules

Good contributions:

* Improve passive detection.
* Improve documentation.
* Improve tests.
* Improve fixtures.
* Improve UI clarity.
* Improve accessibility.
* Improve remediation guidance.
* Improve module architecture.
* Improve safety boundaries.

Rejected contribution types:

* Credential capture.
* Offensive payloads.
* Brute force logic.
* Form submission automation.
* Unauthorized scanning.
* Hidden network activity.
* Evasion logic.
* Phishing support.
* Exploit chains.

---

# 34. Ethical Use Statement

LoginGuard must only be used in authorized, defensive, educational, or research contexts.

Appropriate use cases:

* Reviewing your own application.
* Testing a local lab page.
* Assessing an internal system with permission.
* Learning secure authentication design.
* Teaching web security concepts.
* Preparing defensive documentation.

Inappropriate use cases:

* Testing random websites without permission.
* Attempting to bypass login systems.
* Collecting credentials.
* Automating attacks.
* Running scans outside authorized scope.
* Using findings to harm users or organizations.

---

# 35. Future Ideas Backlog

These are possible future ideas, not immediate tasks.

## Extension Features

* Finding detail pages.
* Copy summary button.
* Export JSON report.
* Export Markdown report.
* Export HTML report.
* Per-module enable/disable.
* Learning mode.
* Developer mode.
* Severity filters.
* Confidence filters.
* Module details panel.
* Local scan history with privacy controls.

## Module Ideas

* HTTPS checker.
* Security headers checker.
* Login form detector.
* Auth page classifier.
* MFA page detector.
* SSO detector.
* Password reset flow detector.
* Secure UX checker.
* Accessibility checker.
* Third-party resource signal checker.
* Password manager compatibility checker.
* Autocomplete attribute checker.
* Form label quality checker.
* Error message pattern checker.

## Documentation Ideas

* Architecture guide.
* Module authoring guide.
* Secure login checklist.
* Security header explanations.
* Authentication UX guide.
* Student lab guide.
* Local testing guide.
* Browser permissions guide.
* Report interpretation guide.

## Ecosystem Ideas

* Local demo site.
* Educational labs.
* CLI companion.
* Desktop dashboard.
* Browser compatibility layer.
* Teaching mode.
* Example secure login implementations.
* Example insecure login implementations for local labs only.

---

# 36. Near-Term Priority List

The next priorities should be:

1. Make the project identity clear.
2. Keep the extension stable.
3. Formalize module output.
4. Add severity and confidence model.
5. Improve popup rendering.
6. Add local test fixtures.
7. Add local-only report export.
8. Expand documentation.
9. Prepare a clean `v0.1.0` release.
10. Keep safety boundaries strict.

---

# 37. Decision Rule

When deciding whether to add a feature, ask:

1. Is it defensive?
2. Is it authorized-use only?
3. Is it passive by default?
4. Does it avoid collecting credentials?
5. Does it avoid form submission?
6. Does it avoid offensive payloads?
7. Does it help developers, students, or defenders?
8. Can it be explained clearly?
9. Can it be tested safely?
10. Does it fit the long-term LoginGuard ecosystem?

If the answer is no, do not add the feature.

---

# 38. Final Direction

LoginGuard should become a serious, clean, safe, educational, and modular authentication security assessment ecosystem.

The project should grow through disciplined daily progress.

The extension is the beginning.

The long-term value is the framework, the modules, the learning material, the reports, the fixtures, and the defensive mindset around authentication security.

Keep the project safe.

Keep the project useful.

Keep the project modular.

Keep `PROJECT.md` as the source of truth.
