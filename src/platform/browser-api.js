// Small WebExtensions API adapter used to reduce direct coupling to chrome.* APIs.
(() => {
  const browserApi = globalThis.browser || globalThis.chrome || null;
  const usesPromiseApi = Boolean(globalThis.browser && browserApi === globalThis.browser);

  function getRuntime() {
    return browserApi?.runtime || null;
  }

  function getTabs() {
    return browserApi?.tabs || null;
  }

  function getScripting() {
    return browserApi?.scripting || null;
  }

  function getStorage() {
    return browserApi?.storage || null;
  }

  function getRuntimeUrl(path) {
    const runtime = getRuntime();

    return typeof runtime?.getURL === "function" ? runtime.getURL(String(path || "")) : null;
  }

  function sendMessage(message) {
    return callApi(getRuntime(), "sendMessage", [message], "Runtime messaging is not available.");
  }

  function sendTabMessage(tabId, message) {
    return callApi(getTabs(), "sendMessage", [tabId, message], "Tab messaging is not available.");
  }

  function queryTabs(queryInfo = {}) {
    return callApi(getTabs(), "query", [queryInfo], "Tab queries are not available.");
  }

  async function getActiveTab() {
    const tabs = await queryTabs({ active: true, currentWindow: true });

    return Array.isArray(tabs) ? tabs[0] || null : null;
  }

  function getTab(tabId) {
    return callApi(getTabs(), "get", [tabId], "Tab lookup is not available.");
  }

  function getCurrentTab() {
    return callApi(getTabs(), "getCurrent", [], "Current tab lookup is not available.");
  }

  function executeScript(details) {
    return callApi(getScripting(), "executeScript", [details], "Script injection is not available.");
  }

  function createTab(createProperties) {
    return callApi(getTabs(), "create", [createProperties], "Tab creation is not available.");
  }

  function openExtensionPage(path, createProperties = {}) {
    const url = getRuntimeUrl(path);

    if (!url) {
      return Promise.reject(new Error("Extension URL generation is not available."));
    }

    return createTab({
      ...createProperties,
      url,
    });
  }

  function storageGet(areaName, keys) {
    const area = getStorage()?.[areaName];

    return callApi(area, "get", [keys], `Storage area "${areaName}" is not available.`);
  }

  function storageSet(areaName, items) {
    const area = getStorage()?.[areaName];

    return callApi(area, "set", [items], `Storage area "${areaName}" is not available.`);
  }

  function callApi(namespace, methodName, args, unavailableMessage) {
    const method = namespace?.[methodName];

    if (typeof method !== "function") {
      return Promise.reject(new Error(unavailableMessage));
    }

    if (usesPromiseApi) {
      try {
        return Promise.resolve(method.apply(namespace, args));
      } catch (error) {
        return Promise.reject(normalizeError(error));
      }
    }

    return new Promise((resolve, reject) => {
      try {
        method.apply(namespace, [
          ...args,
          (result) => {
            const lastError = getRuntime()?.lastError;

            if (lastError) {
              reject(new Error(lastError.message || String(lastError)));
              return;
            }

            resolve(result);
          },
        ]);
      } catch (error) {
        reject(normalizeError(error));
      }
    });
  }

  function normalizeError(error) {
    return error instanceof Error ? error : new Error(String(error || "Browser API call failed."));
  }

  globalThis.LoginGuardBrowserApi = {
    getRuntime,
    getTabs,
    getScripting,
    getStorage,
    sendMessage,
    sendTabMessage,
    queryTabs,
    getActiveTab,
    getTab,
    getCurrentTab,
    executeScript,
    createTab,
    openExtensionPage,
    getRuntimeUrl,
    storageGet,
    storageSet,
  };
})();
