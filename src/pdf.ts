/**
 * Writes the submission PDF for an .ipuz file, in the layout of the vendored F7 export (vendor/src/io/pdf.ts):
 * page 1 is the contact block and the filled grid, then Across and Down with answers. The contact block comes
 * from ~/.grid-guide/contact.txt, one line each. Reports empty squares and missing clues, which print as gaps.
 *
 *   node dist/pdf.mjs FILE.ipuz [--surname Smith] [--out DIR]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { fromIpuz } from '../vendor/src/io/ipuz';
import { toPdf } from '../vendor/src/io/pdf';
import { clueFor } from '../vendor/src/model/clues';
import { computeNumbering } from '../vendor/src/model/numbering';
import { CONTACT } from './home';

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: { surname: { type: 'string' }, out: { type: 'string' } },
});
const file = positionals[0];
if (!file) {
  console.error('Usage: node dist/pdf.mjs FILE.ipuz [--surname Smith] [--out DIR]');
  process.exit(1);
}

const { name, puzzle } = fromIpuz(readFileSync(file, 'utf8'), basename(file, '.ipuz'));
const contact = existsSync(CONTACT)
  ? readFileSync(CONTACT, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  : [];
const { slots } = computeNumbering(puzzle);
const empty = puzzle.cells.flat().filter((cell) => !cell.block && !cell.value).length;
const unclued = slots.filter((slot) => !clueFor(puzzle, slot)?.text.trim()).map((s) => `${s.number}${s.direction === 'across' ? 'A' : 'D'}`);

// The puzzle name without characters file systems reject, as the app's export names it.
const safeName = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim() || 'puzzle';
const fileName = `${args.surname ? `${args.surname.trim()}_` : ''}${safeName}.pdf`;
const out = join(args.out ?? dirname(file), fileName);
writeFileSync(out, Buffer.from(toPdf(puzzle, contact)));

console.log(`Wrote ${out}`);
console.log(contact.length ? `Contact block: ${contact.length} lines from ${CONTACT}` : `No contact block (save one in ${CONTACT})`);
if (empty) console.log(`${empty} empty squares`);
console.log(unclued.length ? `${unclued.length} of ${slots.length} entries have no clue: ${unclued.join(' ')}` : `All ${slots.length} entries are clued`);
