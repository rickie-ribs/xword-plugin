import type { WordEntry } from './wordlist';

/** All words of one length, in alphabetical order, with one bitset per (position, letter). */
export interface Bucket {
  words: string[];
  display: string[];
  /** 32-bit words per bitset. */
  stride: number;
  /** Every word in the bucket. */
  all: Uint32Array;
  /** The (position, letter) bitsets back to back: position × 26 + letter. */
  letters: Uint32Array;
}

export interface WordIndex {
  size: number;
  buckets: Map<number, Bucket>;
}

const A = 65;

/** Pattern index from the spec: buckets by length, each sorted alphabetically so matches come back A–Z. */
export function buildIndex(entries: WordEntry[]): WordIndex {
  const byLength = new Map<number, WordEntry[]>();
  for (const entry of entries) {
    const list = byLength.get(entry.word.length);
    if (list) list.push(entry);
    else byLength.set(entry.word.length, [entry]);
  }
  const buckets = new Map<number, Bucket>();
  for (const [length, list] of byLength) {
    list.sort((a, b) => (a.word < b.word ? -1 : 1));
    const stride = Math.ceil(list.length / 32);
    const all = new Uint32Array(stride);
    const letters = new Uint32Array(length * 26 * stride);
    list.forEach(({ word }, i) => {
      const bit = 1 << (i & 31);
      const slot = i >>> 5;
      all[slot]! |= bit;
      for (let p = 0; p < length; p++) letters[(p * 26 + word.charCodeAt(p) - A) * stride + slot]! |= bit;
    });
    buckets.set(length, {
      words: list.map((e) => e.word),
      display: list.map((e) => e.display),
      stride,
      all,
      letters,
    });
  }
  return { size: entries.length, buckets };
}

/** The bitset of words with `letter` (A–Z) at `position`. */
export function letterBits(bucket: Bucket, position: number, letter: string): Uint32Array {
  const start = (position * 26 + letter.charCodeAt(0) - A) * bucket.stride;
  return bucket.letters.subarray(start, start + bucket.stride);
}

/** Words in the bucket that fit `pattern` (`?` = any letter), found by AND-ing the bitsets of its fixed letters. */
export function matchBits(bucket: Bucket, pattern: string): Uint32Array {
  const bits = bucket.all.slice();
  for (let p = 0; p < pattern.length; p++) {
    const ch = pattern[p]!;
    if (ch === '?') continue;
    if (ch < 'A' || ch > 'Z') return bits.fill(0);
    const fixed = letterBits(bucket, p, ch);
    for (let w = 0; w < bits.length; w++) bits[w]! &= fixed[w]!;
  }
  return bits;
}

function popcount(x: number): number {
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

export function countBits(bits: Uint32Array, and?: Uint32Array): number {
  let n = 0;
  for (let w = 0; w < bits.length; w++) n += popcount(and ? bits[w]! & and[w]! : bits[w]!);
  return n;
}

/** Positions of the set bits, in ascending order, which is alphabetical. */
export function bitIndices(bits: Uint32Array): number[] {
  const out: number[] = [];
  for (let w = 0; w < bits.length; w++) {
    let x = bits[w]!;
    while (x) {
      const low = x & -x;
      out.push(w * 32 + 31 - Math.clz32(low));
      x ^= low;
    }
  }
  return out;
}

export function countMatches(index: WordIndex, pattern: string): number {
  const bucket = index.buckets.get(pattern.length);
  return bucket ? countBits(matchBits(bucket, pattern)) : 0;
}
