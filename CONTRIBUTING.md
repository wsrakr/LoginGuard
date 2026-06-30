# Contributing to LoginGuard

Thanks for your interest in contributing to LoginGuard. This project is an open-source, defensive, educational, and authorized security assessment tool for browser-based analysis.

## Project Scope

LoginGuard accepts contributions that help developers, students, and security researchers understand authentication pages safely.

Good contributions include:

- Passive DOM analysis modules.
- Better authentication page classification.
- Clear remediation guidance.
- Tests and examples for safe local pages.
- Documentation improvements.
- Accessibility, privacy, and UI improvements.

Out of scope:

- Offensive payloads.
- Unauthorized testing workflows.
- Credential capture.
- Brute force features.
- Form submission automation.
- Hidden network requests.
- Evasion or stealth behavior.

## Getting Started

1. Read `README.md` to understand the project goals and safety boundaries.
2. Open an issue before large changes so maintainers can help shape the work.
3. Keep changes focused and easy to review.
4. Use clear names and short comments where the code is not obvious.
5. Test the extension locally from `chrome://extensions` using pages you own or are authorized to assess.

## Development Guidelines

- Keep modules read-only unless a future design explicitly documents otherwise.
- Do not collect user-entered values.
- Do not submit forms.
- Do not inject payloads.
- Do not make network requests from assessment modules.
- Prefer small, composable modules under `src/modules/`.
- Return structured results with `type`, `confidence`, `score`, and `reasons` where practical.

## Pull Requests

Before opening a pull request:

- Confirm the extension still loads in Chrome.
- Run JavaScript syntax checks for changed files when possible.
- Update documentation if behavior or structure changes.
- Explain the security and privacy impact of the change.
- Include screenshots for popup UI changes when helpful.

## Beginner-Friendly Contributions

New contributors are welcome. Good first issues include documentation fixes, detection reason wording, small UI improvements, and test fixtures for local demo pages.

If you are unsure whether an idea fits LoginGuard, open a feature request first and describe the defensive use case.
