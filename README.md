# FindNav

FindNav is a Manifest V3 Chrome extension for keyboard-first page navigation. It opens a compact finder overlay, searches visible page text plus links and controls, prioritizes actionable matches, and lets you activate the selected target from the keyboard.

## Build

```sh
npm install
npm run build
```

For a release sanity check:

```sh
npm run release:check
```

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select the `dist` folder from this project.

## Use

- Click the FindNav toolbar icon to check whether the current page has the content script loaded, then use **Open FindNav** as a shortcut-independent test.
- `Shift+Command+F` opens FindNav on supported pages (`Shift+Ctrl+F` on Windows/Linux).
- Type to search.
- Searches use soft matching: exact matches rank first, then word-start matches, one- or two-character typos, and rough subsequence matches. For example, `lpgin` can still match `login`.
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

## Troubleshooting

If the shortcut does not fire, use the toolbar popup's **Open FindNav** button as a shortcut-independent check. FindNav listens for `Shift+Command+F` (`Shift+Ctrl+F` on Windows/Linux) inside pages where the content script can run.

FindNav requests injection on all URL patterns Chrome allows through `<all_urls>`, including `file://` pages when you enable **Allow access to file URLs** for the extension. Chrome still blocks extensions from injecting into protected browser pages like `chrome://...`, the Chrome Web Store, other extensions' pages, and Chrome's built-in PDF viewer. For v1, FindNav runs in the top page frame only. If the toolbar popup says the content script is not injected, reload the web page after reloading the extension. Chrome does not retroactively inject updated content scripts into tabs that were already open.
