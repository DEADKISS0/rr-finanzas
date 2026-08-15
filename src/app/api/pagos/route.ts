import { NextRequest, NextResponse } from 'next/server';
import { getPagos, addPago, updatePago, deletePago } from '@/lib/db';
import { PagoProgramado, EstadoPago } from '@/lib/types';

export async function GET() {
  try {
    const pagos = await getPagos();
    return NextResponse.json(pagos);
  } catch (error) {
    console.error('Error getting pagos:', error);
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const pago: PagoProgramado = {
      id: `pago_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      proyecto_id: body.proyecto_id || '',
      movimiento_id: body.movimiento_id || null,
      concepto: body.concepto || '',
      monto: Number(body.monto) || 0,
      fecha_programada: body.fecha_programada || new Date().toISOString().split('T')[0],
      fecha_pagada: body.fecha_pagada || null,
      estado: (body.estado as EstadoPago) || 'pendiente',
      responsable: body.responsable || '',
      notas: body.notas || '',
      creado_en: new Date().toISOString(),
    };

    const result = await addPago(pago);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating pago:', error);
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const result = await updatePago(id, updates);
    if (!result) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating pago:', error);
    return NextResponse.json({ error: 'Error al actualizar pago' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const result = await deletePago(id);
    if (!result) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pago:', error);
    return NextResponse.json({ error: 'Error al eliminar pago' }, { status: 500 });
  }
}