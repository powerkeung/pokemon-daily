/**
 * snooze.js - 「一個月內不再提醒」(v2, 2026-11-24)
 * - 單品卡（article.card[data-product-id]）、系列卡（article.card[data-line-id]）、系列入面每個 SKU（.sku[data-product-id]）都有按鈕
 * - 記錄：localStorage「pkd_snooze_v1」→ { "p:<data-product-id>" | "l:<data-line-id>": {until, at, name, date, link, skus?} }，30 日到期
 * - 比對：
 *     系列卡收埋 ⇐ l:<line-id> 有記錄，或者旗下全部 SKU 都有 p: 記錄
 *     SKU 格收埋 ⇐ p:<pid> 有記錄，或者屬於已收埋嘅系列
 *     單品卡收埋 ⇐ p:<pid> 有記錄，或者 pid 喺某個系列記錄嘅 skus 入面（舊頁／拆返做單品都得）
 * - 跨裝置：localStorage 只喺同一個瀏覽器有效；可以用「複製同步連結」(#pkd-snooze=…) 帶去另一部機，
 *   或者由報告維護者寫入 /pokemon-daily/snoozed.json（所有裝置共用）。
 * - id 改名：snoozed.json 嘅 "aliases" {"舊 id":"新 id"}（product 同 line 都得），舊記錄會自動轉。
 */
(function () {
  'use strict';
  var KEY = 'pkd_snooze_v1';
  var DAYS = 30, DAY_MS = 86400000;
  var SHARED_URL = '/pokemon-daily/snoozed.json';
  var HASH_KEY = 'pkd-snooze=';
  var ALIASES = {};           // 由 snoozed.json 補充
  var SHARED = {};            // snoozed.json 入面仲未過期嘅項目（唔寫入 localStorage）
  var storageOK = true;
  var MEM = {};               // 今次頁面入面按咗嘅（儲存失敗時都照收埋）

  function canon(id) { var seen = 0; while (ALIASES[id] && seen++ < 10) id = ALIASES[id]; return id; }
  function ckey(k) { return k ? k.slice(0, 2) + canon(k.slice(2)) : k; }

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function save(db) {
    try {
      var s = JSON.stringify(db);
      localStorage.setItem(KEY, s);
      storageOK = localStorage.getItem(KEY) === s;
    } catch (e) { storageOK = false; }
    return storageOK;
  }
  // 合併本機 + 共用清單，清走過期，套用 aliases
  function load() {
    var raw = readLocal(), db = {}, now = Date.now(), changed = false;
    Object.keys(raw).forEach(function (k) {
      var r = raw[k];
      if (!r || !(r.until > now)) { changed = true; return; }
      var nk = ckey(k);
      if (nk !== k) changed = true;
      if (r.skus) r.skus = r.skus.map(canon);
      if (!db[nk] || db[nk].until < r.until) db[nk] = r;
    });
    if (changed) save(db);
    Object.keys(MEM).forEach(function (k) { if (!db[k] && MEM[k].until > now) db[k] = MEM[k]; });
    Object.keys(SHARED).forEach(function (k) {
      var nk = ckey(k);
      if (!db[nk]) db[nk] = SHARED[k];
    });
    return db;
  }

  function keyOf(el) {
    var line = el.getAttribute('data-line-id');
    if (line) return 'l:' + canon(line);
    var pid = el.getAttribute('data-product-id');
    return pid ? 'p:' + canon(pid) : null;
  }
  function skuIds(card) {
    var ids = (card.getAttribute('data-sku-ids') || '').split(/\s+/).filter(Boolean);
    card.querySelectorAll('.sku[data-product-id]').forEach(function (s) {
      var id = s.getAttribute('data-product-id');
      if (ids.indexOf(id) < 0) ids.push(id);
    });
    return ids.map(canon);
  }
  function lineRecFor(pid, db) {
    var ks = Object.keys(db);
    for (var i = 0; i < ks.length; i++) {
      if (ks[i].indexOf('l:') === 0 && (db[ks[i]].skus || []).map(canon).indexOf(pid) >= 0) return { key: ks[i], rec: db[ks[i]] };
    }
    return null;
  }
  function pidRec(pid, db) {
    pid = canon(pid);
    if (db['p:' + pid]) return { key: 'p:' + pid, rec: db['p:' + pid] };
    return lineRecFor(pid, db);
  }
  function recordFor(el, db) {
    var k = keyOf(el);
    if (!k) return null;
    if (db[k]) return { key: k, rec: db[k] };
    if (k.indexOf('l:') === 0) {
      var ids = skuIds(el);
      if (ids.length && ids.every(function (id) { return pidRec(id, db); })) {
        var r = pidRec(ids[0], db);
        return { key: r.key, rec: r.rec, viaSkus: true };
      }
      return null;
    }
    return pidRec(k.slice(2), db);
  }

  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function info(el) {
    var isSku = el.classList.contains('sku');
    var name = el.getAttribute('data-line-id')
      ? txt(el.querySelector('.line-title') || el.querySelector('h3'))
      : (el.getAttribute('data-name-zh') || txt(el.querySelector('.sku-name') || el.querySelector('h3')));
    var date = el.getAttribute('data-key-date') || txt(el.querySelector('.status')) || txt(el.querySelector('.chip')) || txt(el.querySelector('.dates dd'));
    if (isSku && !date) {
      var line = el.closest('[data-line-id]');
      if (line) date = line.getAttribute('data-key-date') || '';
    }
    date = date.replace(/[🚨🆕]\s*/g, '');
    if (date.length > 40) date = date.slice(0, 40) + '…';
    var scope = isSku ? (el.closest('[data-line-id]') || el) : el;
    var a = scope.querySelector('a.btn[href^="http"]');
    return { name: name, date: date, link: a ? a.href : '' };
  }
  function fmt(ts) { var d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); }

  var box = null, list = null, store = null, countEl = null, warnEl = null;
  function ensureBox() {
    if (box) return;
    var main = document.querySelector('main') || document.body;
    var notes = document.querySelector('section.notes');
    if (!notes) {
      notes = document.createElement('section');
      notes.className = 'notes';
      notes.innerHTML = '<h2><span class="dot grey"></span>其他更新</h2>';
      var archive = main.querySelector('.archive');
      if (archive) main.insertBefore(notes, archive); else main.appendChild(notes);
    }
    box = document.createElement('details');
    box.className = 'snoozed-box';
    box.id = 'snoozed';
    box.innerHTML = '<summary>🔕 已收埋（一個月內不再提醒）<span class="cnt"></span></summary>' +
      '<p class="snz-hint">記錄存喺呢個瀏覽器；換機／換瀏覽器／App 內置瀏覽器要用「複製同步連結」帶過去。</p>' +
      '<p class="snz-warn" hidden></p>' +
      '<ul class="snoozed-list"></ul>' +
      '<div class="snz-tools"><button type="button" class="snz-sync">📋 複製同步連結</button></div>';
    store = document.createElement('div');
    store.className = 'snoozed-store';
    store.hidden = true;
    box.appendChild(store);
    var h2 = notes.querySelector('h2');
    if (h2) h2.insertAdjacentElement('afterend', box); else notes.insertBefore(box, notes.firstChild);
    list = box.querySelector('.snoozed-list');
    countEl = box.querySelector('.cnt');
    warnEl = box.querySelector('.snz-warn');
    box.querySelector('.snz-sync').addEventListener('click', copySyncLink);
  }
  function refreshBox() {
    if (!box) return;
    var n = list.children.length;
    box.hidden = n === 0;
    countEl.textContent = n ? '（' + n + '）' : '';
    if (!storageOK) {
      warnEl.hidden = false;
      warnEl.textContent = '⚠️ 呢個瀏覽器唔俾儲存（無痕模式／App 內置瀏覽器？），關咗頁面就會冇咗。請用 Safari／Chrome 開，或者用同步連結。';
    }
  }
  function refreshSections() {
    document.querySelectorAll('main section:not(.notes):not(.archive)').forEach(function (sec) {
      if (!sec.querySelector('.card')) return;
      sec.hidden = !sec.querySelector('.card:not([data-snoozed])');
    });
    document.dispatchEvent(new CustomEvent('pkd:snooze-change'));
  }

  function addItem(el, rec) {
    var i = info(el);
    var li = document.createElement('li');
    li.className = 'snz-item';
    li.innerHTML = '<span class="snz-name"></span>' + (i.date ? '<span class="snz-date"></span>' : '') +
      (i.link ? '<a class="snz-link" target="_blank" rel="noopener">連結 ›</a>' : '') +
      '<span class="snz-until">至 ' + fmt(rec.until) + (rec.shared ? '（共用清單）' : '') + '</span>' +
      (rec.shared ? '' : '<button type="button" class="snz-undo">恢復提醒</button>');
    li.querySelector('.snz-name').textContent = (el.classList.contains('sku') ? '［單款］' : '') + i.name;
    if (i.date) li.querySelector('.snz-date').textContent = i.date;
    if (i.link) li.querySelector('.snz-link').href = i.link;
    var u = li.querySelector('.snz-undo');
    if (u) u.addEventListener('click', function () { restore(el, li); });
    list.appendChild(li);
    el._snzItem = li;
  }

  function moveOut(card, rec) {
    ensureBox();
    if (card.hasAttribute('data-snoozed')) return;
    var ph = document.createComment('snoozed:' + keyOf(card));
    card.parentNode.insertBefore(ph, card);
    card._snzPlaceholder = ph;
    card.setAttribute('data-snoozed', '1');
    card.hidden = true;
    // 成個系列收埋：入面之前逐款收埋嘅 SKU 唔使再喺清單重複列出
    card.querySelectorAll('.sku[data-snoozed]').forEach(function (s) {
      s.removeAttribute('data-snoozed'); s.hidden = false;
      if (s._snzItem && s._snzItem.parentNode) s._snzItem.parentNode.removeChild(s._snzItem);
      s._snzItem = null;
    });
    store.appendChild(card);
    addItem(card, rec);
    refreshBox();
  }
  function hideSku(sku, rec) {
    ensureBox();
    if (sku.hasAttribute('data-snoozed')) return;
    sku.setAttribute('data-snoozed', '1');
    sku.hidden = true;
    addItem(sku, rec);
    refreshBox();
  }

  function forget(db, el) {
    var k = keyOf(el);
    delete db[k];
    var pids = k.indexOf('l:') === 0 ? skuIds(el) : [k.slice(2)];
    pids.forEach(function (pid) {
      delete db['p:' + pid];
      Object.keys(db).forEach(function (kk) {
        if (kk.indexOf('l:') === 0 && db[kk].skus && k.indexOf('p:') === 0) {
          var j = db[kk].skus.indexOf(pid);
          if (j >= 0) {
            // 只係恢復單一款：系列記錄改做「其餘 SKU 各自收埋」
            var rest = db[kk].skus.filter(function (x) { return x !== pid; });
            rest.forEach(function (x) { if (!db['p:' + x]) db['p:' + x] = { until: db[kk].until, at: db[kk].at, name: db[kk].name }; });
            delete db[kk];
          }
        }
      });
    });
  }

  function restore(el, li) {
    var db = readLocal();
    forget(db, el);
    forget(MEM, el);
    save(db);
    el.removeAttribute('data-snoozed');
    el.hidden = false;
    var ph = el._snzPlaceholder;
    if (ph && ph.parentNode) { ph.parentNode.insertBefore(el, ph); ph.parentNode.removeChild(ph); }
    if (li && li.parentNode) li.parentNode.removeChild(li);
    if (el.matches('article.card[data-line-id]')) {
      el.querySelectorAll('.sku[data-snoozed]').forEach(function (s) {
        s.removeAttribute('data-snoozed'); s.hidden = false;
        if (s._snzItem && s._snzItem.parentNode) s._snzItem.parentNode.removeChild(s._snzItem);
      });
    }
    refreshBox();
    refreshSections();
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
  }

  function snooze(el) {
    var db = readLocal();
    var k = keyOf(el);
    var i = info(el);
    var rec = { until: Date.now() + DAYS * DAY_MS, at: Date.now(), name: i.name, date: i.date, link: i.link, page: location.pathname };
    if (k.indexOf('l:') === 0) rec.skus = skuIds(el);
    db[k] = rec;
    MEM[k] = rec;
    if (!save(db)) alert('呢個瀏覽器唔俾儲存「不再提醒」（無痕模式／App 內置瀏覽器？）。今次會收埋，但重新開頁就會再出現。');
    apply(load());
  }

  function topCards() {
    return Array.prototype.filter.call(
      document.querySelectorAll('article.card[data-line-id], .card[data-product-id]:not(.sku)'),
      function (c) { return !(c.parentElement && c.parentElement.closest('.card[data-line-id]')); });
  }

  function apply(db) {
    var changed = false;
    var lineRecs = {};
    topCards().forEach(function (card) {
      if (card.hasAttribute('data-snoozed')) return;
      var r = recordFor(card, db);
      if (r && r.rec) { moveOut(card, r.rec); changed = true; }
    });
    // 系列記錄：記低今日嘅 SKU（之後舊頁／拆返做單品都會跟住收埋）
    document.querySelectorAll('article.card[data-line-id][data-snoozed]').forEach(function (card) {
      var k = keyOf(card), local = readLocal();
      if (local[k]) {
        var ids = skuIds(card), cur = local[k].skus || [], add = ids.filter(function (x) { return cur.indexOf(x) < 0; });
        if (add.length) { local[k].skus = cur.concat(add); save(local); }
      }
    });
    // 未收埋嘅系列入面，逐款 SKU
    document.querySelectorAll('article.card[data-line-id]:not([data-snoozed]) .sku[data-product-id]').forEach(function (sku) {
      if (sku.hasAttribute('data-snoozed')) return;
      var r = pidRec(sku.getAttribute('data-product-id'), db);
      if (r && r.rec) { hideSku(sku, r.rec); changed = true; }
    });
    if (changed) refreshSections();
  }

  function addButton(el) {
    var isSku = el.classList.contains('sku');
    var host = isSku ? (el.querySelector('.sku-body') || el) : (el.querySelector(':scope > .body') || el.querySelector('.body') || el);
    if (host.querySelector(':scope > .snooze-btn')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'snooze-btn' + (isSku ? ' sku-snz' : '');
    b.textContent = isSku ? '🔕 呢款不再提醒' : '🔕 一個月內不再提醒';
    b.title = '30 日內將呢' + (el.getAttribute('data-line-id') ? '個系列' : (isSku ? '款' : '件商品')) + '搬去「其他更新」';
    b.addEventListener('click', function () { snooze(el); });
    host.appendChild(b);
  }

  // ---- 跨裝置同步連結 ----
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function copySyncLink() {
    var db = readLocal(), slim = {};
    Object.keys(db).forEach(function (k) { slim[k] = { u: db[k].until, s: db[k].skus || undefined, n: db[k].name || undefined }; });
    var url = location.origin + '/pokemon-daily/#' + HASH_KEY + b64e(JSON.stringify(slim));
    var done = function () { alert('已複製同步連結。喺另一部機（同一個瀏覽器）打開呢條連結，就會套用同一批「不再提醒」。'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt('複製呢條連結：', url); });
    else prompt('複製呢條連結：', url);
  }
  function importFromHash() {
    var h = location.hash || '';
    var i = h.indexOf(HASH_KEY);
    if (i < 0) return;
    try {
      var slim = JSON.parse(b64d(h.slice(i + HASH_KEY.length)));
      var db = readLocal(), now = Date.now(), n = 0;
      Object.keys(slim).forEach(function (k) {
        var r = slim[k];
        if (!/^[lp]:/.test(k) || !(r.u > now)) return;
        if (!db[k] || db[k].until < r.u) { db[k] = { until: r.u, at: now, name: r.n || '', skus: r.s, imported: true }; n++; }
      });
      save(db);
      history.replaceState(null, '', location.pathname + location.search);
      if (n) setTimeout(function () { alert('已匯入 ' + n + ' 項「不再提醒」。'); }, 300);
    } catch (e) {}
  }

  // ---- 共用清單 snoozed.json（所有裝置） ----
  function loadShared() {
    if (!window.fetch) return Promise.resolve(false);
    return fetch(SHARED_URL + '?t=' + Math.floor(Date.now() / 3600000), { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) return false;
        var now = Date.now(), any = false;
        Object.keys(j.aliases || {}).forEach(function (k) { ALIASES[k] = j.aliases[k]; any = true; });
        (j.items || []).forEach(function (it) {
          var until = Date.parse(it.until);
          if (!it.id || !(until > now)) return;
          var k = (it.line ? 'l:' : 'p:') + it.id;
          SHARED[k] = { until: until, at: Date.parse(it.since || '') || now, name: it.note || '', skus: it.skus, shared: true };
          any = true;
        });
        return any;
      })
      .catch(function () { return false; });
  }

  function addStyles() {
    var st = document.createElement('style');
    st.textContent =
      '.snooze-btn{display:block;width:100%;margin-top:8px;min-height:40px;border-radius:8px;border:1.5px dashed var(--line);background:transparent;color:var(--mute);font:inherit;font-size:13px;font-weight:700;cursor:pointer}' +
      '.snooze-btn.sku-snz{min-height:34px;margin-top:6px;font-size:12px;border-style:solid}' +
      '.snooze-btn:hover{border-color:var(--o);color:var(--o)}' +
      '.sku[hidden]{display:none!important}' +
      '.snoozed-box{margin:10px 0 14px;padding:4px 12px;border:1px dashed var(--line);border-radius:12px;background:var(--bg)}' +
      '.snoozed-box[hidden]{display:none}' +
      '.snoozed-box>summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-size:15px;font-weight:800}' +
      '.snz-hint{margin:0 0 6px;font-size:12px;color:var(--mute)}' +
      '.snz-warn{margin:0 0 6px;font-size:13px;font-weight:700;color:var(--r)}' +
      '.snoozed-list{list-style:none;margin:0;padding:0}' +
      '.snz-item{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:14px}' +
      '.snz-item:last-child{border-bottom:0}' +
      '.snz-name{font-weight:700;flex:1 1 220px;min-width:0}' +
      '.snz-date,.snz-until{font-size:12px;color:var(--mute)}' +
      '.snz-link{color:var(--b);font-weight:700;white-space:nowrap}' +
      '.snz-undo,.snz-sync{border:1.5px solid var(--b);background:transparent;color:var(--b);border-radius:8px;font:inherit;font-size:12.5px;font-weight:700;padding:6px 12px;min-height:36px;cursor:pointer}' +
      '.snz-undo:hover,.snz-sync:hover{background:var(--b);color:#fff}' +
      '.snz-tools{padding:8px 0 10px}';
    document.head.appendChild(st);
  }

  function init() {
    addStyles();
    importFromHash();
    apply(load());                        // 同步：喺 filter.js 計數之前收埋
    setTimeout(function () {              // 等 addproduct.js 放咗「新增商品」先加按鈕
      topCards().forEach(addButton);
      document.querySelectorAll('article.card[data-line-id] .sku[data-product-id]').forEach(addButton);
    }, 0);
    loadShared().then(function (any) { if (any) apply(load()); });
  }

  window.pkdSnooze = {
    load: load, raw: readLocal,
    clearAll: function () { localStorage.removeItem(KEY); location.reload(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
