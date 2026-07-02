# LoginGuard Local Fixtures

These pages are local, static test fixtures for manually checking LoginGuard detection behavior.

They are intentionally safe:

- They do not authenticate users.
- They do not collect credentials.
- They do not send form data to external servers.
- They do not load external scripts, styles, images, or trackers.
- They are for defensive testing and education only.

## How to Use

1. Open Chrome.
2. Load the LoginGuard extension in `chrome://extensions`.
3. Open one of the fixture `index.html` files directly in the browser.
4. Click the LoginGuard extension icon.
5. Compare the popup result with the fixture's intended page type.

These fixtures are designed for local manual testing only. Do not enter real credentials into any fixture page.

## Fixture Pages

| Fixture | Purpose |
| --- | --- |
| `login-basic/` | Native form login page with email and password fields. |
| `login-spa/` | SPA-style login area without a traditional `<form>` tag. |
| `register-basic/` | Registration page with name, email, password, and confirm password fields. |
| `password-reset/` | Password reset request page with email field only. |
| `mfa-basic/` | Two-factor verification page with code field. |
| `no-login/` | Informational page with no authentication fields. |
