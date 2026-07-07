# AI Review Prompt

LoginGuard can copy local **AI review prompts** after a page scan completes. Prompts are generated from the current LoginGuard report and are intended to help users ask ChatGPT, Claude, or another AI assistant for defensive explanation, prioritization, and remediation planning.

This is local prompt generation only. It is not an automatic AI integration.

LoginGuard does not call an AI API. LoginGuard does not send report data automatically, does not upload the prompt, does not require an API key, and does not include a backend AI service. The copied prompt stays local until the user chooses whether and where to paste it.

Future AI integrations, if added, must be explicit, opt-in, documented, and reviewed against LoginGuard's privacy and safety model.

## Prompt Options

LoginGuard provides two local prompt exports:

| Button | Recommended for | Included data |
| --- | --- | --- |
| **Copy Prompt for AI Review** | Most users, quick reviews, non-technical summaries, and short remediation planning. | Safety instructions, requested output sections, URL, security summary, authentication summary, field counts, risk summary, Website Check summary, safety note, and simplified top findings. |
| **Copy Full Technical AI Prompt** | Developers, security teams, and authorized lab reviewers who need deeper technical context. | Safety instructions plus the full LoginGuard JSON report, including raw normalized findings, explained findings, and technical details. |

The short prompt is recommended for most users because it is easier to read and avoids sending a long technical report into an AI chat unless deeper review is needed. It also uses one shared context note, such as localhost/local fixture context, so the same deployment caveat is not repeated inside every finding.

## What It Does

The popup action **Copy Prompt for AI Review** creates a concise prompt that includes:

- A defensive web security analyst role instruction.
- Safety rules for authorized, defensive analysis.
- A short, sanitized summary of the current LoginGuard report.
- A shared context note for localhost/local fixture interpretation when relevant.
- Requested output sections for business and developer audiences.
- Simplified top findings with title, priority, why it matters, and recommended action.

The short prompt does not include raw finding IDs, sources, categories, statuses, confidence values, evidence lists, or long raw recommendations. The popup action **Copy Full Technical AI Prompt** creates a longer prompt for deeper review and keeps those raw technical details available.

Either prompt can be pasted into an AI assistant to help turn LoginGuard findings into clearer summaries, developer tasks, and safe remediation notes.

The user controls this step. LoginGuard only copies prompt text to the clipboard; it does not decide where the prompt is pasted or send it to any service.

## Intended Output Sections

The generated prompts ask for:

1. Executive summary for non-technical stakeholders.
2. Technical summary for developers/security teams.
3. Prioritized findings.
4. Developer task list.
5. Safe remediation suggestions.
6. Context and false-positive notes.
7. Manual verification checklist.

The AI assistant should focus on defensive reporting and remediation. It should not claim the page is fully secure.

## Excluded Data

The prompts are generated from LoginGuard's sanitized report data. They do not include:

- Credentials.
- Form values.
- Cookies.
- Tokens.
- Page HTML.
- Storage contents.

Users should review copied content before sharing it outside their team or lab.

## Safety Note

The AI review prompt exports are for defensive analysis only. Do not use them to request exploit steps, unauthorized testing, payloads, brute force workflows, bypass guidance, or credential collection advice.

LoginGuard performs passive local analysis. No forms were submitted and no credentials were collected.
