const SIZE = 8;
const TOTAL = SIZE * SIZE;
const palette = [
  "#f5d66d",
  "#93c8a5",
  "#f2a38b",
  "#9fcbe0",
  "#d0b4df",
  "#f0bd72",
  "#8fc9c0",
  "#e690a2",
  "#b7d782",
  "#c8b188",
  "#8fb5df",
  "#e7c1d5",
];

const boardEl = document.querySelector("#board");
const filledCountEl = document.querySelector("#filledCount");
const pieceCountEl = document.querySelector("#pieceCount");
const clueCountEl = document.querySelector("#clueCount");
const statusEl = document.querySelector("#status");
const checkBtn = document.querySelector("#checkBtn");
const hintBtn = document.querySelector("#hintBtn");
const undoBtn = document.querySelector("#undoBtn");
const clearBtn = document.querySelector("#clearBtn");
const newBtn = document.querySelector("#newBtn");

let cells = [];
let solution = [];
let solutionByCell = [];
let clues = new Map();
let playerCells = Array(TOTAL).fill(null);
let playerRects = new Map();
let history = [];
let nextPlayerId = 1;
let drag = null;

function indexOf(x, y) {
  return y * SIZE + x;
}

function coordOf(index) {
  return { x: index % SIZE, y: Math.floor(index / SIZE) };
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function area(rect) {
  return rect.w * rect.h;
}

function rectCells(rect) {
  const result = [];
  for (let y = rect.y; y < rect.y + rect.h; y += 1) {
    for (let x = rect.x; x < rect.x + rect.w; x += 1) {
      result.push(indexOf(x, y));
    }
  }
  return result;
}

function normalizeRect(a, b) {
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x, b.x);
  const y2 = Math.max(a.y, b.y);
  return { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 };
}

function makePuzzle() {
  const targetPieces = randomInt(10, 14);
  const pieces = [{ x: 0, y: 0, w: SIZE, h: SIZE }];

  while (pieces.length < targetPieces) {
    const candidates = pieces
      .map((rect, i) => ({ rect, i }))
      .filter(({ rect }) => area(rect) >= 4 && (rect.w > 1 || rect.h > 1))
      .sort((a, b) => area(b.rect) - area(a.rect));

    if (!candidates.length) break;

    const { rect, i } = candidates[randomInt(0, Math.min(8, candidates.length - 1))];
    const splitVertical = rect.w > 1 && (rect.h === 1 || rect.w >= rect.h || Math.random() > 0.5);
    const splitAt = splitVertical ? randomInt(1, rect.w - 1) : randomInt(1, rect.h - 1);
    const first = splitVertical
      ? { x: rect.x, y: rect.y, w: splitAt, h: rect.h }
      : { x: rect.x, y: rect.y, w: rect.w, h: splitAt };
    const second = splitVertical
      ? { x: rect.x + splitAt, y: rect.y, w: rect.w - splitAt, h: rect.h }
      : { x: rect.x, y: rect.y + splitAt, w: rect.w, h: rect.h - splitAt };

    pieces.splice(i, 1, first, second);
  }

  solution = pieces.map((rect, id) => ({ ...rect, id, cells: rectCells(rect), area: area(rect) }));
  solutionByCell = Array(TOTAL);
  clues = new Map();

  for (const rect of solution) {
    const clueCell = shuffle([...rect.cells])[0];
    clues.set(clueCell, { value: rect.area, solutionId: rect.id });
    solutionByCell[clueCell] = rect.id;
    for (const idx of rect.cells) solutionByCell[idx] = rect.id;
  }

  for (const rect of solution) {
    if (rect.area >= 8 && Math.random() < 0.22) {
      const openCells = rect.cells.filter((idx) => !clues.has(idx));
      if (openCells.length) {
        clues.set(shuffle(openCells)[0], { value: rect.area, solutionId: rect.id });
      }
    }
  }
}

function buildBoard() {
  boardEl.textContent = "";
  boardEl.style.setProperty("--board-size", SIZE);
  cells = [];
  for (let idx = 0; idx < TOTAL; idx += 1) {
    const cell = document.createElement("button");
    const { x, y } = coordOf(idx);
    cell.className = "cell";
    cell.type = "button";
    cell.dataset.index = String(idx);
    cell.dataset.x = String(x);
    cell.dataset.y = String(y);
    cell.setAttribute("aria-label", `第 ${y + 1} 列第 ${x + 1} 欄`);
    boardEl.append(cell);
    cells.push(cell);
  }
}

function setStatus(text, type = "") {
  statusEl.textContent = text;
  statusEl.className = type;
}

function render() {
  let filled = 0;
  for (let idx = 0; idx < TOTAL; idx += 1) {
    const cell = cells[idx];
    const playerId = playerCells[idx];
    const clue = clues.get(idx);
    cell.className = "cell";
    cell.style.removeProperty("--fill");
    cell.textContent = "";

    if (playerId) {
      filled += 1;
      cell.style.setProperty("--fill", palette[playerId % palette.length]);
    }

    if (clue) {
      const span = document.createElement("span");
      span.textContent = clue.value;
      cell.append(span);
      cell.classList.add("has-clue");
    }
  }

  filledCountEl.textContent = filled;
  pieceCountEl.textContent = playerRects.size;
  clueCountEl.textContent = clues.size;
}

function clearBadMarks() {
  for (const cell of cells) cell.classList.remove("bad", "hint", "preview");
}

function markRect(rect, className) {
  for (const idx of rectCells(rect)) cells[idx].classList.add(className);
}

function cellFromPoint(clientX, clientY) {
  const rect = boardEl.getBoundingClientRect();
  const x = Math.floor(((clientX - rect.left) / rect.width) * SIZE);
  const y = Math.floor(((clientY - rect.top) / rect.height) * SIZE);
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
  return { x, y, index: indexOf(x, y) };
}

function snapshot() {
  history.push({
    playerCells: [...playerCells],
    playerRects: new Map(playerRects),
    nextPlayerId,
  });
  if (history.length > 50) history.shift();
}

function restoreLast() {
  const last = history.pop();
  if (!last) {
    setStatus("目前沒有可復原的操作。", "warn");
    return;
  }
  playerCells = last.playerCells;
  playerRects = last.playerRects;
  nextPlayerId = last.nextPlayerId;
  clearBadMarks();
  render();
  setStatus("已復原上一個框選。");
}

function clearPlayerRect(playerId, save = true) {
  if (!playerRects.has(playerId)) return;
  if (save) snapshot();
  for (let idx = 0; idx < TOTAL; idx += 1) {
    if (playerCells[idx] === playerId) playerCells[idx] = null;
  }
  playerRects.delete(playerId);
  render();
}

function placeRect(rect) {
  const selected = rectCells(rect);
  const occupied = selected.find((idx) => playerCells[idx]);
  if (occupied) {
    setStatus("這個範圍碰到已框選色塊，先點擊該色塊清除後再框選。", "bad");
    cells[occupied].classList.add("bad");
    return;
  }

  snapshot();
  const id = nextPlayerId;
  nextPlayerId += 1;
  playerRects.set(id, { ...rect, cells: selected, area: selected.length });
  for (const idx of selected) playerCells[idx] = id;
  clearBadMarks();
  render();

  const clueValues = selected.filter((idx) => clues.has(idx)).map((idx) => clues.get(idx).value);
  if (clueValues.length && !clueValues.every((value) => value === selected.length)) {
    setStatus(`這塊面積是 ${selected.length}，但裡面的線索不是這個數字。`, "bad");
    markRect(rect, "bad");
  } else {
    setStatus(`已框選 ${rect.w}x${rect.h}，面積 ${selected.length}。`);
  }
}

function beginDrag(event) {
  const target = event.target.closest(".cell");
  if (!target) return;
  const startIndex = Number(target.dataset.index);
  const existing = playerCells[startIndex];
  if (existing) {
    clearPlayerRect(existing);
    setStatus("已清除該色塊。");
    return;
  }

  const start = cellFromPoint(event.clientX, event.clientY);
  if (!start) return;
  drag = { start, current: start };
  boardEl.setPointerCapture(event.pointerId);
  updatePreview();
}

function moveDrag(event) {
  if (!drag) return;
  const current = cellFromPoint(event.clientX, event.clientY);
  if (!current) return;
  drag.current = current;
  updatePreview();
}

function endDrag() {
  if (!drag) return;
  const rect = normalizeRect(drag.start, drag.current);
  drag = null;
  clearBadMarks();
  placeRect(rect);
}

function updatePreview() {
  clearBadMarks();
  if (!drag) return;
  markRect(normalizeRect(drag.start, drag.current), "preview");
}

function rectSignature(indices) {
  return indices.slice().sort((a, b) => a - b).join(",");
}

function checkBoard() {
  clearBadMarks();
  const empty = playerCells.findIndex((value) => !value);
  if (empty !== -1) {
    cells[empty].classList.add("bad");
    setStatus("還有空白格沒有被矩形佔滿。", "warn");
    return false;
  }

  for (const [playerId, rect] of playerRects) {
    const clueEntries = rect.cells.filter((idx) => clues.has(idx));
    if (clueEntries.length === 0) {
      markRect(rect, "bad");
      setStatus("每個答案矩形都會有線索；這塊沒有包含任何數字。", "bad");
      return false;
    }

    for (const clueIndex of clueEntries) {
      const clue = clues.get(clueIndex);
      const answer = solution[clue.solutionId];
      const sameArea = rect.area === clue.value;
      const sameShape = rectSignature(rect.cells) === rectSignature(answer.cells);
      if (!sameArea || !sameShape) {
        markRect(rect, "bad");
        setStatus("有色塊沒有對上該數字背後的正確矩形位置。", "bad");
        return false;
      }
    }

    for (const idx of rect.cells) {
      const clue = clues.get(idx);
      if (clue && clue.value !== rect.area) {
        markRect(rect, "bad");
        setStatus("有矩形的面積和內部數字不一致。", "bad");
        return false;
      }
    }
  }

  setStatus("通關！你完整還原了這次的矩形布局。", "good");
  return true;
}

function showHint() {
  clearBadMarks();
  const unfilledClues = [...clues.entries()].filter(([idx]) => !playerCells[idx]);
  const pool = unfilledClues.length ? unfilledClues : [...clues.entries()];
  const [idx, clue] = pool[randomInt(0, pool.length - 1)];
  const answer = solution[clue.solutionId];
  markRect(answer, "hint");
  cells[idx].classList.add("hint");
  setStatus(`提示：其中一個 ${clue.value} 面積矩形已短暫標出。`, "warn");
}

function clearBoard() {
  snapshot();
  playerCells = Array(TOTAL).fill(null);
  playerRects.clear();
  clearBadMarks();
  render();
  setStatus("已清除所有玩家框選。");
}

function newPuzzle() {
  makePuzzle();
  playerCells = Array(TOTAL).fill(null);
  playerRects = new Map();
  history = [];
  nextPlayerId = 1;
  clearBadMarks();
  render();
  setStatus("新題目已產生。拖曳空白格開始框選。");
}

boardEl.addEventListener("pointerdown", beginDrag);
boardEl.addEventListener("pointermove", moveDrag);
boardEl.addEventListener("pointerup", endDrag);
boardEl.addEventListener("pointercancel", () => {
  drag = null;
  clearBadMarks();
});

checkBtn.addEventListener("click", checkBoard);
hintBtn.addEventListener("click", showHint);
undoBtn.addEventListener("click", restoreLast);
clearBtn.addEventListener("click", clearBoard);
newBtn.addEventListener("click", newPuzzle);

buildBoard();
newPuzzle();
