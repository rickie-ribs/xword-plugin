import { slotPattern } from '../model/entries';
import { computeNumbering } from '../model/numbering';
import { findAsymmetric, SYMMETRY_LABELS } from '../model/symmetry';
import type { Coord, EntryRef, Puzzle, Slot } from '../model/types';

export type Tier = 'error' | 'warning' | 'info';
export type RuleId =
  | 'V1'
  | 'V2'
  | 'V3'
  | 'V4'
  | 'V6'
  | 'V7'
  | 'V8'
  | 'V9'
  | 'V10'
  | 'V11'
  | 'V12'
  | 'V13'
  | 'V14'
  | 'V15'
  | 'V16'
  | 'V17'
  | 'V18';

export interface Issue {
  rule: RuleId;
  tier: Tier;
  message: string;
  cells: Coord[];
  /** V11 on a complete entry: the word, so the user can accept it. */
  word?: string;
  /** Clue checks (F6): the entry whose clue raised the issue. */
  entry?: EntryRef;
  /** Clue checks: a one-click fix, keeping a stale clue (V14) or renumbering its cross-references (V16). */
  fix?: 'keep' | 'refs';
}

/** Plain-language explanation of each rule, for the UI. Rule IDs stay internal. */
export const RULE_HELP: Record<RuleId, string> = {
  V1: 'Every entry must be at least 3 letters long.',
  V2: 'Every white square must belong to both an Across and a Down entry.',
  V3: 'All white squares must connect into one region.',
  V4: 'The block pattern must match the chosen symmetry. Set symmetry to None to turn this off.',
  V6: 'Target blocks to stay around 16% of the grid or less.',
  V7: 'Solid 3×3 or larger areas of blocks look heavy and waste space.',
  V8: 'Blocks that could be white without changing the word count.',
  V9: 'A part of the grid that joins the rest through one square.',
  V10: 'The same answer should not appear twice in one puzzle.',
  V11: 'No word in the word list fits these letters.',
  V12: 'Themes usually repeat one rebus string. Check these squares are meant to differ.',
  V13: 'Every entry needs a clue.',
  V14: 'The answer changed after this clue was written. Edit the clue, or keep it for the new answer.',
  V15: 'A clue shouldn’t contain any answer in the grid, its own or another entry’s.',
  V16: 'A cross-reference must point to the entry it meant. Numbers shift when blocks move.',
  V17: 'The same word in several clues reads as repetitive.',
  V18: 'An entry and its plural use the same word twice. Ignore this if they’re different words, like ARE and ARES.',
};

const NEIGHBORS: Coord[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const isBlock = (p: Puzzle, r: number, c: number) => p.cells[r]![c]!.block;
const inGrid = (p: Puzzle, r: number, c: number) => r >= 0 && r < p.rows && c >= 0 && c < p.cols;
const isWhite = (p: Puzzle, r: number, c: number) => inGrid(p, r, c) && !isBlock(p, r, c);

/** Number of white squares from (r, c) outward in direction (dr, dc), not counting (r, c). */
function runFrom(p: Puzzle, r: number, c: number, dr: number, dc: number): number {
  let n = 0;
  while (isWhite(p, r + dr * (n + 1), c + dc * (n + 1))) n++;
  return n;
}

export const slotName = (s: Slot) => `${s.number} ${s.direction === 'across' ? 'Across' : 'Down'}`;
export const acrossFirst = (a: Slot, b: Slot) =>
  a.direction === b.direction ? a.number - b.number : a.direction === 'across' ? -1 : 1;

/** V1: every entry is at least 3 letters. */
export function shortEntries(slots: Slot[]): Issue[] {
  return slots
    .filter((s) => s.length < 3)
    .sort(acrossFirst)
    .map((s) => ({ rule: 'V1', tier: 'error', message: `${s.length}-letter entry: ${slotName(s)}`, cells: s.cells }));
}

/** V2: every white square is part of both an Across and a Down entry. */
export function uncheckedSquares(p: Puzzle): Issue[] {
  const cells: Coord[] = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (isBlock(p, r, c)) continue;
      const across = runFrom(p, r, c, 0, -1) + runFrom(p, r, c, 0, 1);
      const down = runFrom(p, r, c, -1, 0) + runFrom(p, r, c, 1, 0);
      if (across === 0 || down === 0) cells.push([r, c]);
    }
  }
  if (cells.length === 0) return [];
  const message = `${cells.length} unchecked square${cells.length === 1 ? '' : 's'}`;
  return [{ rule: 'V2', tier: 'error', message, cells }];
}

/** Groups cells matching `include` into 4-connected regions. */
function regions(p: Puzzle, include: (r: number, c: number) => boolean): Coord[][] {
  const seen = new Set<number>();
  const out: Coord[][] = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (!include(r, c) || seen.has(r * p.cols + c)) continue;
      const region: Coord[] = [];
      const stack: Coord[] = [[r, c]];
      seen.add(r * p.cols + c);
      while (stack.length) {
        const [cr, cc] = stack.pop()!;
        region.push([cr, cc]);
        for (const [dr, dc] of NEIGHBORS) {
          const [nr, nc] = [cr + dr, cc + dc];
          if (inGrid(p, nr, nc) && include(nr, nc) && !seen.has(nr * p.cols + nc)) {
            seen.add(nr * p.cols + nc);
            stack.push([nr, nc]);
          }
        }
      }
      out.push(region);
    }
  }
  return out;
}

/** V3: white squares form one connected region. Every region but the largest is flagged. */
export function isolatedRegions(p: Puzzle): Issue[] {
  const found = regions(p, (r, c) => !isBlock(p, r, c));
  const largest = found.reduce((best, region) => (region.length > best.length ? region : best), [] as Coord[]);
  return found
    .filter((region) => region !== largest)
    .map((region) => ({
      rule: 'V3',
      tier: 'error',
      message: `Isolated region of ${region.length} square${region.length === 1 ? '' : 's'}`,
      cells: region,
    }));
}

/** V4: the block pattern matches the puzzle's symmetry mode. Symmetry "None" turns this off. */
export function symmetryBreaks(p: Puzzle): Issue[] {
  const cells = findAsymmetric(p, p.symmetry);
  if (cells.length === 0) return [];
  const message = `${cells.length} squares break ${SYMMETRY_LABELS[p.symmetry]} symmetry`;
  return [{ rule: 'V4', tier: 'error', message, cells }];
}

/** Spec target: about 16% blocks or fewer (under ~38 at 15×15), i.e. at most one sixth of the grid. */
export const MAX_BLOCK_SHARE = 1 / 6;

/** V6: block share in moderation. */
export function blockShare(p: Puzzle): Issue[] {
  const blocks = p.cells.flat().filter((cell) => cell.block).length;
  const share = blocks / (p.rows * p.cols);
  if (share <= MAX_BLOCK_SHARE) return [];
  const message = `Blocks are ${Math.round(share * 100)}% of the grid (${blocks})`;
  return [{ rule: 'V6', tier: 'warning', message, cells: [] }];
}

/** V7: no solid 3×3 (or larger) block areas. Overlapping 3×3 areas merge into one clump. */
export function blockClumps(p: Puzzle): Issue[] {
  const inClump = new Set<number>();
  for (let r = 0; r + 2 < p.rows; r++) {
    for (let c = 0; c + 2 < p.cols; c++) {
      let solid = true;
      for (let i = 0; i < 3 && solid; i++) for (let j = 0; j < 3 && solid; j++) solid = isBlock(p, r + i, c + j);
      if (!solid) continue;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) inClump.add((r + i) * p.cols + c + j);
    }
  }
  return regions(p, (r, c) => inClump.has(r * p.cols + c)).map((cells) => ({
    rule: 'V7',
    tier: 'warning',
    message: `Block clump of ${cells.length} squares`,
    cells,
  }));
}

/**
 * V8: a cheater is a block that could turn white without changing the word count,
 * where the square it leaves would sit in Across and Down entries of 3+ letters.
 */
export function cheaterSquares(p: Puzzle): Coord[] {
  // Change in entry count when the two runs either side of a block join through it.
  const delta = (a: number, b: number) => Number(a + b + 1 >= 2) - Number(a >= 2) - Number(b >= 2);
  const cheaters: Coord[] = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (!isBlock(p, r, c)) continue;
      const [left, right] = [runFrom(p, r, c, 0, -1), runFrom(p, r, c, 0, 1)];
      const [up, down] = [runFrom(p, r, c, -1, 0), runFrom(p, r, c, 1, 0)];
      if (left + right + 1 < 3 || up + down + 1 < 3) continue;
      if (delta(left, right) + delta(up, down) === 0) cheaters.push([r, c]);
    }
  }
  return cheaters;
}

function cheaterIssues(p: Puzzle): Issue[] {
  const cells = cheaterSquares(p);
  if (cells.length === 0) return [];
  const message = `${cells.length} cheater square${cells.length === 1 ? '' : 's'}`;
  return [{ rule: 'V8', tier: 'info', message, cells }];
}

/**
 * V9: warns on a checked white square whose removal would split the white squares,
 * i.e. a region that joins the rest of the grid only through that one square (a diagonal pinch).
 * Only single-square chokes count: a cut square next to another cut square is part of a
 * corridor (e.g. an unchecked bridge, which V2 already flags), and two-square chokes are ignored.
 */
export function chokePoints(p: Puzzle): Issue[] {
  const id = (r: number, c: number) => r * p.cols + c;
  const whiteNeighbors = (u: number): number[] => {
    const [r, c] = [Math.floor(u / p.cols), u % p.cols];
    return NEIGHBORS.filter(([dr, dc]) => isWhite(p, r + dr, c + dc)).map(([dr, dc]) => id(r + dr, c + dc));
  };

  // Articulation points of the white-square graph (Tarjan's low-link DFS).
  const disc = new Array<number>(p.rows * p.cols).fill(-1);
  const low = new Array<number>(p.rows * p.cols).fill(0);
  const cuts = new Set<number>();
  let time = 0;
  const dfs = (u: number, parent: number) => {
    disc[u] = low[u] = time++;
    let children = 0;
    for (const v of whiteNeighbors(u)) {
      if (disc[v] === -1) {
        children++;
        dfs(v, u);
        low[u] = Math.min(low[u]!, low[v]!);
        if (parent !== -1 && low[v]! >= disc[u]!) cuts.add(u);
      } else if (v !== parent) {
        low[u] = Math.min(low[u]!, disc[v]!);
      }
    }
    if (parent === -1 && children > 1) cuts.add(u);
  };
  for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) if (isWhite(p, r, c) && disc[id(r, c)] === -1) dfs(id(r, c), -1);

  const unchecked = new Set(uncheckedSquares(p).flatMap((issue) => issue.cells.map(([r, c]) => id(r, c))));
  return [...cuts]
    .filter((u) => !unchecked.has(u) && !whiteNeighbors(u).some((v) => cuts.has(v)))
    .sort((a, b) => a - b)
    .map((u) => {
      // Sizes of the parts the square holds together; everything but the largest is "cut off".
      const seen = new Set([u]);
      const sizes = whiteNeighbors(u).flatMap((start) => {
        if (seen.has(start)) return [];
        let size = 0;
        const stack = [start];
        seen.add(start);
        while (stack.length) {
          size++;
          for (const v of whiteNeighbors(stack.pop()!)) if (!seen.has(v)) seen.add(v), stack.push(v);
        }
        return [size];
      });
      const cutOff = sizes.reduce((a, b) => a + b, 0) - Math.max(...sizes);
      return {
        rule: 'V9',
        tier: 'warning',
        message: `${cutOff} squares connect to the rest of the grid only through this square`,
        cells: [[Math.floor(u / p.cols), u % p.cols]],
      };
    });
}

/** V10: no complete entry appears more than once. */
export function duplicateEntries(slots: Slot[], p: Puzzle): Issue[] {
  const byWord = new Map<string, Slot[]>();
  for (const slot of slots) {
    const values = slot.cells.map(([r, c]) => p.cells[r]![c]!.value);
    if (values.some((v) => v === '')) continue;
    const word = values.join('');
    byWord.set(word, [...(byWord.get(word) ?? []), slot]);
  }
  return [...byWord]
    .filter(([, found]) => found.length > 1)
    .map(([word, found]) => ({
      rule: 'V10',
      tier: 'error',
      message: `${word} appears ${found.length} times (${[...found].sort(acrossFirst).map(slotName).join(', ')})`,
      cells: found.flatMap((s) => s.cells),
    }));
}

/** The regular plural spellings of a word. Spelling only, so it can't tell ARES from a plural of ARE. */
function pluralsOf(word: string): string[] {
  if (/[^AEIOU]Y$/.test(word)) return [`${word.slice(0, -1)}IES`];
  if (/O$/.test(word)) return [`${word}S`, `${word}ES`];
  if (/(S|X|Z|CH|SH)$/.test(word)) return [`${word}ES`];
  return [`${word}S`];
}

/** V18: a complete entry and the plural of another complete entry. */
export function pluralEntries(slots: Slot[], p: Puzzle): Issue[] {
  const byWord = new Map<string, Slot[]>();
  for (const slot of slots) {
    const word = slotPattern(p, slot);
    if (!word.includes('?')) byWord.set(word, [...(byWord.get(word) ?? []), slot]);
  }
  return [...byWord].flatMap(([word, found]) =>
    pluralsOf(word).flatMap((plural): Issue[] => {
      const plurals = byWord.get(plural);
      if (!plurals) return [];
      const both = [...found, ...plurals];
      return [
        {
          rule: 'V18',
          tier: 'warning',
          message: `${word} and ${plural} look like the same word (${[...both].sort(acrossFirst).map(slotName).join(', ')})`,
          cells: both.flatMap((s) => s.cells),
        },
      ];
    }),
  );
}

/**
 * V11: an entry no word in the list fits. `counts[i]` is how many words fit `slots[i]`, from the word engine,
 * which runs off the main thread, so this is not part of `validate`. Short entries are left to V1, and complete
 * entries spelling a word the user accepted are skipped.
 */
export function unfillableSlots(
  slots: Slot[],
  counts: number[],
  p: Puzzle,
  accepted: ReadonlySet<string> = new Set(),
): Issue[] {
  return slots
    .filter((s, i) => counts[i] === 0 && s.length >= 3 && !accepted.has(slotPattern(p, s)))
    .sort(acrossFirst)
    .map((s): Issue => {
      const pattern = slotPattern(p, s);
      if (pattern.includes('?')) {
        const message = `No word fits ${slotName(s)} (${pattern.replaceAll('?', '·')})`;
        return { rule: 'V11', tier: 'error', message, cells: s.cells };
      }
      const message = `${pattern} is not in the word list (${slotName(s)})`;
      return { rule: 'V11', tier: 'error', message, cells: s.cells, word: pattern };
    });
}

/** V12 (F8): rebus squares that hold different strings, as an info note. Rebus squares are cells of 2+ letters. */
function rebusIssues(p: Puzzle): Issue[] {
  const cells: Coord[] = [];
  const strings = new Set<string>();
  p.cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell.block || cell.value.length < 2) return;
      cells.push([r, c]);
      strings.add(cell.value);
    }),
  );
  if (strings.size < 2) return [];
  return [{ rule: 'V12', tier: 'info', message: `Rebus squares differ: ${[...strings].join(', ')}`, cells }];
}

export const TIER_ORDER: Record<Tier, number> = { error: 0, warning: 1, info: 2 };

/** Runs every grid rule (V11 needs the word engine). Errors first, then warnings, then info. */
export function validate(p: Puzzle): Issue[] {
  const { slots } = computeNumbering(p);
  return [
    ...shortEntries(slots),
    ...uncheckedSquares(p),
    ...isolatedRegions(p),
    ...symmetryBreaks(p),
    ...duplicateEntries(slots, p),
    ...pluralEntries(slots, p),
    ...blockShare(p),
    ...blockClumps(p),
    ...chokePoints(p),
    ...cheaterIssues(p),
    ...rebusIssues(p),
  ].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}
