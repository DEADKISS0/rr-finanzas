import { NextResponse } from 'next/server';
import { FinanzasData } from '@/lib/excel-parser';

// In-memory storage for demo (replace with Vercel KV in production)
let cachedData: FinanzasData | null = null;

export async function GET() {
  if (!cachedData) {
    return NextResponse.json(
      { error: 'No data available. Upload an Excel file first.' },
      { status: 404 }
    );
  }

  return NextResponse.json(cachedData);
}

// Allow setting data from upload route
export function setData(data: FinanzasData) {
  cachedData = data;
}