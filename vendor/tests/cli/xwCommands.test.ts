import { describe, expect, it } from 'vitest';
import { fromIpuz, toIpuz } from '../../src/io/ipuz';
import { computeNumbering } from '../../src/model/numbering';
import {
  checkPuzzle,
  clearEntry,
  filterWordlist,
  findEntry,
  patternToPuzzle,
  placeEntry,
  renderEntries,
  renderGrid,
  toggleBlocks,
} from '../../scripts/xwCommands';
import { fromRows, LEGAL_15 } from '../fixtures/grids';
import { tinyIndex } from '../fixtures/words';

describe('patternToPuzzle', () => {
  it('reads blocks, empty squares and letters', () => {
    const puzzle = patternToPuzzle('#..\n.A.\n..#\n', 'rotational');
    expect(puzzle.symmetry).toBe('rotational');
    expect(puzzle.cells[0]![0]!.block).toBe(true);
    expect(puzzle.cells[1]![1]!.value).toBe('A');
  });

  it('rejects rows of different widths', () => {
    expect(() => patternToPuzzle('...\n..\n...', 'none')).toThrow(/same width/);
  });

  it('survives the .ipuz round trip the commands save through', () => {
    const puzzle = patternToPuzzle('#..\n.A.\n..#', 'rotational');
    expect(fromIpuz(toIpuz(puzzle, ''), 'x').puzzle).toEqual(puzzle);
  });
});

describe('findEntry', () => {
  const puzzle = fromRows(['...', '...', '...']);

  it('finds an entry by number and direction, in either case', () => {
    expect(findEntry(puzzle, '1A')).toMatchObject({ number: 1, direction: 'across' });
    expect(findEntry(puzzle, '3d')).toMatchObject({ number: 3, direction: 'down' });
  });

  it('names what it could not find', () => {
    expect(() => findEntry(puzzle, '9A')).toThrow(/No entry 9A/);
    expect(() => findEntry(puzzle, 'one')).toThrow(/like 12A or 3D/);
  });
});

describe('placeEntry', () => {
  it('writes a word, uppercased', () => {
    const placed = placeEntry(fromRows(['...', '...', '...']), '1A', 'cat');
    expect(placed.cells[0]!.map((cell) => cell.value).join('')).toBe('CAT');
  });

  it('refuses a word that clashes with letters already there, and says which', () => {
    expect(() => placeEntry(fromRows(['.O.', '...', '...']), '1A', 'CAT')).toThrow(/CAT doesn't fit 1A \(\?O\?\)/);
  });

  it('refuses the wrong length', () => {
    expect(() => placeEntry(fromRows(['...', '...', '...']), '1A', 'CATS')).toThrow(/doesn't fit/);
  });

  it('accepts a word that is already there', () => {
    const puzzle = fromRows(['CAT', '...', '...']);
    expect(placeEntry(puzzle, '1A', 'CAT')).toBe(puzzle);
  });
});

describe('clearEntry', () => {
  it('empties the entry and leaves other squares alone', () => {
    const cleared = clearEntry(fromRows(['CAT', 'O..', 'T..']), '1A');
    expect(cleared.cells[0]!.map((cell) => cell.value).join('')).toBe('');
    expect(cleared.cells[1]![0]!.value).toBe('O');
  });
});

describe('toggleBlocks', () => {
  it('takes 1-based squares and keeps symmetry', () => {
    const toggled = toggleBlocks(patternToPuzzle('...\n...\n...', 'rotational'), [[1, 1]]);
    expect(toggled.cells[0]![0]!.block).toBe(true);
    expect(toggled.cells[2]![2]!.block).toBe(true);
  });

  it('refuses a square off the grid', () => {
    expect(() => toggleBlocks(patternToPuzzle('...\n...\n...', 'rotational'), [[4, 1]])).toThrow(/off the grid/);
  });
});

describe('checkPuzzle', () => {
  it('passes a legal empty grid and counts its open entries', () => {
    const report = checkPuzzle(fromRows(LEGAL_15, 'rotational'), tinyIndex(), { accepted: ['*'] });
    expect(report.issues.filter((issue) => issue.tier === 'error' && issue.rule !== 'V11')).toEqual([]);
    expect(report.empty).toBeGreaterThan(0);
  });

  it('lists complete entries that are not on the word list', () => {
    const report = checkPuzzle(fromRows(['CAT', '###', 'DOG']), tinyIndex());
    expect(report.offList).toEqual(['DOG']);
  });

  it('does not count a word as an error once allowed, but still lists it', () => {
    const report = checkPuzzle(fromRows(['CAT', '###', 'DOG']), tinyIndex(), { accepted: ['DOG'] });
    expect(report.offList).toEqual(['DOG']);
    expect(report.issues.filter((issue) => issue.rule === 'V11')).toEqual([]);
  });

  it('flags a pattern no word fits (V11)', () => {
    const report = checkPuzzle(fromRows(['QQ.', '###', '...']), tinyIndex());
    expect(report.issues.map((issue) => issue.message)).toContain('No word fits 1 Across (QQ·)');
  });

  it('reports required words that are missing, whether across or down', () => {
    const puzzle = fromRows(['CAT', 'O..', 'T..']);
    const report = checkPuzzle(puzzle, tinyIndex(), { required: ['cat', 'cot', 'ace'] });
    expect(report.missing).toEqual(['ACE']);
  });
});

describe('filterWordlist', () => {
  it('keeps lines at or above the score and drops banned words', () => {
    expect(filterWordlist('CAT;55\nCOT;50\nCUT;45\nbad line\nTEA;60', 50, ['tea'])).toBe('CAT;55\nCOT;50');
  });
});

describe('rendering', () => {
  it('draws the grid with row and column numbers', () => {
    const text = renderGrid(fromRows(['C.#', '...', '#..']));
    expect(text).toContain('1 C . #');
    expect(text.split('\n')[0]).toContain('1 2 3');
  });

  it('lists entries with their position and pattern', () => {
    const puzzle = fromRows(['C.#', '...', '#..']);
    const text = renderEntries(puzzle, computeNumbering(puzzle).slots);
    expect(text).toContain('1A');
    expect(text).toContain('r1c1');
    expect(text).toContain('C?');
  });
});
