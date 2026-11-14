import { createPuzzle, MAX_SIZE, MIN_SIZE } from '../model/grid';
import { computeNumbering } from '../model/numbering';
import type { Puzzle } from '../model/types';
import { detectSymmetry, ImportError } from './ipuz';

/**
 * NYT puzzle JSON (`svc/crosswords/v6/puzzle/{id}.json`), read for the difficulty history (F9). Squares are listed
 * in reading order: `{}` is a block, type 1 a white square, type 2 a circled one and type 3 a shaded one.
 * `answer` holds the letters, several for a rebus; a white square with no answer stays empty.
 * NYT has no symmetry or theme field, so symmetry is detected and the type defaults to themed.
 */
interface NytCell {
  answer?: unknown;
  label?: unknown;
  type?: unknown;
}

interface NytBody {
  width: number;
  height: number;
  cells: NytCell[];
  clues: { direction?: unknown; cells?: unknown }[];
}

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function readBody(data: unknown): NytBody {
  const body = isObject(data) && Array.isArray(data.body) ? data.body[0] : undefined;
  if (!isObject(body) || !isObject(body.dimensions) || !Array.isArray(body.cells) || !body.cells.every(isObject)) {
    throw new ImportError('Not an NYT puzzle: no grid dimensions or squares.');
  }
  const [width, height] = [Number(body.dimensions.width), Number(body.dimensions.height)];
  const ok = (n: number) => Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
  if (!ok(width) || !ok(height)) {
    throw new ImportError(`Grids must be ${MIN_SIZE}–${MAX_SIZE} squares on each side; this one is ${width}×${height}.`);
  }
  if (body.cells.length !== width * height) {
    throw new ImportError(`${body.cells.length} squares don’t fill the stated ${width}×${height} grid.`);
  }
  const clues = Array.isArray(body.clues) ? body.clues.filter(isObject) : [];
  return { width, height, cells: body.cells, clues };
}

export function fromNytPuzzle(data: unknown): Puzzle {
  const { width, height, cells } = readBody(data);
  const puzzle = createPuzzle(height, width);
  cells.forEach((raw, i) => {
    const cell = puzzle.cells[Math.floor(i / width)]![i % width]!;
    if (raw.type === undefined) {
      cell.block = true;
      return;
    }
    if (raw.type !== 1 && raw.type !== 2 && raw.type !== 3) {
      throw new ImportError(`Square ${i} has unsupported type ${String(raw.type)}.`);
    }
    cell.circled = raw.type === 2;
    cell.shaded = raw.type === 3;
    if (typeof raw.answer === 'string') cell.value = raw.answer.toUpperCase();
  });
  puzzle.symmetry = detectSymmetry(puzzle);
  return puzzle;
}

/** Why our numbering disagrees with NYT's square labels or clue squares, or null when it matches exactly. */
export function numberingMismatch(data: unknown, puzzle: Puzzle): string | null {
  const { width, cells, clues } = readBody(data);
  const { numbers, slots } = computeNumbering(puzzle);
  for (let i = 0; i < cells.length; i++) {
    const theirs = typeof cells[i]!.label === 'string' ? cells[i]!.label : null;
    const ours = numbers[Math.floor(i / width)]![i % width] ?? null;
    if (theirs !== (ours === null ? null : String(ours))) {
      return `Square ${i}: NYT numbers it ${theirs ?? 'none'}, we number it ${ours ?? 'none'}.`;
    }
  }
  const entry = (direction: unknown, squares: unknown) =>
    `${String(direction).toLowerCase()} ${Array.isArray(squares) ? squares.join(',') : '?'}`;
  const theirs = new Set(clues.map((c) => entry(c.direction, c.cells)));
  const ours = new Set(slots.map((s) => entry(s.direction, s.cells.map(([r, c]) => r * width + c))));
  const onlyTheirs = [...theirs].find((e) => !ours.has(e));
  if (onlyTheirs) return `NYT has the entry ${onlyTheirs}, which we don’t.`;
  const onlyOurs = [...ours].find((e) => !theirs.has(e));
  if (onlyOurs) return `We have the entry ${onlyOurs}, which NYT doesn’t.`;
  return null;
}
