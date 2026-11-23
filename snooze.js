/**
 * snooze.js - 「一個月內不再提醒」
 * 每張商品卡（data-product-id）或系列卡（data-line-id）加一粒按鈕；
 * 按咗之後 30 日內，呢張卡會由主欄目搬去「其他更新」，只顯示一行（名・日期・連結），可以「恢復提醒」。
 * 純前端：記錄存喺呢部機呢個瀏覽器嘅 localStorage（pkd_snooze_v1），唔會同步去其他裝置。
 */
(function () {
  'use strict';
  var KEY = 'pkd_snooze_v1';
  var DAYS = 30;
  var DAY_MS = 86400000;

  function load() {
    var db = {};
    try { db = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { db = {}; }
    var now = Date.now(), changed = false;
    Object.keys(db).forEach(function (k) {
      if (!db[k] || !(db[k].until > now)) { delete db[k]; changed = true; }
    });
    if (changed) save(db);
    return db;
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }

  function keyOf(card) {
    var line = card.getAttribute('data-line-id');
    if (line) return 'l:' + line;
    var pid = card.getAttribute('data-product-id');
    return pid ? 'p:' + pid : null;
  }
  function skuIds(card) {
    var ids = (card.getAttribute('data-sku-ids') || '').split(/\s+/).filter(Boolean);
    card.querySelectorAll('.sku[data-product-id]').forEach(function (s) {
      var id = s.getAttribute('data-product-id');
      if (ids.indexOf(id) < 0) ids.push(id);
    });
    return ids;
  }
  // 一張卡係咪已經被 snooze：
  //  - 系列卡：l:<line-id> 有記錄，或者旗下所有 SKU 都各自被 snooze
  //  - 單品卡：p:<product-id> 有記錄，或者佢屬於某個已 snooze 系列（記錄入面嘅 skus）
  function recordFor(card, db) {
    var k = keyOf(card);
    if (!k) return null;
    if (db[k]) return { key: k, rec: db[k] };
    if (k.indexOf('l:') === 0) {
      var ids = skuIds(card);
      if (ids.length && ids.every(function (id) { return isPidSnoozed(id, db); })) {
        return { key: 'p:' + ids[0], rec: db['p:' + ids[0]] || findLineRec(ids[0], db) };
      }
      return null;
    }
    var pid = k.slice(2);
    var lr = findLineRec(pid, db);
    return lr ? { key: lr._key, rec: lr } : null;
  }
  function findLineRec(pid, db) {
    var found = null;
    Object.keys(db).forEach(function (k) {
      if (!found && k.indexOf('l:') === 0 && (db[k].skus || []).indexOf(pid) >= 0) {
        found = db[k]; found._key = k;
      }
    });
    return found;
  }
  function isPidSnoozed(pid, db) { return !!(db['p:' + pid] || findLineRec(pid, db)); }

  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function info(card) {
    var name = card.getAttribute('data-line-id')
      ? txt(card.querySelector('.line-title') || card.querySelector('h3'))
      : (card.getAttribute('data-name-zh') || txt(card.querySelector('h3')));
    var date = card.getAttribute('data-key-date') || txt(card.querySelector('.chip')) ||
      txt(card.querySelector('.dates dd'));
    if (date.length > 40) date = date.slice(0, 40) + '…';
    var a = card.querySelector('.body a.btn[href^="http"], a.btn[href^="http"]');
    return { name: name, date: date, link: a ? a.href : '', linkText: a ? txt(a).replace(/›/g, '').trim() : '' };
  }
  function fmt(ts) { var d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); }

  var box = null, list = null, store = null, countEl = null;
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
    box = document.createElement('div');
    box.className = 'snoozed-box';
    box.id = 'snoozed';
    box.innerHTML = '<h3>🔕 一個月內不再提醒 <span class="cnt"></span></h3>' +
      '<p class="snz-hint">只記喺呢個瀏覽器；到期自動返回主欄目。</p><ul class="snoozed-list"></ul>';
    store = document.createElement('div');
    store.className = 'snoozed-store';
    store.hidden = true;
    box.appendChild(store);
    var h2 = notes.querySelector('h2');
    if (h2) h2.insertAdjacentElement('afterend', box); else notes.insertBefore(box, notes.firstChild);
    list = box.querySelector('.snoozed-list');
    countEl = box.querySelector('.cnt');
  }
  function refreshBox() {
    if (!box) return;
    var n = list.children.length;
    box.hidden = n === 0;
    countEl.textContent = n ? '（' + n + '）' : '';
  }
  function refreshSections() {
    document.querySelectorAll('main section:not(.notes):not(.archive)').forEach(function (sec) {
      if (!sec.querySelector('.card')) return;
      var any = sec.querySelector('.card:not([data-snoozed])');
      if (!any) sec.hidden = true;
      else sec.hidden = false;
    });
    document.dispatchEvent(new CustomEvent('pkd:snooze-change'));
  }

  function moveOut(card, rec) {
    ensureBox();
    if (card.hasAttribute('data-snoozed')) return;
    var ph = document.createComment('snoozed:' + keyOf(card));
    card.parentNode.insertBefore(ph, card);
    card._snzPlaceholder = ph;
    card.setAttribute('data-snoozed', '1');
    card.hidden = true;
    store.appendChild(card);

    var i = info(card);
    var li = document.createElement('li');
    li.className = 'snz-item';
    var html = '<span class="snz-name"></span>';
    if (i.date) html += '<span class="snz-date chip sm grey"></span>';
    if (i.link) html += '<a class="snz-link" target="_blank" rel="noopener">' + '連結 ›' + '</a>';
    html += '<span class="snz-until">至 ' + fmt(rec.until) + '</span><button type="button" class="snz-undo">恢復提醒</button>';
    li.innerHTML = html;
    li.querySelector('.snz-name').textContent = i.name;
    if (i.date) li.querySelector('.snz-date').textContent = i.date;
    if (i.link) { var a = li.querySelector('.snz-link'); a.href = i.link; a.title = i.linkText; }
    li.querySelector('.snz-undo').addEventListener('click', function () { restore(card, li); });
    card._snzItem = li;
    list.appendChild(li);
    refreshBox();
  }

  function restore(card, li) {
    var db = load();
    var k = keyOf(card);
    delete db[k];
    if (k.indexOf('l:') === 0) {
      skuIds(card).forEach(function (id) { delete db['p:' + id]; });
    } else {
      var pid = k.slice(2);
      Object.keys(db).forEach(function (kk) {
        if (kk.indexOf('l:') === 0 && db[kk].skus) {
          var j = db[kk].skus.indexOf(pid);
          if (j >= 0) { db[kk].skus.splice(j, 1); if (!db[kk].skus.length && !db[kk].self) delete db[kk]; }
        }
      });
    }
    save(db);
    var ph = card._snzPlaceholder;
    card.removeAttribute('data-snoozed');
    card.hidden = false;
    if (ph && ph.parentNode) { ph.parentNode.insertBefore(card, ph); ph.parentNode.removeChild(ph); }
    if (li && li.parentNode) li.parentNode.removeChild(li);
    refreshBox();
    refreshSections();
    try { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
  }

  function snooze(card) {
    var db = load();
    var k = keyOf(card);
    var i = info(card);
    var rec = { until: Date.now() + DAYS * DAY_MS, at: Date.now(), name: i.name, date: i.date, link: i.link, page: location.pathname };
    if (k.indexOf('l:') === 0) { rec.skus = skuIds(card); rec.self = true; }
    db[k] = rec;
    save(db);
    moveOut(card, rec);
    refreshSections();
  }

  function addButton(card) {
    if (card.querySelector(':scope > .body > .snooze-btn, :scope > .snooze-btn')) return;
    var body = card.querySelector(':scope > .body') || card.querySelector('.body') || card;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'snooze-btn';
    b.textContent = '🔕 一個月內不再提醒';
    b.title = '30 日內將呢' + (card.getAttribute('data-line-id') ? '個系列' : '件商品') + '搬去「其他更新」';
    b.addEventListener('click', function () { snooze(card); });
    body.appendChild(b);
  }

  function addStyles() {
    var st = document.createElement('style');
    st.textContent =
      '.snooze-btn{display:block;width:100%;margin-top:8px;min-height:34px;border-radius:8px;border:1.5px dashed var(--line);background:transparent;color:var(--mute);font:inherit;font-size:13px;font-weight:700;cursor:pointer}' +
      '.snooze-btn:hover{border-color:var(--o);color:var(--o)}' +
      '.snoozed-box{margin:10px 0 14px;padding:10px 12px;border:1px dashed var(--line);border-radius:12px;background:var(--bg)}' +
      '.snoozed-box[hidden]{display:none}' +
      '.snoozed-box h3{margin:0 0 2px;font-size:15px}' +
      '.snz-hint{margin:0 0 6px;font-size:12px;color:var(--mute)}' +
      '.snoozed-list{list-style:none;margin:0;padding:0}' +
      '.snz-item{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:14px}' +
      '.snz-item:last-child{border-bottom:0}' +
      '.snz-name{font-weight:700;flex:1 1 220px;min-width:0}' +
      '.snz-link{color:var(--b);font-weight:700;white-space:nowrap}' +
      '.snz-until{font-size:12px;color:var(--mute);white-space:nowrap}' +
      '.snz-undo{border:1.5px solid var(--b);background:transparent;color:var(--b);border-radius:8px;font:inherit;font-size:12px;font-weight:700;padding:3px 10px;cursor:pointer}' +
      '.snz-undo:hover{background:var(--b);color:#fff}';
    document.head.appendChild(st);
  }

  function cards() {
    return Array.prototype.filter.call(
      document.querySelectorAll('article.card[data-line-id], article.card[data-product-id], .card[data-product-id]:not(.sku)'),
      function (c) { return !c.closest('.sku') && !(c.parentElement && c.parentElement.closest('.card[data-line-id]')); });
  }

  function init() {
    addStyles();
    var db = load();
    var list = cards();
    var moved = false;
    list.forEach(function (card) {
      var r = recordFor(card, db);
      if (r && r.rec) { moveOut(card, r.rec); moved = true; }
    });
    if (moved) refreshSections();
    // 按鈕延後一個 tick，等 addproduct.js 先放「新增商品」，令「不再提醒」喺最底
    setTimeout(function () { list.forEach(addButton); }, 0);
  }

  window.pkdSnooze = { load: load, clearAll: function () { localStorage.removeItem(KEY); location.reload(); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
