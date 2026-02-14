/**
 * Extract a balanced JSON object from text starting at a given position.
 * Tracks brace depth and string escaping to find the matching closing brace.
 */
function extractBalancedJson(text: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function normalizeJsonPayload(payload: string) {
  const trimmed = payload.trim();

  // Fast path: already a clean JSON object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  // Try extracting from ```json code fence
  const fencedMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    const inner = fencedMatch[1].trim();
    if (inner.startsWith('{')) {
      return inner;
    }
  }

  // Try finding a balanced JSON object starting with {"files"
  const filesIdx = trimmed.indexOf('{"files"');
  if (filesIdx !== -1) {
    const candidate = extractBalancedJson(trimmed, filesIdx);
    if (candidate) {
      return candidate;
    }
  }

  // Try {"files": with a space
  const filesIdx2 = trimmed.indexOf('{ "files"');
  if (filesIdx2 !== -1) {
    const candidate = extractBalancedJson(trimmed, filesIdx2);
    if (candidate) {
      return candidate;
    }
  }

  // Fallback: first { to last }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}
