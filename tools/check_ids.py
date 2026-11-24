#!/usr/bin/env python3
"""
tools/check_ids.py — 每日 build 嘅 id 穩定性檢查（「一個月內不再提醒」同「新增商品」去重都靠 id）。
用法：
  python3 tools/check_ids.py reports/2026-11-24/index.html            # 自動搵前一日（reports/index.json）
  python3 tools/check_ids.py 今日.html --prev reports/2026-11-23/index.html
有錯就 exit 1（唔好 publish），並列出應該沿用嘅舊 id。
檢查：
  1. 頁內 data-product-id／data-line-id 唔可以重複
  2. 前一日已有嘅商品／系列（以官方圖檔名、原名、系列名對應），今日一定要用返同一個 id
     （除非喺 snoozed.json 嘅 aliases 登記咗「舊 id → 新 id」）
  3. tools/lines.json：系列 id 唔可以改；登記咗屬於某系列嘅 SKU，今日出現就一定要喺嗰張系列卡入面（唔可以變單品卡或者入第二個系列）
  4. 系列卡嘅 data-sku-ids 要同卡入面 .sku 一致
"""
import json, os, re, sys
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def norm(s):
    s = re.sub(r'[\s　]+', '', s or '')
    s = re.sub(r'[🚨🆕📍]', '', s)
    return s

def items(path):
    s = BeautifulSoup(open(path, encoding='utf-8').read(), 'html.parser')
    out = []   # (kind, id, keys, line_of_sku)
    for a in s.select('main [data-line-id]'):
        t = a.select_one('.line-title') or a.select_one('h3')
        out.append(('line', a['data-line-id'], {'title:' + norm(t.get_text()) if t else None}, None, a))
    for e in s.select('main [data-product-id]'):
        is_sku = 'sku' in (e.get('class') or [])
        t = e.select_one('.sku-name') if is_sku else (e.select_one('h3.name-jp') or e.select_one('h3'))
        img = e.select_one('img')
        keys = set()
        if t: keys.add('name:' + norm(t.get_text()))
        if img and img.get('src'): keys.add('img:' + os.path.basename(img['src']))
        if e.get('data-name-zh'): keys.add('zh:' + norm(e['data-name-zh']))
        line = e.find_parent(attrs={'data-line-id': True})
        out.append(('sku' if is_sku else 'card', e['data-product-id'], keys, line['data-line-id'] if line else None, e))
    return out

def unique_keys(its, kind_group):
    cnt = {}
    for k, i, keys, _, _ in its:
        if (k == 'line') != (kind_group == 'line'): continue
        for x in keys:
            if x: cnt[x] = cnt.get(x, 0) + 1
    return {x for x, n in cnt.items() if n == 1}

def prev_page(path):
    m = re.search(r'(\d{4}-\d{2}-\d{2})', path)
    idx = os.path.join(ROOT, 'reports', 'index.json')
    dates = [r['date'] for r in json.load(open(idx))] if os.path.exists(idx) else []
    dates = sorted(set(dates + [d for d in os.listdir(os.path.join(ROOT, 'reports')) if re.match(r'\d{4}-\d{2}-\d{2}$', d)]))
    cur = m.group(1) if m else (dates[-1] if dates else None)
    earlier = [d for d in dates if cur and d < cur]
    if not m and dates and os.path.abspath(path) == os.path.join(ROOT, 'index.html'):
        earlier = [d for d in dates if d < dates[-1]]
    if not earlier: return None
    p = os.path.join(ROOT, 'reports', earlier[-1], 'index.html')
    return p if os.path.exists(p) else None

def check(today, prev=None, quiet=False):
    errs, warns = [], []
    T = items(today)
    # 1. duplicates
    seen = {}
    for k, i, _, _, _ in T:
        kk = ('line' if k == 'line' else 'pid', i)
        seen[kk] = seen.get(kk, 0) + 1
    for (g, i), n in seen.items():
        if n > 1: errs.append(f'重複 {g} id：{i}（{n} 次）')
    # aliases
    aliases = {}
    sj = os.path.join(ROOT, 'snoozed.json')
    if os.path.exists(sj):
        aliases = json.load(open(sj, encoding='utf-8')).get('aliases', {})
    # 2. previous day
    prev = prev or prev_page(today)
    if prev and os.path.abspath(prev) != os.path.abspath(today):
        P = items(prev)
        for grp in ('line', 'pid'):
            tk = unique_keys(T, grp); pk = unique_keys(P, grp)
            pmap = {}
            for k, i, keys, _, _ in P:
                if (k == 'line') != (grp == 'line'): continue
                for x in keys:
                    if x in pk: pmap[x] = i
            tids = {i for k, i, _, _, _ in T if (k == 'line') == (grp == 'line')}
            reported = set()
            for k, i, keys, _, _ in T:
                if (k == 'line') != (grp == 'line'): continue
                for x in keys:
                    if x in tk and x in pmap and pmap[x] != i and aliases.get(pmap[x]) != i:
                        old = pmap[x]
                        if (old, i) in reported: continue
                        reported.add((old, i))
                        if old in tids:
                            warns.append(f'{grp} 「{i}」同前一日「{old}」有相同 {x.split(":")[0]}（{x[:60]}），但兩個 id 今日都存在，請確認')
                        else:
                            errs.append(f'{grp} id 改咗：前一日「{old}」→ 今日「{i}」（對應 {x[:70]}）。請沿用「{old}」，或者喺 snoozed.json aliases 登記 "{old}": "{i}"')
    # 3. lines.json
    lj = os.path.join(ROOT, 'tools', 'lines.json')
    if os.path.exists(lj):
        L = json.load(open(lj, encoding='utf-8'))
        tl = {i: e for k, i, _, _, e in T if k == 'line'}
        where = {i: (k, line) for k, i, _, line, _ in T if k != 'line'}
        owner = {}
        for g in L.get('lines', []):
            for pid in g['pids']:
                if pid in owner and owner[pid] != g['id']:
                    errs.append(f'lines.json：SKU {pid} 同時屬於 {owner[pid]} 同 {g["id"]}')
                owner[pid] = g['id']
        for pid, lid in owner.items():
            if pid in where:
                k, line = where[pid]
                if line != lid:
                    errs.append(f'SKU {pid} 喺 lines.json 屬於系列 {lid}，但今日' + (f'喺系列 {line}' if line else '係單品卡') +
                                f'。請放返入 data-line-id="{lid}"（id 一經用過唔可以改）')
        lj_ids = {g['id'] for g in L.get('lines', [])}
        for i in tl:
            if i not in lj_ids:
                errs.append(f'系列 {i} 未登記喺 tools/lines.json（新系列請加入，之後日子沿用）')
    # 4. data-sku-ids consistency
    for k, i, _, _, e in T:
        if k != 'line': continue
        declared = (e.get('data-sku-ids') or '').split()
        actual = [s['data-product-id'] for s in e.select('.sku[data-product-id]')]
        if declared and sorted(declared) != sorted(actual):
            errs.append(f'系列 {i} 嘅 data-sku-ids {declared} 同卡內 SKU {actual} 唔一致')
    if not quiet:
        print(f'check_ids: {today}' + (f'（對比 {prev}）' if prev else '（搵唔到前一日頁面）'))
        for w in warns: print('  ⚠️ ', w)
        for e in errs: print('  ❌', e)
        if not errs: print('  ✅ id 檢查通過')
    return errs, warns

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args: sys.exit(__doc__)
    prev = None
    if '--prev' in args:
        j = args.index('--prev'); prev = args[j + 1]; del args[j:j + 2]
    bad = False
    for t in args:
        e, _ = check(t, prev)
        bad = bad or bool(e)
    sys.exit(1 if bad else 0)
