# LoginGuard

LoginGuard is an open-source, browser-based security assessment framework for developers, students, and security researchers. It is inspired by professional security tooling, with a focus on authorized testing, defensive analysis, secure development, and education.

The project currently ships as a Chrome Extension built on Manifest V3. It analyzes only the active browser tab when the user opens the popup and keeps all analysis local to the browser.

## Project Vision

LoginGuard aims to help people understand the security posture of login surfaces before credentials are ever submitted. The long-term goal is to provide a modular browser-based framework for inspecting authentication pages, identifying risky implementation patterns, and teaching secure login design in a practical environment.

The project is intentionally defensive. It is designed for systems you own, administer, study in a lab, or have explicit permission to assess.

## Current Features

- Detects whether the current page is loaded over HTTPS.
- Displays the current page URL.
- Detects likely login forms on the active page.
- Detects visible username, email, and password fields.
- Detects likely submit buttons.
- Detects SPA-style login areas that do not use a native `<form>` tag.
- Classifies authentication pages as Login, Registration, Password Recovery, Password Reset, MFA / 2FA, SSO, or Unknown.
- Reports authentication confidence as a percentage.
- Lists detection reasons such as password fields, email fields, submit controls, and matching page titles.
- Checks common security headers when response headers are available.
- Shows Present / Missing status and short recommendations for missing security headers.
- Shows a simple security summary in the popup.
- Runs passive browser-based analysis from the current page.
- Avoids form submission, payload delivery, brute force behavior, and network requests.

## Roadmap

- Add structured assessment modules for authentication UI checks.
- Add clearer severity levels and remediation guidance.
- Add optional export of local findings for authorized reports.
- Add accessibility and secure UX checks for login pages.
- Add test fixtures for common login form patterns.
- Add browser compatibility notes for Chromium-based browsers.
- Add developer documentation for building custom defensive modules.

## Module System

LoginGuard is structured to support small, focused analysis modules. A module should inspect one area of the current page, return a clear finding, and avoid side effects.

Planned module principles:

- Read-only page inspection.
- No credential collection.
- No form submission.
- No background scanning of unrelated pages.
- No network activity unless a future feature clearly documents and gates it for authorized use.
- Findings should include practical remediation notes for developers.

## Extension Permissions

LoginGuard uses Manifest V3 permissions for passive current-page analysis:

- `activeTab`: lets the popup inspect the tab the user is actively viewing.
- `scripting`: injects read-only scanner modules after the user opens the popup.
- `webRequest`: observes completed main-frame response headers.
- `storage`: stores a short-lived per-tab security-header snapshot in `chrome.storage.session`.
- `http://*/*` and `https://*/*` host permissions: allow Chrome's `webRequest` API to expose response headers for regular web pages.

The Security Headers Scanner does not send requests, submit forms, inject payloads, or perform active attack attempts. Header capture is passive and limited to browser-observed main-frame responses.

Current module-like areas:

- `src/core/scanner.js`: Coordinates read-only assessment modules.
- `src/core/risk-engine.js`: Converts module results into a simple summary.
- `src/modules/auth/auth-classifier.js`: Authentication Classification module using passive signals from titles, headings, controls, links, labels, placeholders, inputs, and URL paths.
- `src/modules/headers/header-scanner.js`: Security Headers Scanner for common browser security headers and DOM-visible meta policy fallbacks.
- `src/modules/login/login-detector.js`: Login Detection Engine for native forms, SPA-style auth areas, credential fields, submit buttons, authentication page type, confidence scoring, and detection reasons.
- `src/modules/https/https-checker.js`: Checks the current page URL protocol.
- `src/utils/dom-utils.js`: Shared DOM helpers for module authors.
- `src/content/content.js`: Content-script bridge that runs analysis inside the active page.
- `src/popup/popup.js`: Popup controller that requests analysis and renders the summary.

## Ethical Use

Use LoginGuard only for authorized, defensive, educational, or research purposes. Appropriate use cases include:

- Reviewing your own application during development.
- Assessing an internal system with permission.
- Practicing secure development concepts in a lab.
- Teaching students how login form security signals can be inspected safely.

Do not use LoginGuard to attack, disrupt, probe, or evaluate third-party systems without permission. The project does not include offensive payloads, exploit instructions, credential capture, brute force workflows, or form-submission automation.

## Contributing

Contributions are welcome when they support the defensive mission of the project.

Good contributions include:

- New read-only analysis modules.
- Improved detection accuracy for login forms and fields.
- Tests and fixtures for real-world page patterns.
- Clear documentation and remediation guidance.
- Accessibility, privacy, and secure development improvements.

Contributions should avoid:

- Offensive payloads.
- Instructions for attacking third-party systems.
- Credential collection.
- Automated form submission.
- Brute force or evasion behavior.
- Hidden network requests.

## Planned Milestones

### Milestone 1: Extension Foundation

- Manifest V3 project structure.
- Popup UI.
- Content script bridge.
- DOM-only login form analysis.
- Basic HTTPS and field detection.

### Milestone 2: Assessment Quality

- Stronger form classification.
- Finding severity model.
- Developer-focused remediation text.
- Unit tests for DOM analysis helpers.

### Milestone 3: Modular Framework

- Formal module interface.
- Module registry.
- Independent module result rendering.
- Documentation for writing defensive modules.

### Milestone 4: Reporting and Education

- Local-only report generation.
- Example lab pages.
- Secure login checklist.
- Educational walkthroughs for students and new developers.

## Project Structure

```text
.
|-- manifest.json
|-- assets/
|   `-- icons/
|       |-- loginguard.svg
|       `-- README.md
|-- docs/
|   `-- README.md
`-- src/
    |-- background/
    |   `-- background.js
    |-- content/
    |   `-- content.js
    |-- core/
    |   |-- risk-engine.js
    |   `-- scanner.js
    |-- modules/
    |   |-- auth/
    |   |   `-- auth-classifier.js
    |   |-- headers/
    |   |   `-- header-scanner.js
    |   |-- https/
    |   |   `-- https-checker.js
    |   `-- login/
    |       `-- login-detector.js
    |-- popup/
    |   |-- popup.css
    |   |-- popup.html
    |   `-- popup.js
    `-- utils/
        `-- dom-utils.js
```

## Local Installation

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select this project folder.
5. Open any HTTP or HTTPS page you are authorized to assess.
6. Click the LoginGuard extension icon.

## Safety Boundaries

This first version does not submit forms, send payloads, perform brute force, or make network requests. It only reads DOM metadata from the active page after the user opens the popup.
