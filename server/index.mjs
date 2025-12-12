import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// GET /api/properties
// Proxy endpoint to fetch available properties (avoids CORS issues)
app.get('/api/properties', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ properties: data || [] });
  } catch (err) {
    console.error('Error fetching properties:', err);
    return res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// POST /admin/properties
// Accepts either JSON body with `images` as array of urls, or multipart/form-data with files + fields.
app.post('/admin/properties', upload.array('files'), async (req, res) => {
  try {
    const files = req.files || [];
    // fields may be in JSON body or form fields
    const body = req.body || {};

    // If content-type is multipart, multer stores text fields in req.body as strings
    // Build payload fields
    const title = body.title;
    const description = body.description || null;
    const property_type = body.property_type || 'plot';
    const price = Number(body.price || 0);
    const location = body.location || '';
    const seller_name = body.seller_name || null;
    const seller_phone = body.seller_phone || null;

    let images = null;

    // Validation: limit files, size and types
    const MAX_FILES = 6;
    const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (files.length > 0) {
      if (files.length > MAX_FILES) {
        return res.status(400).json({ error: `Too many files. Maximum is ${MAX_FILES}.` });
      }
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
          return res.status(400).json({ error: `Invalid file type: ${file.originalname}` });
        }
        if (file.size > MAX_FILE_BYTES) {
          return res.status(400).json({ error: `File too large: ${file.originalname}. Max size is ${MAX_FILE_BYTES} bytes.` });
        }
      }
      images = [];
      for (const file of files) {
        // file is Buffer in memory
        const filename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
        const { error: uploadErr } = await supabase.storage.from('properties').upload(filename, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
        if (uploadErr) {
          console.error('Upload error', uploadErr);
          return res.status(500).json({ error: 'Failed to upload file' });
        }
        const { data: urlData } = supabase.storage.from('properties').getPublicUrl(filename);
        images.push(urlData?.publicUrl || filename);
      }
    } else if (body.images) {
      // images provided as JSON string or comma-separated
      try {
        images = typeof body.images === 'string' ? JSON.parse(body.images) : body.images;
      } catch (err) {
        // fallback to comma-separated
        images = typeof body.images === 'string' ? body.images.split(',').map(s => s.trim()).filter(Boolean) : null;
      }
    }

    const payload = {
      title,
      description,
      property_type,
      price,
      location,
      images,
      seller_name,
      seller_phone,
      is_admin_property: true,
      approved_at: new Date().toISOString(),
      status: 'available',
    };

    const { data, error } = await supabase.from('properties').insert([payload]).select().single();
    if (error) {
      console.error('Insert error', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json({ property: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Admin upload server listening on http://localhost:${port}`);
});
