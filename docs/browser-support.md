# Browser Support

LoginGuard currently targets Chrome as a Manifest V3 Chrome Extension. Chrome is the primary development and testing browser for the current prototype.

Firefox compatibility is planned because many pentesters, students, and lab users work in Firefox-based VM environments. Firefox support has not been fully tested yet, so LoginGuard should not be described as Firefox-supported until compatibility work is completed and documented.

Browser support work must preserve the LoginGuard safety model: Website Check remains passive and local-first, and Lab Mode remains restricted to local or explicitly authorized lab environments.

## Browser API adapter groundwork

LoginGuard now includes a small browser API adapter at `src/platform/browser-api.js`. It prefers the Promise-based `browser.*` namespace when available and falls back to Chrome's `chrome.*` namespace, wrapping callback-style operations in Promises.

The popup, persistent Lab Session, and background service worker use this adapter for low-risk extension operations such as:

- Querying and opening tabs.
- Sending runtime and tab messages.
- Executing the existing content-script bundle.
- Resolving extension resource URLs.
- Reading and writing the existing session storage snapshot.

This reduces direct coupling to Chrome-specific API syntax, but it does not make LoginGuard a supported Firefox extension by itself. Manifest behavior, API availability, background execution, clipboard access, content scripts, and all local fixture workflows still require explicit Firefox testing.

## Target browsers

| Browser | Status | Notes |
| --- | --- | --- |
| Chrome / Chromium-based browsers | Current primary target | Chrome is the main supported development browser today. Chromium-based browsers may work similarly, but behavior should be verified before making support claims. |
| Firefox | Planned compatibility target | Planned for lab users and VM-based workflows. Requires WebExtensions and Manifest compatibility testing. |
| Other browsers | Future consideration | No current support claim. Evaluate only after Chrome stability and Firefox groundwork are in place. |

## Compatibility principles

- Keep core scanning, reporting, finding, and Lab Mode planning logic browser-neutral where possible.
- Isolate browser-specific extension APIs behind small helpers or adapters when differences appear.
- Route supported tab, runtime, scripting, and storage operations through the browser API adapter.
- Avoid unnecessary Chrome-only APIs if a browser-neutral WebExtensions approach is practical.
- Preserve local-first and safety-first behavior across every supported browser.
- Do not add new permissions unless they are justified, documented, and reviewed for privacy impact.
- Keep Website Check passive by default.
- Keep Lab Mode local or explicitly authorized only.

## Firefox considerations

- Manifest compatibility may require Firefox-specific manifest settings.
- Firefox may use `browser_specific_settings.gecko` for extension metadata and compatibility.
- Some extension APIs and Manifest V3 behavior differ between Chrome and Firefox.
- Content script behavior must be tested on supported page types.
- Popup behavior must be tested, including scan rendering and clipboard copy flows.
- Tab APIs must be tested, especially opening the persistent Lab Session page.
- Clipboard behavior must be tested for JSON, Markdown, AI Analyst Prompt, and Lab report copy actions.
- Background behavior must be reviewed if future background logic expands.
- Lab Session should remain a persistent extension page if supported by the browser.
- Localhost lab fixtures should be part of Firefox testing.

## Firefox test checklist

Use this checklist only in local or authorized environments.

- Load the extension temporarily in Firefox.
- Open a localhost fixture, such as `http://localhost:8080/fixtures/login-basic/`.
- Run Website Check.
- Verify the popup summary is readable and accurate.
- Open Lab Session.
- Verify Lab Session remains open as a persistent extension page.
- Run Baseline Observation in an allowed local lab context.
- Copy JSON and Markdown Website Check reports.
- Copy Lab JSON and Markdown reports.
- Verify no forms are submitted.
- Verify no input values are read.
- Verify no credentials are collected.
- Verify technical details remain available.

## Support notes

Chrome remains the primary target until Firefox compatibility has been tested. Any future Firefox support claim should be backed by documented test results, known limitations, and a review of required manifest or API differences.
