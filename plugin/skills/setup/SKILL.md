---
name: setup
description: One-time setup for grid-guide. Downloads the wordlist and, if the user wants, walks them through the optional NYT history download. Use on first use, when the user asks to set up grid-guide, or when `xw doctor` reports the wordlist missing.
---

# Set up grid-guide

Setup runs once, on the computer where the user runs Claude Code. Everything goes in `~/.grid-guide/` (or `$GRID_GUIDE_HOME`) and stays there. To use grid-guide from a phone, they run Claude Code on that computer with Remote Control and drive it from the phone. Nothing is downloaded per session.

The bundled tools are in `${CLAUDE_PLUGIN_ROOT}/dist/`. ## Open with the whole picture

Before running anything, tell the user in a few lines what setup is. Don't wait to be asked.

- Setup has two parts. **Part 1, the wordlist, is required.** It is automatic and takes about a minute. **Part 2, NYT history, is optional.** It takes about 15 minutes and carries a risk, so it only happens if they choose it.
- Nothing is asked of them in part 1. After it they can start a puzzle right away. Part 2 can be done now or any time later.
- Everything is saved on their computer in `~/.grid-guide/`.

Then start with `node "${CLAUDE_PLUGIN_ROOT}/dist/xw.mjs" doctor` to see what's already there, and skip any step that's done.

## 1. The wordlist (required)

Run `node "${CLAUDE_PLUGIN_ROOT}/dist/setup.mjs"`. It downloads Spread the Word(list) from its own site and removes about 98,700 junk strings, fragments, slurs and unused obscure words. Then it saves the list and writes `ATTRIBUTION.md`.

- Show the user the credit it prints: Spread the Word(list) by Brooke Husic and Enrique Henestroza Anguiano, CC BY-NC-SA 4.0. It is free to use in free products with attribution, and they may sell puzzles built with it.
- `--full` keeps the uncleaned list. `--from FILE` uses a `WORD;SCORE` list the user already has instead. `--update` downloads it again.
- If the download fails, pass on the tool's message: get the uppercase `.txt` from https://www.spreadthewordlist.com/ by hand, then use `--from`.

Then run `doctor` again to confirm.

## 2. NYT history (optional)

Say that part 1 is done and they can start a puzzle now. Then ask whether they want part 2, and give this warning first, in plain words:

- It adds past-use counts and Freshness to puzzle hand-offs, and it ranks candidate words by how often they've run. **Everything else works without it.**
- It needs their own New York Times Games (or All Access) subscription.
- It downloads about 1,100 puzzles (around 190 MB, roughly 10–15 minutes) by sending automated requests signed in as them. NYT's terms of service likely don't allow that, so it could put their account at risk. The choice is theirs.
- The puzzles stay on their computer and are never shared.

Stop here unless they clearly say yes. If they do, walk them through it one step at a time.

1. **Sign in.** Open https://www.nytimes.com in Chrome, Edge, Safari or Firefox on a computer, and sign in.
2. **Find the cookie.**
   - Chrome or Edge: View → Developer → Developer Tools (⌥⌘I on a Mac, F12 on Windows), then the **Application** tab, then **Cookies** → `https://www.nytimes.com`.
   - Firefox: the **Storage** tab.
   - Safari: first turn on Settings → Advanced → "Show features for web developers". Then Develop → Show Web Inspector → **Storage** → Cookies.
   - Find the row named `NYT-S` and copy its whole **Value**.
3. **Save it without sending it here.** Tell them plainly: never paste the cookie into this chat. It works like a password, and the chat keeps a transcript. With the value still copied, they run this in their own terminal on a Mac:
   ```bash
   mkdir -p ~/.grid-guide/nyt && pbpaste > ~/.grid-guide/nyt/cookie.txt && chmod 600 ~/.grid-guide/nyt/cookie.txt
   ```
   On Windows or Linux, they create `~/.grid-guide/nyt/cookie.txt` in a text editor, paste the value, and save.
4. **Check it.** Never read, print or `cat` the file. Check only that it exists and isn't empty: `test -s ~/.grid-guide/nyt/cookie.txt && echo saved`.
5. **Download.** Run `node "${CLAUDE_PLUGIN_ROOT}/dist/nyt.mjs"` in the background, and tell them it takes about 10–15 minutes. When it finishes, report how many puzzles it kept and run `doctor`.
   - It skips puzzles it already has. If it stops partway, running it again picks up where it left off.
   - If it says NYT refused the cookie, the cookie has expired: repeat steps 1–3, then run it again.
   - Run the same command any time to add newer puzzles.

## Done

End with a short summary in this shape, with plain labels:

- **Done:** the wordlist is installed (say where, and give the credit from step 1). If they did part 2, say how many puzzles were kept.
- **Not done:** NYT history, if they skipped it, in one line: optional, and they can ask for it any time by saying "set up NYT history".
- **Needed from them:** nothing. Setup never has to be run again.
- **Start a puzzle now:** give two or three examples they can send as they are: "build me a 15×15 with SPACESHIP and MOONWALK", "critique the clues in puzzles/space.ipuz", "make a submission PDF of puzzles/space.ipuz". Say that puzzles are saved in a `puzzles/` folder in the folder this session runs in.
