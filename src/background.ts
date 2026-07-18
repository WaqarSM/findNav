const BACKGROUND_DEBUG = false;

chrome?.commands.onCommand.addListener((command) => {
  debugBackground("command received", command);

  if (command !== "open-findnav") {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id === undefined) {
      warnBackground("No active tab found for command.");
      return;
    }

    chrome?.tabs.sendMessage(tab.id, { type: "findnav:open" }, () => {
      if (chrome?.runtime.lastError) {
        warnBackground(chrome.runtime.lastError.message);
        return;
      }

      debugBackground("open message delivered");
    });
  });
});

function debugBackground(message: string, detail?: unknown): void {
  if (!BACKGROUND_DEBUG) {
    return;
  }

  console.info("[FindNav]", message, detail ?? "");
}

function warnBackground(message: string): void {
  if (!BACKGROUND_DEBUG) {
    return;
  }

  console.warn("[FindNav]", message);
}
