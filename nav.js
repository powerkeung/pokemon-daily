(function(){
const BASE='/pokemon-daily';
const MANIFEST_URL=BASE+'/reports/index.json';

function getCurrentDate(){
  const path=window.location.pathname;
  const match=path.match(/reports\/(\d{4}-\d{2}-\d{2})/);
  return match?match[1]:null;
}

function getBasePath(){
  const currentDate=getCurrentDate();
  return currentDate?'../../':'';
}

function renderNav(reports){
  const currentDate=getCurrentDate();
  const currentIndex=reports.findIndex(r=>r.date===currentDate);
  const prevReport=currentIndex>0?reports[currentIndex-1]:null;
  const nextReport=(currentIndex>=0&&currentIndex<reports.length-1)?reports[currentIndex+1]:null;
  const basePath=getBasePath();
  
  const nav=document.createElement('nav');
  nav.className='report-nav';
  nav.setAttribute('aria-label','報告導航');
  
  let html='<div class="report-nav-wrap">';
  html+=`<a href="${BASE}/" class="nav-btn nav-home">最新報告</a>`;
  
  if(prevReport){
    html+=`<a href="${basePath}reports/${prevReport.date}/" class="nav-btn nav-prev">◀ 前一日</a>`;
  }else{
    html+=`<span class="nav-btn nav-prev disabled">◀ 前一日</span>`;
  }
  
  html+=`<select class="nav-select" aria-label="選擇報告日期">`;
  html+=`<option value="">選擇日期...</option>`;
  reports.forEach(r=>{
    const selected=r.date===currentDate?'selected':'';
    const url=r.date===currentDate?'#':(basePath+'reports/'+r.date+'/');
    html+=`<option value="${url}" ${selected}>${r.label}</option>`;
  });
  html+=`</select>`;
  
  if(nextReport){
    html+=`<a href="${basePath}reports/${nextReport.date}/" class="nav-btn nav-next">後一日 ▶</a>`;
  }else{
    html+=`<span class="nav-btn nav-next disabled">後一日 ▶</span>`;
  }
  
  html+='</div>';
  nav.innerHTML=html;
  
  const select=nav.querySelector('.nav-select');
  select.addEventListener('change',function(){
    if(this.value&&this.value!=='#'){
      window.location.href=this.value;
    }
  });
  
  const header=document.querySelector('header');
  if(header){
    header.parentNode.insertBefore(nav,header);
  }else{
    document.body.insertBefore(nav,document.body.firstChild);
  }
  
  const style=document.createElement('style');
  style.textContent=`
.report-nav{position:sticky;top:0;z-index:100;background:var(--bg);border-bottom:2px solid var(--y);box-shadow:0 2px 8px rgba(0,0,0,.08)}
.report-nav-wrap{max-width:1180px;margin:0 auto;padding:10px 16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.nav-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 14px;border-radius:8px;background:var(--y);color:#16181d;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap;border:0;font-family:inherit;cursor:pointer;transition:all .2s}
.nav-btn:hover:not(.disabled){background:var(--yd);transform:translateY(-1px)}
.nav-btn.disabled{opacity:.4;cursor:not-allowed;pointer-events:none}
.nav-home{background:var(--r);color:#fff}
.nav-home:hover{background:#b5161f}
.nav-select{flex:1;min-width:160px;max-width:280px;min-height:36px;padding:0 12px;border-radius:8px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:border-color .2s}
.nav-select:focus{outline:none;border-color:var(--y)}
.nav-select option[selected]{background:var(--y);color:#16181d;font-weight:700}
@media(max-width:640px){
  .report-nav-wrap{gap:6px}
  .nav-btn{min-height:34px;padding:0 10px;font-size:12px}
  .nav-select{min-width:120px;font-size:12px}
  .nav-home{order:-1;width:100%}
}
`;
  document.head.appendChild(style);
}

fetch(MANIFEST_URL)
  .then(r=>r.json())
  .then(renderNav)
  .catch(err=>console.error('Failed to load navigation:',err));
})();
