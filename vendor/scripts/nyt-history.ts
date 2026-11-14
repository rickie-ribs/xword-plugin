/**
 * F9: builds the NYT history the difficulty score compares against (docs/design/difficulty-score.md).
 *
 * 1. Lists NYT dailies (Sundays included) by month and fetches each puzzle not yet cached in private/nyt/raw/.
 *    Cached puzzles are never fetched again or deleted, so the history only grows.
 * 2. Converts every cached puzzle and keeps those that number exactly as NYT does and raise no error-tier issue.
 * 3. Counts answers over the most recent 3 years into data/nyt/word-data.json (D6's table, also shown on the
 *    Word data page), plus answers.csv and familiarity.md for reading.
 * 4. Writes each of those puzzles' metrics to src/history/nytHistory.json, which is committed, and prints how
 *    the metrics track the day of the week.
 *
 *   npm run history:update [-- --from 2023-11-02 --to 2026-11-01 --cookie path --offline]
 *
 * The cookie comes from $NYT_S, else private/nyt/cookie.txt (the raw value or `NYT-S=…`). data/nyt/ and private/
 * are git-ignored: the puzzles are copyrighted, and the cookie is a credential. Only data/nyt/ is served;
 * vite.config.ts denies private/ to the dev server.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { COOKIE, NYT_DIR } from '../../src/home';
import { ImportError } from '../src/io/ipuz';
import { fromNytPuzzle, numberingMismatch } from '../src/io/nytJson';
import { computeNumbering } from '../src/model/numbering';
import type { Puzzle, Slot } from '../src/model/types';
import {
  completeEntries,
  FAMILIARITY_TIERS,
  familiarity,
  familiarityTier,
  METRICS_VERSION,
  patternMetrics,
  tierRange,
  usesInOtherPuzzles,
  type HistoryPuzzle,
  type NytHistory,
  type WordData,
} from '../src/rules/difficulty';
import { validate } from '../src/rules/validate';

/** Served to the app (Vite's public folder is data/). */
const DIR = NYT_DIR;
/** Never served or built: the cookie and the raw puzzles. */
const PRIVATE = NYT_DIR;
const RAW = `${PRIVATE}/raw`;
/** Derived numbers only (no answers or clues), so it's committed and bundled with the app. */
const HISTORY_FILE = `${NYT_DIR}/nytHistory.json`;
const API = 'https://www.nytimes.com/svc/crosswords';
const DELAY_MS = 500;
const WINDOW_DAYS = 1096; // three years, counting a leap day

const { values: args } = parseArgs({
  options: { from: { type: 'string' }, to: { type: 'string' }, cookie: { type: 'string' }, offline: { type: 'boolean' } },
  // Imported by another script (fill-bench), whose flags aren't these.
  args: import.meta.url === `file://${process.argv[1]}` ? undefined : [],
});

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (date: string, days: number) => isoDate(new Date(Date.parse(date) + days * 86_400_000));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readCookie(): string {
  const raw = (process.env.NYT_S ?? readFileSync(args.cookie ?? COOKIE, 'utf8')).trim();
  return raw.startsWith('NYT-S=') ? raw : `NYT-S=${raw}`;
}

/** GET with backoff on 429 and 5xx. Stops the run on 401/403, which means the cookie has expired. */
async function getJson(url: string, cookie: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { accept: 'application/json', cookie } });
    if (response.ok) return response.json();
    if (response.status === 401 || response.status === 403) {
      throw new Error(`NYT refused the cookie (${response.status}): refresh ${PRIVATE}/cookie.txt`);
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await sleep(2000 * 2 ** attempt);
      continue;
    }
    throw new Error(`${response.status} from ${url}`);
  }
}

interface Listed {
  puzzle_id: number;
  print_date: string;
  format_type: string;
}

/** The list endpoint returns at most 100 rows, so it's queried one month at a time. */
async function listPuzzles(from: string, to: string, cookie: string): Promise<Listed[]> {
  const listed: Listed[] = [];
  for (let start = from; start <= to; ) {
    const next = isoDate(new Date(Date.UTC(+start.slice(0, 4), +start.slice(5, 7), 1)));
    const end = addDays(next, -1) < to ? addDays(next, -1) : to;
    const query = `publish_type=daily&sort_by=print_date&sort_order=asc&date_start=${start}&date_end=${end}`;
    const data = (await getJson(`${API}/v3/puzzles.json?${query}`, cookie)) as { results?: Listed[] | null };
    listed.push(...(data.results ?? []));
    start = next;
    await sleep(DELAY_MS);
  }
  return listed.filter((p) => p.format_type === 'Normal');
}

async function fetchMissing(from: string, to: string) {
  const cookie = readCookie();
  mkdirSync(RAW, { recursive: true });
  const listed = await listPuzzles(from, to, cookie);
  const missing = listed.filter((p) => !existsSync(`${RAW}/${p.puzzle_id}.json`));
  console.log(`Listed ${listed.length} puzzles from ${from} to ${to}; fetching ${missing.length} new.`);
  for (const [i, p] of missing.entries()) {
    const data = await getJson(`${API}/v6/puzzle/${p.puzzle_id}.json`, cookie);
    writeFileSync(`${RAW}/${p.puzzle_id}.json`, JSON.stringify(data));
    if ((i + 1) % 25 === 0 || i + 1 === missing.length) console.log(`  ${i + 1}/${missing.length} (${p.print_date})`);
    await sleep(DELAY_MS);
  }
}

export interface Kept {
  id: number;
  date: string;
  puzzle: Puzzle;
  slots: Slot[];
  /** Complete entries' letters (`completeEntries`), rebus squares expanded. Entries with a blank square are skipped. */
  answers: string[];
}

/** Every cached puzzle that converts, numbers as NYT does and raises no error-tier issue, sorted by date. */
export function loadCached(): { kept: Kept[]; excluded: string[] } {
  const kept: Kept[] = [];
  const excluded: string[] = [];
  for (const file of existsSync(RAW) ? readdirSync(RAW).filter((f) => f.endsWith('.json')) : []) {
    const data = JSON.parse(readFileSync(`${RAW}/${file}`, 'utf8')) as { id: number; publicationDate: string };
    const label = `${data.publicationDate} (${data.id})`;
    try {
      const puzzle = fromNytPuzzle(data);
      const mismatch = numberingMismatch(data, puzzle);
      const errors = validate(puzzle).filter((issue) => issue.tier === 'error');
      if (mismatch || errors.length) {
        excluded.push(`${label}: ${mismatch ?? errors.map((issue) => issue.message).join('; ')}`);
        continue;
      }
      const { slots } = computeNumbering(puzzle);
      const answers = completeEntries(puzzle, slots);
      kept.push({ id: data.id, date: data.publicationDate, puzzle, slots, answers });
    } catch (error) {
      if (!(error instanceof ImportError)) throw error;
      excluded.push(`${label}: ${error.message}`);
    }
  }
  return { kept: kept.sort((a, b) => a.date.localeCompare(b.date)), excluded: excluded.sort() };
}

/** The most recent 3 years of kept puzzles: comparisons and answer counts use only these. */
export function recentWindow(kept: Kept[]): Kept[] {
  const latest = kept.at(-1)?.date ?? '';
  return kept.filter((k) => k.date > addDays(latest, -WINDOW_DAYS));
}

/** How many puzzles in the window used each answer (once per puzzle), and when it last ran. */
function countAnswers(window: Kept[]) {
  const counts = new Map<string, { count: number; last: string }>();
  for (const k of window) {
    for (const answer of new Set(k.answers)) {
      const seen = counts.get(answer);
      counts.set(answer, { count: (seen?.count ?? 0) + 1, last: k.date });
    }
  }
  return [...counts].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();
const percent = (n: number) => `${Math.round(100 * n)}%`;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const round = (n: number) => Math.round(n * 10_000) / 10_000;

/** F9: every puzzle in the window with its raw metrics. D6 is scored against the other puzzles in the window. */
function history(window: Kept[], answers: [string, { count: number; last: string }][]): NytHistory {
  const uses = usesInOtherPuzzles(new Map(answers.map(([a, s]) => [a, s.count])));
  return {
    metricsVersion: METRICS_VERSION,
    from: window[0]?.date ?? '',
    to: window.at(-1)?.date ?? '',
    puzzles: window.map((k): HistoryPuzzle => {
      const pattern = patternMetrics(k.puzzle, k.slots);
      const score = familiarity(k.answers, uses)?.score;
      return {
        id: k.id,
        date: k.date,
        rows: k.puzzle.rows,
        cols: k.puzzle.cols,
        ...pattern,
        longShare: round(pattern.longShare),
        familiarity: score === undefined ? null : round(score),
      };
    }),
  };
}

/** One puzzle per line, so a rerun's diff shows which puzzles changed. */
function historyJson(h: NytHistory): string {
  const { puzzles, ...head } = h;
  const rows = puzzles.map((p) => `    ${JSON.stringify(p)}`).join(',\n');
  return `${JSON.stringify(head).slice(0, -1)},\n  "puzzles": [\n${rows}\n  ]\n}\n`;
}

/** Spearman's rank correlation, ties given their mean rank. */
function spearman(xs: number[], ys: number[]): number {
  const rank = (v: number[]) => {
    const order = v.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
    const ranks = new Array<number>(v.length);
    for (let i = 0; i < order.length; ) {
      let j = i;
      while (j + 1 < order.length && order[j + 1]![0] === order[i]![0]) j++;
      for (let t = i; t <= j; t++) ranks[order[t]![1]] = (i + j) / 2;
      i = j + 1;
    }
    return ranks;
  };
  const [a, b] = [rank(xs), rank(ys)];
  const mid = (a.length - 1) / 2;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i]! - mid) * (b[i]! - mid);
    da += (a[i]! - mid) ** 2;
    db += (b[i]! - mid) ** 2;
  }
  return num / Math.sqrt(da * db);
}

const METRIC_KEYS = ['words', 'blocks', 'openSquares', 'longShare', 'familiarity'] as const;

/** Per-day medians, and how each metric tracks the day and the others (15×15, Monday to Saturday). */
function historySummary(h: NytHistory): string {
  const value = (p: HistoryPuzzle, key: (typeof METRIC_KEYS)[number]) => p[key] ?? 0;
  const lines = [`\nMedians by day:  ${METRIC_KEYS.join('  ')}`];
  for (const day of [1, 2, 3, 4, 5, 6, 0]) {
    const size = day === 0 ? 21 : 15;
    const ps = h.puzzles.filter((p) => dayOf(p.date) === day && p.rows === size && p.cols === size);
    lines.push(`  ${DAYS[day]} (${ps.length}):  ${METRIC_KEYS.map((k) => +median(ps.map((p) => value(p, k))).toFixed(3)).join('  ')}`);
  }
  const daily = h.puzzles.filter((p) => dayOf(p.date) !== 0 && p.rows === 15 && p.cols === 15);
  const column = (k: (typeof METRIC_KEYS)[number]) => daily.map((p) => value(p, k));
  lines.push(`Spearman ρ vs day (Mon–Sat 15×15): ${METRIC_KEYS.map((k) => `${k} ${spearman(column(k), daily.map((p) => dayOf(p.date))).toFixed(2)}`).join(', ')}`);
  lines.push('Spearman ρ between metrics:');
  for (const a of METRIC_KEYS) lines.push(`  ${a.padEnd(12)} ${METRIC_KEYS.map((b) => spearman(column(a), column(b)).toFixed(2).padStart(6)).join('')}`);
  return lines.join('\n');
}

/** D6 at a glance: how NYT entries split across the tiers, overall and by day, plus every answer's uses. */
function wordData(window: Kept[], answers: [string, { count: number; last: string }][]): WordData {
  // A puzzle in the window counts itself, so its entries are scored against the other puzzles.
  const uses = usesInOtherPuzzles(new Map(answers.map(([a, s]) => [a, s.count])));
  const all = familiarity(window.flatMap((k) => k.answers), uses);
  return {
    from: window[0]?.date ?? '',
    to: window.at(-1)?.date ?? '',
    puzzles: window.length,
    entryShares: all?.tierShares ?? FAMILIARITY_TIERS.map(() => 0),
    byDay: [1, 2, 3, 4, 5, 6, 0].map((day) => {
      const size = day === 0 ? 21 : 15;
      const ks = window.filter((k) => dayOf(k.date) === day && k.puzzle.rows === size && k.puzzle.cols === size);
      const scored = ks.map((k) => familiarity(k.answers, uses)!);
      return {
        day: DAYS[day]!,
        size,
        puzzles: ks.length,
        shares: FAMILIARITY_TIERS.map((_, t) => scored.reduce((s, f) => s + f.tierShares[t]!, 0) / (ks.length || 1)),
        medianScore: median(scored.map((f) => f.score)),
      };
    }),
    answers: answers.map(([a, s]) => [a, s.count, s.last]),
  };
}

function familiarityReport(data: WordData): string {
  const lines = [
    '# Answer familiarity (D6)',
    '',
    `${data.puzzles} NYT puzzles from ${data.from} to ${data.to}; ${data.answers.length} distinct answers.`,
    'Generated by `npm run history:update`. Local only: the answers come from copyrighted puzzles.',
    '',
    '## Tiers',
    '',
    '| Tier | Points | Puzzles that used it | Answers in this tier for a new puzzle | Share of NYT entries |',
    '|---|---|---|---|---|',
    ...FAMILIARITY_TIERS.map((tier, t) => {
      const distinct = t === 0 ? '— (not in the list)' : data.answers.filter(([, uses]) => familiarityTier(uses) === t).length;
      return `| ${tier.name} | ${t} | ${tierRange(t)} | ${distinct} | ${percent(data.entryShares[t]!)} |`;
    }),
    '',
    '## By day',
    '',
    'Share of each puzzle’s entries in each tier (averaged), and the median familiarity score: mean points per entry,',
    'lower is harder. 15×15 for Monday to Saturday, 21×21 for Sunday.',
    '',
    `| Day | Puzzles | ${FAMILIARITY_TIERS.map((t) => t.name).join(' | ')} | Median score |`,
    `|---|---|${FAMILIARITY_TIERS.map(() => '---|').join('')}---|`,
    ...data.byDay.map((d) => `| ${d.day} | ${d.puzzles} | ${d.shares.map(percent).join(' | ')} | ${d.medianScore.toFixed(2)} |`),
    '',
    '## Most used answers',
    '',
    data.answers
      .slice(0, 60)
      .map(([a, uses]) => `${a} ${uses}`)
      .join(' · '),
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const to = args.to ?? isoDate(new Date());
  const from = args.from ?? addDays(to, -WINDOW_DAYS);
  if (!args.offline) await fetchMissing(from, to);

  const { kept, excluded } = loadCached();
  const window = recentWindow(kept);
  const answers = countAnswers(window);
  const data = wordData(window, answers);
  mkdirSync(DIR, { recursive: true });
  writeFileSync(`${DIR}/word-data.json`, JSON.stringify(data));
  writeFileSync(
    `${DIR}/answers.csv`,
    [
      'answer,count,tier,last_seen',
      ...answers.map(([a, s]) => `${a},${s.count},${FAMILIARITY_TIERS[familiarityTier(s.count)]!.name},${s.last}`),
    ].join('\n'),
  );
  writeFileSync(`${DIR}/familiarity.md`, familiarityReport(data));
  const nytHistory = history(window, answers);
  writeFileSync(HISTORY_FILE, historyJson(nytHistory));

  const sizes = new Map<string, number>();
  for (const k of window) sizes.set(`${k.puzzle.rows}×${k.puzzle.cols}`, (sizes.get(`${k.puzzle.rows}×${k.puzzle.cols}`) ?? 0) + 1);
  console.log(`\nKept ${kept.length} cached puzzles; ${window.length} in the window ${data.from} – ${data.to}.`);
  console.log(`By size: ${[...sizes].sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s} ${n}`).join(', ')}`);
  console.log(`${answers.length} distinct answers written to ${DIR}/word-data.json, answers.csv and familiarity.md.`);
  console.log(`${nytHistory.puzzles.length} puzzles' metrics written to ${HISTORY_FILE}.`);
  console.log(historySummary(nytHistory));
  console.log(`\nExcluded ${excluded.length}:${excluded.map((e) => `\n  ${e}`).join('')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
