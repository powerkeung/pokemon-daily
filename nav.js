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
  
  const backToTop=document.createElement('button');
  backToTop.className='back-to-top';
  backToTop.innerHTML='▲';
  backToTop.setAttribute('aria-label','返回頂部');
  backToTop.setAttribute('title','返回頂部');
  backToTop.style.display='none';
  document.body.appendChild(backToTop);
  
  backToTop.addEventListener('click',()=>{
    window.scrollTo({top:0,behavior:'smooth'});
  });
  
  let scrollTimeout;
  window.addEventListener('scroll',()=>{
    clearTimeout(scrollTimeout);
    scrollTimeout=setTimeout(()=>{
      if(window.scrollY>300){
        backToTop.style.display='flex';
      }else{
        backToTop.style.display='none';
      }
    },50);
  });
  
  const style=document.createElement('style');
  style.textContent=`
.report-nav{z-index:10;background:var(--bg);border-bottom:1px solid var(--line);box-shadow:0 1px 3px rgba(0,0,0,.05);padding:6px 0}
.report-nav-wrap{max-width:1180px;margin:0 auto;padding:0 16px;display:flex;gap:6px;align-items:center}
.nav-btn{display:inline-flex;align-items:center;justify-content:center;height:28px;padding:0 11px;border-radius:6px;background:var(--y);color:#16181d;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;border:0;font-family:inherit;cursor:pointer;transition:all .15s;flex-shrink:0}
.nav-btn:hover:not(.disabled){background:var(--yd);transform:translateY(-1px)}
.nav-btn.disabled{opacity:.4;cursor:not-allowed;pointer-events:none}
.nav-home{background:var(--r);color:#fff}
.nav-home:hover{background:#b5161f}
.nav-select{flex:1;min-width:140px;max-width:240px;height:28px;padding:0 10px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;transition:border-color .15s}
.nav-select:focus{outline:none;border-color:var(--y)}
.nav-select option[selected]{background:var(--y);color:#16181d;font-weight:700}
.back-to-top{position:fixed;bottom:20px;right:20px;z-index:999;display:none;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;background:var(--y);color:#16181d;font-size:18px;font-weight:bold;border:none;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.12);transition:all .25s;font-family:inherit}
.back-to-top:hover{background:var(--yd);transform:translateY(-2px);box-shadow:0 5px 14px rgba(0,0,0,.16)}
.back-to-top:active{transform:translateY(-1px)}
@media(max-width:640px){
  .report-nav-wrap{gap:5px;flex-wrap:wrap}
  .nav-btn{height:26px;padding:0 9px;font-size:11px}
  .nav-select{min-width:110px;font-size:11px;height:26px}
  .nav-home{flex-basis:100%;order:-1}
  .back-to-top{width:42px;height:42px;bottom:14px;right:14px;font-size:17px}
}
`;
  document.head.appendChild(style);
}

fetch(MANIFEST_URL)
  .then(r=>r.json())
  .then(renderNav)
  .catch(err=>console.error('Failed to load navigation:',err));
})();
