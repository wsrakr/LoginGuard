# LoginGuard — Authentication Surface Security Reporting

**LoginGuard** is a browser-based authentication surface analysis and reporting prototype for developers, students, security researchers, and future team/business monitoring workflows.

It currently ships as a **Manifest V3 Chrome Extension**. The extension analyzes the currently opened page after the user opens the popup and explains browser-visible authentication and security signals without attacking the site.

LoginGuard is defensive, passive by default, and local-first. It does not prove that a page is secure. It helps users understand what the browser can observe and what should be reviewed before an authentication surface is deployed.

> Analyze. Explain. Improve. Never Attack.

`PROJECT.md` is the source of truth for project direction, safety boundaries, architecture decisions, and future development.

## Current Prototype Features

- Passive current-page analysis.
- Login and authentication surface detection.
- Authentication type classification.
- HTTPS and local development context handling.
- Security header findings.
- Normalized findings.
- Popup findings view.
- Copy JSON Report.
- Copy Markdown Report.
- Local fixtures for manual testing.
- Lab Mode Preview for local/authorized lab contexts.

## Modes

### Passive Mode

Passive Mode is the default public behavior.

It analyzes the currently opened page locally and displays authentication, transport, header, risk, and finding summaries. Passive Mode does not submit forms, collect credentials, run payloads, brute force, or send hidden network requests.

### Lab Mode Preview

Lab Mode Preview is a local/authorized lab-only preview. It checks whether the page is an approved lab context, such as `localhost`, `127.0.0.1`, `::1`, or a `.localhost` host, and shows a safe planned test preview.

The current Lab Mode Preview does not execute tests, submit forms, read input values, or collect credentials.

## Reporting

LoginGuard can copy local reports from the popup:

- **JSON report:** structured data for developer notes, issue tracking, or future tooling.
- **Markdown report:** readable report for sharing with developers, students, or internal teams.
- **AI Analyst Prompt:** local prompt text for optional defensive analysis in an AI assistant.
- **Demo report:** see [docs/demo-report.md](docs/demo-report.md) for a product-demo style report generated from a local fixture.

Reports are generated locally from the current analysis result and copied to the clipboard. LoginGuard does not send report data anywhere and does not store reports automatically.

Reports do not include credentials, cookies, tokens, page HTML, storage contents, or form values.

## Product Vision

LoginGuard starts as a public Chrome Extension, but the long-term direction is a defensive authentication-surface reporting ecosystem.

| Layer | Direction |
| --- | --- |
| Public Extension | Quick single-page authentication surface analysis and local reporting. |
| Business Monitoring | Future authorized domain inventory, one-time scans, scheduled scans, change detection, history, and team-friendly reports. |
| AI Analyst | Future report explanation, risk prioritization, developer task generation, executive summaries, and safe remediation guidance. |
| Fix Assistant | Future reviewed suggestions for defensive configuration and code hardening. |
| Lab Mode | Local/CTF/lab learning layer separated from public/business passive scanning. |

LoginGuard should help users and organizations understand, monitor, explain, and improve authentication security without becoming a general-purpose attack platform.

## Safety Boundaries

LoginGuard does not:

- Collect credentials.
- Submit forms in Passive Mode.
- Perform brute force.
- Perform password spraying.
- Automate attacks against public websites.
- Run exploit payloads.
- Bypass MFA or CAPTCHA.
- Send hidden network requests.
- Claim that a page is definitely secure.

Lab Mode is restricted to local or explicitly authorized lab contexts and remains separated from public/business passive scanning.

## Quick Start

1. Clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Choose the LoginGuard project folder.
6. From the repository root, serve the fixtures locally:

```powershell
py -m http.server 8080
```

7. Open the local demo fixture:

```text
http://localhost:8080/fixtures/login-basic/
```

8. Click the LoginGuard extension icon.

After reloading the extension, refresh the inspected page before opening the popup if you want browser-observed response headers to be available.

## Project Documentation

- [PROJECT.md](PROJECT.md) — project constitution, architecture direction, safety boundaries, and AI development guidance.
- [ROADMAP.md](ROADMAP.md) — practical development phases and future product direction.
- [SECURITY.md](SECURITY.md) — security policy, responsible disclosure, and authorized-use boundaries.
- [CHANGELOG.md](CHANGELOG.md) — prototype milestone history.
- [docs/lab-mode.md](docs/lab-mode.md) — Lab Mode Preview scope and restrictions.
- [docs/json-report.md](docs/json-report.md) — local JSON report format.
- [docs/ai-analyst-prompt.md](docs/ai-analyst-prompt.md) — local AI Analyst Prompt behavior and safety boundaries.
- [docs/manual-test-matrix.md](docs/manual-test-matrix.md) — manual fixture testing notes.
- [docs/demo-report.md](docs/demo-report.md) — product-demo style local fixture report.

## Repository Structure

```text
.
|-- manifest.json
|-- README.md
|-- PROJECT.md
|-- ROADMAP.md
|-- SECURITY.md
|-- assets/
|   `-- icons/
|-- docs/
|-- fixtures/
|-- src/
|   |-- background/
|   |-- content/
|   |-- core/
|   |-- lab/
|   |-- modules/
|   |-- popup/
|   `-- utils/
`-- .github/
```

## Contributing

Contributions are welcome when they support LoginGuard's defensive mission.

Good contributions include safer detection logic, clearer explanations, documentation, local fixtures, accessibility improvements, UI polish, tests, and modular architecture improvements.

Do not contribute offensive payloads, credential collection, brute-force workflows, phishing support, hidden telemetry, or unauthorized scanning behavior.
