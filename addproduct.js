/**
 * addproduct.js - 新增商品到 Astraflow API
 * 為每個產品卡片添加「新增商品」按鈕，將產品數據發送到 API
 */

(function() {
  'use strict';

  const API_ENDPOINT = 'https://astraflow.tw/CM5/api/create_product.php';
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

  // 解析價格（¥1,760 或 US$139.95）
  function parsePrice(priceText) {
    if (!priceText) return 0;
    const match = priceText.match(/[\d,]+(?:\.\d+)?/);
    if (!match) return 0;
    return parseFloat(match[0].replace(/,/g, ''));
  }

  // 提取產品數據
  function extractProductData(card) {
    const productId = card.getAttribute('data-product-id');
    const shot = card.querySelector('.shot img');
    const body = card.querySelector('.body');
    
    // 基本信息
    const name = body.querySelector('h3')?.textContent.trim() || '';
    const priceElement = body.querySelector('.price');
    const price = priceElement ? parsePrice(priceElement.textContent) : 0;
    
    // 類型（日版/美版）
    const regElement = card.querySelector('.reg');
    const type = regElement?.textContent.trim() || '';
    
    // 子類型（抽選/預約/現貨）
    const acquisition = card.getAttribute('data-acquisition') || '';
    let subtype = '';
    if (acquisition.includes('lottery')) subtype = '抽選';
    else if (acquisition.includes('store')) subtype = '現貨';
    else if (acquisition.includes('online')) subtype = '預約';
    
    // 描述（收集日期和取得渠道）
    const description = [];
    const dates = body.querySelectorAll('.dates dd');
    dates.forEach(dd => {
      const text = dd.textContent.trim();
      if (text) description.push(text);
    });
    
    const channels = body.querySelectorAll('.chn');
    if (channels.length > 0) {
      description.push('取得方法：');
      channels.forEach(chn => {
        description.push('• ' + chn.textContent.trim());
      });
    }
    
    // 備註（官方連結 + 報告頁面 URL）
    const remark = [];
    const links = body.querySelectorAll('.btn, .btn.sec');
    links.forEach(link => {
      if (link.href && !link.href.includes('javascript:')) {
        remark.push(link.textContent.trim() + ': ' + link.href);
      }
    });
    remark.push('報告頁面: ' + window.location.href);
    
    // 圖片 URL
    const imageUrl = shot?.src ? new URL(shot.src, window.location.href).href : '';
    
    return {
      name: name,
      price: price,
      stock: 0,
      source: 'API',
      source_name: 'pokemon-daily',
      source_id: productId,
      ip: 'Pokémon',
      type: type,
      subtype: subtype,
      description: description.join('\n'),
      remark: remark.join('\n'),
      image_urls: imageUrl ? [imageUrl] : []
    };
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
        return;
      }

      const result = await response.json();

      if (response.ok) {
        const pendingId = result.pending_id || result.id || 'unknown';
        const isDuplicate = result.duplicate === true;
        
        markProductAsSent(productData.source_id, pendingId);
        
        if (isDuplicate) {
          button.textContent = `已在待批准 #${pendingId}`;
        } else {
          button.textContent = `已送入待批准 #${pendingId}`;
        }
        button.classList.add('success');
      } else {
        button.textContent = result.message || '發送失敗';
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
