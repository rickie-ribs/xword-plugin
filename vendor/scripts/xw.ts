/**
 * Builds a puzzle from the command line, through the same model, rules and engine the app uses. Each command reads
 * and writes an .ipuz file, which the app can import.
 *
 *   npm run xw -- new a.ipuz --size 15              # or --pattern rows.txt (# block, . empty, letters)
 *   npm run xw -- show a.ipuz                       # the grid and every entry
 *   npm run xw -- blocks a.ipuz 4,5 8,8             # toggles squares (row,col from 1) with their partners
 *   npm run xw -- place a.ipuz 1A OPUS 20D FABLE    # refuses a word that clashes with letters already there
 *   npm run xw -- clear a.ipuz 1A                   # empties the entry, crossing letters included
 *   npm run xw -- find a.ipuz 1A --limit 30         # candidates with past uses and crossing room; --regex, --contains
 *   npm run xw -- check a.ipuz --require OPUS,FABLE --accept ANTHROPIC
 *   npm run xw -- fill a.ipuz --fills 5 --budget 30000 --seed 1 --variety 0.3 --min-score 50 --ban AAA,BBB
 *                                                   # writes a-fill1.ipuz, ...; a.ipuz stays as it is
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { WORD_DATA as HOME_WORD_DATA, WORDLIST } from '../../src/home';
import { candidateQuery, findCandidates } from '../src/engine/candidates';
import { applyFill, fillRequest, solveFill } from '../src/engine/fill';
import { buildIndex } from '../src/engine/index';
import { parseWordlist } from '../src/engine/wordlist';
import nytHistory from '../src/history/nytHistory.json';
import { fromIpuz, toIpuz } from '../src/io/ipuz';
import { createPuzzle } from '../src/model/grid';
import { computeNumbering } from '../src/model/numbering';
import type { Coord, Puzzle, Symmetry } from '../src/model/types';
import {
  completeEntries,
  familiarity,
  patternMetrics,
  rankAgainst,
  type NytHistory,
  type WordData,
} from '../src/rules/difficulty';
import { computeStats } from '../src/rules/stats';
import { checkPuzzle, clearEntry, filterWordlist, findEntry, patternToPuzzle, placeEntry, renderEntries, renderGrid, toggleBlocks } from './xwCommands';

const LIST = WORDLIST;
const WORD_DATA = HOME_WORD_DATA;

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    size: { type: 'string', default: '15' },
    pattern: { type: 'string' },
    symmetry: { type: 'string', default: 'rotational' },
    limit: { type: 'string', default: '30' },
    regex: { type: 'string', default: '' },
    contains: { type: 'string', default: '' },
    require: { type: 'string', default: '' },
    accept: { type: 'string', default: '' },
    fills: { type: 'string', default: '5' },
    budget: { type: 'string', default: '30000' },
    seed: { type: 'string', default: '1' },
    variety: { type: 'string', default: '0.3' },
    'min-score': { type: 'string', default: '0' },
    ban: { type: 'string', default: '' },
  },
});

const [command, file, ...rest] = positionals;
const words = (list: string) => list.split(',').map((w) => w.trim()).filter(Boolean);

const load = (path: string): Puzzle => fromIpuz(readFileSync(path, 'utf8'), path).puzzle;
const save = (path: string, puzzle: Puzzle) => writeFileSync(path, toIpuz(puzzle, ''));
const index = () => buildIndex(parseWordlist(readFileSync(LIST, 'utf8')));
const steeredIndex = () =>
  buildIndex(parseWordlist(filterWordlist(readFileSync(LIST, 'utf8'), Number(args['min-score']), words(args.ban))));
/** How many puzzles used each answer in the last 3 years (F9), when the word data has been built. */
const uses = () =>
  new Map<string, number>(
    existsSync(WORD_DATA) ? (JSON.parse(readFileSync(WORD_DATA, 'utf8')) as WordData).answers.map(([a, n]) => [a, n]) : [],
  );

function show(puzzle: Puzzle) {
  const { slots } = computeNumbering(puzzle);
  console.log(renderGrid(puzzle));
  console.log(`\nAcross\n${renderEntries(puzzle, slots.filter((s) => s.direction === 'across'))}`);
  console.log(`\nDown\n${renderEntries(puzzle, slots.filter((s) => s.direction === 'down'))}`);
}

function check(puzzle: Puzzle) {
  const { slots } = computeNumbering(puzzle);
  const report = checkPuzzle(puzzle, index(), { required: words(args.require), accepted: words(args.accept) });
  const stats = computeStats(puzzle, slots);
  const counts = uses();
  const metrics = {
    ...patternMetrics(puzzle, slots),
    familiarity: familiarity(completeEntries(puzzle, slots), (answer) => counts.get(answer) ?? 0)?.score ?? null,
  };
  const rank = counts.size ? rankAgainst(nytHistory as NytHistory, puzzle.rows, puzzle.cols, metrics) : null;

  console.log(renderGrid(puzzle));
  console.log(`\n${stats.words} words (max ${stats.guideline?.max ?? '-'}), ${stats.blocks} blocks, ${report.empty} empty squares`);
  console.log(`Lengths: ${stats.lengths.filter((l) => l.count).map((l) => `${l.length}×${l.count}`).join(' ')}`);
  for (const issue of report.issues) console.log(`${issue.tier.toUpperCase().padEnd(7)} ${issue.rule} ${issue.message}`);
  if (!report.issues.some((issue) => issue.tier === 'error')) console.log('No errors.');
  if (report.offList.length) console.log(`Not on the list: ${report.offList.join(', ')}`);
  if (words(args.require).length) console.log(report.missing.length ? `MISSING: ${report.missing.join(', ')}` : 'All required words are in.');
  if (rank) {
    const percent = (p: number) => `${Math.round(p * 100)}%`;
    console.log(
      `Difficulty: overall ${percent(rank.overall.percentile)}, pattern ${percent(rank.pattern.percentile)}` +
        `${rank.fill ? `, freshness ${percent(rank.fill.percentile)}` : ''}, closest day ${rank.overall.closestDay ?? '-'}`,
    );
  }
}

function find(puzzle: Puzzle, ref: string) {
  const { slots } = computeNumbering(puzzle);
  const slot = findEntry(puzzle, ref);
  const query = candidateQuery(puzzle, slots, slot);
  const result = findCandidates(index(), query, { search: args.contains, regex: args.regex }, uses(), Number(args.limit));
  console.log(`${ref} ${query.pattern}: ${result.total} matches${result.error ? ` (${result.error})` : ''}`);
  for (const c of result.candidates) {
    const room = c.crossings.length ? Math.min(...c.crossings) : '-';
    console.log(`${c.word.padEnd(slot.length + 1)} uses ${String(c.uses ?? 0).padStart(3)}  tightest crossing ${room}${c.viable ? '' : '  DEAD'}`);
  }
}

function fill(puzzle: Puzzle, path: string) {
  const { slots } = computeNumbering(puzzle);
  const request = fillRequest(puzzle, slots);
  const counts = uses();
  const result = solveFill(steeredIndex(), request, {
    budgetMs: Number(args.budget),
    maxFills: Number(args.fills),
    seed: Number(args.seed),
    variety: Number(args.variety),
  });
  console.log(`${result.fills.length} fill(s) in ${Math.round(result.elapsedMs)} ms, ${result.restarts} restarts, ${result.deadEnds} dead ends`);
  if (result.failure) {
    const named = result.failure.entries.map((e) => {
      const slot = slots[request.entries[e]!.slot]!;
      return `${slot.number}${slot.direction === 'across' ? 'A' : 'D'}`;
    });
    console.log(`${result.failure.reason}: ${named.join(', ')}`);
  }
  result.fills.forEach((f, i) => {
    const out = path.replace(/\.ipuz$/, '') + `-fill${i + 1}.ipuz`;
    save(out, applyFill(puzzle, request, f));
    const byUses = [...f.words].sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0) || a.localeCompare(b));
    console.log(`\n${out}\n${byUses.map((w) => `${w}:${counts.get(w) ?? 0}`).join(' ')}`);
  });
}

function pairs<T>(list: string[], make: (a: string, b: string) => T): T[] {
  if (list.length % 2) throw new Error('Expected pairs of arguments.');
  return Array.from({ length: list.length / 2 }, (_, i) => make(list[2 * i]!, list[2 * i + 1]!));
}

function main() {
  if (!command || !file) throw new Error('Usage: npm run xw -- <new|show|blocks|place|clear|find|check|fill> FILE ... (see scripts/xw.ts)');
  if (command === 'new') {
    const symmetry = args.symmetry as Symmetry;
    const size = Number(args.size);
    save(file, args.pattern ? patternToPuzzle(readFileSync(args.pattern, 'utf8'), symmetry) : createPuzzle(size, size, symmetry));
    return show(load(file));
  }
  const puzzle = load(file);
  switch (command) {
    case 'show':
      return show(puzzle);
    case 'blocks': {
      const squares = rest.map((s): Coord => {
        const [r, c] = s.split(',').map(Number);
        return [r!, c!];
      });
      const next = toggleBlocks(puzzle, squares);
      save(file, next);
      return show(next);
    }
    case 'place': {
      const next = pairs(rest, (ref, word) => [ref, word] as const).reduce((p, [ref, word]) => placeEntry(p, ref, word), puzzle);
      save(file, next);
      return console.log(renderGrid(next));
    }
    case 'clear': {
      const next = rest.reduce(clearEntry, puzzle);
      save(file, next);
      return console.log(renderGrid(next));
    }
    case 'find':
      return find(puzzle, rest[0]!);
    case 'check':
      return check(puzzle);
    case 'fill':
      return fill(puzzle, file);
    default:
      throw new Error(`Unknown command "${command}".`);
  }
}

try {
  main();
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
