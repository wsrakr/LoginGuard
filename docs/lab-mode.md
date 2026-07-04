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

## Execution Guard

LoginGuard includes a Lab Mode execution guard as a future-safety layer. The guard evaluates whether a Lab Mode plan would be eligible for future controlled execution, but it does not execute tests.

The guard refuses execution readiness when:

- No Lab Mode plan is available.
- The Lab Mode plan is refused.
- The plan URL is missing.
- The URL is not an approved local lab context.
- No planned test categories are available.
- A category is not currently approved for future execution.

For now, only these future-safe categories may pass readiness:

- `baseline-submit-observation`
- `empty-fields-observation`
- `response-message-comparison`

The category `invalid-synthetic-credentials-observation` remains blocked until it receives additional review. This guard does not submit forms, run tests, read input values, or send network requests.

## Execution Result Helpers

LoginGuard also includes a Lab Mode execution result helper for future reporting work. The helper creates structured result records from execution readiness decisions, but it does not execute tests.

The initial helper can create result records with these statuses:

- `planned`
- `blocked`
- `skipped`
- `error`

There is intentionally no `executed` status yet. `buildInitialExecutionResults` records allowed categories as planned and blocked categories as blocked so future Lab reports can describe readiness decisions without running anything.

Execution result records do not include input values, credentials, cookies, tokens, storage contents, or page HTML.

## Baseline Observation Planning

LoginGuard includes a baseline observation planner for future local Lab Mode reporting. This planner creates a safe plan from the existing Lab Mode plan and execution readiness metadata, but it does not execute the plan.

The baseline planner can return:

- `planned` when Lab Mode is allowed, execution readiness is allowed, the `baseline-submit-observation` category is approved, and at least one detected form is available.
- `blocked` when Lab Mode or execution readiness does not allow the category.
- `skipped` when there is no detected form metadata to plan against.

The planner records only safe form metadata:

- Form index.
- Method.
- Whether an action attribute is present.
- Input count.
- Authentication-like input count.
- Whether a password field was detected.

It may list descriptive observation names such as `current-url-before-action`, `form-method-and-action-presence`, `auth-like-input-metadata`, and `submit-control-presence-if-available`. These are labels for future reporting only. The planner does not submit forms, create test inputs, read input values, run payloads, or send network requests.

## Execution Confirmation Gate

LoginGuard includes a Safe Execution Confirmation Gate for future Lab Mode execution work. The gate is a decision helper only. It does not execute tests, submit forms, read input values, or create synthetic inputs.

The confirmation gate may allow the `baseline-submit-observation` category only when all of these conditions are true:

- The user has explicitly confirmed.
- The Lab Mode plan exists and is allowed.
- Execution readiness exists and is allowed.
- A baseline observation plan exists.
- The baseline observation plan status is `planned`.
- `baseline-submit-observation` appears in the readiness allowed categories.

If any condition is missing, the gate returns `allowed: false`. This layer exists so future Lab Mode execution cannot be introduced without explicit user confirmation and the earlier local-only safety checks.

## Lab Mode Reports

Lab Mode Preview can copy local reports from the current Lab Mode test plan:

- **Copy Lab JSON Report**
- **Copy Lab Markdown Report**

These reports are generated locally from the existing Lab Mode plan shown in the popup. LoginGuard does not send Lab reports anywhere and does not store them automatically.

Current Lab Mode does not execute tests yet. The `executedTests` field is intentionally empty by design.

Lab reports may include safe metadata already present in the Lab Mode plan:

- Allowed or refused status.
- URL.
- Reason.
- Detected form metadata.
- Detected input metadata.
- Planned test categories.
- `executedTests`.
- Safety note.

Lab reports do not include:

- Input values.
- Credentials.
- Cookies.
- Tokens.
- Storage contents.
- Page HTML.

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
