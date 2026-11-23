#!/usr/bin/env python3
"""
tools/tidy.py — 第二版版面（v2，2026-11-23 起）：將 v1 新版頁面（系列卡／標籤行／實體店一行）整理成「一眼睇得明」嘅版面。
每張卡只顯示：圖、中文名＋原名、價錢、一行重點日期／狀態、精簡取得方法清單；
其餘（全部日期、更新紀錄、已報、說明、渠道細節、已截止渠道、官方連結）全部收入一個 <details class="info">，唔刪內容。
用法：python3 tools/tidy.py 輸入.html 輸出1.html [輸出2.html ...]   （已經係 v2 嘅頁面會原樣輸出）
需要：pip install beautifulsoup4
"""
import re, sys, os, copy
from bs4 import BeautifulSoup, NavigableString

EMOJI = re.compile(r'[🚨🆕]\s*')

def frag(soup, html):
    return BeautifulSoup(html, 'html.parser')

def inner(el):
    return ''.join(str(c) for c in el.contents) if el else ''

def text(el):
    return re.sub(r'\s+', ' ', el.get_text()).strip() if el else ''

def split_top(h, sep):
    """split html on sep only at tag depth 0"""
    out, cur, depth, i = [], '', 0, 0
    while i < len(h):
        c = h[i]
        if c == '<':
            j = h.find('>', i)
            tag = h[i:j + 1]
            if tag.startswith('</'): depth -= 1
            elif not tag.endswith('/>') and not re.match(r'<(br|img|hr)\b', tag): depth += 1
            cur += tag; i = j + 1; continue
        if c == sep and depth == 0:
            out.append(cur); cur = ''
        else:
            cur += c
        i += 1
    out.append(cur)
    return [x.strip() for x in out if re.sub('<[^>]+>', '', x).strip()]

def short_name(name, limit=16):
    n = name.replace('📍', '').strip()
    base = re.split(r'（|\(', n, maxsplit=1)[0].strip()
    return base if (len(n) > limit and len(base) >= 2) else n

# ---------- digest ----------
def build_digest(soup, ul):
    rows = []
    for li in ul.find_all('li', recursive=False):
        h = inner(li).strip()
        urgent = '🚨' in h
        h = EMOJI.sub('', h).strip()
        parts = split_top(h, '：')
        if len(parts) >= 2 and len(re.sub('<[^>]+>', '', parts[0])) <= 24:
            label = re.sub('<[^>]+>', '', parts[0]).strip()
            rest = '：'.join(parts[1:])
        else:
            label, rest = '概況', h
        items = split_top(rest, '；')
        if re.search(r'今日', label): urgent = True
        rows.append((label, items, urgent))
    html = '<ol class="digest" aria-label="今日重點">' + ''.join(
        f'<li class="dg{" urgent" if u else ""}"><span class="dg-d">{l}</span><ul>' +
        ''.join(f'<li>{i}</li>' for i in items) + '</ul></li>' for l, items, u in rows) + '</ol>'
    return frag(soup, html)

# ---------- price ----------
def tidy_price(soup, price, keep=2):
    if not price: return
    vals = []
    for el in price.children:
        if getattr(el, 'name', None) == 'span' and 'pv' in (el.get('class') or []):
            vals.append(inner(el))
        elif getattr(el, 'name', None) == 'details':
            for li in el.select('li'):
                for s in li.select('.sep'): s.decompose()
                vals.append(inner(li))
        elif isinstance(el, NavigableString) and el.strip():
            vals.append(str(el).strip())
        elif getattr(el, 'name', None) not in (None, 'span') :
            vals.append(inner(el))
    if not vals: return
    out = ''
    for i, v in enumerate(vals):
        x = ' pv-x' if i >= keep else ''
        if i: out += f'<span class="sep{x}" aria-hidden="true"> ／ </span>'
        out += f'<span class="pv{x}">{v}</span>'
    price.clear()
    for c in list(frag(soup, out).contents): price.append(c)
    if len(vals) > keep:
        price['data-more'] = f'＋另 {len(vals) - keep} 項價錢（見詳情）'
    elif price.has_attr('data-more'):
        del price['data-more']

def price_list(soup, price):
    vals = [inner(s) for s in price.select('.pv')] if price else []
    if len(vals) <= 2: return None
    return frag(soup, '<h5>全部價錢</h5><ul class="plist">' + ''.join(f'<li>{v}</li>' for v in vals) + '</ul>')

# ---------- acquisition rows ----------
def acq_rows(soup, ul):
    rows = ''
    if not ul: return ''
    for li in ul.find_all('li', recursive=False):
        if 'ch-store' in (li.get('class') or []):
            d = text(li.select_one('.st-date'))
            nm_el = li.select_one('.st-name')
            lot = bool(nm_el and nm_el.select_one('.st-tag'))
            nm_c = copy.copy(nm_el)
            for t in nm_c.select('.st-tag'): t.decompose()
            nm = short_name(text(nm_c), 14)
            q = text(li.select_one('.st-qty'))
            col = 'urgent' if ('red' in (li.select_one('.st-date').get('class') or [])) else ''
            rows += (f'<li class="acq-store"><span class="a-date {col}">{d}</span>'
                     f'<span class="a-name">{nm}{"・抽選" if lot else ""}</span><span class="a-qty">{q}</span></li>')
        else:
            nm = text(li.select_one('.chn'))
            chip = li.select_one('.chh .chip')
            st = text(chip)
            col = 'urgent' if chip is not None and 'red' in (chip.get('class') or []) else ''
            a = li.select_one('a.btn[href]')
            link = ''
            if a:
                lab = text(a).replace('›', '').strip()
                link = (f'<a class="btn go" href="{a["href"]}" target="_blank" rel="noopener" '
                        f'aria-label="{lab}" title="{lab}">前往 ›</a>')
            rows += (f'<li class="acq-on"><span class="a-name">{short_name(nm)}</span>'
                     f'<span class="a-st {col}">{st}</span>{link}</li>')
    return rows

def detail_channels(soup, ul):
    """full channel list for the details: store rows get text links instead of ↗"""
    if not ul: return None
    ul = copy.copy(ul)
    ul['class'] = ['ch', 'ch-full']
    for li in ul.select('li.ch-store'):
        for a in li.select('a.btn.ico'):
            a['class'] = ['btn', 'sec', 'sm']
            a.string = (a.get('title') or a.get('aria-label') or '連結') + ' ›'
    return ul

# ---------- card ----------
def tidy_card(soup, a):
    is_line = a.has_attr('data-line-id')
    body = a.select_one(':scope > .body')
    if body is None or body.select_one(':scope > details.info'): return
    g = lambda sel: body.select_one(':scope > ' + sel)
    chips_div = g('.chips')
    chips = chips_div.select('.chip') if chips_div else []
    h3 = g('h3'); price = g('.price'); dates = g('dl.dates'); desc = g('ul.desc'); more = g('details.more')
    h4 = g('h4'); ch = g('ul.ch'); closed = g('details.closed'); foot = g('.btns.foot'); reg = g('.reg.inline')

    urgent = 'urgent' in (a.get('data-cat') or '').split()
    is_new = any('🆕' in text(c) for c in chips)
    status = EMOJI.sub('', inner(chips[0])).strip() if chips else ''
    st_urgent = urgent or (chips and 'red' in (chips[0].get('class') or []))

    new = []
    if is_line:
        n = len(a.select('.sku'))
        regtxt = text(reg).split('·')[0].strip() if reg else ''
        new.append(f'<p class="line-kind">{regtxt + "・" if regtxt else ""}系列 {n} 款</p>')
    else:
        zh = (a.get('data-name-zh') or '').strip()
        if zh: new.append(f'<p class="name-zh">{zh}</p>')
    head = ''.join(new)

    tidy_price(soup, price)
    st_html = (f'<p class="status{" urgent" if st_urgent else ""}">' +
               f'<span class="st-t">' + ('<span class="new">新</span>' if is_new else '') + f'{status}</span></p>') if status else ''
    rows = acq_rows(soup, ch)

    # ---- details content (everything else, nothing deleted) ----
    det = []
    cnt = 0
    if len(chips) > 1:
        det.append('<h5>重點日期</h5><ul class="chip-list">' + ''.join(f'<li>{EMOJI.sub("", inner(c))}</li>' for c in chips) + '</ul>')
    pl = price_list(soup, price)
    dsoup = frag(soup, '<details class="info"><summary></summary><div class="info-body"></div></details>')
    info = dsoup.select_one('.info-body')
    for h in det: info.append(frag(soup, h))
    if pl: info.append(pl)
    if dates:
        info.append(frag(soup, '<h5>日期</h5>')); info.append(dates.extract())
    bullets = []
    if desc: bullets += desc.find_all('li', recursive=False)
    if more:
        for u in more.select('ul.desc'): bullets += u.find_all('li', recursive=False)
    if bullets:
        u = frag(soup, '<h5>說明／更新紀錄</h5><ul class="desc"></ul>')
        ul_ = u.select_one('ul')
        for li in bullets: ul_.append(li.extract())
        info.append(u); cnt += len(bullets)
    full = detail_channels(soup, ch)
    if full is not None and full.find('li'):
        info.append(frag(soup, '<h5>渠道詳情</h5>')); info.append(full); cnt += len(full.find_all('li', recursive=False))
    if closed:
        cl = closed.select_one('ul')
        n_cl = len(cl.find_all('li', recursive=False)) if cl else 0
        info.append(frag(soup, f'<h5>已截止／已出結果渠道（{n_cl}）</h5>'))
        if cl: info.append(cl.extract())
        cnt += n_cl
    if foot:
        foot['class'] = ['btns', 'officials']
        for b in foot.select('a.btn'):
            b['class'] = ['btn', 'sec', 'sm']
        info.append(frag(soup, '<h5>官方／參考連結</h5>')); info.append(foot.extract())
    dsoup.select_one('summary').string = f'詳情・歷史・已截止渠道（{cnt} 項）' if cnt else '詳情・日期・連結'

    # ---- rebuild body ----
    for el in [chips_div, reg, desc, more, h4, ch, closed]:
        if el is not None: el.extract()
    title_el = h3
    keep = [x for x in [title_el, price] if x is not None]
    for x in keep: x.extract()
    body.clear()
    if head: body.append(frag(soup, head))
    if title_el is not None:
        if not is_line: title_el['class'] = (title_el.get('class') or []) + ['name-jp']
        body.append(title_el)
    if price is not None: body.append(price)
    if st_html: body.append(frag(soup, st_html))
    if rows: body.append(frag(soup, f'<ul class="acq" aria-label="取得方法">{rows}</ul>'))
    body.append(dsoup)

    # ---- SKUs ----
    for sku in a.select('.sku'):
        sb = sku.select_one('.sku-body')
        if sb is None or sb.select_one('details.sku-more'): continue
        p0 = sb.select_one(':scope > .price')
        tidy_price(soup, p0, keep=1 if p0 is not None and len(p0.select('.pv')) > 2 else 2)
        extra = [x for x in [sb.select_one(':scope > dl.dates'), sb.select_one(':scope > ul.sku-note')] if x is not None]
        if extra:
            d = frag(soup, '<details class="sku-more"><summary>款式詳情</summary></details>')
            dd = d.select_one('details')
            p = sb.select_one(':scope > .price')
            if p is not None and p.has_attr('data-more'):
                dd.append(frag(soup, '<ul class="plist">' + ''.join(f'<li>{inner(v)}</li>' for v in p.select('.pv')) + '</ul>'))
            for x in extra: dd.append(x.extract())
            sb.append(d)

def tidy(html):
    soup = BeautifulSoup(html, 'html.parser')
    body = soup.body
    if body is not None and body.get('data-layout') == 'v2':
        return html
    sum_ul = soup.select_one('header.hero ul.sum')
    if sum_ul is not None:
        sum_ul.replace_with(build_digest(soup, sum_ul))
    for a in soup.select('main article.card'):
        tidy_card(soup, a)
    if body is not None:
        body['data-layout'] = 'v2'
    return str(soup)

if __name__ == '__main__':
    if len(sys.argv) < 3: sys.exit(__doc__)
    out = tidy(open(sys.argv[1]).read())
    for p in sys.argv[2:]:
        d = os.path.dirname(p)
        if d: os.makedirs(d, exist_ok=True)
        open(p, 'w').write(out)
    print('written:', ', '.join(sys.argv[2:]))
