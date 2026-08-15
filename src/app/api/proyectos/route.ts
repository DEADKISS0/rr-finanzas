import { NextRequest, NextResponse } from 'next/server';
import { getProyectos, addProyecto, updateProyecto, deleteProyecto } from '@/lib/db';
import { Proyecto, EstadoProyecto } from '@/lib/types';

export async function GET() {
  try {
    const proyectos = await getProyectos();
    return NextResponse.json(proyectos);
  } catch (error) {
    console.error('Error getting proyectos:', error);
    return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const proyecto: Proyecto = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nombre: body.nombre || '',
      cliente: body.cliente || '',
      estado: (body.estado as EstadoProyecto) || 'planificacion',
      valor_total: Number(body.valor_total) || 0,
      valor_pagado: Number(body.valor_pagado) || 0,
      fecha_inicio: body.fecha_inicio || new Date().toISOString().split('T')[0],
      fecha_fin_estimada: body.fecha_fin_estimada || '',
      descripcion: body.descripcion || '',
      servicios: body.servicios || [],
      notas: body.notas || '',
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };

    const result = await addProyecto(proyecto);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating proyecto:', error);
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const result = await updateProyecto(id, updates);
    if (!result) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating proyecto:', error);
    return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const result = await deleteProyecto(id);
    if (!result) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proyecto:', error);
    return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 });
  }
}