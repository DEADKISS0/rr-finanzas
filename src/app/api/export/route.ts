import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getProyectos, getMovimientos, getPagos } from '@/lib/db';

export async function GET() {
  try {
    const [proyectos, movimientos, pagos] = await Promise.all([
      getProyectos(),
      getMovimientos(),
      getPagos(),
    ]);

    const wb = XLSX.utils.book_new();

    // Sheet: Proyectos
    const proyectosData = proyectos.map(p => ({
      'ID': p.id,
      'Nombre': p.nombre,
      'Cliente': p.cliente,
      'Estado': p.estado,
      'Valor Total': p.valor_total,
      'Valor Pagado': p.valor_pagado,
      'Pendiente': p.valor_total - p.valor_pagado,
      'Fecha Inicio': p.fecha_inicio,
      'Fecha Fin Estimada': p.fecha_fin_estimada,
      'Descripción': p.descripcion,
      'Servicios': p.servicios.join(', '),
      'Notas': p.notas,
    }));
    const wsProyectos = XLSX.utils.json_to_sheet(proyectosData);
    XLSX.utils.book_append_sheet(wb, wsProyectos, 'Proyectos');

    // Sheet: Movimientos
    const movimientosData = movimientos.map(m => ({
      'ID': m.id,
      'Proyecto ID': m.proyecto_id,
      'Tipo': m.tipo,
      'Concepto': m.concepto,
      'Monto': m.monto,
      'Fecha': m.fecha,
      'Categoría': m.categoria,
      'Registrado Por': m.registrado_por,
      'Evidencia': m.evidencia,
      'Notas': m.notas,
    }));
    const wsMovimientos = XLSX.utils.json_to_sheet(movimientosData);
    XLSX.utils.book_append_sheet(wb, wsMovimientos, 'Movimientos');

    // Sheet: Pagos Programados
    const pagosData = pagos.map(p => ({
      'ID': p.id,
      'Proyecto ID': p.proyecto_id,
      'Concepto': p.concepto,
      'Monto': p.monto,
      'Fecha Programada': p.fecha_programada,
      'Fecha Pagada': p.fecha_pagada,
      'Estado': p.estado,
      'Responsable': p.responsable,
      'Notas': p.notas,
    }));
    const wsPagos = XLSX.utils.json_to_sheet(pagosData);
    XLSX.utils.book_append_sheet(wb, wsPagos, 'Pagos Programados');

    // Sheet: Resumen por Proyecto
    const resumenData = proyectos.map(p => {
      const movsProyecto = movimientos.filter(m => m.proyecto_id === p.id);
      const pagosProyecto = pagos.filter(pa => pa.proyecto_id === p.id);
      const ingresos = movsProyecto.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
      const egresos = movsProyecto.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);
      const pagosPend = pagosProyecto.filter(pa => pa.estado !== 'pagado').reduce((s, pa) => s + pa.monto, 0);
      
      return {
        'Proyecto': p.nombre,
        'Cliente': p.cliente,
        'Estado': p.estado,
        'Valor Total': p.valor_total,
        'Ingresos': ingresos,
        'Egresos': egresos,
        'Neto': ingresos - egresos,
        'Pagos Pendientes': pagosPend,
      };
    });
    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Sheet: Flujo de Caja
    const flujoData = movimientos
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((m, i, arr) => {
        const saldoAcumulado = arr.slice(0, i + 1).reduce((s, mov) => {
          return s + (mov.tipo === 'ingreso' ? mov.monto : -mov.monto);
        }, 0);
        return {
          'Fecha': m.fecha,
          'Tipo': m.tipo,
          'Concepto': m.concepto,
          'Monto': m.tipo === 'ingreso' ? m.monto : -m.monto,
          'Saldo': saldoAcumulado,
          'Categoría': m.categoria,
          'Proyecto': m.proyecto_id,
        };
      });
    const wsFlujo = XLSX.utils.json_to_sheet(flujoData);
    XLSX.utils.book_append_sheet(wb, wsFlujo, 'Flujo de Caja');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="RR_Finanzas_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting:', error);
    return NextResponse.json({ error: 'Error al exportar' }, { status: 500 });
  }
}