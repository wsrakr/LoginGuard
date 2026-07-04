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

## Safe Execution Confirmation Gate

LoginGuard includes a Safe Execution Confirmation Gate for future Lab Mode execution work. The gate is a decision helper only. It does not execute tests, submit forms, read input values, or create synthetic inputs.

The confirmation gate may allow the `baseline-submit-observation` category only when all of these conditions are true:

- The user has explicitly confirmed.
- The Lab Mode plan exists and is allowed.
- Execution readiness exists and is allowed.
- A baseline observation plan exists.
- The baseline observation plan status is `planned`.
- `baseline-submit-observation` appears in the readiness allowed categories.

If any condition is missing, the gate returns `allowed: false`. Even when the page is an allowed local lab context, execution readiness passes, and a baseline observation plan exists, Lab Mode still refuses future execution unless the user explicitly confirms.

The current popup preview evaluates the gate with `userConfirmed: false`, so the expected confirmation status is:

| Field | Current Preview Value |
| --- | --- |
| Confirmed | No |
| Allowed | No |
| Reason | Execution confirmation is refused because the user has not explicitly confirmed. |

The confirmation gate does not:

- Submit forms.
- Execute tests.
- Read input values.
- Collect credentials.
- Run payloads.

This layer exists so future Lab Mode execution cannot be introduced without explicit user confirmation and the earlier local-only safety checks.

## Baseline Observation Executor v0

LoginGuard includes Baseline Observation Executor v0 for local Lab Mode pages. This is the first controlled Lab Mode executor, and it is intentionally limited to safe metadata observation.

The executor may run only after:

- The page is an approved local lab context.
- Execution readiness allows `baseline-submit-observation`.
- A baseline observation plan exists with status `planned`.
- The Safe Execution Confirmation Gate allows the action.
- The popup sends an explicit `userConfirmed: true` request.

Baseline Observation Executor v0 records only safe observations:

- Current URL before observation.
- Total form count.
- Target form count.
- Form method and action presence.
- Authentication-like input metadata count.
- Submit-control presence when observable.

It does not:

- Submit forms.
- Trigger clicks.
- Dispatch submit events.
- Create synthetic input values.
- Read input values.
- Collect credentials.
- Run payloads.
- Read cookies, tokens, storage contents, page HTML, or response bodies.

If the executor runs, Lab reports may include the metadata-only result under `executedTests`. If no baseline observation has been run, `executedTests` remains empty and reports state that no Lab Mode baseline observation has been run yet.

When `executedTests` is empty, the report safety note describes a local test plan only. When `executedTests` contains an approved metadata-only baseline observation result, the report safety note explains that the report includes metadata-only observations and that no forms were submitted, no input values were read, and no credentials were collected.

## Lab Mode Reports

Lab Mode Preview can copy local reports from the current Lab Mode test plan:

- **Copy Lab JSON Report**
- **Copy Lab Markdown Report**

These reports are generated locally from the existing Lab Mode plan shown in the popup. LoginGuard does not send Lab reports anywhere and does not store them automatically.

Current Lab Mode does not perform full active testing. The `executedTests` field is empty until the user runs the approved Baseline Observation Executor v0, which records metadata-only observations.

Lab reports may include safe metadata already present in the Lab Mode plan:

- Allowed or refused status.
- URL.
- Reason.
- Detected form metadata.
- Detected input metadata.
- Planned test categories.
- `executedTests` containing metadata-only baseline observation results, when run.
- Safety note.

Lab reports do not include:

- Input values.
- Credentials.
- Cookies.
- Tokens.
- Storage contents.
- Page HTML.

## Persistent Lab Session Page

Chrome extension popups close when focus changes, such as when a user switches back to another tab to paste a report. LoginGuard includes a persistent Lab Session page for Lab Mode work that should remain visible while the user changes focus.

The popup provides an **Open Lab Session** button. It opens `src/lab/lab-session.html` as a normal Chrome extension tab with `chrome.tabs.create`, so the Lab Session remains open after the popup closes or focus changes. The page can show:

- Current target URL.
- Lab Mode status.
- Detected form and input counts.
- Planned test categories.
- Execution readiness.
- Baseline observation plan.
- Execution confirmation status.
- Latest metadata-only baseline observation result, if run.
- Lab JSON and Markdown report copy actions.

The Lab Session page uses the same safe message flow as the popup. It does not store credentials, cookies, tokens, form values, page HTML, or storage contents. The latest metadata-only result may remain in page memory while the Lab Session tab is open.

If no supported local lab target is available, the page shows: `Open a local lab fixture tab first, then return to this Lab Session page.`

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
