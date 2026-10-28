# Pokémon 周邊每日報告

呢個倉庫托管 Pokémon 周邊商品嘅每日報告網站。

## 📁 檔案結構

- **根目錄** (`index.html`, `style.css`, `img/`, `build.py`)  
  → 最新嘅報告，直接喺 [https://powerkeung.github.io/pokemon-daily/](https://powerkeung.github.io/pokemon-daily/) 提供

- **`reports/YYYY-MM-DD/`**  
  → 過往報告嘅存檔，例如 `reports/2026-10-13/`

- **`docs-assets/`**  
  → 文檔用嘅截圖同埋其他資產（唔會發佈到網站）

## 🚀 部署

網站透過 **GitHub Pages** 部署，從 `main` 分支嘅根目錄提供服務。

## ➕ 添加新日報告

每次添加新嘅每日報告，跟住呢啲步驟：

1. **建立報告檔案**：將新報告放喺 `reports/YYYY-MM-DD/`（包含 `index.html` 同 `style.css`）
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
     - 若無線上連結（實體店限定），在描述中註明「實體店限定，無線上購買頁」
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
   
   這個 ID 用於「新增商品」功能，確保同一產品在不同日期報告中使用相同的 ID，以便 API 檢測重複。

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

10. **確保腳本引用**：確保所有報告頁面嘅 `</body>` 前有：
   ```html
   <script src="/pokemon-daily/nav.js"></script>
   <script src="/pokemon-daily/filter.js"></script>
   <script src="/pokemon-daily/addproduct.js"></script>
   ```

導航欄會自動顯示前一日／後一日連結同日期選擇器。篩選按鈕會根據標籤自動生成。

---

## 🔌 新增商品按鈕

每個產品卡片底部都有一個「新增商品」按鈕，允許用戶將產品數據發送到 Astraflow API 進行審批。

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
| `description` | 「原名：<h3>」+ `.price` 文字 + `.dates` | 第一行一定係原名 |
| `remark` | `a.btn` 連結 + 報告 URL | |
| `image_urls` | 卡內 `<img>` | 轉成 `https://powerkeung.github.io/pokemon-daily/img/...` 絕對網址，最多 20 張 |

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

### 當前產品 ID 列表

所有報告中的 `data-product-id` 值：

```
artbook, avail_pokemon, beats, bikkura_fubuki, cardset, celebration_m6a, deltareign, filepremium, gu_pokemon, hadouseeker, holidayhelpers, holidayhelpers_plush, 
jarajara_keyholder, localacts_acstand_denryu, localacts_cushion_denryu, localacts_leisuresheet, localacts_mascot_denryu, localacts_mascot_nassy, megadeck, metalcharm_eevee, metamon, miare, misdo_goodsset, misdo_kidsset, mokomoko_coil, moncolle_ballpark, moncolle_torupoke_pikachu, nishikawa, omaroke, 
pikapikabox2027, plush_freezer, pokecharm, polaroid, poster30th, ricecookie, santacruz, 
scaleworld3, stormemerald, texture_clear, tsumande16, upc30th_day, upc30th_night, windowsill, xmas
```

---

## 📸 Screenshots

截圖放喺 `docs-assets/` 入面。
