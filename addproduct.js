/**
 * addproduct.js - 新增商品到 Astraflow API
 * 為每個產品卡片添加「新增商品」按鈕，將產品數據發送到 API
 */

(function() {
  'use strict';

  const API_ENDPOINT = 'https://astraflow.tw/api/create_product.php';
  const TOKEN_KEY = 'astraflow_token';
  const SENT_PRODUCTS_KEY = 'astraflow_sent_products';

  // 從 localStorage 獲取已發送的產品 ID
  function getSentProducts() {
    try {
      const sent = localStorage.getItem(SENT_PRODUCTS_KEY);
      return sent ? JSON.parse(sent) : {};
    } catch (e) {
      return {};
    }
  }

  // 保存已發送的產品 ID
  function markProductAsSent(productId, pendingId) {
    const sent = getSentProducts();
    sent[productId] = {
      pendingId: pendingId,
      timestamp: Date.now()
    };
    localStorage.setItem(SENT_PRODUCTS_KEY, JSON.stringify(sent));
  }

  // 獲取或提示輸入 API token
  function getToken() {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = window.prompt('請輸入 Astraflow API token：');
      if (token) {
        localStorage.setItem(TOKEN_KEY, token.trim());
      }
    }
    return token;
  }

  // 清除 token
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    alert('API token 已清除');
  }

  const SITE_BASE = 'https://powerkeung.github.io/pokemon-daily/';
  const DEFAULT_RATES = { JPY: 0.3, USD: 48.0, TWD: 1.0 };
  const ALLOWED_SOURCES = ['pokemoncenter', 'Chiikawa Market', 'Mercari', 'amazon'];
  const ALLOWED_TYPES = ['娃娃','卡套','文具','飾品','衣鞋','卡盒','收納','其他','卡墊','廚具','盒玩','禮盒','織品','單卡','補充包','食品','內頁','帽子','桌遊','鑑定卡','公仔','書','卡磚','雨傘','鑑定費','TAKARA TOMY','卡套+卡盒','美妝','卡冊','卡本','燈具','特典包','預組','指示物盒','生活用品','直送鑑定','雜誌','居家','水壺'];

  function absUrl(src) {
    if (!src) return '';
    try {
      const u = new URL(src, window.location.href);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        if (u.hostname === 'powerkeung.github.io') return u.href;
        if (u.hostname === 'localhost' || u.protocol === 'file:') return '';
        return u.href;
      }
    } catch (e) {}
    // file:// 等本地預覽：用 img/ 之後嘅路徑對返線上網址
    const i = src.lastIndexOf('img/');
    return i >= 0 ? SITE_BASE + src.slice(i) : '';
  }

  // 提取產品數據
  function extractProductData(card) {
    const productId = card.getAttribute('data-product-id');
    const body = card.querySelector('.body') || card;
    const originalTitle = body.querySelector('h3')?.textContent.trim() || '';
    const nameZh = (card.getAttribute('data-name-zh') || '').trim();
    const name = nameZh || originalTitle;

    let type = (card.getAttribute('data-type') || '').trim();
    if (ALLOWED_TYPES.indexOf(type) < 0) type = '其他';
    const subtype = (card.getAttribute('data-subtype') || '').trim().slice(0, 50);

    const description = [];
    if (originalTitle) description.push('原名：' + originalTitle);
    const priceText = body.querySelector('.price')?.textContent.trim();
    if (priceText) description.push('價錢：' + priceText);
    body.querySelectorAll('.dates dt').forEach(dt => {
      const dd = dt.nextElementSibling;
      if (dd) description.push(dt.textContent.trim() + '：' + dd.textContent.trim());
    });

    const remark = [];
    body.querySelectorAll('a.btn').forEach(link => {
      if (link.href && link.href.indexOf('javascript:') !== 0) {
        remark.push(link.textContent.trim() + ': ' + link.href);
      }
    });
    remark.push('報告頁面: ' + window.location.href);

    const images = [];
    card.querySelectorAll('.shot img, img').forEach(img => {
      const u = absUrl(img.getAttribute('src'));
      if (u && images.indexOf(u) < 0 && images.length < 20) images.push(u);
    });

    const data = {
      name: name,
      type: type,
      stock: 0,
      ip: '寶可夢',
      source_name: 'Pokémon Daily 報告',
      source_id: productId,
      description: description.join('\n'),
      remark: remark.join('\n'),
      image_urls: images
    };
    if (subtype) data.subtype = subtype;

    const dataSource = (card.getAttribute('data-source') || '').trim();
    if (ALLOWED_SOURCES.indexOf(dataSource) >= 0) {
      data.source = dataSource;
    }

    const currency = (card.getAttribute('data-currency') || '').trim().toUpperCase();
    const orig = parseFloat(card.getAttribute('data-original-price') || '');
    if (currency && DEFAULT_RATES[currency] != null && isFinite(orig) && orig >= 0) {
      const rate = DEFAULT_RATES[currency];
      data.currency = currency;
      data.original_price = orig;
      data.exchange_rate = Math.round(rate * 10) / 10;
    }
    return data;
  }

  // 發送產品到 API
  async function sendProduct(productData, button) {
    const token = getToken();
    if (!token) {
      button.textContent = '已取消';
      setTimeout(() => {
        button.textContent = '新增商品';
        button.disabled = false;
      }, 2000);
      return;
    }

    button.textContent = '送出中…';
    button.disabled = true;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Token': token
        },
        body: JSON.stringify(productData)
      });

      if (response.status === 401) {
        // Token 無效，清除並重新詢問
        localStorage.removeItem(TOKEN_KEY);
        alert('API token 無效或已過期，請重新輸入');
        button.textContent = '新增商品';
        button.disabled = false;
        if (localStorage.getItem(TOKEN_KEY) === null && getToken()) {
          return sendProduct(productData, button);
        }
        return;
      }

      let result = {};
      try { result = await response.json(); } catch (e) {}

      if (response.ok && result.success !== false) {
        const item = (result.data && result.data.items && result.data.items[0]) || {};
        const pendingId = item.pending_id != null ? item.pending_id : '?';
        markProductAsSent(productData.source_id, pendingId);
        if (item.duplicate === true) {
          alert('已在待批准中（重複，pending_id ' + pendingId + '）');
          button.textContent = '已在待批准 #' + pendingId;
        } else {
          alert('已送入待批准（pending_id ' + pendingId + '）');
          button.textContent = '已送入待批准 #' + pendingId;
        }
        button.classList.add('success');
      } else {
        const msg = result.message || ('HTTP ' + response.status);
        alert('新增失敗（' + response.status + '）：' + msg);
        button.textContent = '發送失敗';
        button.classList.add('error');
        setTimeout(() => {
          button.textContent = '新增商品';
          button.classList.remove('error');
          button.disabled = false;
        }, 3000);
      }
    } catch (error) {
      // 檢查是否為 CORS 錯誤
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        button.textContent = '伺服器未允許網頁直接呼叫（CORS）';
      } else {
        button.textContent = '網絡錯誤';
      }
      button.classList.add('error');
      setTimeout(() => {
        button.textContent = '新增商品';
        button.classList.remove('error');
        button.disabled = false;
      }, 5000);
    }
  }

  // 創建並添加按鈕到產品卡片
  function addButtonToCard(card) {
    const productId = card.getAttribute('data-product-id');
    if (!productId) return;

    const body = card.querySelector('.body');
    if (!body) return;

    // 創建按鈕容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'add-product-btn-container';
    
    const button = document.createElement('button');
    button.className = 'add-product-btn';
    
    // 檢查是否已發送
    const sentProducts = getSentProducts();
    if (sentProducts[productId]) {
      button.textContent = `已送出 #${sentProducts[productId].pendingId}`;
      button.disabled = true;
      button.classList.add('success');
    } else {
      button.textContent = '新增商品';
    }

    button.addEventListener('click', async function() {
      if (this.disabled) return;
      
      const productData = extractProductData(card);
      await sendProduct(productData, this);
    });

    buttonContainer.appendChild(button);
    body.appendChild(buttonContainer);
  }

  // 添加重設 token 連結到 footer
  function addResetTokenLink() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const resetLink = document.createElement('a');
    resetLink.href = 'javascript:void(0)';
    resetLink.textContent = '重設 API token';
    resetLink.className = 'reset-token-link';
    resetLink.style.cssText = 'margin-left: 12px; color: var(--b); text-decoration: underline; cursor: pointer;';
    resetLink.addEventListener('click', clearToken);

    const footerParagraph = footer.querySelector('p');
    if (footerParagraph) {
      footerParagraph.appendChild(document.createTextNode(' | '));
      footerParagraph.appendChild(resetLink);
    }
  }

  // 添加樣式
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .add-product-btn-container {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
      }
      .add-product-btn {
        width: 100%;
        min-height: 38px;
        padding: 0 16px;
        border-radius: 8px;
        border: 1.5px solid var(--line);
        background: var(--card);
        color: var(--ink);
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .add-product-btn:hover:not(:disabled) {
        background: var(--bg);
        border-color: var(--b);
        color: var(--b);
      }
      .add-product-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .add-product-btn.success {
        border-color: var(--g);
        color: var(--g);
      }
      .add-product-btn.error {
        border-color: var(--r);
        color: var(--r);
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  // 初始化
  function init() {
    addStyles();
    
    // 為所有產品卡片添加按鈕
    const cards = document.querySelectorAll('.card[data-product-id]');
    cards.forEach(addButtonToCard);

    // 添加重設 token 連結
    addResetTokenLink();
  }

  // DOM 加載完成後初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
