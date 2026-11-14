import { describe, expect, it } from 'vitest';
import { checkList } from '../src/wordlist';

const list = (n: number, line = (i: number) => `WORD${'A'.repeat(i % 5)};50`) => Array.from({ length: n }, (_, i) => line(i)).join('\n');

describe('checkList', () => {
  it('counts a WORD;SCORE list', () => expect(checkList(list(2000))).toBe(2000));
  it('rejects a short file', () => expect(() => checkList(list(10))).toThrow(/doesn't look like a wordlist/));
  it('rejects a file that is not WORD;SCORE', () => expect(() => checkList(list(2000, () => '<html>'))).toThrow(/WORD;SCORE/));
});
