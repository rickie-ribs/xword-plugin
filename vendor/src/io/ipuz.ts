import { clueFor, isClued, sameEntry, setClue, slotFor } from '../model/clues';
import { createPuzzle, MAX_SIZE, MIN_SIZE } from '../model/grid';
import { computeNumbering } from '../model/numbering';
import { findAsymmetric, isSymmetryAvailable, SYMMETRY_MODES } from '../model/symmetry';
import type { Clue, Direction, EntryRef, Puzzle, PuzzleType, Symmetry } from '../model/types';

/**
 * .ipuz (http://ipuz.org/v2) crossword import and export. Clue numbers are written for other
 * apps but recomputed on import. Symmetry and puzzle type have no ipuz field, so they travel in
 * an extension key that other apps ignore; files without it get their symmetry detected.
 * Clues (F6) are written as standard Across / Down lists; their theme marks, recorded answers and
 * cross-reference targets travel in the extension key too.
 */
const EXTENSION = 'x-xword-builder';
const CIRCLE = { shapebg: 'circle' };
const SHADE = { color: 'C0C0C0' };

export class ImportError extends Error {}

export function toIpuz(puzzle: Puzzle, title: string): string {
  const { numbers, slots } = computeNumbering(puzzle);
  const clueList = (direction: Direction) =>
    slots.flatMap((slot) => {
      const clue = clueFor(puzzle, slot);
      return slot.direction === direction && isClued(clue) ? [[slot.number, clue!.text]] : [];
    });
  return JSON.stringify({
    version: 'http://ipuz.org/v2',
    kind: ['http://ipuz.org/crossword#1'],
    ...(title && { title }),
    dimensions: { width: puzzle.cols, height: puzzle.rows },
    block: '#',
    empty: 0,
    puzzle: puzzle.cells.map((row, r) =>
      row.map((cell, c) => {
        if (cell.block) return '#';
        const number = numbers[r]![c] ?? 0;
        if (!cell.circled && !cell.shaded) return number;
        return { cell: number, style: { ...(cell.circled && CIRCLE), ...(cell.shaded && SHADE) } };
      }),
    ),
    solution: puzzle.cells.map((row) => row.map((cell) => (cell.block ? '#' : cell.value || null))),
    clues: { Across: clueList('across'), Down: clueList('down') },
    [EXTENSION]: {
      symmetry: puzzle.symmetry,
      type: puzzle.type,
      ...(puzzle.clues.length > 0 && { clues: puzzle.clues }),
    },
  });
}

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function plainText(html: string): string {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e: string) => entities[e]!)
    .trim();
}

export function detectSymmetry(puzzle: Puzzle): Symmetry {
  return (
    SYMMETRY_MODES.find(
      (mode) =>
        mode !== 'none' &&
        isSymmetryAvailable(mode, puzzle.rows, puzzle.cols) &&
        findAsymmetric(puzzle, mode).length === 0,
    ) ?? 'none'
  );
}

/** Parses an .ipuz crossword. Throws ImportError with a reason a person can act on. */
export function fromIpuz(text: string, fallbackName: string): { name: string; puzzle: Puzzle } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError('Not a valid .ipuz file (it isn’t JSON).');
  }
  if (!isObject(data) || !Array.isArray(data.kind) || !data.kind.some((k) => String(k).includes('ipuz.org/crossword'))) {
    throw new ImportError('This .ipuz file isn’t a crossword.');
  }
  const dims = isObject(data.dimensions) ? data.dimensions : {};
  const [width, height] = [Number(dims.width), Number(dims.height)];
  const ok = (n: number) => Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
  if (!ok(width) || !ok(height)) {
    throw new ImportError(`Grids must be ${MIN_SIZE}–${MAX_SIZE} squares on each side; this one is ${width}×${height}.`);
  }
  const fits = (grid: unknown) =>
    Array.isArray(grid) && grid.length === height && grid.every((row) => Array.isArray(row) && row.length === width);
  const solution = data.solution ?? null;
  if (!fits(data.puzzle) || (solution !== null && !fits(solution))) {
    throw new ImportError(`The grid data doesn’t match the stated ${width}×${height} size.`);
  }

  const blockChar = data.block ?? '#';
  const styles = isObject(data.styles) ? data.styles : {};
  const isCircle = (style: unknown): boolean => {
    const resolved = typeof style === 'string' ? styles[style] : style;
    return isObject(resolved) && resolved.shapebg === 'circle';
  };

  // A background colour (other than white) or `highlight` marks a shaded square.
  const isShaded = (style: unknown): boolean => {
    const resolved = typeof style === 'string' ? styles[style] : style;
    if (!isObject(resolved)) return false;
    const color = typeof resolved.color === 'string' ? resolved.color.replace('#', '').toLowerCase() : '';
    return resolved.highlight === true || (color !== '' && color !== 'fff' && color !== 'ffffff' && color !== 'white');
  };

  const ext = isObject(data[EXTENSION]) ? data[EXTENSION] : {};
  const type: PuzzleType = ext.type === 'themeless' ? 'themeless' : 'themed';
  const puzzle = createPuzzle(height, width, 'none', type);
  (data.puzzle as unknown[][]).forEach((row, r) =>
    row.forEach((raw, c) => {
      const cell = puzzle.cells[r]![c]!;
      const value = isObject(raw) ? raw.cell : raw;
      if (value === null || value === blockChar) {
        cell.block = true;
        return;
      }
      cell.circled = isObject(raw) && isCircle(raw.style);
      cell.shaded = isObject(raw) && isShaded(raw.style);
      const answer = solution ? (solution as unknown[][])[r]![c] : null;
      const letters = isObject(answer) ? answer.value : answer;
      if (typeof letters === 'string' && letters !== blockChar) cell.value = letters.toUpperCase();
    }),
  );

  const stated = SYMMETRY_MODES.find((m) => m === ext.symmetry);
  puzzle.symmetry = stated && isSymmetryAvailable(stated, height, width) ? stated : detectSymmetry(puzzle);
  const title = typeof data.title === 'string' ? plainText(data.title) : '';
  return { name: title || fallbackName, puzzle: readClues(puzzle, data.clues, ext.clues) };
}

/** A clue in an ipuz list: `[number, text]`, `{ number, clue }`, or a string starting with its number. */
function listedClue(raw: unknown): { number: number; text: string } | null {
  if (Array.isArray(raw)) return { number: Number(raw[0]), text: String(raw[1] ?? '') };
  if (isObject(raw)) return { number: Number(raw.number), text: String(raw.clue ?? '') };
  const match = typeof raw === 'string' ? /^(\d+)\s*(.*)$/.exec(raw) : null;
  return match ? { number: Number(match[1]), text: match[2]! } : null;
}

const isRef = (v: unknown): v is EntryRef =>
  isObject(v) &&
  Number.isInteger(v.row) &&
  Number.isInteger(v.col) &&
  (v.direction === 'across' || v.direction === 'down');

/**
 * Reads the standard clue lists, then the extension's records for marks, recorded answers and
 * cross-reference targets. Text from the lists wins, since another app may have edited it.
 */
function readClues(puzzle: Puzzle, lists: unknown, saved: unknown): Puzzle {
  const { slots } = computeNumbering(puzzle);
  let result = puzzle;
  if (isObject(lists)) {
    for (const [name, list] of Object.entries(lists)) {
      const direction = /^across/i.test(name) ? 'across' : /^down/i.test(name) ? 'down' : null;
      if (!direction || !Array.isArray(list)) continue;
      for (const raw of list) {
        const listed = listedClue(raw);
        const slot = listed && slots.find((s) => s.number === listed.number && s.direction === direction);
        if (slot) result = setClue(result, slots, slot, plainText(listed.text));
      }
    }
  }
  if (!Array.isArray(saved)) return result;
  const records = saved.filter(isRef).map((raw): Clue => {
    const r = raw as EntryRef & Record<string, unknown>;
    const listed = clueFor(result, r);
    const text = listed?.text ?? (typeof r.text === 'string' ? r.text : '');
    // Saved targets only line up with the saved text; if another app changed the text, use the fresh ones.
    const savedRefs = Array.isArray(r.refs) && (!listed || listed.text === r.text) ? r.refs : null;
    return {
      row: r.row,
      col: r.col,
      direction: r.direction,
      text,
      answer: typeof r.answer === 'string' ? r.answer : (listed?.answer ?? ''),
      role: r.role === 'theme' || r.role === 'revealer' ? r.role : null,
      refs: savedRefs ? savedRefs.map((ref) => (isRef(ref) ? ref : null)) : (listed?.refs ?? []),
    };
  });
  const listedOnly = result.clues.filter((c) => !records.some((r) => sameEntry(r, c)));
  const clues = [...records, ...listedOnly].filter((c) => slotFor(slots, c) && (c.text || c.role));
  return { ...result, clues };
}
