import { NextRequest, NextResponse } from 'next/server';
import { getMovimientos, addMovimiento, updateMovimiento, deleteMovimiento } from '@/lib/db';
import { Movimiento, TipoMovimiento, CategoriaMovimiento } from '@/lib/types';

export async function GET() {
  try {
    const movimientos = await getMovimientos();
    return NextResponse.json(movimientos);
  } catch (error) {
    console.error('Error getting movimientos:', error);
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const movimiento: Movimiento = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      proyecto_id: body.proyecto_id || null,
      tipo: (body.tipo as TipoMovimiento) || 'egreso',
      concepto: body.concepto || '',
      monto: Number(body.monto) || 0,
      fecha: body.fecha || new Date().toISOString().split('T')[0],
      categoria: (body.categoria as CategoriaMovimiento) || 'otros',
      registrado_por: body.registrado_por || 'Santiago',
      evidencia: body.evidencia || '',
      notas: body.notas || '',
      creado_en: new Date().toISOString(),
    };

    const result = await addMovimiento(movimiento);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating movimiento:', error);
    return NextResponse.json({ error: 'Error al crear movimiento' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const result = await updateMovimiento(id, updates);
    if (!result) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating movimiento:', error);
    return NextResponse.json({ error: 'Error al actualizar movimiento' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const result = await deleteMovimiento(id);
    if (!result) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting movimiento:', error);
    return NextResponse.json({ error: 'Error al eliminar movimiento' }, { status: 500 });
  }
}