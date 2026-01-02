import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServerClient';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('properties')
      .select('id, title, location, price, property_type, size, bathrooms, description, images, county, seller_name, seller_phone, status, created_at')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message || error }, { status: 500 });

    return NextResponse.json({ properties: data || [] });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/properties error', err);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
