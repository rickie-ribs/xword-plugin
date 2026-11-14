export interface WordEntry {
  /** A–Z only, as it goes in the grid. */
  word: string;
  /** The entry as the list wrote it, for display. */
  display: string;
}

/**
 * Reads a `WORD;SCORE` list (`.txt` / `.dict`). The score is ignored: candidates are ranked by crossings and past
 * use instead. Words are reduced to A–Z (accents folded, spaces and punctuation dropped); when two lines
 * reduce to the same word, the first one wins. Lines that aren't `WORD;SCORE` are skipped.
 */
export function parseWordlist(text: string): WordEntry[] {
  const seen = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const match = /^(.+);\s*(\d+)\s*$/.exec(line);
    if (!match) continue;
    const display = match[1]!.trim();
    const word = display.normalize('NFD').toUpperCase().replace(/[^A-Z]/g, '');
    if (word && !seen.has(word)) seen.set(word, display);
  }
  return [...seen].map(([word, display]) => ({ word, display }));
}
