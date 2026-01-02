import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { propertyDetails } = await request.json();

    if (!propertyDetails || typeof propertyDetails !== 'string') {
      return NextResponse.json({ error: 'Missing propertyDetails in request body' }, { status: 400 });
    }

    const details = propertyDetails.trim();
    const sentences = [];
    const lead = details.split(/[\.\!\?\n]/)[0];
    sentences.push(`${lead || 'Beautiful property'} — an exceptional listing in Kenya.`);
    if (details.length > 40) {
      sentences.push(`Featuring: ${details}.`);
    }
    sentences.push('This property offers great value, excellent location, and attractive amenities for buyers and investors.');
    sentences.push('Contact the seller for viewing arrangements and more information.');

    const description = sentences.join(' ');
    return NextResponse.json({ description });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error generating description:', err);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
