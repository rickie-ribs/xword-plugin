/**
 * Optional: downloads the user's own NYT crossword history with their NYT-S cookie and builds the word data
 * hand-offs use for past uses and Freshness. Never prints the cookie. vendor/scripts/nyt-history.ts does the work;
 * it skips puzzles already downloaded, so an interrupted run picks up where it stopped.
 *
 *   node dist/nyt.mjs [--from 2023-11-14 --to 2026-11-13 --offline]
 */
import { existsSync } from 'node:fs';
import { COOKIE } from './home';

if (!process.env.NYT_S && !process.argv.includes('--offline') && !process.argv.includes('--cookie') && !existsSync(COOKIE)) {
  console.error(`No NYT cookie at ${COOKIE}. Run /grid-guide:setup for the steps to save one.`);
  process.exit(2);
}
await import('../vendor/scripts/nyt-history');
