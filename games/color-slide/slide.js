const COLORS = {
  red: { label: "紅", value: "#d9525f" },
  blue: { label: "藍", value: "#4b86d9" },
  green: { label: "綠", value: "#4f9f70" },
  yellow: { label: "黃", value: "#d4a72c" },
  purple: { label: "紫", value: "#8b63c7" },
};

const LEVELS = [
  {
    size: 5,
    par: 6,
    walls: ["2,2"],
    blocks: [
      { id: "A", color: "red", x: 1, y: 3 },
      { id: "B", color: "blue", x: 3, y: 1 },
    ],
    targets: [
      { color: "red", x: 3, y: 3 },
      { color: "blue", x: 1, y: 1 },
    ],
  },
  {
    size: 6,
    par: 9,
    walls: ["2,2", "3,2", "2,3"],
    blocks: [
      { id: "A", color: "red", x: 1, y: 4 },
      { id: "B", color: "blue", x: 4, y: 4 },
      { id: "C", color: "green", x: 4, y: 1 },
    ],
    targets: [
      { color: "red", x: 4, y: 3 },
      { color: "blue", x: 1, y: 1 },
      { color: "green", x: 3, y: 4 },
    ],
  },
  {
    size: 6,
    par: 11,
    walls: ["1,2", "2,2", "4,2", "4,3", "2,4"],
    blocks: [
      { id: "A", color: "red", x: 1, y: 1 },
      { id: "B", color: "yellow", x: 4, y: 4 },
    ],
    targets: [
      { color: "red", x: 4, y: 1 },
      { color: "yellow", x: 1, y: 4 },
    ],
  },
  {
    size: 7,
    par: 13,
    walls: ["3,1", "3,2", "3,4", "3,5", "1,3", "5,3"],
    blocks: [
      { id: "A", color: "red", x: 1, y: 5 },
      { id: "B", color: "blue", x: 5, y: 5 },
      { id: "C", color: "green", x: 5, y: 1 },
    ],
    targets: [
      { color: "red", x: 1, y: 1 },
      { color: "blue", x: 5, y: 2 },
      { color: "green", x: 1, y: 4 },
    ],
  },
  {
    size: 7,
    par: 15,
    walls: ["2,1", "4,1", "2,2", "4,2", "3,3", "2,4", "4,4", "2,5", "4,5"],
    blocks: [
      { id: "A", color: "red", x: 1, y: 5 },
      { id: "B", color: "blue", x: 5, y: 1 },
      { id: "C", color: "yellow", x: 5, y: 5 },
    ],
    targets: [
      { color: "red", x: 5, y: 3 },
      { color: "blue", x: 1, y: 3 },
      { color: "yellow", x: 3, y: 1 },
    ],
  },
  {
    size: 7,
    par: 24,
    walls: ["2,1", "4,1", "2,2", "4,2", "1,3", "5,3", "2,4", "4,4", "2,5", "4,5"],
    blocks: [
      { id: "A", color: "red", x: 1, y: 5 },
      { id: "B", color: "blue", x: 5, y: 5 },
      { id: "C", color: "green", x: 5, y: 1 },
    ],
    targets: [
      { color: "red", x: 5, y: 1 },
      { color: "blue", x: 1, y: 1 },
      { color: "green", x: 3, y: 5 },
    ],
  },
  {
    size: 6,
    par: 21,
    walls: ["2,2", "3,2", "1,3", "4,3"],
    blocks: [
      { id: "A", color: "purple", x: 1, y: 4 },
      { id: "B", color: "blue", x: 4, y: 4 },
      { id: "C", color: "green", x: 4, y: 1 },
    ],
    targets: [
      { color: "purple", x: 4, y: 1 },
      { color: "blue", x: 1, y: 1 },
      { color: "green", x: 2, y: 4 },
    ],
  },
  {
    size: 6,
    par: 19,
    walls: ["2,2", "3,2", "2,3"],
    blocks: [
      { id: "A", color: "purple", x: 1, y: 4 },
      { id: "B", color: "yellow", x: 4, y: 4 },
      { id: "C", color: "green", x: 4, y: 1 },
    ],
    targets: [
      { color: "purple", x: 1, y: 1 },
      { color: "yellow", x: 4, y: 1 },
      { color: "green", x: 4, y: 4 },
    ],
  },
];

const DIRS = {
  up: { x: 0, y: -1, name: "上" },
  down: { x: 0, y: 1, name: "下" },
  left: { x: -1, y: 0, name: "左" },
  right: { x: 1, y: 0, name: "右" },
};

const STORAGE_KEY = "color-slide-progress-v1";

const boardEl = document.querySelector("#board");
const levelText = document.querySelector("#levelText");
const moveText = document.querySelector("#moveText");
const bestText = document.querySelector("#bestText");
const statusText = document.querySelector("#statusText");
const levelPicker = document.querySelector("#levelPicker");
const undoBtn = document.querySelector("#undoBtn");
const resetBtn = document.querySelector("#resetBtn");
const hintBtn = document.querySelector("#hintBtn");
const nextBtn = document.querySelector("#nextBtn");

let levelIndex = 0;
let blocks = [];
let moves = 0;
let history = [];
let progress = loadProgress();
let touchStart = null;

function keyOf(x, y) {
  return `${x},${y}`;
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

function cloneBlocks(source = blocks) {
  return source.map((block) => ({ ...block }));
}

function setStatus(text, type = "") {
  statusText.textContent = text;
  statusText.className = type;
}

function loadLevel(index) {
  levelIndex = (index + LEVELS.length) % LEVELS.length;
  const level = LEVELS[levelIndex];
  blocks = cloneBlocks(level.blocks);
  moves = 0;
  history = [];
  boardEl.style.setProperty("--size", level.size);
  renderLevelPicker();
  render();
  setStatus(`第 ${levelIndex + 1} 關，目標步數 ${level.par}。`);
  boardEl.focus({ preventScroll: true });
}

function renderLevelPicker() {
  levelPicker.textContent = "";
  LEVELS.forEach((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(index + 1);
    button.className = [
      index === levelIndex ? "active" : "",
      progress.solved.includes(index) ? "solved" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.setAttribute("aria-label", `第 ${index + 1} 關`);
    button.addEventListener("click", () => loadLevel(index));
    levelPicker.append(button);
  });
}

function render() {
  const level = LEVELS[levelIndex];
  const targetByCell = new Map(level.targets.map((target) => [keyOf(target.x, target.y), target]));
  const blockByCell = new Map(blocks.map((block) => [keyOf(block.x, block.y), block]));
  boardEl.textContent = "";

  for (let y = 0; y < level.size; y += 1) {
    for (let x = 0; x < level.size; x += 1) {
      const cell = document.createElement("div");
      const wall = level.walls.includes(keyOf(x, y));
      const target = targetByCell.get(keyOf(x, y));
      const block = blockByCell.get(keyOf(x, y));

      cell.className = "cell";
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);

      if (wall) cell.classList.add("wall");
      if (target) {
        cell.classList.add("target");
        cell.style.setProperty("--target", COLORS[target.color].value);
        cell.setAttribute("aria-label", `${COLORS[target.color].label}色目標`);
      }
      if (block) {
        if (target?.color === block.color) cell.classList.add("done");
        const blockEl = document.createElement("span");
        blockEl.className = `block ${target?.color === block.color ? "settled" : ""}`;
        blockEl.style.setProperty("--block", COLORS[block.color].value);
        blockEl.setAttribute("aria-label", `${COLORS[block.color].label}色磚塊`);
        cell.append(blockEl);
      }

      boardEl.append(cell);
    }
  }

  levelText.textContent = String(levelIndex + 1);
  moveText.textContent = String(moves);
  bestText.textContent = progress.best[levelIndex] ?? "--";
  nextBtn.disabled = !isSolved();
  updateBoardSize();
}

function updateBoardSize() {
  const shell = boardEl.parentElement;
  if (!shell) return;
  const shellStyle = getComputedStyle(shell);
  const shellPadding = parseFloat(shellStyle.paddingLeft) + parseFloat(shellStyle.paddingRight);
  const available = shell.clientWidth - shellPadding;
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const mobile = viewportWidth <= 620;
  const mobileWidth = Math.max(260, viewportWidth - 36);
  const side = Math.min(available, viewportHeight * (mobile ? 0.58 : 0.76), mobile ? mobileWidth : 620);
  boardEl.style.setProperty("--board-px", `${Math.floor(side)}px`);
}

function canOccupy(x, y, movingId, occupied) {
  const level = LEVELS[levelIndex];
  if (x < 0 || y < 0 || x >= level.size || y >= level.size) return false;
  if (level.walls.includes(keyOf(x, y))) return false;
  const occupant = occupied.get(keyOf(x, y));
  return !occupant || occupant === movingId;
}

function move(dirName) {
  if (isSolved()) return;
  const dir = DIRS[dirName];
  const before = cloneBlocks();
  const next = resolveOneStep(dir);
  const changed = next.some((block, index) => block.x !== blocks[index].x || block.y !== blocks[index].y);

  if (!changed) {
    setStatus(`往${dir.name}被擋住了。`, "warn");
    return;
  }

  history.push({ blocks: before, moves });
  blocks = next;
  moves += 1;
  render();

  if (isSolved()) {
    finishLevel();
  } else {
    setStatus(`往${dir.name}移動。`);
  }
}

function resolveOneStep(dir) {
  const level = LEVELS[levelIndex];
  const startByCell = new Map(blocks.map((block) => [keyOf(block.x, block.y), block.id]));
  const byId = new Map(blocks.map((block) => [block.id, block]));
  const proposals = new Map();

  for (const block of blocks) {
    const nx = block.x + dir.x;
    const ny = block.y + dir.y;
    const blocked =
      nx < 0 || ny < 0 || nx >= level.size || ny >= level.size || level.walls.includes(keyOf(nx, ny));
    proposals.set(block.id, blocked ? { x: block.x, y: block.y } : { x: nx, y: ny });
  }

  let changed = true;
  while (changed) {
    changed = false;
    const destinationCounts = new Map();

    for (const [id, pos] of proposals) {
      const block = byId.get(id);
      if (pos.x === block.x && pos.y === block.y) continue;
      const key = keyOf(pos.x, pos.y);
      destinationCounts.set(key, (destinationCounts.get(key) ?? 0) + 1);
    }

    for (const [id, pos] of proposals) {
      const block = byId.get(id);
      if (pos.x === block.x && pos.y === block.y) continue;

      const posKey = keyOf(pos.x, pos.y);
      const occupantId = startByCell.get(posKey);
      const occupantProposal = occupantId ? proposals.get(occupantId) : null;
      const occupant = occupantId ? byId.get(occupantId) : null;
      const duplicateDestination = destinationCounts.get(posKey) > 1;
      const occupiedByStillBlock =
        occupant &&
        occupantId !== id &&
        occupantProposal.x === occupant.x &&
        occupantProposal.y === occupant.y;

      if (duplicateDestination || occupiedByStillBlock) {
        proposals.set(id, { x: block.x, y: block.y });
        changed = true;
      }
    }
  }

  return blocks.map((block) => ({ ...block, ...proposals.get(block.id) }));
}

function isSolved() {
  const level = LEVELS[levelIndex];
  return blocks.every((block) =>
    level.targets.some((target) => target.color === block.color && target.x === block.x && target.y === block.y),
  );
}

function finishLevel() {
  const oldBest = progress.best[levelIndex];
  if (!oldBest || moves < oldBest) progress.best[levelIndex] = moves;
  if (!progress.solved.includes(levelIndex)) progress.solved.push(levelIndex);
  saveProgress();
  renderLevelPicker();
  render();
  const level = LEVELS[levelIndex];
  const message =
    moves <= level.par
      ? `漂亮，第 ${levelIndex + 1} 關 ${moves} 步完成。`
      : `過關，第 ${levelIndex + 1} 關 ${moves} 步完成。`;
  setStatus(message, "good");
}

function undo() {
  const last = history.pop();
  if (!last) {
    setStatus("沒有可以撤回的步驟。", "warn");
    return;
  }
  blocks = last.blocks;
  moves = last.moves;
  render();
  setStatus("已撤回上一動。");
}

function showHint() {
  const unsettled = blocks.find((block) => {
    const level = LEVELS[levelIndex];
    return !level.targets.some((target) => target.color === block.color && target.x === block.x && target.y === block.y);
  });
  if (!unsettled) {
    setStatus("所有磚塊都已經對位。", "good");
    return;
  }
  const level = LEVELS[levelIndex];
  const target = level.targets.find((item) => item.color === unsettled.color);
  const horizontal = target.x > unsettled.x ? "右" : target.x < unsettled.x ? "左" : "";
  const vertical = target.y > unsettled.y ? "下" : target.y < unsettled.y ? "上" : "";
  setStatus(`${COLORS[unsettled.color].label}色磚塊還要靠近 ${horizontal}${vertical || "目標"}。`, "warn");
  const cell = [...boardEl.children].find(
    (item) => Number(item.dataset.x) === unsettled.x && Number(item.dataset.y) === unsettled.y,
  );
  cell?.querySelector(".block")?.classList.add("hint");
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

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => move(button.dataset.dir));
});

undoBtn.addEventListener("click", undo);
resetBtn.addEventListener("click", () => loadLevel(levelIndex));
hintBtn.addEventListener("click", showHint);
nextBtn.addEventListener("click", () => loadLevel(levelIndex + 1));
window.addEventListener("keydown", handleKey);
window.addEventListener("resize", updateBoardSize);
window.visualViewport?.addEventListener("resize", updateBoardSize);
boardEl.addEventListener("pointerdown", handlePointerDown);
boardEl.addEventListener("pointerup", handlePointerUp);
boardEl.addEventListener("pointercancel", () => {
  touchStart = null;
});

loadLevel(0);
