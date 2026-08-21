// Final data-integrity pass after liquidity audit.
(function(){
  const prev=accApplyFinance;
  accApplyFinance=function(){
    prev();
    const notes={
      satiro:'$12M en 30 cuotas mensuales de $400K. Primera cuota: 1 sep 2026. Mantenimiento queda fuera hasta confirmación posterior.',
      harbin:'Base $30M. Simulador 4/6/12/18/24/30 cuotas; 15% de descuento en 4 y 0% en 30. Firma estimada 15 sep; primer cobro base 15 oct.',
      candilejas:'Base $20M. Simulador vigente 4/6/12/18/24/30 cuotas con descuento lineal de 15% a 0%. Primer cobro aproximado un mes después de firma.',
      labanca:'Base $20M. Simulador vigente 4/6/12/18/24/30 cuotas con descuento lineal de 15% a 0%. Primer cobro aproximado un mes después de firma.',
      carreta:'Base $12M. Simulador 4/6/12/18/24/30 cuotas. Mantenimiento no se proyecta hasta confirmación del cliente.',
      plazoleta:'8 restaurantes: precio de volumen actual $72M (6 pagados + 2 gratis). El pronto pago se aplica después del descuento de volumen. Costos escalan con restaurantes.',
      amsterdam:'3 desarrollos × $5M = $15M contra entrega estimada 30 oct. Mantenimiento queda fuera hasta confirmación. Comisión comercial máxima de $500K por proyecto se controla aparte.'
    };
    Object.entries(notes).forEach(([id,n])=>{const p=P.find(x=>x.id===id);if(p&&p.fin)p.fin.n=n});
    ['marytierra','charles'].forEach(id=>{const p=P.find(x=>x.id===id);if(p){p.totalValue=null;p.cash2=null;p.cash6=null;p.weighted=null;if(p.fin){p.fin.total=null;p.fin.cash2=null;p.fin.cash6=null;p.fin.weighted=null}}});
  };
  render();
})();