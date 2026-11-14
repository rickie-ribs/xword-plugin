import { letterOffsets, slotPattern } from '../model/entries';
import { slotAt } from '../model/numbering';
import type { Puzzle, Slot } from '../model/types';
import { bitIndices, countBits, letterBits, matchBits, type WordIndex } from './index';

/** An entry crossing the selected one at one of its empty squares. */
export interface Crossing {
  /** Letter offset of the shared square in the selected entry's pattern. */
  at: number;
  /** The crossing entry's pattern, and the offset of the shared square in it. */
  pattern: string;
  offset: number;
  /** e.g. "3 Down". */
  label: string;
}

/** What the worker needs to rank words for one entry. Built on the main thread from the grid. */
export interface CandidateQuery {
  pattern: string;
  crossings: Crossing[];
}

export interface CandidateFilters {
  /** Letters the word must contain as one run (non-letters are ignored). */
  search: string;
  /** Tested case-insensitively against the A–Z word. */
  regex: string;
}

export const NO_FILTERS: CandidateFilters = { search: '', regex: '' };

export interface Candidate {
  word: string;
  display: string;
  /** Puzzles in the last 3 years that used this answer (F9 word data), or null without word data. */
  uses: number | null;
  /** Matches left in each crossing entry if this word goes in, in `CandidateQuery.crossings` order. */
  crossings: number[];
  /** False when some crossing would be left with no match. */
  viable: boolean;
}

export interface CandidateResult {
  /** Matches after filtering; `candidates` holds at most the requested limit of them. */
  total: number;
  candidates: Candidate[];
  error?: string;
}

const label = (s: Slot) => `${s.number} ${s.direction === 'across' ? 'Across' : 'Down'}`;

export function candidateQuery(puzzle: Puzzle, slots: Slot[], slot: Slot): CandidateQuery {
  const offsets = letterOffsets(puzzle, slot);
  const other = slot.direction === 'across' ? 'down' : 'across';
  const crossings: Crossing[] = [];
  slot.cells.forEach(([r, c], i) => {
    if (puzzle.cells[r]![c]!.value) return;
    const cross = slotAt(slots, r, c, other);
    if (!cross) return;
    const j = cross.cells.findIndex(([cr, cc]) => cr === r && cc === c);
    crossings.push({
      at: offsets[i]!,
      pattern: slotPattern(puzzle, cross),
      offset: letterOffsets(puzzle, cross)[j]!,
      label: label(cross),
    });
  });
  return { pattern: slotPattern(puzzle, slot), crossings };
}

/**
 * F4: every word fitting the pattern, viable ones first, then by the fewest matches left in any crossing (more is
 * better), then by past uses (more first), then A–Z. Crossing viability is exact for every match: each
 * crossing's count depends only on the letter placed in the shared square, so it is computed once per
 * (crossing, letter) and then looked up. `uses` holds each answer's use count; without it, uses are null.
 */
export function findCandidates(
  index: WordIndex,
  query: CandidateQuery,
  filters: CandidateFilters,
  uses?: ReadonlyMap<string, number>,
  limit = 300,
): CandidateResult {
  let regex: RegExp | undefined;
  try {
    regex = filters.regex ? new RegExp(filters.regex, 'i') : undefined;
  } catch {
    return { total: 0, candidates: [], error: 'That regex pattern is not valid.' };
  }
  const bucket = index.buckets.get(query.pattern.length);
  if (!bucket) return { total: 0, candidates: [] };

  const perLetter = query.crossings.map(({ pattern, offset }) => {
    const cross = index.buckets.get(pattern.length);
    const counts = new Array<number>(26).fill(0);
    if (!cross) return counts;
    const base = matchBits(cross, pattern);
    for (let l = 0; l < 26; l++) counts[l] = countBits(base, letterBits(cross, offset, String.fromCharCode(65 + l)));
    return counts;
  });

  const search = filters.search.toUpperCase().replace(/[^A-Z]/g, '');
  const kept: { i: number; crossings: number[]; fewest: number; uses: number | null }[] = [];
  for (const i of bitIndices(matchBits(bucket, query.pattern))) {
    const word = bucket.words[i]!;
    if (search && !word.includes(search)) continue;
    if (regex && !regex.test(word)) continue;
    const crossings = query.crossings.map(({ at }, k) => perLetter[k]![word.charCodeAt(at) - 65]!);
    kept.push({ i, crossings, fewest: Math.min(Infinity, ...crossings), uses: uses ? (uses.get(word) ?? 0) : null });
  }
  kept.sort(
    (a, b) =>
      Number(b.fewest > 0) - Number(a.fewest > 0) ||
      b.fewest - a.fewest ||
      (b.uses ?? 0) - (a.uses ?? 0) ||
      a.i - b.i,
  );
  return {
    total: kept.length,
    candidates: kept.slice(0, limit).map(({ i, crossings, fewest, uses }) => ({
      word: bucket.words[i]!,
      display: bucket.display[i]!,
      uses,
      crossings,
      viable: fewest > 0,
    })),
  };
}
