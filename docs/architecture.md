# LoginGuard Architecture

LoginGuard is designed as a modular defensive browser security platform. The current implementation is a Manifest V3 Chrome Extension that analyzes the active page after the user opens the popup.

## Current Architecture

```mermaid
flowchart TD
  User[User Opens Popup]
  Popup[Popup UI]
  Background[Background Service Worker]
  Content[Content Script Bridge]
  Scanner[Core Scanner]
  Risk[Risk Engine]
  Utils[Utilities]
  Auth[Authentication Classifier]
  Login[Login Detector]
  Headers[Security Headers Scanner]
  HTTPS[HTTPS Checker]

  User --> Popup
  Popup -->|requests active tab data| Background
  Background -->|passive header snapshot| Popup
  Popup -->|injects read-only modules| Content
  Content --> Scanner
  Scanner --> Auth
  Scanner --> Login
  Scanner --> Headers
  Scanner --> HTTPS
  Auth --> Utils
  Login --> Utils
  Headers --> Utils
  Scanner --> Risk
  Risk --> Popup
```

## Data Flow

```mermaid
sequenceDiagram
  participant U as User
  participant P as Popup
  participant B as Background
  participant C as Content Script
  participant S as Scanner
  participant M as Modules
  participant R as Risk Engine

  U->>P: Opens LoginGuard
  P->>B: Request captured headers for active tab
  B-->>P: Return passive header snapshot when available
  P->>C: Send analyze message
  C->>S: Run scan(document, context)
  S->>M: Execute passive modules
  M-->>S: Structured module results
  S->>R: Summarize findings
  R-->>S: Risk summary
  S-->>C: Analysis object
  C-->>P: Renderable results
```

## Component Responsibilities

| Component | Responsibility |
| --- | --- |
| Popup | Presents findings, requests active-tab analysis, and renders module results. |
| Background Service Worker | Handles lifecycle events and passive response-header capture where Chrome APIs allow it. |
| Content Script Bridge | Receives popup messages and runs the scanner against the current document. |
| Core Scanner | Orchestrates modules and returns a single structured analysis object. |
| Modules | Perform focused passive checks and return structured results. |
| Risk Engine | Converts module outputs into concise summaries and severity-oriented context. |
| Utilities | Provide shared DOM and data helpers for modules. |

## Module Relationship

```mermaid
flowchart LR
  Scanner[Core Scanner]
  Auth[Auth Classifier]
  Login[Login Detector]
  Headers[Header Scanner]
  HTTPS[HTTPS Checker]
  Risk[Risk Engine]

  Scanner --> Auth
  Scanner --> Login
  Scanner --> Headers
  Scanner --> HTTPS
  Scanner --> Risk
```

Modules should be independent. They may share utility functions, but they should not depend on popup rendering details or mutate page state.

## Future Plugin System

```mermaid
flowchart TD
  Registry[Plugin Registry]
  Manifest[Plugin Manifest]
  Sandbox[Plugin Runtime Boundary]
  ModuleAPI[Module API]
  Scanner[Core Scanner]
  Reports[Reporting Engine]

  Manifest --> Registry
  Registry --> Sandbox
  Sandbox --> ModuleAPI
  ModuleAPI --> Scanner
  Scanner --> Reports
```

The future plugin system should define:

- A plugin manifest format.
- A stable module API.
- Permission declarations.
- Safety validation rules.
- Version compatibility.
- Local-only execution defaults.
- Clear reporting contracts.

## Architectural Rules

- Modules must be passive by default.
- Modules must not submit forms.
- Modules must not inject payloads.
- Modules must not collect user-entered credentials.
- Modules must not make hidden network requests.
- New permissions must be documented with purpose, scope, and risk.
- Findings must be structured, explainable, and suitable for reports.
