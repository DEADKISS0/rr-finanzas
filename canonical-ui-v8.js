// RR Aliados — Canonical UI Router V8
// Loaded last. Replaces the accumulated render/nav wrapper chain with one deterministic router.
(function(){
  window.RR_UI_BUILD='v8';

  const CANONICAL_TABS=[
    ['summary','Resumen'],
    ['liquidity','Runway'],
    ['pnl','P&L'],
    ['projects','Proyectos'],
    ['pipeline','Comercial'],
    ['costs','Costos'],
    ['accounting','Contabilidad'],
    ['cashflow','Flujo de caja'],
    ['calendar','Calendario'],
    ['audit','Auditoría']
  ];

  // Mutate the existing tabs array in place so every older reference sees the same final structure.
  if(typeof tabs!=='undefined'){
    tabs.splice(0,tabs.length,...CANONICAL_TABS);
  }

  function viewFor(id){
    if(id==='summary' && typeof summary==='function') return summary();
    if(id==='liquidity' && typeof liquidity==='function') return liquidity();
    if(id==='pnl' && typeof pnl==='function') return pnl();
    if(id==='projects' && typeof projects==='function') return projects();
    if(id==='pipeline' && typeof pipeline==='function') return pipeline();
    if(id==='costs' && typeof costs==='function') return costs();
    if(id==='accounting' && typeof accounting==='function') return accounting();
    if(id==='cashflow' && typeof cashflow==='function') return cashflow();
    if(id==='calendar' && typeof calendar==='function') return calendar();
    if(id==='audit' && typeof audit==='function') return audit();
    return `<div class="empty"><b>Vista no disponible.</b><br>Sección: ${String(id)}</div>`;
  }

  function decorateCurrent(){
    document.querySelectorAll('.accTable').forEach(table=>{
      const labels=[...table.querySelectorAll('.accRow.head > span')].map(x=>x.textContent.trim());
      table.querySelectorAll('.accRow:not(.head)').forEach(row=>[...row.children].forEach((cell,i)=>{if(labels[i])cell.setAttribute('data-label',labels[i])}));
    });
    document.querySelectorAll('.tabs button').forEach(btn=>btn.setAttribute('aria-current',btn.classList.contains('on')?'page':'false'));
    const content=document.getElementById('view'); if(content)content.style.viewTransitionName='content';
  }

  function canonicalNav(){
    const el=document.getElementById('tabs');
    if(!el)return;
    el.setAttribute('aria-label','Secciones principales');
    el.innerHTML=CANONICAL_TABS.map(([id,label])=>`<button type="button" data-tab="${id}" class="${tab===id?'on':''}" onclick="rrSetTabV8('${id}')">${label}${id==='projects'?` · ${P.length}`:''}</button>`).join('');
  }

  function canonicalRender(){
    if(typeof accApplyFinance==='function')accApplyFinance();
    canonicalNav();
    const el=document.getElementById('view');
    if(el)el.innerHTML=viewFor(tab);
    decorateCurrent();
    markBuild();
  }

  window.rrSetTabV8=function(next){
    if(!CANONICAL_TABS.some(x=>x[0]===next))return;
    const swap=()=>{tab=next;canonicalRender()};
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduced&&document.startViewTransition)document.startViewTransition(swap);else swap();
  };
  window.rrSetTab=window.rrSetTabV8;

  function markBuild(){
    document.documentElement.dataset.rrBuild='v8';
    let badge=document.getElementById('rrBuildBadge');
    if(!badge){
      badge=document.createElement('div');badge.id='rrBuildBadge';badge.className='rrBuildBadge';
      badge.textContent='RR FINANZAS · UI V8';
      document.body.appendChild(badge);
    }
    const footer=document.querySelector('footer');
    if(footer){footer.querySelectorAll('.buildMark').forEach(x=>x.remove());footer.insertAdjacentHTML('beforeend',' <span class="buildMark">· UI V8</span>')}
  }

  // Replace global references after all previous layers have loaded.
  window.nav=nav=canonicalNav;
  window.render=render=canonicalRender;

  // Sanity signal used for live verification.
  window.RR_UI_SANITY={build:'v8',tabs:CANONICAL_TABS.map(x=>x[0]),hasPnl:typeof pnl==='function',hasLiquidity:typeof liquidity==='function'};
  canonicalRender();
})();
