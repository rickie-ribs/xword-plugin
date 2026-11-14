---
name: submission-pdf
description: "Make a submission-ready PDF of a finished, clued crossword from an .ipuz file: the contact block and filled grid on page 1, then Across and Down clues with answers. Use when the user asks for a PDF, a printable copy, or a file to submit to a publication."
---

# Make a submission PDF

The PDF follows the common submission layout (the New York Times' sample): page 1 has the constructor's contact block at the top left and the filled grid; the following pages list Across, then Down, each clue with its answer in a second column. Circled squares are drawn, shaded squares print grey, and rebus squares print their whole string.

The tool is `node "${CLAUDE_PLUGIN_ROOT}/dist/pdf.mjs" FILE.ipuz [--surname NAME] [--out DIR]`. It writes the PDF next to the `.ipuz` file unless `--out` says otherwise, and needs no wordlist.

## 1. Find the file

Use the `.ipuz` the user names. It can come from anywhere, such as a puzzle built with `build-puzzle` or one exported from Crosshare (More → Download .ipuz File) or another crossword app after clueing. If they don't name one, list the `.ipuz` files in `puzzles/` and ask which.

## 2. The contact block

Publications want the constructor's name, address and email at the top of page 1. The tool reads it from `~/.grid-guide/contact.txt` (or `$GRID_GUIDE_HOME/contact.txt`), one line each.

- If the file exists, show the user its lines and ask whether they're still right.
- If it doesn't, ask what to put there. Only write what the user types for this purpose, and tell them it's saved on this computer for later PDFs. They may leave it out; the PDF then has no contact block.

Also ask for a surname to start the file name (`--surname Smith` gives `Smith_<puzzle name>.pdf`), as many publications ask for. Without one the file is `<puzzle name>.pdf`.

## 3. Make it and report

Run the tool. It prints the file it wrote, the contact block it used, how many squares are empty, and which entries have no clue.

- Empty squares print blank and a missing clue prints just its number, so the PDF isn't ready to submit until both are zero. Say so plainly and list the entries without clues. Offer to run `critique-clues` first if the clues haven't been reviewed.
- Give the PDF's full path. If the SendUserFile tool is available, send the PDF so it reaches the user's phone too.
