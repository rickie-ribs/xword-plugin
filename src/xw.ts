/**
 * The plugin's command-line tool. `doctor` reports what setup has installed; every other command goes to the
 * xw script (vendor/scripts/xw.ts lists them), once the wordlist it needs is in place.
 */
import { existsSync } from 'node:fs';
import { COOKIE, GRID_GUIDE_HOME, WORD_DATA, WORDLIST } from './home';

const command = process.argv[2];

if (command === 'doctor') {
  const line = (ok: boolean, what: string, gives: string) => console.log(`${ok ? '✓' : '✗'} ${what}: ${gives}`);
  console.log(`Data folder: ${GRID_GUIDE_HOME}`);
  line(existsSync(WORDLIST), 'Wordlist', 'needed to build and fill grids');
  line(existsSync(WORD_DATA), 'NYT word data (optional)', 'past uses and Freshness in hand-offs');
  line(existsSync(COOKIE), 'NYT cookie (optional)', 'only needed to download or update the word data');
  if (!existsSync(WORDLIST)) console.log('\nRun /grid-guide:setup to download the wordlist.');
} else if (['find', 'check', 'fill'].includes(command ?? '') && !existsSync(WORDLIST)) {
  console.error(`No wordlist at ${WORDLIST}. Run /grid-guide:setup first.`);
  process.exit(1);
} else {
  await import('../vendor/scripts/xw');
}
