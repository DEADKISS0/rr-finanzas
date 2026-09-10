import PDFDocument from 'pdfkit';
import path from 'path';
import { Writable } from 'stream';
import type { CuentaCobroPayload } from './types';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// Brand RR Aliados (brandkit oficial)
const EMBER = '#ce3d1f';
const VOID = '#3f0035';
const PARCHMENT = '#f5e6d3';
const ASH = '#968e93';
const GOLD = '#e8c069';
const INK = '#241820';
const MUTED = '#7a6f75';
const BG_SOFT = '#faf5ee';
const WHITE = '#ffffff';

// ── Sistema de espaciado (pt) ──
const S = {
  x: 55,          // margen lateral seguro (55px ~ A4)
  gapMin: 4,
  gapLabel: 8,    // label → valor
  gapInner: 14,   // padding interno de componentes
  gapGroup: 18,   // entre grupos de información
  gapSection: 26, // entre secciones principales
  rowH: 22,       // fila de datos del colaborador
  tableRowH: 20,  // fila de tabla de conceptos (compacta para 10+ conceptos)
  tableHeadH: 18,
  totalH: 30,
  declPad: { x: 14, top: 12, bottom: 14 }, // padding declaración
  declLH: 1.4,    // line-height declaración
};

export async function buildCuentaCobroPdf(payload: CuentaCobroPayload): Promise<Buffer> {
  // A4: 595.28 × 841.89 pt
  const W = 595.28;
  const H = 841.89;
  const margin = S.x;
  const contentW = W - margin * 2;

  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
  const chunks: Buffer[] = [];
  const writeBuf = new Writable({
    write(chunk: Buffer, _enc: unknown, cb: () => void) {
      chunks.push(Buffer.from(chunk));
      cb();
    },
  });
  doc.pipe(writeBuf);
  const firmaPath = resolveFirmaPath();

  let y = 0;
  // Safety net: si el contenido se pasa de la zona de firmas, nueva página (no debería ocurrir en A4)
  const checkPage = (needed: number) => {
    if (y + needed > H - 150) {
      doc.addPage();
      y = 40;
    }
  };

  // ── HELPERS ──
  const sectionTitle = (title: string) => {
    checkPage(40);
    doc.fillColor(EMBER).font('Helvetica-Bold').fontSize(8).text(title, margin, y);
    y += 7;
    doc.moveTo(margin, y).lineTo(W - margin, y).strokeColor(EMBER).lineWidth(1.1);
    y += S.gapLabel + 4;
  };

  const field = (label: string, value: string, x: number, yy: number, width: number) => {
    doc.fillColor(MUTED).font('Helvetica').fontSize(7).text(label.toUpperCase(), x, yy, { width, lineBreak: false });
    // Los VALORES de texto pueden envolver dentro de su columna (min-width:0),
    // pero sin invadir la columna contigua: altura máxima 2 líneas
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10.5).text(value || '—', x, yy + S.gapLabel, {
      width,
      height: 24,
      ellipsis: true,
    });
  };

  // ── HEADER (banda morada, logo naranja, línea acento) ──
  doc.rect(0, 0, W, 100).fill(VOID);
  doc.rect(0, 96, W, 4).fill(EMBER);
  // Logo RR
  doc.roundedRect(margin, 26, 46, 46, 11).fill(EMBER);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22).text('RR', margin, 37, { width: 46, align: 'center' });
  // Título + empresa
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(19).text('CUENTA DE COBRO', margin + 62, 28);
  doc.fillColor('#f5ede1').font('Helvetica').fontSize(9).text('RR ALIADOS S.A.S. · NIT 902.036.366', margin + 62, 56);
  // Número + versión (derecha, alineados al mismo eje)
  doc.fillColor('#f5ede1').font('Helvetica-Bold').fontSize(11).text(payload.numero || 'BORRADOR', W - margin - 180, 30, { width: 180, align: 'right', lineBreak: false });
  doc.fillColor(ASH).font('Helvetica').fontSize(8).text(`Versión ${payload.version || 1}`, W - margin - 180, 48, { width: 180, align: 'right', lineBreak: false });

  y = 126;

  // ── DATOS DEL COLABORADOR (grid 2 columnas equilibradas) ──
  sectionTitle('DATOS DEL COLABORADOR');
  const colGap = 24;
  const colW = (contentW - colGap) / 2;
  const col2X = margin + colW + colGap;

  const filasColaborador: [string, string, string, string][] = [
    ['Nombre del colaborador', payload.persona.nombre || '—', 'Documento / C.C.', payload.persona.documento || 'Pendiente'],
    ['Correo electrónico', payload.persona.correo || '—', 'Teléfono', payload.persona.telefono || '—'],
    ['Banco', payload.persona.banco || '—', 'Cuenta', `${payload.persona.tipoCuenta ? payload.persona.tipoCuenta + ' ' : ''}${payload.persona.numeroCuenta || '—'}`],
  ];
  filasColaborador.forEach(([l1, v1, l2, v2]) => {
    field(l1, v1, margin, y, colW);
    field(l2, v2, col2X, y, colW);
    y += S.rowH;
  });
  y += S.gapGroup;

  // ── DETALLE DEL SERVICIO (periodo + proyecto con aire) ──
  sectionTitle('DETALLE DEL SERVICIO');
  field('Periodo', payload.periodo || '—', margin, y, colW);
  field('Proyecto', payload.proyecto || 'Operación general', col2X, y, colW);
  y += S.rowH + 12;

  // ── TABLA DE CONCEPTOS ──
  // Proporciones: CONCEPTO 58% · CANT 10% · PRECIO 15% · SUBTOTAL 17%
  const cw = contentW;
  const colConcepto = cw * 0.58;
  const colCant = cw * 0.10;
  const colPrecio = cw * 0.15;
  const colSubtotal = cw - colConcepto - colCant - colPrecio; // ≈17%
  const xConcepto = margin;
  const xCant = margin + colConcepto;
  const xPrecio = xCant + colCant;
  const xSub = xPrecio + colPrecio;
  const rightW = (colCant + colPrecio + colSubtotal) - 0; // ancho disponible a la derecha del concepto

  // Encabezado
  doc.rect(margin, y, cw, S.tableHeadH).fill(VOID);
  doc.fillColor('#f5ede1').font('Helvetica-Bold').fontSize(7.5);
  doc.text('CONCEPTO', xConcepto + 12, y + 7, { width: colConcepto - 16, lineBreak: false });
  doc.text('CANT', xCant, y + 7, { width: colCant, align: 'center', lineBreak: false });
  doc.text('PRECIO', xPrecio, y + 7, { width: colPrecio - 8, align: 'right', lineBreak: false });
  doc.text('SUBTOTAL', xSub, y + 7, { width: colSubtotal - 8, align: 'right', lineBreak: false });
  y += S.tableHeadH;

  const lineas = (payload.lineas && payload.lineas.length) ? payload.lineas : [{ concepto: payload.concepto || '—', cantidad: 1, precio: payload.monto || 0 }];
  const totalLineas = lineas.reduce((s, l) => s + (l.cantidad || 0) * (l.precio || 0), 0);

  lineas.forEach((l, i) => {
    checkPage(S.tableRowH + 40);
    const bg = i % 2 === 0 ? BG_SOFT : WHITE;
    doc.rect(margin, y, cw, S.tableRowH).fill(bg);
    // Concepto: puede ocupar 2 líneas, pero el texto se corta con ellipsis si es excesivo
    const conceptoStr = String(l.concepto || '—');
    doc.fillColor(INK).font('Helvetica').fontSize(9);
    doc.text(conceptoStr, xConcepto + 12, y + 7, { width: colConcepto - 18, height: S.tableRowH - 4, ellipsis: true, lineBreak: false });
    // Cantidad: nowrap, centrado
    doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(String(l.cantidad ?? 1), xCant, y + 7, { width: colCant, align: 'center', lineBreak: false });
    // Precio: nowrap, derecha, tabular
    doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(COP.format(l.precio || 0), xPrecio, y + 7, { width: colPrecio - 8, align: 'right', lineBreak: false });
    // Subtotal: nowrap, derecha
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5).text(COP.format((l.cantidad || 0) * (l.precio || 0)), xSub, y + 7, { width: colSubtotal - 8, align: 'right', lineBreak: false });
    y += S.tableRowH;
  });

  // ── FILA TOTAL A COBRAR (flex: espacio entre, sin wrap, reserva para cifras grandes) ──
  checkPage(S.totalH + 40);
  doc.rect(margin, y, cw, S.totalH).fill(PARCHMENT);
  doc.rect(margin, y, 4, S.totalH).fill(EMBER);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('TOTAL A COBRAR', margin + 16, y + 10, { width: cw - 220, lineBreak: false });
  // Valor: ancho generoso (hasta $125.000.000), flex-shrink 0, sin wrap
  doc.fillColor(VOID).font('Helvetica-Bold').fontSize(16).text(
    COP.format(payload.monto != null ? payload.monto : totalLineas),
    margin + cw - 170, y + 7,
    { width: 154, align: 'right', lineBreak: false }
  );
  y += S.totalH + S.gapGroup;

  // ── DECLARACIÓN DE NO SUBCONTRATACIÓN (solo contenido, altura = texto + padding) ──
  if (payload.declaracionNoSubcontratacion) {
    checkPage(100);
    const declText = payload.declaracionTexto || 'Declaro bajo la gravedad de juramento que los servicios relacionados en la presente cuenta de cobro fueron prestados personalmente por mí, de manera directa y sin haber subcontratado, cedido ni delegado la ejecución de los mismos a terceros. Manifiesto que no existe relación laboral con el pagador y asumo la responsabilidad por los aportes a seguridad social y parafiscales.';
    const padX = 16;
    const padTop = 12;
    const padBottom = 12;
    const innerW = cw - padX * 2;
    const titleH = 15;
    const lineGap = (S.declLH - 1) * 6;
    // Altura = padding superior + título + texto (con line-height) + padding inferior
    const bodyH = doc.heightOfString(declText, { width: innerW, lineGap });
    const boxH = padTop + titleH + bodyH + padBottom;

    doc.rect(margin, y, cw, boxH).fill(BG_SOFT); // fondo suave (sin borde naranja)
    doc.fillColor(EMBER).font('Helvetica-Bold').fontSize(7.5).text('DECLARACIÓN DE NO SUBCONTRATACIÓN', margin + padX, y + padTop);
    doc.fillColor(INK).font('Helvetica').fontSize(7.5).text(declText, margin + padX, y + padTop + titleH, { width: innerW, lineGap });
    y += boxH;
  }

  // ── FIRMAS (bloque independiente, en flujo normal, altura controlada) ──
  const firmaColW = (contentW - 60) / 2;
  const repX = margin + firmaColW + 60;

  // Espacio disponible para firmas: entre el fin del contenido y el footer
  // (footer ocupa desde H-66 hacia abajo). La zona de firmas mide ~96pt.
  const footerTop = H - 66;             // tope del footer (texto generado)
  const maxFirmaTop = footerTop - 100;  // firmas no pueden empezar más abajo que esto
  const firmaTop = Math.min(y + 32, maxFirmaTop); // en flujo, con 32px de separación
  const sigAreaH = 50;                  // zona reservada para la firma digital
  const sigLineY = firmaTop + 16 + sigAreaH + 6; // línea a la misma altura en ambas columnas

  // Colaborador (columna izquierda) — meta arriba, zona vacía, línea abajo
  doc.fillColor(VOID).font('Helvetica-Bold').fontSize(9).text('EL COLABORADOR', margin, firmaTop);
  doc.fillColor(MUTED).font('Helvetica').fontSize(7.5).text(
    `${payload.persona.nombre || '—'}  ·  C.C. ${payload.persona.documento || 'Pendiente'}`,
    margin, firmaTop + 14, { width: firmaColW, lineBreak: false }
  );
  doc.moveTo(margin, sigLineY).lineTo(margin + firmaColW, sigLineY).strokeColor('#b8b8b8').lineWidth(0.8);
  doc.fillColor(MUTED).font('Helvetica').fontSize(7).text('Firma del colaborador', margin, sigLineY + 4, { width: firmaColW, align: 'center', lineBreak: false });

  // Representante legal (columna derecha) — firma digital contenida encima de la línea
  doc.fillColor(VOID).font('Helvetica-Bold').fontSize(9).text('REPRESENTANTE LEGAL', repX, firmaTop);
  doc.fillColor(MUTED).font('Helvetica').fontSize(7.5).text('RR ALIADOS S.A.S.', repX, firmaTop + 14, { width: firmaColW, lineBreak: false });
  if (firmaPath) {
    try {
      // Firma contenida: máx 170×48, anclada al fondo del área (2-5px sobre la línea)
      const imgH = Math.min(48, sigAreaH - 4);
      doc.image(firmaPath, repX + (firmaColW - 170) / 2, sigLineY - imgH - 3, { width: 170, height: imgH, fit: [170, imgH] });
    } catch { /* sin imagen */ }
  }
  doc.moveTo(repX, sigLineY).lineTo(repX + firmaColW, sigLineY).strokeColor('#b8b8b8').lineWidth(0.8);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5).text('Santiago Rosas Ríos', repX, sigLineY + 4, { width: firmaColW, align: 'center', lineBreak: false });

  // ── FOOTER (con aire: firmas → 30-40px → texto → 10-14px → franja) ──
  const genTextY = H - 58;
  doc.fillColor(MUTED).font('Helvetica').fontSize(6.5).text(
    `Documento generado el ${payload.fecha || ''} por el sistema de finanzas RR Aliados · Verifique identidad y datos bancarios antes de emitir`,
    margin, genTextY, { width: contentW, align: 'center', lineBreak: false }
  );
  doc.rect(0, H - 24, W, 24).fill(VOID);
  doc.rect(0, H - 24, W, 3).fill(EMBER);
  doc.fillColor(ASH).font('Helvetica').fontSize(6.5).text('RR ALIADOS S.A.S. · NIT 902.036.366 · Finanzas & Operación', 0, H - 16, { width: W, align: 'center', lineBreak: false });

  doc.end();
  await new Promise<void>((resolve) => {
    writeBuf.on('finish', () => resolve());
  });
  return Buffer.concat(chunks);
}

// La firma vive en public/ del repo. En serverless, probar varias rutas.
function resolveFirmaPath(): string | null {
  const fs = require('fs') as typeof import('fs');
  const candidates = [
    path.join(process.cwd(), 'public', 'firma-rr.png'),
    path.join(process.cwd(), 'firma-rr.png'),
    path.join('/var/task', 'public', 'firma-rr.png'),
    path.join('/var/task', 'firma-rr.png'),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch { /* sigue */ }
  }
  return null;
}

export function nextCuentaNumero(count: number, fecha = new Date()) {
  const y = fecha.getFullYear();
  return `RR-CC-${y}-${String(count + 1).padStart(4, '0')}`;
}
