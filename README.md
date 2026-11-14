# grid-guide

A Claude Code plugin for crossword constructors. Ask Claude for a puzzle in plain words and get a filled grid back:

> Build me a 15×15 with SPACESHIP and MOONWALK.

You get an `.ipuz` file, which any crossword app that reads `.ipuz` can open, and a hand-off page that shows the grid, every entry and the weakest fill, ranked. Each weak entry comes with what holds it in place, so you can ask for a rework. You can also ask for a clue critique of any `.ipuz` file, and a submission-ready PDF once it's clued.

### See it, solve it, share it

[Crosshare](https://crosshare.org/upload) is a free crossword site that's a good place to take the `.ipuz` file next. Upload it to see the puzzle laid out, solve it yourself to test the fill, then add or edit clues in its constructor. When it's ready, share the Crosshare link with friends so they can solve it in the browser.

### Submission-ready PDF

After you're done tweaking clues, ask Claude for a submission PDF (or run `/grid-guide:submission-pdf`). You get the standard submission layout: your name, address and email with the filled grid on page 1, then the Across and Down clues with their answers. Claude asks for your contact details once and saves them on your computer for next time, and it tells you if any square is empty or any clue is missing.

It works on any `.ipuz` file, not just ones grid-guide built. If you clued the puzzle in Crosshare, export it there (More → Download .ipuz File) and ask for a PDF of that file:

> make a submission PDF of ~/Downloads/my-puzzle.ipuz

## Install

You need [Node.js](https://nodejs.org/) 20 or later on your computer. Pick whichever way you use Claude Code. Either one installs grid-guide for both, since they share the same settings.

### Claude desktop app

1. Open the **Code** tab and start a session on your computer (a local session, not a cloud one), in any folder you'd like your puzzles saved to.
2. Paste this prompt and send it:

   > Install the grid-guide plugin for me by running these two commands in the shell: `claude plugin marketplace add rickie-ribs/xword-plugin` and then `claude plugin install grid-guide@xword-plugin`. After that, set up grid-guide.

### Terminal

Run these in your shell (zsh, bash or PowerShell):

```bash
claude plugin marketplace add rickie-ribs/xword-plugin
```
```bash
claude plugin install grid-guide@xword-plugin
```

Then start Claude Code in the folder you'd like your puzzles saved to, and run setup:

```bash
claude
```
```
/grid-guide:setup
```

Lines starting with `/` are typed at Claude's prompt, not in your shell. Inside a session, `/plugin marketplace add rickie-ribs/xword-plugin` and `/plugin install grid-guide@xword-plugin` do the same as the two shell commands.

### Using it

After setup, just ask, in either the app or the terminal:

- **build me a 15×15 with SPACESHIP and MOONWALK**
- **critique the clues in puzzles/space.ipuz**
- **make a submission PDF of puzzles/space.ipuz**

Puzzles are saved in a `puzzles/` folder inside the folder your session runs in.

## Setup

Setup runs once, on your own computer, and keeps everything in `~/.grid-guide/` (set `GRID_GUIDE_HOME` to move it).

1. **Wordlist (required).** Setup downloads Spread the Word(list) from its own site, then removes about 98,700 junk strings, fragments, slurs and unused obscure words, leaving about 205,700 words. Ask for the full list if you'd rather keep everything, or point setup at any `WORD;SCORE` list you already have.
2. **NYT history (optional).** This adds past-use counts and Freshness to hand-offs, and ranks candidate words by how often they've run. It needs your own New York Times Games subscription and your browser's `NYT-S` cookie, and setup walks you through saving it.
   - **Read this first:** it downloads about 1,100 puzzles (around 190 MB) with automated requests signed in as you. NYT's terms of service likely don't allow that, so it could put your account at risk. Everything else works without it.
   - Never paste the cookie into a chat. Setup has you save it to a file yourself, and Claude only checks that the file exists.

### On your phone

Run Claude Code on the computer where you ran setup, turn on Remote Control, and drive it from the Claude app on your phone. The data stays on that computer, so nothing is downloaded again. Hand-off pages are published as private Artifacts where that's available, so they open on the phone.

## What's inside

- `plugin/skills/`: `setup`, `build-puzzle`, `critique-clues` and `submission-pdf`
- `plugin/dist/`: the bundled command-line tool the skills run (`xw.mjs`), plus the PDF maker (`pdf.mjs`) and the setup and NYT download helpers
- The grid, fill, validation and `.ipuz` code is in `vendor/`.

## Credits and licenses

- Code: MIT, see `LICENSE`.
- Wordlist: [Spread the Word(list)](https://www.spreadthewordlist.com/) by Brooke Husic and Enrique Henestroza Anguiano, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). It isn't included in this repository: setup downloads it from their site. `plugin/data/removed-words.txt`, the list of words setup removes, is derived from it and shares its license.
- NYT puzzles are never included or shared. The optional download stays on your computer.
