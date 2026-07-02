# Lab Mode

Lab Mode is a future-oriented LoginGuard concept for safe local and authorized lab learning. The current implementation is **preview-only**: it creates a local test plan preview in the popup, but it does not execute the planned tests.

LoginGuard remains passive by default. Passive Mode is the normal extension behavior and is the core safety model for the project.

## Passive Mode vs Lab Mode

| Mode | Purpose | Current Behavior |
| --- | --- | --- |
| Passive Mode | Inspect the current page locally and explain browser-visible authentication and security signals. | Runs passive DOM and URL analysis. It does not submit forms, collect credentials, or run payloads. |
| Lab Mode Preview | Show whether a page is an approved local lab context and describe possible future lab test categories. | Creates a safe local test plan preview only. It does not submit forms or execute tests. |

Passive Mode is the default. Lab Mode must remain separate from Passive Mode in implementation, UI, documentation, and safety controls.

## Current Scope

Current Lab Mode only checks whether the active page is an approved local lab context and builds a preview object from safe page metadata.

It is intended for:

- Local fixtures.
- Local training pages.
- CTF-style learning environments running locally.
- Intentionally vulnerable applications used in an authorized lab.

It is not intended for public websites or third-party systems.

## Allowed Contexts

Lab Mode Preview may be allowed only for HTTP or HTTPS pages using:

- `localhost`
- `127.0.0.1`
- `::1`
- hosts ending in `.localhost`

Examples:

- `http://localhost:8080/fixtures/login-basic/`
- `http://127.0.0.1:8080/`
- `http://app.localhost:8080/`

## Refused Contexts

Lab Mode Preview refuses contexts such as:

- Normal public websites.
- Missing or malformed URLs.
- Unsupported protocols.
- `file://` pages.

This refusal behavior is intentional. Lab Mode should not run on normal public websites.

## What The Preview Shows

The popup Lab Mode Preview shows:

- Allowed or refused status.
- Reason.
- Detected form count.
- Detected input count.
- Planned test categories.
- Safety note.

Planned categories are descriptive labels only. They are not executed by the current implementation.

Example planned categories may include:

- `baseline-submit-observation`
- `empty-fields-observation`
- `invalid-synthetic-credentials-observation`
- `response-message-comparison`

These names describe future observation categories for local labs. They are not payloads and they are not attack instructions.

## What Lab Mode Preview Does Not Do

Lab Mode Preview does not:

- Submit forms.
- Run payloads.
- Collect credentials.
- Read input values.
- Store real field values.
- Perform brute force.
- Perform password spraying.
- Bypass MFA.
- Bypass CAPTCHA.
- Send hidden network requests.
- Attack third-party websites.

## Example: Local Fixture

Start a local static server from the repository root:

```powershell
python -m http.server 8080
```

Open:

```text
http://localhost:8080/fixtures/login-basic/
```

Then open the LoginGuard extension popup.

Expected Lab Mode Preview behavior:

| Field | Expected Result |
| --- | --- |
| Lab Mode status | Allowed |
| Reason | The page uses an approved local lab host. |
| Detected forms | One or more, depending on the fixture. |
| Detected inputs | Authentication-like inputs detected from metadata only. |
| Planned categories | Descriptive planned categories only. |
| Safety note | No forms were submitted and no credentials were collected. |

Do not enter real credentials into fixture pages.

## Safety Boundary

Lab Mode Preview is for safe CTF and local lab learning only. It does not prove that a page is secure, and it should not be used as a workflow for testing third-party systems without permission.

Future Lab Mode work must remain aligned with `PROJECT.md`: local or explicitly authorized lab contexts only, clear user enablement, no real credential storage, no brute force, no bypass logic, and no public-site attack automation.
