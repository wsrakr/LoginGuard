# LoginGuard

LoginGuard is a Chrome Extension prototype built with Manifest V3. It analyzes only the DOM of the active page when the popup is opened.

## Features

- Detects whether the current page is loaded over HTTPS.
- Detects likely login forms.
- Detects visible username, email and password fields.
- Displays the current page URL.
- Shows a simple security summary in the popup.

## Project Structure

```text
.
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.css
├── popup.js
├── assets/
│   └── icons/
│       ├── loginguard.svg
│       └── README.md
└── utils/
    └── dom-utils.js
```

## Local Installation

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select this project folder.
5. Open any HTTP or HTTPS page and click the LoginGuard extension icon.

## Safety Boundaries

This first version does not submit forms, send payloads, perform brute force, or make network requests. It only reads DOM metadata from the active page after the user opens the popup.
