# 專案推送變更紀錄

## 2026.06.21_09:02:06
* 將 Signal Maze 手機版四方向按鈕改為虛擬搖桿，加入死區、主方向切換、按住連續移動、放手回中及失焦／重開狀態清除，並保留迷宮牆壁碰撞判定。
* 修正 Chick Chase 遊玩中可能因快速連點、HUD 空白區或 iOS gesture 觸發網頁放大的問題；Signal Maze 同步套用相同防護。
* 兩款遊戲加入 viewport 縮放限制、全頁 `touch-action: none`、overscroll 封鎖、雙擊與 iOS gesture 攔截，以及快速連續 touchend fallback，並更新前端資源版本避免舊快取。
* Validation: ran `node --check` for both game scripts, `git diff --check`, DOM viewport/joystick contract checks, and complete zoom-protection contract checks for both games.

## 2026.06.20_22:10:58
* 新增 `games/signal-maze/` 3D 星球迷宮遊戲，包含低多邊形球面迷宮、角色行走與牆壁判定、18 顆星星蒐集、計時、完成流程及桌機/手機操作介面。
* 固定採用 Camera-relative 角色移動：方向鍵控制角色並映射到目前畫面最接近的球面網格；WASD 與滑鼠拖曳旋轉視角，可同時移動與調整鏡頭。
* 修正撞牆朝向、視窗失焦卡鍵與舊版 JavaScript 快取造成載入畫面無法結束的問題，並移除星球表面的黃褐色格子地磚。
* 在遊戲合集首頁新增 Signal Maze 卡片與縮圖樣式，部署後可由首頁或 `games/signal-maze/` 直接進入。
* Validation: ran `node --check games\signal-maze\game.js` and `git diff --check`; verified versioned CSS/JavaScript assets and successful loading state in browser.

## 2026.06.19_23:22:46
* 修正你畫我猜擴充題庫的變數名稱不一致，避免腳本初始化中止，讓秒數設定與開始遊玩按鈕恢復正常；回合進行時鎖定主題、秒數與猜題次數，時間到後恢復設定並啟用猜題操作。
* 為你畫我猜的 CSS 與 JavaScript 更新唯一版本參數，避免瀏覽器快取舊版資源造成開始按鈕或秒數設定失效。
* 更新遊戲頁與首頁說明，反映可自訂作畫時間。
* Validation: ran `node --check games\draw-guess\draw.js` and `git diff --check`; verified a complete timed round, guessing phase, console errors, and desktop/mobile layouts in browser.

## 2026.06.07_23:59:20
* 修正 `sync-blocks` 多格方塊補色線會覆蓋黑色外框的問題，改用避開外框邊界的 seam fill，讓方塊內部不露白且外框不斷線。
* 修正 `sync-blocks` 完成後「下一關」在手機上需要按兩次的問題，改為單擊時重新檢查完成狀態並直接載入下一題。
* 優化 `draw-guess` 手機版布局，將遊戲說明移到標題下方、清除畫布移到畫布下方，並讓倒數與開始/重新開始按鈕併排。
* 新增 `draw-guess` 秒數與猜題次數設定，預設為 15 秒與猜 1 次；顏色控制改成小方格並與筆刷大小並排，減少手機畫面高度。
* Validation: ran `node --check games\draw-guess\draw.js` and `node --check games\sync-blocks\sync-blocks.js`; verified `draw-guess` mobile layout at 390x844 browser viewport with no horizontal overflow and no console errors.

## 2026.06.07_23:07:24
* 調整 `games/color-slide/` 手機版配置，參考 `sync-blocks` 的棋盤優先排版，讓狀態與復原/重置/提示/下一關按鈕緊接棋盤。
* 手機版 `color-slide` 隱藏方向鍵，改以棋盤滑動操作；桌機仍保留鍵盤與方向鍵按鈕。
* 更新 `color-slide` 棋盤尺寸計算，支援 visual viewport，避免手機 Safari 位址列變化造成橫向溢出。
* 延續 `sync-blocks` 修正：用同色外擴補掉多格方塊子像素白線，完成後立即啟用下一關。
* Validation: ran `node --check games\color-slide\slide.js` and `node --check games\sync-blocks\sync-blocks.js`; verified all 8 `color-slide` levels solvable; verified all 24 `sync-blocks` levels solvable with declared solutions; verified `color-slide` mobile layout and swipe interaction in browser.

## 2026.06.07_17:01:53
* 新增 `games/color-slide/` 同色滑塊益智遊戲，支援方向鍵/WASD 與螢幕方向鍵同步移動彩色磚塊。
* 首頁新增「同色滑塊」遊戲卡片與對應縮圖樣式，讓新遊戲可從遊戲列表進入。
* 加入 8 個可解關卡、步數/最佳紀錄、撤回、重置、提示與下一關流程。
* 移除彩色磚塊上的顏色中文字，保留輔助工具用的 `aria-label`，提升棋盤視覺質感。
* 重做第 6 關與第 7 關，避免只是第 4/5 關換色重複；新第 6 關最短解 24 步，新第 7 關最短解 21 步。
* Validation: ran `node --check games\color-slide\slide.js`; ran BFS solvability check for all 8 levels; verified home/game pages and mobile layout in browser.

## 2026.06.07_16:14:46
* 調整「矩形線索盤」資訊欄：左側恢復已框選格數顯示 `0/64` 到 `64/64`。
* 將中間資訊改為矩形使用數，使用 `已用/題目上限` 格式，例如 `0/7`、`1/7` 到 `7/7`。
* 保留矩形數量上限邏輯，當中間數字達到上限時仍禁止新增矩形。
* 更新規則文案，說明使用矩形數不能超過題目上限。
* 驗證：執行 `node --check games/rect-clues/rect.js`；以 Node 規則測試 80 題確認初始與填滿後 HUD 格式正確；以本機瀏覽器拖曳確認 `0/64 0/8` 會更新為 `2/64 1/8` 且無 console error。

## 2026.06.07_02:58:51
* 調整你畫我猜上方控制區，將題目卡片移到開始按鈕正上方，讓出題與開始操作更直覺。
* 將吉伊卡哇主題中的細分類盔甲先生題目改為稀有題目池，約 15% 機率才會出現。
* 一般吉伊卡哇題庫新增較容易辨識的「盔甲先生」，並保留鎧甲先生、鎧甲人等 aliases。
* 保留吉伊卡哇主題的模糊比對與小甲蟲/蟲子、小桃等常用稱呼。
* Validation: ran `node --check games\draw-guess\draw.js`.

## 2026.06.07_01:40:21
* 參考維基百科「吉伊卡哇」登場角色，擴充你畫我猜的吉伊卡哇主題題庫。
* 新增主角群、配角、盔甲先生與其他角色題目，並保留小甲蟲/蟲子、大強、黑色流星等可玩題目。
* 補上台灣常用稱呼與日文/英文 aliases，例如小可愛、兔哥、537、小桃、古本、布丁狗前輩與各類鎧甲/盔甲稱呼。
* 吉伊卡哇主題答案支援 2 字以上模糊比對，讓短稱如古本、小桃也能被判定正確。
* Validation: ran `node --check games\draw-guess\draw.js`.

## 2026.06.07_01:29:41
* 在你畫我猜上方新增題目主題選擇，可切換一般題庫與吉伊卡哇題庫。
* 擴充一般題庫並新增吉伊卡哇角色、配角與反派/討伐相關題目，降低連續重複出題機率。
* 答案判斷支援常見別名，例如小八貓/哈奇喵、兔兔/烏薩奇、吉伊卡哇/chiikawa。
* 保留時間到後不遮住畫布的提示方式，方便猜題者看圖作答。
* Validation: ran `node --check games\draw-guess\draw.js`.

## 2026.06.06_12:08:33
* 修正「矩形線索盤」在手機 Safari 拖曳框選時可能觸發文字選取與拷貝/查詢/翻譯選單的問題。
* 棋盤、格子與提示標籤加入 `-webkit-touch-callout: none`、`-webkit-user-select: none`、`-webkit-user-drag: none` 與相關不可選取樣式。
* 拖曳框選事件加入 `preventDefault()`，並攔截棋盤的 `selectstart` 與 `contextmenu`。
* 驗證：執行 `node --check games/rect-clues/rect.js`；以本機瀏覽器確認拖曳仍可新增矩形、HUD 正常更新且無 console error。

## 2026.06.06_11:55:25
* 將「矩形線索盤」HUD 左側由已填格數改為剩餘可用矩形數。
* 依照每題隱藏答案的矩形數設定玩家可用矩形上限，玩家使用數量不得超過題目矩形數。
* 當剩餘可用矩形為 0 時禁止新增矩形，必須先清除或復原既有矩形才可繼續框選。
* 清盤、清除單塊與復原操作會同步更新剩餘可用矩形數，通關檢查也會防止超出矩形上限。
* 驗證：執行 `node --check games/rect-clues/rect.js`；以 Node 規則測試 80 題確認上限等於答案矩形數且出題布局可通關；以本機瀏覽器真實拖曳測試確認額度用盡後不能新增，清除一塊後額度恢復，且無 console error。

## 2026.06.06_02:53:48
* 修正「矩形線索盤」提示數字會撐開格子與底盤的問題，將提示泡泡改為固定比例標籤，並讓棋盤尺寸校正為可被 8x8 格線整除的寬度。
* 保留自適應布局，桌機與手機都會依容器重新計算棋盤大小。
* 驗證：執行 `node --check games/rect-clues/rect.js`；以本機瀏覽器連續產生 6 題，確認桌機底盤固定為 558x558 且每格皆為 67x67；手機 390x844 下每格尺寸一致、無水平溢出且無 console error。

## 2026.06.06_02:45:48
* 修正「矩形線索盤」底盤格線與格子尺寸，改用 grid gap 與無預設按鈕邊距，讓桌機與手機上的 8x8 格子大小一致。
* 優化拖曳選取預覽，選取中會顯示下一個色塊的淡色底與同色邊框，不再只顯示黑色粗框。
* 降低無提示矩形出現機率，避免每次出題都能猜到一定有一塊沒有提示。
* 驗證：執行 `node --check games/rect-clues/rect.js`；以 Node 規則測試連續生成 160 題，確認矩形數 5-12、最小面積 2、最多一塊無提示、出題布局可通關；以本機瀏覽器量測桌機 64 格皆為 69x69、手機 390x844 皆為 41.083x41.083，且手機無水平溢出與無 console error。

## 2026.06.06_02:33:47
* 修正「矩形線索盤」玩家色塊配色，改為從目前未使用的 12 個色票中分配，避免 12 塊以內出現相同顏色。
* 調整隨機分割器，切割答案矩形時會避開任何面積為 1 的矩形。
* 限制玩家不能框選 1 格矩形，檢查通關時也會拒絕面積 1 的色塊。
* 更新遊戲規則文案，明確說明矩形面積需為 2 以上。
* 驗證：執行 `node --check games/rect-clues/rect.js`；以 Node 規則測試連續生成 120 題，確認矩形數 5-12、最小面積為 2、12 塊內顏色不重複、出題布局可通關；以本機瀏覽器確認 1 格框選會被拒絕且無 console error。

## 2026.06.06_02:27:44
* 將「矩形線索盤」隨機答案矩形數量調整為約 5-12 塊，降低 8x8 題目的切分密度。
* 調整線索生成規則：同一矩形可出現多個相同面積提示，且視情況最多一個答案矩形不給提示。
* 放寬通關判定：不再要求玩家布局完全等於隱藏出題布局，只要全盤填滿且每個數字都等於所在玩家矩形面積，即使存在多解也算通關。
* 更新目錄頁、遊戲規則文案與 README，說明玩家只需框出任一符合條件的完整布局。
* 驗證：執行 `node --check games/rect-clues/rect.js`；以本機瀏覽器檢查 64 格、線索顯示與規則文案無 console error；以 Node 規則測試連續生成 80 題，確認矩形數 5-12、最多一塊無提示、出題布局可通關。

## 2026.06.06_02:14:31
* 將「矩形線索盤」從 26x26 調整為 8x8，總格數改為 64 格，降低初版解題負擔。
* 調整隨機出題器的答案矩形數量與分割條件，讓 8x8 題目維持可推理的線索密度。
* 同步更新目錄頁、遊戲頁、README 與手機版棋盤尺寸設定。
* 驗證：執行 `node --check games/rect-clues/rect.js`；以本機靜態伺服器檢查 64 格生成、線索顯示、拖曳框選錯誤提示、手機 390x844 無水平溢出與無 console error。

## 2026.06.06_02:05:52
* 將根目錄改為小遊戲目錄頁，保留「星芽採集日」並搬移至 `games/star-sprout/`。
* 新增「矩形線索盤」：26x26 底盤、隨機矩形分割出題、每個答案矩形至少一個面積線索、拖曳框選、不同色塊、清除、復原、提示、檢查與通關判定。
* 更新 README 為遊戲集合說明，列出目前兩款可遊玩的 GitHub Pages 靜態遊戲。
* 驗證：執行 `node --check games/star-sprout/game.js` 與 `node --check games/rect-clues/rect.js`；以本機靜態伺服器檢查目錄頁、新遊戲 676 格與線索生成、框選互動、提示、檢查、手機 390x844 棋盤無水平溢出，以及搬移後星芽遊戲可正常開始且無 console error。

## 2026.06.06_00:57:03
* 建立插畫風格手機友善網頁小遊戲「星芽採集日」，包含 Canvas 遊戲畫面、分數、生命、最高分、暫停與重新開始流程。
* 新增手機觸控拖曳與左右操作按鈕，並支援桌機方向鍵、A / D 與空白鍵操作。
* 新增 GitHub Pages 靜態部署 workflow，讓根目錄靜態檔案可透過 GitHub Actions 發布。
* 補上 README，說明遊玩方式與 GitHub Pages 設定。
* 驗證：執行 `node --check game.js`，並以本機靜態伺服器在桌機與 390x844 手機視窗檢查畫面、互動、無水平溢出與無 console error。
