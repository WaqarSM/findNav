type ActionKind = "link" | "button" | "field" | "clickable";

type ActionMatch = {
  type: "action";
  element: HTMLElement;
  label: string;
  kind: ActionKind;
};

type TextMatch = {
  type: "text";
  range: Range;
  text: string;
};

type Match = ActionMatch | TextMatch;

type Overlay = {
  root: HTMLElement;
  input: HTMLInputElement;
  count: HTMLElement;
  previous: HTMLButtonElement;
  next: HTMLButtonElement;
  close: HTMLButtonElement;
};

const ROOT_ID = "findnav-root";
const CURRENT_ACTION_CLASS = "findnav-action-current";
const MATCH_HIGHLIGHT_NAME = "findnav-match";
const CURRENT_HIGHLIGHT_NAME = "findnav-current";
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT", "SVG", "CANVAS"]);
const ACTION_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "textarea",
  "select",
  "[role='button']",
  "[role='link']",
  "[onclick]",
  "[tabindex]",
].join(",");

let overlay: Overlay | null = null;
let isOpen = false;
let query = "";
let matches: Match[] = [];
let activeIndex = -1;
let currentActionElement: HTMLElement | null = null;
let highlightApi = getHighlightApi();

console.log("[FindNav] content script loaded at document_start:", window.location.href);
document.documentElement.dataset.findnavContentScript = "loaded";

function createOverlay(): Overlay {
  const root = document.createElement("div");
  root.id = ROOT_ID;

  const panel = document.createElement("div");
  panel.className = "findnav-panel";
  panel.setAttribute("role", "search");

  const input = document.createElement("input");
  input.className = "findnav-input";
  input.type = "search";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = "FindNav";
  input.setAttribute("aria-label", "Find page text, links, and controls");

  const count = document.createElement("span");
  count.className = "findnav-count";
  count.textContent = "0/0";

  const previous = makeButton("findnav-previous", "Previous match", "‹");
  const next = makeButton("findnav-next", "Next match", "›");
  const close = makeButton("findnav-close", "Close FindNav", "×");

  panel.append(input, count, previous, next, close);
  root.append(panel);
  document.documentElement.append(root);

  input.addEventListener("input", () => {
    runSearch(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      moveActive(event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      activateCurrent();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeOverlay();
    }
  });

  previous.addEventListener("click", () => moveActive(-1));
  next.addEventListener("click", () => moveActive(1));
  close.addEventListener("click", closeOverlay);

  return { root, input, count, previous, next, close };
}

function makeButton(className: string, label: string, text: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = `findnav-button ${className}`;
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}

function openOverlay(): void {
  console.log("[FindNav] open requested");

  overlay ??= createOverlay();
  overlay.root.hidden = false;
  isOpen = true;
  focusOverlayInput();
  if (overlay.input.value) {
    runSearch(overlay.input.value);
  }
}

function focusOverlayInput(): void {
  if (!overlay) {
    return;
  }

  const focus = () => {
    if (!overlay || !isOpen) {
      return;
    }

    overlay.input.focus({ preventScroll: true });
    overlay.input.select();
  };

  focus();
  requestAnimationFrame(focus);
  window.setTimeout(focus, 60);
  window.setTimeout(focus, 180);
}

function closeOverlay(): void {
  if (!overlay) {
    return;
  }

  isOpen = false;
  overlay.root.hidden = true;
  overlay.input.value = "";
  clearMatches();
  query = "";
  overlay.count.textContent = "0/0";
}

function runSearch(nextQuery: string): void {
  query = nextQuery.trim();
  clearMatches();

  if (!query) {
    updateCount();
    return;
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const actionMatches = findActionMatches(normalizedQuery);
  const textMatches = findTextMatches(normalizedQuery);
  matches = [...actionMatches, ...textMatches];
  activeIndex = matches.length > 0 ? 0 : -1;
  applyActiveMatch();
  updateCount();
}

function clearMatches(): void {
  currentActionElement?.classList.remove(CURRENT_ACTION_CLASS);
  currentActionElement = null;

  highlightApi?.delete(MATCH_HIGHLIGHT_NAME);
  highlightApi?.delete(CURRENT_HIGHLIGHT_NAME);
  matches = [];
  activeIndex = -1;
}

function findActionMatches(normalizedQuery: string): ActionMatch[] {
  const result: ActionMatch[] = [];

  for (const element of Array.from(document.querySelectorAll<HTMLElement>(ACTION_SELECTOR))) {
    if (!isSearchableElement(element) || isInsideFindNav(element)) {
      continue;
    }

    const label = getAccessibleName(element);
    if (!label.toLocaleLowerCase().includes(normalizedQuery)) {
      continue;
    }

    result.push({
      type: "action",
      element,
      label,
      kind: getActionKind(element),
    });
  }

  return dedupeActionMatches(result);
}

function findTextMatches(normalizedQuery: string): TextMatch[] {
  const result: TextMatch[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.textContent ?? "";
      if (!text.trim() || !text.toLocaleLowerCase().includes(normalizedQuery)) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (!parent || !isSearchableElement(parent) || isInsideFindNav(parent)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  for (const node of nodes) {
    result.push(...createTextRanges(node, normalizedQuery));
  }

  setRangeHighlight(MATCH_HIGHLIGHT_NAME, result.map((match) => match.range));
  return result;
}

function createTextRanges(node: Text, normalizedQuery: string): TextMatch[] {
  const source = node.textContent ?? "";
  const lowerSource = source.toLocaleLowerCase();
  const textMatches: TextMatch[] = [];
  let index = lowerSource.indexOf(normalizedQuery);

  while (index !== -1) {
    const range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + normalizedQuery.length);
    textMatches.push({ type: "text", range, text: source.slice(index, index + normalizedQuery.length) });
    index = lowerSource.indexOf(normalizedQuery, index + normalizedQuery.length);
  }

  return textMatches;
}

function dedupeActionMatches(actionMatches: ActionMatch[]): ActionMatch[] {
  const seen = new Set<HTMLElement>();
  const result: ActionMatch[] = [];

  for (const match of actionMatches) {
    if (seen.has(match.element)) {
      continue;
    }

    seen.add(match.element);
    result.push(match);
  }

  return result;
}

function moveActive(direction: number): void {
  if (matches.length === 0) {
    updateCount();
    return;
  }

  activeIndex = (activeIndex + direction + matches.length) % matches.length;
  applyActiveMatch();
  updateCount();
}

function applyActiveMatch(): void {
  currentActionElement?.classList.remove(CURRENT_ACTION_CLASS);
  currentActionElement = null;

  highlightApi?.delete(CURRENT_HIGHLIGHT_NAME);

  const current = matches[activeIndex];
  if (!current) {
    return;
  }

  if (current.type === "action") {
    currentActionElement = current.element;
    current.element.classList.add(CURRENT_ACTION_CLASS);
    current.element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    return;
  }

  setRangeHighlight(CURRENT_HIGHLIGHT_NAME, [current.range]);
  scrollRangeIntoView(current.range);
}

function activateCurrent(): void {
  const current = matches[activeIndex];
  if (!current || current.type !== "action") {
    return;
  }

  current.element.focus({ preventScroll: true });

  if (current.kind === "field") {
    return;
  }

  current.element.click();
}

function updateCount(): void {
  if (!overlay) {
    return;
  }

  overlay.count.textContent = matches.length === 0 ? "0/0" : `${activeIndex + 1}/${matches.length}`;
}

function getActionKind(element: HTMLElement): ActionKind {
  const tag = element.tagName;
  const role = element.getAttribute("role")?.toLocaleLowerCase();

  if (tag === "A" || role === "link") {
    return "link";
  }

  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return "field";
  }

  if (tag === "BUTTON" || role === "button") {
    return "button";
  }

  return "clickable";
}

function getAccessibleName(element: HTMLElement): string {
  const pieces = [
    element.innerText,
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("placeholder"),
    getInputValue(element),
    getAssociatedLabel(element),
  ];

  return pieces
    .filter((piece): piece is string => Boolean(piece?.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function getInputValue(element: HTMLElement): string | null {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value;
  }

  if (element instanceof HTMLSelectElement) {
    return element.selectedOptions[0]?.textContent ?? null;
  }

  return null;
}

function getAssociatedLabel(element: HTMLElement): string | null {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    const labels = Array.from(element.labels ?? []);
    return labels.map((label) => label.innerText).join(" ");
  }

  return null;
}

function isSearchableElement(element: HTMLElement): boolean {
  if (SKIPPED_TAGS.has(element.tagName)) {
    return false;
  }

  if (isInsideFindNav(element)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
    return false;
  }

  const rects = element.getClientRects();
  return rects.length > 0;
}

function isInsideFindNav(element: Element): boolean {
  return Boolean(element.closest(`#${ROOT_ID}`));
}

function setRangeHighlight(name: string, ranges: Range[]): void {
  highlightApi ??= getHighlightApi();
  if (!highlightApi) {
    return;
  }

  highlightApi.set(name, new Highlight(...ranges));
}

function scrollRangeIntoView(range: Range): void {
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return;
  }

  const top = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
  const left = rect.left + window.scrollX - window.innerWidth / 2 + rect.width / 2;
  window.scrollTo({ top: Math.max(0, top), left: Math.max(0, left), behavior: "smooth" });
}

function getHighlightApi(): FindNavHighlightRegistry | null {
  return "highlights" in CSS ? (CSS.highlights as unknown as FindNavHighlightRegistry) : null;
}

function isOpenShortcut(event: KeyboardEvent): boolean {
  return event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key.toLocaleLowerCase() === "f";
}

document.addEventListener(
  "keydown",
  (event) => {
    if (!isOpenShortcut(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    console.log("[FindNav] keyboard shortcut detected in page");
    openOverlay();
  },
  true,
);

chrome?.runtime.onMessage?.addListener((message, _sender, sendResponse) => {
  if (typeof message !== "object" || message === null || !("type" in message)) {
    return;
  }

  if (message.type === "findnav:ping") {
    console.log("[FindNav] ping received from popup/background");
    sendResponse?.({
      ok: true,
      href: window.location.href,
      readyState: document.readyState,
      isOpen,
    });
    return;
  }

  if (message.type === "findnav:open") {
    console.log("[FindNav] open message received from extension command");
    openOverlay();
    sendResponse?.({ ok: true, opened: true });
  }
});
