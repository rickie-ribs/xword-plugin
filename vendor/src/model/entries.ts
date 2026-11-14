import { produce } from 'immer';
import { tabOrder } from './numbering';
import type { Coord, Direction, Puzzle, Slot } from './types';

/** Where each cell of the entry starts in its letter string. A rebus cell (F8) spans several letters; an empty cell one. */
export function letterOffsets(puzzle: Puzzle, slot: Slot): number[] {
  let offset = 0;
  return slot.cells.map(([r, c]) => {
    const start = offset;
    offset += puzzle.cells[r]![c]!.value.length || 1;
    return start;
  });
}

/** The entry's letters with `?` for each empty square. Rebus cells are expanded, since the engine counts letters. */
export function slotPattern(puzzle: Puzzle, slot: Slot): string {
  return slot.cells.map(([r, c]) => puzzle.cells[r]![c]!.value || '?').join('');
}

/**
 * F4: writes `word` into the entry's empty squares. Returns the same puzzle (so no undo step) when the word
 * doesn't fit the letters already there or there is nothing to fill.
 */
export function placeWord(puzzle: Puzzle, slot: Slot, word: string): Puzzle {
  const pattern = slotPattern(puzzle, slot);
  if (word.length !== pattern.length || !pattern.includes('?')) return puzzle;
  if ([...pattern].some((ch, i) => ch !== '?' && ch !== word[i])) return puzzle;
  const offsets = letterOffsets(puzzle, slot);
  return produce(puzzle, (draft) => {
    slot.cells.forEach(([r, c], i) => {
      const cell = draft.cells[r]![c]!;
      if (!cell.value) cell.value = word[offsets[i]!]!;
    });
  });
}

/**
 * Where the cursor goes after an entry is completed: the first empty square of the next entry in Tab order
 * that has one, wrapping around. Undefined when no other entry has an empty square.
 */
export function nextOpenEntry(
  puzzle: Puzzle,
  slots: Slot[],
  from: Slot,
): { cell: Coord; direction: Direction } | undefined {
  const order = tabOrder(slots);
  const start = order.indexOf(from);
  for (let i = 1; i < order.length; i++) {
    const slot = order[(start + i) % order.length]!;
    const cell = slot.cells.find(([r, c]) => !puzzle.cells[r]![c]!.value);
    if (cell) return { cell, direction: slot.direction };
  }
  return undefined;
}
