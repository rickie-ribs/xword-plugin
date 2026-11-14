/**
 * What `npm run xw` does, as functions over a puzzle. No file or console access, so tests can use them directly.
 * Squares are 1-based here (r1c1 is the top-left square), the way a person counts them.
 */
import { countMatches, type WordIndex } from '../src/engine/index';
import { placeWord, slotPattern } from '../src/model/entries';
import { createPuzzle } from '../src/model/grid';
import { computeNumbering } from '../src/model/numbering';
import { toggleBlock } from '../src/model/symmetry';
import type { Coord, Puzzle, Slot, Symmetry } from '../src/model/types';
import { completeEntries } from '../src/rules/difficulty';
import { unfillableSlots, validate, type Issue } from '../src/rules/validate';
import { produce } from 'immer';

/** A puzzle from rows of `#` (block), `.` (empty) and letters. */
export function patternToPuzzle(text: string, symmetry: Symmetry): Puzzle {
  const rows = text.split('\n').map((row) => row.trim()).filter(Boolean);
  const cols = rows[0]?.length ?? 0;
  if (rows.some((row) => row.length !== cols)) throw new Error('Every row of a pattern must be the same width.');
  const puzzle = createPuzzle(rows.length, cols, symmetry);
  return produce(puzzle, (draft) => {
    rows.forEach((row, r) =>
      [...row].forEach((ch, c) => {
        const cell = draft.cells[r]![c]!;
        if (ch === '#') cell.block = true;
        else if (ch !== '.') cell.value = ch.toUpperCase();
      }),
    );
  });
}

const refOf = (slot: Slot) => `${slot.number}${slot.direction === 'across' ? 'A' : 'D'}`;

/** The entry named like `12A` or `3D`. */
export function findEntry(puzzle: Puzzle, ref: string): Slot {
  const match = /^(\d+)([AD])$/i.exec(ref);
  if (!match) throw new Error(`Name entries like 12A or 3D, not "${ref}".`);
  const direction = match[2]!.toUpperCase() === 'A' ? 'across' : 'down';
  const slot = computeNumbering(puzzle).slots.find((s) => s.number === Number(match[1]) && s.direction === direction);
  if (!slot) throw new Error(`No entry ${ref} in this grid.`);
  return slot;
}

export function placeEntry(puzzle: Puzzle, ref: string, word: string): Puzzle {
  const slot = findEntry(puzzle, ref);
  const letters = word.toUpperCase().replace(/[^A-Z]/g, '');
  const pattern = slotPattern(puzzle, slot);
  if (pattern === letters) return puzzle;
  const placed = placeWord(puzzle, slot, letters);
  if (placed === puzzle) throw new Error(`${letters} doesn't fit ${ref} (${pattern}).`);
  return placed;
}

export function clearEntry(puzzle: Puzzle, ref: string): Puzzle {
  const slot = findEntry(puzzle, ref);
  return produce(puzzle, (draft) => {
    for (const [r, c] of slot.cells) draft.cells[r]![c]!.value = '';
  });
}

/** Toggles each 1-based square along with its symmetric partner. */
export function toggleBlocks(puzzle: Puzzle, squares: Coord[]): Puzzle {
  return squares.reduce((next, [r, c]) => {
    if (r < 1 || c < 1 || r > next.rows || c > next.cols) throw new Error(`r${r}c${c} is off the grid.`);
    return toggleBlock(next, r - 1, c - 1);
  }, puzzle);
}

export interface CheckOptions {
  /** Words that must be in the grid, across or down. */
  required?: string[];
  /** Words the constructor has allowed off the list, so V11 skips them; `*` allows every complete entry. */
  accepted?: string[];
}

export interface CheckReport {
  issues: Issue[];
  /** Complete entries that aren't on the word list, whether or not they're allowed. */
  offList: string[];
  /** Required words not in the grid. */
  missing: string[];
  /** White squares with no letter. */
  empty: number;
}

/** F3's rules plus V11, which needs the word list. */
export function checkPuzzle(puzzle: Puzzle, index: WordIndex, options: CheckOptions = {}): CheckReport {
  const { slots } = computeNumbering(puzzle);
  const entries = completeEntries(puzzle, slots);
  const offList = entries.filter((entry) => entry.length >= 3 && countMatches(index, entry) === 0);
  const accepted = new Set(options.accepted?.includes('*') ? offList : options.accepted?.map(normalize));
  const counts = slots.map((slot) => countMatches(index, slotPattern(puzzle, slot)));
  return {
    issues: [...validate(puzzle), ...unfillableSlots(slots, counts, puzzle, accepted)],
    offList,
    missing: (options.required ?? []).map(normalize).filter((word) => !entries.includes(word)),
    empty: puzzle.cells.flat().filter((cell) => !cell.block && !cell.value).length,
  };
}

/** The list's lines with a score of at least `minScore`, minus `ban`. For steering a fill; the app's solver ignores scores. */
export function filterWordlist(text: string, minScore: number, ban: string[] = []): string {
  const banned = new Set(ban.map(normalize));
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const match = /^(.+);\s*(\d+)\s*$/.exec(line);
      return match && Number(match[2]) >= minScore && !banned.has(normalize(match[1]!));
    })
    .join('\n');
}

const normalize = (word: string) => word.toUpperCase().replace(/[^A-Z]/g, '');

export function renderGrid(puzzle: Puzzle): string {
  const pad = (n: number | string) => String(n).padStart(2);
  const ruler = Array.from({ length: puzzle.cols }, (_, c) => (c + 1) % 10).join(' ');
  const rows = puzzle.cells.map(
    (row, r) => `${pad(r + 1)} ${row.map((cell) => (cell.block ? '#' : cell.value || '.')).join(' ')}`,
  );
  return [`   ${ruler}`, ...rows].join('\n');
}

export function renderEntries(puzzle: Puzzle, slots: Slot[]): string {
  return slots
    .map((slot) => `${refOf(slot).padEnd(4)} r${slot.row + 1}c${slot.col + 1}`.padEnd(12) + ` ${slotPattern(puzzle, slot)}`)
    .join('\n');
}
