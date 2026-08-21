// Fix Finanzas tab routing after loading finance-v2.js.
render=function(){
  nav();
  if(tab==='summary') view.innerHTML=summary();
  else if(tab==='projects') view.innerHTML=projects();
  else if(tab==='pipeline') view.innerHTML=pipeline();
  else if(tab==='calendar') view.innerHTML=calendar();
  else view.innerHTML=audit();
};
render();
