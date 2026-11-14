export type Symmetry = 'rotational' | 'mirror-lr' | 'mirror-tb' | 'diagonal' | 'none';
export type PuzzleType = 'themed' | 'themeless';
export type Mode = 'design' | 'fill' | 'clue';
export type Direction = 'across' | 'down';
export type Coord = [row: number, col: number];

export interface Cell {
  block: boolean;
  /** One letter, or a multi-letter rebus string (F8). Empty when unfilled. */
  value: string;
  /** Theme marker drawn as a circle in the square. White squares only. */
  circled: boolean;
  /** Theme marker drawn as a grey fill, independent of `circled`. White squares only. */
  shaded: boolean;
}

export interface Puzzle {
  rows: number;
  cols: number;
  symmetry: Symmetry;
  type: PuzzleType;
  cells: Cell[][];
  /** F6: one record per clued or marked entry, keyed by its starting square and direction. */
  clues: Clue[];
}

/** F6: marks an entry as part of the theme, or as the entry that explains it. */
export type ClueRole = 'theme' | 'revealer';

/** An entry named by its starting square and direction, which survives renumbering. */
export interface EntryRef {
  row: number;
  col: number;
  direction: Direction;
}

export interface Clue extends EntryRef {
  text: string;
  /** The entry's letters when the clue was last saved (`?` for empty squares); V14 compares it with the grid. */
  answer: string;
  role: ClueRole | null;
  /** The entry each cross-reference in `text` named when it was saved, in text order; null if none matched (V16). */
  refs: (EntryRef | null)[];
}

/** A derived entry: a run of 2+ white cells. Never stored on the puzzle. */
export interface Slot {
  number: number;
  direction: Direction;
  row: number;
  col: number;
  length: number;
  cells: Coord[];
}
