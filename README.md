# Pokémon 周邊每日報告

呢個倉庫托管 Pokémon 周邊商品嘅每日報告網站。

## 📁 檔案結構

- **根目錄** (`index.html`, `report.css`, `nav.js`, `snooze.js`, `filter.js`, `addproduct.js`, `img/`)  
  → `report.css` 係新版共用樣式（舊 `style.css`／`build.py` 只係 10/13 舊版用）  
  → 最新嘅報告，直接喺 [https://powerkeung.github.io/pokemon-daily/](https://powerkeung.github.io/pokemon-daily/) 提供

- **`reports/YYYY-MM-DD/`**  
  → 過往報告嘅存檔，例如 `reports/2026-10-13/`

- **`docs-assets/`**  
  → 文檔用嘅截圖同埋其他資產（唔會發佈到網站）

## 🚀 部署

網站透過 **GitHub Pages** 部署，從 `main` 分支嘅根目錄提供服務。

## ➕ 添加新日報告

每次添加新嘅每日報告，跟住呢啲步驟：

1. **建立報告檔案**：將新報告放喺 `reports/YYYY-MM-DD/index.html`。由 2026-11-23 新版起，頁面 `<head>` 用 `<link rel="stylesheet" href="/pokemon-daily/report.css">`（唔再 inline `style.css`）；版面規則見下面「🧩 新版版面（2026-11-23 起）」
2. **更新根目錄**：將 `index.html` 更新為最新報告
3. **時間格式**：⏰ **所有時間必須使用台灣時間（UTC+8）**
   - 日本時間（JST）= 台灣時間 + 1 小時
   - 台灣時間 = PT + 15 小時（夏令時 PDT）或 + 16 小時（標準時 PST）
   - 範例：「9:00 台灣時間（10:00 JST）」或「今晚 23:00 台灣時間」
   - 處理日期翻轉：JST 0:00 = 前一日 23:00 台灣時間
   - Footer 標註：「所有時間為台灣時間（UTC+8）」

4. **購買/參加連結**：🔗 **每個產品卡片的每個取得渠道必須提供已驗證的直接訂購/參加連結**
   - 通過網絡搜索找到真實 URL（不得編造）
   - 使用 HTTP 請求驗證每個 URL（跟隨重定向）：
     - ✅ 保留 HTTP 200（成功）
     - ⚠️ 保留 HTTP 403（若明顯為官方產品頁的 bot 防護）
     - ❌ 刪除 HTTP 404/410（未找到/已刪除）
   - 連結樣式：
     - 使用清晰的按鈕樣式（`.btn` 主按鈕，`.btn.sec` 次要按鈕）
     - 文案：「前往購買」「參加抽選」「前往 PCO 搜索」等
     - 與公告/新聞連結分開顯示
   - 特殊情況：
     - 實體店渠道（店頭／各店／實體店／直營店／機台，包括「店頭抽選・店頭購買」）**只顯示一行：日期・店名・數量**（見新版版面 C），唔寫長說明；有官方公告／抽選頁就放細 `↗` 圖示連結（`a.btn.ico`）
     - 若無線上連結（實體店限定），該行唔放 `↗`
     - 若為 App 專用（如 majica、Joshin App），註明「App 專用，無網頁版」
     - 若預訂渠道未開，註明「購買頁未開」
   - 範例：
     ```html
     <a class="btn" href="https://www.pokemoncenter-online.com/..." target="_blank" rel="noopener">前往購買 <span aria-hidden="true">›</span></a>
     <a class="btn" href="https://books.rakuten.co.jp/..." target="_blank" rel="noopener">參加抽選 <span aria-hidden="true">›</span></a>
     ```

5. **更新導航清單**：喺 `reports/index.json` 最上面加入新日期：
   ```json
   {
     "date": "2026-10-15",
     "label": "2026/10/15（四）"
   }
   ```
6. **標記產品卡片**：為每張產品卡片添加 `data-acquisition` 屬性，根據取得方法選擇標籤：
   - `store`（店頭）：實體店、PC 店頭、Lawson、便利店、量販店等
   - `lottery`（抽選）：抽選、預約抽選、線上抽獎活動等
   - `online`（線上可買）：PCO、官方網店、amazon、apple.com 等可直接購買嘅線上渠道
   
   系列合併卡（`article.card.line`）嘅 `data-acquisition`／`data-cat` 放喺 **article** 上（旗下 SKU 嘅聯集），SKU（`.sku`）**唔好**再加 `data-acquisition`／`data-cat`。
   一個產品可以有多個標籤，用空格分隔：
   ```html
   <article class="card" data-cat="jp urgent" data-acquisition="lottery store online">
   ```
   
   **標記範例**：
   - PC 實體店＋PCO → `online store`
   - 抽選＋店頭購買 → `lottery store`
   - 純線上預購 → `online`
   - Lawson 店頭 → `store`
   
7. **產品 ID 屬性**：為每張產品卡片添加 `data-product-id` 屬性（基於圖片文件名的穩定 slug）：
   ```html
   <article class="card" data-cat="jp urgent" data-product-id="scaleworld3" data-acquisition="online store">
   ```
   
   這個 ID 用於「新增商品」功能，確保同一產品在不同日期報告中使用相同的 ID，以便 API 檢測重複；亦係「一個月內不再提醒」嘅記錄 key。
   - 單品卡：`data-product-id` 放喺 `article.card`
   - 系列合併卡：`data-product-id`（同 8、9 點全部 CM5 屬性）放喺每個 `.sku`，article 本身唔放 `data-product-id`

8. **中文商品名屬性**：為每張有 `data-product-id` 嘅卡片添加 `data-name-zh`（繁體中文、台灣官方譯名），「新增商品」發 API 時用佢做 `name`：
   ```html
   <article class="card" data-cat="jp urgent" data-product-id="megadeck" data-name-zh="寶可夢集換式卡牌 特別牌組套組MEGA 超級大力鱷・超級快龍・超級耿鬼" data-acquisition="lottery">
   ```
   - ⚠️ **所有寶可夢名字必須逐個喺 [寶可夢百科（52poke）](https://wiki.52poke.com/) 核對**，用繁體頁面 `https://wiki.52poke.com/zh-hant/<日文名>`（例：リザードン→噴火龍、ピカチュウ→皮卡丘、メガカイリュー→超級快龍、メガライチュウX→超級雷丘Ｘ）。唔可以靠記憶或者機翻。
   - 地區／組織／遊戲名同樣以 52poke 為準（シンオウ地方→神奧地區、ロケット団→火箭隊、ミアレ→密阿雷、ポケモンセンター→寶可夢中心、Pokémon LEGENDS Z-A→寶可夢傳說 Z-A）。
   - 查唔到／未能確認嘅寶可夢名，保留日文原名，唔好估。
   - 品牌／系列名（Windowsill collection、Pokémon Yurutto 等）可保留原文；型號／set code 照抄。
   - 屬性值要做 HTML escape（`"` → `&quot;`）。

9. **API 屬性（每日新卡必加）**：每張有 `data-product-id` 嘅卡片都要加：
   ```html
   data-type="預組" data-subtype="20261113MEGA" data-currency="JPY" data-original-price="5500" data-source="pokemoncenter"
   ```
   - `data-type`：**只可以**用以下店內類型（字串完全一致，唔好自創）：
     娃娃、卡套、文具、飾品、衣鞋、卡盒、收納、其他、卡墊、廚具、盒玩、禮盒、織品、單卡、補充包、食品、內頁、帽子、桌遊、鑑定卡、公仔、書、卡磚、雨傘、鑑定費、TAKARA TOMY、卡套+卡盒、美妝、卡冊、卡本、燈具、特典包、預組、指示物盒、生活用品、直送鑑定、雜誌、居家、水壺
     （徽章／別針→飾品；鑰匙圈→飾品；牌組→預組；擴充包→補充包；布偶→娃娃；食玩／扭蛋／盒裝公仔→盒玩；收藏卡冊→卡冊；補充內頁→內頁；寢具→織品；判斷唔到→其他）
   - `data-subtype`：發售日 + 短系列名，最多 50 字（`20261113MEGA`、`20261019 Windowsill`；只知月份用 `YYYYMM`）；冇發售日先用 `現貨`。
   - `data-currency`：`JPY` / `USD` / `TWD`；`data-original-price`：純數字、來源幣真實價（日圓用税込價）。多個價錢時用單件價，盒價寫喺 `.price` 文字（會入 description）。價錢未知就唔好加 `data-original-price`。前端**唔計算、唔發送**台幣 `price`；只送 `currency`、`original_price`、`exchange_rate`（一位小數：JPY 0.3、USD 48.0），售價由後端計算。
   - `data-source`：每日卡片帶呢個屬性（每張卡**最多一個**）。**只可以**係以下白名單（字串完全一致）：`pokemoncenter`、`Chiikawa Market`、`Mercari`、`amazon`。對應規則：
     - Pokémon Center 商品／經 PCO 或 pokemoncenter.com 出售 → `pokemoncenter`
     - 否則若渠道之一係 Amazon → `amazon`
     - 其他渠道 → **唔好加** `data-source`（`addproduct.js` 只接受白名單，唔匹配就省略 `source` 欄，**永遠唔好送 `'API'`**）

10. **確保腳本引用**：確保所有報告頁面嘅 `</body>` 前有（**次序要一樣**，`snooze.js` 要喺 `filter.js` 之前，等篩選計數唔計已收埋嘅卡）：
   ```html
   <script src="/pokemon-daily/nav.js"></script>
   <script src="/pokemon-daily/snooze.js"></script>
   <script src="/pokemon-daily/filter.js"></script>
   <script src="/pokemon-daily/addproduct.js"></script>
   ```
   唔好再加舊式 `<nav class="filters">` 同佢嘅 inline `<script>`（`filter.js` 會自己生成篩選列）。

導航欄會自動顯示前一日／後一日連結同日期選擇器。篩選按鈕會根據標籤自動生成。

---

## 🧩 新版版面（2026-11-23 起，每日報告必須跟）

### A. 系列合併：同一項目一張卡
同一系列／同一項目（例：PIKA PIKA Fresh Farm、雪人布偶、モンコレ 同日新作、Crocs 30周年第2弾、Fragment × Pokémon）**只開一張** `article.card.line`：
表頭寫一次系列名、發售日、取得方法；下面每個 SKU 一格（自己嘅官方 packshot、原名、價錢、自己嘅「新增商品」掣）。仍然「一個商品一個單位」：每個 SKU 照樣有齊 CM5 屬性。

```html
<article class="card line" data-cat="jp" data-line-id="line-pikapika-fresh-farm"
         data-sku-ids="farm_pikachu_plush farm_wanpachi_merriep" data-acquisition="online store"
         data-key-date="PCO 11/26 09:00・店頭 11/28（六）">
  <div class="body line-head">
    <div class="chips"><span class="chip orange">PCO 11/26 09:00・店頭 11/28（六）</span></div>
    <span class="reg inline jp">日版 · 系列 2 款</span>
    <h3 class="line-title">PIKA PIKA Fresh Farm（寶可夢中心 新系列・全 28 款）</h3>
    <dl class="dates"><div><dt>PCO</dt><dd>11/26（四）09:00 起</dd></div><div><dt>PC 店頭 發售</dt><dd>11/28（六）</dd></div></dl>
    <ul class="desc"><li>系列共通說明（短句，一句一點）</li></ul>
    <h4>取得方法</h4><ul class="ch"> …（見 B、C）… </ul>
  </div>
  <div class="skus">
    <div class="sku" data-product-id="farm_pikachu_plush" data-source="pokemoncenter" data-type="娃娃"
         data-subtype="20261128 PIKA PIKA Fresh Farm" data-currency="JPY" data-original-price="3850"
         data-name-zh="寶可夢中心 PIKA PIKA Fresh Farm 布偶 農場造型皮卡丘">
      <div class="sku-shot"><img src="/pokemon-daily/img/farm_pikachu_plush.jpg" alt="…" loading="lazy"></div>
      <div class="sku-body"><span class="sku-tag">農場皮卡丘</span>
        <h4 class="sku-name">ぬいぐるみ PIKA PIKA Fresh Farm 農場すがたのピカチュウ</h4>
        <div class="price"><span class="pv">¥3,850（税込）</span></div>
        <ul class="sku-note"><li>只屬於呢款嘅一句說明（可省略）</li></ul>
      </div>
    </div>
    …
  </div>
</article>
```
- 系列卡橫跨整行（CSS `grid-column:1/-1`），桌面左邊表頭、右邊 SKU 格；手機 SKU 兩格一行。
- 只適用於某幾款嘅渠道／資料：喺該渠道 `dl.kv` 加 `<dt>適用</dt>` 或 `<dt>款式短名</dt>` 行；只屬某款嘅日期放 SKU 自己嘅 `dl.dates`。
- 單一商品（冇同系列其他款）照用單品卡 `article.card[data-product-id]`（結構同下面 B、C、D 一樣，有 `.shot` 大圖）。

### B. 線上渠道：標籤行 + 連結
唔再寫一長串「｜」分隔文字；拆成短標籤行，標籤只用：`受付`、`時間`、`發售`、`開賣`、`截止`、`結果`、`購買期`、`購買`、`落單`、`出貨`、`限購`、`價錢`、`運費`、`內容`、`尺碼`、`條件`、`寄送`、`備註`（同一標籤多項用 `<br>`）。
```html
<li><div class="chh"><span class="chn">PCO（ポケモンセンターオンライン）</span><span class="chip sm orange">11/26 09:00 起</span></div>
  <dl class="kv"><div><dt>時間</dt><dd>11/26（四）09:00 起發售</dd></div><div><dt>寄送</dt><dd>只寄日本，需轉運</dd></div></dl>
  <div class="btns"><a class="btn" href="…" target="_blank" rel="noopener">前往 PCO 搜索 <span aria-hidden="true">›</span></a></div></li>
```

### C. 實體店渠道：一行（日期・店名・數量）
店頭／各店／實體店／直營店／機台（包括「店頭抽選・店頭購買」、LINE／LivePocket 申請但要去店買嘅）**只寫一行**，唔寫說明：
```html
<li class="ch-store"><span class="st-date chip sm blue">11/28 起</span>
  <span class="st-name">📍 寶可夢中心 各店 <span class="st-tag">抽選</span></span>
  <span class="st-qty">每人最多 20 包</span>
  <a class="btn ico" href="官方公告" target="_blank" rel="noopener" title="官方商品頁" aria-label="官方商品頁">↗</a></li>
```
- 日期：抽選寫截止（如「聽日 11/23 22:59」），發售寫開始（「11/28 起」）；`st-tag 抽選` 只喺抽選先加。
- 數量：寫限購（「每人 1 件」「每次結帳最多 10 包」）；冇資料寫「限購未公布」；官方話「數量限定」就照寫。
- 實體店渠道排喺線上渠道之後；已截止／已出結果嘅渠道收入 `<details class="closed"><summary>已截止／已出結果渠道（N）</summary>…</details>`。

### D. 說明可讀性
- `chip` 太長就拆做幾粒（包喺 `<div class="chips">`）。
- 價錢用 `<div class="price"><span class="pv">…</span><span class="sep" aria-hidden="true"> ／ </span><span class="pv">…</span></div>`；超過 4 項，第 3 項起收入 `<details class="price-more">`。
- 日期／重點用 `dl.dates`（標籤｜內容兩欄）。
- 說明唔好寫長段落：一句一點 `<ul class="desc"><li>…</li></ul>`，最多顯示 2 點，其餘放 `<details class="more"><summary>更多說明（N 點）</summary><ul class="desc">…</ul></details>`。
- 渠道入面唔使再寫「台灣時間（xx:xx JST）」：頁首同 footer 已註明「所有時間為台灣時間（UTC+8）」。
- 頁首摘要用 `<ul class="sum"><li>…</li></ul>`，一句一點。

### E. 一個月內不再提醒（snooze.js）
- 每張單品卡同系列卡底部自動出現「🔕 一個月內不再提醒」（由 `snooze.js` 生成，唔使寫 HTML）。
- 按咗之後 30 日內，張卡會由主欄目搬去「其他更新」（`section.notes`）頂部嘅「🔕 一個月內不再提醒」清單，只顯示一行：名、`data-key-date`（冇就用第一粒 chip）、第一條連結、到期日、「恢復提醒」掣。
- 記錄存喺瀏覽器 `localStorage` 嘅 `pkd_snooze_v1`（`p:<data-product-id>`／`l:<data-line-id>`，系列記錄連 `skus`）。**只限同一部機同一個瀏覽器**；換機／無痕模式／清瀏覽資料就會冇咗。
- 系列卡被收埋＝佢旗下所有 SKU 都當收埋，所以舊存檔頁嗰啲單品卡都會跟住收埋；系列旗下 SKU 全部各自被收埋，系列卡都當收埋。

### F. ⚠️ ID 穩定規則（每日一定要跟）
- `data-product-id`：同一商品每日都用**同一個** slug（沿用之前報告；唔好因為改版、改名、合併入系列而改）。
- `data-line-id`：`line-` 開頭、全小寫、用 `-` 連接嘅系列 slug（例：`line-pikapika-fresh-farm`、`line-pc-yukidaruma-2026`、`line-takaratomy-moncolle-202611`）。**一經用過就永遠唔改**，之後日子同一系列加新款都用返同一個 id，只係將新 SKU 加入 `.skus` 同 `data-sku-ids`。
- `data-sku-ids`：系列旗下全部 SKU 嘅 `data-product-id`（空格分隔）。
- `data-key-date`：snooze 清單顯示嘅一句日期（短，例：「PCO 11/26 09:00・店頭 11/28（六）」）。
- 已用嘅系列 id 同旗下 SKU 記錄喺 `tools/lines.json`；新開系列就加入去。

### G. 轉換工具（可選）
`tools/relayout.py` 可以將舊式（一商品一卡、｜分隔）嘅報告 HTML 轉成新版：`python3 tools/relayout.py 舊版.html index.html reports/YYYY-MM-DD/index.html`（需要 `beautifulsoup4`；系列分組讀 `tools/lines.json`）。輸入一定要係舊式頁面，唔好對新版頁面再跑。

---

## 🔌 新增商品按鈕

每個產品卡片（單品卡）同每個系列 SKU（`.sku[data-product-id]`）底部都有一個「新增商品」按鈕，允許用戶將產品數據發送到 Astraflow API 進行審批。系列卡入面每個 SKU 各自一粒掣、各自送一件商品。

### 功能特點

- **Token 管理**：首次點擊時提示輸入 API token，存儲在 localStorage（`astraflow_token`）
- **重複檢測**：基於 `data-product-id` 檢測重複提交
- **狀態追蹤**：在 localStorage 記住已發送的產品（`astraflow_sent_products`）
- **CORS 處理**：如果伺服器未配置 CORS，顯示清晰的錯誤訊息
- **Token 重設**：頁面 footer 有「重設 API token」連結

### API Payload 映射

從產品卡片提取以下字段發送到 `https://astraflow.tw/api/create_product.php`：

| 字段 | 來源 | 說明 |
|------|------|------|
| `name` | `data-name-zh`（冇先用 `<h3>`） | 中文產品名稱 |
| `type` | `data-type` | 白名單之一；唔喺白名單就送 `其他` |
| `subtype` | `data-subtype` | 發售日+系列，截至 50 字 |
| `currency` | `data-currency` | JPY / USD / TWD |
| `original_price` | `data-original-price` | 來源幣真實價 |
| `exchange_rate` | 固定預設（一位小數） | JPY 0.3、USD 48.0、TWD 1.0；冇價就三個價錢欄都唔送。前端**唔計算／唔發送**台幣 `price`，售價由後端計算 |
| `stock` | 固定值 | 0 |
| `source` | `data-source` | 白名單：`pokemoncenter`、`Chiikawa Market`、`Mercari`、`amazon`；唔喺白名單／冇屬性就**唔送** `source`（唔可以送 `'API'`） |
| `ip` | 固定值 | `'寶可夢'` |
| `source_name` | 固定值 | `'Pokémon Daily 報告'` |
| `source_id` | `data-product-id` | 穩定 slug，待批准佇列會去重 |
| `description` | 「原名：<h3>（SKU 用 `.sku-name`）」+ `.price` 文字 +（SKU：「系列：<.line-title>」）+ `.dates`（SKU：系列表頭 + SKU 自己） | 第一行一定係原名 |
| `remark` | `a.btn` 連結（SKU：SKU + 系列表頭，去重）+ 報告 URL | |
| `image_urls` | 卡內 `<img>`（SKU：只用 SKU 自己張圖） | 轉成 `https://powerkeung.github.io/pokemon-daily/img/...` 絕對網址，最多 20 張 |

回應：成功顯示「已送入待批准（pending_id N）」或「已在待批准中（重複）」；401 會清除 token 再要求輸入；400／500 彈出 API 錯誤訊息。Token 永遠唔可以寫入 repo。

### HTTP Headers

- `Content-Type: application/json`
- `X-Api-Token: <user_token>` （從 localStorage 讀取）

### 按鈕狀態

- **預設**：「新增商品」（可點擊）
- **發送中**：「送出中…」（禁用）
- **成功**：「已送入待批准 #123」或「已在待批准 #123」（禁用，綠色）
- **錯誤**：顯示 API 訊息或「伺服器未允許網頁直接呼叫（CORS）」（3-5 秒後恢復）
- **已發送**：頁面重新加載後顯示「已送出 #123」（基於 localStorage）

### 當前系列 ID 列表（`data-line-id`）

```
line-allstar-collection-202611, line-bbc-pokemon, line-crocs-30th-2, line-fragment-pokemon, line-pc-fender-30th, line-pc-roads-30th,
line-pc-timeless-adventure-paldea, line-pc-toushoku-2026, line-pc-yukidaruma-2026, line-pikapika-fresh-farm, line-pokepeace-twinkle-star-idol,
line-pokepeace-wappen-cardholder, line-takaratomy-moncolle-202611, line-tcg-us-30th-figure-collection, line-tcg-us-30th-upc
```

### 當前產品 ID 列表

所有報告中的 `data-product-id` 值：

```
artbook, avail_pokemon, beats, bikkura_fubuki, cardset, celebration_m6a, deltareign, filepremium, gu_pokemon, hadouseeker, holidayhelpers, holidayhelpers_plush, 
jarajara_keyholder, localacts_acstand_denryu, localacts_cushion_denryu, localacts_leisuresheet, localacts_mascot_denryu, localacts_mascot_nassy, megadeck, metalcharm_eevee, metamon, miare, misdo_goodsset, misdo_kidsset, mokomoko_coil, moncolle_ballpark, moncolle_torupoke_pikachu, nishikawa, omaroke, 
pikapikabox2027, plush_freezer, pokecharm, polaroid, poster30th, ricecookie, roads_orgel, roads_papercraft, roads_townmap, santacruz, 
scaleworld3, stormemerald, texture_clear, tsumande16, upc30th_day, upc30th_night, windowsill, xmas
```

---

## 📸 Screenshots

截圖放喺 `docs-assets/` 入面。
