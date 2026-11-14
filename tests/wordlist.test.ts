import { describe, expect, it } from 'vitest';
import { checkList, removeWords } from '../src/wordlist';

const list = (n: number, line = (i: number) => `WORD${'A'.repeat(i % 5)};50`) => Array.from({ length: n }, (_, i) => line(i)).join('\n');

describe('checkList', () => {
  it('counts a WORD;SCORE list', () => expect(checkList(list(2000))).toBe(2000));
  it('rejects a short file', () => expect(() => checkList(list(10))).toThrow(/doesn't look like a wordlist/));
  it('rejects a file that is not WORD;SCORE', () => expect(() => checkList(list(2000, () => '<html>'))).toThrow(/WORD;SCORE/));
});

describe('removeWords', () => {
  it('drops listed words by their word, not their score', () =>
    expect(removeWords('AAA;10\nOPUS;50\nEEE;40\n', '# comment\nAAA\nEEE\n')).toEqual({ text: 'OPUS;50\n', dropped: 2 }));
});
