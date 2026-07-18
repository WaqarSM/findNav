export const CONTENT_DEBUG = false;
export const ROOT_ID = "findnav-root";
export const HIDDEN_CLASS = "findnav-hidden";
export const CURRENT_ACTION_CLASS = "findnav-action-current";
export const MATCH_HIGHLIGHT_NAME = "findnav-match";
export const CURRENT_HIGHLIGHT_NAME = "findnav-current";
export const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT", "SVG", "CANVAS"]);
export const ACTION_SELECTOR = [
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

export const OVERLAY_STYLE = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .findnav-panel {
    align-items: center;
    background: #ffffff;
    border: 1px solid #dadce0;
    border-radius: 4px;
    box-shadow: 0 2px 9px rgba(60, 64, 67, 0.24);
    color: #202124;
    display: flex;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    gap: 4px;
    min-height: 34px;
    padding: 4px;
    width: min(390px, calc(100vw - 32px));
  }

  .findnav-input {
    background: #ffffff;
    border: 1px solid transparent;
    border-radius: 3px;
    color: #202124;
    flex: 1 1 auto;
    font: 13px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    height: 24px;
    min-width: 96px;
    outline: none;
    padding: 3px 7px;
  }

  .findnav-input:focus {
    border-color: #8ab4f8;
  }

  .findnav-count {
    color: #5f6368;
    flex: 0 0 auto;
    font: 12px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    min-width: 44px;
    text-align: right;
  }

  .findnav-button {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 3px;
    color: #3c4043;
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 24px;
    font: 16px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    height: 24px;
    justify-content: center;
    padding: 0;
    width: 24px;
  }

  .findnav-button:hover,
  .findnav-button:focus {
    background: #f1f3f4;
    outline: none;
  }

  .findnav-close {
    font-size: 18px;
  }
`;
