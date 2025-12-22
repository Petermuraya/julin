import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 6 } });
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
      .select('id, title, location, price, property_type, size, bathrooms, description, images, county, seller_name, seller_phone, status, created_at')
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

// GET /api/chats
// Returns list of chat sessions (from chat_conversations if available, else derive from messages)
app.get('/api/chats', async (req, res) => {
  try {
    // Try to read conversations table first
    const { data: convs, error: convErr } = await supabase.from('chat_conversations').select('*').order('started_at', { ascending: false }).limit(200);
    if (!convErr && Array.isArray(convs) && convs.length > 0) {
      return res.json({ conversations: convs });
    }

    // Fallback: derive sessions from messages
    const { data, error } = await supabase.rpc('get_chat_sessions', {});
    if (error) {
      // If RPC not available, fallback to a raw query
      const { data: msgs, error: e2 } = await supabase.from('chat_messages').select('session_id, max(created_at) as last_at').group('session_id').order('last_at', { ascending: false }).limit(200);
      if (e2) return res.status(500).json({ error: e2.message || e2 });
      return res.json({ sessions: msgs });
    }
    return res.json({ sessions: data });
  } catch (err) {
    console.error('GET /api/chats error', err);
    return res.status(500).json({ error: 'Failed to list chat sessions' });
  }
});

// GET /api/chats/:session_id
// Returns all messages for a given session_id
app.get('/api/chats/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

    const { data, error } = await supabase.from('chat_messages').select('*').eq('session_id', session_id).order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching messages', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json({ messages: data || [] });
  } catch (err) {
    console.error('GET /api/chats/:session_id error', err);
    return res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// POST /api/generate-description
// Lightweight fallback generator when AI gateway / OpenAI is not configured.
app.post('/api/generate-description', async (req, res) => {
  try {
    const { propertyDetails } = req.body || {};

    if (!propertyDetails || typeof propertyDetails !== 'string') {
      return res.status(400).json({ error: 'Missing propertyDetails in request body' });
    }

    const details = propertyDetails.trim();

    // Simple heuristics to create a friendly, SEO-aware description
    const sentences = [];

    // Title/lead
    const lead = details.split(/[\.\!\?\n]/)[0];
    sentences.push(`${lead || 'Beautiful property'} — an exceptional listing in Kenya.`);

    // Add more details if present
    if (details.length > 40) {
      sentences.push(`Featuring: ${details}.`);
    }

    // Add selling points and call-to-action
    sentences.push('This property offers great value, excellent location, and attractive amenities for buyers and investors.');
    sentences.push('Contact the seller for viewing arrangements and more information.');

    const description = sentences.join(' ');

    return res.json({ description });
  } catch (err) {
    console.error('Error generating description:', err);
    return res.status(500).json({ error: 'Failed to generate description' });
  }
});

// POST /api/chat/conversations
// Proxy endpoint to create/upsert a conversation using the service role key
app.post('/api/chat/conversations', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'Invalid payload' });

    // Ensure on_conflict behavior by using upsert
    const { data, error } = await supabase.from('chat_conversations').upsert([payload], { onConflict: 'conversation_id' }).select();
    if (error) {
      console.error('Server upsert conversation error', error);
      return res.status(500).json({ error: error.message || error });
    }
    return res.json({ result: data || null });
  } catch (err) {
    console.error('POST /api/chat/conversations error', err);
    return res.status(500).json({ error: 'Failed to upsert conversation' });
  }
});

// POST /api/chat/messages
// Proxy endpoint to insert chat messages using the service role key
app.post('/api/chat/messages', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'Invalid payload' });

    const { data, error } = await supabase.from('chat_messages').insert([payload]).select();
    if (error) {
      console.error('Server insert message error', error);
      return res.status(500).json({ error: error.message || error });
    }
    return res.json({ result: data || null });
  } catch (err) {
    console.error('POST /api/chat/messages error', err);
    return res.status(500).json({ error: 'Failed to insert chat message' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Admin upload server listening on http://localhost:${port}`);
});
