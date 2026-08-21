// RR Aliados — V9.1 navigation cleanup
(function(){
  function patch(){
    const tabs=document.getElementById('tabs');
    if(!tabs)return;
    [...tabs.querySelectorAll('button')].forEach(btn=>{
      const t=btn.textContent.trim();
      if(t==='Runway')btn.textContent='Runway / Flujo';
      if(t==='Flujo de caja')btn.remove();
    });
    const badge=document.getElementById('rrBuildBadge');if(badge)badge.textContent='RR FINANZAS · UI V9.1';
    const footer=document.querySelector('footer');if(footer){footer.querySelectorAll('.buildMark').forEach(x=>x.remove());footer.insertAdjacentHTML('beforeend',' <span class="buildMark">· UI V9.1</span>')}
    document.documentElement.dataset.rrBuild='v9.1';
  }
  const base=window.renderV9;
  if(typeof base==='function'){
    window.renderV9=function(){base();patch()};
    window.render=window.renderV9;
  }
  window.RRSetTabV9=function(next){if(next==='cashflow')next='liquidity';tab=next;window.renderV9()};
  window.rrSetTab=window.RRSetTabV9;
  patch();
})();