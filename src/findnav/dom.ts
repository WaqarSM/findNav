import { ACTION_SELECTOR, ROOT_ID, SKIPPED_TAGS } from "./constants.js";
import type { ActionKind } from "./types.js";

export function getActionKind(element: HTMLElement): ActionKind {
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

export function getAccessibleName(element: HTMLElement): string {
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

export function isSearchableElement(element: HTMLElement): boolean {
  if (SKIPPED_TAGS.has(element.tagName)) {
    return false;
  }

  if (isInsideFindNav(element)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    Number(style.opacity) === 0
  ) {
    return false;
  }

  const rects = element.getClientRects();
  return rects.length > 0;
}

export function isInsideFindNav(element: Element): boolean {
  return Boolean(element.closest(`#${ROOT_ID}`));
}

export function isInsideActionable(element: Element): boolean {
  return Boolean(element.closest(ACTION_SELECTOR));
}

function getInputValue(element: HTMLElement): string | null {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
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
