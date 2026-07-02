# LoginGuard

**LoginGuard** is a defensive, local-first browser security assessment project for understanding authentication pages.

It currently ships as a **Manifest V3 Chrome Extension**. The extension analyzes the currently opened page after the user opens the popup and explains browser-visible authentication and security signals without attacking the site.

LoginGuard's motto is:

> Analyze. Explain. Improve. Never Attack.

`PROJECT.md` is the source of truth for project direction, safety boundaries, architecture decisions, and future development.

## What LoginGuard Is

LoginGuard is:

- A defensive browser security tool.
- A beginner-friendly educational project.
- A Chrome Extension for passive authentication-surface review.
- A modular foundation for future security assessment modules.
- An open-source project for authorized, ethical use.

The long-term direction is a defensive authentication-surface security assessment ecosystem. The Chrome Extension is the first product layer.

## Current Status

LoginGuard is in early development. The current implementation focuses on passive inspection of the active browser tab and a simple popup UI for findings.

The project does not guarantee that a page is secure. It highlights visible signals and gives explanations that can help developers and learners review authentication pages more carefully.

## Current Features

- Displays the current page URL.
- Checks whether the page is loaded over HTTPS.
- Detects likely login forms and authentication areas.
- Detects username, email, password, and submit controls.
- Detects SPA-style authentication areas without a native `<form>` tag.
- Classifies authentication pages as Login, Registration, Password Recovery, Password Reset, MFA / 2FA, SSO, or Unknown.
- Shows classification confidence and reasons.
- Checks common security headers when browser-observed response headers are available.
- Displays Present / Missing status for supported security headers.
- Provides short recommendations for missing security headers.
- Copies a local JSON report from the current popup analysis result.
- Runs locally from the browser extension popup.

## What LoginGuard Does Not Do

LoginGuard does not:

- Attack websites.
- Submit forms.
- Collect credentials.
- Store secrets.
- Send payloads.
- Perform brute force.
- Perform credential stuffing.
- Exfiltrate user data.
- Crawl websites in the background.
- Claim that a page is definitely secure or insecure.

## Safety and Authorized Use

Use LoginGuard only on pages you own, administer, study in a lab, or have explicit permission to assess.

LoginGuard is designed for defensive analysis, secure development, education, and authorized research. It should not be used to test third-party systems without permission.

## Install for Chrome Extension Development

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the LoginGuard project folder.
6. Open an HTTP or HTTPS page you are authorized to inspect.
7. Click the LoginGuard extension icon.

After reloading the extension, refresh the inspected page before opening the popup if you want browser-observed response headers to be available.

## Repository Structure

```text
.
|-- manifest.json
|-- README.md
|-- PROJECT.md
|-- ROADMAP.md
|-- SECURITY.md
|-- CONTRIBUTING.md
|-- CHANGELOG.md
|-- assets/
|   `-- icons/
|-- docs/
|-- src/
|   |-- background/
|   |-- content/
|   |-- core/
|   |-- modules/
|   |   |-- auth/
|   |   |-- headers/
|   |   |-- https/
|   |   `-- login/
|   |-- popup/
|   `-- utils/
`-- .github/
```

## Project Direction

For the full project constitution, safety rules, architecture principles, and AI development guidance, read [PROJECT.md](PROJECT.md).

For planned milestones and future direction, read [ROADMAP.md](ROADMAP.md).

For details about the local JSON report format, read [docs/json-report.md](docs/json-report.md).

For a product-demo style local fixture report, read [docs/demo-report.md](docs/demo-report.md).

For the current preview-only Lab Mode boundaries, read [docs/lab-mode.md](docs/lab-mode.md).

Future work is expected to remain defensive and local-first. Planned areas include cookie analysis, improved risk scoring, recommendations, report export, plugin architecture, CLI tooling, and a web dashboard.

## Contributing

Contributions are welcome when they support LoginGuard's defensive mission.

Good contributions include documentation, safer detection logic, clearer explanations, UI improvements, tests, local fixtures, and modular architecture improvements.

Before contributing, read:

- [PROJECT.md](PROJECT.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)

Do not contribute offensive payloads, credential collection, brute-force workflows, phishing support, hidden telemetry, or unauthorized scanning behavior.
