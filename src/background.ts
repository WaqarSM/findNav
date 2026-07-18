chrome?.commands.onCommand.addListener((command) => {
  console.log("[FindNav] command received:", command);

  if (command !== "open-findnav") {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id === undefined) {
      console.warn("[FindNav] no active tab found for command");
      return;
    }

    console.log("[FindNav] sending open message to tab:", tab.id);

    chrome?.tabs.sendMessage(tab.id, { type: "findnav:open" }, () => {
      if (chrome?.runtime.lastError) {
        console.warn("[FindNav] could not open on this page:", chrome.runtime.lastError.message);
        return;
      }

      console.log("[FindNav] open message delivered");
    });
  });
});
