export interface ParsedMsg {
  visible: string;
  think: string;
}

/**
 * Extracts optional <think> blocks from model output. The raw input may be a
 * string, array of strings (streaming deltas) or anything with a toString
 * method. All text outside the tags is returned in `visible` while the inner
 * text of the first <think>...</think> pair is returned as `think`.
 */
export function parseThink(raw: unknown): ParsedMsg {
  // Normalise to a single string while being null/undefined safe
  const text =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
      ? raw.join('')
      : raw?.toString?.() ?? '';

  const match = text.match(/<think>([\s\S]*?)<\/think>/i);

  if (!match) {
    return { visible: text.trim(), think: '' };
  }

  const think = match[1]?.trim() ?? '';
  const visible = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  return { visible, think };
}