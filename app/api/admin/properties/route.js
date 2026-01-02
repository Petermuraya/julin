import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServerClient';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let images = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const files = form.getAll('files');

      if (files.length > 0) {
        images = [];
        for (const file of files) {
          // file is a File/Blob
          const buffer = Buffer.from(await file.arrayBuffer());
          const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
          const { error: uploadErr } = await supabaseServer.storage.from('properties').upload(filename, buffer, {
            contentType: file.type,
            upsert: false,
          });
          if (uploadErr) {
            // eslint-disable-next-line no-console
            console.error('Upload error', uploadErr);
            return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
          }
          const { data: urlData } = supabaseServer.storage.from('properties').getPublicUrl(filename);
          images.push(urlData?.publicUrl || filename);
        }
      }
    } else {
      const body = await request.json().catch(() => ({}));
      if (body.images) images = body.images;
    }

    const body = await (async () => {
      try {
        if (contentType.includes('multipart/form-data')) {
          const form = await request.formData();
          const obj = {};
          for (const [key, value] of form.entries()) {
            if (key === 'files') continue;
            obj[key] = value;
          }
          return obj;
        }
        return await request.json();
      } catch (e) {
        return {};
      }
    })();

    const payload = {
      title: body.title,
      description: body.description || null,
      property_type: body.property_type || 'plot',
      price: Number(body.price || 0),
      location: body.location || '',
      images,
      seller_name: body.seller_name || null,
      seller_phone: body.seller_phone || null,
      is_admin_property: true,
      approved_at: new Date().toISOString(),
      status: 'available',
    };

    const { data, error } = await supabaseServer.from('properties').insert([payload]).select().single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Insert error', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ property: data });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
