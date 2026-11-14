---
name: build-puzzle
description: Build a filled crossword grid from a size and a list of required words. Use when the user asks Claude to construct, make or build a puzzle, such as "build a 15x15 with these words".
---

# Build a puzzle

Produce one filled grid as an `.ipuz` file the user can open in any crossword app that reads `.ipuz`. No clues and no theme work.

Every command below runs the bundled tool: `node "${CLAUDE_PLUGIN_ROOT}/dist/xw.mjs" <command> FILE ...`. The commands are `new` (`--size 15` or `--pattern rows.txt`), `show`, `blocks FILE r,c ...`, `place FILE 1A WORD ...`, `clear FILE 1A ...`, `find FILE 1A [--limit 30 --regex RE --contains S]`, `check FILE [--require W,W --accept W,W]` and `fill FILE [--fills 5 --budget 30000 --seed 1 --variety 0.3 --min-score 50 --ban W,W]`. `fill` writes `FILE-fill1.ipuz` and so on, and leaves FILE as it is.

Work in a scratch folder and put the finished file in `puzzles/` under the current folder. An entry's number changes when blocks change, so find numbers with `show` before placing words.

## Before you start

Run `node "${CLAUDE_PLUGIN_ROOT}/dist/xw.mjs" doctor`. If the wordlist is missing, run the `/grid-guide:setup` skill first, because nothing can be filled without it. The NYT word data is optional: it gives past uses and Freshness. Without it the puzzle can still be built, but say the hand-off has no Freshness.

## Steps

1. **Read the request.** Note the size, required words and any ordering. If an ordering could mean several things, pick the strictest reading that satisfies them all and say which you chose. Required words go in even if they aren't on the list.

2. **Draw the pattern.** Write rows of `#` and `.` to a text file, then `new FILE --pattern rows.txt` and `check FILE`. Fix every error before placing a word. Aim for 72–78 words on a 15×15.
   - An entry on the top or bottom row forces the three rows nearest that edge to stay white across its whole length. A block closer in would leave a 2-letter entry or an unchecked square. So a long edge entry means a triple stack.
   - Cap that stack's crossings with blocks where you can, so they stay 3 letters. Long downs ending in fixed letters such as P, I and C often can't be filled.

3. **Place the required words,** then `fill FILE --fills 3 --min-score 50 --seed N --variety 0.6`. If a fill is proved impossible, change the pattern rather than retrying. The failure names the entries at fault.

4. **Compare several seeds.** Read the word lists rather than taking the first fill. Choose the grid with the best long entries, even if it has short weak spots, since short entries are the easiest to change.

5. **Edit it by hand.** This step is the point of the skill. Read `show` line by line and judge **every** entry, across and down, including 3-letter ones and words the solver didn't choose this round. Look for suffixes, partials, foreign words, awkward plurals, crossword-only words and dated or niche names. A first pass from memory misses these: one run overlooked OLA, ALGER and AKELA until asked to rank the fill.
   - Rank the 15 worst entries, worst first. For each of the worst, work out what holds it in place by naming the crossing entries that fix its letters.
   - Fix the worst ones first, and re-rank after each change. Stop when the remaining weak entries would cost a better long entry to remove, and say so rather than making the trade silently.
   - `check` warns about an entry and its plural (V18). It goes by spelling, so judge whether each pair really is the same word. It doesn't catch irregular plurals or other shared roots (MAN and MEN, EDIT and EDITOR), so look for those yourself.
   - `clear` the weak entry and the ones around it, then re-run `fill` with `--ban` naming what you rejected and a new seed.
   - `find FILE 12A` shows what fits an entry. Check it before banning a word, because a ban can leave a square with no letter. `no-word` naming an entry far from the ban usually means that.
   - The list holds junk even at a high score floor. Never trust a word because the list has it.

6. **Words not on the list.** Use one only if you're confident it's a current, valid word. Required words are always allowed.

7. **Check it.** Always run `check FILE --require WORD,WORD` last, after every edit, because `clear` can wipe letters from a required word. It must show no errors other than `not in the word list` for words you chose to use, no plural warning you haven't judged, and every required word in.

8. **Make the hand-off page.** This step is required for every puzzle, whatever its size; never skip it or offer it as an option. It's the page the user reads, including on a phone. See below.

## Hand-off

Make a hand-off page from `${CLAUDE_PLUGIN_ROOT}/skills/build-puzzle/handoff-template.html`, and always save it as `puzzles/NAME.html` next to the `.ipuz`. Then publish it as a private Artifact and give the user its link, so it opens on a phone too. The Artifact tool may not be loaded yet: if it isn't in your tool list, search for it (ToolSearch, "Artifact") before deciding it's missing. Only when there's truly no Artifact tool, give the saved page's path instead. Copy the template to the scratch folder, and change its title, `ROWS`, `REQUIRED`, `WORDS`, stats, not-on-the-list note, bigger-change requests and file line for this puzzle. The page builds its blank grid and entry list from `ROWS`. Mark a removal cost as tested only if you actually tried it. Keep the template's credit line for the wordlist (Spread the Word(list), CC BY-NC-SA 4.0).

In the reply and on the page, show the filled grid and a blank grid, list every entry by number under Across and Down, and give:
- The file path.
- Every word not on the list, with a short reason.
- The ranked list of the 15 weakest entries (or every entry, on a grid with fewer), worst first, each with its entry number, what the word is (a plain definition or who it names, in `WORDS`' "What it is" field), and the reason it's weak. Don't guess at a meaning; check any you aren't sure of.
- For the worst ones, which entries hold them in place and what removing them would cost, so the user can decide on any trade.
- How any ordering request was read, plus the word count, blocks and Freshness.

Never mention list scores to the user or put them on the page. `--min-score` only steers the search.
