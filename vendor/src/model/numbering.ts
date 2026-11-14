import type { Coord, Direction, Puzzle, Slot } from './types';

const STEP: Record<Direction, Coord> = { across: [0, 1], down: [1, 0] };

/**
 * Standard numbering: a white cell gets the next number (in reading order) if it starts
 * an Across or Down run of 2+ white cells. Returns the numbers grid and every entry.
 */
export function computeNumbering(puzzle: Puzzle): { numbers: (number | null)[][]; slots: Slot[] } {
  const isWhite = (r: number, c: number) =>
    r >= 0 && r < puzzle.rows && c >= 0 && c < puzzle.cols && !puzzle.cells[r]![c]!.block;

  const numbers: (number | null)[][] = [];
  const slots: Slot[] = [];
  let next = 1;

  for (let r = 0; r < puzzle.rows; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < puzzle.cols; c++) {
      let number: number | null = null;
      for (const direction of ['across', 'down'] as const) {
        const [dr, dc] = STEP[direction];
        if (!isWhite(r, c) || isWhite(r - dr, c - dc) || !isWhite(r + dr, c + dc)) continue;
        number ??= next++;
        const cells: Coord[] = [];
        for (let rr = r, cc = c; isWhite(rr, cc); rr += dr, cc += dc) cells.push([rr, cc]);
        slots.push({ number, direction, row: r, col: c, length: cells.length, cells });
      }
      row.push(number);
    }
    numbers.push(row);
  }
  return { numbers, slots };
}

export function slotAt(slots: Slot[], r: number, c: number, direction: Direction): Slot | undefined {
  return slots.find((s) => s.direction === direction && s.cells.some(([sr, sc]) => sr === r && sc === c));
}

/** Tab order: all Across entries by number, then all Down. Slots come in reading order, so each half is sorted. */
export function tabOrder(slots: Slot[]): Slot[] {
  return [...slots.filter((s) => s.direction === 'across'), ...slots.filter((s) => s.direction === 'down')];
}
