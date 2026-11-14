import type { Puzzle, Slot } from '../model/types';

export interface Guideline {
  label: string;
  max: number;
  /** True when scaled from the 15×15 figure rather than published. */
  estimated: boolean;
}

/** Below this many cells (an 11×11), a scaled estimate means little, so no guideline is shown. */
const MIN_CELLS_FOR_ESTIMATE = 121;

/**
 * V5 is display only: the word count is shown against the published NYT maximum for the size, never
 * capped. One figure per size, themed or themeless alike: 78 at 15×15 and 140 at 21×21.
 */
export function wordCountGuideline(p: Puzzle): Guideline | null {
  if (p.rows === 21 && p.cols === 21) return { label: 'NYT max', max: 140, estimated: false };
  if (p.rows === 15 && p.cols === 15) return { label: 'NYT max', max: 78, estimated: false };
  const cells = p.rows * p.cols;
  if (cells < MIN_CELLS_FOR_ESTIMATE) return null;
  return { label: 'NYT max', max: Math.round((78 * cells) / 225), estimated: true };
}

export interface GridStats {
  words: number;
  guideline: Guideline | null;
  blocks: number;
  blockShare: number;
  /** White squares with no block among their eight neighbors (the grid edge doesn't count). */
  openSquares: number;
  /** Entry counts for lengths 3 up to the longer grid side. */
  lengths: { length: number; count: number }[];
}

export function computeStats(p: Puzzle, slots: Slot[]): GridStats {
  const cells = p.cells.flat();
  const blocks = cells.filter((cell) => cell.block).length;

  let openSquares = 0;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (p.cells[r]![c]!.block) continue;
      let open = true;
      for (let dr = -1; dr <= 1 && open; dr++) {
        for (let dc = -1; dc <= 1 && open; dc++) open = !p.cells[r + dr]?.[c + dc]?.block;
      }
      if (open) openSquares++;
    }
  }

  const lengths = Array.from({ length: Math.max(p.rows, p.cols) - 2 }, (_, i) => ({
    length: i + 3,
    count: slots.filter((s) => s.length === i + 3).length,
  }));

  return {
    words: slots.length,
    guideline: wordCountGuideline(p),
    blocks,
    blockShare: blocks / cells.length,
    openSquares,
    lengths,
  };
}
