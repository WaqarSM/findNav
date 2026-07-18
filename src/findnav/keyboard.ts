export function isOpenShortcut(event: KeyboardEvent): boolean {
  const hasCommandOrCtrl = event.metaKey || event.ctrlKey;
  return (
    event.shiftKey &&
    hasCommandOrCtrl &&
    !event.altKey &&
    event.key.toLocaleLowerCase() === "f"
  );
}

export function isEditableEventTarget(event: KeyboardEvent): boolean {
  for (const item of event.composedPath()) {
    if (!(item instanceof HTMLElement)) {
      continue;
    }

    if (
      item.closest(
        "input, textarea, select, [contenteditable=''], [contenteditable='true']",
      )
    ) {
      return true;
    }
  }

  return false;
}
