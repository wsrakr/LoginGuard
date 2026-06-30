// Authentication classifier: classifies auth-related pages using passive DOM signals.
(() => {
  const MODULE_ID = "auth-classifier";
  const TYPES = Object.freeze([
    "Login",
    "Registration",
    "Password Recovery",
    "Password Reset",
    "MFA / 2FA",
    "SSO",
  ]);

  const RULES = Object.freeze({
    "Login": [
      textRule("title", /\b(log\s*in|login|sign\s*in|signin)\b/i, 34, "Page title contains '{match}'"),
      textRule("headings", /\b(log\s*in|login|sign\s*in|signin)\b/i, 34, "Page heading contains '{match}'"),
      textRule("buttons", /\b(log\s*in|login|sign\s*in|signin|continue)\b/i, 18, "Button text contains '{match}'"),
      textRule("links", /\b(log\s*in|login|sign\s*in|signin)\b/i, 12, "Link text contains '{match}'"),
      textRule("urlPath", /\b(login|signin|sign-in)\b/i, 20, "URL path contains '{match}'"),
      inputRule("password", 28, "Password field detected"),
      inputRule("identity", 14, "Username or email field detected"),
    ],
    "Registration": [
      textRule("title", /\b(create\s+account|sign\s*up|signup|register|registration|join)\b/i, 36, "Page title contains '{match}'"),
      textRule("headings", /\b(create\s+account|sign\s*up|signup|register|registration|join)\b/i, 36, "Page heading contains '{match}'"),
      textRule("buttons", /\b(create\s+account|sign\s*up|signup|register|join)\b/i, 20, "Button text contains '{match}'"),
      textRule("links", /\b(create\s+account|sign\s*up|signup|register|join)\b/i, 12, "Link text contains '{match}'"),
      textRule("urlPath", /\b(sign-up|signup|register|registration|join)\b/i, 22, "URL path contains '{match}'"),
      inputRule("password", 24, "Password field detected"),
      inputRule("email", 18, "Email field detected"),
    ],
    "Password Recovery": [
      textRule("title", /\b(forgot\s+password|recover\s+password|password\s+recovery|reset\s+link)\b/i, 40, "Page title contains '{match}'"),
      textRule("headings", /\b(forgot\s+password|recover\s+password|password\s+recovery|reset\s+link)\b/i, 40, "Page heading contains '{match}'"),
      textRule("buttons", /\b(send\s+reset|reset\s+link|email\s+me|recover|continue)\b/i, 18, "Button text contains '{match}'"),
      textRule("links", /\b(forgot\s+password|recover\s+password)\b/i, 12, "Link text contains '{match}'"),
      textRule("urlPath", /\b(forgot-password|password-recovery|recover-password)\b/i, 24, "URL path contains '{match}'"),
      inputRule("email", 18, "Email field detected"),
    ],
    "Password Reset": [
      textRule("title", /\b(reset\s+password|new\s+password|change\s+password|update\s+password)\b/i, 40, "Page title contains '{match}'"),
      textRule("headings", /\b(reset\s+password|new\s+password|change\s+password|update\s+password)\b/i, 40, "Page heading contains '{match}'"),
      textRule("buttons", /\b(reset\s+password|change\s+password|update\s+password|save\s+password)\b/i, 18, "Button text contains '{match}'"),
      textRule("urlPath", /\b(reset-password|password-reset|change-password|new-password)\b/i, 24, "URL path contains '{match}'"),
      textRule("placeholders", /\b(new\s+password|confirm\s+password)\b/i, 12, "Placeholder text contains '{match}'"),
      textRule("labels", /\b(new\s+password|confirm\s+password)\b/i, 12, "Form label contains '{match}'"),
      inputRule("password", 28, "Password field detected"),
    ],
    "MFA / 2FA": [
      textRule("title", /\b(mfa|2fa|two[-\s]*factor|multi[-\s]*factor|verification\s+code|authenticator|otp|passcode)\b/i, 42, "Page title contains '{match}'"),
      textRule("headings", /\b(mfa|2fa|two[-\s]*factor|multi[-\s]*factor|verification\s+code|authenticator|otp|passcode)\b/i, 42, "Page heading contains '{match}'"),
      textRule("buttons", /\b(verify|verification|continue|submit\s+code)\b/i, 16, "Button text contains '{match}'"),
      textRule("urlPath", /\b(mfa|2fa|two-factor|otp|verification|challenge)\b/i, 26, "URL path contains '{match}'"),
      textRule("placeholders", /\b(code|verification\s+code|otp|passcode)\b/i, 18, "Placeholder text contains '{match}'"),
      textRule("labels", /\b(code|verification\s+code|otp|passcode)\b/i, 18, "Form label contains '{match}'"),
      inputRule("oneTimeCode", 24, "One-time code field detected"),
    ],
    "SSO": [
      textRule("title", /\b(sso|single\s+sign[-\s]*on|saml|oauth)\b/i, 42, "Page title contains '{match}'"),
      textRule("headings", /\b(sso|single\s+sign[-\s]*on|saml|oauth)\b/i, 42, "Page heading contains '{match}'"),
      textRule("buttons", /\b(single\s+sign[-\s]*on|continue\s+with|sign\s+in\s+with|google|microsoft|github|okta|saml|oauth)\b/i, 28, "Button text contains '{match}'"),
      textRule("links", /\b(single\s+sign[-\s]*on|continue\s+with|sign\s+in\s+with|google|microsoft|github|okta)\b/i, 18, "Link text contains '{match}'"),
      textRule("urlPath", /\b(sso|saml|oauth|oidc|openid)\b/i, 28, "URL path contains '{match}'"),
    ],
  });

  function classify(rootDocument) {
    const signals = collectSignals(rootDocument);
    const results = TYPES.map((type) => scoreType(type, signals));
    const bestResult = results.sort((left, right) => right.score - left.score)[0];

    if (!bestResult || bestResult.score < 35) {
      return {
        id: MODULE_ID,
        type: "Unknown",
        confidence: "Low",
        score: bestResult?.score || 0,
        reasons: bestResult?.reasons || [],
      };
    }

    return {
      id: MODULE_ID,
      type: bestResult.type,
      confidence: scoreToConfidence(bestResult.score),
      score: bestResult.score,
      reasons: bestResult.reasons,
    };
  }

  function collectSignals(rootDocument) {
    const domUtils = globalThis.LoginGuardDomUtils;
    const inputs = domUtils.getVisibleInputs(rootDocument);

    return {
      title: [rootDocument.title || ""],
      headings: getVisibleText(rootDocument, "h1, h2, h3, h4, h5, h6"),
      buttons: getButtonTexts(rootDocument),
      links: getVisibleText(rootDocument, "a"),
      urlPath: [rootDocument.location.pathname.replace(/[-_/]+/g, " ")],
      placeholders: inputs.map((input) => input.getAttribute("placeholder") || "").filter(Boolean),
      labels: inputs.map(getInputLabelText).filter(Boolean),
      inputs: {
        password: inputs.some((input) => input.type === "password"),
        email: inputs.some((input) => input.type === "email" || hasInputText(input, /\be-?mail\b/i)),
        identity: inputs.some((input) => input.type === "email" || hasInputText(input, /\b(user(name)?|email|e-?mail|login|account|identifier)\b/i)),
        oneTimeCode: inputs.some((input) => hasInputText(input, /\b(one-time-code|otp|2fa|mfa|verification|code|passcode)\b/i)),
      },
    };
  }

  function scoreType(type, signals) {
    const seenReasons = new Set();

    return RULES[type].reduce((result, rule) => {
      const match = rule.match(signals);

      if (!match) {
        return result;
      }

      result.score = Math.min(result.score + rule.points, 100);

      if (!seenReasons.has(match.reason)) {
        seenReasons.add(match.reason);
        result.reasons.push(match.reason);
      }

      return result;
    }, {
      type,
      score: 0,
      reasons: [],
    });
  }

  function textRule(signalKey, pattern, points, reasonTemplate) {
    return {
      points,
      match(signals) {
        for (const value of signals[signalKey]) {
          const match = value.match(pattern);

          if (match) {
            return {
              reason: reasonTemplate.replace("{match}", normalizeMatch(match[0])),
            };
          }
        }

        return null;
      },
    };
  }

  function inputRule(inputKey, points, reason) {
    return {
      points,
      match(signals) {
        return signals.inputs[inputKey] ? { reason } : null;
      },
    };
  }

  function scoreToConfidence(score) {
    if (score >= 80) {
      return "High";
    }

    if (score >= 55) {
      return "Medium";
    }

    return "Low";
  }

  function getVisibleText(rootDocument, selector) {
    return Array.from(rootDocument.querySelectorAll(selector))
      .filter((element) => globalThis.LoginGuardDomUtils.isVisibleElement(element))
      .map((element) => globalThis.LoginGuardDomUtils.getElementText(element))
      .filter(Boolean);
  }

  function getButtonTexts(rootDocument) {
    return globalThis.LoginGuardDomUtils
      .getVisibleButtons(rootDocument)
      .map((element) => [
        element.getAttribute("value"),
        element.getAttribute("aria-label"),
        element.getAttribute("title"),
        globalThis.LoginGuardDomUtils.getElementText(element),
      ].filter(Boolean).join(" "))
      .filter(Boolean);
  }

  function getInputLabelText(input) {
    return [
      ...Array.from(input.labels || []).map((label) => globalThis.LoginGuardDomUtils.getElementText(label)),
      ...getAriaLabelledByText(input),
    ].filter(Boolean).join(" ");
  }

  function getAriaLabelledByText(input) {
    const labelledBy = input.getAttribute("aria-labelledby");

    if (!labelledBy) {
      return [];
    }

    return labelledBy
      .split(/\s+/)
      .map((id) => input.ownerDocument.getElementById(id))
      .filter(Boolean)
      .map((element) => globalThis.LoginGuardDomUtils.getElementText(element));
  }

  function hasInputText(input, pattern) {
    return pattern.test([
      input.getAttribute("type"),
      input.getAttribute("name"),
      input.id,
      input.getAttribute("autocomplete"),
      input.getAttribute("aria-label"),
      input.getAttribute("placeholder"),
      getInputLabelText(input),
    ].filter(Boolean).join(" "));
  }

  function normalizeMatch(match) {
    return match.replace(/\s+/g, " ").trim();
  }

  globalThis.LoginGuardModules = globalThis.LoginGuardModules || {};
  globalThis.LoginGuardModules.auth = {
    classify,
  };
})();
