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
3. **更新導航清單**：喺 `reports/index.json` 最上面加入新日期：
   ```json
   {
     "date": "2026-10-15",
     "label": "2026/10/15（四）"
   }
   ```
4. **確保導航腳本**：確保所有報告頁面嘅 `</body>` 前有 `<script src="/pokemon-daily/nav.js"></script>`

導航欄會自動顯示前一日／後一日連結同日期選擇器。

## 📸 Screenshots

截圖放喺 `docs-assets/` 入面。
