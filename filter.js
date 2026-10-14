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

function getCounts(){
  const counts={all:0,store:0,lottery:0,online:0};
  document.querySelectorAll('.card[data-acquisition]').forEach(card=>{
    counts.all++;
    const types=card.dataset.acquisition.split(' ');
    types.forEach(type=>{
      if(counts[type]!==undefined)counts[type]++;
    });
  });
  return counts;
}

function renderFilterBar(){
  const existing=document.querySelector('.acq-filter-bar');
  if(existing)return;
  
  const counts=getCounts();
  const bar=document.createElement('div');
  bar.className='acq-filter-bar';
  bar.setAttribute('role','group');
  bar.setAttribute('aria-label','按取得方式篩選');
  
  let html='<div class="acq-filter-wrap">';
  html+=`<button class="acq-filter-btn active" data-filter="all">全部 <span class="count">${counts.all}</span></button>`;
  html+=`<button class="acq-filter-btn" data-filter="store">店頭 <span class="count">${counts.store}</span></button>`;
  html+=`<button class="acq-filter-btn" data-filter="lottery">抽選 <span class="count">${counts.lottery}</span></button>`;
  html+=`<button class="acq-filter-btn" data-filter="online">線上可買 <span class="count">${counts.online}</span></button>`;
  html+='</div>';
  bar.innerHTML=html;
  
  bar.querySelectorAll('.acq-filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      bar.querySelectorAll('.acq-filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      filterCards(btn.dataset.filter);
    });
  });
  
  const filtersNav=document.querySelector('.filters');
  if(filtersNav){
    filtersNav.insertAdjacentElement('afterend',bar);
  }else{
    const main=document.querySelector('main');
    if(main)main.insertAdjacentElement('beforebegin',bar);
  }
}

function filterCards(type){
  document.querySelectorAll('.card[data-acquisition]').forEach(card=>{
    if(type==='all'){
      card.hidden=false;
    }else{
      const types=card.dataset.acquisition.split(' ');
      card.hidden=!types.includes(type);
    }
  });
  
  document.querySelectorAll('main section:not(.notes)').forEach(section=>{
    const visibleCards=section.querySelectorAll('.card[data-acquisition]:not([hidden])');
    section.hidden=visibleCards.length===0;
  });
}

const style=document.createElement('style');
style.textContent=`
.acq-badges{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 8px}
.acq-badge{display:inline-block;font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;white-space:nowrap}
.acq-filter-bar{background:var(--bg);border-bottom:1px solid var(--line);padding:12px 0}
.acq-filter-wrap{max-width:1180px;margin:0 auto;padding:0 16px;display:flex;gap:8px;flex-wrap:wrap}
.acq-filter-btn{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:0 16px;border-radius:999px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit}
.acq-filter-btn:hover{border-color:var(--y);background:color-mix(in srgb,var(--y) 10%,var(--card))}
.acq-filter-btn.active{background:var(--y);border-color:var(--y);color:#16181d}
.acq-filter-btn .count{font-size:12px;background:rgba(0,0,0,.1);padding:2px 7px;border-radius:999px;font-weight:800}
.acq-filter-btn.active .count{background:rgba(0,0,0,.15)}
@media(max-width:640px){
  .acq-filter-btn{min-height:36px;padding:0 12px;font-size:13px}
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
