export interface ThinkParseResult {
  answer: string;
  think?: string;
}

export function parseThink(text: string): ThinkParseResult {
  const match = text.match(/<think>([\s\S]*?)<\/think>/i);
  if (match) {
    return {
      answer: text.replace(match[0], '').trimStart(),
      think: match[1].trim(),
    };
  }
  return { answer: text };
}