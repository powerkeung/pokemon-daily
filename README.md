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

8. **確保腳本引用**：確保所有報告頁面嘅 `</body>` 前有：
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

從產品卡片提取以下字段發送到 `https://astraflow.tw/CM5/api/create_product.php`：

| 字段 | 來源 | 說明 |
|------|------|------|
| `name` | `<h3>` 標題 | 產品名稱 |
| `price` | `.price` 元素 | 解析的數值（JPY 或 USD），無則為 0 |
| `stock` | 固定值 | 0 |
| `source` | 固定值 | `'API'` |
| `source_name` | 固定值 | `'pokemon-daily'` |
| `source_id` | `data-product-id` 屬性 | 穩定的產品 slug |
| `ip` | 固定值 | `'Pokémon'` |
| `type` | `.reg` 元素 | `'日版'` 或 `'美版'` |
| `subtype` | `data-acquisition` 屬性 | `'抽選'`、`'預約'` 或 `'現貨'`（可推斷） |
| `description` | `.dates dd` + `.chn` | 日期和取得渠道的純文本 |
| `remark` | `.btn` 連結 + 報告 URL | 官方連結和報告頁面 URL |
| `image_urls` | `.shot img src` | 產品圖片的絕對 URL 陣列 |

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
artbook, beats, cardset, deltareign, filepremium, holidayhelpers, 
megadeck, metamon, miare, mokomoko_coil, nishikawa, omaroke, 
plush_freezer, pokecharm, polaroid, ricecookie, santacruz, 
scaleworld3, windowsill, xmas
```

---

## 📸 Screenshots

截圖放喺 `docs-assets/` 入面。
