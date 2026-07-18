# FindNav

FindNav is a Manifest V3 Chrome extension for keyboard-first page navigation. It opens a compact finder overlay, searches visible page text plus links and controls, prioritizes actionable matches, and lets you activate the selected target from the keyboard.

## Build

```sh
npm install
npm run build
```

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select the `dist` folder from this project.

## Use

- Click the FindNav toolbar icon to check whether the current page has the content script loaded, then use **Open FindNav** as a shortcut-independent test.
- `Option+F` opens FindNav by default on macOS. Chrome extension manifests spell this as `Alt+F`.
- `Alt+F` opens FindNav by default on Windows/Linux.
- Type to search.
- `Tab` moves to the next match.
- `Shift+Tab` moves to the previous match.
- `Enter` activates the selected link, button, or clickable control.
- `Enter` focuses text fields and other form controls.
- `Escape` closes the overlay and removes highlights.

## Demo Page

After loading the extension, serve the project locally and open `demo/test-page.html` over `http://localhost`. Chrome does not inject this extension into `file://` pages by default.

```sh
python3 -m http.server 8765
```

Then open:

```text
http://localhost:8765/demo/test-page.html
```

## Debugging The Shortcut

FindNav logs a few breadcrumbs:

- Popup console: `[FindNav] popup opened`
- Page console: `[FindNav] content script loaded`
- Page console: `[FindNav] ping received from popup/background`
- Page console: `[FindNav] keyboard shortcut detected in page`
- Page console: `[FindNav] open message received from extension command`
- Extension service worker console: `[FindNav] command received`

If the shortcut does not fire, open `chrome://extensions/shortcuts` and confirm FindNav is assigned to `Option+F` on macOS or `Alt+F` on Windows/Linux. Chrome may leave a shortcut unassigned if another browser or system command owns it.

FindNav requests injection on all URL patterns Chrome allows through `<all_urls>`, including `file://` pages when you enable **Allow access to file URLs** for the extension. Chrome still blocks extensions from injecting into protected browser pages like `chrome://...`, the Chrome Web Store, other extensions' pages, and Chrome's built-in PDF viewer. If the toolbar popup says the content script is not injected, reload the web page after reloading the extension. Chrome does not retroactively inject updated content scripts into tabs that were already open.
