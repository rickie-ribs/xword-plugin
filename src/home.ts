import { homedir } from 'node:os';
import { join } from 'node:path';

/** Where setup puts the wordlist and the optional NYT data: ~/.grid-guide unless $GRID_GUIDE_HOME says otherwise. */
export const GRID_GUIDE_HOME = process.env.GRID_GUIDE_HOME ?? join(homedir(), '.grid-guide');
export const WORDLIST = join(GRID_GUIDE_HOME, 'wordlists', 'spreadthewordlist.txt');
export const NYT_DIR = join(GRID_GUIDE_HOME, 'nyt');
export const COOKIE = join(NYT_DIR, 'cookie.txt');
export const WORD_DATA = join(NYT_DIR, 'word-data.json');
