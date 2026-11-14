import { createPuzzle } from '../../src/model/grid';
import type { Puzzle } from '../../src/model/types';

/** Builds a puzzle from rows of `#` (block), `.` (empty white), A–Z (letter) or a–z (circled letter). */
export function fromRows(rows: string[], symmetry: Puzzle['symmetry'] = 'none'): Puzzle {
  const puzzle = createPuzzle(rows.length, rows[0]!.length, symmetry);
  rows.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      const cell = puzzle.cells[r]![c]!;
      if (ch === '#') cell.block = true;
      else if (ch !== '.') {
        cell.value = ch.toUpperCase();
        cell.circled = ch !== cell.value;
      }
    });
  });
  return puzzle;
}

export function blockCount(puzzle: Puzzle): number {
  return puzzle.cells.flat().filter((cell) => cell.block).length;
}

/** 5×5 mini with two corner blocks. */
export const MINI_CORNERS = ['#....', '.....', '.....', '.....', '....#'];

/** Has 2-letter entries both ways. */
export const TWO_LETTER_RUNS = ['..#..', '.....', '#...#'];

/** Center column cell (1,1) sits in 1-letter runs both ways, so it starts no entry. */
export const ONE_LETTER_RUNS = ['.#.', '...', '.#.'];

/** NYT-legal 15×15: rotationally symmetric, 70 words, 33 blocks, every square checked, no 2-letter entries. */
export const LEGAL_15 = [
  '#......#...#...',
  '.......#...#...',
  '...............',
  '...##.....#....',
  '....#....#.....',
  '....#.........#',
  '....#...#.....#',
  '...#...#...#...',
  '#.....#...#....',
  '#.........#....',
  '.....#....#....',
  '....#.....##...',
  '...............',
  '...#...#.......',
  '...#...#......#',
];

/** A 3×3 word square: every entry appears twice (Across and Down). */
export const WORD_SQUARE = ['CAT', 'ARE', 'TEA'];

/** Every square is checked, but the top-left corner (8 squares) touches the rest only at (2,2). */
export const DIAGONAL_PINCH = ['...#...', '...#...', '.......', '##.....', '##.....'];
