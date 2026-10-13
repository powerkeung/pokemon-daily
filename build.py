import html
E=html.escape
cards=[
 dict(id='cardset',img='cardset.jpg',reg='jp',urgent=1,chip=('今日截止','red'),name='30th CELEBRATION カードセット',price='每盒 ¥1,200（全9款）',
  dates=[('發售','10/16（五）')],link=('30周年商品頁','https://www.30th.pokemon-card.com/product/cardset'),
  ch=[('Joshin 店頭抽選','今日截止','red','截止 <b>今日 10/13</b>（營業時間內）・結果 10/14 ~12:00・購入 10/16–22<br>銀級或以上＋Joshin App；店頭 QR／報名',[('Joshin 公告例','https://store.joshin.co.jp/detail/1739/recommend/1955854/')]),
      ('PC 實體店抽選','已截止 · 等結果','grey','報名已於 10/12 23:59 截止・結果 <b>10/14 12:00</b> 起（LINE）・購入 10/16–18',[]),
      ('楽天ブックス（9種套裝）','明日開始','blue','據彙整站：抽選 <b>10/14 10:00–10/18 23:59</b>・¥10,800・請以樂天商品頁為準',[]),
      ('Lawson','10/16 7:00','blue','開賣 <b>10/16 7:00</b>・僅 2 款（關東御三家／帕底亞）・每款限 1・冇預約',[('Lawson 公告','https://www.lawson.co.jp/lab/entertainment/art/20261006_toypokemon.html')])]),
 dict(id='rice',img='ricecookie.jpg',reg='jp',urgent=1,chip=('10/15 開賣','orange'),name='ライスクッキー Pokémon Yurutto いちご味',price='¥1,760',
  dates=[('PCO','10/15（四）10:00'),('實體店','10/17（六）')],link=('官方頁','https://www.pokemon.co.jp/goods/2026/10/261009_fo01.html'),
  ch=[('Pokémon Center Online','10/15 10:00','orange','<b>10/15（四）10:00</b> 開賣',[]),('PC 實體店','10/17','blue','<b>10/17（六）</b>發售',[])]),
 dict(id='file',img='filepremium.jpg',reg='jp',urgent=1,chip=('10/16 發售','orange'),name='コレクションファイルプレミアム／リフィル',price='Premium ¥2,420｜リフィル ¥700（各地方）',
  dates=[('發售','10/16')],link=('商品介紹','https://www.pokemon.jp/info/pokecen/detail/20402.html'),
  ch=[('PC 店＋PCO','10/16','orange','<b>10/16</b>（PCO 同日 10:00）',[])]),
 dict(id='charm',img='pokecharm.jpg',reg='jp',urgent=0,chip=('新','green'),name='Poké-Charm 30周年ロゴマスコット2',price='¥418｜全20種',
  dates=[('發售','2026年10月起')],link=('タカラトミーアーツ','https://www.takaratomy-arts.co.jp/items/item.html?n=Y111211'),
  ch=[('量販店菓子賣場等','10 月起','blue','官方寫 2026年10月起；非公式指 10/12 開賣（請以店舖為準）',[])]),
 dict(id='art',img='artbook.jpg',reg='jp',urgent=0,chip=('預約中','blue'),name='ポケットモンスター ビジュアルアートブック BOOK1–3',price='各 ¥5,500',
  dates=[('預約','約至 12/17'),('發售','12/18')],link=('官方介紹','https://www.pokemon.co.jp/goods/2026/08/260807_da01.html'),
  ch=[('PCO 預約','預約中','blue','約至 12/17・發售 <b>12/18</b>・各冊限購規則請睇商品頁',[('PCO BOOK1','https://www.pokemoncenter-online.com/9784824018731.html')])]),
 dict(id='delta',img='deltareign.jpg',reg='us',urgent=0,chip=('預購中','blue'),name='Mega Evolution—Delta Reign',price='價格／庫存請以官方頁為準（未核實）',
  dates=[('Prerelease','10/24 起'),('發售','11/6')],link=('官方新聞','https://www.pokemon.com/us/news/play-at-a-pokemon-tcg-mega-evolution-delta-reign-prerelease-event'),
  ch=[('Pokémon Center','預購中','blue','ETB／Booster Bundle／Booster Display 預購較早前已開（請即時查頁）',[('pokemoncenter.com','https://www.pokemoncenter.com')]),
      ('Play! Pokémon 店','10/24','blue','Prerelease／Build & Battle 由 <b>10/24</b> 起',[])]),
 dict(id='polaroid',img='polaroid.jpg',reg='us',urgent=0,chip=('有貨','green'),name='Pokémon × Polaroid（相機／菲林／配件）',price='Now Gen3 Poké Ball、Go Pikachu／Sylveon 等',
  dates=[('零售','約 10/5 起'),('PC 出貨','Early–Mid Oct（預估）')],link=('Polaroid 商品','https://www.polaroid.com/en_us/products/polaroid-now-pokemon-edition'),
  ch=[('Pokémon Center／Polaroid.com','10/5 起','green','零售約 10/5 起・PC 預估 Early–Mid Oct 出貨（support 頁）',[('pokemon.com','https://www.pokemon.com/us/news/preorder-pokemon-polaroid-special-edition-range-cameras-now')])]),
]
def btn(t,u,sec=False): return f'<a class="btn{" sec" if sec else ""}" href="{E(u)}" target="_blank" rel="noopener">{E(t)} <span aria-hidden="true">›</span></a>'
def card(c):
    reg='日版' if c['reg']=='jp' else '美版'
    cat=' '.join(filter(None,[c['reg'],'urgent' if c['urgent'] else '']))
    ds=''.join(f'<div><dt>{E(k)}</dt><dd>{E(v)}</dd></div>' for k,v in c['dates'])
    chs=''.join(f'<li><div class="chh"><span class="chn">{E(n)}</span><span class="chip sm {col}">{E(ct)}</span></div><p>{d}</p>{"".join(btn(t,u,True) for t,u in bs)}</li>' for n,ct,col,d,bs in c['ch'])
    return f'''<article class="card" data-cat="{cat}"><div class="shot"><img src="img/{c["img"]}" alt="{E(c["name"])}" loading="lazy"><span class="reg {c["reg"]}">{reg}</span></div>
<div class="body"><span class="chip {c["chip"][1]}">{E(c["chip"][0])}</span><h3>{E(c["name"])}</h3><p class="price">{E(c["price"])}</p><dl class="dates">{ds}</dl>
<h4>取得方法</h4><ul class="ch">{chs}</ul>{btn(*c["link"])}</div></article>'''
urg=''.join(card(c) for c in cards if c['urgent']); rest=''.join(card(c) for c in cards if not c['urgent'])
pr='''<article class="card event" data-cat="jp urgent"><div class="body"><span class="chip red">今晚 23:59 截止</span><span class="reg inline jp">日版 · 活動</span><h3>@pokemoncenterPR 100萬追蹤紀念抽獎</h3><p>追蹤＋轉發指定帖，抽 100 名送比卡超亞克力手機座（活動獎品，冇官方商品圖）</p><dl class="dates"><div><dt>截止</dt><dd>今日 10/13 23:59</dd></div></dl><a class="btn" href="https://shop.pokemon.co.jp/ja/shop/common/events/202610/000581.html" target="_blank" rel="noopener">活動頁 ›</a></div></article>'''
CSS=open('style.css').read()
page=f'''<!DOCTYPE html><html lang="zh-Hant-HK"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Pokémon 周邊每日報告｜2026/10/13</title><style>{CSS}</style></head><body>
<header class="hero"><div class="wrap"><p class="kicker">Pokémon 周邊每日報告</p><h1>2026/10/13（二）</h1><p class="meta">資料截至約 12:00 JST・日版＋美版・商品為單位</p>
<p class="sum">日版今日冇全新 PC 產品線。急件係 Joshin 抽選同 PR 抽獎今日截止，加埋 10/15–16 開賣。美版首次補上 Delta Reign／Polaroid。</p></div></header>
<nav class="filters" aria-label="篩選"><div class="wrap"><button class="on" data-f="all">全部</button><button data-f="urgent">🚨 急件</button><button data-f="jp">🇯🇵 日版</button><button data-f="us">🇺🇸 美版</button></div></nav>
<main class="wrap"><section id="urgent"><h2><span class="dot red"></span>急件（10/13–10/16）</h2><div class="grid">{urg}{pr}</div></section>
<section id="more"><h2><span class="dot blue"></span>其他商品</h2><div class="grid">{rest}</div></section>
<section class="notes"><h2><span class="dot grey"></span>其他更新</h2><ul>
<li><b>PCO 維護</b> 10/15 2:00–7:00（最長約 15 分）・<a href="https://www.pokemoncenter-online.com/news/?id=20261007" target="_blank" rel="noopener">公告</a></li>
<li><b>MEGAドリームex</b> 刷臉再販試行至 10/15（已報）</li>
<li>「お前、もしかしてロケット団？」：遊戲市集 2026秋 10/17–18 先行（@Pokemon_cojp）</li>
<li><b>美版 PC 預估出貨</b>：30th Celebration Bundle／Mini Tin＝Early Oct；Altaria／Lucario Pokédex plush＝Late Oct・<a href="https://support.pokemoncenter.com/hc/en-us/articles/4407702295572-Estimated-Preorder-Release-Dates" target="_blank" rel="noopener">support 頁</a></li></ul>
<h3>📅 之後要留意</h3><ol class="tl">
<li><time>10/13</time>Joshin 截止；PR 抽獎 23:59</li><li><time>10/14</time>PC／Joshin 結果；楽天ブックス 9種抽選 10:00 起</li><li><time>10/15</time>PCO 維護；米曲奇 PCO 10:00；刷臉試行最後一日</li><li><time>10/16</time>卡組／Lawson／コレクションファイル</li><li><time>10/17</time>米曲奇實體店；遊戲市集先行</li><li><time>10/24</time>美版 Delta Reign Prerelease</li><li><time>11/6</time>美版 Delta Reign 發售</li><li><time>12/14・12/25</time>一番賞 30th 再販</li><li><time>12/18</time>ビジュアルアートブック</li></ol></section></main>
<footer class="wrap"><p>來源：pokemon.co.jp、30th.pokemon-card.com、shop.pokemon.co.jp、PCO、Joshin、Lawson、takaratomy-arts、pokemon.com、support.pokemoncenter.com、polaroid.com、官方 X。</p><p>楽天／部分零售請以官方為準。pokemoncenter.com 本日阻擋自動查詢，美版庫存未即時核實。所有時間為 JST。</p></footer>
<script>document.querySelectorAll('.filters button').forEach(b=>b.onclick=()=>{{document.querySelectorAll('.filters button').forEach(x=>x.classList.toggle('on',x===b));const f=b.dataset.f;document.querySelectorAll('.card').forEach(c=>c.hidden=!(f=='all'||c.dataset.cat.split(' ').includes(f)));document.querySelectorAll('main section:not(.notes)').forEach(s=>s.hidden=!s.querySelector('.card:not([hidden])'));document.querySelector('.notes').hidden=f!='all';}});</script></body></html>'''
open('index.html','w').write(page)
