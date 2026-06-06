const prompts = [
  '貓咪', '狗狗', '飛機', '太陽', '月亮', '雨傘', '腳踏車', '披薩', '漢堡', '火箭',
  '電腦', '手機', '機器人', '鯨魚', '恐龍', '城堡', '皇冠', '吉他', '雪人', '咖啡',
  '蘋果', '花朵', '眼鏡', '書包', '鉛筆', '海盜船', '企鵝', '蛋糕', '幽靈', '棒球'
];

const promptText = document.getElementById('promptText');
const timerText = document.getElementById('timerText');
const startBtn = document.getElementById('startBtn');
const clearBtn = document.getElementById('clearBtn');
const promptCard = document.querySelector('.prompt-card');
const lockOverlay = document.getElementById('lockOverlay');
const guessInput = document.getElementById('guessInput');
const submitBtn = document.getElementById('submitBtn');
const resultText = document.getElementById('resultText');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

let currentPrompt = '';
let timer = null;
let timeLeft = 15;
let canDraw = false;
let drawing = false;
let lastPoint = null;

function resetCanvas() {
  ctx.fillStyle = '#fffefa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function normalizeAnswer(value) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

function pickPrompt() {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function startGame() {
  currentPrompt = pickPrompt();
  timeLeft = 15;
  canDraw = true;
  drawing = false;
  lastPoint = null;

  resetCanvas();
  promptText.textContent = currentPrompt;
  promptCard.classList.remove('hidden-answer');
  lockOverlay.classList.add('hidden');
  timerText.textContent = timeLeft;
  guessInput.value = '';
  guessInput.disabled = true;
  submitBtn.disabled = true;
  resultText.textContent = '';
  resultText.className = 'result';
  clearBtn.disabled = false;
  startBtn.textContent = '重新開始';

  window.clearInterval(timer);
  timer = window.setInterval(() => {
    timeLeft -= 1;
    timerText.textContent = timeLeft;

    if (timeLeft <= 0) {
      finishDrawingPhase();
    }
  }, 1000);
}

function finishDrawingPhase() {
  window.clearInterval(timer);
  canDraw = false;
  drawing = false;
  promptCard.classList.add('hidden-answer');
  lockOverlay.classList.remove('hidden');
  guessInput.disabled = false;
  submitBtn.disabled = false;
  clearBtn.disabled = true;
  guessInput.placeholder = '請輸入答案';
  guessInput.focus();
}

function submitGuess() {
  const guess = normalizeAnswer(guessInput.value);
  const answer = normalizeAnswer(currentPrompt);

  resultText.className = 'result';

  if (!currentPrompt) {
    resultText.textContent = '請先按開始。';
    resultText.classList.add('wrong');
    return;
  }

  if (!guess) {
    resultText.textContent = '請輸入答案。';
    resultText.classList.add('wrong');
    return;
  }

  if (guess === answer) {
    resultText.textContent = `答對了！答案是「${currentPrompt}」。`;
    resultText.classList.add('correct');
  } else {
    resultText.textContent = `答錯了，正確答案是「${currentPrompt}」。`;
    resultText.classList.add('wrong');
  }

  promptCard.classList.remove('hidden-answer');
  guessInput.disabled = true;
  submitBtn.disabled = true;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const source = event.touches ? event.touches[0] : event;
  return {
    x: ((source.clientX - rect.left) / rect.width) * canvas.width,
    y: ((source.clientY - rect.top) / rect.height) * canvas.height
  };
}

function beginDraw(event) {
  if (!canDraw) return;
  event.preventDefault();
  drawing = true;
  lastPoint = getCanvasPoint(event);
}

function draw(event) {
  if (!canDraw || !drawing || !lastPoint) return;
  event.preventDefault();

  const point = getCanvasPoint(event);
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = Number(brushSize.value);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  lastPoint = point;
}

function endDraw() {
  drawing = false;
  lastPoint = null;
}

startBtn.addEventListener('click', startGame);
clearBtn.addEventListener('click', resetCanvas);
submitBtn.addEventListener('click', submitGuess);
guessInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') submitGuess();
});

canvas.addEventListener('mousedown', beginDraw);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', endDraw);
canvas.addEventListener('touchstart', beginDraw, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', endDraw);

resetCanvas();
clearBtn.disabled = true;
