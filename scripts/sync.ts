/**
 * Copies the code the plugin runs from the sibling XWORD_BUILDER repo into vendor/, then patches its data paths
 * to the user's ~/.grid-guide folder (src/home.ts). Each patch must match exactly once, so an upstream change
 * that moves a line stops the sync instead of silently leaving a repo path behind.
 *
 *   npm run sync [-- --from ../XWORD_BUILDER]
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({ options: { from: { type: 'string', default: '../XWORD_BUILDER' } } });
const FROM = args.from;
const TO = 'vendor';

/** Paths relative to the repo root, copied to the same path under vendor/. */
const FILES = [
  'src/model',
  'src/rules',
  'src/engine/index.ts',
  'src/engine/wordlist.ts',
  'src/engine/candidates.ts',
  'src/engine/fill.ts',
  'src/io/ipuz.ts',
  'src/io/nytJson.ts',
  'src/io/pdf.ts',
  'src/history/nytHistory.json',
  'scripts/xw.ts',
  'scripts/xwCommands.ts',
  'scripts/nyt-history.ts',
  'tests/cli/xwCommands.test.ts',
  'tests/fixtures/grids.ts',
  'tests/fixtures/words.ts',
];

const HOME = "import { COOKIE, NYT_DIR, WORD_DATA as HOME_WORD_DATA, WORDLIST } from '../../src/home';";

/** [file, exact upstream text, replacement]. */
const PATCHES: [string, string, string][] = [
  ['scripts/xw.ts', "import { parseArgs } from 'node:util';", `import { parseArgs } from 'node:util';\n${HOME}`],
  ['scripts/xw.ts', "const LIST = 'data/wordlists/spreadthewordlist.txt';", 'const LIST = WORDLIST;'],
  ['scripts/xw.ts', "const WORD_DATA = 'data/nyt/word-data.json';", 'const WORD_DATA = HOME_WORD_DATA;'],
  ['scripts/nyt-history.ts', "import { parseArgs } from 'node:util';", `import { parseArgs } from 'node:util';\n${HOME}`],
  ['scripts/nyt-history.ts', "const DIR = 'data/nyt';", 'const DIR = NYT_DIR;'],
  ['scripts/nyt-history.ts', "const PRIVATE = 'private/nyt';", 'const PRIVATE = NYT_DIR;'],
  ['scripts/nyt-history.ts', "const HISTORY_FILE = 'src/history/nytHistory.json';", 'const HISTORY_FILE = `${NYT_DIR}/nytHistory.json`;'],
  ['scripts/nyt-history.ts', '`${PRIVATE}/cookie.txt`', 'COOKIE'],
];

if (!existsSync(`${FROM}/scripts/xw.ts`)) throw new Error(`No XWORD_BUILDER checkout at ${FROM}`);
rmSync(TO, { recursive: true, force: true });
mkdirSync('plugin/data', { recursive: true });
for (const path of FILES) cpSync(`${FROM}/${path}`, `${TO}/${path}`, { recursive: true });

for (const [file, from, to] of PATCHES) {
  const path = `${TO}/${file}`;
  const text = readFileSync(path, 'utf8');
  const count = text.split(from).length - 1;
  if (count === 0) throw new Error(`Patch not found in ${file}: ${from}`);
  writeFileSync(path, text.replaceAll(from, to));
}

// Unused imports fail the typecheck; drop the names a file's patches didn't use.
for (const file of ['scripts/xw.ts', 'scripts/nyt-history.ts']) {
  const path = `${TO}/${file}`;
  const text = readFileSync(path, 'utf8');
  const body = text.replace(HOME, '');
  const used = ['COOKIE', 'NYT_DIR', 'WORD_DATA as HOME_WORD_DATA', 'WORDLIST'].filter((name) =>
    new RegExp(`\\b${name.split(' ').at(-1)}\\b`).test(body),
  );
  writeFileSync(path, text.replace(HOME, `import { ${used.join(', ')} } from '../../src/home';`));
}

// The words XWORD_BUILDER removed from its copy of Spread the Word(list): the untouched download minus the list it
// uses. Setup subtracts them, so a user's list matches. Derived from the list, so it carries the list's license.
const ORIGINAL = `${FROM}/data/wordlists/review/spreadthewordlist.original.txt`;
if (existsSync(ORIGINAL)) {
  const words = (path: string) => readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => l.split(';')[0]!);
  const kept = new Set(words(`${FROM}/data/wordlists/spreadthewordlist.txt`));
  const removed = words(ORIGINAL).filter((w) => !kept.has(w)).sort();
  writeFileSync(
    'plugin/data/removed-words.txt',
    `# ${removed.length} words removed from Spread the Word(list) (CC BY-NC-SA 4.0): junk strings, fragments, slurs and unused obscure words.\n${removed.join('\n')}\n`,
  );
  console.log(`Wrote ${removed.length} removed words.`);
}

writeFileSync(
  `${TO}/README.md`,
  'Copied from XWORD_BUILDER by `npm run sync` (scripts/sync.ts), with its data paths patched to ~/.grid-guide. Do not edit by hand.\n',
);
console.log(`Synced ${FILES.length} paths and ${PATCHES.length} patches from ${FROM}.`);
