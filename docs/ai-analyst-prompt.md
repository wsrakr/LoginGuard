# AI Analyst Prompt

LoginGuard can copy a local **AI Analyst Prompt** after a page scan completes. The prompt is generated from the current LoginGuard report and is intended to help users ask an AI assistant for defensive explanation, prioritization, and remediation planning.

This feature does not call an AI API. LoginGuard does not send the prompt anywhere, does not require an API key, and does not include an AI integration yet. The copied prompt stays local until the user chooses where to paste it.

## What It Does

The popup action **Copy AI Analyst Prompt** creates a readable prompt that includes:

- A defensive web security analyst role instruction.
- Safety rules for authorized, defensive analysis.
- The current LoginGuard JSON report.
- Requested output sections for business and developer audiences.

The prompt can be pasted into an AI assistant to help turn LoginGuard findings into clearer summaries, developer tasks, and safe remediation notes.

## Intended Output Sections

The generated prompt asks for:

1. Executive summary for non-technical stakeholders.
2. Technical summary for developers/security teams.
3. Prioritized findings.
4. Developer task list.
5. Safe remediation suggestions.
6. Context and false-positive notes.
7. Manual verification checklist.

The AI assistant should focus on defensive reporting and remediation. It should not claim the page is fully secure.

## Excluded Data

The prompt is generated from LoginGuard's sanitized report data. It does not include:

- Credentials.
- Form values.
- Cookies.
- Tokens.
- Page HTML.
- Storage contents.

Users should still review copied content before sharing it outside their team or lab.

## Safety Note

The AI Analyst Prompt is for defensive analysis only. Do not use it to request exploit steps, unauthorized testing, payloads, brute force workflows, bypass guidance, or credential collection advice.

LoginGuard performs passive local analysis. No forms were submitted and no credentials were collected.
