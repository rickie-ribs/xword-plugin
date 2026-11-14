/**
 * Puts the wordlist in the data folder: downloads Spread the Word(list) from its own site, or copies a list the
 * user already has. The download is cleaned with data/removed-words.txt (junk, fragments, slurs and unused obscure
 * words) unless --full is given. Writes ATTRIBUTION.md next to it and prints the credit. Does nothing if a list is
 * in place, unless --update is given.
 *
 *   node dist/setup.mjs [--from my-list.txt] [--update] [--full]
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { GRID_GUIDE_HOME, WORDLIST } from './home';
import { checkList, CREDIT, removeWords } from './wordlist';

/** Shipped beside dist/ in the plugin. */
const REMOVED = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'removed-words.txt');
const SOURCE = 'https://www.spreadthewordlist.com/downloads/spreadthewordlist_caps.txt';

async function main() {
  const { values: args } = parseArgs({ options: { from: { type: 'string' }, update: { type: 'boolean' }, full: { type: 'boolean' } } });
  if (existsSync(WORDLIST) && !args.update && !args.from) {
    console.log(`A wordlist is already in place at ${WORDLIST}. Add --update to download it again.`);
    return;
  }
  mkdirSync(dirname(WORDLIST), { recursive: true });
  const partial = `${WORDLIST}.partial`;

  if (args.from) {
    const count = checkList(readFileSync(args.from, 'utf8'));
    copyFileSync(args.from, WORDLIST);
    console.log(`Copied your list (${count} words) to ${WORDLIST}.`);
    writeFileSync(join(GRID_GUIDE_HOME, 'ATTRIBUTION.md'), `# Wordlist\n\nThe user's own list, copied from ${args.from}.\n`);
    return;
  }

  console.log(`Downloading ${SOURCE} ...`);
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`The download failed (${response.status}).`);
  let text = await response.text();
  checkList(text);
  let note = 'the full list';
  if (!args.full) {
    const cleaned = removeWords(text, readFileSync(REMOVED, 'utf8'));
    text = cleaned.text;
    note = `cleaned: ${cleaned.dropped} junk, offensive or obscure words removed; --full keeps them`;
  }
  const count = checkList(text);
  writeFileSync(partial, text);
  renameSync(partial, WORDLIST);
  writeFileSync(join(GRID_GUIDE_HOME, 'ATTRIBUTION.md'), `# Wordlist\n\n${CREDIT}\n\nDownloaded ${new Date().toISOString().slice(0, 10)} from ${SOURCE}; ${note}.\n`);
  console.log(`Saved ${count} words to ${WORDLIST} (${note}).\n\n${CREDIT}`);
}

main().catch((error: Error) => {
  console.error(`${error.message}\nGet the list by hand from https://www.spreadthewordlist.com/ (uppercase .txt), or use any WORD;SCORE list, then run: node dist/setup.mjs --from FILE`);
  process.exit(1);
});
