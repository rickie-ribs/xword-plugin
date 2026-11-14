---
name: critique-clues
description: "Critique the clues of a crossword in an .ipuz file: errors, duplicates, variety, combinable clues, and rewrites. Use when the user asks for a clue review, clue critique, or feedback on their clues."
---

# Critique clues

Read the `.ipuz` (clues are under `clues`; answers and roles under `x-xword-builder.clues`, grid under `solution`). Review only; change the file only if asked. Number entries from `puzzle` so you can cite "24-Across".

## Checks, in priority order

1. **Errors.** Check each clue against its answer and the facts:
   - Spelling and fit: fill-in-the-blank and "missing letters" clues must spell the answer exactly. Check name spellings (Carey vs Carrey).
   - Facts: dates, ranks, capitals, "until 2020". Flag anything dated ("in 2025") or that you can't verify, and say it needs a check.
   - Ambiguity: a clue with two valid answers or two valid referents (Punjab has two capitals).
   - Typos, trailing periods, inconsistent punctuation, tense/number agreement (plural answer, plural clue).
   - Missing "?" on puns; "?" on clues that aren't puns.
   - Misleading clues: prefix/suffix clues that don't say "prefix with...", clues whose real answer is only part of the thing named.
2. **Repeats.** Same word in several clues (brother, capital, suffix), two clues with the same idea (two chemistry suffixes), and clues that give away part of their answer.
3. **Combinable clues.** Look for entries related enough for "See N-Across". Be honest if there are few; cross-references annoy solvers, especially in easy puzzles. Prefer reclueing duplicates to linking them. Mention any natural link (for example TEA and URN) as optional.
4. **Variety.** Compare against `benchmarks.md` (NYT mix by day of week; read it first). Roughly count non-theme clues by type: straight definition, name/trivia (split people, places, brands), fill-in, quote/exclamation, wordplay, abbreviation, cross-reference. Say what's over- and under-used, and name specific clues to convert. Also note era skew in pop-culture references and over-long clues.
5. **Theme clues.** Do starred clues match their answers, and does the revealer clue say "answers to the starred clues"?

## Output

- Answer the user's questions directly first, then the findings.
- Put errors in a table: entry, problem, suggested rewrite. Put smaller improvements in a short list. Give concrete rewrites, not just complaints.
- Cite entries as number-direction. Use rough counts and say they're rough.
- Don't invent facts to support a critique; flag what needs verifying.
