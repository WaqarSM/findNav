import { ACTION_SELECTOR, MATCH_HIGHLIGHT_NAME } from "./constants.js";
import { getAccessibleName, getActionKind, isInsideActionable, isInsideFindNav, isSearchableElement } from "./dom.js";
import { setRangeHighlight } from "./highlights.js";
import { scoreCandidate, tokenizeWithOffsets } from "./scoring.js";
import type { ActionMatch, Match, TextMatch } from "./types.js";

export function findActionMatches(normalizedQuery: string): ActionMatch[] {
  const result: ActionMatch[] = [];

  for (const element of Array.from(document.querySelectorAll<HTMLElement>(ACTION_SELECTOR))) {
    if (!isSearchableElement(element) || isInsideFindNav(element)) {
      continue;
    }

    const label = getAccessibleName(element);
    const score = scoreCandidate(label, normalizedQuery);
    if (score === null) {
      continue;
    }

    result.push({
      type: "action",
      element,
      label,
      kind: getActionKind(element),
      score,
    });
  }

  return dedupeActionMatches(result);
}

export function findTextMatches(normalizedQuery: string): TextMatch[] {
  const result: TextMatch[] = [];
  if (!document.body) {
    return result;
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.textContent ?? "";
      if (!text.trim() || scoreCandidate(text, normalizedQuery) === null) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (!parent || !isSearchableElement(parent) || isInsideFindNav(parent) || isInsideActionable(parent)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  for (const node of nodes) {
    result.push(...createTextRanges(node, normalizedQuery));
  }

  setRangeHighlight(
    MATCH_HIGHLIGHT_NAME,
    result.map((match) => match.range),
  );
  return result;
}

export function compareMatches(a: Match, b: Match): number {
  return b.score - a.score;
}

function createTextRanges(node: Text, normalizedQuery: string): TextMatch[] {
  const source = node.textContent ?? "";
  const lowerSource = source.toLocaleLowerCase();
  const textMatches: TextMatch[] = [];
  let index = lowerSource.indexOf(normalizedQuery);

  while (index !== -1) {
    const range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + normalizedQuery.length);
    textMatches.push({ type: "text", range, score: 100 });
    index = lowerSource.indexOf(normalizedQuery, index + normalizedQuery.length);
  }

  if (textMatches.length > 0) {
    return textMatches;
  }

  for (const token of tokenizeWithOffsets(source)) {
    const score = scoreCandidate(token.text, normalizedQuery);
    if (score === null) {
      continue;
    }

    const range = document.createRange();
    range.setStart(node, token.start);
    range.setEnd(node, token.end);
    textMatches.push({ type: "text", range, score });
  }

  return textMatches;
}

function dedupeActionMatches(actionMatches: ActionMatch[]): ActionMatch[] {
  const seen = new Set<HTMLElement>();
  const result: ActionMatch[] = [];

  for (const match of actionMatches) {
    if (seen.has(match.element)) {
      continue;
    }

    seen.add(match.element);
    result.push(match);
  }

  return result;
}
