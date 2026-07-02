# LoginGuard Demo Report

This is an example LoginGuard report generated from the local fixture:

```text
http://localhost:8080/fixtures/login-basic/
```

This report is for product demonstration and documentation purposes only. It uses a local static fixture, not a production authentication system. It does not prove that any page is secure.

Generated: Example report  
URL: `http://localhost:8080/fixtures/login-basic/`  
Origin: `http://localhost:8080`

## Executive Summary

LoginGuard classified this local fixture as a **Login** page with **High** classification confidence. The page is served from `localhost`, so the HTTP transport and missing security headers are interpreted as local development findings rather than production deployment findings.

This report is useful for demonstrating how LoginGuard explains authentication surface signals, transport context, field counts, and defensive recommendations. Real deployed authentication pages should still use HTTPS and appropriate production security headers.

## Security Summary

| Signal | Result |
| --- | --- |
| HTTPS | Not HTTPS |
| Protocol | `http:` |
| Local context | Yes |
| Local context reason | `localhost` is a local development host. |

Interpretation: HTTP on `localhost` is acceptable for local fixture testing, but deployed authentication pages should use HTTPS before users enter credentials.

## Authentication Summary

| Signal | Result |
| --- | --- |
| Authentication page | Yes |
| Authentication type | Login |
| Classification confidence | High (100%) |

LoginGuard detected authentication-related fields and page context consistent with a basic login page.

## Field Counts

| Field Type | Count |
| --- | ---: |
| Password fields | 1 |
| Username fields | 0 |
| Email fields | 1 |
| Username/email fields | 1 |

No field values are included in this report.

## Risk Summary

| Signal | Result |
| --- | --- |
| Overall risk | Low for local fixture context |
| Main context | Local development page |
| Production note | A real deployed HTTP authentication page should be treated as higher risk. |

The local fixture is intentionally simple. Missing production controls are shown so developers can understand what should be reviewed before deployment.

## Findings

### Transport

#### Local HTTP development context

- Severity: Low
- Status: Info
- Confidence: 100%
- Summary: The page is using HTTP in a local development context.
- Evidence:
  - Protocol: `http:`
  - Local context: `localhost` development host.
- Recommendation: Use HTTPS for deployed authentication pages; HTTP on localhost is acceptable for local fixture testing.

### Authentication

#### Login page detected

- Severity: Info
- Status: Info
- Confidence: 100%
- Summary: The page was classified as Login.
- Evidence:
  - Password field detected.
  - Email field detected.
  - Submit button detected.
- Recommendation: Review the detected authentication flow and confirm expected security controls are present before deployment.

#### Authentication surface detected

- Severity: Info
- Status: Info
- Confidence: High
- Summary: LoginGuard detected fields or controls commonly used in authentication flows.
- Evidence:
  - Password fields: 1
  - Email fields: 1
  - Submit buttons: 1
- Recommendation: Review detected fields, labels, submit controls, and surrounding page context.

### Headers

#### Security headers not observed in local fixture context

- Severity: Low
- Status: Warning
- Confidence: Varies by header availability
- Summary: The basic local static server did not provide common production security headers during this fixture test.
- Evidence:
  - `Content-Security-Policy` was not observed.
  - `Strict-Transport-Security` was not observed.
  - `X-Frame-Options` was not observed.
  - `X-Content-Type-Options` was not observed.
  - `Referrer-Policy` was not observed.
  - `Permissions-Policy` was not observed.
- Recommendation: Local fixtures may omit these headers, but deployed authentication pages should include appropriate production security headers.

## Safety Note

LoginGuard performs passive local analysis. No forms were submitted and no credentials were collected.
