import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Minimal Deno typings for this file (avoid global type errors in editors without Deno)
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Credentials": "false",
};

// Type definition for property data
type MiniProperty = {
  id?: string;
  title?: string;
  location?: string;
  price?: number;
  property_type?: string;
  bathrooms?: number | null;
  size?: string | null;
  description?: string | null;
  images?: string[] | null;
  county?: string | null;
};

// Type for request body
interface ChatRequestBody {
  message?: string;
  session_id?: string;
  conversation_id?: string;
  user_info?: { name?: string; phone?: string; email?: string };
  user_role?: string;
  conversation_history?: Array<{ role: string; content: string }>;
  type?: string;
  messages?: Array<{ role?: string; content?: string }>;
  isAdmin?: boolean;
  context?: string;
  title?: string;
  topic?: string;
  description?: string;
  property_type?: string;
  location?: string;
  price?: number;
}

// Helper: extract local part from email (before @)
function extractLocalPartFromEmail(email?: string): string | null {
  if (!email) return null;
  const local = String(email).split('@')[0] || '';
  // remove anything after + (tags), take first segment before dots, remove non-alphanum
  const beforePlus = local.split('+')[0];
  const firstSegment = beforePlus.split('.')[0];
  const cleaned = firstSegment.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleaned) return null;
  // Capitalize first letter for nicer display
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Helper: get display name from user_info (prefer name, fall back to email local part)
function getDisplayName(user_info?: { name?: string; phone?: string; email?: string }): string {
  if (user_info?.name && String(user_info.name).trim()) {
    // prefer first name if full name provided, capitalize
    const first = String(user_info.name).trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  const fromEmail = extractLocalPartFromEmail(user_info?.email);
  if (fromEmail) return fromEmail;
  return 'Admin';
}

// Helper: time-based greeting based on local server time
function getTimeGreeting(timezone = 'Africa/Nairobi'): string {
  try {
    // Use Intl to get hour in specified timezone
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).formatToParts(new Date());
    const hourPart = parts.find(p => p.type === 'hour')?.value;
    const hour = hourPart ? parseInt(hourPart, 10) : new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  } catch (e) {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
}

// Heuristic: detect if a message is a greeting
// Load greeting patterns from env or use defaults per locale
function loadGreetingPatterns(): Record<string, string[]> {
  const defaultPatterns: Record<string, string[]> = {
    en: ['hi', 'hello', 'hey', 'hiya', 'good morning', 'good afternoon', 'good evening', 'morning', 'afternoon', 'evening', 'greetings'],
  };

  const envJson = Deno.env.get('GREETING_PATTERNS_JSON');
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson) as Record<string, string[]>;
      return { ...defaultPatterns, ...parsed };
    } catch {
      return defaultPatterns;
    }
  }

  // allow selecting locale via GREETING_LOCALE
  const locale = Deno.env.get('GREETING_LOCALE') || 'en';
  return { [locale]: defaultPatterns[locale] || defaultPatterns['en'] };
}

const GREETING_PATTERNS = loadGreetingPatterns();

function isGreeting(message?: string, locale = Deno.env.get('GREETING_LOCALE') || 'en'): boolean {
  if (!message) return false;
  const m = message.toLowerCase().replace(/[!.,?]/g, '').trim();
  const greetings = GREETING_PATTERNS[locale] || GREETING_PATTERNS['en'] || [];
  for (const g of greetings) {
    if (m === g) return true;
    if (m.startsWith(g + ' ') || m.includes(g + ' ')) return true;
  }
  return false;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read raw request text for robust debugging (some clients or proxies may
    // send malformed JSON or alter the Content-Type). We log it and attempt
    // to parse it. If parsing fails, return a helpful 400 with the raw payload.
    let rawText = '';
    try {
      rawText = await req.text();
    } catch (e) {
      console.warn('Failed to read raw request text', e);
    }

    // Log headers and a truncated raw body to the function logs for debugging.
    try {
      const hdrs: Record<string, string> = {};
      for (const [k, v] of req.headers.entries()) hdrs[k] = String(v);
      console.info('[chat-function] incoming request headers:', hdrs);
      console.info('[chat-function] incoming raw body (truncated 200 chars):', (rawText || '').slice(0, 200));
    } catch {
      // swallow
    }

    let body: ChatRequestBody;
    try {
      body = rawText ? JSON.parse(rawText) as ChatRequestBody : {} as ChatRequestBody;
    } catch (parseErr) {
      console.error('Failed to parse JSON request body', { parseErr: String(parseErr), rawText: (rawText || '').slice(0, 2000) });
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', detail: String(parseErr), raw: (rawText || '').slice(0, 2000) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { message, session_id, conversation_id, user_info, user_role, conversation_history, type } = body;

    // Accept alternative top-level text fields used by some clients
    const bodyRec = body as unknown as Record<string, unknown>;
    const altContent = (typeof bodyRec['content'] === 'string' ? bodyRec['content'] : (typeof bodyRec['text'] === 'string' ? bodyRec['text'] : ''));
    const incomingMessages = body.messages;
    // Determine effective message: explicit message, last incoming message, or altContent
    let effectiveMessage = String(
      message || (Array.isArray(incomingMessages) && incomingMessages.length > 0 && incomingMessages[incomingMessages.length - 1].content) || altContent || ''
    );

    // Sanitize and enforce reasonable length to avoid abuse or huge payloads
    if (effectiveMessage.length > 2000) {
      effectiveMessage = effectiveMessage.slice(0, 2000);
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different request types
    if (type === 'blog_suggestion') {
      return handleBlogSuggestion(body, supabase);
    }

    if (type === 'generate_blog') {
      return handleGenerateBlog(body);
    }

    if (type === 'enhance_description') {
      return handleEnhanceDescription(body);
    }

    if (type === 'conversation_summary') {
      return handleConversationSummary(body, supabase);
    }

    // Default: chat message handling

    if (!effectiveMessage || effectiveMessage.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required. Provide `message` or `messages` array or `content`/`text` field." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all available properties for context
    const { data: allProperties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, location, price, property_type, size, bathrooms, description, images, county")
      .eq("status", "available")
      .limit(50);

    if (propertiesError) {
      console.error("Database error:", propertiesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch properties" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const properties = (allProperties || []) as MiniProperty[];

    // Check for AI API keys (Lovable gateway or OpenAI). If none, fallback to simple responses.
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!LOVABLE_API_KEY && !OPENAI_API_KEY) {
      // Fallback to simple property-based response without AI
      const reply = generateSimpleResponse(effectiveMessage, properties, body.user_role || user_role, user_info);
      const relevantProperties = findRelevantProperties(effectiveMessage, properties);
      
      return new Response(
        JSON.stringify({
          reply,
          properties: relevantProperties,
          session_id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI Gateway
    const isAdmin = Boolean(body.isAdmin) || user_role === 'admin';
    
    const landKnowledge = `Kenya land & property knowledge (useful guidance, not legal advice):
- Common land documents: Title Deed, Allotment Letter, Lease, Sale Agreement, PIN Certificate.
- Verification steps: request title document, perform a Land Search at the Lands Registry, confirm boundaries with a licensed surveyor, check for caveats/charges.
- Ownership types: Freehold (outright ownership), Leasehold (time-limited lease from landowner), Customary/community tenure.
- Practical checks: confirm rates and taxes with county, inspect the property physically, ask for original documents and recent search extracts, verify land rates and rent if applicable.
- When in doubt: recommend consulting a qualified advocate or licensed land surveyor and using official government records.`;

    const displayName = getDisplayName(user_info);
    const timeGreeting = getTimeGreeting();

const baseSystem = isAdmin 
      ? `You are Mary, a professional AI assistant for Julin Real Estate Hub administrators in Kenya.

Your name is Mary. Always introduce yourself as Mary when greeting users.

Current admin: ${displayName}${user_info?.phone ? ` (Phone: ${user_info.phone})` : ''}

Available properties in our database:
${properties.map(p =>
  `• ${p.title} | ${p.property_type} | ${p.location}${p.county ? `, ${p.county}` : ''} | KES ${Number(p.price).toLocaleString()}${p.size ? ` | ${p.size}` : ''}${p.description ? ` | ${p.description.slice(0, 100)}...` : ''}`
).join('\n') || 'No properties available'}

ADMIN CAPABILITIES:
• Property analytics, insights, and inventory management
• Customer inquiry tracking and lead management
• Market analysis and pricing recommendations
• Admin commands: 'admin help', 'stats', 'analytics'

RESPONSE STYLE:
• Be professional yet approachable
• Provide data-driven insights
• Offer actionable recommendations
• Reference specific properties when relevant`
      : `You are Mary, a friendly and knowledgeable AI property assistant for Julin Real Estate Hub in Kenya.

Your name is Mary. Always introduce yourself as Mary when greeting users.

Current user: ${displayName}${user_info?.phone ? ` (Phone: ${user_info.phone})` : ''}

Available properties:
${properties.map(p =>
  `• ${p.title} | ${p.property_type} | ${p.location}${p.county ? `, ${p.county}` : ''} | KES ${Number(p.price).toLocaleString()}${p.size ? ` | ${p.size}` : ''}`
).join('\n') || 'No properties available'}

YOUR ROLE:
• Help users find their perfect property based on budget, location, and preferences
• Answer questions about real estate in Kenya (buying process, documentation, areas)
• Provide honest, helpful guidance without legal advice
• Connect users with our team for viewings and negotiations

PERSONALITY & STYLE:
• Warm, friendly, and conversational - like chatting with a helpful friend
• Use the user's name (${displayName}) naturally in conversation
• Be enthusiastic about properties but honest about limitations
• Keep responses concise (2-4 sentences typically)
• Use emoji sparingly (1-2 max per message) to add warmth
• Ask clarifying questions to understand needs better
• Always offer next steps or additional help

IMPORTANT:
• Never claim to be an admin or have admin privileges
• Always address the user by their name: ${displayName}
• If asked about something you don't know, be honest and offer to connect them with our team`;

    const systemPrompt = `${baseSystem}\n\n${landKnowledge}`;

    // Build messages for AI, include concise few-shot examples for greetings, contact, and land intents
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Few-shot examples to teach the assistant common intents and safe recommendations
    const examples = [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello! Welcome to Julin Real Estate. I can help you find properties in Kenya, explain land terms, or connect you to our team. How can I assist you today?' },
      { role: 'user', content: 'How do I verify a title deed for a plot in Nairobi?' },
      { role: 'assistant', content: 'Generally, ask the seller for the original Title Deed, perform a Land Search at the Lands Registry to confirm the current registered owner and any encumbrances, engage a licensed surveyor to confirm boundaries, and consult an advocate for legal verification. I can guide you through each step or help locate professionals.' },
      { role: 'user', content: 'What is the difference between freehold and leasehold?' },
      { role: 'assistant', content: 'Freehold typically means outright ownership of the land. Leasehold means the land is held for a fixed term under a lease. Always check the specific lease terms and consult legal counsel for transactions.' },
      { role: 'user', content: 'How can I contact you?' },
      { role: 'assistant', content: 'I can share contact options. Please tell me your preferred method (WhatsApp, phone, or email) and I will provide the best available contact details or request a team member to reach out.' }
    ];

    for (const ex of examples) messages.push(ex);

    // If the caller provided a `messages` array (e.g., via supabase.functions.invoke), prefer that
    if (incomingMessages && Array.isArray(incomingMessages) && incomingMessages.length > 0) {
      const recent = incomingMessages.slice(-10);
      for (const msg of recent) {
        // Normalize message shape and types
        const role = String(msg?.role || 'user').toLowerCase();
        const content = String(msg?.content || '').slice(0, 2000);
        if (content.trim()) messages.push({ role: role as string, content });
      }
    } else {
      // Add recent conversation history
      if (conversation_history && Array.isArray(conversation_history)) {
        const recentHistory = conversation_history.slice(-5);
        for (const msg of recentHistory) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      messages.push({ role: "user", content: effectiveMessage });
    }

    // Call AI gateway (supports LOVABLE_API_KEY or OPENAI_API_KEY)
    const response = await callAI(messages, 500, "google/gemini-2.5-flash");

    if (!response.ok) {
      // If AI service reports it's unavailable, return a specific error.
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For rate limits (429) or other non-fatal errors, log and fall back to a simple, non-AI response
      const errorText = await response.text();
      console.warn("AI gateway non-fatal error:", response.status, errorText);

      const reply = generateSimpleResponse(effectiveMessage, properties, user_role, user_info);
      const relevantProperties = findRelevantProperties(effectiveMessage, properties);

      return new Response(
        JSON.stringify({ reply, properties: relevantProperties, session_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const aiReply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    // Decide whether to prefix greeting: only if user's latest message looks like a greeting
    const userLatestMessage = (incomingMessages && Array.isArray(incomingMessages) && incomingMessages.length > 0)
      ? String(incomingMessages[incomingMessages.length - 1].content || '')
      : effectiveMessage;

    // Determine if this is the very first message in the session
    async function checkFirstMessage(): Promise<boolean> {
      // If session_id present, check DB for existing messages
      if (session_id) {
        try {
          const { data: existing, error } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('session_id', session_id)
            .limit(1);
          if (error) return false;
          return !(existing && existing.length > 0);
        } catch {
          return false;
        }
      }

      // Fallback: if conversation_history exists it's not first; if incomingMessages length > 1 not first
      if (conversation_history && Array.isArray(conversation_history) && conversation_history.length > 0) return false;
      if (incomingMessages && Array.isArray(incomingMessages) && incomingMessages.length > 1) return false;
      return true;
    }

    const firstMessage = await checkFirstMessage();

    let finalReply = aiReply;
    // Only prefix when: displayName known, message is a greeting, and this is the first message
    if (displayName && displayName !== 'Admin' && isGreeting(userLatestMessage) && firstMessage) {
      finalReply = `${timeGreeting} ${displayName}! ${aiReply}`;
    }

    // Find relevant properties
    const relevantProperties = findRelevantProperties(effectiveMessage, properties);

    return new Response(
      JSON.stringify({
        reply: finalReply,
        properties: relevantProperties,
        session_id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat error:", errorMessage);
    // Include a short hint and (if available) the last few chars of the raw body
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Handle blog suggestion requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBlogSuggestion(body: ChatRequestBody, supabase: any) {
  const ctx = body.context;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  if (!LOVABLE_API_KEY && !OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ 
        suggestions: [
          { title: "Top 10 Areas to Invest in Kenya Real Estate", topic: "Investment" },
          { title: "First-Time Home Buyer Guide in Kenya", topic: "Buying Tips" },
          { title: "Understanding Land Ownership in Kenya", topic: "Legal" }
        ]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get properties for context
  const { data: propData } = await supabase
    .from("properties")
    .select("location, property_type, price, county")
    .eq("status", "available")
    .limit(20);

  const properties = (propData || []) as MiniProperty[];
  const locations = [...new Set(properties.map((p) => p.location).filter(Boolean))];
  const types = [...new Set(properties.map((p) => p.property_type).filter(Boolean))];

  const messages = [
    {
      role: "system",
      content: `You are a real estate blog content strategist for Julin Real Estate in Kenya. Generate blog topic suggestions based on current market trends and available properties.
          
Current property locations: ${locations.join(', ')}
Property types available: ${types.join(', ')}

Return a JSON array of 5 blog suggestions with this format:
[{"title": "Blog Title", "topic": "Category", "excerpt": "Brief description"}]`
    },
    {
      role: "user",
      content: ctx || "Suggest 5 blog topics for a Kenyan real estate website"
    }
  ];

  const response = await callAI(messages, 500, "google/gemini-2.5-flash");

  if (!response.ok) {
    return new Response(
      JSON.stringify({ 
        suggestions: [
          { title: "Top 10 Areas to Invest in Kenya Real Estate", topic: "Investment", excerpt: "Discover the best locations for property investment in Kenya." },
          { title: "First-Time Home Buyer Guide in Kenya", topic: "Buying Tips", excerpt: "Everything you need to know about buying your first home." },
          { title: "Understanding Land Ownership in Kenya", topic: "Legal", excerpt: "Navigate the legal aspects of land ownership." }
        ]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content || "[]";
  
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ 
        suggestions: [
          { title: "Top 10 Areas to Invest in Kenya Real Estate", topic: "Investment", excerpt: "Discover the best locations for property investment in Kenya." }
        ]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle blog generation requests
async function handleGenerateBlog(body: ChatRequestBody) {
  const title = String(body.title || 'Untitled');
  const topic = String(body.topic || 'General');
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  if (!LOVABLE_API_KEY && !OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ 
        content: `# ${title}\n\nThis is a placeholder blog post about ${topic}. Enable AI to generate full content.`,
        excerpt: `Learn about ${topic} in Kenya real estate.`,
        seo_title: title,
        seo_description: `Comprehensive guide about ${topic} for Kenya real estate.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const messages = [
    {
      role: "system",
      content: `You are a professional real estate content writer for Julin Real Estate in Kenya. Write engaging, SEO-optimized blog posts.

Return a JSON object with:
{
  "content": "Full markdown blog content (800-1200 words)",
  "excerpt": "150-character summary",
  "seo_title": "SEO optimized title (60 chars max)",
  "seo_description": "Meta description (160 chars max)"
}`
    },
    {
      role: "user",
      content: `Write a blog post about: ${title}\nTopic category: ${topic}`
    }
  ];

  const response = await callAI(messages, 2000, "google/gemini-2.5-flash");

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to generate blog content" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content || "";
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const blogData = jsonMatch ? JSON.parse(jsonMatch[0]) : { content: content };
    return new Response(
      JSON.stringify(blogData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ content: content, excerpt: "", seo_title: title, seo_description: "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle property description enhancement
async function handleEnhanceDescription(body: ChatRequestBody) {
  const { description, property_type, location, price } = body;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  
  if (!LOVABLE_API_KEY && !OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ enhanced: description || "A beautiful property in a prime location." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const messages = [
    {
      role: "system",
      content: "You are a real estate copywriter. Enhance property descriptions to be compelling, professional, and highlight key selling points. Keep it concise (150-250 words)."
    },
    {
      role: "user",
      content: `Enhance this property description:\nProperty Type: ${property_type || 'Not specified'}\nLocation: ${location || 'Not specified'}\nPrice: KES ${price?.toLocaleString() || 'Not specified'}\nCurrent Description: ${description || 'No description provided'}\n\nWrite an engaging, professional property description.`
    }
  ];

  const response = await callAI(messages, 400, "google/gemini-2.5-flash");

  if (!response.ok) {
    return new Response(
      JSON.stringify({ enhanced: description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const aiData = await response.json();
  const enhanced = aiData.choices?.[0]?.message?.content || description;
  
  return new Response(
    JSON.stringify({ enhanced }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Handle conversation summary requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleConversationSummary(body: ChatRequestBody, supabase: any) {
  const conversationId = body.conversation_id || '';
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  if (!conversationId) {
    return new Response(
      JSON.stringify({ summary: "No conversation ID provided." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get conversation messages
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("session_id", conversationId)
    .order("created_at", { ascending: true });

  if (!messages || messages.length === 0) {
    return new Response(
      JSON.stringify({ summary: "No conversation found." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!LOVABLE_API_KEY && !OPENAI_API_KEY) {
    const messageCount = messages.length;
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user').length;
    return new Response(
      JSON.stringify({ 
        summary: `Conversation with ${messageCount} messages (${userMessages} from user). AI summary not available - enable LOVABLE_API_KEY for detailed summaries.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const conversationText = messages
    .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
    .join('\n');

  const messagesForSummary = [
    {
      role: "system",
      content: `Analyze this real estate chat conversation and provide a brief summary including:\n1. User's property interests (type, location, budget)\n2. Key questions asked\n3. Lead quality assessment (Hot/Warm/Cold)\n4. Recommended follow-up actions\n\nKeep the summary concise (100-150 words).`
    },
    {
      role: "user",
      content: conversationText
    }
  ];

  const response = await callAI(messagesForSummary, 300, "google/gemini-2.5-flash");

  if (!response.ok) {
    return new Response(
      JSON.stringify({ summary: "Unable to generate summary." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const aiData = await response.json();
  const summary = aiData.choices?.[0]?.message?.content || "Unable to generate summary.";
  
  return new Response(
    JSON.stringify({ summary }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Simple response generator when AI is not available
function generateSimpleResponse(message: string, properties: MiniProperty[], userRole?: string, userInfo?: { name?: string; phone?: string; email?: string }): string {
  const msg = message.toLowerCase();
  const isAdmin = userRole === 'admin';
  const displayName = getDisplayName(userInfo);
  const timeGreeting = getTimeGreeting();
  
  // Admin commands
  if (isAdmin) {
    if (msg.includes('admin help')) {
      return "Admin Commands Available:\n• 'stats' - Show property statistics\n• 'analytics' - Market analytics\n• 'pending' - Show pending properties\n• 'inquiries' - Recent customer inquiries\n• 'admin help' - Show this help";
    }
    
    if (msg.includes('stats')) {
      const totalProperties = properties.length;
      const avgPrice = properties.length > 0 ? properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length : 0;
      
      return `Property Statistics:\n• Total Properties: ${totalProperties}\n• Average Price: KES ${Math.round(avgPrice).toLocaleString()}`;
    }
    
    if (msg.includes('analytics')) {
      const locations = [...new Set(properties.map(p => p.location))];
      const types = [...new Set(properties.map(p => p.property_type))];
      
      return `Market Analytics:\n• Active Locations: ${locations.join(', ')}\n• Property Types: ${types.join(', ')}\n• Total Market Value: KES ${properties.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}`;
    }
    
    if (msg.includes('hello') || msg.includes('hi')) {
      return `${timeGreeting} ${displayName}! Welcome to the Julin Real Estate admin assistant. Type 'admin help' for available commands or ask about properties and analytics.`;
    }
  }
  
  if (msg.includes('hello') || msg.includes('hi')) {
    // Keep simple fallback greeting behavior (message-based)
    return `${timeGreeting} ${displayName}! I can help you find properties in Kenya. What are you looking for? You can ask about houses, land, apartments, or plots in any location.`;
  }
  
  if (msg.includes('contact') || msg.includes('phone') || msg.includes('call')) {
    return "Please tell me your preferred contact method (WhatsApp, phone, or email) and I'll share the best way to reach our team. Would you like me to request a callback from an agent?";
  }

  // Land and title related fallback guidance
  if (msg.includes('title') || msg.includes('deed') || msg.includes('verify')) {
    return "To verify a title deed in Kenya: 1) Request the original title deed from the seller; 2) Perform a Land Search at the relevant Lands Registry to confirm the registered owner and any encumbrances; 3) Engage a licensed surveyor to confirm boundaries; 4) Consult an advocate for legal verification before payment. Would you like help locating a surveyor or advocate?";
  }

  if (msg.includes('freehold') || msg.includes('leasehold')) {
    return "Freehold usually means outright ownership of land. Leasehold means the land is held for a fixed term under a lease agreement. Always check the specific lease terms and consult a legal professional for implications on sale or development.";
  }

  if (msg.includes('survey') || msg.includes('boundary') || msg.includes('boundaries')) {
    return "A licensed land surveyor will confirm exact boundaries and provide a survey plan. It's recommended to commission a survey before completing any purchase to avoid disputes. Would you like guidance on how to find a licensed surveyor?";
  }
  
  if (properties.length === 0) {
    return "I couldn't find any properties matching your criteria. Please try a different search or contact us directly for assistance.";
  }
  
  const matchingProperties = findRelevantProperties(message, properties);
  
  if (matchingProperties.length > 0) {
    return `I found ${matchingProperties.length} properties that might interest you! Here are some options based on your search. Click on any property to see more details.`;
  }
  
  return "I'd be happy to help you find a property. Please tell me what you're looking for - type of property, location, or budget range.";
}

// Find properties relevant to user's message
function findRelevantProperties(message: string, properties: MiniProperty[]): MiniProperty[] {
  const msg = message.toLowerCase();
  
  return properties.filter(p => {
    const title = (p.title || '').toLowerCase();
    const location = (p.location || '').toLowerCase();
    const type = (p.property_type || '').toLowerCase();
    const county = (p.county || '').toLowerCase();

    const titleMatch = title.includes(msg) || msg.includes(title);
    const locationMatch = location.includes(msg) || msg.includes(location);
    const typeMatch = type.includes(msg) || msg.includes(type);
    const countyMatch = county.includes(msg) || msg.includes(county);
    
    // Price-based matching
    const priceMatch = msg.match(/(\d+)\s*(million|m|k)/i);
    let budgetMatch = false;
    if (priceMatch && typeof p.price === 'number') {
      const amount = parseInt(priceMatch[1]);
      const unit = priceMatch[2].toLowerCase();
      const budget = unit.startsWith('m') ? amount * 1000000 : amount * 1000;
      budgetMatch = (p.price || 0) <= budget * 1.2; // 20% buffer
    }
    
    return titleMatch || locationMatch || typeMatch || countyMatch || budgetMatch;
  }).slice(0, 5);
}

// Generic AI caller: prefers LOVABLE gateway, falls back to OpenAI if configured.
async function callAI(messages: Array<{ role: string; content: string }>, max_tokens = 500, model = "google/gemini-2.5-flash") {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  if (LOVABLE_API_KEY) {
    return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens }),
    });
  }

  if (OPENAI_API_KEY) {
    // Map model to an OpenAI-compatible default if the provided model is Gemini
    const openaiModel = model && model.startsWith('google/') ? 'gpt-3.5-turbo' : model;
    return await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: openaiModel, messages, max_tokens }),
    });
  }

  // No API configured - return a 503-like Response
  return new Response(JSON.stringify({ error: 'No AI API key configured' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
