import { computeNumbering } from '../model/numbering';
import { partnerOf } from '../model/symmetry';
import type { Cell, Coord, Puzzle, Slot } from '../model/types';
import { wordCountGuideline } from './stats';
import { validate, type RuleId } from './validate';

/** V10 isn't here because the solver enforces it, and V8 because a cheater is only info. */
const GUARDED: RuleId[] = ['V1', 'V2', 'V3', 'V4', 'V6', 'V7', 'V9'];

function guardedCounts(p: Puzzle): Map<RuleId, number> {
  const counts = new Map<RuleId, number>();
  for (const { rule } of validate(p)) {
    if (GUARDED.includes(rule)) counts.set(rule, (counts.get(rule) ?? 0) + 1);
  }
  return counts;
}

const untouched = (cell: Cell) => !cell.value && !cell.circled && !cell.shaded;
const entryKey = (s: Slot) => `${s.direction} ${s.row},${s.col} ${s.length}`;

/**
 * F5 Fill and adjust blocks: one square of each symmetric pair a search may change, in reading order. A pair of
 * blocks can open up; a pair of white squares can become blocks if neither has a letter or a mark.
 */
export function changeableSquares(p: Puzzle): Coord[] {
  const squares: Coord[] = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const [pr, pc] = partnerOf(r, c, p.rows, p.cols, p.symmetry);
      if (r * p.cols + c > pr * p.cols + pc) continue;
      const a = p.cells[r]![c]!;
      const b = p.cells[pr]![pc]!;
      if (a.block !== b.block) continue;
      if (a.block || (untouched(a) && untouched(b))) squares.push([r, c]);
    }
  }
  return squares;
}

/**
 * F5 Fill and adjust blocks: a check for patterns proposed from `start`, measured against what `start` already has,
 * so a grid showing a warning can still be repaired. An entry that isn't complete may be split or lengthened.
 */
export function blockChangeCheck(start: Puzzle): (next: Puzzle) => boolean {
  const { slots } = computeNumbering(start);
  const counts = guardedCounts(start);
  const maxWords = Math.max(wordCountGuideline(start)?.max ?? Infinity, slots.length);
  const complete = slots
    .filter((s) => s.cells.every(([r, c]) => start.cells[r]![c]!.value))
    .map(entryKey);

  return (next) => {
    const changedUntouched = start.cells.every((row, r) =>
      row.every((cell, c) => cell.block || next.cells[r]![c]!.block === cell.block || untouched(cell)),
    );
    if (!changedUntouched) return false;
    const nextSlots = computeNumbering(next).slots;
    if (nextSlots.length > maxWords) return false;
    const entries = new Set(nextSlots.map(entryKey));
    if (!complete.every((key) => entries.has(key))) return false;
    for (const [rule, n] of guardedCounts(next)) {
      if (n > (counts.get(rule) ?? 0)) return false;
    }
    return true;
  };
}
