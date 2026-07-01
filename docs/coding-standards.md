# LoginGuard Coding Standards

These standards keep LoginGuard maintainable, reviewable, and safe as it grows into a modular security platform.

## Naming Conventions

| Item | Convention | Example |
| --- | --- | --- |
| Files | Lowercase kebab-case | `auth-classifier.js` |
| Directories | Lowercase kebab-case or domain name | `modules/headers` |
| Module IDs | Lowercase kebab-case | `header-scanner` |
| Constants | Uppercase snake case | `MESSAGE_TYPE` |
| Functions | camelCase | `scanCurrentPage` |
| Objects | camelCase | `headerResult` |
| Classes | PascalCase if classes are introduced | `RuleRegistry` |

## Folder Structure

```text
src/
|-- background/
|-- content/
|-- core/
|-- modules/
|   |-- auth/
|   |-- headers/
|   |-- https/
|   `-- login/
|-- popup/
`-- utils/
```

| Folder | Purpose |
| --- | --- |
| `background/` | Service worker lifecycle and browser API event handling. |
| `content/` | Bridge between the popup and page-local scanner. |
| `core/` | Scanner orchestration, risk engine, and future rule engine. |
| `modules/` | Focused passive analysis modules. |
| `popup/` | User interface for current-page results. |
| `utils/` | Shared helpers with no UI coupling. |

## Module Boundaries

Modules should:

- Accept explicit inputs.
- Return structured plain objects.
- Avoid UI dependencies.
- Avoid browser-specific APIs unless the module is explicitly responsible for them.
- Avoid mutating page state.
- Avoid reading user-entered values.
- Keep recommendations concise and actionable.

Modules should not:

- Submit forms.
- Inject payloads.
- Make hidden network requests.
- Store credentials or secrets.
- Depend on another module's internal implementation.

## Code Style

- Use modern JavaScript.
- Prefer `const` by default and `let` only when reassignment is needed.
- Keep functions small and named by intent.
- Use early returns for error or unsupported states.
- Keep comments short and useful.
- Avoid broad abstractions until repeated patterns justify them.
- Keep browser permission usage isolated and documented.
- Return serializable objects from modules.

## Documentation Style

- Use clear Markdown headings.
- Prefer tables for contracts, module summaries, and permission descriptions.
- Use Mermaid diagrams for architecture and data flow where helpful.
- Explain safety boundaries in user-facing docs.
- Avoid vague claims; describe observed signals and limitations.
- Keep examples defensive and authorized.

## Commit Message Format

Use concise conventional-style commit messages:

```text
type(scope): summary
```

Recommended types:

| Type | Use |
| --- | --- |
| `feat` | New user-facing or module capability. |
| `fix` | Bug fix. |
| `docs` | Documentation-only change. |
| `refactor` | Internal restructuring without behavior change. |
| `test` | Test additions or changes. |
| `chore` | Maintenance tasks. |

Examples:

```text
docs(project): add architecture overview
feat(headers): add passive header scanner
refactor(core): isolate scanner module orchestration
```

## Branch Strategy

| Branch | Purpose |
| --- | --- |
| `main` | Stable development line. |
| `feature/<short-name>` | New features or modules. |
| `fix/<short-name>` | Bug fixes. |
| `docs/<short-name>` | Documentation-only work. |
| `release/<version>` | Release preparation when formal releases begin. |

Pull requests should target `main` unless maintainers define a release branch for a specific version.

## Review Checklist

- The change supports defensive, authorized use.
- Module boundaries remain clear.
- New permissions are documented.
- No credentials or user-entered secrets are collected.
- No offensive behavior is introduced.
- Documentation is updated when behavior changes.
- Syntax checks and manual extension loading are completed where relevant.
