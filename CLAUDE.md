# CLAUDE.md

`grid-guide` is a public Claude Code plugin: skills that build crossword grids and critique clues, backed by a bundled command-line tool. `PLAN.md` is the plan and the record of decisions.

## Layout

- `vendor/`: a copy of code from the private sibling repo `../XWORD_BUILDER` (model, engine, rules, `.ipuz` I/O and the `xw` and NYT history scripts). **Never edit it by hand.** `npm run sync` recopies it and applies the patches in `scripts/sync.ts`; a patch that no longer matches stops the sync. Fix logic upstream, then sync.
- `src/`: this plugin's own code. `home.ts` holds the data paths (`~/.grid-guide`, or `$GRID_GUIDE_HOME`). Each other file is an entry point bundled into `dist/`.
- `plugin/`: the plugin itself, the only folder that installs. `plugin/dist/` holds the bundles the skills run with `node "${CLAUDE_PLUGIN_ROOT}/dist/…"`. It is **committed**, because a plugin installs by git clone with no build step, so run `npm run build` and commit it with any change to `src/` or `vendor/`. `plugin/skills/` holds `setup`, `build-puzzle` and `critique-clues`. `plugin/data/removed-words.txt` is written by `sync` and is CC BY-NC-SA 4.0, like the list it comes from.
- `.claude-plugin/marketplace.json`: the marketplace, named `xword-plugin`, listing `./plugin`. Check both with `claude plugin validate ./plugin` and `claude plugin validate .`.

## Commands

- `npm run sync`: recopy `vendor/` from `../XWORD_BUILDER`
- `npm run build`: bundle the `src/` entries (`xw`, `nyt`, `setup`) into `plugin/dist/*.mjs`
- `npm test`, `npm run typecheck`

## Rules

- Never commit a wordlist, NYT puzzles or a cookie. They live in each user's `~/.grid-guide/`.
- Never ask for, read or print a user's NYT cookie. Check only that the file exists.
- Hand-off text never mentions list scores.
