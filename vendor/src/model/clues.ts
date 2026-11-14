import { produce } from 'immer';
import { slotPattern } from './entries';
import { computeNumbering } from './numbering';
import type { Clue, ClueRole, Direction, EntryRef, Puzzle, Slot } from './types';

/**
 * F6 clues. A clue belongs to the entry starting at its square in its direction, so it follows
 * the entry through renumbering. Slots are derived, so clues are matched to them here.
 */

export const sameEntry = (a: EntryRef, b: EntryRef) =>
  a.row === b.row && a.col === b.col && a.direction === b.direction;

export function clueFor(puzzle: Puzzle, entry: EntryRef): Clue | undefined {
  return puzzle.clues.find((clue) => sameEntry(clue, entry));
}

export function slotFor(slots: Slot[], entry: EntryRef): Slot | undefined {
  return slots.find((slot) => sameEntry(slot, entry));
}

/** An entry has a clue once its text isn't blank. */
export const isClued = (clue: Clue | undefined) => !!clue && clue.text.trim() !== '';

/**
 * Drops clues whose entry no longer exists (no entry starts at that square in that direction).
 * Returns the same puzzle when nothing is dropped.
 */
export function dropOrphanClues(puzzle: Puzzle): Puzzle {
  if (puzzle.clues.length === 0) return puzzle;
  const { slots } = computeNumbering(puzzle);
  const kept = puzzle.clues.filter((clue) => slotFor(slots, clue));
  if (kept.length === puzzle.clues.length) return puzzle;
  return produce(puzzle, (draft) => void (draft.clues = draft.clues.filter((clue) => slotFor(slots, clue))));
}

/** Writes `patch` into the entry's clue record, creating it if needed; drops a record left with no text and no role. */
function updateClue(puzzle: Puzzle, slot: Slot, patch: (clue: Clue) => void): Puzzle {
  return produce(puzzle, (draft) => {
    let clue = draft.clues.find((c) => sameEntry(c, slot));
    if (!clue) {
      clue = { row: slot.row, col: slot.col, direction: slot.direction, text: '', answer: '', role: null, refs: [] };
      draft.clues.push(clue);
    }
    patch(clue);
    if (clue.text === '' && clue.role === null) draft.clues = draft.clues.filter((c) => c !== clue);
  });
}

/** Saves a clue's text, recording the entry's current answer and the entries its cross-references name. */
export function setClue(puzzle: Puzzle, slots: Slot[], slot: Slot, text: string): Puzzle {
  const trimmed = text.trim();
  if ((clueFor(puzzle, slot)?.text ?? '') === trimmed) return puzzle;
  return updateClue(puzzle, slot, (clue) => {
    clue.text = trimmed;
    clue.answer = slotPattern(puzzle, slot);
    clue.refs = resolveRefs(trimmed, slots);
  });
}

/** Marks the entry as theme or revealer, or clears the mark with null. */
export function setClueRole(puzzle: Puzzle, slot: Slot, role: ClueRole | null): Puzzle {
  if ((clueFor(puzzle, slot)?.role ?? null) === role) return puzzle;
  return updateClue(puzzle, slot, (clue) => void (clue.role = role));
}

/** V14: keeps a stale clue for the entry's current answer. */
export function keepClue(puzzle: Puzzle, slot: Slot): Puzzle {
  const clue = clueFor(puzzle, slot);
  if (!clue || !isStale(puzzle, slot, clue)) return puzzle;
  return updateClue(puzzle, slot, (c) => void (c.answer = slotPattern(puzzle, slot)));
}

/**
 * V14: the answer changed since the clue was saved. Only squares that held a letter both then and now count,
 * so a clue written before an entry was complete isn't stale once it fills in.
 */
export function isStale(puzzle: Puzzle, slot: Slot, clue: Clue): boolean {
  if (!isClued(clue)) return false;
  const now = slotPattern(puzzle, slot);
  if (now.length !== clue.answer.length) return true;
  return [...now].some((ch, i) => ch !== '?' && clue.answer[i] !== '?' && ch !== clue.answer[i]);
}

/** A number in a cross-reference such as "17-Across" or "17-, 23- and 51-Down", with where it sits in the text. */
export interface RefMention {
  number: number;
  direction: Direction;
  start: number;
  end: number;
}

// One or more numbers joined by commas, "and" or "&", each with an optional hyphen, then Across or Down.
// The direction must be capitalized, so "count from 10 down" isn't a reference.
const REF_GROUP = /\b(\d+(?:-?\s*(?:,\s*(?:and\s+|&\s*)?|\s+and\s+|\s*&\s*)\d+)*)-?\s*(Across|Down)\b/g;

export function parseRefs(text: string): RefMention[] {
  const mentions: RefMention[] = [];
  for (const group of text.matchAll(REF_GROUP)) {
    const direction: Direction = group[2] === 'Across' ? 'across' : 'down';
    for (const n of group[1]!.matchAll(/\d+/g)) {
      const start = group.index + n.index;
      mentions.push({ number: Number(n[0]), direction, start, end: start + n[0].length });
    }
  }
  return mentions;
}

function resolveRefs(text: string, slots: Slot[]): (EntryRef | null)[] {
  return parseRefs(text).map(({ number, direction }) => {
    const slot = slots.find((s) => s.number === number && s.direction === direction);
    return slot ? { row: slot.row, col: slot.col, direction } : null;
  });
}

/** One cross-reference that no longer points where it did; `now` is the referenced entry's number today, if it still exists. */
export interface BrokenRef {
  mention: RefMention;
  now: number | null;
}

/**
 * V16: cross-references naming an entry that doesn't exist, or no longer the entry they named when saved.
 * A reference that matched nothing when saved is fine once its number exists.
 */
export function brokenRefs(clue: Clue, slots: Slot[]): BrokenRef[] {
  return parseRefs(clue.text).flatMap((mention, i): BrokenRef[] => {
    const named = slots.find((s) => s.number === mention.number && s.direction === mention.direction);
    const saved = clue.refs[i];
    if (!saved) return named ? [] : [{ mention, now: null }];
    const target = slotFor(slots, saved);
    if (target && target === named) return [];
    return [{ mention, now: target?.number ?? null }];
  });
}

/** V16's fix: rewrites each moved reference with its entry's number today. References whose entry is gone stay as written. */
export function fixRefs(puzzle: Puzzle, slots: Slot[], slot: Slot): Puzzle {
  const clue = clueFor(puzzle, slot);
  const fixable = clue ? brokenRefs(clue, slots).filter((b) => b.now !== null) : [];
  if (!clue || fixable.length === 0) return puzzle;
  let text = clue.text;
  // Right to left, so earlier offsets stay valid.
  for (const { mention, now } of [...fixable].reverse()) {
    text = text.slice(0, mention.start) + now + text.slice(mention.end);
  }
  // The references still name the same entries, so `refs` is unchanged.
  return updateClue(puzzle, slot, (c) => void (c.text = text));
}
