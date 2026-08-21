// RR Aliados branded PDF export layer.
// Overrides the generic PDF functions declared in app.js.
const RRPDF={
  c:{fuchsia:[190,7,109],mustard:[222,209,22],orchid:[151,61,143],white:[255,255,243],black:[7,0,1],gray:[120,112,117],light:[244,239,241]},
  brand:'RR ALIADOS',
  role:'GROWTH PARTNER',
  date:'20.08.2026'
};
function rrSet(doc,key){doc.setTextColor(...RRPDF.c[key])}
function rrFill(doc,key){doc.setFillColor(...RRPDF.c[key])}
function rrLine(doc,key){doc.setDrawColor(...RRPDF.c[key])}
function rrPageBase(doc,section){
  const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
  rrFill(doc,'white');doc.rect(0,0,w,h,'F');
  rrFill(doc,'black');doc.rect(0,0,w,11,'F');
  rrFill(doc,'fuchsia');doc.rect(0,0,5,h,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(8);rrSet(doc,'white');doc.text('RR  ALIADOS',14,7.3);
  doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.text((section||'CONTEXTO MAESTRO').toUpperCase(),w-14,7.3,{align:'right'});
  rrSet(doc,'gray');doc.setFontSize(6.5);doc.text('Growth Partner · Control operativo + comercial',14,h-7);
  doc.text(RRPDF.date,w-14,h-7,{align:'right'});
}
function rrCover(doc,title,subtitle){
  const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
  rrFill(doc,'black');doc.rect(0,0,w,h,'F');
  rrFill(doc,'fuchsia');doc.rect(0,0,9,h,'F');
  rrFill(doc,'mustard');doc.rect(w-32,0,32,32,'F');
  rrFill(doc,'orchid');doc.rect(w-13,32,13,h-32,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(13);rrSet(doc,'mustard');doc.text('RR  ALIADOS',20,27);
  doc.setFontSize(8);rrSet(doc,'white');doc.text('GROWTH PARTNER',20,35);
  doc.setFontSize(31);doc.setFont('helvetica','bold');
  const lines=doc.splitTextToSize(title.toUpperCase(),145);doc.text(lines,20,82,{lineHeightFactor:.86});
  const y=82+(lines.length*23);
  rrSet(doc,'mustard');doc.setFontSize(11);doc.setFont('helvetica','bold');doc.text(subtitle.toUpperCase(),20,y+12);
  rrSet(doc,'white');doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.text('Actualización operativa, comercial y técnica consolidada.',20,y+24);
  doc.text('20 de agosto de 2026',20,y+31);
  rrLine(doc,'fuchsia');doc.setLineWidth(1.2);doc.line(20,h-38,110,h-38);
  doc.setFontSize(7);rrSet(doc,'white');doc.text('TRANSPARENCIA RADICAL · VISIÓN SISTÉMICA · EJECUCIÓN',20,h-27);
  rrSet(doc,'mustard');doc.setFont('helvetica','bold');doc.text('CON LAS MANOS EN EL FUEGO.',20,h-19);
}
function rrNewPage(doc,section){doc.addPage();rrPageBase(doc,section);return 22}
function rrSectionTitle(doc,kicker,title,y){
  doc.setFont('helvetica','bold');doc.setFontSize(7);rrSet(doc,'fuchsia');doc.text(kicker.toUpperCase(),14,y);
  doc.setFontSize(20);rrSet(doc,'black');doc.text(title.toUpperCase(),14,y+9);
  rrFill(doc,'mustard');doc.rect(14,y+13,34,2.2,'F');
  return y+22;
}
function rrWrapped(doc,text,x,y,width,size=8.3,color='black',style='normal',lh=1.28){
  doc.setFont('helvetica',style);doc.setFontSize(size);rrSet(doc,color);
  const lines=doc.splitTextToSize(String(text||''),width);doc.text(lines,x,y,{lineHeightFactor:lh});
  return y+lines.length*size*0.38*lh;
}
function rrEnsure(doc,y,need,section){const h=doc.internal.pageSize.getHeight();return y+need>h-16?rrNewPage(doc,section):y}
function rrBullet(doc,text,x,y,width,color='black'){
  rrFill(doc,'fuchsia');doc.circle(x,y-1.4,1.1,'F');
  return rrWrapped(doc,text,x+4,y,width-4,7.6,color,'normal',1.25)+1.4;
}
function rrProjectSummary(doc,p,y){
  y=rrEnsure(doc,y,36,'Resumen ejecutivo');
  const w=doc.internal.pageSize.getWidth();
  rrFill(doc,p.pr==='Crítica'?'fuchsia':'black');doc.rect(14,y,w-28,7,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(9);rrSet(doc,'white');doc.text(p.n.toUpperCase(),18,y+4.8);
  doc.setFontSize(6.5);doc.text(`${p.s} · ${p.date}`,w-18,y+4.8,{align:'right'});
  y+=12;
  doc.setFont('helvetica','bold');doc.setFontSize(6.3);rrSet(doc,'orchid');doc.text('PUNTO CLAVE',18,y);
  y=rrWrapped(doc,p.d,18,y+4,82,7.5,'black','normal',1.22);
  doc.setFont('helvetica','bold');doc.setFontSize(6.3);rrSet(doc,'orchid');doc.text('PASO A SEGUIR',108,y-(Math.min(18,y%18)));
  // Keep the action visually anchored in the right column.
  const actionTop=Math.max(y-15, y-22);
  rrWrapped(doc,p.next,108,actionTop+4,84,7.5,'black','normal',1.22);
  const key=[...(p.pending||[]).slice(0,2),...(p.risks||[]).slice(0,1)];
  let ky=Math.max(y,actionTop+20)+2;
  if(key.length){doc.setFont('helvetica','bold');doc.setFontSize(6.3);rrSet(doc,'fuchsia');doc.text('CLAVES',18,ky);ky+=4;for(const t of key)ky=rrBullet(doc,t,19,ky,173,'black')}
  rrLine(doc,'light');doc.setLineWidth(.25);doc.line(14,ky+1,w-14,ky+1);
  return ky+6;
}
function rrDetailProject(doc,p){
  let y=rrNewPage(doc,p.n);
  y=rrSectionTitle(doc,p.k,p.n,y);
  doc.setFont('helvetica','bold');doc.setFontSize(7);rrSet(doc,'orchid');doc.text(`${p.s.toUpperCase()} · ${p.pr.toUpperCase()} · ${p.loc.toUpperCase()} · ${p.date.toUpperCase()}`,14,y);y+=7;
  rrFill(doc,'black');doc.roundedRect(14,y,182,22,1.5,1.5,'F');
  rrSet(doc,'white');doc.setFont('helvetica','bold');doc.setFontSize(6.3);doc.text('SITUACIÓN ACTUAL',18,y+6);
  rrWrapped(doc,p.d,18,y+11,174,7.5,'white','normal',1.2);y+=29;
  rrFill(doc,'mustard');doc.roundedRect(14,y,182,19,1.5,1.5,'F');
  rrSet(doc,'black');doc.setFont('helvetica','bold');doc.setFontSize(6.3);doc.text('SIGUIENTE MOVIMIENTO',18,y+6);
  rrWrapped(doc,p.next,18,y+11,174,7.4,'black','bold',1.18);y+=27;
  const groups=[['COMERCIAL / PRECIO',p.commercial],['RESPONSABLES',p.owners],['RIESGOS',p.risks],['PENDIENTES',p.pending],['NOTAS',p.notes]];
  for(const [name,items] of groups){if(!items||!items.length)continue;y=rrEnsure(doc,y,16,p.n);doc.setFont('helvetica','bold');doc.setFontSize(7);rrSet(doc,name==='RIESGOS'?'fuchsia':'orchid');doc.text(name,14,y);y+=5;for(const item of items){y=rrEnsure(doc,y,9,p.n);y=rrBullet(doc,item,16,y,178,'black')}y+=2}
  if(p.links?.length){y=rrEnsure(doc,y,14,p.n);doc.setFont('helvetica','bold');doc.setFontSize(7);rrSet(doc,'orchid');doc.text('ENLACES',14,y);y+=5;for(const l of p.links){y=rrBullet(doc,`${l[0]} — ${l[1]}`,16,y,178,'black')}}
}
function rrAudit(doc){let y=rrNewPage(doc,'Auditoría técnica');y=rrSectionTitle(doc,'CONTROL DE CALIDAD','Auditoría técnica',y);y=rrWrapped(doc,'Estas observaciones separan lo verificado por código de aquello que todavía requiere validación end-to-end en los deployments.',14,y,182,8.3,'black','normal',1.3)+5;for(const a of AUDIT){y=rrEnsure(doc,y,28,'Auditoría técnica');rrFill(doc,'black');doc.rect(14,y,182,7,'F');rrSet(doc,'mustard');doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text(a[0].toUpperCase(),18,y+4.8);y+=12;y=rrWrapped(doc,a[1],18,y,174,7.7,'black','normal',1.25)+7}}
function rrBuildMasterPdf(){
  const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'});doc.setProperties({title:'RR Aliados - Contexto Maestro',subject:'Resumen ejecutivo y contexto actual por proyecto',author:'RR Aliados',creator:'RR Aliados Project Command Center'});
  rrCover(doc,'Contexto Maestro','Project Command Center');
  let y=rrNewPage(doc,'Resumen ejecutivo');y=rrSectionTitle(doc,'PRIMER APARTADO','Resumen por proyecto',y);y=rrWrapped(doc,'Lectura rápida para dirección: estado actual, punto clave y próximo movimiento de cada frente.',14,y,182,8.4,'black','normal',1.3)+5;
  for(const p of P)y=rrProjectSummary(doc,p,y);
  y=rrNewPage(doc,'Contexto completo');y=rrSectionTitle(doc,'SEGUNDO APARTADO','Contexto actual completo',y);rrWrapped(doc,'A partir de aquí se conserva el detalle operativo, comercial, responsables, riesgos, pendientes y notas de cada proyecto.',14,y,182,8.4,'black','normal',1.3);
  for(const p of P)rrDetailProject(doc,p);
  rrAudit(doc);return doc;
}
function rrBuildProjectPdf(p){
  const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'});doc.setProperties({title:`RR Aliados - ${p.n}`,subject:'Resumen ejecutivo y contexto actual',author:'RR Aliados'});rrCover(doc,p.n,'Contexto de proyecto');let y=rrNewPage(doc,'Resumen ejecutivo');y=rrSectionTitle(doc,'PRIMER APARTADO','Resumen ejecutivo',y);rrProjectSummary(doc,p,y);rrDetailProject(doc,p);return doc;
}
function downloadAllPdf(){if(!window.jspdf){alert('El generador PDF todavía está cargando. Intenta de nuevo en un momento.');return}rrBuildMasterPdf().save('RR-Aliados-Contexto-Maestro-2026-08-20.pdf')}
function downloadPdf(id){if(!window.jspdf){alert('El generador PDF todavía está cargando. Intenta de nuevo en un momento.');return}const p=P.find(x=>x.id===id);if(!p)return;rrBuildProjectPdf(p).save(`${id}-RR-Aliados-contexto.pdf`)}