export type LlmProvider = 'claude' | 'zai';

const CLAUDE_ALIASES = new Set(['claude', 'anthropic']);
const ZAI_ALIASES = new Set(['zai', 'glm', 'glm-4.7', 'glm4.7']);

export function getLlmProvider(value?: string): LlmProvider {
  if (!value) {
    return 'claude';
  }

  const normalized = value.trim().toLowerCase();
  if (CLAUDE_ALIASES.has(normalized)) {
    return 'claude';
  }

  if (ZAI_ALIASES.has(normalized)) {
    return 'zai';
  }

  throw new Error(`지원되지 않는 LLM_PROVIDER 값입니다: ${value}`);
}
