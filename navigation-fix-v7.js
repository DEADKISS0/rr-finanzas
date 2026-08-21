// RR Aliados — navigation hotfix v7
// Critical: always call the latest render() instead of the stale render captured by motion.js.
(function(){
  window.RR_UI_BUILD='v7';

  window.rrSetTab=function(next){
    if(typeof tab==='undefined'||next===tab)return;
    const swap=()=>{
      tab=next;
      // Important: resolve render dynamically at click time.
      if(typeof window.render==='function')window.render();
      else if(typeof render==='function')render();
    };
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduced&&document.startViewTransition){document.startViewTransition(swap)}else{swap()}
  };

  // Rebuild nav so every button uses the current navigation handler.
  if(typeof nav==='function'){
    nav=function(){
      tabsEl.innerHTML=tabs.map(x=>`<button class="${tab===x[0]?'on':''}" onclick="rrSetTab('${x[0]}')">${x[1]}${x[0]==='projects'?` · ${P.length}`:''}</button>`).join('');
    };
  }

  function markBuild(){
    const footer=document.querySelector('footer');
    if(footer&&!footer.querySelector('.buildMark')){
      footer.insertAdjacentHTML('beforeend',' <span class="buildMark">· UI V7</span>');
    }
    document.documentElement.dataset.rrBuild='v7';
  }

  const latestRender=window.render||render;
  window.render=render=function(){
    latestRender();
    markBuild();
  };

  render();
})();
