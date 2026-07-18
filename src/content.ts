import {
  activateCurrent,
  closeOverlay,
  focusOverlayInput,
  getIsOpen,
  moveActive,
  openOverlay,
} from "./findnav/controller.js";
import { debugContent } from "./findnav/debug.js";
import { isEditableEventTarget, isOpenShortcut } from "./findnav/keyboard.js";

debugContent("content script loaded", window.location.href);
document.documentElement.dataset.findnavContentScript = "loaded";

document.addEventListener(
  "keydown",
  (event) => {
    if (getIsOpen()) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeOverlay({ restoreFocus: true });
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        event.stopImmediatePropagation();
        moveActive(event.shiftKey ? -1 : 1);
        focusOverlayInput();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        activateCurrent();
        return;
      }
    }

    if (!isOpenShortcut(event) || isEditableEventTarget(event)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    debugContent("keyboard shortcut detected");
    openOverlay();
  },
  true,
);

chrome?.runtime.onMessage?.addListener((message, _sender, sendResponse) => {
  if (typeof message !== "object" || message === null || !("type" in message)) {
    return;
  }

  if (message.type === "findnav:ping") {
    debugContent("ping received");
    sendResponse?.({
      ok: true,
      href: window.location.href,
      readyState: document.readyState,
      isOpen: getIsOpen(),
    });
    return;
  }

  if (message.type === "findnav:open") {
    debugContent("open message received");
    openOverlay();
    sendResponse?.({ ok: true, opened: true });
  }
});
