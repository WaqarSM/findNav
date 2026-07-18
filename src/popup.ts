type PingResponse = {
  ok?: boolean;
  href?: string;
  readyState?: string;
  isOpen?: boolean;
};

const POPUP_DEBUG = false;
const statusPill = mustGet("status-pill");
const activePage = mustGet("active-page");
const contentScript = mustGet("content-script");
const openButton = mustGet("open-button") as HTMLButtonElement;
const hint = mustGet("hint");

let activeTabId: number | null = null;

openButton.disabled = true;
debugPopup("popup opened");

void initialize();

openButton.addEventListener("click", () => {
  if (activeTabId === null) {
    return;
  }

  debugPopup("popup open button clicked");
  chrome?.tabs.sendMessage(activeTabId, { type: "findnav:open" }, (response) => {
    if (chrome?.runtime.lastError) {
      setWarning("No response", chrome.runtime.lastError.message);
      return;
    }

    debugPopup("popup open response", response);
    window.close();
  });
});

async function initialize(): Promise<void> {
  const tab = await getActiveTab();
  activeTabId = tab?.id ?? null;

  if (!tab?.url || !isSupportedPage(tab.url)) {
    activePage.textContent = tab?.url ? formatPagePreview(tab.url) : "No active tab";
    activePage.title = tab?.url ?? "";
    contentScript.textContent = "Not available on this page";
    openButton.disabled = true;
    setWarning("Blocked", getUnsupportedPageMessage(tab?.url));
    return;
  }

  activePage.textContent = formatPagePreview(tab.url);
  activePage.title = tab.url;

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

    openButton.disabled = false;
    contentScript.textContent = "Ready on this page";
    statusPill.textContent = "Ready";
    statusPill.className = "pill ok";
    hint.textContent = ping.isOpen ? "FindNav is already open on this page." : "Use the button or shortcut to start searching.";
    debugPopup("popup ping response", ping);
  });
}

function getActiveTab(): Promise<{ id?: number; url?: string; title?: string } | undefined> {
  return new Promise((resolve) => {
    chrome?.tabs.query({ active: true, currentWindow: true }, ([tab]) => resolve(tab));
  });
}

function isSupportedPage(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://");
}

function getUnsupportedPageMessage(url: string | undefined): string {
  if (!url) {
    return "No active page was available for FindNav to inspect.";
  }

  if (url.startsWith("chrome://")) {
    return "Chrome blocks extensions on browser settings and internal pages.";
  }

  if (url.startsWith("chrome-extension://")) {
    return "Chrome blocks extensions on extension pages, including the built-in PDF viewer.";
  }

  return "Chrome does not allow FindNav to inject into this kind of page.";
}

function getNoResponseMessage(url: string, errorMessage: string): string {
  if (url.startsWith("file://")) {
    return `${errorMessage}. Enable "Allow access to file URLs" for FindNav, then reload the file.`;
  }

  if (url.endsWith(".pdf") || url.includes(".pdf?")) {
    return `${errorMessage}. Chrome's built-in PDF viewer usually blocks extension injection.`;
  }

  return `${errorMessage}. Reload the page after reloading the extension.`;
}

function setWarning(label: string, message: string): void {
  statusPill.textContent = label;
  statusPill.className = "pill warn";
  hint.textContent = message;
}

function formatPagePreview(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "file:") {
      return `file://${getFileName(parsed.pathname)}`;
    }

    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname === "/" ? "" : compactPath(parsed.pathname);
    return `${host}${path}`;
  } catch {
    return url.length > 54 ? `${url.slice(0, 28)}...${url.slice(-18)}` : url;
  }
}

function compactPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return "";
  }

  const last = parts.at(-1) ?? "";
  return last.length > 24 ? `/.../${last.slice(0, 10)}...${last.slice(-8)}` : `/.../${last}`;
}

function getFileName(pathname: string): string {
  const decoded = decodeURIComponent(pathname);
  return decoded.split("/").filter(Boolean).at(-1) ?? "local file";
}

function debugPopup(message: string, detail?: unknown): void {
  if (!POPUP_DEBUG) {
    return;
  }

  console.info("[FindNav]", message, detail ?? "");
}

function mustGet(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing popup element: ${id}`);
  }

  return element;
}
