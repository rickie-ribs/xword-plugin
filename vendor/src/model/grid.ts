import { produce } from 'immer';
import { isSymmetryAvailable } from './symmetry';
import type { Cell, Puzzle, PuzzleType, Symmetry } from './types';

export const MIN_SIZE = 3;
export const MAX_SIZE = 25;

export const PRESETS = [
  { label: '15×15 (daily)', rows: 15, cols: 15 },
  { label: '21×21 (Sunday)', rows: 21, cols: 21 },
  { label: '5×5 (mini)', rows: 5, cols: 5 },
  { label: '7×7 (mini)', rows: 7, cols: 7 },
];

function checkSize(n: number) {
  if (!Number.isInteger(n) || n < MIN_SIZE || n > MAX_SIZE) {
    throw new RangeError(`Grid size must be a whole number from ${MIN_SIZE} to ${MAX_SIZE}, got ${n}`);
  }
}

function blankCell(): Cell {
  return { block: false, value: '', circled: false, shaded: false };
}

/** Diagonal falls back to the default rotational mode on non-square grids. */
function fitSymmetry(symmetry: Symmetry, rows: number, cols: number): Symmetry {
  return isSymmetryAvailable(symmetry, rows, cols) ? symmetry : 'rotational';
}

export function createPuzzle(
  rows: number,
  cols: number,
  symmetry: Symmetry = 'rotational',
  type: PuzzleType = 'themed',
): Puzzle {
  checkSize(rows);
  checkSize(cols);
  return {
    rows,
    cols,
    symmetry: fitSymmetry(symmetry, rows, cols),
    type,
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, blankCell)),
    clues: [],
  };
}

/**
 * Resizes to rows × cols, either keeping the overlapping top-left content or starting blank.
 * Kept content keeps its clues; the store then drops any whose entry is gone (F6).
 */
export function resizePuzzle(puzzle: Puzzle, rows: number, cols: number, content: 'keep' | 'clear'): Puzzle {
  const next = createPuzzle(rows, cols, puzzle.symmetry, puzzle.type);
  if (content === 'clear') return next;
  return produce(next, (draft) => {
    draft.clues = puzzle.clues.filter((clue) => clue.row < rows && clue.col < cols);
    for (let r = 0; r < Math.min(rows, puzzle.rows); r++) {
      for (let c = 0; c < Math.min(cols, puzzle.cols); c++) {
        draft.cells[r]![c] = { ...puzzle.cells[r]![c]! };
      }
    }
  });
}

export function hasContent(puzzle: Puzzle): boolean {
  return puzzle.cells.some((row) => row.some((cell) => cell.block || cell.value !== ''));
}
