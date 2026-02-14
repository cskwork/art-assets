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

/**
 * Strip <think>...</think> blocks that some models include before JSON.
 */
function stripThinkingBlocks(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim();
}

export function normalizeJsonPayload(payload: string) {
  // Strip thinking blocks before processing
  const cleaned = stripThinkingBlocks(payload);
  const trimmed = cleaned.trim();

  // Fast path: already a clean JSON object — but verify it parses
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      // Not valid JSON despite matching braces — fall through to extraction
    }
  }

  // Try extracting from ```json code fence (use greedy match for large blocks)
  const fencedMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n\s*```/i);
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

  // Try {"pass" for review responses
  const passIdx = trimmed.indexOf('{"pass"');
  if (passIdx !== -1) {
    const candidate = extractBalancedJson(trimmed, passIdx);
    if (candidate) {
      return candidate;
    }
  }
  const passIdx2 = trimmed.indexOf('{ "pass"');
  if (passIdx2 !== -1) {
    const candidate = extractBalancedJson(trimmed, passIdx2);
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
