const generalPromptNames = [
  // 動物
  '河馬', '犀牛', '斑馬', '袋鼠', '無尾熊', '猴子', '猩猩', '狐狸', '狼', '松鼠',
  '刺蝟', '水獺', '浣熊', '鹿', '駱駝', '羊駝', '綿羊', '山羊', '乳牛', '小豬',
  '公雞', '母雞', '鴨子', '鵝', '孔雀', '鴕鳥', '貓頭鷹', '老鷹', '鸚鵡', '麻雀',
  '青蛙', '烏龜', '蛇', '蜥蜴', '鱷魚', '鯊魚', '海馬', '水母', '海星', '魟魚',
  '寄居蟹', '龍蝦', '毛毛蟲', '瓢蟲', '蜻蜓', '蟬', '螳螂', '蜘蛛', '蚯蚓', '蝙蝠',

  // 水果
  '芒果', '奇異果', '橘子', '檸檬', '柚子', '水蜜桃', '櫻桃', '藍莓', '木瓜', '哈密瓜',
  '百香果', '火龍果', '梨子', '椰子', '荔枝', '龍眼', '榴槤', '番茄', '酪梨', '桑葚',

  // 食物
  '牛排', '炸雞', '雞排', '雞腿', '滷肉飯', '炒飯', '炒麵', '牛肉麵', '陽春麵', '拉麵',
  '關東煮', '蚵仔煎', '鹽酥雞', '臭豆腐', '肉圓', '小籠包', '水餃', '鍋貼', '煎餃', '蛋餅',
  '三明治', '飯糰', '鬆餅', '可頌', '吐司', '義大利麵', '玉米濃湯', '沙拉', '烤肉', '章魚燒',
  '可樂', '果汁', '奶茶', '熱巧克力', '牛奶', '優格', '布丁', '果凍', '馬卡龍', '銅鑼燒',

  // 交通工具
  '直升機', '戰鬥機', '救護車', '消防車', '警車', '計程車', '卡車', '貨車', '跑車', '賽車',
  '挖土機', '推土機', '拖拉機', '吊車', '垃圾車', '油罐車', '地鐵', '纜車', '遊艇', '潛水艇',

  // 電子產品
  '平板電腦', '遊戲機', '遙控器', '喇叭', '麥克風架', '充電器', '行動電源', '印表機', '掃描器', '投影機',
  '路由器', '冷氣機', '吸塵器', '洗衣機', '烘衣機', '微波爐', '烤箱', '吹風機', '電鬍刀', '電燈',

  // 日常用品
  '梳子', '毛巾', '肥皂', '洗髮精', '鏡子', '衣架', '皮帶', '手套', '襪子', '圍巾',
  '口罩', '行李箱', '鑰匙', '錢包', '信用卡', '水壺', '保溫瓶', '餐具', '筷子', '湯匙',
  '叉子', '盤子', '杯子', '枕頭', '棉被', '沙發', '椅子', '桌子', '書櫃', '垃圾桶',

  // 學校用品
  '橡皮擦', '尺', '原子筆', '彩色筆', '蠟筆', '筆記本', '課本', '黑板', '粉筆', '釘書機',
  '膠水', '便利貼', '資料夾', '地球儀', '計算機', '畫架', '調色盤', '書籤', '獎狀', '畢業帽',

  // 運動
  '排球', '網球', '桌球', '高爾夫球', '保齡球', '飛盤', '滑板', '直排輪', '滑雪板', '衝浪板',
  '啞鈴', '跳繩', '拳擊手套', '瑜珈墊', '跑步機', '射箭', '舉重', '馬拉松', '跳高', '跳遠',

  // 樂器
  '小提琴', '大提琴', '鼓', '爵士鼓', '長笛', '薩克斯風', '口琴', '烏克麗麗', '電子琴', '豎琴',

  // 建築與場所
  '學校', '醫院', '圖書館', '博物館', '美術館', '電影院', '動物園', '水族館', '遊樂園', '體育館',
  '車站', '機場', '港口', '便利商店', '超市', '百貨公司', '夜市', '咖啡廳', '餐廳', '麵包店',
  '寺廟', '教堂', '燈會', '露營區', '農場', '溫泉', '沙灘', '瀑布', '山洞', '花園',

  // 職業
  '護士', '牙醫', '獸醫', '工程師', '程式設計師', '建築師', '畫家', '歌手', '演員', '主持人',
  '攝影師', '記者', '作家', '導演', '農夫', '漁夫', '快遞員', '服務生', '店員', '司機',

  // 奇幻角色
  '吸血鬼', '狼人', '精靈', '獨角獸', '美人魚', '天使', '惡魔', '巫婆', '騎士', '巨人',
  '史萊姆', '哥布林', '勇者', '召喚師', '弓箭手', '劍士', '寶可夢訓練家', '海盜', '武士', '探險家',

  // 自然
  '流星', '極光', '龍捲風', '地震', '颱風', '沙漠', '草原', '峽谷', '冰山', '珊瑚礁',
  '楓葉', '櫻花', '向日葵', '玫瑰花', '仙人掌', '竹子', '蘑菇', '稻田', '椰子樹', '松樹',

  // 節慶
  '聖誕樹', '聖誕老人', '雪橇', '南瓜燈', '煙火', '紅包', '燈籠', '月餅', '粽子', '元宵',
  '復活節兔子', '情人節', '生日派對', '婚禮', '畢業典禮', '跨年', '萬聖節', '兒童節', '母親節', '父親節',

  // 動作
  '打哈欠', '刷牙', '洗澡', '梳頭', '照鏡子', '開車', '騎腳踏車', '看書', '寫字', '畫畫',
  '拍照', '鼓掌', '握手', '擁抱', '親吻', '打電話', '發呆', '做夢', '打噴嚏', '咳嗽',
  '吃飯', '喝水', '切菜', '洗碗', '購物', '排隊', '搭電梯', '開門', '關燈', '澆花'
];

const chiikawaRarePrompts = [
  { answer: '勞動盔甲先生', aliases: ['勞動鎧甲先生', '工作鎧甲', '勞動鎧甲', '労働の鎧さん'] },
  { answer: '手拿包盔甲先生', aliases: ['手拿包鎧甲先生', '手拿包盔甲', '手拿包鎧甲', 'ポシェットの鎧さん'] },
  { answer: '拉麵盔甲先生', aliases: ['拉麵鎧甲先生', '拉麵鎧甲', '拉麵盔甲', '郎鎧甲', 'ラーメンの鎧さん'] },
  { answer: '偉大盔甲先生', aliases: ['偉大鎧甲先生', '偉大的盔甲先生', '偉い鎧さん'] },
  { answer: '草盔甲先生', aliases: ['草鎧甲先生', '割草盔甲', '草の鎧さん'] },
  { answer: '章魚燒盔甲先生', aliases: ['章魚燒鎧甲先生', '章魚燒盔甲', 'たこ焼きの鎧さん'] },
  { answer: '店員盔甲先生', aliases: ['店員鎧甲先生', '店員盔甲', '店員の鎧さん'] },
  { answer: '刨冰盔甲先生', aliases: ['刨冰鎧甲先生', '刨冰盔甲', 'かき氷の鎧さん'] },
  { answer: '湯豆腐盔甲先生', aliases: ['湯豆腐鎧甲先生', '湯豆腐盔甲', '湯豆腐の鎧さん'] },
  { answer: '拉麵山盔甲先生', aliases: ['拉麵山鎧甲先生', '拉麵山盔甲', 'ラーメン山の鎧さん'] }
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
    { answer: '盔甲先生', aliases: ['鎧甲先生', '鎧甲人', '盔甲人', '鎧さん'] },
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
const durationSelect = document.getElementById('durationSelect');
const guessLimitSelect = document.getElementById('guessLimitSelect');
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
let guessLimit = 1;
let guessesMade = 0;
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
  const useRareChiikawaPrompt = theme === 'chiikawa' && Math.random() < 0.15;
  const pool = useRareChiikawaPrompt ? chiikawaRarePrompts : promptPools[theme];
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
  timeLeft = Number(durationSelect.value) || 15;
  guessLimit = Number(guessLimitSelect.value) || 1;
  guessesMade = 0;
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
  themeSelect.disabled = true;
  durationSelect.disabled = true;
  guessLimitSelect.disabled = true;

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
  timer = null;
  timeLeft = 0;
  timerText.textContent = timeLeft;
  canDraw = false;
  drawing = false;
  promptCard.classList.add('hidden-answer');
  phaseMessage.classList.remove('hidden');
  guessInput.disabled = false;
  submitBtn.disabled = false;
  clearBtn.disabled = true;
  themeSelect.disabled = false;
  durationSelect.disabled = false;
  guessLimitSelect.disabled = false;
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
    revealAnswer();
  } else {
    guessesMade += 1;
    const remaining = guessLimit - guessesMade;
    if (remaining > 0) {
      resultText.textContent = `答錯了，還可以再猜 ${remaining} 次。`;
      resultText.classList.add('wrong');
      guessInput.value = '';
      guessInput.focus();
      return;
    }
    resultText.textContent = `答錯了，正確答案是「${currentPrompt.answer}」。`;
    resultText.classList.add('wrong');
    revealAnswer();
  }
}

function revealAnswer() {
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
durationSelect.addEventListener('change', () => {
  if (!canDraw && !currentPrompt) timerText.textContent = Number(durationSelect.value) || 15;
});
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
