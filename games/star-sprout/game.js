const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const livesEl = document.querySelector("#lives");
const bestEl = document.querySelector("#best");
const finalScoreEl = document.querySelector("#finalScore");
const startOverlay = document.querySelector("#startOverlay");
const gameOverOverlay = document.querySelector("#gameOverOverlay");
const startBtn = document.querySelector("#startBtn");
const restartBtn = document.querySelector("#restartBtn");
const leftBtn = document.querySelector("#leftBtn");
const rightBtn = document.querySelector("#rightBtn");
const pauseBtn = document.querySelector("#pauseBtn");

const W = canvas.width;
const H = canvas.height;
const FLOOR_Y = H - 185;
const STORAGE_KEY = "starSproutBest";

const state = {
  running: false,
  paused: false,
  gameOver: false,
  score: 0,
  lives: 3,
  best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  lastTime: 0,
  spawnTimer: 0,
  hazardTimer: 0,
  petalTimer: 0,
  wind: 0,
  keys: new Set(),
  pointerActive: false,
  pointerX: W / 2,
  basket: {
    x: W / 2,
    y: FLOOR_Y,
    w: 174,
    h: 88,
    vx: 0,
  },
  items: [],
  particles: [],
  hills: [],
};

bestEl.textContent = state.best;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resetGame() {
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  state.score = 0;
  state.lives = 3;
  state.spawnTimer = 0.2;
  state.hazardTimer = 1.2;
  state.petalTimer = 5;
  state.wind = 0;
  state.items = [];
  state.particles = [];
  state.basket.x = W / 2;
  state.basket.vx = 0;
  state.lastTime = performance.now();
  startOverlay.classList.remove("is-visible");
  gameOverOverlay.classList.remove("is-visible");
  syncHud();
}

function syncHud() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
  bestEl.textContent = state.best;
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  state.best = Math.max(state.best, state.score);
  localStorage.setItem(STORAGE_KEY, String(state.best));
  finalScoreEl.textContent = `你採到了 ${state.score} 分的星芽。`;
  gameOverOverlay.classList.add("is-visible");
  syncHud();
}

function createItem(type) {
  const speedBonus = Math.min(260, state.score * 1.4);
  const common = {
    type,
    x: rand(70, W - 70),
    y: -80,
    r: type === "hazard" ? rand(24, 34) : rand(25, 40),
    vy: rand(170, 250) + speedBonus,
    vx: rand(-32, 32),
    spin: rand(-2.2, 2.2),
    angle: rand(0, Math.PI * 2),
    caught: false,
  };

  if (type === "sprout") {
    common.points = 10;
    common.color = Math.random() > 0.42 ? "#f9dc5c" : "#77dca4";
  }

  if (type === "petal") {
    common.points = 35;
    common.color = "#ff9f80";
    common.vy *= 0.9;
  }

  return common;
}

function burst(x, y, color, count = 14) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: rand(-120, 120),
      vy: rand(-180, -45),
      life: rand(0.35, 0.8),
      maxLife: 0.8,
      size: rand(4, 10),
      color,
    });
  }
}

function update(dt) {
  if (!state.running || state.paused) return;

  state.wind += dt * 0.55;
  const targetWind = Math.sin(state.wind) * 28;
  let input = 0;
  if (state.keys.has("ArrowLeft") || state.keys.has("a")) input -= 1;
  if (state.keys.has("ArrowRight") || state.keys.has("d")) input += 1;
  if (leftBtn.classList.contains("is-pressed")) input -= 1;
  if (rightBtn.classList.contains("is-pressed")) input += 1;

  if (state.pointerActive) {
    state.basket.x += (state.pointerX - state.basket.x) * clamp(dt * 12, 0, 1);
  } else {
    state.basket.vx = input * 560;
    state.basket.x += state.basket.vx * dt;
  }

  state.basket.x = clamp(state.basket.x, state.basket.w / 2 + 18, W - state.basket.w / 2 - 18);

  const difficulty = Math.min(0.55, state.score / 900);
  state.spawnTimer -= dt;
  state.hazardTimer -= dt;
  state.petalTimer -= dt;

  if (state.spawnTimer <= 0) {
    state.items.push(createItem("sprout"));
    state.spawnTimer = rand(0.45, 0.82) - difficulty * 0.28;
  }

  if (state.hazardTimer <= 0) {
    state.items.push(createItem("hazard"));
    state.hazardTimer = rand(1.08, 1.7) - difficulty * 0.42;
  }

  if (state.petalTimer <= 0) {
    state.items.push(createItem("petal"));
    state.petalTimer = rand(7, 10);
  }

  const basket = state.basket;
  for (const item of state.items) {
    item.angle += item.spin * dt;
    item.x += (item.vx + targetWind) * dt;
    item.y += item.vy * dt;

    const insideX = item.x > basket.x - basket.w * 0.48 && item.x < basket.x + basket.w * 0.48;
    const insideY = item.y + item.r > basket.y - basket.h * 0.34 && item.y < basket.y + basket.h * 0.36;

    if (!item.caught && insideX && insideY) {
      item.caught = true;
      if (item.type === "hazard") {
        state.lives -= 1;
        burst(item.x, item.y, "#8260ad", 18);
        if (state.lives <= 0) endGame();
      } else {
        state.score += item.points;
        burst(item.x, item.y, item.color, item.type === "petal" ? 22 : 14);
      }
      syncHud();
    }
  }

  state.items = state.items.filter((item) => item.y < H + 120 && !item.caught);

  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 420 * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}

function drawBackground(time) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#9bd9ed");
  sky.addColorStop(0.54, "#f7d88b");
  sky.addColorStop(1, "#f4a06e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W - 148, 128);
  ctx.rotate(Math.sin(time * 0.0005) * 0.04);
  ctx.fillStyle = "#fff0a8";
  ctx.beginPath();
  ctx.arc(0, 0, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.beginPath();
  ctx.arc(-24, -18, 18, 0, Math.PI * 2);
  ctx.arc(18, 18, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawCloud(148 + Math.sin(time * 0.0004) * 18, 168, 1.05);
  drawCloud(602 + Math.sin(time * 0.00032) * 28, 248, 0.82);

  drawHill(0, 745, 420, 280, "#8fca82");
  drawHill(360, 760, 550, 255, "#6fb17a");
  drawHill(-90, 850, 600, 310, "#4f9b72");

  ctx.fillStyle = "#79b86d";
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y + 70);
  ctx.bezierCurveTo(180, FLOOR_Y + 28, 340, FLOOR_Y + 98, 520, FLOOR_Y + 52);
  ctx.bezierCurveTo(680, FLOOR_Y + 12, 790, FLOOR_Y + 86, W, FLOOR_Y + 38);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  for (let x = 22; x < W; x += 74) {
    drawFlower(x, FLOOR_Y + 104 + Math.sin(x) * 14, x % 3 === 0 ? "#ffde6a" : "#fff4b8");
  }
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 252, 232, 0.82)";
  ctx.beginPath();
  ctx.arc(-50, 13, 35, 0, Math.PI * 2);
  ctx.arc(-10, -8, 45, 0, Math.PI * 2);
  ctx.arc(40, 12, 34, 0, Math.PI * 2);
  ctx.rect(-58, 8, 110, 42);
  ctx.fill();
  ctx.restore();
}

function drawHill(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, Math.PI, 0, true);
  ctx.lineTo(x + w, H);
  ctx.lineTo(x, H);
  ctx.closePath();
  ctx.fill();
}

function drawFlower(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#2f8d6c";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 35);
  ctx.quadraticCurveTo(8, 8, 0, -15);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i += 1) {
    ctx.rotate((Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -22, 9, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#e67d5d";
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawItem(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.angle);

  if (item.type === "hazard") {
    ctx.fillStyle = "#7d5aa8";
    ctx.beginPath();
    ctx.moveTo(0, -item.r * 1.25);
    ctx.bezierCurveTo(item.r * 0.95, -item.r * 0.2, item.r * 0.7, item.r * 1.1, 0, item.r * 1.15);
    ctx.bezierCurveTo(-item.r * 0.7, item.r * 1.1, -item.r * 0.95, -item.r * 0.2, 0, -item.r * 1.25);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(-item.r * 0.23, -item.r * 0.22, item.r * 0.15, item.r * 0.34, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === "petal") {
    ctx.fillStyle = "#ff9f80";
    ctx.beginPath();
    ctx.ellipse(0, 0, item.r * 0.72, item.r * 1.16, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(161, 82, 65, 0.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-item.r * 0.15, -item.r * 0.8);
    ctx.quadraticCurveTo(item.r * 0.18, 0, -item.r * 0.05, item.r * 0.85);
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(255, 247, 166, 0.62)";
    ctx.beginPath();
    ctx.arc(0, 0, item.r * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = item.color;
    starPath(0, 0, item.r, item.r * 0.46, 6);
    ctx.fill();
    ctx.fillStyle = "#2f8d6c";
    ctx.beginPath();
    ctx.ellipse(item.r * 0.28, -item.r * 0.55, item.r * 0.18, item.r * 0.34, -0.65, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function starPath(x, y, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI * i) / points;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawBasket() {
  const b = state.basket;
  ctx.save();
  ctx.translate(b.x, b.y);

  ctx.strokeStyle = "#6f4a2d";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.arc(0, -30, 78, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  const body = ctx.createLinearGradient(0, -30, 0, 58);
  body.addColorStop(0, "#e8a85d");
  body.addColorStop(1, "#b7663f");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-92, -12);
  ctx.quadraticCurveTo(-78, 74, 0, 80);
  ctx.quadraticCurveTo(78, 74, 92, -12);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(111, 74, 45, 0.42)";
  ctx.lineWidth = 5;
  for (let x = -60; x <= 60; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, -5);
    ctx.quadraticCurveTo(x * 0.55, 34, x * 0.2, 72);
    ctx.stroke();
  }

  ctx.fillStyle = "#f5cf84";
  ctx.beginPath();
  ctx.ellipse(0, -13, 100, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7f5031";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.restore();
}

function drawParticles() {
  for (const p of state.particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawPaused() {
  if (!state.paused || state.gameOver) return;
  ctx.fillStyle = "rgba(40, 50, 63, 0.22)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff8ea";
  ctx.font = "800 78px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("暫停", W / 2, H / 2);
}

function draw(time) {
  drawBackground(time);
  for (const item of state.items) drawItem(item);
  drawParticles();
  drawBasket();
  drawPaused();
}

function frame(time) {
  const dt = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
  state.lastTime = time;
  update(dt);
  draw(time);
  requestAnimationFrame(frame);
}

function setButton(button, pressed) {
  button.classList.toggle("is-pressed", pressed);
}

function canvasToGameX(clientX) {
  const rect = canvas.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * W;
}

startBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", resetGame);

pauseBtn.addEventListener("click", () => {
  if (!state.running || state.gameOver) return;
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? "▶" : "Ⅱ";
});

for (const [button, direction] of [
  [leftBtn, "left"],
  [rightBtn, "right"],
]) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setButton(button, true);
  });
  button.addEventListener("pointerup", () => setButton(button, false));
  button.addEventListener("pointercancel", () => setButton(button, false));
  button.addEventListener("lostpointercapture", () => setButton(button, false));
  button.dataset.direction = direction;
}

canvas.addEventListener("pointerdown", (event) => {
  if (!state.running && !state.gameOver) return;
  state.pointerActive = true;
  state.pointerX = canvasToGameX(event.clientX);
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.pointerActive) return;
  state.pointerX = canvasToGameX(event.clientX);
});

canvas.addEventListener("pointerup", () => {
  state.pointerActive = false;
});

canvas.addEventListener("pointercancel", () => {
  state.pointerActive = false;
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "a", "d", " "].includes(key)) event.preventDefault();
  if (event.key === " ") {
    if (!state.running) resetGame();
    else pauseBtn.click();
    return;
  }
  state.keys.add(key === "arrowleft" ? "ArrowLeft" : key === "arrowright" ? "ArrowRight" : key);
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  state.keys.delete(key === "arrowleft" ? "ArrowLeft" : key === "arrowright" ? "ArrowRight" : key);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.running && !state.gameOver) {
    state.paused = true;
    pauseBtn.textContent = "▶";
  }
});

draw(performance.now());
requestAnimationFrame(frame);
