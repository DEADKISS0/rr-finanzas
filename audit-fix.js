// RR Aliados — post-render audit fixes
// Keeps core financial information readable at every viewport.
(function(){
  function labelRows(tableSelector,rowSelector,headSelector){
    document.querySelectorAll(tableSelector).forEach(table=>{
      const labels=[...table.querySelectorAll(headSelector)].map(x=>x.textContent.trim());
      table.querySelectorAll(rowSelector).forEach(row=>{
        [...row.children].forEach((cell,i)=>{
          if(labels[i])cell.setAttribute('data-label',labels[i]);
        });
      });
    });
  }

  function decorateTables(){
    labelRows('.accTable','.accRow:not(.head)','.accRow.head > span');
    labelRows('.pipelineTable','.pipeRow:not(.head)','.pipeRow.head > span');
  }

  function decorateInputs(){
    document.querySelectorAll('.controls input').forEach(input=>{
      if(!input.getAttribute('aria-label'))input.setAttribute('aria-label','Buscar proyectos');
    });
    document.querySelectorAll('.card').forEach(card=>{
      const title=card.querySelector('h3')?.textContent?.trim();
      if(title)card.setAttribute('aria-label',`Abrir detalle de ${title}`);
    });
  }

  function centerActiveTab(){
    const active=document.querySelector('.tabs button.on');
    if(!active)return;
    requestAnimationFrame(()=>active.scrollIntoView({block:'nearest',inline:'center',behavior:'auto'}));
  }

  function buildMobileCalendar(){
    const calendar=document.querySelector('.calendar');
    if(!calendar||calendar.nextElementSibling?.classList.contains('mobileCalendar'))return;
    const list=document.createElement('div');
    list.className='mobileCalendar';
    calendar.querySelectorAll('.day').forEach(day=>{
      const events=[...day.querySelectorAll('.evt')];
      const dayNumber=day.querySelector(':scope > span')?.textContent?.trim();
      if(!dayNumber||!events.length)return;
      const item=document.createElement('section');
      item.className='mobileDay';
      item.innerHTML=`<div class="mobileDayDate" aria-label="Día ${dayNumber}">${dayNumber}</div><div class="mobileDayEvents"></div>`;
      const holder=item.querySelector('.mobileDayEvents');
      events.forEach(evt=>holder.appendChild(evt.cloneNode(true)));
      list.appendChild(item);
    });
    if(list.children.length)calendar.insertAdjacentElement('afterend',list);
  }

  const guides={
    pipeline:['Finanzas comerciales','Valor total, recaudo y riesgo son lecturas distintas. En móvil cada proyecto aparece como una ficha completa para que no haya columnas escondidas.','No confundir valor del proyecto con caja disponible.'],
    costs:['Costos por proyecto','Costo total esperado incluye la reserva técnica; la reserva se muestra como exposición futura y no reduce la caja hasta activarse.','Real · previsto · reserva'],
    accounting:['Contabilidad operativa','Caja es dinero disponible hoy. CxC es dinero por cobrar y CxP es dinero por pagar. Los gastos fijos de RR se muestran separados del costo directo de cada proyecto.','Corte: 21 ago 2026'],
    cashflow:['Flujo de caja','La proyección base suma movimientos confirmados y estimados, excluye ingresos condicionados y mantiene las reservas técnicas fuera de la caja hasta que tengan fecha real.','Base ≠ escenario conservador'],
    calendar:['Calendario financiero','En computador se conserva la cuadrícula. En teléfono cambia a una agenda vertical para leer todos los movimientos sin desplazamiento lateral.','Operación + caja']
  };

  function addGuide(){
    const view=document.getElementById('view');
    if(!view||view.querySelector(':scope > .viewGuide'))return;
    const cfg=guides[typeof tab!=='undefined'?tab:''];
    if(!cfg)return;
    const guide=document.createElement('aside');
    guide.className='viewGuide';
    guide.innerHTML=`<div><b>${cfg[0]}</b><p>${cfg[1]}</p></div><small>${cfg[2]}</small>`;
    view.prepend(guide);
  }

  function enhance(){
    decorateTables();
    decorateInputs();
    buildMobileCalendar();
    addGuide();
    centerActiveTab();
  }

  const oldRender=window.render||render;
  render=function(){oldRender();enhance();};

  if(window.rrSetTab){
    const oldSetTab=window.rrSetTab;
    window.rrSetTab=function(next){
      oldSetTab(next);
      requestAnimationFrame(enhance);
    };
  }

  requestAnimationFrame(enhance);
})();
