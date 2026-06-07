const SINGLE_COLOR = "#62aee8";
const MULTI_COLORS = ["#d95c59", "#4f8fbd", "#56a66f", "#d7ad42", "#8e70bd", "#d98b52"];
const STORAGE_KEY = "sync-blocks-progress-v3";
const PAGE_SIZE = 8;

const DIRS = {
  up: { dx: 0, dy: -1, label: "上" },
  down: { dx: 0, dy: 1, label: "下" },
  left: { dx: -1, dy: 0, label: "左" },
  right: { dx: 1, dy: 0, label: "右" },
};

const DIR_ORDER = ["up", "right", "down", "left"];

const LEVELS = [
  {
    name: "初學 1：滑到底",
    phase: "初學階段",
    note: "一顆小方塊，往右滑到底就能完成。",
    cols: 6,
    rows: 4,
    walls: [],
    solutionMoves: ["right"],
    pieces: [{ id: "A", cells: [[0, 1]] }],
  },
  {
    name: "初學 2：角塊框圈",
    phase: "初學階段",
    note: "四個角塊同時移動，利用牆壁讓它們歸位。",
    cols: 6,
    rows: 8,
    walls: [],
    pieces: [
      { id: "A", cells: [[0, 3], [1, 3], [0, 4]] },
      { id: "B", cells: [[4, 3], [5, 3], [5, 4]] },
      { id: "C", cells: [[0, 6], [0, 7], [1, 7]] },
      { id: "D", cells: [[4, 7], [5, 6], [5, 7]] },
    ],
    targets: [
      [[2, 0], [3, 0], [2, 1]],
      [[4, 0], [5, 0], [5, 1]],
      [[2, 2], [2, 3], [3, 3]],
      [[5, 2], [4, 3], [5, 3]],
    ],
    solutionMoves: ["up", "right"],
  },
  {
    name: "初學 3：左右合流",
    phase: "初學階段",
    note: "引導兩側的 L 形方塊，在上方會合。",
    cols: 6,
    rows: 5,
    walls: [],
    pieces: [
      { id: "A", cells: [[1, 3], [1, 4], [2, 4]] },
      { id: "B", cells: [[4, 3], [5, 3], [5, 4]] },
    ],
    targets: [
      [[0, 0], [0, 1], [1, 1]],
      [[1, 0], [2, 0], [2, 1]],
    ],
    solutionMoves: ["up", "left"],
  },
  {
    name: "初學 4：分流與上升",
    phase: "初學階段",
    note: "將大方塊和兩個小方塊一起滑到右邊再往上。",
    cols: 8,
    rows: 5,
    walls: ["0,0", "1,0", "2,0", "3,0"],
    pieces: [
      { id: "A", cells: [[0, 1], [1, 1], [2, 1], [3, 1], [1, 2]] },
      { id: "B", cells: [[0, 4]] },
      { id: "C", cells: [[1, 4]] },
    ],
    targets: [
      [[4, 0], [5, 0], [6, 0], [7, 0], [5, 1]],
      [[6, 1]],
      [[7, 1]],
    ],
    solutionMoves: ["right", "up"],
  },
  {
    name: "初學 5：高低階梯",
    phase: "初學階段",
    note: "利用左上角的障礙物調整相對位置。",
    cols: 7,
    rows: 6,
    walls: ["1,0", "2,0", "1,1", "2,1"],
    pieces: [
      { id: "A", cells: [[1, 4], [1, 5], [2, 5]] },
      { id: "B", cells: [[5, 4], [6, 4], [6, 5]] },
    ],
    targets: [
      [[5, 2], [5, 3], [6, 3]],
      [[5, 0], [6, 0], [6, 1]],
    ],
    solutionMoves: ["up", "right"],
  },
  {
    name: "初學 6：L型步道",
    phase: "初學階段",
    note: "避開重重障礙，將兩個小方塊送進右邊的通道。",
    cols: 6,
    rows: 6,
    walls: ["0,0", "0,1", "3,3", "4,3", "5,3", "3,4", "4,4", "5,4", "3,5", "4,5", "5,5"],
    pieces: [
      { id: "A", cells: [[0, 5]] },
      { id: "B", cells: [[2, 5]] },
    ],
    targets: [
      [[5, 2]],
      [[5, 1]],
    ],
    solutionMoves: ["up", "right", "down"],
  },
  {
    name: "初學 7：先上再右",
    phase: "初學階段",
    note: "試著預想兩步，先撞上方，再往右送進目標。",
    cols: 8,
    rows: 7,
    walls: ["3,0", "4,0", "5,0", "6,0", "6,1", "6,2"],
    solutionMoves: ["up", "right"],
    pieces: [
      { id: "A", cells: [[0, 6], [1, 6], [2, 6], [3, 6]] },
      { id: "B", cells: [[5, 4], [5, 5]] },
    ],
  },
  {
    name: "初學 8：信心收束",
    phase: "初學階段",
    note: "兩塊不同形狀，仍然只要照順序滑動即可完成。",
    cols: 8,
    rows: 7,
    walls: ["2,1", "5,1", "2,2", "5,3", "1,5", "2,5", "6,5"],
    solutionMoves: ["right", "down"],
    pieces: [
      { id: "A", cells: [[0, 2]] },
      { id: "B", cells: [[3, 3], [3, 4], [4, 4]] },
    ],
  },
  {
    name: "基礎 1：撞牆對齊",
    phase: "單色基礎",
    note: "小方塊和 L 形磚塊要靠牆改變相對位置。",
    cols: 8,
    rows: 7,
    walls: ["2,1", "5,1", "2,2", "5,3", "1,5", "2,5", "6,5"],
    solutionMoves: ["up", "right", "up", "left", "down", "right", "down", "right", "up", "right"],
    pieces: [
      { id: "A", cells: [[0, 2]] },
      { id: "B", cells: [[0, 3], [0, 4], [1, 4]] },
    ],
  },
  {
    name: "基礎 2：左右角塊",
    phase: "單色基礎",
    note: "四個角塊會一起動，先讓其中幾塊停住，再推進目標。",
    cols: 6,
    rows: 8,
    walls: ["2,1", "5,1", "2,2", "5,2"],
    solutionMoves: ["up", "right", "down", "left", "up"],
    pieces: [
      { id: "A", cells: [[0, 3], [1, 3], [0, 4]] },
      { id: "B", cells: [[4, 3], [5, 3], [5, 4]] },
      { id: "C", cells: [[0, 6], [0, 7], [1, 7]] },
      { id: "D", cells: [[4, 7], [5, 6], [5, 7]] },
    ],
  },
  {
    name: "基礎 3：城牆凹槽",
    phase: "單色基礎",
    note: "長條與凹槽型磚塊會卡住彼此，觀察誰會先停下。",
    cols: 7,
    rows: 5,
    walls: ["0,0", "6,0"],
    solutionMoves: ["up", "left"],
    pieces: [
      { id: "A", cells: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1]] },
      { id: "B", cells: [[1, 3], [1, 4], [2, 4], [3, 4]] },
      { id: "C", cells: [[4, 4], [5, 4], [6, 4], [6, 3]] },
    ],
  },
  {
    name: "基礎 4：大目標區",
    phase: "單色基礎",
    note: "先把左側 L 形和右側角塊分開對位。",
    cols: 6,
    rows: 5,
    walls: ["0,0", "1,0", "2,0", "0,1", "1,1", "2,1"],
    solutionMoves: ["up", "right", "up", "left", "down"],
    pieces: [
      { id: "A", cells: [[1, 3], [1, 4], [2, 4]] },
      { id: "B", cells: [[4, 3], [5, 3], [5, 4]] },
    ],
  },
  {
    name: "基礎 5：退後前進",
    phase: "單色轉折",
    note: "目標看似在右上，但必須先往左調整隊形。",
    cols: 6,
    rows: 5,
    walls: ["3,0", "4,0", "5,0", "3,1", "4,1", "5,1"],
    solutionMoves: ["left", "down", "right", "up", "left", "right"],
    pieces: [
      { id: "A", cells: [[0, 1], [1, 1], [2, 1], [1, 2]] },
      { id: "B", cells: [[0, 4]] },
      { id: "C", cells: [[1, 4]] },
    ],
  },
  {
    name: "基礎 6：高塔角塊",
    phase: "單色精通",
    note: "狹長目標區會迫使磚塊依序撞牆。",
    cols: 7,
    rows: 6,
    walls: ["1,0", "2,0", "1,1", "2,1"],
    solutionMoves: ["up", "right", "down", "left", "up", "right"],
    pieces: [
      { id: "A", cells: [[1, 4], [1, 5], [2, 5]] },
      { id: "B", cells: [[5, 4], [6, 4], [6, 5]] },
    ],
  },
  {
    name: "基礎 7：階梯長廊",
    phase: "單色精通",
    note: "長條和直條互相牽制，開始需要更多預演。",
    cols: 7,
    rows: 7,
    walls: ["3,0", "4,0", "5,0", "6,0", "2,1", "6,1", "1,2", "6,2", "0,3", "6,3"],
    solutionMoves: ["up", "right", "up", "left", "down", "right", "up", "left", "down"],
    pieces: [
      { id: "A", cells: [[0, 6], [1, 6], [2, 6], [3, 6]] },
      { id: "B", cells: [[6, 4], [6, 5]] },
    ],
  },
  {
    name: "基礎 8：單色迷宮",
    phase: "單色精通",
    note: "第一批進階單色題收束，考驗撞牆順序。",
    cols: 9,
    rows: 6,
    walls: ["2,0", "2,1", "2,3", "2,4", "5,2", "6,2", "7,2", "5,4"],
    solutionMoves: ["down", "right", "up", "right", "down"],
    pieces: [
      { id: "A", cells: [[4, 1]] },
      { id: "B", cells: [[6, 4]] },
      { id: "C", cells: [[1, 2], [1, 3]] },
    ],
  },
  {
    name: "多色 1：同向入門",
    phase: "多色教學",
    note: "多色登場時先放輕鬆，每個顏色停到自己的目標即可。",
    cols: 6,
    rows: 4,
    colorMode: "multi",
    walls: [],
    solutionMoves: ["right"],
    pieces: [
      { id: "A", cells: [[0, 1]] },
      { id: "B", cells: [[1, 2]] },
    ],
  },
  {
    name: "多色 2：上下分流",
    phase: "多色教學",
    note: "兩個顏色仍然同步滑動，先建立信心。",
    cols: 6,
    rows: 5,
    colorMode: "multi",
    walls: [],
    solutionMoves: ["down"],
    pieces: [
      { id: "A", cells: [[1, 0], [2, 0]] },
      { id: "B", cells: [[4, 1]] },
    ],
  },
  {
    name: "多色 3：小牆分隔",
    phase: "多色教學",
    note: "利用一面小牆讓兩種顏色停在不同位置。",
    cols: 7,
    rows: 5,
    colorMode: "multi",
    walls: ["3,2"],
    solutionMoves: ["right", "down"],
    pieces: [
      { id: "A", cells: [[0, 1]] },
      { id: "B", cells: [[2, 3]] },
    ],
  },
  {
    name: "多色 4：彩色 L 形",
    phase: "多色教學",
    note: "L 形也可以是特定顏色，仍然是一整塊。",
    cols: 7,
    rows: 5,
    colorMode: "multi",
    walls: ["3,1"],
    solutionMoves: ["right"],
    pieces: [
      { id: "A", cells: [[0, 2], [0, 3], [1, 3]] },
      { id: "B", cells: [[4, 2]] },
    ],
  },
  {
    name: "多色 6：分流基礎",
    phase: "多色發展",
    note: "開始需要安排不同顏色停進各自位置。",
    cols: 8,
    rows: 6,
    colorMode: "multi",
    walls: ["3,1", "3,2", "1,4", "2,4", "6,1", "6,2"],
    solutionMoves: ["down", "left", "up", "right", "down"],
    pieces: [
      { id: "A", cells: [[1, 1], [2, 1]] },
      { id: "B", cells: [[5, 2]] },
    ],
  },
  {
    name: "多色 9：單色迷宮變奏",
    phase: "多色精通",
    note: "與第 16 題相同的迷宮架構，但每塊磚有自己的顏色，不能再用單色互換思路解題。",
    cols: 9,
    rows: 6,
    colorMode: "multi",
    walls: ["2,0", "2,1", "2,3", "2,4", "5,2", "6,2", "7,2", "5,4"],
    solutionMoves: ["down", "right", "up", "right", "down"],
    pieces: [
      { id: "A", cells: [[4, 1]] },
      { id: "B", cells: [[6, 4]] },
      { id: "C", cells: [[1, 2], [1, 3]] },
    ],
  },
  {
    name: "多色 7：臨時牆壁",
    phase: "多色發展",
    note: "不同顏色的任意形狀會互相當作阻擋點。",
    cols: 9,
    rows: 7,
    colorMode: "multi",
    walls: ["3,1", "3,2", "3,3", "5,3", "6,3", "1,5", "2,5", "6,1", "7,1"],
    solutionMoves: ["down", "right", "up", "left", "down", "right", "up", "left"],
    pieces: [
      { id: "A", cells: [[1, 1]] },
      { id: "B", cells: [[5, 1], [5, 2]] },
      { id: "C", cells: [[7, 4], [8, 4], [8, 5]] },
    ],
  },
  {
    name: "多色 8：三色預演",
    phase: "多色精通",
    note: "第三頁最後一題，開始需要規劃多步之後的彩色陣型。",
    cols: 10,
    rows: 7,
    colorMode: "multi",
    walls: ["2,1", "3,1", "7,1", "2,2", "5,2", "7,2", "5,3", "1,4", "2,4", "5,5", "8,5"],
    solutionMoves: ["down", "left", "down", "left", "up", "right"],
    pieces: [
      { id: "A", cells: [[1, 1], [1, 2]] },
      { id: "B", cells: [[4, 4]] },
      { id: "C", cells: [[7, 4], [8, 4]] },
    ],
  },
];

const boardEl = document.querySelector("#board");
const levelText = document.querySelector("#levelText");
const moveText = document.querySelector("#moveText");
const bestText = document.querySelector("#bestText");
const parText = document.querySelector("#parText");
const levelNameEl = document.querySelector("#levelName");
const levelNoteEl = document.querySelector("#levelNote");
const statusText = document.querySelector("#statusText");
const levelPicker = document.querySelector("#levelPicker");
const pageText = document.querySelector("#pageText");
const prevPageBtn = document.querySelector("#prevPageBtn");
const nextPageBtn = document.querySelector("#nextPageBtn");
const undoBtn = document.querySelector("#undoBtn");
const resetBtn = document.querySelector("#resetBtn");
const hintBtn = document.querySelector("#hintBtn");
const nextBtn = document.querySelector("#nextBtn");

const preparedLevels = LEVELS.map(prepareLevel);
const solutionCache = new Map();
const pageCount = Math.ceil(preparedLevels.length / PAGE_SIZE);

let progress = loadProgress();
let levelIndex = 0;
let pageIndex = 0;
let origins = [];
let moves = 0;
let history = [];
let hintCells = new Set();
let touchStart = null;
let gridLayer = null;
let pieceLayer = null;
let pieceElements = new Map();

function keyOf(x, y) {
  return `${x},${y}`;
}

function compareCells(a, b) {
  return a[1] - b[1] || a[0] - b[0];
}

function hashCells(cells) {
  return cells.map(([x, y]) => `${x},${y}`).join("|");
}

function normalizeCells(cells) {
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells
    .map(([x, y]) => [x - minX, y - minY])
    .sort(compareCells);
}

function prepareLevel(level, index) {
  const colorMode = level.colorMode ?? "single";
  const pieces = level.pieces.map((piece, pieceIndex) => {
    const originX = Math.min(...piece.cells.map(([x]) => x));
    const originY = Math.min(...piece.cells.map(([, y]) => y));
    return {
      ...piece,
      color: colorMode === "single" ? SINGLE_COLOR : MULTI_COLORS[pieceIndex % MULTI_COLORS.length],
      shape: normalizeCells(piece.cells),
      start: { x: originX, y: originY },
    };
  });

  const prepared = {
    ...level,
    colorMode,
    index,
    pieces,
    wallSet: new Set(level.walls ?? []),
    startState: pieces.map((piece) => ({ ...piece.start })),
  };

  const targetState = level.targets
    ? targetsToState(prepared, level.targets)
    : deriveTargetState(prepared, level.solutionMoves ?? []);

  prepared.pieces = pieces.map((piece, pieceIndex) => ({
    ...piece,
    targetCells: cellsFor(piece, targetState[pieceIndex]),
  }));

  validateLevel(prepared);
  return prepared;
}

function targetsToState(level, targets) {
  return targets.map((target, index) => {
    const targetX = Math.min(...target.map(([x]) => x));
    const targetY = Math.min(...target.map(([, y]) => y));
    const targetShape = normalizeCells(target);
    if (hashCells(targetShape) !== hashCells(level.pieces[index].shape)) {
      throw new Error(`Level ${level.index + 1} target shape mismatch.`);
    }
    return { x: targetX, y: targetY };
  });
}

function deriveTargetState(level, movesList) {
  let state = cloneState(level.startState);
  for (const dirName of movesList) {
    state = slideState(level, state, dirName).state;
  }
  return state;
}

function validateLevel(level) {
  const occupied = new Set();
  for (let i = 0; i < level.pieces.length; i += 1) {
    for (const cell of cellsFor(level.pieces[i], level.startState[i])) {
      const key = keyOf(cell.x, cell.y);
      if (!isInside(level, cell.x, cell.y) || level.wallSet.has(key)) {
        throw new Error(`Level ${level.index + 1} piece ${level.pieces[i].id} starts on a blocked cell.`);
      }
      if (occupied.has(key)) throw new Error(`Level ${level.index + 1} has overlapping start pieces.`);
      occupied.add(key);
    }
  }
}

function cellsFor(piece, origin) {
  return piece.shape.map(([dx, dy]) => ({ x: origin.x + dx, y: origin.y + dy }));
}

function stateHash(state) {
  return state.map((pos) => `${pos.x},${pos.y}`).join("|");
}

function cloneState(state) {
  return state.map((pos) => ({ ...pos }));
}

function occupiedMap(level, state) {
  const occupied = new Map();
  level.pieces.forEach((piece, index) => {
    for (const cell of cellsFor(piece, state[index])) {
      occupied.set(keyOf(cell.x, cell.y), index);
    }
  });
  return occupied;
}

function isInside(level, x, y) {
  return x >= 0 && y >= 0 && x < level.cols && y < level.rows;
}

function canPieceMove(level, state, pieceIndex, dir, movingSet, occupied) {
  const piece = level.pieces[pieceIndex];
  for (const cell of cellsFor(piece, state[pieceIndex])) {
    const nx = cell.x + dir.dx;
    const ny = cell.y + dir.dy;
    if (!isInside(level, nx, ny) || level.wallSet.has(keyOf(nx, ny))) return false;

    const occupant = occupied.get(keyOf(nx, ny));
    if (occupant !== undefined && occupant !== pieceIndex && !movingSet.has(occupant)) return false;
  }
  return true;
}

function movableSetForTick(level, state, dir) {
  const occupied = occupiedMap(level, state);
  const movingSet = new Set(level.pieces.map((_, index) => index));
  let changed = true;

  while (changed) {
    changed = false;
    for (const pieceIndex of [...movingSet]) {
      if (!canPieceMove(level, state, pieceIndex, dir, movingSet, occupied)) {
        movingSet.delete(pieceIndex);
        changed = true;
      }
    }
  }

  return movingSet;
}

function slideState(level, state, dirName) {
  const dir = DIRS[dirName];
  const next = cloneState(state);
  let distance = 0;

  while (true) {
    const movingSet = movableSetForTick(level, next, dir);
    if (!movingSet.size) break;

    for (const pieceIndex of movingSet) {
      next[pieceIndex].x += dir.dx;
      next[pieceIndex].y += dir.dy;
    }
    distance += 1;
  }

  return { state: next, changed: stateHash(state) !== stateHash(next), distance };
}

function isSolvedState(level, state) {
  if (level.colorMode === "single") {
    const occupied = level.pieces
      .flatMap((piece, index) => cellsFor(piece, state[index]))
      .map((cell) => keyOf(cell.x, cell.y))
      .sort()
      .join("|");
    const targets = level.pieces
      .flatMap((piece) => piece.targetCells)
      .map((cell) => keyOf(cell.x, cell.y))
      .sort()
      .join("|");
    return occupied === targets;
  }

  return level.pieces.every((piece, index) => {
    const now = cellsFor(piece, state[index]).map((cell) => keyOf(cell.x, cell.y)).sort().join("|");
    const target = piece.targetCells.map((cell) => keyOf(cell.x, cell.y)).sort().join("|");
    return now === target;
  });
}

function solveFrom(level, startState, maxVisits = 100000) {
  const queue = [{ state: cloneState(startState), path: [] }];
  const seen = new Set([stateHash(startState)]);
  let cursor = 0;

  while (cursor < queue.length && seen.size <= maxVisits) {
    const node = queue[cursor];
    cursor += 1;

    if (isSolvedState(level, node.state)) return { path: node.path, visited: seen.size };

    for (const dirName of DIR_ORDER) {
      const result = slideState(level, node.state, dirName);
      if (!result.changed) continue;

      const hash = stateHash(result.state);
      if (seen.has(hash)) continue;

      seen.add(hash);
      queue.push({ state: result.state, path: [...node.path, dirName] });
    }
  }

  return { path: null, visited: seen.size };
}

function getLevelSolution(level) {
  if (!solutionCache.has(level.index)) {
    solutionCache.set(level.index, solveFrom(level, level.startState));
  }
  return solutionCache.get(level.index);
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { best: {}, solved: [] };
  } catch {
    return { best: {}, solved: [] };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function pageStart(page) {
  return page * PAGE_SIZE;
}

function pageEnd(page) {
  return Math.min(pageStart(page) + PAGE_SIZE, preparedLevels.length);
}

function isPageComplete(page) {
  for (let index = pageStart(page); index < pageEnd(page); index += 1) {
    if (!progress.solved.includes(index)) return false;
  }
  return true;
}

function isPageUnlocked(page) {
  if (page === 0) return true;
  return isPageComplete(page - 1);
}

function canAccessLevel(index) {
  if (index < 0 || index >= preparedLevels.length) return false;
  return isPageUnlocked(Math.floor(index / PAGE_SIZE));
}

function currentLevel() {
  return preparedLevels[levelIndex];
}

function setStatus(text, type = "") {
  statusText.textContent = text;
  statusText.className = `status ${type}`.trim();
}

function loadLevel(index) {
  if (!canAccessLevel(index)) {
    setStatus("完成上一頁的 8 題後，才會開啟下一頁題目。", "warn");
    return;
  }

  levelIndex = index;
  pageIndex = Math.floor(index / PAGE_SIZE);
  const level = currentLevel();
  origins = cloneState(level.startState);
  moves = 0;
  history = [];
  hintCells = new Set();

  const solution = getLevelSolution(level);
  levelText.textContent = String(levelIndex + 1);
  levelNameEl.textContent = level.name;
  levelNoteEl.textContent = level.note;
  parText.textContent = solution.path ? `${solution.path.length} 步` : "未驗證";

  renderLevelPicker();
  buildBoard();
  setStatus(solution.path ? `${level.phase}，最短解已驗證。` : "這關目前沒有找到解，請檢查關卡資料。", solution.path ? "" : "warn");
  boardEl.focus({ preventScroll: true });
}

function renderLevelPicker() {
  levelPicker.textContent = "";
  pageText.textContent = `第 ${pageIndex + 1} / ${pageCount} 頁`;
  prevPageBtn.disabled = pageIndex === 0;
  nextPageBtn.disabled = pageIndex >= pageCount - 1 || !isPageUnlocked(pageIndex + 1);

  for (let index = pageStart(pageIndex); index < pageEnd(pageIndex); index += 1) {
    const level = preparedLevels[index];
    const locked = !canAccessLevel(index);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(index + 1);
    button.disabled = locked;
    button.className = [
      index === levelIndex ? "active" : "",
      progress.solved.includes(index) ? "solved" : "",
      locked ? "locked" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.title = locked ? "完成上一頁後開啟" : level.name;
    button.setAttribute("aria-label", locked ? `第 ${index + 1} 關尚未開啟` : `第 ${index + 1} 關：${level.name}`);
    button.addEventListener("click", () => loadLevel(index));
    levelPicker.append(button);
  }
}

function changePage(delta) {
  const nextPage = pageIndex + delta;
  if (nextPage < 0 || nextPage >= pageCount || !isPageUnlocked(nextPage)) return;
  pageIndex = nextPage;
  const firstLevel = pageStart(pageIndex);
  if (levelIndex < firstLevel || levelIndex >= pageEnd(pageIndex)) {
    levelIndex = firstLevel;
    loadLevel(levelIndex);
  } else {
    renderLevelPicker();
  }
}

function buildBoard() {
  const level = currentLevel();
  boardEl.textContent = "";
  boardEl.style.setProperty("--cols", level.cols);
  boardEl.style.setProperty("--rows", level.rows);

  gridLayer = document.createElement("div");
  gridLayer.className = "grid-layer";
  pieceLayer = document.createElement("div");
  pieceLayer.className = "piece-layer";
  pieceElements = new Map();

  renderGrid();
  boardEl.append(gridLayer, pieceLayer);
  createPieces();
  renderPieces(false);
  updateBoardSize();
}

function renderGrid() {
  const level = currentLevel();
  const targetCells = new Map();
  level.pieces.forEach((piece) => {
    for (const cell of piece.targetCells) targetCells.set(keyOf(cell.x, cell.y), piece);
  });

  gridLayer.textContent = "";
  for (let y = 0; y < level.rows; y += 1) {
    for (let x = 0; x < level.cols; x += 1) {
      const key = keyOf(x, y);
      const target = targetCells.get(key);
      const cell = document.createElement("div");
      cell.className = "cell";
      if (level.wallSet.has(key)) cell.classList.add("wall");
      if (target) {
        cell.classList.add("target");
        cell.style.setProperty("--target-color", target.color);
      }
      if (hintCells.has(key)) cell.classList.add("hint-cell");
      gridLayer.append(cell);
    }
  }
}

function createPieces() {
  const level = currentLevel();
  level.pieces.forEach((piece, index) => {
    const bounds = shapeBounds(piece.shape);
    const pieceEl = document.createElement("div");
    pieceEl.className = "piece";
    pieceEl.style.setProperty("--piece-cols", bounds.w);
    pieceEl.style.setProperty("--piece-rows", bounds.h);
    pieceEl.style.setProperty("--piece-color", piece.color);
    pieceEl.dataset.index = String(index);

    const shapeSet = new Set(piece.shape.map(([x, y]) => keyOf(x, y)));
    piece.shape.forEach(([x, y]) => {
      const unit = document.createElement("span");
      unit.className = edgeClasses(x, y, shapeSet);
      unit.style.gridColumn = String(x + 1);
      unit.style.gridRow = String(y + 1);

      for (const side of seamSides(x, y, shapeSet)) {
        const seam = document.createElement("span");
        seam.className = `seam-fill ${side}`;
        unit.append(seam);
      }

      pieceEl.append(unit);
    });

    pieceLayer.append(pieceEl);
    pieceElements.set(index, pieceEl);
  });
}

function shapeBounds(shape) {
  return {
    w: Math.max(...shape.map(([x]) => x)) + 1,
    h: Math.max(...shape.map(([, y]) => y)) + 1,
  };
}

function edgeClasses(x, y, shapeSet) {
  const hasNorth = shapeSet.has(keyOf(x, y - 1));
  const hasSouth = shapeSet.has(keyOf(x, y + 1));
  const hasWest = shapeSet.has(keyOf(x - 1, y));
  const hasEast = shapeSet.has(keyOf(x + 1, y));

  const classes = ["piece-unit"];
  if (!hasNorth) classes.push("north");
  if (!hasSouth) classes.push("south");
  if (!hasWest) classes.push("west");
  if (!hasEast) classes.push("east");

  // Round outer corners:
  if (!hasNorth && !hasWest) classes.push("round-tl");
  if (!hasNorth && !hasEast) classes.push("round-tr");
  if (!hasSouth && !hasWest) classes.push("round-bl");
  if (!hasSouth && !hasEast) classes.push("round-br");

  return classes.join(" ");
}

function seamSides(x, y, shapeSet) {
  return [
    shapeSet.has(keyOf(x, y - 1)) ? "north" : "",
    shapeSet.has(keyOf(x, y + 1)) ? "south" : "",
    shapeSet.has(keyOf(x - 1, y)) ? "west" : "",
    shapeSet.has(keyOf(x + 1, y)) ? "east" : "",
  ].filter(Boolean);
}

function renderPieces(animated = true) {
  const level = currentLevel();
  const solved = isSolvedState(level, origins);
  level.pieces.forEach((piece, index) => {
    const pieceEl = pieceElements.get(index);
    if (!pieceEl) return;
    pieceEl.style.transition = animated ? "" : "none";
    pieceEl.style.setProperty("--piece-x", origins[index].x);
    pieceEl.style.setProperty("--piece-y", origins[index].y);
    pieceEl.querySelectorAll(".piece-unit").forEach((unit) => {
      unit.classList.toggle("done", solved);
    });
    if (!animated) {
      requestAnimationFrame(() => {
        pieceEl.style.transition = "";
      });
    }
  });

  moveText.textContent = String(moves);
  bestText.textContent = progress.best[levelIndex] ?? "--";
  nextBtn.disabled = !isSolvedState(level, origins) || !canAccessLevel(levelIndex + 1);
}

function updateBoardSize() {
  const level = currentLevel();
  const wrapper = boardEl.parentElement;
  if (!wrapper) return;

  const style = getComputedStyle(wrapper);
  const availableWidth = wrapper.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const mobile = viewportWidth <= 620;
  const mobileWidth = Math.max(260, viewportWidth - 36);
  const availableHeight = Math.min(viewportHeight * (mobile ? 0.58 : 0.72), 720);
  const cellFromWidth = availableWidth / level.cols;
  const cellFromHeight = availableHeight / level.rows;
  const mobileCellFromWidth = mobileWidth / level.cols;
  const smallestCell = mobile ? 24 : 34;
  const cell = Math.max(smallestCell, Math.floor(Math.min(cellFromWidth, cellFromHeight, mobileCellFromWidth)));
  boardEl.style.setProperty("--board-px", `${cell * level.cols}px`);
}

function move(dirName) {
  const level = currentLevel();
  if (isSolvedState(level, origins)) return;

  const result = slideState(level, origins, dirName);
  if (!result.changed) {
    setStatus(`往${DIRS[dirName].label}沒有任何磚塊能滑動。`, "warn");
    return;
  }

  history.push({ origins: cloneState(origins), moves });
  origins = result.state;
  moves += 1;
  hintCells = new Set();
  renderGrid();
  renderPieces(true);

  if (isSolvedState(level, origins)) {
    finishLevel({ rerenderPieces: false });
  } else {
    setStatus(`往${DIRS[dirName].label}滑動，最遠推進 ${result.distance} 格。`);
  }
}

function finishLevel({ rerenderPieces = true } = {}) {
  const oldBest = progress.best[levelIndex];
  if (!oldBest || moves < oldBest) progress.best[levelIndex] = moves;
  if (!progress.solved.includes(levelIndex)) progress.solved.push(levelIndex);
  saveProgress();
  renderLevelPicker();
  if (rerenderPieces) {
    renderPieces(false);
  } else {
    bestText.textContent = progress.best[levelIndex] ?? "--";
  }

  nextBtn.disabled = levelIndex >= preparedLevels.length - 1 || !canAccessLevel(levelIndex + 1);
  setStatus(`完成第 ${levelIndex + 1} 關，用了 ${moves} 步。`, "good");
}

function undo() {
  const last = history.pop();
  if (!last) {
    setStatus("目前沒有可以復原的步驟。", "warn");
    return;
  }
  origins = last.origins;
  moves = last.moves;
  hintCells = new Set();
  renderGrid();
  renderPieces(true);
  setStatus("已復原上一手。");
}

function showHint() {
  const level = currentLevel();
  if (isSolvedState(level, origins)) {
    setStatus("這關已經完成了。", "good");
    return;
  }

  const solution = solveFrom(level, origins);
  if (!solution.path) {
    setStatus("從目前狀態找不到通關路線，建議先重來。", "warn");
    return;
  }

  const nextDir = solution.path[0];
  const nextState = slideState(level, origins, nextDir).state;
  hintCells = new Set();
  nextState.forEach((origin, index) => {
    for (const cell of cellsFor(level.pieces[index], origin)) hintCells.add(keyOf(cell.x, cell.y));
  });
  renderGrid();
  setStatus(`提示：下一步往${DIRS[nextDir].label}，目前還差 ${solution.path.length} 步。`, "warn");
}

function goNextLevel() {
  const level = currentLevel();
  if (!isSolvedState(level, origins)) {
    setStatus("完成這一關後才能前往下一關。", "warn");
    return;
  }

  const nextIndex = levelIndex + 1;
  if (nextIndex >= preparedLevels.length) return;

  const nextPage = Math.floor(nextIndex / PAGE_SIZE);
  if (pageIndex !== nextPage) pageIndex = nextPage;
  loadLevel(nextIndex);
}

function handleKey(event) {
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };
  const dir = keyMap[event.key];
  if (!dir) return;
  event.preventDefault();
  move(dir);
}

function handlePointerDown(event) {
  touchStart = { x: event.clientX, y: event.clientY };
}

function handlePointerUp(event) {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.hypot(dx, dy) < 28) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? "right" : "left");
  } else {
    move(dy > 0 ? "down" : "up");
  }
}

function bindActionButton(button, handler) {
  let lastTouchRunAt = 0;

  button.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse" || button.disabled) return;
    event.preventDefault();
    lastTouchRunAt = Date.now();
    handler(event);
  });

  button.addEventListener("click", (event) => {
    if (Date.now() - lastTouchRunAt < 500) {
      event.preventDefault();
      return;
    }
    handler(event);
  });
}

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => move(button.dataset.dir));
});

prevPageBtn.addEventListener("click", () => changePage(-1));
nextPageBtn.addEventListener("click", () => changePage(1));
bindActionButton(undoBtn, undo);
bindActionButton(resetBtn, () => loadLevel(levelIndex));
bindActionButton(hintBtn, showHint);
bindActionButton(nextBtn, goNextLevel);
window.addEventListener("keydown", handleKey);
window.addEventListener("resize", updateBoardSize);
window.visualViewport?.addEventListener("resize", updateBoardSize);
boardEl.addEventListener("pointerdown", handlePointerDown);
boardEl.addEventListener("pointerup", handlePointerUp);
boardEl.addEventListener("pointercancel", () => {
  touchStart = null;
});

loadLevel(0);
