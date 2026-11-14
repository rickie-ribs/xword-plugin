import { slotPattern } from '../model/entries';
import type { Puzzle, Slot } from '../model/types';
import { computeStats } from './stats';

/**
 * F9 difficulty score (docs/design/difficulty-score.md). Pattern metrics D1–D4 need no letters, so they're live on
 * an empty grid. The one fill metric, D6 familiarity, uses only complete entries. D5 (a Scrabble score) and D7 (a
 * wordlist score) were dropped: neither tracked difficulty on NYT puzzles.
 */

/**
 * Bump when a metric's definition changes. tests/history/nytHistory.test.ts then fails until
 * `npm run history:update -- --offline` recomputes src/history/nytHistory.json.
 */
export const METRICS_VERSION = 2;

/** D4 counts entries of this many squares or more as long. */
export const LONG_ENTRY = 8;

export interface PatternMetrics {
  /** D1: entries. Fewer is harder. */
  words: number;
  /** D2: black squares. Fewer is harder. */
  blocks: number;
  /** D3: white squares touching no block, even diagonally (the stats panel's definition). More is harder. */
  openSquares: number;
  /** D4: share of entries with LONG_ENTRY+ squares. Higher is harder. */
  longShare: number;
}

export function patternMetrics(puzzle: Puzzle, slots: Slot[]): PatternMetrics {
  const { words, blocks, openSquares } = computeStats(puzzle, slots);
  const long = slots.filter((s) => s.length >= LONG_ENTRY).length;
  return { words, blocks, openSquares, longShare: words ? long / words : 0 };
}

/**
 * D6, answer familiarity, sorts each entry by how many NYT puzzles in the last 3 years used it as an answer. The
 * cutoffs come from the Nov 2023 – Nov 2026 history: 23% of entries have no other use, so tiers start at 1, and
 * only the crutch answers (ERA, ETA, SPA) reach 40. The four tiers hold about 23%, 47%, 27% and 3% of entries.
 */
export const FAMILIARITY_TIERS = [
  { name: 'fresh', minUses: 0 },
  { name: 'seen', minUses: 1 },
  { name: 'common', minUses: 10 },
  { name: 'very common', minUses: 40 },
] as const;

/** The index into FAMILIARITY_TIERS, which is also the entry's familiarity points (0–3). */
export function familiarityTier(uses: number): number {
  return FAMILIARITY_TIERS.findLastIndex((tier) => uses >= tier.minUses);
}

/** A tier's uses as text: "0", "1–9", "40+". */
export function tierRange(tier: number): string {
  const min = FAMILIARITY_TIERS[tier]!.minUses;
  const next = FAMILIARITY_TIERS[tier + 1]?.minUses;
  if (next === undefined) return `${min}+`;
  return next - 1 === min ? `${min}` : `${min}–${next - 1}`;
}

/**
 * What `npm run history:update` writes to data/nyt/word-data.json (git-ignored; served from Vite's public folder)
 * for the Word data page and, later, D6 in the worker.
 */
export interface WordData {
  from: string;
  to: string;
  puzzles: number;
  /** Share of all NYT entries in each tier, in FAMILIARITY_TIERS order; each puzzle is scored against the others. */
  entryShares: number[];
  /** Monday to Saturday at 15×15, then Sunday at 21×21. */
  byDay: { day: string; size: number; puzzles: number; shares: number[]; medianScore: number }[];
  /** Every answer with the number of puzzles that used it and the last date it ran, most used first. */
  answers: [answer: string, uses: number, lastSeen: string][];
}

/**
 * The letters of every complete entry, in slot order, with rebus squares expanded (the engine counts letters).
 * Entries with a square that isn't letters (a symbol rebus) are skipped: they're not words.
 */
export function completeEntries(puzzle: Puzzle, slots: Slot[]): string[] {
  return slots.map((slot) => slotPattern(puzzle, slot)).filter((letters) => /^[A-Z]+$/.test(letters));
}

/**
 * For an NYT puzzle that is itself in the answer counts: how many *other* puzzles used each answer. A puzzle
 * being built isn't in the history, so it uses the counts as they are.
 */
export function usesInOtherPuzzles(counts: Map<string, number>): (answer: string) => number {
  return (answer) => (counts.get(answer) ?? 1) - 1;
}

export interface Familiarity {
  /** Mean familiarity points (0–3) per complete entry. Lower is harder. */
  score: number;
  /** Share of complete entries in each tier, in FAMILIARITY_TIERS order. */
  tierShares: number[];
}

/**
 * D6 over complete entries, or null with none. `usesOf` gives how many NYT puzzles in the window used an answer:
 * the counts as they are for a puzzle being built, or `usesInOtherPuzzles` for one in the history.
 */
export function familiarity(entries: string[], usesOf: (answer: string) => number): Familiarity | null {
  if (!entries.length) return null;
  const tiers = entries.map((answer) => familiarityTier(usesOf(answer)));
  return {
    score: tiers.reduce((sum, t) => sum + t, 0) / tiers.length,
    tierShares: FAMILIARITY_TIERS.map((_, t) => tiers.filter((x) => x === t).length / tiers.length),
  };
}

/** One NYT puzzle in the history: its size and raw metric values, never percentiles, so any group can be ranked. */
export interface HistoryPuzzle extends PatternMetrics {
  id: number;
  /** Publication date, YYYY-MM-DD. */
  date: string;
  rows: number;
  cols: number;
  /** D6 score, against the other puzzles in the window. */
  familiarity: number | null;
}

/** src/history/nytHistory.json: the most recent 12 months of NYT puzzles, written by `npm run history:update`. */
export interface NytHistory {
  metricsVersion: number;
  from: string;
  to: string;
  puzzles: HistoryPuzzle[];
}

/** The five metrics for a puzzle being built: D6 is null until an entry is complete or without word data. */
export interface PuzzleMetrics extends PatternMetrics {
  familiarity: number | null;
}

export type MetricKey = keyof PuzzleMetrics;

/** Every metric the score uses, with which direction is harder. Labels and help are for the panel. */
export const METRICS: readonly { key: MetricKey; label: string; group: 'pattern' | 'fill'; harder: 'lower' | 'higher'; help: string }[] = [
  { key: 'words', label: 'Words', group: 'pattern', harder: 'lower', help: 'Entries in the grid. Fewer, longer entries make a harder grid.' },
  { key: 'blocks', label: 'Blocks', group: 'pattern', harder: 'lower', help: 'Black squares. Fewer blocks mean bigger open areas, which are harder.' },
  {
    key: 'openSquares',
    label: 'Open squares',
    group: 'pattern',
    harder: 'higher',
    help: 'White squares touching no block, even diagonally. More is harder.',
  },
  { key: 'longShare', label: 'Long entries', group: 'pattern', harder: 'higher', help: 'Share of entries with 8 or more squares. More is harder.' },
  {
    key: 'familiarity',
    label: 'Familiarity',
    group: 'fill',
    harder: 'lower',
    help: 'How often these answers ran in the last 3 years, from 0 (fresh) to 3 (very common), averaged over complete entries. Fresher fill is harder.',
  },
];

/** Below this many NYT puzzles of a size, percentiles mean little, so that size gets none. */
export const MIN_COHORT = 30;

const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** A day's median percentile among the NYT puzzles compared, for the day ticks. */
export interface DayMedian {
  day: string;
  percentile: number;
  /** For a single metric (not a group): the day's median raw value, such as its word count. */
  value?: number;
}

/** A percentile (0–1, the share of NYT puzzles this is harder than) and each day's median. */
export interface Rank {
  percentile: number;
  days: DayMedian[];
}

export interface Ranking {
  /** The NYT puzzles of the same size compared against. */
  cohort: { size: number; from: string; to: string };
  /** One per metric with a value; familiarity is missing until an entry is filled. */
  metrics: Partial<Record<MetricKey, Rank>>;
  pattern: Rank;
  /** Null until familiarity has a value. */
  fill: Rank | null;
  /** Every metric with a value, so the pattern metrics alone until an entry is filled. */
  overall: Rank & { patternOnly: boolean; closestDay: string | null };
}

/** How many of the ascending `sorted` values are below `value` (or at most `value`, with `orEqual`). */
function countBelow(sorted: number[], value: number, orEqual: boolean): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid]! < value || (orEqual && sorted[mid] === value)) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Mid-rank: the share of the ascending `sorted` values easier than `value`, ties counting half. */
function percentileOf(value: number, sorted: number[], harder: 'lower' | 'higher'): number {
  const below = countBelow(sorted, value, false);
  const ties = countBelow(sorted, value, true) - below;
  const easier = harder === 'higher' ? below : sorted.length - below - ties;
  return (easier + ties / 2) / sorted.length;
}

const ascending = (xs: number[]) => [...xs].sort((a, b) => a - b);

const median = (xs: number[]) => ascending(xs)[Math.floor(xs.length / 2)] ?? 0;
const mean = (xs: number[]) => xs.reduce((sum, x) => sum + x, 0) / xs.length;

/**
 * F9: ranks a puzzle's metrics against NYT puzzles of the same size. Each metric gets a mid-rank percentile. A group
 * (Pattern, Fill, Overall) averages its metrics' percentiles, then re-ranks that average against the NYT puzzles'
 * own averages, since an average of percentiles isn't a percentile. Null when fewer than `minCohort` NYT puzzles
 * share the size.
 */
export function rankAgainst(
  history: NytHistory,
  rows: number,
  cols: number,
  metrics: PuzzleMetrics,
  minCohort = MIN_COHORT,
): Ranking | null {
  const used = METRICS.filter((m) => metrics[m.key] !== null);
  const cohort = history.puzzles.filter(
    (p) => p.rows === rows && p.cols === cols && used.every((m) => p[m.key] !== null),
  );
  if (cohort.length === 0 || cohort.length < minCohort) return null;

  const cohortDays = cohort.map((p) => dayOf(p.date));
  const days = (percentiles: number[], values?: number[]): DayMedian[] =>
    WEEK.flatMap((day) => {
      const onDay = (xs: number[]) => xs.filter((_, i) => cohortDays[i] === day);
      const dayPercentiles = onDay(percentiles);
      if (!dayPercentiles.length) return [];
      return [{ day: DAY_NAMES[day]!, percentile: median(dayPercentiles), ...(values && { value: median(onDay(values)) }) }];
    });

  // Each NYT puzzle's own percentile on each metric, against the same cohort.
  const cohortPercentiles = new Map(
    used.map((m) => {
      const values = cohort.map((p) => p[m.key]!);
      const sorted = ascending(values);
      return [m.key, { values, sorted, percentiles: values.map((v) => percentileOf(v, sorted, m.harder)) }];
    }),
  );
  const ranked = Object.fromEntries(
    used.map((m) => {
      const { values, sorted, percentiles } = cohortPercentiles.get(m.key)!;
      return [m.key, { percentile: percentileOf(metrics[m.key]!, sorted, m.harder), days: days(percentiles, values) }];
    }),
  ) as Partial<Record<MetricKey, Rank>>;

  const group = (members: typeof used): Rank => {
    const cohortMeans = cohort.map((_, i) => mean(members.map((m) => cohortPercentiles.get(m.key)!.percentiles[i]!)));
    const sorted = ascending(cohortMeans);
    const current = mean(members.map((m) => ranked[m.key]!.percentile));
    return {
      percentile: percentileOf(current, sorted, 'higher'),
      days: days(cohortMeans.map((c) => percentileOf(c, sorted, 'higher'))),
    };
  };

  const fillMetrics = used.filter((m) => m.group === 'fill');
  const overall = group(used);
  const closest = overall.days.length > 1
    ? overall.days.reduce((best, d) =>
        Math.abs(d.percentile - overall.percentile) < Math.abs(best.percentile - overall.percentile) ? d : best,
      ).day
    : null;
  return {
    cohort: { size: cohort.length, from: cohort[0]!.date, to: cohort.at(-1)!.date },
    metrics: ranked,
    pattern: group(used.filter((m) => m.group === 'pattern')),
    fill: fillMetrics.length ? group(fillMetrics) : null,
    overall: { ...overall, patternOnly: fillMetrics.length === 0, closestDay: closest },
  };
}
