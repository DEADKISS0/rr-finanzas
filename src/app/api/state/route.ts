import { NextResponse } from 'next/server';
import { getFullState } from '@/lib/db';

export async function GET() {
  try {
    const state = await getFullState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('Error getting state:', error);
    return NextResponse.json({ error: 'Error al obtener estado' }, { status: 500 });
  }
}