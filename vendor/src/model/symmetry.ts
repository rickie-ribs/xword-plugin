import { produce } from 'immer';
import type { Coord, Puzzle, Symmetry } from './types';

export const SYMMETRY_MODES: Symmetry[] = ['rotational', 'mirror-lr', 'mirror-tb', 'diagonal', 'none'];

export const SYMMETRY_LABELS: Record<Symmetry, string> = {
  rotational: 'Rotational (180°)',
  'mirror-lr': 'Mirror left–right',
  'mirror-tb': 'Mirror top–bottom',
  diagonal: 'Diagonal',
  none: 'None',
};

/** Diagonal reflection swaps rows and columns, so it needs a square grid. */
export function isSymmetryAvailable(mode: Symmetry, rows: number, cols: number): boolean {
  return mode !== 'diagonal' || rows === cols;
}

/** The cell that mirrors (r, c) under `mode`. Every mode is its own inverse; a cell may be its own partner. */
export function partnerOf(r: number, c: number, rows: number, cols: number, mode: Symmetry): Coord {
  switch (mode) {
    case 'rotational':
      return [rows - 1 - r, cols - 1 - c];
    case 'mirror-lr':
      return [r, cols - 1 - c];
    case 'mirror-tb':
      return [rows - 1 - r, c];
    case 'diagonal':
      return [c, r];
    case 'none':
      return [r, c];
  }
}

/** Toggles (r, c) and sets its partner to the same state in one action. New blocks lose their letters, circles and shading. */
export function toggleBlock(puzzle: Puzzle, r: number, c: number): Puzzle {
  const block = !puzzle.cells[r]![c]!.block;
  const [pr, pc] = partnerOf(r, c, puzzle.rows, puzzle.cols, puzzle.symmetry);
  return produce(puzzle, (draft) => {
    for (const cell of [draft.cells[r]![c]!, draft.cells[pr]![pc]!]) {
      cell.block = block;
      if (block) {
        cell.value = '';
        cell.circled = false;
        cell.shaded = false;
      }
    }
  });
}

function eachPair(puzzle: Puzzle, mode: Symmetry, fn: (cell: Coord, partner: Coord) => void) {
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const [pr, pc] = partnerOf(r, c, puzzle.rows, puzzle.cols, mode);
      // Visit each pair once, from the cell that comes first in reading order.
      if (r * puzzle.cols + c < pr * puzzle.cols + pc) fn([r, c], [pr, pc]);
    }
  }
}

/** Both cells of every pair whose block state disagrees under `mode`, in reading order of the first cell. */
export function findAsymmetric(puzzle: Puzzle, mode: Symmetry): Coord[] {
  const broken: Coord[] = [];
  eachPair(puzzle, mode, ([r, c], [pr, pc]) => {
    if (puzzle.cells[r]![c]!.block !== puzzle.cells[pr]![pc]!.block) broken.push([r, c], [pr, pc]);
  });
  return broken;
}

/**
 * Copies the block pattern of one half onto the other so the grid satisfies `mode`.
 * The first half is the cell of each pair that comes first in reading order (top, or left).
 */
export function mirrorFromHalf(puzzle: Puzzle, mode: Symmetry, half: 'first' | 'second'): Puzzle {
  return produce(puzzle, (draft) => {
    eachPair(puzzle, mode, ([r, c], [pr, pc]) => {
      const [source, target] =
        half === 'first' ? [draft.cells[r]![c]!, draft.cells[pr]![pc]!] : [draft.cells[pr]![pc]!, draft.cells[r]![c]!];
      if (target.block === source.block) return;
      target.block = source.block;
      target.value = '';
      target.circled = false;
      target.shaded = false;
    });
  });
}
