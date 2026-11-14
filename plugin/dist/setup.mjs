// src/setup.ts
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join as join2 } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// src/home.ts
import { homedir } from "node:os";
import { join } from "node:path";
var GRID_GUIDE_HOME = process.env.GRID_GUIDE_HOME ?? join(homedir(), ".grid-guide");
var WORDLIST = join(GRID_GUIDE_HOME, "wordlists", "spreadthewordlist.txt");
var NYT_DIR = join(GRID_GUIDE_HOME, "nyt");
var COOKIE = join(NYT_DIR, "cookie.txt");
var WORD_DATA = join(NYT_DIR, "word-data.json");

// src/wordlist.ts
var MIN_WORDS = 1e3;
var CREDIT = `Spread the Word(list) by Brooke Husic and Enrique Henestroza Anguiano
https://www.spreadthewordlist.com/
Licensed under CC BY-NC-SA 4.0: https://creativecommons.org/licenses/by-nc-sa/4.0/
Free to use in a product offered free of charge, with attribution, and to sell puzzles built with it.`;
function checkList(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const good = lines.filter((l) => /^[^;]+;\d+$/.test(l.trim())).length;
  if (lines.length < MIN_WORDS) throw new Error(`Only ${lines.length} lines: that doesn't look like a wordlist.`);
  if (good < lines.length * 0.99) throw new Error(`Only ${good} of ${lines.length} lines are WORD;SCORE.`);
  return lines.length;
}
function removeWords(text, removed) {
  const drop = new Set(removed.split(/\r?\n/).filter((l) => l && !l.startsWith("#")));
  const lines = text.split(/\r?\n/).filter(Boolean);
  const kept = lines.filter((l) => !drop.has(l.split(";")[0]));
  return { text: `${kept.join("\n")}
`, dropped: lines.length - kept.length };
}

// src/setup.ts
var REMOVED = join2(dirname(fileURLToPath(import.meta.url)), "..", "data", "removed-words.txt");
var SOURCE = "https://www.spreadthewordlist.com/downloads/spreadthewordlist_caps.txt";
async function main() {
  const { values: args } = parseArgs({ options: { from: { type: "string" }, update: { type: "boolean" }, full: { type: "boolean" } } });
  if (existsSync(WORDLIST) && !args.update && !args.from) {
    console.log(`A wordlist is already in place at ${WORDLIST}. Add --update to download it again.`);
    return;
  }
  mkdirSync(dirname(WORDLIST), { recursive: true });
  const partial = `${WORDLIST}.partial`;
  if (args.from) {
    const count2 = checkList(readFileSync(args.from, "utf8"));
    copyFileSync(args.from, WORDLIST);
    console.log(`Copied your list (${count2} words) to ${WORDLIST}.`);
    writeFileSync(join2(GRID_GUIDE_HOME, "ATTRIBUTION.md"), `# Wordlist

The user's own list, copied from ${args.from}.
`);
    return;
  }
  console.log(`Downloading ${SOURCE} ...`);
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`The download failed (${response.status}).`);
  let text = await response.text();
  checkList(text);
  let note = "the full list";
  if (!args.full) {
    const cleaned = removeWords(text, readFileSync(REMOVED, "utf8"));
    text = cleaned.text;
    note = `cleaned: ${cleaned.dropped} junk, offensive or obscure words removed; --full keeps them`;
  }
  const count = checkList(text);
  writeFileSync(partial, text);
  renameSync(partial, WORDLIST);
  writeFileSync(join2(GRID_GUIDE_HOME, "ATTRIBUTION.md"), `# Wordlist

${CREDIT}

Downloaded ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)} from ${SOURCE}; ${note}.
`);
  console.log(`Saved ${count} words to ${WORDLIST} (${note}).

${CREDIT}`);
}
main().catch((error) => {
  console.error(`${error.message}
Get the list by hand from https://www.spreadthewordlist.com/ (uppercase .txt), or use any WORD;SCORE list, then run: node dist/setup.mjs --from FILE`);
  process.exit(1);
});
