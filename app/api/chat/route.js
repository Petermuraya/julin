import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '../../../../lib/supabaseServerClient';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function extractLocalPartFromEmail(email) {
  if (!email) return null;
  const local = String(email).split('@')[0] || '';
  const beforePlus = local.split('+')[0];
  const firstSegment = beforePlus.split('.')[0];
  const cleaned = firstSegment.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleaned) return null;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getDisplayName(user_info) {
  if (user_info?.name && String(user_info.name).trim()) {
    const first = String(user_info.name).trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  const fromEmail = extractLocalPartFromEmail(user_info?.email);
  if (fromEmail) return fromEmail;
  return 'Visitor';
}

function getTimeGreeting(timezone = 'Africa/Nairobi') {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === 'hour')?.value;
    const hour = hourPart ? parseInt(hourPart, 10) : new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  } catch {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
}

function isGreeting(message) {
  if (!message) return false;
  const m = message.toLowerCase().replace(/[!.,?]/g, '').trim();
  const greetings = ['hi', 'hello', 'hey', 'hiya', 'good morning', 'good afternoon', 'good evening', 'morning', 'afternoon', 'evening'];
  for (const g of greetings) {
    if (m === g) return true;
    if (m.startsWith(g + ' ') || m.includes(g + ' ')) return true;
  }
  return false;
}

function findRelevantProperties(message, properties) {
  const msg = message.toLowerCase();
  return properties.filter((p) => {
    const title = (p.title || '').toLowerCase();
    const location = (p.location || '').toLowerCase();
    const type = (p.property_type || '').toLowerCase();
    const county = (p.county || '').toLowerCase();

    const titleMatch = title.includes(msg) || msg.includes(title);
    const locationMatch = location.includes(msg) || msg.includes(location);
    const typeMatch = type.includes(msg) || msg.includes(type);
    const countyMatch = county.includes(msg) || msg.includes(county);

    const priceMatch = msg.match(/(\d+)\s*(million|m|k)/i);
    let budgetMatch = false;
    if (priceMatch && typeof p.price === 'number') {
      const amount = parseInt(priceMatch[1], 10);
      const unit = priceMatch[2].toLowerCase();
      const budget = unit.startsWith('m') ? amount * 1_000_000 : amount * 1_000;
      budgetMatch = (p.price || 0) <= budget * 1.2;
    }

    return titleMatch || locationMatch || typeMatch || countyMatch || budgetMatch;
  }).slice(0, 5);
}

function generateSimpleResponse(message, properties, userRole, userInfo) {
  const msg = message.toLowerCase();
  const isAdmin = userRole === 'admin';
  const displayName = getDisplayName(userInfo);
  const timeGreeting = getTimeGreeting();

  if (isAdmin) {
    if (msg.includes('admin help')) return "Admin Commands: 'stats', 'analytics', 'pending', 'inquiries', 'admin help'.";
    if (msg.includes('stats')) {
      const total = properties.length;
      const avg = total ? Math.round(properties.reduce((s, p) => s + (p.price || 0), 0) / total) : 0;
      return `Properties: ${total}. Average price: KES ${avg.toLocaleString()}.`;
    }
    if (msg.includes('hello') || msg.includes('hi')) return `${timeGreeting} ${displayName}! Admin assistant here.`;
  }

  if (msg.includes('hello') || msg.includes('hi')) return `${timeGreeting} ${displayName}! I can help you find properties in Kenya.`;
  if (msg.includes('contact') || msg.includes('phone') || msg.includes('call')) return 'Please tell me your preferred contact method (WhatsApp, phone, or email).';
  if (msg.includes('title') || msg.includes('deed') || msg.includes('verify')) {
    return 'To verify a title deed: request the original document, perform a Land Search, engage a licensed surveyor, and consult an advocate.';
  }

  if (properties.length === 0) return "I couldn't find any properties matching your criteria. Please try different criteria or contact us.";

  const matches = findRelevantProperties(message, properties);
  if (matches.length > 0) return `I found ${matches.length} properties that might interest you.`;
  return 'Please tell me what you\'re looking for (type, location, or budget).';
}

async function callOpenAI(messages, model = 'gpt-3.5-turbo', max_tokens = 500) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens }),
  });
  return resp;
}

export async function POST(request) {
  try {
    // CORS preflight handled by framework; implement OPTIONS if needed
    const body = await request.json().catch(() => ({}));

    const incomingMessages = Array.isArray(body.messages) ? body.messages : undefined;
    const message = String(body.message || (incomingMessages && incomingMessages.length ? incomingMessages[incomingMessages.length - 1].content : '') || '');
    const session_id = body.session_id;
    const user_info = body.user_info;
    const user_role = body.user_role;

    // Fetch properties for context
    const { data: propData, error: propErr } = await supabaseServer
      .from('properties')
      .select('id, title, location, price, property_type, size, bathrooms, description, images, county')
      .eq('status', 'available')
      .limit(50);

    if (propErr) {
      // eslint-disable-next-line no-console
      console.error('Supabase properties error:', propErr);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    const properties = propData || [];

    if (!process.env.OPENAI_API_KEY) {
      const reply = generateSimpleResponse(message, properties, user_role, user_info);
      const relevantProperties = findRelevantProperties(message, properties);
      return NextResponse.json({ reply, properties: relevantProperties, session_id });
    }

    const displayName = getDisplayName(user_info);
    const timeGreeting = getTimeGreeting();

    const landKnowledge = `Kenya land & property knowledge (guidance, not legal advice): common documents include Title Deed, Allotment Letter, Lease, Sale Agreement, PIN Certificate. Verification steps: request original documents, perform a Land Search at the Lands Registry, engage a licensed surveyor to confirm boundaries, and consult an advocate.`;

    const baseSystem = user_role === 'admin'
      ? `You are an advanced AI assistant for Julin Real Estate Hub administrators in Kenya. Current admin user: ${displayName} (${user_info?.phone || 'No phone'})`
      : `You are an intelligent AI assistant for Julin Real Estate Hub in Kenya. Current user: ${displayName} (${user_info?.phone || 'No phone'})`;

    const systemPrompt = `${baseSystem}\n\n${landKnowledge}\n\nAvailable properties:\n${properties.map(p => `- ${p.title} (${p.property_type}) in ${p.location}: KES ${Number(p.price || 0).toLocaleString()}${p.size ? `, ${p.size}` : ''}. ${p.description || ''}`).join('\n') || 'No properties available'}`;

    const messagesForAI = [{ role: 'system', content: systemPrompt }];

    messagesForAI.push(
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello! Welcome to Julin Real Estate. I can help you find properties, explain land terms, or connect you to our team. How can I assist you today?' },
      { role: 'user', content: 'How do I verify a title deed for a plot in Nairobi?' },
      { role: 'assistant', content: 'Request the original Title Deed, perform a Land Search at the Lands Registry, engage a licensed surveyor, and consult an advocate.' }
    );

    if (incomingMessages && incomingMessages.length > 0) {
      const recent = incomingMessages.slice(-10);
      for (const m of recent) {
        const role = String(m.role || 'user').toLowerCase();
        const content = String(m.content || '');
        if (content.trim()) messagesForAI.push({ role, content: content.slice(0, 2000) });
      }
    } else {
      messagesForAI.push({ role: 'user', content: message });
    }

    const openaiResp = await callOpenAI(messagesForAI, 'gpt-3.5-turbo', 500).catch((e) => {
      console.warn('OpenAI call failed:', e);
      return null;
    });

    if (!openaiResp || !openaiResp.ok) {
      const fallback = generateSimpleResponse(message, properties, user_role, user_info);
      const relevantProperties = findRelevantProperties(message, properties);
      return NextResponse.json({ reply: fallback, properties: relevantProperties, session_id });
    }

    const aiData = await openaiResp.json().catch(() => ({}));
    const aiReply = aiData?.choices?.[0]?.message?.content || aiData?.choices?.[0]?.text || "I couldn't generate a response.";

    let firstMessage = false;
    if (session_id) {
      try {
        const { data: existing } = await supabaseServer.from('chat_messages').select('id').eq('session_id', session_id).limit(1);
        firstMessage = !(existing && existing.length > 0);
      } catch {
        firstMessage = false;
      }
    }

    let finalReply = aiReply;
    if (displayName && displayName !== 'Visitor' && isGreeting(message) && firstMessage) {
      finalReply = `${timeGreeting} ${displayName}! ${aiReply}`;
    }

    const relevantProperties = findRelevantProperties(message, properties);
    return NextResponse.json({ reply: finalReply, properties: relevantProperties, session_id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('chat API error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
