# Plan: grid-guide, a Claude Code plugin

A public Claude Code plugin that lets anyone build crossword grids and critique clues by asking Claude, without the XWORD_BUILDER web app. It packages the `build-puzzle` and `critique-clues` skills, plus the command-line logic behind them, from `../XWORD_BUILDER`.

This repo is separate so it can be public and change without touching XWORD_BUILDER. Nothing here writes to that folder.

## What a user gets

- **Install:** `/plugin marketplace add rickie-ribs/xword-plugin`, then `/plugin install grid-guide@xword-plugin`.
- **One-time setup on their own computer:** `/grid-guide:setup` fetches the wordlist, credits it, and optionally walks them through the NYT history download.
- **Use:** "build me a 15×15 with these themers", or "critique the clues in my-puzzle.ipuz". The result is an `.ipuz` file and a hand-off page, the same flow as today.
- **On the phone:** they run Claude Code with Remote Control on the computer where setup ran, then drive it from the phone. The data lives on that computer, so it is **fetched once, never per session**. Cloud sessions without that computer aren't supported.

## Decisions

- **Data folder:** `~/.grid-guide/`, which `$GRID_GUIDE_HOME` can override. It holds:

  ```
  wordlists/spreadthewordlist.txt
  ATTRIBUTION.md
  nyt-cookie.txt     (optional, written by the user, mode 600)
  nyt/raw/           (optional, cached puzzles)
  nyt/word-data.json (optional)
  ```

- **Names and license:** the plugin is `grid-guide` (its commands are `/grid-guide:…`), listed in a marketplace named `xword-plugin`. The repo is `rickie-ribs/xword-plugin` on GitHub, licensed MIT, and that covers the vendored XWORD_BUILDER code. The wordlist and NYT data are never included in it.
- **Code reuse: vendored and bundled.** `scripts/sync.ts` copies the needed sources from `../XWORD_BUILDER`:
  - `src/model`, `src/engine` (no worker or client files), `src/rules`, `src/io/ipuz.ts` and `src/io/nytJson.ts`
  - `scripts/xwCommands.ts`, `xw.ts` and `nyt-history.ts`

  esbuild then bundles `dist/xw.mjs` and `dist/nyt-history.mjs`. **The `dist/` files are committed**, because a plugin installs by git clone and has no build step for the user. Users need only Node 20 or later.
- **Path changes are kept as small patches over the vendored copies.** `xw.ts` and `nyt-history.ts` take their wordlist, word-data, raw and cookie paths from the data folder instead of the repo. The upstream logic is otherwise untouched, so `sync` stays a plain copy plus patches.
- **`nytHistory.json` is bundled.** It holds only per-puzzle derived metrics, so the difficulty rank works with no NYT download. Familiarity, "Uses" and the candidate ranking need `word-data.json`, which is the optional NYT step.
- **No wordlist or NYT data in this repo, ever.** `.gitignore` covers `data/`, `*.txt` lists and `nyt/`.
- **Hand-off:** publish the template as a private Artifact when the Artifact tool exists. Otherwise, save the HTML file next to the `.ipuz` and give its path.

## Phases

Each phase ends with a check that can be run.

### 0. Scaffold
- Add `README.md`, a code `LICENSE`, `.gitignore`, `package.json` (esbuild, tsx, immer, vitest) and a `CLAUDE.md` for working in this repo.
- **Check:** `npm install` and `npm run build` succeed on an empty bundle entry.

### 1. Vendor and bundle the CLI
- Write `scripts/sync.ts` and the path patches. Add `GRID_GUIDE_HOME` resolution in one small module.
- Bundle both scripts into `dist/`.
- **Check:** with a wordlist in `~/.grid-guide/`, run `node dist/xw.mjs new /tmp/t.ipuz --size 5`, then `fill` and `check`. It produces a filled, error-free grid. Port the relevant `tests/cli/` cases. Re-running `sync` with no upstream change produces no diff.

### 2. Setup: the wordlist
- Write `commands/setup.md` (the `/grid-guide:setup` slash command) and a `dist/setup.mjs` helper with three steps:
  1. Download the list from its official source into `~/.grid-guide/wordlists/`.
  2. Sanity-check it: line count and `WORD;SCORE` format.
  3. Write `ATTRIBUTION.md` and print the credit and license.
- If the download fails, explain where to get the file by hand. Any `WORD;SCORE` list is accepted.
- Add `xw doctor`, which reports what is installed (list, cookie, word data) and what each one enables.
- **Check:** in a fresh `GRID_GUIDE_HOME`, setup leaves a working list, and `doctor` reports it. Running setup again downloads nothing.

### 3. Setup: optional NYT history
- **Warning, shown before anything else:**
  - The step needs the user's own NYT Games (or All Access) subscription.
  - It downloads about 1,100 puzzles (around 190 MB) with automated requests made with their login.
  - NYT's terms likely don't allow that. Their account is at risk, and the choice is theirs.
  - Everything else in the plugin works without this step.
- **Walkthrough, if they choose to go ahead:**
  1. Sign in at nytimes.com in a desktop browser.
  2. Open the developer tools, go to Application (Storage in Firefox), then Cookies, then `https://www.nytimes.com`, and copy the value of `NYT-S`.
  3. Save it yourself with the command the walkthrough shows (writes `~/.grid-guide/nyt-cookie.txt`, mode 600), or export `NYT_S`.
  4. **Never paste the cookie into the chat.** It is a login credential and would stay in the transcript.
  5. Claude checks that the file exists (never its contents), then runs `dist/nyt-history.mjs` in the background.
  6. The download resumes where it left off: already-cached puzzles are skipped.
  7. If NYT rejects the cookie partway through, the script stops and the walkthrough repeats steps 1–3.
- The puzzles stay on the user's machine. This repo never contains them.
- **Check:** with a valid cookie and `--from`/`--to` set to one week, about 7 puzzles land and `word-data.json` is written. With a bad cookie, the walkthrough's refresh message appears.

### 4. Port the skills
- Point `build-puzzle` at `node ${CLAUDE_PLUGIN_ROOT}/dist/xw.mjs` and drop "Confirm it in the app" (there's no app).
- Write puzzles to the user's current folder (`./puzzles/`), not `private/puzzles/`.
- Replace "Before you start" with: run `xw doctor`; if there's no list, run `/grid-guide:setup` first.
- Add the Artifact-or-file fallback and the wordlist credit on the hand-off page.
- `critique-clues` is nearly unchanged; check that `benchmarks.md` travels with it.
- **Check:** in a clean folder with only the plugin installed, "build a 15×15 with SPACESHIP and MOONWALK" produces an `.ipuz`, a passing `check`, and a hand-off page. Critiquing that file returns a review.

### 5. Package and test the install
- Write `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
- **Check:**
  - `/plugin marketplace add /Users/eric.ribbeck/Documents/XWORD_PLUGIN` and `/plugin install` work from an unrelated folder.
  - Setup runs.
  - A build works from the phone over Remote Control.

### 6. Publish
- Create the public GitHub repo and push. **This needs your OK first.**
- Add the install steps and attribution to the README.

## Open questions

| Question | Why it matters |
|---|---|
| What is the wordlist's exact license, and its official download URL? | Sets the attribution text, and whether an automatic download is fine. A web search couldn't confirm either. |
| Does `${CLAUDE_PLUGIN_ROOT}` expand inside skill text, or only in hooks and MCP config? | Decides how the skills find `dist/xw.mjs`. The fallback is a `/grid-guide:` command or a small wrapper script. Verify in phase 4. |
