import { buildIndex } from '../../src/engine/index';
import { parseWordlist } from '../../src/engine/wordlist';

/**
 * A tiny `WORD;SCORE` list of 3-letter words (scores are ignored).
 * Words starting with each letter, which is what a 3×3's Down entries see from 1 Across:
 * C ×3 (CAT, COT, CUT), T ×3 (TAT, TOE, TEA), A ×2 (ARE, ACE), O ×1 (OAT), X ×1 (XYZ).
 */
export const TINY_LIST = ['CAT;55', 'XYZ;55', 'COT;50', 'TAT;50', 'CUT;45', 'ARE;40', 'TOE;40', 'ACE;35', 'TEA;30', 'OAT;20'].join(
  '\n',
);

export const tinyIndex = () => buildIndex(parseWordlist(TINY_LIST));
