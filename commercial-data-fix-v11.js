// RR Aliados — commercial data reconciliation for V11
(function(){
  if(typeof P==='undefined') return;
  const byId=id=>P.find(x=>x.id===id);
  ['marytierra','charles'].forEach(id=>{
    const p=byId(id); if(!p) return;
    delete p.p; delete p.v;
    p.commercial=(p.commercial||[]).filter(x=>!/mismo sistema|mismo esquema/i.test(x));
    p.commercial.unshift('Precio base pendiente de confirmación; no entra como ingreso en el modelo financiero.');
  });
  ['candilejas','labanca'].forEach(id=>{
    const p=byId(id); if(!p) return;
    p.commercial=(p.commercial||[]).filter(x=>!/18M|4 meses|descuento táctico|\$1M/i.test(x));
    p.commercial.unshift('Simulador vigente: 4, 6, 12, 18, 24 o 30 cuotas con descuento proporcional según plazo.');
    p.commercial.unshift('Precio base vigente: $20M.');
  });
  const h=byId('harbin');
  if(h){
    h.commercial=(h.commercial||[]).filter(x=>!/pago inicia desde el día de la firma/i.test(x));
    h.commercial.unshift('Primer cobro aproximado un mes después de firma, ajustado al siguiente corte 15/30.');
    h.commercial.unshift('Precio base vigente: $30M; simulador 4/6/12/18/24/30 cuotas.');
  }
  const c=byId('carreta'); if(c){c.commercial=['Precio base vigente: $12M.','Simulador 4/6/12/18/24/30 cuotas con descuento proporcional según plazo.'];}
  const pl=byId('plazoleta'); if(pl){
    pl.commercial=['Base lista: $12M por restaurante.','Para 8 restaurantes: $72M después del descuento por volumen conocido (2 de 8 sin cobro).','Después se aplica el descuento por número de cuotas: 4/6/12/18/24/30.','Las reglas de volumen para 1–7 restaurantes siguen pendientes de definición.'];
  }
})();