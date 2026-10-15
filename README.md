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
   
7. **確保腳本引用**：確保所有報告頁面嘅 `</body>` 前有：
   ```html
   <script src="/pokemon-daily/nav.js"></script>
   <script src="/pokemon-daily/filter.js"></script>
   ```

導航欄會自動顯示前一日／後一日連結同日期選擇器。篩選按鈕會根據標籤自動生成。

## 📸 Screenshots

截圖放喺 `docs-assets/` 入面。
