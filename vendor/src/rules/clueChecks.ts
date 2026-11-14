import { brokenRefs, clueFor, isClued, isStale } from '../model/clues';
import { slotPattern } from '../model/entries';
import type { Clue, Puzzle, Slot } from '../model/types';
import { acrossFirst, slotName, TIER_ORDER, type Issue } from './validate';

/** Common words V17 ignores, however often they appear. */
const COMMON = new Set(
  (
    'ABOUT AFTER ALSO BEEN BEFORE BEING COULD DOES DONE EACH FROM HAVE INTO JUST LIKE MANY MORE MOST MUCH ' +
    'ONLY OTHER OVER SOME SUCH THAN THAT THEIR THEM THEN THERE THESE THEY THIS THOSE VERY WERE WHAT WHEN ' +
    'WHERE WHICH WHILE WITH WOULD YOUR ACROSS DOWN'
  ).split(' '),
);

/** A clue's words in A–Z, ignoring case and punctuation. Spaces, hyphens and slashes separate words. */
export function clueWords(text: string): string[] {
  return text
    .split(/[\s\-–—/]+/)
    .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ''))
    .filter(Boolean);
}

/** Longest run of clue words V15 joins when looking for a multi-word answer such as ICE CREAM. */
const MAX_RUN = 4;

/** V15: answers spelled by a word, or a run of consecutive words, in the clue. */
function answersIn(text: string, answers: Map<string, Slot[]>): string[] {
  const words = clueWords(text);
  const found = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    let joined = '';
    for (let j = i; j < Math.min(words.length, i + MAX_RUN); j++) {
      joined += words[j];
      if (answers.has(joined)) found.add(joined);
    }
  }
  return [...found];
}

const clueName = (slot: Slot) => `${slotName(slot)} clue`;
const refName = (number: number, direction: Slot['direction']) =>
  `${number}-${direction === 'across' ? 'Across' : 'Down'}`;

/**
 * F6 clue checks, shown only in the clue view: V13 missing clues (one summary), V14 stale clues,
 * V15 answers in clues, V16 broken cross-references and V17 repeated clue words. Errors never arise.
 */
export function clueIssues(puzzle: Puzzle, slots: Slot[]): Issue[] {
  const issues: Issue[] = [];
  const ordered = [...slots].sort(acrossFirst);
  const clued: [Slot, Clue][] = ordered.flatMap((slot) => {
    const clue = clueFor(puzzle, slot);
    return clue && isClued(clue) ? [[slot, clue]] : [];
  });

  const missing = ordered.filter((slot) => !isClued(clueFor(puzzle, slot)));
  if (missing.length > 0) {
    issues.push({
      rule: 'V13',
      tier: 'info',
      message: `${missing.length} ${missing.length === 1 ? 'entry has' : 'entries have'} no clue`,
      cells: missing.flatMap((s) => s.cells),
      entry: missing[0],
    });
  }

  const answers = new Map<string, Slot[]>();
  for (const slot of ordered) {
    const answer = slotPattern(puzzle, slot);
    if (!answer.includes('?')) answers.set(answer, [...(answers.get(answer) ?? []), slot]);
  }

  for (const [slot, clue] of clued) {
    if (isStale(puzzle, slot, clue)) {
      const now = slotPattern(puzzle, slot).replaceAll('?', '·');
      issues.push({
        rule: 'V14',
        tier: 'warning',
        message: `${clueName(slot)} was written for ${clue.answer.replaceAll('?', '·')}, now ${now}`,
        cells: slot.cells,
        entry: slot,
        fix: 'keep',
      });
    }

    for (const answer of answersIn(clue.text, answers)) {
      const holders = answers.get(answer)!;
      const where = holders.includes(slot) ? 'its own answer' : slotName(holders[0]!);
      issues.push({
        rule: 'V15',
        tier: 'warning',
        message: `${clueName(slot)} contains ${answer} (${where})`,
        cells: [...slot.cells, ...holders.filter((h) => h !== slot).flatMap((h) => h.cells)],
        entry: slot,
      });
    }

    const broken = brokenRefs(clue, slots);
    if (broken.length > 0) {
      const notes = broken.map(({ mention, now }) => {
        const was = refName(mention.number, mention.direction);
        if (now !== null) return `${was} is now ${refName(now, mention.direction)}`;
        const exists = slots.some((s) => s.number === mention.number && s.direction === mention.direction);
        return exists ? `${was} is a different entry now` : `there’s no ${was}`;
      });
      issues.push({
        rule: 'V16',
        tier: 'warning',
        message: `${clueName(slot)}: ${notes.join('; ')}`,
        cells: slot.cells,
        entry: slot,
        ...(broken.some((b) => b.now !== null) && { fix: 'refs' as const }),
      });
    }
  }

  // V17: words of four or more letters, counted once per clue.
  const byWord = new Map<string, Slot[]>();
  for (const [slot, clue] of clued) {
    for (const word of new Set(clueWords(clue.text))) {
      if (word.length >= 4 && !COMMON.has(word)) byWord.set(word, [...(byWord.get(word) ?? []), slot]);
    }
  }
  for (const [word, found] of byWord) {
    if (found.length < 3) continue;
    issues.push({
      rule: 'V17',
      tier: 'info',
      message: `“${word.toLowerCase()}” is in ${found.length} clues (${found.map(slotName).join(', ')})`,
      cells: found.flatMap((s) => s.cells),
      entry: found[0],
    });
  }

  return issues.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}
