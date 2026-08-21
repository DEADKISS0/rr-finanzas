// Session correction: La Carreta Zipaquira has a defined commercial value of COP 12,000,000.
const carretaProject=P.find(p=>p.id==='carreta');
if(carretaProject){
  carretaProject.p=12000000;
  carretaProject.commercial=['Valor comercial definido: $12.000.000','Mismo sistema comercial de Sátiro'];
}
