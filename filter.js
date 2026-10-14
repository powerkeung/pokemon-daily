(function(){
const TYPES={
  store:{label:'店頭',color:'#1f8a4c'},
  lottery:{label:'抽選',color:'#d7261e'},
  online:{label:'線上可買',color:'#2a5bd7'}
};

const CAT_TYPES={
  urgent:{label:'🚨 急件',color:'#d7261e'},
  jp:{label:'🇯🇵 日版',color:'#d7261e'},
  us:{label:'🇺🇸 美版',color:'#2a5bd7'}
};

function addBadgesToCards(){
  document.querySelectorAll('.card[data-acquisition]').forEach(card=>{
    const types=card.dataset.acquisition.split(' ');
    const body=card.querySelector('.body');
    if(!body||body.querySelector('.acq-badges'))return;
    
    const badgeContainer=document.createElement('div');
    badgeContainer.className='acq-badges';
    types.forEach(type=>{
      if(TYPES[type]){
        const badge=document.createElement('span');
        badge.className='acq-badge';
        badge.textContent=TYPES[type].label;
        badge.style.background=`color-mix(in srgb,${TYPES[type].color} 15%,transparent)`;
        badge.style.color=TYPES[type].color;
        badgeContainer.appendChild(badge);
      }
    });
    
    const firstChild=body.firstElementChild;
    if(firstChild&&firstChild.classList.contains('chip')){
      firstChild.insertAdjacentElement('afterend',badgeContainer);
    }else{
      body.insertBefore(badgeContainer,body.firstChild);
    }
  });
}

function getCounts(){
  const counts={all:0,store:0,lottery:0,online:0,urgent:0,jp:0,us:0};
  document.querySelectorAll('.card[data-acquisition]').forEach(card=>{
    counts.all++;
    const types=card.dataset.acquisition.split(' ');
    types.forEach(type=>{
      if(counts[type]!==undefined)counts[type]++;
    });
    const cats=(card.dataset.cat||'').split(' ');
    cats.forEach(cat=>{
      if(counts[cat]!==undefined)counts[cat]++;
    });
  });
  return counts;
}

function renderFilterBar(){
  const existing=document.querySelector('.acq-filter-bar');
  if(existing)return;
  
  const oldFilters=document.querySelector('.filters');
  if(oldFilters)oldFilters.remove();
  
  const counts=getCounts();
  const bar=document.createElement('div');
  bar.className='acq-filter-bar';
  bar.setAttribute('role','group');
  bar.setAttribute('aria-label','篩選');
  
  let html='<div class="acq-filter-wrap">';
  html+=`<button class="acq-btn active" data-filter="all" data-type="all">全部 <span class="cnt">${counts.all}</span></button>`;
  html+=`<button class="acq-btn" data-filter="acquisition" data-type="store">店頭 <span class="cnt">${counts.store}</span></button>`;
  html+=`<button class="acq-btn" data-filter="acquisition" data-type="lottery">抽選 <span class="cnt">${counts.lottery}</span></button>`;
  html+=`<button class="acq-btn" data-filter="acquisition" data-type="online">線上可買 <span class="cnt">${counts.online}</span></button>`;
  if(counts.urgent>0)html+=`<button class="acq-btn" data-filter="cat" data-type="urgent">🚨 急件 <span class="cnt">${counts.urgent}</span></button>`;
  if(counts.jp>0)html+=`<button class="acq-btn" data-filter="cat" data-type="jp">🇯🇵 日版 <span class="cnt">${counts.jp}</span></button>`;
  if(counts.us>0)html+=`<button class="acq-btn" data-filter="cat" data-type="us">🇺🇸 美版 <span class="cnt">${counts.us}</span></button>`;
  html+='</div>';
  bar.innerHTML=html;
  
  bar.querySelectorAll('.acq-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      bar.querySelectorAll('.acq-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      filterCards(btn.dataset.filter,btn.dataset.type);
    });
  });
  
  const header=document.querySelector('header');
  const reportNav=document.querySelector('.report-nav');
  if(reportNav){
    reportNav.insertAdjacentElement('afterend',bar);
  }else if(header){
    header.insertAdjacentElement('afterend',bar);
  }else{
    document.body.insertBefore(bar,document.body.firstChild);
  }
}

function filterCards(filterType,type){
  document.querySelectorAll('.card[data-acquisition]').forEach(card=>{
    if(type==='all'){
      card.hidden=false;
    }else if(filterType==='acquisition'){
      const types=card.dataset.acquisition.split(' ');
      card.hidden=!types.includes(type);
    }else if(filterType==='cat'){
      const cats=(card.dataset.cat||'').split(' ');
      card.hidden=!cats.includes(type);
    }
  });
  
  document.querySelectorAll('main section:not(.notes):not(.archive)').forEach(section=>{
    const visibleCards=section.querySelectorAll('.card[data-acquisition]:not([hidden])');
    section.hidden=visibleCards.length===0;
  });
}

const style=document.createElement('style');
style.textContent=`
.acq-badges{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 6px}
.acq-badge{display:inline-block;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;white-space:nowrap}
.acq-filter-bar{background:var(--bg);border-bottom:1px solid var(--line);padding:6px 0;margin:0}
.acq-filter-wrap{max-width:1180px;margin:0 auto;padding:0 16px;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.acq-filter-wrap::-webkit-scrollbar{display:none}
.acq-btn{flex-shrink:0;display:inline-flex;align-items:center;gap:4px;height:26px;padding:2px 10px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap}
.acq-btn:hover{border-color:var(--y);background:color-mix(in srgb,var(--y) 10%,var(--card))}
.acq-btn.active{background:var(--y);border-color:var(--y);color:#16181d}
.acq-btn .cnt{font-size:11px;background:rgba(0,0,0,.08);padding:1px 5px;border-radius:999px;font-weight:800}
.acq-btn.active .cnt{background:rgba(0,0,0,.12)}
.hero{padding:20px 0 16px}
.hero h1{font-size:26px;margin:2px 0 3px}
.hero .meta{font-size:12px}
.hero .sum{font-size:13px;padding:8px 10px;margin:10px 0 0}
h2{margin:18px 0 10px;font-size:18px}
.grid{gap:14px;margin-top:0}
.card{border-radius:14px}
.body{padding:12px 14px 14px}
.notes{margin-top:20px}
@media(max-width:640px){
  .hero{padding:16px 0 12px}
  .hero h1{font-size:24px}
}
`;
document.head.appendChild(style);

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{
    addBadgesToCards();
    renderFilterBar();
  });
}else{
  addBadgesToCards();
  renderFilterBar();
}
})();
