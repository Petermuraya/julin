import { NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export async function GET() {
  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }
  return NextResponse.json({ token: MAPBOX_TOKEN });
}
