import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { saveProyectos, saveMovimientos, savePagos } from '@/lib/db';
import { Proyecto, Movimiento, PagoProgramado, EstadoProyecto, TipoMovimiento, CategoriaMovimiento, EstadoPago } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const now = new Date().toISOString();

    // Import Proyectos
    const proyectosWs = wb.Sheets['Proyectos'] || wb.Sheets['proyectos'];
    const proyectos: Proyecto[] = [];
    if (proyectosWs) {
      const rows = XLSX.utils.sheet_to_json(proyectosWs) as Record<string, unknown>[];
      rows.forEach((row) => {
        proyectos.push({
          id: String(row['ID'] || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
          nombre: String(row['Nombre'] || row['nombre'] || ''),
          cliente: String(row['Cliente'] || row['cliente'] || ''),
          estado: (row['Estado'] || row['estado'] || 'activo') as EstadoProyecto,
          valor_total: Number(row['Valor Total'] || row['valor_total'] || 0),
          valor_pagado: Number(row['Valor Pagado'] || row['valor_pagado'] || 0),
          fecha_inicio: String(row['Fecha Inicio'] || row['fecha_inicio'] || now.split('T')[0]),
          fecha_fin_estimada: String(row['Fecha Fin Estimada'] || row['fecha_fin_estimada'] || ''),
          descripcion: String(row['Descripción'] || row['descripcion'] || ''),
          servicios: String(row['Servicios'] || row['servicios'] || '').split(',').map(s => s.trim()).filter(Boolean),
          notas: String(row['Notas'] || row['notas'] || ''),
          creado_en: now,
          actualizado_en: now,
        });
      });
    }

    // Import Movimientos
    const movimientosWs = wb.Sheets['Movimientos'] || wb.Sheets['movimientos'];
    const movimientos: Movimiento[] = [];
    if (movimientosWs) {
      const rows = XLSX.utils.sheet_to_json(movimientosWs) as Record<string, unknown>[];
      rows.forEach((row) => {
        movimientos.push({
          id: String(row['ID'] || `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
          proyecto_id: String(row['Proyecto ID'] || row['proyecto_id'] || ''),
          tipo: (row['Tipo'] || row['tipo'] || 'egreso') as TipoMovimiento,
          concepto: String(row['Concepto'] || row['concepto'] || ''),
          monto: Number(row['Monto'] || row['monto'] || 0),
          fecha: String(row['Fecha'] || row['fecha'] || now.split('T')[0]),
          categoria: (row['Categoría'] || row['categoria'] || 'otros') as CategoriaMovimiento,
          registrado_por: String(row['Registrado Por'] || row['registrado_por'] || 'Santiago'),
          evidencia: String(row['Evidencia'] || row['evidencia'] || ''),
          notas: String(row['Notas'] || row['notas'] || ''),
          creado_en: now,
        });
      });
    }

    // Import Pagos
    const pagosWs = wb.Sheets['Pagos Programados'] || wb.Sheets['pagos'];
    const pagos: PagoProgramado[] = [];
    if (pagosWs) {
      const rows = XLSX.utils.sheet_to_json(pagosWs) as Record<string, unknown>[];
      rows.forEach((row) => {
        pagos.push({
          id: String(row['ID'] || `pago_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
          proyecto_id: String(row['Proyecto ID'] || row['proyecto_id'] || ''),
          movimiento_id: String(row['Movimiento ID'] || row['movimiento_id'] || ''),
          concepto: String(row['Concepto'] || row['concepto'] || ''),
          monto: Number(row['Monto'] || row['monto'] || 0),
          fecha_programada: String(row['Fecha Programada'] || row['fecha_programada'] || now.split('T')[0]),
          fecha_pagada: String(row['Fecha Pagada'] || row['fecha_pagada'] || '') || null,
          estado: (row['Estado'] || row['estado'] || 'pendiente') as EstadoPago,
          responsable: String(row['Responsable'] || row['responsable'] || ''),
          notas: String(row['Notas'] || row['notas'] || ''),
          creado_en: now,
        });
      });
    }

    // Save to database
    if (proyectos.length > 0) await saveProyectos(proyectos);
    if (movimientos.length > 0) await saveMovimientos(movimientos);
    if (pagos.length > 0) await savePagos(pagos);

    return NextResponse.json({
      success: true,
      imported: {
        proyectos: proyectos.length,
        movimientos: movimientos.length,
        pagos: pagos.length,
      },
    });
  } catch (error) {
    console.error('Error importing:', error);
    return NextResponse.json({ error: 'Error al importar' }, { status: 500 });
  }
}