// Calendar corrections based on the 20 Aug 2026 RR Aliados session.
E.splice(0,E.length,
['2026-08-21','10:00','Wundeer','Revisión y aprobación de ideas','meeting','confirmed'],
['2026-08-21','','Candilejas','Presentación de prototipo + precio + propuesta · viernes en la noche','delivery','confirmed'],
['2026-08-21','','La Banca','Presentación de prototipo + precio + propuesta · viernes en la noche','delivery','confirmed'],
['2026-08-21','','Amsterdam','Reunión de coordinación para aclarar correcciones y flujo de trabajo','meeting','confirmed'],
['2026-08-21','','Junisama / BOGA legado','Reunión con Alejandra Paternina para recibir indicaciones finales','meeting','confirmed'],
['2026-08-24','','Amsterdam','Fecha límite para correcciones de Carlitos / frontend','delivery','confirmed'],
['2026-09-01','','Sátiro Sushi','Entrega funcional','delivery','confirmed'],
['2026-09-01','','Mar y Tierra','Presentación de prototipo + precio + propuesta comercial','meeting','confirmed'],
['2026-09-01','','La Carreta Zipaquirá','Presentación de prototipo + precio + propuesta comercial','meeting','confirmed'],
['2026-09-01','','Charles Brown','Presentación de prototipo + precio + propuesta comercial','meeting','confirmed'],
['2026-09-01','','Plazoleta Jardín','Presentación de prototipo + precio + propuesta comercial','meeting','confirmed'],
['2026-09-15','','Amsterdam','Viaje/presentaciones en Aruba · fecha aproximada','meeting','approx'],
['2026-09-18','','BOGA','Entrega objetivo del proyecto','delivery','confirmed']
);
function calendar(){
 const start=(new Date(year,month,1).getDay()+6)%7,days=new Date(year,month+1,0).getDate(),cells=[...Array(start).fill(0),...Array.from({length:days},(_,i)=>i+1)];
 const badge=e=>e[5]==='approx'?'<span class="cal-status approx">APROX.</span>':'<span class="cal-status confirmed">CONFIRMADO</span>';
 return `<div class="sectionHead"><div><div class="label">CALENDARIO OPERATIVO</div><h2>${new Date(year,month).toLocaleDateString('es-CO',{month:'long',year:'numeric'}).toUpperCase()}</h2></div><div><button class="chip" onclick="go(-1)">←</button> <button class="chip" onclick="go(1)">→</button></div></div><div class="note">Fechas corregidas con base en la sesión del 20 de agosto de 2026. Cuando una fecha no fue cerrada con exactitud, aparece marcada como APROX. No se muestran como citas confirmadas los pasos que todavía están “por agendar”.</div><div class="calendar"><div class="week">${['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].map(x=>`<div>${x}</div>`).join('')}</div><div class="days">${cells.map(d=>d?`<div class="day"><span>${d}</span>${E.filter(e=>{let z=new Date(e[0]+'T12:00:00');return z.getFullYear()===year&&z.getMonth()===month&&z.getDate()===d}).map(e=>`<div class="evt ${e[4]} ${e[5]==='approx'?'approx':''}"><div class="evt-head"><b>${e[1]?e[1]+' · ':''}${esc(e[2])}</b>${badge(e)}</div><div>${esc(e[3])}</div></div>`).join('')}</div>`:'<div class="day"></div>').join('')}</div></div><div class="sectionHead"><div><div class="label">AGENDA CLAVE</div><h2>HITOS CONFIRMADOS Y APROXIMADOS</h2></div></div><div class="timeline">${E.map(e=>`<div class="tl"><time>${e[0]} ${e[1]||''}</time><div><div class="tl-title"><b>${esc(e[2])}</b>${badge(e)}</div><small>${esc(e[3])}</small></div></div>`).join('')}</div>`;
}
