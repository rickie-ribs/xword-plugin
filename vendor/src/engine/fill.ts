import { produce } from 'immer';
import { letterOffsets, slotPattern } from '../model/entries';
import type { Coord, Puzzle, Slot } from '../model/types';
import type { Bucket, WordIndex } from './index';

/** An entry with at least one empty square: a variable for the solver. */
export interface FillEntry {
  /** Index into the puzzle's slots, so the page can name the entry. */
  slot: number;
  /** Letters with `?` for each empty square; rebus squares are expanded. */
  pattern: string;
  /** For each letter of `pattern`, the empty square it fills (an index into `FillRequest.squares`), or null if fixed. */
  squares: (number | null)[];
}

/** What the worker needs to fill a grid. Built on the main thread from the puzzle. */
export interface FillRequest {
  /** The empty squares that belong to an entry. */
  squares: Coord[];
  entries: FillEntry[];
  /** Words of the complete entries, which no other entry may repeat (V10). */
  used: string[];
}

export interface Fill {
  /** One letter per `FillRequest.squares`. */
  letters: string[];
  /** One word per `FillRequest.entries`. */
  words: string[];
}

export interface FillFailure {
  /**
   * `no-word`: before searching, these entries had no word that works with their crossings.
   * `no-fill`: the search proved no fill exists. `timeout`: the budget ran out first.
   * For the last two, `entries` are the ones that caused the most dead ends.
   */
  reason: 'no-word' | 'no-fill' | 'timeout';
  /** Indices into `FillRequest.entries`. */
  entries: number[];
}

export interface FillProgress {
  elapsedMs: number;
  fills: Fill[];
}

export interface FillResult extends FillProgress {
  failure?: FillFailure;
  restarts: number;
  deadEnds: number;
}

export interface FillOptions {
  /** Same seed, same fills. */
  seed?: number;
  /** 0–1: how much randomness goes into the word order. */
  variety?: number;
  budgetMs?: number;
  maxFills?: number;
  /** Called with each fill kept, and about every 100 ms. */
  onProgress?: (progress: FillProgress) => void;
  now?: () => number;
}

/** F5: every empty square that belongs to an entry, and every entry that has one. Letters in the grid stay fixed. */
export function fillRequest(puzzle: Puzzle, slots: Slot[]): FillRequest {
  const ids = new Map<string, number>();
  const squares: Coord[] = [];
  const entries: FillEntry[] = [];
  const used: string[] = [];
  slots.forEach((slot, i) => {
    const pattern = slotPattern(puzzle, slot);
    if (!pattern.includes('?')) return void used.push(pattern);
    const offsets = letterOffsets(puzzle, slot);
    const entrySquares = new Array<number | null>(pattern.length).fill(null);
    slot.cells.forEach(([r, c], k) => {
      if (puzzle.cells[r]![c]!.value) return;
      const key = `${r},${c}`;
      let id = ids.get(key);
      if (id === undefined) {
        id = squares.push([r, c]) - 1;
        ids.set(key, id);
      }
      entrySquares[offsets[k]!] = id;
    });
    entries.push({ slot: i, pattern, squares: entrySquares });
  });
  return { squares, entries, used };
}

/** Writes a fill into the grid. Returns the same puzzle if any of its squares is no longer empty (the grid changed). */
export function applyFill(puzzle: Puzzle, request: FillRequest, fill: Fill): Puzzle {
  if (request.squares.some(([r, c]) => puzzle.cells[r]?.[c]?.block !== false || puzzle.cells[r]![c]!.value)) return puzzle;
  return produce(puzzle, (draft) => {
    request.squares.forEach(([r, c], i) => void (draft.cells[r]![c]!.value = fill.letters[i]!));
  });
}

const ALL_LETTERS = (1 << 26) - 1;
/** Words tried at each step, best first; the rest of the domain still counts for propagation. */
const TRY_LIMIT = 100;
/** Dead ends allowed in the first run; later runs get multiples of it (Luby). */
const RESTART_BASE = 50;
const PROGRESS_MS = 100;

function popcount(x: number): number {
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

function count(bits: Uint32Array): number {
  let n = 0;
  for (let w = 0; w < bits.length; w++) n += popcount(bits[w]!);
  return n;
}

/** The Luby sequence 1, 1, 2, 1, 1, 2, 4, …, for run i ≥ 1. */
function luby(i: number): number {
  for (let k = 1; ; k++) {
    if (i === (1 << k) - 1) return 1 << (k - 1);
    if (i < (1 << k) - 1) return luby(i - (1 << (k - 1)) + 1);
  }
}

/** mulberry32: small, fast and seedable. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Signal = 'continue' | 'restart' | 'stop';

/**
 * F5 autofill as a constraint-satisfaction problem (spec: "Fill-candidate and autofill algorithm"). Each entry's
 * domain is a bitset over its length bucket and each empty square has a 26-bit letter mask; propagation keeps them
 * arc-consistent. Search picks the entry with the fewest words per conflict weight (dom/wdeg) and tries words by
 * the room they leave their crossings, restarting with new randomness after a growing number of dead ends.
 */
class Solver {
  private readonly n: number;
  private readonly buckets: Bucket[];
  private readonly domains: Uint32Array[];
  /** Per entry, its [letter position, square] pairs. */
  private readonly positions: [number, number][][];
  /** Per square, the [entry, letter position] pairs through it (one or two). */
  private readonly links: [number, number][][];
  private readonly masks: Int32Array;
  private readonly weights: Float64Array;
  private readonly assigned: Int32Array;
  /** The frame in which each domain was last saved to the trail. */
  private readonly stamps: Int32Array;
  private trail: { entry?: number; square?: number; bits?: Uint32Array; mask?: number; assigned?: number }[] = [];
  private frame = 0;
  private readonly queue: number[] = [];
  private readonly queued: Uint8Array;

  private readonly rand: () => number;
  private noise: number;
  private readonly start: number;
  private lastProgress: number;
  private timedOut = false;
  /** False once a run skips words (TRY_LIMIT), so finishing it proves nothing. */
  private complete = true;
  private runDeadEnds = 0;
  private runLimit = 0;
  private readonly minDiffer: number;

  readonly fills: Fill[] = [];
  deadEnds = 0;
  restarts = 0;

  constructor(
    index: WordIndex,
    private readonly request: FillRequest,
    private readonly options: Required<Omit<FillOptions, 'onProgress'>> & Pick<FillOptions, 'onProgress'>,
  ) {
    const { entries, squares, used } = request;
    this.n = entries.length;
    this.rand = random(options.seed);
    this.noise = options.variety;
    this.start = this.lastProgress = options.now();
    this.minDiffer = Math.max(1, Math.ceil(this.n / 4));
    this.masks = new Int32Array(squares.length).fill(ALL_LETTERS);
    this.weights = new Float64Array(this.n).fill(1);
    this.assigned = new Int32Array(this.n).fill(-1);
    this.stamps = new Int32Array(this.n).fill(-1);
    this.queued = new Uint8Array(this.n);
    this.links = squares.map(() => []);
    this.positions = entries.map((entry, e) => {
      const pairs: [number, number][] = [];
      entry.squares.forEach((s, p) => {
        if (s === null) return;
        pairs.push([p, s]);
        this.links[s]!.push([e, p]);
      });
      return pairs;
    });
    const empty: Bucket = { words: [], display: [], stride: 0, all: new Uint32Array(0), letters: new Uint32Array(0) };
    this.buckets = entries.map((entry) => index.buckets.get(entry.pattern.length) ?? empty);
    this.domains = entries.map((entry, e) => this.initialDomain(this.buckets[e]!, entry.pattern, used));
  }

  private initialDomain(bucket: Bucket, pattern: string, used: string[]): Uint32Array {
    const bits = bucket.all.slice();
    for (let p = 0; p < pattern.length; p++) {
      const ch = pattern.charCodeAt(p);
      if (ch === 63) continue; // '?'
      if (ch < 65 || ch > 90) return bits.fill(0);
      const base = (p * 26 + ch - 65) * bucket.stride;
      for (let w = 0; w < bits.length; w++) bits[w]! &= bucket.letters[base + w]!;
    }
    for (const word of used) {
      const i = this.find(bucket, word);
      if (i >= 0) bits[i >>> 5]! &= ~(1 << (i & 31));
    }
    return bits;
  }

  /** Position of `word` in the bucket (sorted A–Z), or -1. */
  private find(bucket: Bucket, word: string): number {
    let lo = 0;
    let hi = bucket.words.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const w = bucket.words[mid]!;
      if (w === word) return mid;
      if (w < word) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }

  run(): FillResult {
    const empty = this.domains.flatMap((d, e) => (count(d) === 0 ? [e] : []));
    if (empty.length) return this.result({ reason: 'no-word', entries: empty });
    for (let e = 0; e < this.n; e++) this.enqueue(e);
    const failed = this.propagate();
    if (failed >= 0) return this.result({ reason: 'no-word', entries: [failed] });

    const root = this.mark();
    for (let i = 1; ; i++) {
      this.runDeadEnds = 0;
      this.runLimit = RESTART_BASE * luby(i);
      this.complete = true;
      const signal = this.search();
      this.undo(root);
      if (signal === 'stop' || this.timedOut) break;
      // A run that ended on its own, having tried every word, has seen every fill there is.
      if (signal === 'continue' && this.complete) break;
      this.restarts++;
    }
    if (this.fills.length) return this.result();
    return this.result({ reason: this.timedOut ? 'timeout' : 'no-fill', entries: this.hardest() });
  }

  private result(failure?: FillFailure): FillResult {
    const elapsedMs = this.options.now() - this.start;
    return { elapsedMs, fills: this.fills, restarts: this.restarts, deadEnds: this.deadEnds, ...(failure && { failure }) };
  }

  private hardest(): number[] {
    return [...this.weights.keys()].sort((a, b) => this.weights[b]! - this.weights[a]! || a - b).slice(0, 3);
  }

  private search(): Signal {
    const now = this.options.now();
    if (now - this.start > this.options.budgetMs) {
      this.timedOut = true;
      return 'stop';
    }
    if (now - this.lastProgress > PROGRESS_MS) this.progress(now);

    const e = this.choose();
    if (e < 0) return this.solution();
    for (const word of this.order(e)) {
      const m = this.mark();
      const failed = this.assign(e, word);
      if (failed < 0) {
        const signal = this.search();
        if (signal !== 'continue') {
          this.undo(m);
          return signal;
        }
      } else {
        this.weights[failed]!++;
        if (this.deadEnd()) {
          this.undo(m);
          return 'restart';
        }
      }
      this.undo(m);
    }
    return 'continue';
  }

  /** Counts a dead end; true when this run has used up its allowance. */
  private deadEnd(): boolean {
    this.deadEnds++;
    return ++this.runDeadEnds > this.runLimit;
  }

  private solution(): Signal {
    const words = [...this.assigned].map((w, e) => this.buckets[e]!.words[w]!);
    const distinct = this.fills.every((f) => f.words.filter((w, e) => w !== words[e]).length >= this.minDiffer);
    if (!distinct) return this.deadEnd() ? 'restart' : 'continue';
    const letters = new Array<string>(this.request.squares.length);
    this.positions.forEach((pairs, e) => pairs.forEach(([p, s]) => (letters[s] = words[e]![p]!)));
    this.fills.push({ letters, words });
    this.progress(this.options.now());
    if (this.fills.length >= this.options.maxFills) return 'stop';
    // Look elsewhere for the next fill, with at least some randomness so the restart can go somewhere new.
    this.noise = Math.max(this.noise, 0.3);
    return 'restart';
  }

  private progress(now: number) {
    this.lastProgress = now;
    this.options.onProgress?.({ elapsedMs: now - this.start, fills: [...this.fills] });
  }

  /** The unassigned entry with the fewest words per unit of conflict weight; -1 when every entry has a word. */
  private choose(): number {
    let best = -1;
    let bestScore = Infinity;
    for (let e = 0; e < this.n; e++) {
      if (this.assigned[e]! >= 0) continue;
      const score = count(this.domains[e]!) / this.weights[e]!;
      if (score < bestScore || (score === bestScore && this.positions[e]!.length > this.positions[best]!.length)) {
        best = e;
        bestScore = score;
      }
    }
    return best;
  }

  /**
   * Words for entry `e`, most room first: the sum over its crossings of log(1 + matches left in the crossing),
   * with jitter. Each crossing's matches depend only on the letter in the shared square, so they're counted once
   * per letter.
   */
  private order(e: number): number[] {
    const bucket = this.buckets[e]!;
    const crossings = this.positions[e]!.flatMap(([p, s]) => {
      const other = this.links[s]!.find(([e2]) => e2 !== e);
      if (!other || this.assigned[other[0]]! >= 0) return [];
      const [e2, p2] = other;
      const d = this.domains[e2]!;
      const b = this.buckets[e2]!;
      const room = new Float64Array(26);
      for (let l = 0; l < 26; l++) {
        if (!(this.masks[s]! & (1 << l))) continue;
        const base = (p2 * 26 + l) * b.stride;
        let k = 0;
        for (let w = 0; w < d.length; w++) k += popcount(d[w]! & b.letters[base + w]!);
        room[l] = Math.log1p(k);
      }
      return [{ p, room }];
    });
    const scored: { word: number; key: number }[] = [];
    this.eachWord(this.domains[e]!, (word) => {
      const text = bucket.words[word]!;
      let key = 0;
      for (const { p, room } of crossings) key += room[text.charCodeAt(p) - 65]!;
      scored.push({ word, key: key * (1 + this.noise * (this.rand() - 0.5)) });
    });
    scored.sort((a, b) => b.key - a.key || a.word - b.word);
    if (scored.length > TRY_LIMIT) {
      this.complete = false;
      scored.length = TRY_LIMIT;
    }
    return scored.map((s) => s.word);
  }

  private eachWord(bits: Uint32Array, fn: (word: number) => void) {
    for (let w = 0; w < bits.length; w++) {
      let x = bits[w]!;
      while (x) {
        const low = x & -x;
        fn(w * 32 + 31 - Math.clz32(low));
        x ^= low;
      }
    }
  }

  /** Gives entry `e` one word, removes that word from every other entry (V10) and propagates. Returns the entry that ran out of words, or -1. */
  private assign(e: number, word: number): number {
    this.save(e);
    const d = this.domains[e]!;
    d.fill(0);
    d[word >>> 5] = 1 << (word & 31);
    this.trail.push({ assigned: e });
    this.assigned[e] = word;
    this.enqueue(e);
    const length = this.request.entries[e]!.pattern.length;
    for (let e2 = 0; e2 < this.n; e2++) {
      if (e2 === e || this.request.entries[e2]!.pattern.length !== length) continue;
      const d2 = this.domains[e2]!;
      if (!(d2[word >>> 5]! & (1 << (word & 31)))) continue;
      this.save(e2);
      d2[word >>> 5]! &= ~(1 << (word & 31));
      if (count(d2) === 0) return e2;
      this.enqueue(e2);
    }
    return this.propagate();
  }

  /** AC-3 by letters: narrows square masks to the letters an entry's words support, and entries to their masks. */
  private propagate(): number {
    while (this.queue.length) {
      const e = this.queue.pop()!;
      this.queued[e] = 0;
      const supported = this.supported(e);
      const pairs = this.positions[e]!;
      for (let k = 0; k < pairs.length; k++) {
        const [, s] = pairs[k]!;
        const mask = this.masks[s]!;
        const kept = mask & supported[k]!;
        if (kept === mask) continue;
        if (kept === 0) {
          this.queue.length = 0;
          this.queued.fill(0);
          return e;
        }
        this.trail.push({ square: s, mask });
        this.masks[s] = kept;
        const removed = mask & ~kept;
        for (const [e2, p2] of this.links[s]!) {
          if (e2 === e) continue;
          this.save(e2);
          const d = this.domains[e2]!;
          const b = this.buckets[e2]!;
          for (let l = 0; l < 26; l++) {
            if (!(removed & (1 << l))) continue;
            const base = (p2 * 26 + l) * b.stride;
            for (let w = 0; w < d.length; w++) d[w]! &= ~b.letters[base + w]!;
          }
          if (count(d) === 0) {
            this.queue.length = 0;
            this.queued.fill(0);
            return e2;
          }
          this.enqueue(e2);
        }
      }
    }
    return -1;
  }

  /** For each of entry `e`'s [position, square] pairs, the letters its words have there, as a 26-bit mask. */
  private supported(e: number): number[] {
    const d = this.domains[e]!;
    const b = this.buckets[e]!;
    const pairs = this.positions[e]!;
    const out = new Array<number>(pairs.length).fill(0);
    // Few words: read their letters. Many: test each letter's bitset against the domain.
    if (count(d) * pairs.length < 26 * d.length) {
      this.eachWord(d, (word) => {
        const text = b.words[word]!;
        for (let k = 0; k < pairs.length; k++) out[k]! |= 1 << (text.charCodeAt(pairs[k]![0]) - 65);
      });
      return out;
    }
    pairs.forEach(([p, s], k) => {
      const mask = this.masks[s]!;
      for (let l = 0; l < 26; l++) {
        if (!(mask & (1 << l))) continue;
        const base = (p * 26 + l) * b.stride;
        for (let w = 0; w < d.length; w++) {
          if (d[w]! & b.letters[base + w]!) {
            out[k]! |= 1 << l;
            break;
          }
        }
      }
    });
    return out;
  }

  private enqueue(e: number) {
    if (this.queued[e]) return;
    this.queued[e] = 1;
    this.queue.push(e);
  }

  /** Saves entry `e`'s domain the first time it changes in this frame. */
  private save(e: number) {
    if (this.stamps[e] === this.frame) return;
    this.stamps[e] = this.frame;
    this.trail.push({ entry: e, bits: this.domains[e]!.slice() });
  }

  private mark(): number {
    this.frame++;
    return this.trail.length;
  }

  private undo(mark: number) {
    while (this.trail.length > mark) {
      const t = this.trail.pop()!;
      if (t.bits) this.domains[t.entry!]!.set(t.bits);
      else if (t.square !== undefined) this.masks[t.square] = t.mask!;
      else this.assigned[t.assigned!] = -1;
    }
    // Saved copies after this point are gone, so the next change must save again.
    this.frame++;
  }
}

/** F5: fills the request's empty squares with list words. Runs synchronously; the worker calls it, and Stop terminates the worker. */
export function solveFill(index: WordIndex, request: FillRequest, options: FillOptions = {}): FillResult {
  return new Solver(index, request, {
    seed: options.seed ?? 1,
    variety: options.variety ?? 0.5,
    budgetMs: options.budgetMs ?? 30_000,
    maxFills: options.maxFills ?? 10,
    onProgress: options.onProgress,
    now: options.now ?? (() => performance.now()),
  }).run();
}
