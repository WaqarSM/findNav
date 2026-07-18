import { CONTENT_DEBUG } from "./constants.js";

export function debugContent(message: string, detail?: unknown): void {
  if (!CONTENT_DEBUG) {
    return;
  }

  console.info("[FindNav]", message, detail ?? "");
}
