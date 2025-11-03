import { NextResponse } from 'next/server';
import { getAllEarthquakes } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const date_end = searchParams.get('date_end') || undefined;
    
    if (!date) {
      return NextResponse.json(
        { error: 'date parametresi gerekli' },
        { status: 400 }
      );
    }
    
    const { earthquakes, status } = await getAllEarthquakes(date, date_end);
    
    return NextResponse.json({
      earthquakes,
      status,
      lastUpdate: new Date().toISOString(),
      count: earthquakes.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Veri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
