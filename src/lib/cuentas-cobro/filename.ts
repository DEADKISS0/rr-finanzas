import type { CuentaCobroPayload } from './types';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Nombre oficial del PDF descargable de una cuenta de cobro. */
export const nombreArchivoCuentaCobro = (payload: Partial<CuentaCobroPayload>): string => {
  const periodo = payload.periodo || '';
  const periodoNormalizado = periodo.toLocaleLowerCase('es-CO');
  const indiceMes = MESES.findIndex((mes) => periodoNormalizado.includes(mes.toLocaleLowerCase('es-CO')));
  const fecha = payload.fecha || '';
  const fechaPartes = fecha.match(/^(\d{4})-(\d{2})/);
  const indiceMesFinal = indiceMes >= 0 ? indiceMes : Math.max(0, Number(fechaPartes?.[2] || 1) - 1);
  const anio = periodo.match(/\b(20\d{2})\b/)?.[1] || fechaPartes?.[1] || String(new Date().getFullYear());
  const consecutivo = payload.numero?.match(/(\d+)\s*$/)?.[1] || '0';
  const numero = consecutivo.padStart(4, '0');

  return `CC - ${MESES[indiceMesFinal]} - ${anio} - ${numero}.pdf`;
};
