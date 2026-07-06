// Central registry for Lab Mode check labels and user-facing descriptions.
(() => {
  const CHECK_DEFINITIONS = {
    "baseline-submit-observation": {
      category: "baseline-submit-observation",
      label: "Baseline Form Check",
      shortDescription: "Safely checks the login form structure.",
      userPurpose: "Helps confirm what login form elements are present before deeper lab checks.",
      availability: "available",
      safetyLevel: "metadata-only",
      defaultStatusLabel: "Available",
    },
    "empty-fields-observation": {
      category: "empty-fields-observation",
      label: "Empty Fields Check",
      shortDescription: "Plans a future check for how required fields behave when left empty.",
      userPurpose: "Helps prepare a controlled lab check for required-field behavior.",
      availability: "planned",
      safetyLevel: "planner-only",
      defaultStatusLabel: "Planned",
    },
    "response-message-comparison": {
      category: "response-message-comparison",
      label: "Response Message Check",
      shortDescription: "Plans future comparison of visible login response messages.",
      userPurpose: "Helps review whether lab responses reveal too much information.",
      availability: "planned",
      safetyLevel: "planner-only",
      defaultStatusLabel: "Planned",
    },
    "invalid-synthetic-credentials-observation": {
      category: "invalid-synthetic-credentials-observation",
      label: "Invalid Credentials Check",
      shortDescription: "Reserved for future controlled lab testing with strict safeguards.",
      userPurpose: "May help authorized labs review invalid-login behavior in the future.",
      availability: "blocked",
      safetyLevel: "blocked",
      defaultStatusLabel: "Blocked for now",
    },
  };

  function getCheckDefinition(category) {
    const normalizedCategory = String(category || "");
    const definition = CHECK_DEFINITIONS[normalizedCategory];

    if (definition) {
      return { ...definition };
    }

    return {
      category: normalizedCategory,
      label: normalizedCategory || "Unknown Lab Check",
      shortDescription: "No description available.",
      userPurpose: "Review this lab check manually.",
      availability: "unknown",
      safetyLevel: "unknown",
      defaultStatusLabel: "Unknown",
    };
  }

  function listCheckDefinitions(categories) {
    if (!Array.isArray(categories)) {
      return [];
    }

    return categories
      .map((category) => getCheckDefinition(category))
      .filter((definition) => definition.category);
  }

  globalThis.LoginGuardLabCheckRegistry = {
    getCheckDefinition,
    listCheckDefinitions,
  };
})();
