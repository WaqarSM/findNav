let highlightApi = getHighlightApi();

export function setRangeHighlight(name: string, ranges: Range[]): void {
  highlightApi ??= getHighlightApi();
  if (!highlightApi) {
    return;
  }

  highlightApi.set(name, new Highlight(...ranges));
}

export function clearHighlight(name: string): void {
  highlightApi?.delete(name);
}

export function scrollRangeIntoView(range: Range): void {
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
