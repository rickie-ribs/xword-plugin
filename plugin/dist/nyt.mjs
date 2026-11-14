var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/home.ts
import { homedir } from "node:os";
import { join } from "node:path";
var GRID_GUIDE_HOME, WORDLIST, NYT_DIR, COOKIE, WORD_DATA;
var init_home = __esm({
  "src/home.ts"() {
    "use strict";
    GRID_GUIDE_HOME = process.env.GRID_GUIDE_HOME ?? join(homedir(), ".grid-guide");
    WORDLIST = join(GRID_GUIDE_HOME, "wordlists", "spreadthewordlist.txt");
    NYT_DIR = join(GRID_GUIDE_HOME, "nyt");
    COOKIE = join(NYT_DIR, "cookie.txt");
    WORD_DATA = join(NYT_DIR, "word-data.json");
  }
});

// vendor/src/model/numbering.ts
function computeNumbering(puzzle) {
  const isWhite2 = (r, c) => r >= 0 && r < puzzle.rows && c >= 0 && c < puzzle.cols && !puzzle.cells[r][c].block;
  const numbers = [];
  const slots = [];
  let next = 1;
  for (let r = 0; r < puzzle.rows; r++) {
    const row = [];
    for (let c = 0; c < puzzle.cols; c++) {
      let number = null;
      for (const direction of ["across", "down"]) {
        const [dr, dc] = STEP[direction];
        if (!isWhite2(r, c) || isWhite2(r - dr, c - dc) || !isWhite2(r + dr, c + dc)) continue;
        number ??= next++;
        const cells = [];
        for (let rr = r, cc = c; isWhite2(rr, cc); rr += dr, cc += dc) cells.push([rr, cc]);
        slots.push({ number, direction, row: r, col: c, length: cells.length, cells });
      }
      row.push(number);
    }
    numbers.push(row);
  }
  return { numbers, slots };
}
var STEP;
var init_numbering = __esm({
  "vendor/src/model/numbering.ts"() {
    "use strict";
    STEP = { across: [0, 1], down: [1, 0] };
  }
});

// vendor/src/model/entries.ts
function slotPattern(puzzle, slot) {
  return slot.cells.map(([r, c]) => puzzle.cells[r][c].value || "?").join("");
}
var init_entries = __esm({
  "vendor/src/model/entries.ts"() {
    "use strict";
    init_numbering();
  }
});

// vendor/src/model/clues.ts
var init_clues = __esm({
  "vendor/src/model/clues.ts"() {
    "use strict";
    init_entries();
    init_numbering();
  }
});

// vendor/src/model/symmetry.ts
function isSymmetryAvailable(mode, rows, cols) {
  return mode !== "diagonal" || rows === cols;
}
function partnerOf(r, c, rows, cols, mode) {
  switch (mode) {
    case "rotational":
      return [rows - 1 - r, cols - 1 - c];
    case "mirror-lr":
      return [r, cols - 1 - c];
    case "mirror-tb":
      return [rows - 1 - r, c];
    case "diagonal":
      return [c, r];
    case "none":
      return [r, c];
  }
}
function eachPair(puzzle, mode, fn) {
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const [pr, pc] = partnerOf(r, c, puzzle.rows, puzzle.cols, mode);
      if (r * puzzle.cols + c < pr * puzzle.cols + pc) fn([r, c], [pr, pc]);
    }
  }
}
function findAsymmetric(puzzle, mode) {
  const broken = [];
  eachPair(puzzle, mode, ([r, c], [pr, pc]) => {
    if (puzzle.cells[r][c].block !== puzzle.cells[pr][pc].block) broken.push([r, c], [pr, pc]);
  });
  return broken;
}
var SYMMETRY_MODES, SYMMETRY_LABELS;
var init_symmetry = __esm({
  "vendor/src/model/symmetry.ts"() {
    "use strict";
    SYMMETRY_MODES = ["rotational", "mirror-lr", "mirror-tb", "diagonal", "none"];
    SYMMETRY_LABELS = {
      rotational: "Rotational (180\xB0)",
      "mirror-lr": "Mirror left\u2013right",
      "mirror-tb": "Mirror top\u2013bottom",
      diagonal: "Diagonal",
      none: "None"
    };
  }
});

// vendor/src/model/grid.ts
function checkSize(n) {
  if (!Number.isInteger(n) || n < MIN_SIZE || n > MAX_SIZE) {
    throw new RangeError(`Grid size must be a whole number from ${MIN_SIZE} to ${MAX_SIZE}, got ${n}`);
  }
}
function blankCell() {
  return { block: false, value: "", circled: false, shaded: false };
}
function fitSymmetry(symmetry, rows, cols) {
  return isSymmetryAvailable(symmetry, rows, cols) ? symmetry : "rotational";
}
function createPuzzle(rows, cols, symmetry = "rotational", type = "themed") {
  checkSize(rows);
  checkSize(cols);
  return {
    rows,
    cols,
    symmetry: fitSymmetry(symmetry, rows, cols),
    type,
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, blankCell)),
    clues: []
  };
}
var MIN_SIZE, MAX_SIZE;
var init_grid = __esm({
  "vendor/src/model/grid.ts"() {
    "use strict";
    init_symmetry();
    MIN_SIZE = 3;
    MAX_SIZE = 25;
  }
});

// vendor/src/io/ipuz.ts
function detectSymmetry(puzzle) {
  return SYMMETRY_MODES.find(
    (mode) => mode !== "none" && isSymmetryAvailable(mode, puzzle.rows, puzzle.cols) && findAsymmetric(puzzle, mode).length === 0
  ) ?? "none";
}
var ImportError;
var init_ipuz = __esm({
  "vendor/src/io/ipuz.ts"() {
    "use strict";
    init_clues();
    init_grid();
    init_numbering();
    init_symmetry();
    ImportError = class extends Error {
    };
  }
});

// vendor/src/io/nytJson.ts
function readBody(data) {
  const body = isObject(data) && Array.isArray(data.body) ? data.body[0] : void 0;
  if (!isObject(body) || !isObject(body.dimensions) || !Array.isArray(body.cells) || !body.cells.every(isObject)) {
    throw new ImportError("Not an NYT puzzle: no grid dimensions or squares.");
  }
  const [width, height] = [Number(body.dimensions.width), Number(body.dimensions.height)];
  const ok = (n) => Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
  if (!ok(width) || !ok(height)) {
    throw new ImportError(`Grids must be ${MIN_SIZE}\u2013${MAX_SIZE} squares on each side; this one is ${width}\xD7${height}.`);
  }
  if (body.cells.length !== width * height) {
    throw new ImportError(`${body.cells.length} squares don\u2019t fill the stated ${width}\xD7${height} grid.`);
  }
  const clues = Array.isArray(body.clues) ? body.clues.filter(isObject) : [];
  return { width, height, cells: body.cells, clues };
}
function fromNytPuzzle(data) {
  const { width, height, cells } = readBody(data);
  const puzzle = createPuzzle(height, width);
  cells.forEach((raw, i) => {
    const cell = puzzle.cells[Math.floor(i / width)][i % width];
    if (raw.type === void 0) {
      cell.block = true;
      return;
    }
    if (raw.type !== 1 && raw.type !== 2 && raw.type !== 3) {
      throw new ImportError(`Square ${i} has unsupported type ${String(raw.type)}.`);
    }
    cell.circled = raw.type === 2;
    cell.shaded = raw.type === 3;
    if (typeof raw.answer === "string") cell.value = raw.answer.toUpperCase();
  });
  puzzle.symmetry = detectSymmetry(puzzle);
  return puzzle;
}
function numberingMismatch(data, puzzle) {
  const { width, cells, clues } = readBody(data);
  const { numbers, slots } = computeNumbering(puzzle);
  for (let i = 0; i < cells.length; i++) {
    const theirs2 = typeof cells[i].label === "string" ? cells[i].label : null;
    const ours2 = numbers[Math.floor(i / width)][i % width] ?? null;
    if (theirs2 !== (ours2 === null ? null : String(ours2))) {
      return `Square ${i}: NYT numbers it ${theirs2 ?? "none"}, we number it ${ours2 ?? "none"}.`;
    }
  }
  const entry = (direction, squares) => `${String(direction).toLowerCase()} ${Array.isArray(squares) ? squares.join(",") : "?"}`;
  const theirs = new Set(clues.map((c) => entry(c.direction, c.cells)));
  const ours = new Set(slots.map((s) => entry(s.direction, s.cells.map(([r, c]) => r * width + c))));
  const onlyTheirs = [...theirs].find((e) => !ours.has(e));
  if (onlyTheirs) return `NYT has the entry ${onlyTheirs}, which we don\u2019t.`;
  const onlyOurs = [...ours].find((e) => !theirs.has(e));
  if (onlyOurs) return `We have the entry ${onlyOurs}, which NYT doesn\u2019t.`;
  return null;
}
var isObject;
var init_nytJson = __esm({
  "vendor/src/io/nytJson.ts"() {
    "use strict";
    init_grid();
    init_numbering();
    init_ipuz();
    isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
  }
});

// vendor/src/rules/stats.ts
function wordCountGuideline(p) {
  if (p.rows === 21 && p.cols === 21) return { label: "NYT max", max: 140, estimated: false };
  if (p.rows === 15 && p.cols === 15) return { label: "NYT max", max: 78, estimated: false };
  const cells = p.rows * p.cols;
  if (cells < MIN_CELLS_FOR_ESTIMATE) return null;
  return { label: "NYT max", max: Math.round(78 * cells / 225), estimated: true };
}
function computeStats(p, slots) {
  const cells = p.cells.flat();
  const blocks = cells.filter((cell) => cell.block).length;
  let openSquares = 0;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (p.cells[r][c].block) continue;
      let open = true;
      for (let dr = -1; dr <= 1 && open; dr++) {
        for (let dc = -1; dc <= 1 && open; dc++) open = !p.cells[r + dr]?.[c + dc]?.block;
      }
      if (open) openSquares++;
    }
  }
  const lengths = Array.from({ length: Math.max(p.rows, p.cols) - 2 }, (_, i) => ({
    length: i + 3,
    count: slots.filter((s) => s.length === i + 3).length
  }));
  return {
    words: slots.length,
    guideline: wordCountGuideline(p),
    blocks,
    blockShare: blocks / cells.length,
    openSquares,
    lengths
  };
}
var MIN_CELLS_FOR_ESTIMATE;
var init_stats = __esm({
  "vendor/src/rules/stats.ts"() {
    "use strict";
    MIN_CELLS_FOR_ESTIMATE = 121;
  }
});

// vendor/src/rules/difficulty.ts
function patternMetrics(puzzle, slots) {
  const { words, blocks, openSquares } = computeStats(puzzle, slots);
  const long = slots.filter((s) => s.length >= LONG_ENTRY).length;
  return { words, blocks, openSquares, longShare: words ? long / words : 0 };
}
function familiarityTier(uses) {
  return FAMILIARITY_TIERS.findLastIndex((tier) => uses >= tier.minUses);
}
function tierRange(tier) {
  const min = FAMILIARITY_TIERS[tier].minUses;
  const next = FAMILIARITY_TIERS[tier + 1]?.minUses;
  if (next === void 0) return `${min}+`;
  return next - 1 === min ? `${min}` : `${min}\u2013${next - 1}`;
}
function completeEntries(puzzle, slots) {
  return slots.map((slot) => slotPattern(puzzle, slot)).filter((letters) => /^[A-Z]+$/.test(letters));
}
function usesInOtherPuzzles(counts) {
  return (answer) => (counts.get(answer) ?? 1) - 1;
}
function familiarity(entries, usesOf) {
  if (!entries.length) return null;
  const tiers = entries.map((answer) => familiarityTier(usesOf(answer)));
  return {
    score: tiers.reduce((sum, t) => sum + t, 0) / tiers.length,
    tierShares: FAMILIARITY_TIERS.map((_, t) => tiers.filter((x) => x === t).length / tiers.length)
  };
}
var METRICS_VERSION, LONG_ENTRY, FAMILIARITY_TIERS;
var init_difficulty = __esm({
  "vendor/src/rules/difficulty.ts"() {
    "use strict";
    init_entries();
    init_stats();
    METRICS_VERSION = 2;
    LONG_ENTRY = 8;
    FAMILIARITY_TIERS = [
      { name: "fresh", minUses: 0 },
      { name: "seen", minUses: 1 },
      { name: "common", minUses: 10 },
      { name: "very common", minUses: 40 }
    ];
  }
});

// vendor/src/rules/validate.ts
function runFrom(p, r, c, dr, dc) {
  let n = 0;
  while (isWhite(p, r + dr * (n + 1), c + dc * (n + 1))) n++;
  return n;
}
function shortEntries(slots) {
  return slots.filter((s) => s.length < 3).sort(acrossFirst).map((s) => ({ rule: "V1", tier: "error", message: `${s.length}-letter entry: ${slotName(s)}`, cells: s.cells }));
}
function uncheckedSquares(p) {
  const cells = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (isBlock(p, r, c)) continue;
      const across = runFrom(p, r, c, 0, -1) + runFrom(p, r, c, 0, 1);
      const down = runFrom(p, r, c, -1, 0) + runFrom(p, r, c, 1, 0);
      if (across === 0 || down === 0) cells.push([r, c]);
    }
  }
  if (cells.length === 0) return [];
  const message = `${cells.length} unchecked square${cells.length === 1 ? "" : "s"}`;
  return [{ rule: "V2", tier: "error", message, cells }];
}
function regions(p, include) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (!include(r, c) || seen.has(r * p.cols + c)) continue;
      const region = [];
      const stack = [[r, c]];
      seen.add(r * p.cols + c);
      while (stack.length) {
        const [cr, cc] = stack.pop();
        region.push([cr, cc]);
        for (const [dr, dc] of NEIGHBORS) {
          const [nr, nc] = [cr + dr, cc + dc];
          if (inGrid(p, nr, nc) && include(nr, nc) && !seen.has(nr * p.cols + nc)) {
            seen.add(nr * p.cols + nc);
            stack.push([nr, nc]);
          }
        }
      }
      out.push(region);
    }
  }
  return out;
}
function isolatedRegions(p) {
  const found = regions(p, (r, c) => !isBlock(p, r, c));
  const largest = found.reduce((best, region) => region.length > best.length ? region : best, []);
  return found.filter((region) => region !== largest).map((region) => ({
    rule: "V3",
    tier: "error",
    message: `Isolated region of ${region.length} square${region.length === 1 ? "" : "s"}`,
    cells: region
  }));
}
function symmetryBreaks(p) {
  const cells = findAsymmetric(p, p.symmetry);
  if (cells.length === 0) return [];
  const message = `${cells.length} squares break ${SYMMETRY_LABELS[p.symmetry]} symmetry`;
  return [{ rule: "V4", tier: "error", message, cells }];
}
function blockShare(p) {
  const blocks = p.cells.flat().filter((cell) => cell.block).length;
  const share = blocks / (p.rows * p.cols);
  if (share <= MAX_BLOCK_SHARE) return [];
  const message = `Blocks are ${Math.round(share * 100)}% of the grid (${blocks})`;
  return [{ rule: "V6", tier: "warning", message, cells: [] }];
}
function blockClumps(p) {
  const inClump = /* @__PURE__ */ new Set();
  for (let r = 0; r + 2 < p.rows; r++) {
    for (let c = 0; c + 2 < p.cols; c++) {
      let solid = true;
      for (let i = 0; i < 3 && solid; i++) for (let j = 0; j < 3 && solid; j++) solid = isBlock(p, r + i, c + j);
      if (!solid) continue;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) inClump.add((r + i) * p.cols + c + j);
    }
  }
  return regions(p, (r, c) => inClump.has(r * p.cols + c)).map((cells) => ({
    rule: "V7",
    tier: "warning",
    message: `Block clump of ${cells.length} squares`,
    cells
  }));
}
function cheaterSquares(p) {
  const delta = (a, b) => Number(a + b + 1 >= 2) - Number(a >= 2) - Number(b >= 2);
  const cheaters = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (!isBlock(p, r, c)) continue;
      const [left, right] = [runFrom(p, r, c, 0, -1), runFrom(p, r, c, 0, 1)];
      const [up, down] = [runFrom(p, r, c, -1, 0), runFrom(p, r, c, 1, 0)];
      if (left + right + 1 < 3 || up + down + 1 < 3) continue;
      if (delta(left, right) + delta(up, down) === 0) cheaters.push([r, c]);
    }
  }
  return cheaters;
}
function cheaterIssues(p) {
  const cells = cheaterSquares(p);
  if (cells.length === 0) return [];
  const message = `${cells.length} cheater square${cells.length === 1 ? "" : "s"}`;
  return [{ rule: "V8", tier: "info", message, cells }];
}
function chokePoints(p) {
  const id = (r, c) => r * p.cols + c;
  const whiteNeighbors = (u) => {
    const [r, c] = [Math.floor(u / p.cols), u % p.cols];
    return NEIGHBORS.filter(([dr, dc]) => isWhite(p, r + dr, c + dc)).map(([dr, dc]) => id(r + dr, c + dc));
  };
  const disc = new Array(p.rows * p.cols).fill(-1);
  const low = new Array(p.rows * p.cols).fill(0);
  const cuts = /* @__PURE__ */ new Set();
  let time = 0;
  const dfs = (u, parent) => {
    disc[u] = low[u] = time++;
    let children = 0;
    for (const v of whiteNeighbors(u)) {
      if (disc[v] === -1) {
        children++;
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (parent !== -1 && low[v] >= disc[u]) cuts.add(u);
      } else if (v !== parent) {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
    if (parent === -1 && children > 1) cuts.add(u);
  };
  for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) if (isWhite(p, r, c) && disc[id(r, c)] === -1) dfs(id(r, c), -1);
  const unchecked = new Set(uncheckedSquares(p).flatMap((issue) => issue.cells.map(([r, c]) => id(r, c))));
  return [...cuts].filter((u) => !unchecked.has(u) && !whiteNeighbors(u).some((v) => cuts.has(v))).sort((a, b) => a - b).map((u) => {
    const seen = /* @__PURE__ */ new Set([u]);
    const sizes = whiteNeighbors(u).flatMap((start) => {
      if (seen.has(start)) return [];
      let size = 0;
      const stack = [start];
      seen.add(start);
      while (stack.length) {
        size++;
        for (const v of whiteNeighbors(stack.pop())) if (!seen.has(v)) seen.add(v), stack.push(v);
      }
      return [size];
    });
    const cutOff = sizes.reduce((a, b) => a + b, 0) - Math.max(...sizes);
    return {
      rule: "V9",
      tier: "warning",
      message: `${cutOff} squares connect to the rest of the grid only through this square`,
      cells: [[Math.floor(u / p.cols), u % p.cols]]
    };
  });
}
function duplicateEntries(slots, p) {
  const byWord = /* @__PURE__ */ new Map();
  for (const slot of slots) {
    const values = slot.cells.map(([r, c]) => p.cells[r][c].value);
    if (values.some((v) => v === "")) continue;
    const word = values.join("");
    byWord.set(word, [...byWord.get(word) ?? [], slot]);
  }
  return [...byWord].filter(([, found]) => found.length > 1).map(([word, found]) => ({
    rule: "V10",
    tier: "error",
    message: `${word} appears ${found.length} times (${[...found].sort(acrossFirst).map(slotName).join(", ")})`,
    cells: found.flatMap((s) => s.cells)
  }));
}
function pluralsOf(word) {
  if (/[^AEIOU]Y$/.test(word)) return [`${word.slice(0, -1)}IES`];
  if (/O$/.test(word)) return [`${word}S`, `${word}ES`];
  if (/(S|X|Z|CH|SH)$/.test(word)) return [`${word}ES`];
  return [`${word}S`];
}
function pluralEntries(slots, p) {
  const byWord = /* @__PURE__ */ new Map();
  for (const slot of slots) {
    const word = slotPattern(p, slot);
    if (!word.includes("?")) byWord.set(word, [...byWord.get(word) ?? [], slot]);
  }
  return [...byWord].flatMap(
    ([word, found]) => pluralsOf(word).flatMap((plural) => {
      const plurals = byWord.get(plural);
      if (!plurals) return [];
      const both = [...found, ...plurals];
      return [
        {
          rule: "V18",
          tier: "warning",
          message: `${word} and ${plural} look like the same word (${[...both].sort(acrossFirst).map(slotName).join(", ")})`,
          cells: both.flatMap((s) => s.cells)
        }
      ];
    })
  );
}
function rebusIssues(p) {
  const cells = [];
  const strings = /* @__PURE__ */ new Set();
  p.cells.forEach(
    (row, r) => row.forEach((cell, c) => {
      if (cell.block || cell.value.length < 2) return;
      cells.push([r, c]);
      strings.add(cell.value);
    })
  );
  if (strings.size < 2) return [];
  return [{ rule: "V12", tier: "info", message: `Rebus squares differ: ${[...strings].join(", ")}`, cells }];
}
function validate(p) {
  const { slots } = computeNumbering(p);
  return [
    ...shortEntries(slots),
    ...uncheckedSquares(p),
    ...isolatedRegions(p),
    ...symmetryBreaks(p),
    ...duplicateEntries(slots, p),
    ...pluralEntries(slots, p),
    ...blockShare(p),
    ...blockClumps(p),
    ...chokePoints(p),
    ...cheaterIssues(p),
    ...rebusIssues(p)
  ].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}
var NEIGHBORS, isBlock, inGrid, isWhite, slotName, acrossFirst, MAX_BLOCK_SHARE, TIER_ORDER;
var init_validate = __esm({
  "vendor/src/rules/validate.ts"() {
    "use strict";
    init_entries();
    init_numbering();
    init_symmetry();
    NEIGHBORS = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];
    isBlock = (p, r, c) => p.cells[r][c].block;
    inGrid = (p, r, c) => r >= 0 && r < p.rows && c >= 0 && c < p.cols;
    isWhite = (p, r, c) => inGrid(p, r, c) && !isBlock(p, r, c);
    slotName = (s) => `${s.number} ${s.direction === "across" ? "Across" : "Down"}`;
    acrossFirst = (a, b) => a.direction === b.direction ? a.number - b.number : a.direction === "across" ? -1 : 1;
    MAX_BLOCK_SHARE = 1 / 6;
    TIER_ORDER = { error: 0, warning: 1, info: 2 };
  }
});

// vendor/scripts/nyt-history.ts
var nyt_history_exports = {};
__export(nyt_history_exports, {
  loadCached: () => loadCached,
  recentWindow: () => recentWindow
});
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
function readCookie() {
  const raw = (process.env.NYT_S ?? readFileSync(args.cookie ?? COOKIE, "utf8")).trim();
  return raw.startsWith("NYT-S=") ? raw : `NYT-S=${raw}`;
}
async function getJson(url, cookie) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { accept: "application/json", cookie } });
    if (response.ok) return response.json();
    if (response.status === 401 || response.status === 403) {
      throw new Error(`NYT refused the cookie (${response.status}): refresh ${PRIVATE}/cookie.txt`);
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await sleep(2e3 * 2 ** attempt);
      continue;
    }
    throw new Error(`${response.status} from ${url}`);
  }
}
async function listPuzzles(from, to, cookie) {
  const listed = [];
  for (let start = from; start <= to; ) {
    const next = isoDate(new Date(Date.UTC(+start.slice(0, 4), +start.slice(5, 7), 1)));
    const end = addDays(next, -1) < to ? addDays(next, -1) : to;
    const query = `publish_type=daily&sort_by=print_date&sort_order=asc&date_start=${start}&date_end=${end}`;
    const data = await getJson(`${API}/v3/puzzles.json?${query}`, cookie);
    listed.push(...data.results ?? []);
    start = next;
    await sleep(DELAY_MS);
  }
  return listed.filter((p) => p.format_type === "Normal");
}
async function fetchMissing(from, to) {
  const cookie = readCookie();
  mkdirSync(RAW, { recursive: true });
  const listed = await listPuzzles(from, to, cookie);
  const missing = listed.filter((p) => !existsSync(`${RAW}/${p.puzzle_id}.json`));
  console.log(`Listed ${listed.length} puzzles from ${from} to ${to}; fetching ${missing.length} new.`);
  for (const [i, p] of missing.entries()) {
    const data = await getJson(`${API}/v6/puzzle/${p.puzzle_id}.json`, cookie);
    writeFileSync(`${RAW}/${p.puzzle_id}.json`, JSON.stringify(data));
    if ((i + 1) % 25 === 0 || i + 1 === missing.length) console.log(`  ${i + 1}/${missing.length} (${p.print_date})`);
    await sleep(DELAY_MS);
  }
}
function loadCached() {
  const kept = [];
  const excluded = [];
  for (const file of existsSync(RAW) ? readdirSync(RAW).filter((f) => f.endsWith(".json")) : []) {
    const data = JSON.parse(readFileSync(`${RAW}/${file}`, "utf8"));
    const label = `${data.publicationDate} (${data.id})`;
    try {
      const puzzle = fromNytPuzzle(data);
      const mismatch = numberingMismatch(data, puzzle);
      const errors = validate(puzzle).filter((issue) => issue.tier === "error");
      if (mismatch || errors.length) {
        excluded.push(`${label}: ${mismatch ?? errors.map((issue) => issue.message).join("; ")}`);
        continue;
      }
      const { slots } = computeNumbering(puzzle);
      const answers = completeEntries(puzzle, slots);
      kept.push({ id: data.id, date: data.publicationDate, puzzle, slots, answers });
    } catch (error) {
      if (!(error instanceof ImportError)) throw error;
      excluded.push(`${label}: ${error.message}`);
    }
  }
  return { kept: kept.sort((a, b) => a.date.localeCompare(b.date)), excluded: excluded.sort() };
}
function recentWindow(kept) {
  const latest = kept.at(-1)?.date ?? "";
  return kept.filter((k) => k.date > addDays(latest, -WINDOW_DAYS));
}
function countAnswers(window) {
  const counts = /* @__PURE__ */ new Map();
  for (const k of window) {
    for (const answer of new Set(k.answers)) {
      const seen = counts.get(answer);
      counts.set(answer, { count: (seen?.count ?? 0) + 1, last: k.date });
    }
  }
  return [...counts].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
}
function history(window, answers) {
  const uses = usesInOtherPuzzles(new Map(answers.map(([a, s]) => [a, s.count])));
  return {
    metricsVersion: METRICS_VERSION,
    from: window[0]?.date ?? "",
    to: window.at(-1)?.date ?? "",
    puzzles: window.map((k) => {
      const pattern = patternMetrics(k.puzzle, k.slots);
      const score = familiarity(k.answers, uses)?.score;
      return {
        id: k.id,
        date: k.date,
        rows: k.puzzle.rows,
        cols: k.puzzle.cols,
        ...pattern,
        longShare: round(pattern.longShare),
        familiarity: score === void 0 ? null : round(score)
      };
    })
  };
}
function historyJson(h) {
  const { puzzles, ...head } = h;
  const rows = puzzles.map((p) => `    ${JSON.stringify(p)}`).join(",\n");
  return `${JSON.stringify(head).slice(0, -1)},
  "puzzles": [
${rows}
  ]
}
`;
}
function spearman(xs, ys) {
  const rank = (v) => {
    const order = v.map((x, i) => [x, i]).sort((a2, b2) => a2[0] - b2[0]);
    const ranks = new Array(v.length);
    for (let i = 0; i < order.length; ) {
      let j = i;
      while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
      for (let t = i; t <= j; t++) ranks[order[t][1]] = (i + j) / 2;
      i = j + 1;
    }
    return ranks;
  };
  const [a, b] = [rank(xs), rank(ys)];
  const mid = (a.length - 1) / 2;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - mid) * (b[i] - mid);
    da += (a[i] - mid) ** 2;
    db += (b[i] - mid) ** 2;
  }
  return num / Math.sqrt(da * db);
}
function historySummary(h) {
  const value = (p, key) => p[key] ?? 0;
  const lines = [`
Medians by day:  ${METRIC_KEYS.join("  ")}`];
  for (const day of [1, 2, 3, 4, 5, 6, 0]) {
    const size = day === 0 ? 21 : 15;
    const ps = h.puzzles.filter((p) => dayOf(p.date) === day && p.rows === size && p.cols === size);
    lines.push(`  ${DAYS[day]} (${ps.length}):  ${METRIC_KEYS.map((k) => +median(ps.map((p) => value(p, k))).toFixed(3)).join("  ")}`);
  }
  const daily = h.puzzles.filter((p) => dayOf(p.date) !== 0 && p.rows === 15 && p.cols === 15);
  const column = (k) => daily.map((p) => value(p, k));
  lines.push(`Spearman \u03C1 vs day (Mon\u2013Sat 15\xD715): ${METRIC_KEYS.map((k) => `${k} ${spearman(column(k), daily.map((p) => dayOf(p.date))).toFixed(2)}`).join(", ")}`);
  lines.push("Spearman \u03C1 between metrics:");
  for (const a of METRIC_KEYS) lines.push(`  ${a.padEnd(12)} ${METRIC_KEYS.map((b) => spearman(column(a), column(b)).toFixed(2).padStart(6)).join("")}`);
  return lines.join("\n");
}
function wordData(window, answers) {
  const uses = usesInOtherPuzzles(new Map(answers.map(([a, s]) => [a, s.count])));
  const all = familiarity(window.flatMap((k) => k.answers), uses);
  return {
    from: window[0]?.date ?? "",
    to: window.at(-1)?.date ?? "",
    puzzles: window.length,
    entryShares: all?.tierShares ?? FAMILIARITY_TIERS.map(() => 0),
    byDay: [1, 2, 3, 4, 5, 6, 0].map((day) => {
      const size = day === 0 ? 21 : 15;
      const ks = window.filter((k) => dayOf(k.date) === day && k.puzzle.rows === size && k.puzzle.cols === size);
      const scored = ks.map((k) => familiarity(k.answers, uses));
      return {
        day: DAYS[day],
        size,
        puzzles: ks.length,
        shares: FAMILIARITY_TIERS.map((_, t) => scored.reduce((s, f) => s + f.tierShares[t], 0) / (ks.length || 1)),
        medianScore: median(scored.map((f) => f.score))
      };
    }),
    answers: answers.map(([a, s]) => [a, s.count, s.last])
  };
}
function familiarityReport(data) {
  const lines = [
    "# Answer familiarity (D6)",
    "",
    `${data.puzzles} NYT puzzles from ${data.from} to ${data.to}; ${data.answers.length} distinct answers.`,
    "Generated by `npm run history:update`. Local only: the answers come from copyrighted puzzles.",
    "",
    "## Tiers",
    "",
    "| Tier | Points | Puzzles that used it | Answers in this tier for a new puzzle | Share of NYT entries |",
    "|---|---|---|---|---|",
    ...FAMILIARITY_TIERS.map((tier, t) => {
      const distinct = t === 0 ? "\u2014 (not in the list)" : data.answers.filter(([, uses]) => familiarityTier(uses) === t).length;
      return `| ${tier.name} | ${t} | ${tierRange(t)} | ${distinct} | ${percent(data.entryShares[t])} |`;
    }),
    "",
    "## By day",
    "",
    "Share of each puzzle\u2019s entries in each tier (averaged), and the median familiarity score: mean points per entry,",
    "lower is harder. 15\xD715 for Monday to Saturday, 21\xD721 for Sunday.",
    "",
    `| Day | Puzzles | ${FAMILIARITY_TIERS.map((t) => t.name).join(" | ")} | Median score |`,
    `|---|---|${FAMILIARITY_TIERS.map(() => "---|").join("")}---|`,
    ...data.byDay.map((d) => `| ${d.day} | ${d.puzzles} | ${d.shares.map(percent).join(" | ")} | ${d.medianScore.toFixed(2)} |`),
    "",
    "## Most used answers",
    "",
    data.answers.slice(0, 60).map(([a, uses]) => `${a} ${uses}`).join(" \xB7 "),
    ""
  ];
  return lines.join("\n");
}
async function main() {
  const to = args.to ?? isoDate(/* @__PURE__ */ new Date());
  const from = args.from ?? addDays(to, -WINDOW_DAYS);
  if (!args.offline) await fetchMissing(from, to);
  const { kept, excluded } = loadCached();
  const window = recentWindow(kept);
  const answers = countAnswers(window);
  const data = wordData(window, answers);
  mkdirSync(DIR, { recursive: true });
  writeFileSync(`${DIR}/word-data.json`, JSON.stringify(data));
  writeFileSync(
    `${DIR}/answers.csv`,
    [
      "answer,count,tier,last_seen",
      ...answers.map(([a, s]) => `${a},${s.count},${FAMILIARITY_TIERS[familiarityTier(s.count)].name},${s.last}`)
    ].join("\n")
  );
  writeFileSync(`${DIR}/familiarity.md`, familiarityReport(data));
  const nytHistory = history(window, answers);
  writeFileSync(HISTORY_FILE, historyJson(nytHistory));
  const sizes = /* @__PURE__ */ new Map();
  for (const k of window) sizes.set(`${k.puzzle.rows}\xD7${k.puzzle.cols}`, (sizes.get(`${k.puzzle.rows}\xD7${k.puzzle.cols}`) ?? 0) + 1);
  console.log(`
Kept ${kept.length} cached puzzles; ${window.length} in the window ${data.from} \u2013 ${data.to}.`);
  console.log(`By size: ${[...sizes].sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s} ${n}`).join(", ")}`);
  console.log(`${answers.length} distinct answers written to ${DIR}/word-data.json, answers.csv and familiarity.md.`);
  console.log(`${nytHistory.puzzles.length} puzzles' metrics written to ${HISTORY_FILE}.`);
  console.log(historySummary(nytHistory));
  console.log(`
Excluded ${excluded.length}:${excluded.map((e) => `
  ${e}`).join("")}`);
}
var DIR, PRIVATE, RAW, HISTORY_FILE, API, DELAY_MS, WINDOW_DAYS, args, isoDate, addDays, sleep, DAYS, dayOf, percent, median, round, METRIC_KEYS;
var init_nyt_history = __esm({
  "vendor/scripts/nyt-history.ts"() {
    "use strict";
    init_home();
    init_ipuz();
    init_nytJson();
    init_numbering();
    init_difficulty();
    init_validate();
    DIR = NYT_DIR;
    PRIVATE = NYT_DIR;
    RAW = `${PRIVATE}/raw`;
    HISTORY_FILE = `${NYT_DIR}/nytHistory.json`;
    API = "https://www.nytimes.com/svc/crosswords";
    DELAY_MS = 500;
    WINDOW_DAYS = 1096;
    ({ values: args } = parseArgs({
      options: { from: { type: "string" }, to: { type: "string" }, cookie: { type: "string" }, offline: { type: "boolean" } },
      // Imported by another script (fill-bench), whose flags aren't these.
      args: import.meta.url === `file://${process.argv[1]}` ? void 0 : []
    }));
    isoDate = (d) => d.toISOString().slice(0, 10);
    addDays = (date, days) => isoDate(new Date(Date.parse(date) + days * 864e5));
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayOf = (date) => (/* @__PURE__ */ new Date(`${date}T12:00:00Z`)).getUTCDay();
    percent = (n) => `${Math.round(100 * n)}%`;
    median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
    round = (n) => Math.round(n * 1e4) / 1e4;
    METRIC_KEYS = ["words", "blocks", "openSquares", "longShare", "familiarity"];
    if (import.meta.url === `file://${process.argv[1]}`) {
      main().catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      });
    }
  }
});

// src/nyt.ts
init_home();
import { existsSync as existsSync2 } from "node:fs";
if (!process.env.NYT_S && !process.argv.includes("--offline") && !process.argv.includes("--cookie") && !existsSync2(COOKIE)) {
  console.error(`No NYT cookie at ${COOKIE}. Run /grid-guide:setup for the steps to save one.`);
  process.exit(2);
}
await Promise.resolve().then(() => (init_nyt_history(), nyt_history_exports));
