import { NextRequest, NextResponse } from 'next/server';
import { parseExcel, FinanzasData } from '@/lib/excel-parser';

// In-memory storage for demo (replace with Vercel KV in production)
let cachedData: FinanzasData | null = null;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel
    const data = parseExcel(buffer);
    
    // Cache the data
    cachedData = data;

    return NextResponse.json({
      success: true,
      message: 'Excel file processed successfully',
      data: {
        generated_at: data.generated_at,
        sheets_count: data.metadata.sheets.length,
        total_rows: data.metadata.total_rows,
        sheets: data.metadata.sheets
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process Excel file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload an Excel file using POST',
    accepts: '.xlsx, .xls'
  });
}