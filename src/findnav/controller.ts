import { CURRENT_ACTION_CLASS, CURRENT_HIGHLIGHT_NAME, HIDDEN_CLASS, MATCH_HIGHLIGHT_NAME } from "./constants.js";
import { debugContent } from "./debug.js";
import { clearHighlight, scrollRangeIntoView, setRangeHighlight } from "./highlights.js";
import { createOverlay } from "./overlay.js";
import { compareMatches, findActionMatches, findTextMatches } from "./search.js";
import type { Match, Overlay } from "./types.js";

let overlay: Overlay | null = null;
let isOpen = false;
let matches: Match[] = [];
let activeIndex = -1;
let currentActionElement: HTMLElement | null = null;
let previousActiveElement: Element | null = null;

export function getIsOpen(): boolean {
  return isOpen;
}

export function openOverlay(): void {
  debugContent("open requested");

  if (!isOpen) {
    previousActiveElement = document.activeElement;
  }

  overlay ??= createOverlay({
    onQuery: runSearch,
    onPrevious: () => {
      moveActive(-1);
      focusOverlayInput();
    },
    onNext: () => {
      moveActive(1);
      focusOverlayInput();
    },
    onClose: () => {
      closeOverlay({ restoreFocus: true });
    },
  });
  isOpen = true;
  overlay.root.classList.remove(HIDDEN_CLASS);
  focusOverlayInput();
  if (overlay.input.value) {
    runSearch(overlay.input.value);
  }
}

export function closeOverlay(options: { restoreFocus?: boolean } = {}): void {
  if (!overlay) {
    return;
  }

  isOpen = false;
  overlay.root.classList.add(HIDDEN_CLASS);
  overlay.input.value = "";
  clearMatches();
  overlay.count.textContent = "0/0";

  if (options.restoreFocus && previousActiveElement instanceof HTMLElement && previousActiveElement.isConnected) {
    previousActiveElement.focus({ preventScroll: true });
  }

  previousActiveElement = null;
}

export function moveActive(direction: number): void {
  if (matches.length === 0) {
    updateCount();
    return;
  }

  activeIndex = (activeIndex + direction + matches.length) % matches.length;
  applyActiveMatch();
  updateCount();
}

export function activateCurrent(): void {
  const current = matches[activeIndex];
  if (!current) {
    return;
  }

  if (current.type === "text") {
    closeOverlay({ restoreFocus: true });
    return;
  }

  current.element.focus({ preventScroll: true });

  if (current.kind === "field") {
    closeOverlay({ restoreFocus: false });
    return;
  }

  closeOverlay({ restoreFocus: false });
  current.element.click();
}

export function focusOverlayInput(): void {
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

function runSearch(nextQuery: string): void {
  const query = nextQuery.trim();
  clearMatches();

  if (!query) {
    updateCount();
    return;
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const actionMatches = findActionMatches(normalizedQuery).sort(compareMatches);
  const textMatches = findTextMatches(normalizedQuery).sort(compareMatches);
  matches = [...actionMatches, ...textMatches];
  activeIndex = matches.length > 0 ? 0 : -1;
  applyActiveMatch();
  updateCount();
}

function clearMatches(): void {
  currentActionElement?.classList.remove(CURRENT_ACTION_CLASS);
  currentActionElement = null;

  clearHighlight(MATCH_HIGHLIGHT_NAME);
  clearHighlight(CURRENT_HIGHLIGHT_NAME);
  matches = [];
  activeIndex = -1;
}

function applyActiveMatch(): void {
  currentActionElement?.classList.remove(CURRENT_ACTION_CLASS);
  currentActionElement = null;

  clearHighlight(CURRENT_HIGHLIGHT_NAME);

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

function updateCount(): void {
  if (!overlay) {
    return;
  }

  overlay.count.textContent = matches.length === 0 ? "0/0" : `${activeIndex + 1}/${matches.length}`;
}
