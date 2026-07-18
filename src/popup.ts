type PingResponse = {
  ok?: boolean;
  href?: string;
  readyState?: string;
  isOpen?: boolean;
};

const statusPill = mustGet("status-pill");
const activePage = mustGet("active-page");
const contentScript = mustGet("content-script");
const openButton = mustGet("open-button") as HTMLButtonElement;
const hint = mustGet("hint");

let activeTabId: number | null = null;
let canOpen = false;

console.log("[FindNav] popup opened");

void initialize();

openButton.addEventListener("click", () => {
  if (activeTabId === null) {
    return;
  }

  console.log("[FindNav] popup open button clicked");
  chrome?.tabs.sendMessage(activeTabId, { type: "findnav:open" }, (response) => {
    if (chrome?.runtime.lastError) {
      setWarning("No response", chrome.runtime.lastError.message);
      return;
    }

    console.log("[FindNav] popup open response:", response);
    window.close();
  });
});

async function initialize(): Promise<void> {
  const tab = await getActiveTab();
  activeTabId = tab?.id ?? null;

  if (!tab?.url || !isSupportedPage(tab.url)) {
    activePage.textContent = tab?.url ?? "No active tab";
    contentScript.textContent = "Not available on this page";
    openButton.disabled = true;
    setWarning("Blocked", getUnsupportedPageMessage(tab?.url));
    return;
  }

  activePage.textContent = tab.url;

  if (tab.id === undefined) {
    contentScript.textContent = "No tab id";
    openButton.disabled = true;
    setWarning("No tab", "Chrome did not expose an active tab id.");
    return;
  }

  chrome?.tabs.sendMessage(tab.id, { type: "findnav:ping" }, (response) => {
    if (chrome?.runtime.lastError) {
      contentScript.textContent = "No response";
      openButton.disabled = true;
      setWarning("Not injected", getNoResponseMessage(tab.url ?? "", chrome.runtime.lastError.message));
      return;
    }

    const ping = response as PingResponse | undefined;
    if (!ping?.ok) {
      contentScript.textContent = "Unexpected response";
      openButton.disabled = true;
      setWarning("Check failed", "The content script responded, but not with the expected FindNav ping.");
      return;
    }

    canOpen = true;
    openButton.disabled = false;
    contentScript.textContent = `Loaded, document ${ping.readyState ?? "unknown"}`;
    statusPill.textContent = "Ready";
    statusPill.className = "pill ok";
    hint.textContent = "Use the button or the shortcut to open the finder.";
    console.log("[FindNav] popup ping response:", ping);
  });
}

function getActiveTab(): Promise<{ id?: number; url?: string; title?: string } | undefined> {
  return new Promise((resolve) => {
    chrome?.tabs.query({ active: true, currentWindow: true }, ([tab]) => resolve(tab));
  });
}

function isSupportedPage(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("file://") ||
    url.startsWith("about:")
  );
}

function getUnsupportedPageMessage(url: string | undefined): string {
  if (!url) {
    return "No active page was available for FindNav to inspect.";
  }

  if (url.startsWith("chrome://")) {
    return "Chrome blocks extensions from injecting into chrome:// pages.";
  }

  if (url.startsWith("chrome-extension://")) {
    return "Chrome blocks extensions from injecting into another extension's pages. Chrome's built-in PDF viewer is usually in this category.";
  }

  return "Chrome does not allow FindNav to inject into this kind of page.";
}

function getNoResponseMessage(url: string, errorMessage: string): string {
  if (url.startsWith("file://")) {
    return `${errorMessage}. For file URLs, enable "Allow access to file URLs" for FindNav in chrome://extensions, then reload the file.`;
  }

  if (url.endsWith(".pdf") || url.includes(".pdf?")) {
    return `${errorMessage}. If Chrome opened this in the built-in PDF viewer, extensions cannot inject into that viewer page.`;
  }

  return `${errorMessage}. Reload the page after reloading the extension.`;
}

function setWarning(label: string, message: string): void {
  canOpen = false;
  statusPill.textContent = label;
  statusPill.className = "pill warn";
  hint.textContent = message;
}

function mustGet(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing popup element: ${id}`);
  }

  return element;
}
