export function scoreCandidate(candidate: string, normalizedQuery: string): number | null {
  const normalizedCandidate = normalizeSearchText(candidate);
  if (!normalizedCandidate || !normalizedQuery) {
    return null;
  }

  const exactIndex = normalizedCandidate.indexOf(normalizedQuery);
  if (exactIndex !== -1) {
    return exactIndex === 0 ? 100 : 96;
  }

  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return 90;
  }

  if (hasWordStartMatch(normalizedCandidate, normalizedQuery)) {
    return 82;
  }

  const typoScore = scoreTypoMatch(normalizedCandidate, normalizedQuery);
  if (typoScore !== null) {
    return typoScore;
  }

  if (isSubsequence(normalizedQuery, normalizedCandidate)) {
    const density = normalizedQuery.length / normalizedCandidate.length;
    return Math.round(45 + Math.min(10, density * 10));
  }

  return null;
}

export function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

export function tokenizeWithOffsets(value: string): Array<{ text: string; start: number; end: number }> {
  const tokens: Array<{ text: string; start: number; end: number }> = [];
  const matcher = /[a-z0-9]+/gi;
  let match: RegExpExecArray | null = matcher.exec(value);

  while (match) {
    tokens.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
    match = matcher.exec(value);
  }

  return tokens;
}

function hasWordStartMatch(candidate: string, query: string): boolean {
  return candidate
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .some((word) => word.startsWith(query));
}

function scoreTypoMatch(candidate: string, query: string): number | null {
  if (query.length < 3) {
    return null;
  }

  const maxDistance = query.length <= 5 ? 1 : 2;
  let bestScore: number | null = null;

  for (const token of tokenizeWords(candidate)) {
    if (Math.abs(token.length - query.length) > maxDistance) {
      continue;
    }

    const distance = damerauLevenshtein(token, query, maxDistance);
    if (distance <= maxDistance) {
      const score = 74 - distance * 7;
      bestScore = bestScore === null ? score : Math.max(bestScore, score);
    }
  }

  return bestScore;
}

function tokenizeWords(value: string): string[] {
  return value.split(/[^a-z0-9]+/i).filter(Boolean);
}

function isSubsequence(query: string, candidate: string): boolean {
  let queryIndex = 0;

  for (const character of candidate) {
    if (character === query[queryIndex]) {
      queryIndex += 1;
      if (queryIndex === query.length) {
        return true;
      }
    }
  }

  return false;
}

function damerauLevenshtein(source: string, target: string, maxDistance: number): number {
  const sourceLength = source.length;
  const targetLength = target.length;

  if (Math.abs(sourceLength - targetLength) > maxDistance) {
    return maxDistance + 1;
  }

  const distances: number[][] = Array.from({ length: sourceLength + 1 }, () => Array(targetLength + 1).fill(0));

  for (let sourceIndex = 0; sourceIndex <= sourceLength; sourceIndex += 1) {
    distances[sourceIndex][0] = sourceIndex;
  }

  for (let targetIndex = 0; targetIndex <= targetLength; targetIndex += 1) {
    distances[0][targetIndex] = targetIndex;
  }

  for (let sourceIndex = 1; sourceIndex <= sourceLength; sourceIndex += 1) {
    let rowBest = Number.POSITIVE_INFINITY;

    for (let targetIndex = 1; targetIndex <= targetLength; targetIndex += 1) {
      const substitutionCost = source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1;
      let distance = Math.min(
        distances[sourceIndex - 1][targetIndex] + 1,
        distances[sourceIndex][targetIndex - 1] + 1,
        distances[sourceIndex - 1][targetIndex - 1] + substitutionCost,
      );

      if (
        sourceIndex > 1 &&
        targetIndex > 1 &&
        source[sourceIndex - 1] === target[targetIndex - 2] &&
        source[sourceIndex - 2] === target[targetIndex - 1]
      ) {
        distance = Math.min(distance, distances[sourceIndex - 2][targetIndex - 2] + 1);
      }

      distances[sourceIndex][targetIndex] = distance;
      rowBest = Math.min(rowBest, distance);
    }

    if (rowBest > maxDistance) {
      return maxDistance + 1;
    }
  }

  return distances[sourceLength][targetLength];
}
