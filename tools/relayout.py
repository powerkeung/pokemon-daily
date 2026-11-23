#!/usr/bin/env python3
"""
tools/relayout.py — 將「舊式」每日報告（一個商品一張 article.card）轉做新版版面：
  * 同一系列（tools/lines.json）合併成一張 article.card.line[data-line-id]，每個 SKU 係 .sku[data-product-id]（保留全部 CM5 屬性）
  * 取得方法：實體店渠道只顯示「日期・店名・數量」一行；線上渠道用標籤行（受付／結果／限購／寄送…）＋連結按鈕
  * 已截止渠道收埋喺 <details>；長說明拆成要點；｜分隔嘅價錢拆開
用法：python3 tools/relayout.py 輸入.html 輸出1.html [輸出2.html ...]
輸入可以係舊式、v1 或 v2 頁面：舊式 → 系列合併 → v2 整理；v1 → 只做 v2 整理（tools/tidy.py）；v2 → 原樣
需要：pip install beautifulsoup4
"""
import re, json, html, os, sys
from bs4 import BeautifulSoup
_cfg=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'lines.json')))
GROUPS=_cfg['lines']; SHORT=_cfg['short']
def inner(el): return ''.join(str(c) for c in el.contents) if el else ''
def parse(src_html):
    s=BeautifulSoup(src_html,'html.parser')
    out=[]
    for sec in s.select('main > section'):
        if 'notes' in (sec.get('class') or []): continue
        for a in sec.select('article'):
            body=a.select_one('.body')
            d=dict(section=sec.get('id'), attrs=dict(a.attrs), cls=a.get('class'))
            img=a.select_one('.shot img'); d['img']=img['src'] if img else None; d['alt']=img.get('alt') if img else None
            reg=a.select_one('.reg'); d['reg']=(reg.get_text(), [c for c in reg['class'] if c in('jp','us')]) if reg else None
            chip=body.find('span',class_='chip',recursive=False); d['chip']=(inner(chip),[c for c in chip['class'] if c!='chip']) if chip else None
            d['h3']=body.select_one('h3').get_text().strip()
            pr=body.select_one('.price'); d['price']=inner(pr) if pr else None
            d['dates']=[(dv.select_one('dt').get_text(), inner(dv.select_one('dd'))) for dv in body.select('dl.dates > div')]
            d['desc']=[inner(p) for p in body.find_all('p',recursive=False) if 'price' not in (p.get('class') or [])]
            d['ch']=[]
            for li in body.select('ul.ch > li'):
                cp=li.select_one('.chh .chip')
                d['ch'].append(dict(name=li.select_one('.chn').get_text().strip(), chip=(cp.get_text(), [c for c in cp['class'] if c not in('chip','sm')]) if cp else None,
                    p=''.join(inner(p) for p in li.find_all('p')), btns=[(b.get('class'),b['href'],b.get_text().replace('›','').strip()) for b in li.select('a.btn')]))
            d['btns']=[(b.get('class'),b['href'],b.get_text().replace('›','').strip()) for b in body.find_all('a',class_='btn',recursive=False)]
            # anything else unexpected
            known={'span','h3','p','dl','h4','ul','a'}
            d['other']=[str(c)[:80] for c in body.children if getattr(c,'name',None) and c.name not in known]
            out.append(d)
    return out

E=html.escape
def T(h): return re.sub(r'\s+',' ',BeautifulSoup(h,'html.parser').get_text()).strip()

# ---------- text clean-up ----------
def clean_time(h):
    h=re.sub(r'\s*台灣時間\s*（[^（）]*JST[^（）]*）',' ',h)
    h=re.sub(r' +(?=[，。｜、）]|</b>|$)','',h)
    h=re.sub(r'（[0-9:：–\-~〜 ]+JST）','',h)
    h=re.sub(r'(\d{1,2}:\d{2})\s*台灣時間',r'\1',h)
    h=re.sub(r'(\d{1,2}:\d{2}</b>)\s*台灣時間',r'\1',h)
    return h.strip()
def balanced(h): return h.count('<b>')==h.count('</b>') and h.count('<a ')==h.count('</a>')
def split_top(h,sep):
    parts=[];cur=''
    for piece in h.split(sep):
        cur=cur+sep+piece if cur else piece
        if balanced(cur): parts.append(cur.strip()); cur=''
    if cur: parts.append(cur.strip())
    return [p for p in parts if T(p)]

# ---------- labelled rows for channel text ----------
PREFIX=['購買期','受付','結果','購買','購入','落單','截止','發售','開賣','運費','價錢','價格','條件','內容','尺碼','出貨']
ORDER=['受付','時間','發售','開賣','截止','結果','購買期','購買','購入','落單','出貨','限購','價錢','價格','運費','內容','尺碼','條件','寄送','備註']
def label(seg):
    t=T(seg)
    for p in PREFIX:
        if t.startswith(p) and len(t)>len(p)+1:
            rest=seg
            if rest.startswith(p): rest=rest[len(p):].lstrip(' ：:')
            elif rest.startswith('<b>'+p): rest='<b>'+rest[len(p)+3:].lstrip(' ：:')
            else: rest=seg
            return p,rest
    if re.search(r'結果|當選|中籤',t): return '結果',seg
    if re.search(r'每人|限購|每人限|最多\s*\d|每次結帳|限 ?\d|一家 ?1',t): return '限購',seg
    if re.search(r'寄|轉運|出貨|配送|郵寄|運送|取貨|交收',t): return '寄送',seg
    if re.search(r'需|會員|身份|本人|專用|只限|條件',t): return '條件',seg
    if re.search(r'[¥＄]|US\$',t): return '價錢',seg
    if re.search(r'\d{1,2}/\d{1,2}|起|截止|開賣|發售',t): return '時間',seg
    return '備註',seg
def rows_html(segs):
    groups={}
    for s in segs:
        k,v=label(s); groups.setdefault(k,[]).append(v)
    out=''
    for k in sorted(groups,key=lambda k:ORDER.index(k) if k in ORDER else 99):
        out+=f'<div><dt>{E(k)}</dt><dd>{"<br>".join(groups[k])}</dd></div>'
    return f'<dl class="kv">{out}</dl>' if out else ''

# ---------- channel classification ----------
STORE_NAME=re.compile(r'店頭|各店|實體店|店舖|店舗|直營店|機台|participating|百貨店|專門店|取扱店|店（')
ONLINE_PURE=re.compile(r'通販|網店|オンライン|網上|[Oo]nline|Amazon|\.com|零售')
CLOSED=re.compile(r'已截止|已出結果|已結束|已公布|等結果|已售罄|售罄$')
def is_store(c): return bool(STORE_NAME.search(c['name'])) and not ONLINE_PURE.search(c['name'])
def is_closed(c):
    return c['name']=='已截止渠道' or bool(c['chip'] and re.search(r'已截止|已出結果|已結束|等結果',c['chip'][0]))
QTY=[r'每人(?:最多|限)?\s*\d+\s*(?:包|個|件|點|套|盒|BOX|款|次)?(?:\s*\d+\s*次)?', r'每次結帳最多\s*\d+\s*\S', r'每款(?:限|各)\s*\d+\s*\S?', r'限購\s*\d+\s*\S?', r'當選者\s*\d+\s*BOX', r'限\s*\d+\s*(?:個|件|包|盒|BOX|套|點|款)', r'可能限購|數量限定|售完即止']
def qty(t):
    for q in QTY:
        m=re.search(q,t)
        if m: return m.group(0).strip()
    return None
def store_date(c):
    chip=c['chip'][0] if c['chip'] else ''
    if re.search(r'\d',chip): return chip
    m=re.search(r'<b>([^<]*\d[^<]*)</b>',c['p'])
    if m: return clean_time(m.group(1))
    m=re.search(r'\d{1,2}/\d{1,2}(?:（.）)?(?:\s*\d{1,2}:\d{2})?\s*起?',T(c['p']))
    if m: return m.group(0).strip()
    return chip or '日期未定'

def btn(cls,href,text,extra=''):
    c=' '.join(cls) if cls else 'btn'
    return f'<a class="{E(c)}" href="{E(href)}" target="_blank" rel="noopener">{E(text)}{extra} <span aria-hidden="true">›</span></a>'

def chips_html(chip):
    if not chip: return ''
    txt,cols=chip; col=' '.join(cols)
    parts=split_top(clean_time(txt),'｜')
    return '<div class="chips">'+''.join(f'<span class="chip {E(col)}">{p}</span>' for p in parts)+'</div>'
def price_html(p):
    if not p: return ''
    parts=split_top(p,'｜')
    if len(parts)>4:
        head=parts[:2]; rest=parts[2:]
        return ('<div class="price">'+'<span class="sep" aria-hidden="true"> ／ </span>'.join(f'<span class="pv">{x}</span>' for x in head)
                +f'<span class="sep" aria-hidden="true"> ／ </span><details class="price-more"><summary>其餘 {len(rest)} 項價錢</summary><ul>'
                +''.join(f'<li>{x}<span class="sep" aria-hidden="true"> ／ </span></li>' for x in rest)+'</ul></details></div>')
    return '<div class="price">'+'<span class="sep" aria-hidden="true"> ／ </span>'.join(f'<span class="pv">{x}</span>' for x in parts)+'</div>'
def dates_html(dates):
    if not dates: return ''
    return '<dl class="dates">'+''.join(f'<div><dt>{E(k)}</dt><dd>{clean_time(v)}</dd></div>' for k,v in dates)+'</dl>'
def desc_html(descs,visible=2):
    sents=[]
    for d in descs:
        d=re.sub(r'\s*style="[^"]*"','',d)
        for s in split_top(d,'。'):
            s=clean_time(s).strip('　 ')
            if T(s): sents.append(s)
    if not sents: return ''
    li=lambda xs:''.join(f'<li>{x}</li>' for x in xs)
    out='<ul class="desc">'+li(sents[:visible])+'</ul>'
    if len(sents)>visible:
        out+=f'<details class="more"><summary>更多說明（{len(sents)-visible} 點）</summary><ul class="desc">{li(sents[visible:])}</ul></details>'
    return out

def channel_html(c, segs_override=None, extra_rows=''):
    p=clean_time(c['p'])
    if is_store(c) and not is_closed(c):
        q=qty(T(c['p'])) or '限購未公布'
        lot=' <span class="st-tag">抽選</span>' if '抽選' in c['name'] else ''
        links=''.join(f'<a class="btn ico" href="{E(h)}" target="_blank" rel="noopener" title="{E(t)}" aria-label="{E(t)}">↗</a>' for cl,h,t in c['btns'])
        col=' '.join(c['chip'][1]) if c['chip'] else 'grey'
        return (f'<li class="ch-store"><span class="st-date chip sm {E(col)}">{E(store_date(c))}</span>'
                f'<span class="st-name">📍 {E(c["name"])}{lot}</span><span class="st-qty">{E(q)}</span>{links}</li>')
    chip=f'<span class="chip sm {E(" ".join(c["chip"][1]))}">{E(c["chip"][0])}</span>' if c['chip'] else ''
    segs=segs_override if segs_override is not None else split_top(p,'｜')
    bs=''.join(btn(cl,h,t) for cl,h,t in c['btns'])
    return f'<li><div class="chh"><span class="chn">{E(c["name"])}</span>{chip}</div>{rows_html(segs)}{extra_rows}{"<div class=\"btns\">"+bs+"</div>" if bs else ""}</li>'

def closed_html(cs):
    if not cs: return ''
    items=''.join(f'<li><b>{E(c["name"])}</b> <span class="chip sm grey">{E(c["chip"][0] if c["chip"] else "已截止")}</span><span class="cl-txt">{clean_time(c["p"]).replace("｜","・")}</span>'
                  + ''.join(f' <a href="{E(h)}" target="_blank" rel="noopener">{E(t)}</a>' for cl,h,t in c['btns'])+'</li>' for c in cs)
    return f'<details class="closed"><summary>已截止／已出結果渠道（{len(cs)}）</summary><ul>{items}</ul></details>'

def channels_block(chs):
    if not chs: return ''
    openc=[c for c in chs if not is_closed(c)]; closed=[c for c in chs if is_closed(c)]
    stores=[c for c in openc if is_store(c)]; online=[c for c in openc if not is_store(c)]
    return '<h4>取得方法</h4><ul class="ch">'+''.join(channel_html(c) for c in online+stores)+'</ul>'+closed_html(closed)

ATTR_ORDER=['data-cat','data-product-id','data-source','data-type','data-subtype','data-currency','data-original-price','data-name-zh','data-acquisition']
def attrs(d,skip=()):
    ks=[k for k in ATTR_ORDER if k in d]+[k for k in d if k not in ATTR_ORDER and k!='class']
    return ' '.join(f'{k}="{E(d[k])}"' for k in ks if k not in skip)

def reg_label(x): return x['reg'][0] if x['reg'] else ''
def reg_cls(x): return x['reg'][1][0] if x['reg'] and x['reg'][1] else 'jp'

def key_date(chip):
    if not chip: return ''
    return T(split_top(clean_time(chip[0]),'｜')[0])

def single(x):
    a=dict(x['attrs']); a['data-key-date']=key_date(x['chip'])
    shot=f'<div class="shot"><img src="{E(x["img"])}" alt="{E(x["alt"] or x["h3"])}" loading="lazy"><span class="reg {reg_cls(x)}">{E(reg_label(x))}</span></div>' if x['img'] else ''
    foot=''.join(btn(cl,h,t) for cl,h,t in x['btns'])
    return (f'<article class="card" {attrs(a)}>{shot}<div class="body">{chips_html(x["chip"])}<h3>{E(x["h3"])}</h3>'
            f'{price_html(x["price"])}{dates_html(x["dates"])}{desc_html(x["desc"])}{channels_block(x["ch"])}'
            f'{"<div class=\"btns foot\">"+foot+"</div>" if foot else ""}</div></article>')

def sents_of(x):
    out=[]
    for d in x['desc']:
        d=re.sub(r'\s*style="[^"]*"','',d)
        out+= [clean_time(s) for s in split_top(d,'。')]
    return out

def line(g,xs):
    first=xs[0]
    cats=[];acq=[]
    for x in xs:
        for c in x['attrs'].get('data-cat','').split():
            if c not in cats: cats.append(c)
        for c in x['attrs'].get('data-acquisition','').split():
            if c not in acq: acq.append(c)
    short=[SHORT.get(x['attrs']['data-product-id'],x['h3']) for x in xs]
    # dates: common rows -> line ; others -> sku
    common_dates=[d for d in first['dates'] if all(d in x['dates'] for x in xs)]
    # desc: common sentences -> line ; others -> sku
    S=[sents_of(x) for x in xs]
    common_s=[s for s in S[0] if all(s in o for o in S)]
    # channels merged by name
    names=[]
    for x in xs:
        for c in x['ch']:
            if c['name'] not in names: names.append(c['name'])
    merged=[]
    for n in names:
        have=[(i,c) for i,x in enumerate(xs) for c in x['ch'] if c['name']==n]
        base=dict(have[0][1])
        segsets=[split_top(clean_time(c['p']),'｜') for _,c in have]
        common=[s for s in segsets[0] if all(s in o for o in segsets)]
        extra=''
        uniq_rows=''
        for (i,c),ss in zip(have,segsets):
            u=[s for s in ss if s not in common]
            if u: uniq_rows+=f'<div><dt>{E(short[i])}</dt><dd>{"<br>".join(u)}</dd></div>'
        if len(have)<len(xs):
            uniq_rows=f'<div><dt>適用</dt><dd>{E("、".join(short[i] for i,_ in have))}</dd></div>'+uniq_rows
        # buttons union
        allb=[]; 
        for i,c in have:
            for b in c['btns']:
                if all(b[1]!=o[1] for o,_ in allb): allb.append((b,i))
        btns=[]
        for b,i in allb:
            shared=all(any(bb[1]==b[1] for bb in c['btns']) for _,c in have)
            btns.append((b[0],b[1],b[2] if shared or len(have)==1 else f'{b[2]}（{short[i]}）'))
        base['btns']=btns
        base['_common']=common; base['_extra']=f'<dl class="kv sku-diff">{uniq_rows}</dl>' if uniq_rows else ''
        merged.append(base)
    openc=[c for c in merged if not is_closed(c)]; closed=[c for c in merged if is_closed(c)]
    chs=''
    for c in [c for c in openc if not is_store(c)]+[c for c in openc if is_store(c)]:
        chs+=channel_html(c,segs_override=c['_common'],extra_rows=c['_extra']) if not is_store(c) else channel_html(c)
    # footer buttons union
    fb=[]
    for i,x in enumerate(xs):
        for b in x['btns']:
            if all(b[1]!=o[0][1] for o in fb): fb.append((b,i))
    foot=''
    for b,i in fb:
        shared=all(any(bb[1]==b[1] for bb in x['btns']) for x in xs)
        foot+=btn(b[0],b[1],b[2] if shared else f'{b[2]}（{short[i]}）')
    # skus
    skus=''
    for i,x in enumerate(xs):
        a={k:v for k,v in x['attrs'].items() if k not in('data-cat','data-acquisition','class')}
        own_dates=[d for d in x['dates'] if d not in common_dates]
        note=[s for s in S[i] if s not in common_s]
        notes=''.join(f'<li>{s}</li>' for s in note)
        skus+=(f'<div class="sku" {attrs(a)}><div class="sku-shot"><img src="{E(x["img"])}" alt="{E(x["alt"] or x["h3"])}" loading="lazy"></div>'
               f'<div class="sku-body"><span class="sku-tag">{E(short[i])}</span><h4 class="sku-name">{E(x["h3"])}</h4>{price_html(x["price"])}'
               f'{dates_html(own_dates)}{"<ul class=\"sku-note\">"+notes+"</ul>" if notes else ""}</div></div>')
    la={'data-cat':' '.join(cats),'data-line-id':g['id'],'data-acquisition':' '.join(acq),'data-key-date':key_date(first['chip']),'data-sku-ids':' '.join(x['attrs']['data-product-id'] for x in xs)}
    desc=desc_html([ '。'.join(common_s) ],visible=2) if common_s else ''
    return (f'<article class="card line" data-cat="{E(la["data-cat"])}" data-line-id="{E(g["id"])}" data-sku-ids="{E(la["data-sku-ids"])}" data-acquisition="{E(la["data-acquisition"])}" data-key-date="{E(la["data-key-date"])}">'
            f'<div class="body line-head">{chips_html(first["chip"])}<span class="reg inline {reg_cls(first)}">{E(reg_label(first))} · 系列 {len(xs)} 款</span>'
            f'<h3 class="line-title">{E(g["title"])}</h3>{dates_html(common_dates)}{desc}'
            f'<h4>取得方法</h4><ul class="ch">{chs}</ul>{closed_html(closed)}{"<div class=\"btns foot\">"+foot+"</div>" if foot else ""}</div>'
            f'<div class="skus" aria-label="系列商品">{skus}</div></article>')

def build(src, out_paths):
    if 'data-layout="v2"' in src or 'class="ch-store"' in src or 'class="card line"' in src:
        # 已經係 v1／v2 新版：只做 v2 整理
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from tidy import tidy
        page=tidy(src)
        for p in out_paths:
            d=os.path.dirname(p)
            if d: os.makedirs(d,exist_ok=True)
            open(p,'w').write(page)
        return page
    soup=BeautifulSoup(src,'html.parser')
    model=parse(src)
    by={x['attrs']['data-product-id']:x for x in model}
    gmap={p:g for g in GROUPS for p in g['pids']}
    sections={}
    done=set()
    for x in model:
        pid=x['attrs']['data-product-id']
        if pid in done: continue
        sec=x['section']
        if pid in gmap:
            g=gmap[pid]; present=[p for p in g['pids'] if p in by]
            xs=[by[p] for p in present]
            sections.setdefault(sec,[]).append(line(g,xs)); done.update(present)
        else:
            sections.setdefault(sec,[]).append(single(x)); done.add(pid)
    # hero
    hero=soup.select_one('header.hero')
    sum_el=hero.select_one('.sum'); sum_html=inner(sum_el)
    pts=[p for p in split_top(sum_html,'。') if T(p) not in ('（全部台灣時間）','(全部台灣時間)')]
    sum_new='<ul class="sum">'+''.join(f'<li>{p}</li>' for p in pts)+'</ul>'
    kicker=str(hero.select_one('.kicker')); h1=str(hero.select_one('h1')); meta=str(hero.select_one('.meta'))
    out=[]
    for sec in soup.select('main > section'):
        sid=sec.get('id')
        if sid in sections:
            out.append(f'<section id="{sid}">{sec.select_one("h2")}<div class="grid">{"".join(sections[sid])}</div></section>')
    notes=str(soup.select_one('main > section.notes'))
    notes=re.sub(r'\s*style="[^"]*"','',notes)
    notes=notes.replace('<section class="notes">','<section class="notes" id="other-updates">',1)
    archive=str(soup.select_one('main > .archive'))
    footer=soup.select_one('footer')
    foot_inner=inner(footer)+'<p>所有時間為台灣時間（UTC+8）。</p>'
    title=soup.title.string
    page=f'''<!DOCTYPE html><html lang="zh-Hant-HK"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>{E(title)}</title><link rel="stylesheet" href="/pokemon-daily/report.css"></head><body>
<header class="hero"><div class="wrap">{kicker}{h1}{meta}
{sum_new}</div></header>
<main class="wrap">{"".join(out)}
{notes}
{archive}
</main>
<footer class="wrap">{foot_inner}</footer>
<script src="/pokemon-daily/nav.js"></script><script src="/pokemon-daily/snooze.js"></script><script src="/pokemon-daily/filter.js"></script><script src="/pokemon-daily/addproduct.js"></script></body></html>
'''
    # v2（2026-11-23 起）：再整理成「一眼睇得明」版面（tools/tidy.py）
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from tidy import tidy
    page=tidy(page)
    for p in out_paths:
        d=os.path.dirname(p)
        if d: os.makedirs(d,exist_ok=True)
        open(p,'w').write(page)
    return page


if __name__=='__main__':
    if len(sys.argv)<3: sys.exit(__doc__)
    build(open(sys.argv[1]).read(), sys.argv[2:])
    print('written:', ', '.join(sys.argv[2:]))
