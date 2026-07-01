# Security Policy

LoginGuard is a defensive, authorized-use, passive-by-default browser security project. This policy explains how to report vulnerabilities in LoginGuard itself and defines the boundaries for safe, responsible use.

LoginGuard must not be used to test third-party systems without permission. Reports should focus on the LoginGuard project, its extension code, documentation, packaging, permissions, or project infrastructure.

## Supported Versions

LoginGuard is currently in early development and has not reached a stable `v1.0` release.

| Version | Supported |
| --- | --- |
| `main` branch | Yes |
| Published releases before `v1.0` | Best effort |
| Forks or modified builds | Not officially supported |

Security fixes are handled on the main development line until a formal release process is established.

## Reporting a Vulnerability

Please report vulnerabilities in LoginGuard privately when possible.

Preferred reporting process:

1. Open a private security advisory on GitHub if available.
2. If private advisories are not available, open a public issue requesting a private reporting channel, but do not include sensitive details.
3. Include enough information for maintainers to understand and reproduce the issue safely.

Helpful report details:

- Affected file, feature, or version.
- Clear description of the issue.
- Local reproduction steps using LoginGuard itself.
- Expected behavior.
- Actual behavior.
- Security or privacy impact.
- Suggested fix, if known.

Do not include real credentials, session tokens, private user data, or data from systems you are not authorized to assess.

## Authorized Use Only

LoginGuard is intended for:

- Reviewing applications you own.
- Assessing internal systems with permission.
- Learning secure authentication design in a local lab.
- Teaching defensive browser security concepts.
- Performing authorized research within an explicit scope.

Using LoginGuard on third-party systems without permission is outside the project boundaries.

## In Scope

Security reports are in scope when they relate to LoginGuard itself, such as:

- Extension permission misuse.
- Unintended data collection or storage.
- Exposure of sensitive data by LoginGuard.
- Unsafe handling of page data inside the extension.
- Bugs that cause LoginGuard to modify target pages unexpectedly.
- Cross-extension or extension UI security issues.
- Documentation that incorrectly encourages unsafe usage.
- Supply-chain or packaging concerns in the LoginGuard repository.

Safe local proof-of-concept pages are welcome when they help demonstrate a LoginGuard issue without involving third-party systems or real user data.

## Out-of-Scope Use

The following are out of scope and should not be reported as LoginGuard vulnerabilities:

- Testing random third-party websites without permission.
- Attempting to bypass authentication.
- Credential collection or credential stuffing.
- Brute force or password spraying workflows.
- Exploit payload delivery.
- Phishing workflows.
- Hidden scanning or background crawling.
- Attempts to extract secrets from users or third-party systems.
- Reports that depend on attacking a site rather than demonstrating a LoginGuard issue.

Do not submit offensive instructions, exploit payloads, bypass guidance, or third-party target data in reports.

## Data and Privacy Expectations

LoginGuard is designed to analyze the currently opened page locally and passively.

Security reports should preserve that model:

- Do not include passwords.
- Do not include tokens.
- Do not include cookies or session identifiers.
- Do not include private page content from systems you do not own.
- Redact screenshots when they contain sensitive data.
- Prefer local fixture pages for reproduction.

If a report involves data handling, explain what data LoginGuard accessed, why that access is concerning, and how the behavior can be reduced or removed.

## Project Safety Boundaries

LoginGuard must not include:

- Form submission automation.
- Credential capture.
- Secret storage.
- Data exfiltration.
- Brute force logic.
- Credential stuffing logic.
- Offensive payloads.
- Authentication bypass logic.
- Hidden telemetry.
- Unauthorized scanning.
- Destructive page modification.

Expected behavior is passive, local, user-initiated analysis of the currently opened page.

## Response Expectations

Maintainers will aim to:

- Acknowledge valid security reports promptly.
- Ask clarifying questions when needed.
- Confirm whether the issue is in scope.
- Prioritize fixes based on security and privacy impact.
- Avoid public disclosure of sensitive details until a fix or mitigation is ready.
- Credit reporters when appropriate and requested.
- Document meaningful fixes in `CHANGELOG.md` or release notes.

This is an open-source project, so response times may vary. Reports that are clear, scoped, reproducible, and aligned with the authorized-use model are easier to triage quickly.
