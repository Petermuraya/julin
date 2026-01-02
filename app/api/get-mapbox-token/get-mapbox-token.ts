import type { NextApiRequest, NextApiResponse } from 'next';

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!MAPBOX_TOKEN) {
    res.status(500).json({ error: 'Mapbox token not configured' });
    return;
  }
  res.status(200).json({ token: MAPBOX_TOKEN });
}
