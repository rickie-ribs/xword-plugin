# grid-guide

A Claude Code plugin for crossword constructors. Ask Claude for a puzzle in plain words and get a filled grid back:

> Build me a 15×15 with SPACESHIP and MOONWALK.

You get an `.ipuz` file, which any crossword app that reads `.ipuz` can open, and a hand-off page that shows the grid, every entry and the weakest fill, ranked. Each weak entry comes with what holds it in place, so you can ask for a rework. You can also ask for a clue critique of any `.ipuz` file.

## Install

In Claude Code:

```
/plugin marketplace add rickie-ribs/xword-plugin
/plugin install grid-guide@xword-plugin
```

Then run setup once:

```
/grid-guide:setup
```

You need Node 20 or later.

## Setup

Setup runs once, on your own computer, and keeps everything in `~/.grid-guide/` (set `GRID_GUIDE_HOME` to move it).

1. **Wordlist (required).** Setup downloads Spread the Word(list) from its own site, then removes about 98,700 junk strings, fragments, slurs and unused obscure words, leaving about 205,700 words. Ask for the full list if you'd rather keep everything, or point setup at any `WORD;SCORE` list you already have.
2. **NYT history (optional).** This adds past-use counts and Freshness to hand-offs, and ranks candidate words by how often they've run. It needs your own New York Times Games subscription and your browser's `NYT-S` cookie, and setup walks you through saving it.
   - **Read this first:** it downloads about 1,100 puzzles (around 190 MB) with automated requests signed in as you. NYT's terms of service likely don't allow that, so it could put your account at risk. Everything else works without it.
   - Never paste the cookie into a chat. Setup has you save it to a file yourself, and Claude only checks that the file exists.

### On your phone

Run Claude Code on the computer where you ran setup, turn on Remote Control, and drive it from the Claude app on your phone. The data stays on that computer, so nothing is downloaded again. Hand-off pages are published as private Artifacts where that's available, so they open on the phone.

## What's inside

- `plugin/skills/`: `setup`, `build-puzzle` and `critique-clues`
- `plugin/dist/`: the bundled command-line tool the skills run (`xw.mjs`), plus the setup and NYT download helpers
- The grid, fill and validation code comes from the author's crossword workbench, copied into `vendor/` by `npm run sync`.

## Credits and licenses

- Code: MIT, see `LICENSE`.
- Wordlist: [Spread the Word(list)](https://www.spreadthewordlist.com/) by Brooke Husic and Enrique Henestroza Anguiano, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). It isn't included in this repository: setup downloads it from their site. `plugin/data/removed-words.txt`, the list of words setup removes, is derived from it and shares its license.
- NYT puzzles are never included or shared. The optional download stays on your computer.
