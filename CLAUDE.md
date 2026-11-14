# CLAUDE.md

`grid-guide` is a public Claude Code plugin: skills that build crossword grids and critique clues, backed by a bundled command-line tool. `PLAN.md` is the plan and the record of decisions.

## Layout

- `vendor/`: a copy of code from the private sibling repo `../XWORD_BUILDER` (model, engine, rules, `.ipuz` I/O and the `xw` and NYT history scripts). **Never edit it by hand.** `npm run sync` recopies it and applies the patches in `scripts/sync.ts`; a patch that no longer matches stops the sync. Fix logic upstream, then sync.
- `src/`: this plugin's own code. `home.ts` holds the data paths (`~/.grid-guide`, or `$GRID_GUIDE_HOME`). Each other file is an entry point bundled into `dist/`.
- `dist/`: the bundles the skills run with `node`. **Committed**, because a plugin installs by git clone with no build step. Run `npm run build` and commit `dist/` with any change to `src/` or `vendor/`.
- `skills/`, `commands/`, `.claude-plugin/`: the plugin itself.

## Commands

- `npm run sync`: recopy `vendor/` from `../XWORD_BUILDER`
- `npm run build`: bundle `src/*.ts` entries into `dist/*.mjs`
- `npm test`, `npm run typecheck`

## Rules

- Never commit a wordlist, NYT puzzles or a cookie. They live in each user's `~/.grid-guide/`.
- Never ask for, read or print a user's NYT cookie. Check only that the file exists.
- Hand-off text never mentions list scores.
