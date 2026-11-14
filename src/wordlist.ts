const MIN_WORDS = 1000;

export const CREDIT = `Spread the Word(list) by Brooke Husic and Enrique Henestroza Anguiano
https://www.spreadthewordlist.com/
Licensed under CC BY-NC-SA 4.0: https://creativecommons.org/licenses/by-nc-sa/4.0/
Free to use in a product offered free of charge, with attribution, and to sell puzzles built with it.`;

/** Throws unless the text is a WORD;SCORE list: at least MIN_WORDS lines, nearly all of them in that form. */
export function checkList(text: string): number {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const good = lines.filter((l) => /^[^;]+;\d+$/.test(l.trim())).length;
  if (lines.length < MIN_WORDS) throw new Error(`Only ${lines.length} lines: that doesn't look like a wordlist.`);
  if (good < lines.length * 0.99) throw new Error(`Only ${good} of ${lines.length} lines are WORD;SCORE.`);
  return lines.length;
}

/** Drops the lines whose word is in `removed` (one word per line, `#` comments). Returns the list and how many went. */
export function removeWords(text: string, removed: string): { text: string; dropped: number } {
  const drop = new Set(removed.split(/\r?\n/).filter((l) => l && !l.startsWith('#')));
  const lines = text.split(/\r?\n/).filter(Boolean);
  const kept = lines.filter((l) => !drop.has(l.split(';')[0]!));
  return { text: `${kept.join('\n')}\n`, dropped: lines.length - kept.length };
}
