export type CuentaCobroEstado = 'borrador' | 'revision' | 'emitida' | 'anulada' | 'reemplazada';

export interface PersonaCobro {
  id: string;
  nombre: string;
  documento: string;
  correo?: string;
  telefono?: string;
  banco?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
  notas?: string;
  necesitaValidacion?: boolean;
}

export interface CuentaCobroPayload {
  id?: string;
  numero?: string;
  version?: number;
  estado: CuentaCobroEstado;
  persona: PersonaCobro;
  proyecto?: string;
  pagoId?: string;
  responsable: string;
  concepto: string;
  monto: number;
  valorFijo?: number;
  horas?: number;
  tarifaHora?: number;
  periodo: string;
  fecha: string;
  notas?: string;
  archivoPath?: string;
  createdAt?: string;
  updatedAt?: string;
  // Declaración de no subcontratación (requisito cuenta de cobro Colombia)
  declaracionNoSubcontratacion?: boolean;
  declaracionTexto?: string;
  declaracionFecha?: string;
  // Desglose de conceptos (cantidad × precio)
  lineas?: { concepto: string; cantidad: number; precio: number }[];
}

// Texto canónico de la declaración de no subcontratación (cuentas de cobro
// de personas naturales en Colombia). El prestador declara que prestó los
// servicios personalmente y no subcontrató a terceros, protegiendo al pagador
// frente a riesgos laborales y de seguridad social.
export const DECLARACION_NO_SUBCONTRATACION = 'Declaro bajo la gravedad de juramento que los servicios relacionados en la presente cuenta de cobro fueron prestados personalmente por mí, de manera directa y sin haber subcontratado, cedido ni delegado la ejecución de los mismos a terceros. Manifiesto igualmente que no existe relación laboral con el pagador y asumo la responsabilidad por los aportes a seguridad social y parafiscales que correspondan por los servicios prestados.';

export interface CuentaCobroTemplate {
  id: string;
  nombre: string;
  concepto: string;
  proyecto?: string;
  responsable: string;
  periodo: string;
}
