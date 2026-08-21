// RR Aliados — interaction polish guided by Impeccable
// Purposeful continuity, mobile table labels, reduced-motion support.
(function(){
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function decorateTables(){
    document.querySelectorAll('.accTable').forEach(table=>{
      const labels=[...table.querySelectorAll('.accRow.head > span')].map(x=>x.textContent.trim());
      table.querySelectorAll('.accRow:not(.head)').forEach(row=>{
        [...row.children].forEach((cell,i)=>{
          if(labels[i]) cell.setAttribute('data-label',labels[i]);
        });
      });
    });
  }

  function decorateAccessibility(){
    const navEl=document.getElementById('tabs');
    if(navEl) navEl.setAttribute('aria-label','Secciones principales');
    document.querySelectorAll('.tabs button').forEach(btn=>{
      btn.setAttribute('aria-current',btn.classList.contains('on')?'page':'false');
    });
    document.querySelectorAll('.card').forEach(card=>{
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      if(!card.dataset.keyBound){
        card.dataset.keyBound='1';
        card.addEventListener('keydown',e=>{
          if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}
        });
      }
    });
  }

  function decorate(){
    const content=document.getElementById('view');
    if(content) content.style.viewTransitionName='content';
    decorateTables();
    decorateAccessibility();
  }

  const baseRender=window.render||render;
  const baseNav=window.nav||nav;

  window.rrSetTab=function(next){
    if(next===tab) return;
    const swap=()=>{tab=next;baseRender();decorate();};
    if(!reduced&&document.startViewTransition){document.startViewTransition(swap)}else{swap()}
  };

  // Rebuild navigation with a state-preserving transition instead of hard content replacement.
  nav=function(){
    tabsEl.innerHTML=tabs.map(x=>`<button class="${tab===x[0]?'on':''}" onclick="rrSetTab('${x[0]}')">${x[1]}${x[0]==='projects'?` · ${P.length}`:''}</button>`).join('');
  };

  render=function(){
    baseRender();
    decorate();
  };

  // Initial authored moment only. Routine screens do not get repeated scroll reveals.
  requestAnimationFrame(()=>{
    decorate();
    requestAnimationFrame(()=>document.body.classList.add('ui-ready'));
  });
})();
