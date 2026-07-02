# Manual Test Matrix

## Purpose

This document records manual LoginGuard checks against the local HTML fixtures in `fixtures/`. The goal is to verify authentication detection, authentication classification, field counts, and basic page security signals in a controlled local environment.

These tests are defensive and passive. They are intended to validate LoginGuard behavior using local pages only.

## Test Environment

| Item | Value |
| --- | --- |
| Target pages | Local fixtures under `fixtures/` |
| Base URL | `http://localhost:8080/fixtures/` |
| Browser context | Chrome with LoginGuard loaded in extension development mode |
| Test type | Manual popup inspection |
| Network scope | Localhost only |

Tests were run against localhost fixtures.

## How to Serve Fixtures Locally

From the repository root, serve the project folder with a local static server. One simple option is:

```powershell
python -m http.server 8080
```

Then open the fixture URLs listed below in Chrome and click the LoginGuard extension icon.

Do not enter real credentials into fixture pages.

## Fixture URLs

| Fixture | URL |
| --- | --- |
| login-basic | `http://localhost:8080/fixtures/login-basic/` |
| login-spa | `http://localhost:8080/fixtures/login-spa/` |
| register-basic | `http://localhost:8080/fixtures/register-basic/` |
| password-reset | `http://localhost:8080/fixtures/password-reset/` |
| mfa-basic | `http://localhost:8080/fixtures/mfa-basic/` |
| no-login | `http://localhost:8080/fixtures/no-login/` |

## Expected Results

| Fixture | Expected Result |
| --- | --- |
| login-basic | Should be detected as Login. |
| login-spa | Should be detected as Login. |
| register-basic | Should be detected as Registration. |
| password-reset | Should be detected as Password Reset. |
| mfa-basic | Should be detected as MFA / 2FA. |
| no-login | Should not be detected as an auth page. |

## Observed Results

| Fixture | URL | HTTPS | Auth Page | Auth Type | Class Confidence | Fields |
| --- | --- | --- | --- | --- | --- | --- |
| login-basic | `http://localhost:8080/fixtures/login-basic/` | Not HTTPS | Yes | Login | High (100%) | 1 / 1 |
| login-spa | `http://localhost:8080/fixtures/login-spa/` | Not HTTPS | Yes | Login | High (100%) | 1 / 1 |
| register-basic | `http://localhost:8080/fixtures/register-basic/` | Not HTTPS | Yes | Registration | High (100%) | 2 / 1 |
| password-reset | `http://localhost:8080/fixtures/password-reset/` | Not HTTPS | Yes | Password Reset | High (98%) | 0 / 1 |
| mfa-basic | `http://localhost:8080/fixtures/mfa-basic/` | Not HTTPS | Yes | MFA / 2FA | High (100%) | 0 / 0 |
| no-login | `http://localhost:8080/fixtures/no-login/` | Not HTTPS | No | Unknown | Low (20%) | 0 / 0 |

## Localhost HTTP and Security Headers Notes

These fixtures are served over `http://localhost:8080`, so LoginGuard correctly reports `HTTPS: Not HTTPS`.

LoginGuard now detects `localhost` as a local development context. HTTP on localhost is still shown as `Not HTTPS`, but the finding text is softer than it would be for a real production HTTP login page.

Observed finding text for `login-basic`:

> The page is using HTTP in a local development context.

This is expected for the local manual test setup. The result does not imply that localhost fixtures are production-ready authentication pages.

Real non-local HTTP authentication pages should still be treated as higher risk because credentials entered over non-local HTTP may be exposed in transit.

Security headers may appear missing during fixture tests because the basic local static server does not set production browser security headers such as:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Missing security headers are expected in this local fixture environment unless the local server is configured to add them. LoginGuard still shows these missing header findings so developers can see what would matter in deployment, but localhost fixture findings are treated as lower severity local development findings.

Real deployed authentication pages should still include appropriate production security headers. Local fixture results should not be used as proof that a production authentication surface is secure.

## Safety Note

No forms were submitted during these tests.

No real credentials were entered.

No data left the page.

The fixtures are static local HTML pages and do not authenticate users, collect credentials, send network requests, or load external assets.

## Next Testing Goals

- Add a repeatable manual checklist for each fixture.
- Add screenshots of expected popup states.
- Add fixtures for security header combinations.
- Add fixtures for ambiguous authentication pages to evaluate false positives.
- Add accessibility-focused authentication fixtures.
- Add a local report fixture once report export exists.
