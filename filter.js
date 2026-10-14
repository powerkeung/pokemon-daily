(function(){
const TYPES={
  store:{label:'店頭',color:'#1f8a4c'},
  lottery:{label:'抽選',color:'#d7261e'},
  online:{label:'線上可買',color:'#2a5bd7'}
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

function getCounts(activeAcq,activeCat){
  const counts={
    acq:{all:0,store:0,lottery:0,online:0},
    cat:{all:0,urgent:0,jp:0,us:0}
  };
  
  document.querySelectorAll('.card[data-acquisition]').forEach(card=>{
    const acqTypes=card.dataset.acquisition.split(' ');
    const catTypes=(card.dataset.cat||'').split(' ');
    
    const acqMatch=activeAcq==='all'||acqTypes.includes(activeAcq);
    const catMatch=activeCat==='all'||catTypes.includes(activeCat);
    
    if(acqMatch&&catMatch){
      counts.acq.all++;
      counts.cat.all++;
    }
    
    if(catMatch){
      acqTypes.forEach(type=>{
        if(counts.acq[type]!==undefined)counts.acq[type]++;
      });
    }
    
    if(acqMatch){
      catTypes.forEach(type=>{
        if(counts.cat[type]!==undefined)counts.cat[type]++;
      });
    }
  });
  
  return counts;
}

let currentAcq='all';
let currentCat='all';

function renderFilterBar(){
  const existing=document.querySelector('.acq-filter-bar');
  if(existing)return;
  
  const oldFilters=document.querySelector('.filters');
  if(oldFilters)oldFilters.remove();
  
  const counts=getCounts('all','all');
  const bar=document.createElement('div');
  bar.className='acq-filter-bar';
  bar.setAttribute('role','group');
  bar.setAttribute('aria-label','篩選');
  
  let html='<div class="filter-group">';
  html+='<span class="filter-label">取得：</span>';
  html+='<div class="filter-chips">';
  html+=`<button class="filter-chip acq-chip active" data-group="acq" data-type="all">全部 <span class="cnt">${counts.acq.all}</span></button>`;
  html+=`<button class="filter-chip acq-chip" data-group="acq" data-type="store">店頭 <span class="cnt">${counts.acq.store}</span></button>`;
  html+=`<button class="filter-chip acq-chip" data-group="acq" data-type="lottery">抽選 <span class="cnt">${counts.acq.lottery}</span></button>`;
  html+=`<button class="filter-chip acq-chip" data-group="acq" data-type="online">線上可買 <span class="cnt">${counts.acq.online}</span></button>`;
  html+='</div></div>';
  
  if(counts.cat.urgent>0||counts.cat.jp>0||counts.cat.us>0){
    html+='<div class="filter-divider"></div>';
    html+='<div class="filter-group">';
    html+='<span class="filter-label">類別：</span>';
    html+='<div class="filter-chips">';
    html+=`<button class="filter-chip cat-chip active" data-group="cat" data-type="all">全部 <span class="cnt">${counts.cat.all}</span></button>`;
    if(counts.cat.urgent>0)html+=`<button class="filter-chip cat-chip" data-group="cat" data-type="urgent">🚨 急件 <span class="cnt">${counts.cat.urgent}</span></button>`;
    if(counts.cat.jp>0)html+=`<button class="filter-chip cat-chip" data-group="cat" data-type="jp">🇯🇵 日版 <span class="cnt">${counts.cat.jp}</span></button>`;
    if(counts.cat.us>0)html+=`<button class="filter-chip cat-chip" data-group="cat" data-type="us">🇺🇸 美版 <span class="cnt">${counts.cat.us}</span></button>`;
    html+='</div></div>';
  }
  
  bar.innerHTML=html;
  
  bar.querySelectorAll('.filter-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const group=btn.dataset.group;
      const type=btn.dataset.type;
      
      bar.querySelectorAll(`.filter-chip[data-group="${group}"]`).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      
      if(group==='acq'){
        currentAcq=type;
      }else{
        currentCat=type;
      }
      
      filterCards();
      updateCounts(bar);
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

function updateCounts(bar){
  const counts=getCounts(currentAcq,currentCat);
  bar.querySelectorAll('.filter-chip').forEach(btn=>{
    const group=btn.dataset.group;
    const type=btn.dataset.type;
    const cnt=btn.querySelector('.cnt');
    if(cnt){
      cnt.textContent=counts[group][type];
    }
  });
}

function filterCards(){
  document.querySelectorAll('.card[data-acquisition]').forEach(card=>{
    const acqTypes=card.dataset.acquisition.split(' ');
    const catTypes=(card.dataset.cat||'').split(' ');
    
    const acqMatch=currentAcq==='all'||acqTypes.includes(currentAcq);
    const catMatch=currentCat==='all'||catTypes.includes(currentCat);
    
    card.hidden=!(acqMatch&&catMatch);
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
.acq-filter-bar{background:var(--bg);border-bottom:1px solid var(--line);padding:6px 0;margin:0;display:flex;align-items:center;flex-wrap:wrap;gap:8px;max-width:1180px;margin:0 auto}
.filter-group{display:flex;align-items:center;gap:6px;padding:0 16px}
.filter-group:first-child{padding-left:16px}
.filter-group:last-child{padding-right:16px}
.filter-label{font-size:11px;font-weight:700;color:var(--mute);white-space:nowrap;flex-shrink:0}
.filter-chips{display:flex;gap:5px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-wrap:nowrap}
.filter-chips::-webkit-scrollbar{display:none}
.filter-chip{flex-shrink:0;display:inline-flex;align-items:center;gap:4px;height:26px;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap;border:none}
.acq-chip{background:color-mix(in srgb,var(--y) 15%,var(--card));color:var(--ink);border:1px solid transparent}
.acq-chip:hover{background:color-mix(in srgb,var(--y) 25%,var(--card))}
.acq-chip.active{background:var(--y);border-color:var(--y);color:#16181d}
.cat-chip{background:transparent;color:var(--ink);border:1px solid var(--line)}
.cat-chip:hover{border-color:var(--b);background:color-mix(in srgb,var(--b) 8%,transparent)}
.cat-chip.active{background:var(--b);border-color:var(--b);color:#fff}
.filter-chip .cnt{font-size:11px;background:rgba(0,0,0,.08);padding:1px 5px;border-radius:999px;font-weight:800}
.acq-chip.active .cnt{background:rgba(0,0,0,.12)}
.cat-chip.active .cnt{background:rgba(255,255,255,.2)}
.filter-divider{width:1px;height:20px;background:var(--line);flex-shrink:0;margin:0 2px}
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
  .acq-filter-bar{flex-direction:column;align-items:stretch;gap:6px;padding:6px 0;max-width:100%}
  .filter-group{padding:0 16px}
  .filter-group:first-child{padding-left:16px}
  .filter-group:last-child{padding-right:16px}
  .filter-divider{display:none}
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
