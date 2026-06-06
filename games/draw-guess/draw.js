const generalPromptNames = [
  '貓咪', '狗狗', '兔子', '熊貓', '獅子', '老虎', '長頸鹿', '大象', '企鵝', '鯨魚',
  '海豚', '章魚', '螃蟹', '蝴蝶', '蜜蜂', '恐龍', '龍', '幽靈', '外星人', '機器人',
  '太陽', '月亮', '星星', '彩虹', '雲朵', '閃電', '雪人', '火山', '海浪', '森林',
  '蘋果', '香蕉', '草莓', '西瓜', '鳳梨', '葡萄', '披薩', '漢堡', '薯條', '壽司',
  '蛋糕', '甜甜圈', '冰淇淋', '咖啡', '珍珠奶茶', '便當', '火鍋', '爆米花', '餅乾', '糖果',
  '飛機', '火箭', '汽車', '公車', '火車', '腳踏車', '摩托車', '船', '熱氣球', '降落傘',
  '手機', '電腦', '相機', '電視', '耳機', '鍵盤', '滑鼠', '手錶', '電風扇', '冰箱',
  '雨傘', '眼鏡', '書包', '鉛筆', '剪刀', '牙刷', '鞋子', '帽子', '皇冠', '禮物',
  '吉他', '鋼琴', '麥克風', '籃球', '棒球', '足球', '羽毛球', '獎盃', '風箏', '溜滑梯',
  '城堡', '房子', '橋', '燈塔', '摩天輪', '旋轉木馬', '金字塔', '寶箱', '海盜船', '太空船',
  '醫生', '老師', '廚師', '消防員', '警察', '忍者', '魔法師', '超人', '公主', '國王',
  '微笑', '哭泣', '生氣', '睡覺', '跳舞', '唱歌', '跑步', '游泳', '釣魚', '露營'
];

const promptPools = {
  general: generalPromptNames.map((answer) => ({ answer, aliases: [] })),
  chiikawa: [
    { answer: '吉伊卡哇', aliases: ['吉伊', '小可愛', 'ちいかわ', 'chiikawa'] },
    { answer: '小八貓', aliases: ['小八', '哈奇喵', '八字貓', 'ハチワレ', 'hachiware'] },
    { answer: '兔兔', aliases: ['兔哥', '兔子', '烏薩奇', '537', 'うさぎ', 'usagi'] },
    { answer: '小桃鼠/飛鼠', aliases: ['小桃鼠', '飛鼠', '小桃', '莫莫咖', '毛毛力', 'モモンガ', 'momonga'] },
    { answer: '海獺', aliases: ['海獺勇者', '海獺師傅', '師傅', '獺師', 'ラッコ', 'rakko'] },
    { answer: '栗子饅頭', aliases: ['栗子饅頭前輩', '栗饅頭', '布丁狗前輩', 'くりまんじゅう'] },
    { answer: '風獅', aliases: ['風獅爺', '獅薩', '翼德', 'シーサー'] },
    { answer: '古本屋', aliases: ['古本', '舊書攤', '卡尼', '小螃蟹', '古本屋先生', 'カニ'] },
    { answer: '勞動盔甲先生', aliases: ['勞動鎧甲先生', '工作鎧甲', '勞動鎧甲', '労働の鎧さん'] },
    { answer: '手拿包盔甲先生', aliases: ['手拿包鎧甲先生', '手拿包盔甲', '手拿包鎧甲', 'ポシェットの鎧さん'] },
    { answer: '拉麵盔甲先生', aliases: ['拉麵鎧甲先生', '拉麵鎧甲', '拉麵盔甲', '郎鎧甲', 'ラーメンの鎧さん'] },
    { answer: '偉大盔甲先生', aliases: ['偉大鎧甲先生', '偉大的盔甲先生', '偉い鎧さん'] },
    { answer: '草盔甲先生', aliases: ['草鎧甲先生', '割草盔甲', '草の鎧さん'] },
    { answer: '章魚燒盔甲先生', aliases: ['章魚燒鎧甲先生', '章魚燒盔甲', 'たこ焼きの鎧さん'] },
    { answer: '店員盔甲先生', aliases: ['店員鎧甲先生', '店員盔甲', '店員の鎧さん'] },
    { answer: '刨冰盔甲先生', aliases: ['刨冰鎧甲先生', '刨冰盔甲', 'かき氷の鎧さん'] },
    { answer: '湯豆腐盔甲先生', aliases: ['湯豆腐鎧甲先生', '湯豆腐盔甲', '湯豆腐の鎧さん'] },
    { answer: '拉麵山盔甲先生', aliases: ['拉麵山鎧甲先生', '拉麵山盔甲', 'ラーメン山の鎧さん'] },
    { answer: '奇美拉', aliases: ['合成獸', 'キメラ'] },
    { answer: '那孩子', aliases: ['那個孩子', 'あのこ'] },
    { answer: '睡衣派對仔', aliases: ['睡衣派對', 'パジャマパーティーズ'] },
    { answer: '小綠', aliases: ['睡衣派對小綠'] },
    { answer: '粉紅', aliases: ['睡衣派對粉紅'] },
    { answer: '小白', aliases: ['睡衣派對小白'] },
    { answer: '小紫', aliases: ['睡衣派對小紫'] },
    { answer: '小甲蟲/蟲子', aliases: ['小甲蟲', '蟲子', '昆蟲'] },
    { answer: '大強', aliases: ['巨大討伐對象', '討伐對象'] },
    { answer: '黑色流星', aliases: ['流星', '黑流星'] }
  ]
};

const promptText = document.getElementById('promptText');
const timerText = document.getElementById('timerText');
const startBtn = document.getElementById('startBtn');
const clearBtn = document.getElementById('clearBtn');
const promptCard = document.querySelector('.prompt-card');
const themeSelect = document.getElementById('themeSelect');
const phaseMessage = document.getElementById('phaseMessage');
const guessInput = document.getElementById('guessInput');
const submitBtn = document.getElementById('submitBtn');
const resultText = document.getElementById('resultText');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

let currentPrompt = null;
let currentTheme = 'general';
let previousPromptByTheme = { general: '', chiikawa: '' };
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

function getAnswerList(prompt) {
  return [prompt.answer, ...prompt.aliases].map(normalizeAnswer);
}

function isAcceptedAnswer(prompt, guess, theme) {
  const answers = getAnswerList(prompt);

  if (answers.includes(guess)) {
    return true;
  }

  if (theme !== 'chiikawa' || guess.length < 2) {
    return false;
  }

  return answers.some((answer) => {
    if (answer.length < 2) return false;
    return answer.includes(guess) || guess.includes(answer);
  });
}

function getCurrentTheme() {
  return themeSelect.value in promptPools ? themeSelect.value : 'general';
}

function pickPrompt() {
  const theme = getCurrentTheme();
  const pool = promptPools[theme];
  let nextPrompt = pool[Math.floor(Math.random() * pool.length)];

  while (pool.length > 1 && nextPrompt.answer === previousPromptByTheme[theme]) {
    nextPrompt = pool[Math.floor(Math.random() * pool.length)];
  }

  previousPromptByTheme[theme] = nextPrompt.answer;
  currentTheme = theme;
  return nextPrompt;
}

function startGame() {
  currentPrompt = pickPrompt();
  timeLeft = 15;
  canDraw = true;
  drawing = false;
  lastPoint = null;

  resetCanvas();
  promptText.textContent = currentPrompt.answer;
  promptCard.classList.remove('hidden-answer');
  phaseMessage.classList.add('hidden');
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
  phaseMessage.classList.remove('hidden');
  guessInput.disabled = false;
  submitBtn.disabled = false;
  clearBtn.disabled = true;
  guessInput.placeholder = '請輸入猜測答案';
  guessInput.focus();
}

function submitGuess() {
  const guess = normalizeAnswer(guessInput.value);

  resultText.className = 'result';

  if (!currentPrompt) {
    resultText.textContent = '請先按開始出題。';
    resultText.classList.add('wrong');
    return;
  }

  if (!guess) {
    resultText.textContent = '請輸入答案再送出。';
    resultText.classList.add('wrong');
    return;
  }

  if (isAcceptedAnswer(currentPrompt, guess, currentTheme)) {
    resultText.textContent = `答對了！答案是「${currentPrompt.answer}」。`;
    resultText.classList.add('correct');
  } else {
    resultText.textContent = `答錯了，正確答案是「${currentPrompt.answer}」。`;
    resultText.classList.add('wrong');
  }

  promptCard.classList.remove('hidden-answer');
  phaseMessage.classList.add('hidden');
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
