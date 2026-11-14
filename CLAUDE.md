# CLAUDE.md

`grid-guide` is a public Claude Code plugin: skills that build crossword grids and critique clues, backed by a bundled command-line tool.
## Layout

- `vendor/`: the engine the `xw` and NYT history tools run on (model, fill engine, rules, `.ipuz` I/O and the two scripts).
- `src/`: this plugin's own code. `home.ts` holds the data paths (`~/.grid-guide`, or `$GRID_GUIDE_HOME`). Each other file is an entry point bundled into `dist/`.
- `plugin/`: the plugin itself, the only folder that installs. `plugin/dist/` holds the bundles the skills run with `node "${CLAUDE_PLUGIN_ROOT}/dist/…"`. It is **committed**, because a plugin installs by git clone with no build step, so run `npm run build` and commit it with any change to `src/` or `vendor/`. `plugin/skills/` holds `setup`, `build-puzzle`, `critique-clues` and `submission-pdf`. `plugin/data/removed-words.txt` is derived from the Spread the Word(list) wordlist and is CC BY-NC-SA 4.0, like the list it comes from.
- `.claude-plugin/marketplace.json`: the marketplace, named `xword-plugin`, listing `./plugin`. Check both with `claude plugin validate ./plugin` and `claude plugin validate .`.

## Commands

- `npm run build`: bundle the `src/` entries (`xw`, `nyt`, `setup`, `pdf`) into `plugin/dist/*.mjs`
- `npm test`, `npm run typecheck`

## Rules

- Never commit a wordlist, NYT puzzles or a cookie. They live in each user's `~/.grid-guide/`.
- Never ask for, read or print a user's NYT cookie. Check only that the file exists.
- Hand-off text never mentions list scores.
