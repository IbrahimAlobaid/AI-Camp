const CORRECTION_PATTERN =
  /A more natural sentence is:\s*["“]?(.+?)(?:["”])?(?=\s+(?:We|Use|The|Because|This|What|Where|When|Why|How|Do|Did|Have|Can|Would|Tell)\b|$)/i;

export function extractCorrection(text: string): string | null {
  const match = text.match(CORRECTION_PATTERN);
  return match?.[1]?.trim() ?? null;
}

export function sentenceWithPunctuation(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function mergeUniqueSentence(current: string, next: string): string {
  const sentence = sentenceWithPunctuation(next);
  if (!sentence || current.includes(sentence)) return current;
  return `${current} ${sentence}`.trim();
}
