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
const remainingCountEl = document.querySelector("#remainingCount");
const pieceCountEl = document.querySelector("#pieceCount");
const clueCountEl = document.querySelector("#clueCount");
const statusEl = document.querySelector("#status");
const checkBtn = document.querySelector("#checkBtn");
const hintBtn = document.querySelector("#hintBtn");
const undoBtn = document.querySelector("#undoBtn");
const clearBtn = document.querySelector("#clearBtn");
const newBtn = document.querySelector("#newBtn");

const BOARD_LINE_SIZE = 2;

let cells = [];
let solution = [];
let clues = new Map();
let playerCells = Array(TOTAL).fill(null);
let playerRects = new Map();
let history = [];
let nextPlayerId = 1;
let pieceLimit = 0;
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

function validSplits(rect, vertical) {
  const limit = vertical ? rect.w : rect.h;
  const span = vertical ? rect.h : rect.w;
  const splits = [];
  for (let splitAt = 1; splitAt < limit; splitAt += 1) {
    if (splitAt * span > 1 && (limit - splitAt) * span > 1) {
      splits.push(splitAt);
    }
  }
  return splits;
}

function makePuzzle() {
  const targetPieces = randomInt(5, 12);
  const pieces = [{ x: 0, y: 0, w: SIZE, h: SIZE }];

  while (pieces.length < targetPieces) {
    const candidates = pieces
      .map((rect, i) => ({
        rect,
        i,
        verticalSplits: validSplits(rect, true),
        horizontalSplits: validSplits(rect, false),
      }))
      .filter(({ verticalSplits, horizontalSplits }) => verticalSplits.length || horizontalSplits.length)
      .sort((a, b) => area(b.rect) - area(a.rect));

    if (!candidates.length) break;

    const { rect, i, verticalSplits, horizontalSplits } =
      candidates[randomInt(0, Math.min(8, candidates.length - 1))];
    const orientations = [];
    if (verticalSplits.length) orientations.push("vertical");
    if (horizontalSplits.length) orientations.push("horizontal");
    const preferred = rect.w >= rect.h ? "vertical" : "horizontal";
    const splitVertical =
      orientations.includes(preferred) && (orientations.length === 1 || Math.random() < 0.62)
        ? preferred === "vertical"
        : orientations[randomInt(0, orientations.length - 1)] === "vertical";
    const splitAt = splitVertical
      ? verticalSplits[randomInt(0, verticalSplits.length - 1)]
      : horizontalSplits[randomInt(0, horizontalSplits.length - 1)];
    const first = splitVertical
      ? { x: rect.x, y: rect.y, w: splitAt, h: rect.h }
      : { x: rect.x, y: rect.y, w: rect.w, h: splitAt };
    const second = splitVertical
      ? { x: rect.x + splitAt, y: rect.y, w: rect.w - splitAt, h: rect.h }
      : { x: rect.x, y: rect.y + splitAt, w: rect.w, h: rect.h - splitAt };

    pieces.splice(i, 1, first, second);
  }

  solution = pieces.map((rect, id) => ({ ...rect, id, cells: rectCells(rect), area: area(rect) }));
  clues = new Map();
  const noClueId = solution.length > 1 && Math.random() < 0.28 ? randomInt(0, solution.length - 1) : -1;

  for (const rect of solution) {
    if (rect.id === noClueId) continue;

    const clueCell = shuffle([...rect.cells])[0];
    clues.set(clueCell, { value: rect.area, solutionId: rect.id });
  }

  for (const rect of solution) {
    if (rect.id === noClueId) continue;

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
  updateBoardSize();
}

function updateBoardSize() {
  if (typeof window === "undefined" || typeof getComputedStyle === "undefined") return;

  const shell = boardEl.parentElement;
  if (!shell) return;

  const shellStyle = getComputedStyle(shell);
  const shellPadding =
    parseFloat(shellStyle.paddingLeft) +
    parseFloat(shellStyle.paddingRight);
  const available = shell.clientWidth - shellPadding;
  const frame = BOARD_LINE_SIZE * 2 + BOARD_LINE_SIZE * 2 + BOARD_LINE_SIZE * (SIZE - 1);
  const maxSide = Math.min(available, window.innerHeight * 0.78, 620);
  const cell = Math.max(24, Math.floor((maxSide - frame) / SIZE));
  boardEl.style.setProperty("--board-px", `${cell * SIZE + frame}px`);
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
      const playerRect = playerRects.get(playerId);
      filled += 1;
      cell.style.setProperty("--fill", playerRect?.color ?? palette[0]);
    }

    if (clue) {
      const span = document.createElement("span");
      span.textContent = clue.value;
      cell.append(span);
      cell.classList.add("has-clue");
    }
  }

  remainingCountEl.textContent = Math.max(0, pieceLimit - playerRects.size);
  pieceCountEl.textContent = playerRects.size;
  clueCountEl.textContent = clues.size;
}

function clearBadMarks() {
  for (const cell of cells) {
    cell.classList.remove("bad", "hint", "preview");
    cell.style.removeProperty("--preview-fill");
    cell.style.removeProperty("--preview-border");
  }
}

function markRect(rect, className) {
  for (const idx of rectCells(rect)) cells[idx].classList.add(className);
}

function markPreview(rect, color) {
  for (const idx of rectCells(rect)) {
    cells[idx].classList.add("preview");
    cells[idx].style.setProperty("--preview-fill", hexToRgba(color, 0.36));
    cells[idx].style.setProperty("--preview-border", color);
  }
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    pieceLimit,
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
  pieceLimit = last.pieceLimit;
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

function nextColor() {
  const used = new Set([...playerRects.values()].map((rect) => rect.color));
  return palette.find((color) => !used.has(color)) ?? palette[playerRects.size % palette.length];
}

function placeRect(rect) {
  if (playerRects.size >= pieceLimit) {
    setStatus("可用矩形已用完，請先清除或復原一塊矩形後再框選。", "warn");
    return;
  }

  const selected = rectCells(rect);
  if (selected.length === 1) {
    setStatus("矩形面積至少要是 2，不能只框選 1 格。", "warn");
    markRect(rect, "bad");
    return;
  }

  const occupied = selected.find((idx) => playerCells[idx]);
  if (occupied) {
    setStatus("這個範圍碰到已框選色塊，先點擊該色塊清除後再框選。", "bad");
    cells[occupied].classList.add("bad");
    return;
  }

  snapshot();
  const id = nextPlayerId;
  nextPlayerId += 1;
  playerRects.set(id, { ...rect, cells: selected, area: selected.length, color: nextColor() });
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
  event.preventDefault();

  const target = event.target.closest(".cell");
  if (!target) return;
  const startIndex = Number(target.dataset.index);
  const existing = playerCells[startIndex];
  if (existing) {
    clearPlayerRect(existing);
    setStatus("已清除該色塊。");
    return;
  }

  if (playerRects.size >= pieceLimit) {
    setStatus("可用矩形已用完，請先清除或復原一塊矩形後再框選。", "warn");
    return;
  }

  const start = cellFromPoint(event.clientX, event.clientY);
  if (!start) return;
  drag = { start, current: start, color: nextColor() };
  boardEl.setPointerCapture(event.pointerId);
  updatePreview();
}

function moveDrag(event) {
  if (!drag) return;
  event.preventDefault();

  const current = cellFromPoint(event.clientX, event.clientY);
  if (!current) return;
  drag.current = current;
  updatePreview();
}

function endDrag(event) {
  event?.preventDefault();

  if (!drag) return;
  const rect = normalizeRect(drag.start, drag.current);
  drag = null;
  clearBadMarks();
  placeRect(rect);
}

function updatePreview() {
  clearBadMarks();
  if (!drag) return;
  markPreview(normalizeRect(drag.start, drag.current), drag.color);
}

function checkBoard() {
  clearBadMarks();
  if (playerRects.size > pieceLimit) {
    setStatus(`使用矩形超過上限，這題最多只能使用 ${pieceLimit} 個矩形。`, "bad");
    return false;
  }

  const empty = playerCells.findIndex((value) => !value);
  if (empty !== -1) {
    cells[empty].classList.add("bad");
    setStatus("還有空白格沒有被矩形佔滿。", "warn");
    return false;
  }

  for (const [playerId, rect] of playerRects) {
    if (rect.area === 1) {
      markRect(rect, "bad");
      setStatus("有矩形面積只有 1，請改成面積 2 以上。", "bad");
      return false;
    }

    const clueEntries = rect.cells.filter((idx) => clues.has(idx));
    for (const clueIndex of clueEntries) {
      const clue = clues.get(clueIndex);
      if (rect.area !== clue.value) {
        markRect(rect, "bad");
        setStatus("有矩形的面積和內部數字不一致。", "bad");
        return false;
      }
    }
  }

  setStatus("通關！這是一個符合所有數字線索的完整布局。", "good");
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
  setStatus(`已清除所有玩家框選，可用矩形恢復為 ${pieceLimit} 個。`);
}

function newPuzzle() {
  makePuzzle();
  pieceLimit = solution.length;
  playerCells = Array(TOTAL).fill(null);
  playerRects = new Map();
  history = [];
  nextPlayerId = 1;
  clearBadMarks();
  render();
  setStatus(`新題目已產生。你最多可以使用 ${pieceLimit} 個矩形。`);
}

boardEl.addEventListener("pointerdown", beginDrag);
boardEl.addEventListener("pointermove", moveDrag);
boardEl.addEventListener("pointerup", endDrag);
boardEl.addEventListener("pointercancel", (event) => {
  event.preventDefault();
  drag = null;
  clearBadMarks();
});
boardEl.addEventListener("selectstart", (event) => event.preventDefault());
boardEl.addEventListener("contextmenu", (event) => event.preventDefault());

checkBtn.addEventListener("click", checkBoard);
hintBtn.addEventListener("click", showHint);
undoBtn.addEventListener("click", restoreLast);
clearBtn.addEventListener("click", clearBoard);
newBtn.addEventListener("click", newPuzzle);
if (typeof window !== "undefined") {
  window.addEventListener("resize", updateBoardSize);
}

buildBoard();
newPuzzle();
