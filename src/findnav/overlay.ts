import { HIDDEN_CLASS, OVERLAY_STYLE, ROOT_ID } from "./constants.js";
import type { Overlay } from "./types.js";

export type OverlayHandlers = {
  onQuery: (query: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
};

export function createOverlay(handlers: OverlayHandlers): Overlay {
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = HIDDEN_CLASS;
  const shadow = root.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = OVERLAY_STYLE;

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

  shadow.append(style, panel);
  panel.append(input, count, previous, next, close);
  document.documentElement.append(root);

  input.addEventListener("input", () => {
    handlers.onQuery(input.value);
  });

  panel.addEventListener("pointerdown", stopOverlayEvent);
  panel.addEventListener("click", stopOverlayEvent);
  panel.addEventListener("keydown", stopOverlayEvent);

  previous.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handlers.onPrevious();
  });
  next.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handlers.onNext();
  });
  close.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handlers.onClose();
  });

  return { root, input, count };
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

function stopOverlayEvent(event: Event): void {
  event.stopPropagation();
}
