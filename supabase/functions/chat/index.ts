import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Credentials": "false",
};

type MiniProperty = {
  id?: string;
  title?: string;
  location?: string;
  price?: number;
  property_type?: string;
  bathrooms?: number | null;
  bedrooms?: number | null;
  size?: string | null;
  description?: string | null;
  images?: string[] | null;
  county?: string | null;
  amenities?: string[] | null;
};

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
  size?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  propertyDetails?: string;
}

// Default AI model - using latest and fastest
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

function extractLocalPartFromEmail(email?: string): string | null {
  if (!email) return null;
  const local = String(email).split('@')[0] || '';
  const beforePlus = local.split('+')[0];
  const firstSegment = beforePlus.split('.')[0];
  const cleaned = firstSegment.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleaned) return null;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getDisplayName(user_info?: { name?: string; phone?: string; email?: string }): string {
  if (user_info?.name && String(user_info.name).trim()) {
    const first = String(user_info.name).trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  const fromEmail = extractLocalPartFromEmail(user_info?.email);
  if (fromEmail) return fromEmail;
  return 'Guest';
}

function getTimeGreeting(timezone = 'Africa/Nairobi'): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).formatToParts(new Date());
    const hourPart = parts.find(p => p.type === 'hour')?.value;
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

function loadGreetingPatterns(): Record<string, string[]> {
  const defaultPatterns: Record<string, string[]> = {
    en: ['hi', 'hello', 'hey', 'hiya', 'good morning', 'good afternoon', 'good evening', 'morning', 'afternoon', 'evening', 'greetings', 'jambo', 'habari', 'sasa'],
  };
  const envJson = Deno.env.get('GREETING_PATTERNS_JSON');
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson) as Record<string, string[]>;
      return { ...defaultPatterns, ...parsed };
    } catch { return defaultPatterns; }
  }
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let rawText = '';
    try { rawText = await req.text(); } catch (e) { console.warn('Failed to read raw request text', e); }

    let body: ChatRequestBody;
    try {
      body = rawText ? JSON.parse(rawText) as ChatRequestBody : {} as ChatRequestBody;
    } catch (parseErr) {
      console.error('Failed to parse JSON request body', { parseErr: String(parseErr) });
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, session_id, conversation_id, user_info, user_role, conversation_history, type } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Route to specific handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (type === 'blog_suggestion') return handleBlogSuggestion(body, supabase as any);
    if (type === 'generate_blog') return handleGenerateBlog(body);
    if (type === 'enhance_description' || type === 'generate_description') return handlePropertyDescription(body);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (type === 'conversation_summary') return handleConversationSummary(body, supabase as any);

    // Default: chat message handling
    const bodyRec = body as unknown as Record<string, unknown>;
    const altContent = (typeof bodyRec['content'] === 'string' ? bodyRec['content'] : (typeof bodyRec['text'] === 'string' ? bodyRec['text'] : ''));
    const incomingMessages = body.messages;
    let effectiveMessage = String(
      message || (Array.isArray(incomingMessages) && incomingMessages.length > 0 && incomingMessages[incomingMessages.length - 1].content) || altContent || ''
    );

    if (effectiveMessage.length > 2000) effectiveMessage = effectiveMessage.slice(0, 2000);

    if (!effectiveMessage || effectiveMessage.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get properties for context
    const { data: allProperties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, location, price, property_type, size, bedrooms, bathrooms, description, images, county, amenities")
      .eq("status", "available")
      .limit(30);

    if (propertiesError) {
      console.error("Database error:", propertiesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch properties" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const properties = (allProperties || []) as MiniProperty[];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!LOVABLE_API_KEY && !OPENAI_API_KEY) {
      const reply = generateSimpleResponse(effectiveMessage, properties, body.user_role || user_role, user_info);
      const relevantProperties = findRelevantProperties(effectiveMessage, properties);
      return new Response(
        JSON.stringify({ reply, properties: relevantProperties, session_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build enhanced system prompt
    const isAdmin = Boolean(body.isAdmin) || user_role === 'admin';
    const displayName = getDisplayName(user_info);
    const timeGreeting = getTimeGreeting();

    const propertyListings = properties.map(p => {
      const details = [
        p.title,
        p.property_type,
        p.location,
        p.county && `${p.county} County`,
        `KES ${Number(p.price).toLocaleString()}`,
        p.size,
        p.bedrooms && `${p.bedrooms} BR`,
        p.bathrooms && `${p.bathrooms} Bath`,
      ].filter(Boolean).join(' | ');
      return `• ${details}`;
    }).join('\n');

    const kenyaRealEstateKnowledge = `
KENYA REAL ESTATE EXPERTISE:
- Land Documents: Title Deed (most secure), Allotment Letter, Lease, Sale Agreement, PIN Certificate
- Verification: Land Search at Lands Registry, licensed surveyor for boundaries, check caveats/charges
- Ownership Types: Freehold (permanent ownership), Leasehold (time-limited, e.g., 99 years), Community/Trust land
- Counties: Nairobi, Kiambu, Machakos, Kajiado, Nakuru are top investment areas
- Due Diligence: Check rates clearance, confirm physical access, verify seller identity, use escrow
- Always recommend consulting a licensed advocate for legal matters`;

    const systemPrompt = isAdmin 
      ? `You are Mary, an intelligent AI assistant for Julin Real Estate Hub administrators in Kenya.

CURRENT ADMIN: ${displayName}${user_info?.phone ? ` | Phone: ${user_info.phone}` : ''}

AVAILABLE INVENTORY (${properties.length} properties):
${propertyListings || 'No properties currently listed'}

${kenyaRealEstateKnowledge}

YOUR ADMIN CAPABILITIES:
• Property analytics, market insights, inventory analysis
• Customer lead tracking and management advice  
• Pricing recommendations based on market data
• Content creation assistance (blog posts, descriptions)
• Quick stats: 'stats', 'analytics', 'admin help'

RESPONSE STYLE:
• Professional yet approachable
• Data-driven insights with specific numbers
• Actionable recommendations
• Reference specific properties when relevant
• Concise responses (2-5 sentences unless detail requested)`

      : `You are Mary, a warm and knowledgeable AI property assistant for Julin Real Estate Hub in Kenya. 🏡

CURRENT USER: ${displayName}${user_info?.phone ? ` | Phone: ${user_info.phone}` : ''}

AVAILABLE PROPERTIES (${properties.length} listings):
${propertyListings || 'No properties currently available'}

${kenyaRealEstateKnowledge}

YOUR ROLE:
• Help users find their perfect property based on budget, location, type, and preferences
• Answer questions about buying property in Kenya (process, documentation, areas)
• Provide honest, helpful guidance (not legal advice - recommend advocates for that)
• Connect users with our team for viewings, negotiations, and purchases

PERSONALITY:
• Warm, friendly, conversational - like a helpful friend in real estate
• Use ${displayName}'s name naturally in conversation
• Be enthusiastic about great properties but always honest
• Keep responses concise (2-4 sentences typically)
• Use 1-2 relevant emojis to add warmth 🏠✨
• Ask clarifying questions to understand needs better
• Always offer next steps or additional help

IMPORTANT:
• Never claim admin privileges
• Always address user as ${displayName}
• If unsure, offer to connect them with our team`;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation context
    if (incomingMessages && Array.isArray(incomingMessages) && incomingMessages.length > 0) {
      const recent = incomingMessages.slice(-8);
      for (const msg of recent) {
        const role = String(msg?.role || 'user').toLowerCase();
        const content = String(msg?.content || '').slice(0, 2000);
        if (content.trim()) messages.push({ role, content });
      }
    } else {
      if (conversation_history && Array.isArray(conversation_history)) {
        const recentHistory = conversation_history.slice(-6);
        for (const msg of recentHistory) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
      messages.push({ role: "user", content: effectiveMessage });
    }

    const response = await callAI(messages, 600, DEFAULT_MODEL);

    if (!response.ok) {
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const reply = generateSimpleResponse(effectiveMessage, properties, user_role, user_info);
      const relevantProperties = findRelevantProperties(effectiveMessage, properties);
      return new Response(
        JSON.stringify({ reply, properties: relevantProperties, session_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const aiReply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    const userLatestMessage = (incomingMessages && Array.isArray(incomingMessages) && incomingMessages.length > 0)
      ? String(incomingMessages[incomingMessages.length - 1].content || '')
      : effectiveMessage;

    let finalReply = aiReply;
    const isFirstGreeting = isGreeting(userLatestMessage) && (!conversation_history || conversation_history.length === 0);
    if (displayName && displayName !== 'Guest' && isFirstGreeting) {
      if (!aiReply.toLowerCase().includes(displayName.toLowerCase())) {
        finalReply = `${timeGreeting} ${displayName}! ${aiReply}`;
      }
    }

    const relevantProperties = findRelevantProperties(effectiveMessage, properties);

    return new Response(
      JSON.stringify({ reply: finalReply, properties: relevantProperties, session_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============= BLOG SUGGESTION HANDLER =============
async function handleBlogSuggestion(body: ChatRequestBody, supabase: ReturnType<typeof createClient>) {
  const ctx = body.context;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const fallbackSuggestions = [
    { title: "Top 10 Areas to Invest in Kenya Real Estate 2025", topic: "Investment", excerpt: "Discover the best locations for property investment in Kenya with highest ROI potential." },
    { title: "Complete Guide to Buying Land in Kenya", topic: "Buying Guide", excerpt: "Everything you need to know about purchasing land safely and legally in Kenya." },
    { title: "Understanding Title Deeds and Land Documents in Kenya", topic: "Legal", excerpt: "Navigate the complexities of land documentation and ownership verification." },
    { title: "First-Time Home Buyer's Guide for Kenya", topic: "Buying Tips", excerpt: "Essential tips and steps for purchasing your first home in Kenya." },
    { title: "Best Areas for Family Homes in Nairobi", topic: "Lifestyle", excerpt: "Top neighborhoods in Nairobi perfect for families with great schools and amenities." }
  ];

  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ suggestions: fallbackSuggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: propData } = await supabase
    .from("properties")
    .select("location, property_type, price, county")
    .eq("status", "available")
    .limit(20);

  const properties = (propData || []) as MiniProperty[];
  const locations = [...new Set(properties.map((p) => p.location).filter(Boolean))];
  const types = [...new Set(properties.map((p) => p.property_type).filter(Boolean))];
  const counties = [...new Set(properties.map((p) => p.county).filter(Boolean))];

  const messages = [
    {
      role: "system",
      content: `You are a real estate content strategist for Julin Real Estate in Kenya. Generate blog topic suggestions optimized for SEO and reader engagement.

Current property data:
- Locations: ${locations.join(', ') || 'Various Kenya locations'}
- Property types: ${types.join(', ') || 'Houses, Land, Apartments, Plots'}
- Counties: ${counties.join(', ') || 'Nairobi, Kiambu, Machakos, Kajiado'}

Generate 5 unique, engaging blog topics that would attract property buyers and investors in Kenya.`
    },
    {
      role: "user",
      content: ctx || "Suggest 5 trending blog topics for a Kenyan real estate website that will drive organic traffic and engage property seekers."
    }
  ];

  // Use tool calling for structured output
  const response = await callAIWithTools(messages, [
    {
      type: "function",
      function: {
        name: "suggest_blog_topics",
        description: "Return 5 blog topic suggestions for a Kenya real estate website",
        parameters: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "SEO-optimized blog title (50-70 characters)" },
                  topic: { type: "string", description: "Category: Investment, Buying Guide, Legal, Lifestyle, Market Trends, or Tips" },
                  excerpt: { type: "string", description: "Compelling meta description (120-160 characters)" }
                },
                required: ["title", "topic", "excerpt"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    }
  ], "suggest_blog_topics");

  if (!response.ok) {
    return new Response(
      JSON.stringify({ suggestions: fallbackSuggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return new Response(
          JSON.stringify({ suggestions: parsed.suggestions }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Fallback: try to parse from content
    const content = aiResponse.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return new Response(
        JSON.stringify({ suggestions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("Blog suggestion parse error:", e);
  }

  return new Response(
    JSON.stringify({ suggestions: fallbackSuggestions }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ============= BLOG GENERATION HANDLER =============
async function handleGenerateBlog(body: ChatRequestBody) {
  const title = String(body.title || body.topic || 'Real Estate in Kenya');
  const topic = String(body.topic || 'General');
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ 
        content: `# ${title}\n\nThis is a placeholder blog post about ${topic}. Enable AI (LOVABLE_API_KEY) to generate full, SEO-optimized content automatically.\n\n## Introduction\n\nWrite your introduction here...\n\n## Key Points\n\n- Point 1\n- Point 2\n- Point 3\n\n## Conclusion\n\nSummarize your key takeaways...`,
        excerpt: `Learn about ${topic} in Kenya real estate. Comprehensive guide for property buyers and investors.`,
        seo_title: title.slice(0, 60),
        seo_description: `Comprehensive guide about ${topic} for Kenya real estate buyers and investors. Expert insights and tips.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const messages = [
    {
      role: "system",
      content: `You are an expert real estate content writer for Julin Real Estate in Kenya. Write engaging, SEO-optimized blog posts that provide genuine value to property buyers and investors.

WRITING GUIDELINES:
- Use conversational but professional tone
- Include specific Kenya-relevant information (areas, prices, legal requirements)
- Structure with clear headings (H2, H3)
- Include actionable tips and insights
- Optimize for keywords naturally
- Target 800-1200 words for the main content`
    },
    {
      role: "user",
      content: `Write a complete blog post about: "${title}"
Topic category: ${topic}

Generate the full article with proper Markdown formatting.`
    }
  ];

  // Use tool calling for structured blog output
  const response = await callAIWithTools(messages, [
    {
      type: "function",
      function: {
        name: "generate_blog_post",
        description: "Generate a complete SEO-optimized blog post",
        parameters: {
          type: "object",
          properties: {
            content: { type: "string", description: "Full blog content in Markdown format (800-1200 words)" },
            excerpt: { type: "string", description: "Compelling excerpt/summary (150-200 characters)" },
            seo_title: { type: "string", description: "SEO-optimized title (50-60 characters)" },
            seo_description: { type: "string", description: "Meta description for search engines (150-160 characters)" },
            seo_keywords: { 
              type: "array", 
              items: { type: "string" },
              description: "5-8 relevant SEO keywords"
            }
          },
          required: ["content", "excerpt", "seo_title", "seo_description"]
        }
      }
    }
  ], "generate_blog_post", 2500);

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to generate blog content. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const blogData = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(blogData),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: parse from content
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const blogData = JSON.parse(jsonMatch[0]);
      return new Response(
        JSON.stringify(blogData),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Last resort: return raw content
    return new Response(
      JSON.stringify({ content, excerpt: "", seo_title: title, seo_description: "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Blog generation parse error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to parse generated content" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// ============= PROPERTY DESCRIPTION HANDLER =============
async function handlePropertyDescription(body: ChatRequestBody) {
  const { description, property_type, location, price, size, bedrooms, bathrooms, amenities, propertyDetails, title } = body;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  // Build property context from available fields
  const propertyContext = propertyDetails || [
    title && `Title: ${title}`,
    property_type && `Type: ${property_type}`,
    location && `Location: ${location}`,
    price && `Price: KES ${Number(price).toLocaleString()}`,
    size && `Size: ${size}`,
    bedrooms && `Bedrooms: ${bedrooms}`,
    bathrooms && `Bathrooms: ${bathrooms}`,
    amenities?.length && `Amenities: ${amenities.join(', ')}`,
    description && `Current description: ${description}`,
  ].filter(Boolean).join('\n');

  if (!LOVABLE_API_KEY) {
    // Generate a simple description without AI
    const simpleDesc = `${property_type ? property_type.charAt(0).toUpperCase() + property_type.slice(1) : 'Property'} available in ${location || 'a prime Kenya location'}. ${size ? `Size: ${size}. ` : ''}${bedrooms ? `${bedrooms} bedroom${bedrooms > 1 ? 's' : ''}. ` : ''}${bathrooms ? `${bathrooms} bathroom${bathrooms > 1 ? 's' : ''}. ` : ''}Contact us for viewing and more details.`;
    
    return new Response(
      JSON.stringify({ 
        description: simpleDesc,
        enhanced: simpleDesc 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const messages = [
    {
      role: "system",
      content: `You are an expert real estate copywriter for properties in Kenya. Write compelling, professional property descriptions that:
- Highlight key selling points and unique features
- Use emotional, benefit-focused language
- Include relevant location advantages
- Are optimized for online listings
- Keep within 150-250 words
- Sound authentic and trustworthy`
    },
    {
      role: "user",
      content: `Write a compelling property description for this listing:\n\n${propertyContext}\n\nCreate an engaging description that will attract serious buyers.`
    }
  ];

  const response = await callAI(messages, 500, DEFAULT_MODEL);

  if (!response.ok) {
    return new Response(
      JSON.stringify({ 
        description: description || "A beautiful property in a prime location.",
        enhanced: description || "A beautiful property in a prime location."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const aiData = await response.json();
  const generatedDescription = aiData.choices?.[0]?.message?.content || description || "";
  
  return new Response(
    JSON.stringify({ 
      description: generatedDescription.trim(),
      enhanced: generatedDescription.trim(),
      response: generatedDescription.trim(),
      reply: generatedDescription.trim()
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ============= CONVERSATION SUMMARY HANDLER =============
async function handleConversationSummary(body: ChatRequestBody, supabase: ReturnType<typeof createClient>) {
  const conversationId = body.conversation_id || '';
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!conversationId) {
    return new Response(
      JSON.stringify({ summary: "No conversation ID provided." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .or(`session_id.eq.${conversationId},conversation_id.eq.${conversationId}`)
    .order("created_at", { ascending: true });

  if (!messages || messages.length === 0) {
    return new Response(
      JSON.stringify({ summary: "No conversation found." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!LOVABLE_API_KEY) {
    const messageCount = messages.length;
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user').length;
    return new Response(
      JSON.stringify({ 
        summary: `Conversation with ${messageCount} messages (${userMessages} from user). Enable AI for detailed analysis.`,
        message_count: messageCount,
        user_messages: userMessages
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const conversationText = messages
    .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const summaryMessages = [
    {
      role: "system",
      content: `You are a real estate CRM analyst. Analyze customer chat conversations and provide actionable insights for the sales team.`
    },
    {
      role: "user",
      content: `Analyze this real estate chat conversation:\n\n${conversationText}`
    }
  ];

  // Use tool calling for structured summary
  const response = await callAIWithTools(summaryMessages, [
    {
      type: "function",
      function: {
        name: "analyze_conversation",
        description: "Analyze a customer conversation and provide insights",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Brief 2-3 sentence summary of the conversation" },
            property_interests: { type: "string", description: "What property types/locations/budget the user is interested in" },
            key_questions: { type: "array", items: { type: "string" }, description: "Main questions the user asked" },
            lead_quality: { type: "string", enum: ["Hot", "Warm", "Cold"], description: "Lead quality assessment" },
            recommended_actions: { type: "array", items: { type: "string" }, description: "Suggested follow-up actions" }
          },
          required: ["summary", "lead_quality"]
        }
      }
    }
  ], "analyze_conversation");

  if (!response.ok) {
    return new Response(
      JSON.stringify({ summary: "Unable to generate summary." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const analysis = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(analysis),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = aiData.choices?.[0]?.message?.content || "Unable to generate summary.";
    return new Response(
      JSON.stringify({ summary: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Summary parse error:", e);
    return new Response(
      JSON.stringify({ summary: "Unable to generate summary." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// ============= SIMPLE RESPONSE GENERATOR (FALLBACK) =============
function generateSimpleResponse(message: string, properties: MiniProperty[], userRole?: string, userInfo?: { name?: string; phone?: string; email?: string }): string {
  const msg = message.toLowerCase();
  const isAdmin = userRole === 'admin';
  const displayName = getDisplayName(userInfo);
  const timeGreeting = getTimeGreeting();
  
  if (isAdmin) {
    if (msg.includes('admin help')) {
      return "📊 Admin Commands:\n• 'stats' - Property statistics\n• 'analytics' - Market analytics\n• 'pending' - Pending properties\n• 'inquiries' - Recent inquiries";
    }
    if (msg.includes('stats')) {
      const avgPrice = properties.length > 0 ? properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length : 0;
      return `📈 Property Stats:\n• Total: ${properties.length}\n• Avg Price: KES ${Math.round(avgPrice).toLocaleString()}`;
    }
    if (msg.includes('hello') || msg.includes('hi')) {
      return `${timeGreeting} ${displayName}! 👋 Ready to help with admin tasks. Type 'admin help' for commands.`;
    }
  }
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('jambo') || msg.includes('habari')) {
    return `${timeGreeting} ${displayName}! 🏡 I'm Mary from Julin Real Estate. How can I help you find your perfect property in Kenya today?`;
  }
  
  if (msg.includes('contact') || msg.includes('phone') || msg.includes('call') || msg.includes('reach')) {
    return "📞 I can connect you with our team! Would you prefer WhatsApp, phone call, or email? Just let me know your preference.";
  }

  if (msg.includes('title') || msg.includes('deed') || msg.includes('verify')) {
    return "🔍 To verify a title deed:\n1. Request the original from seller\n2. Do a Land Search at Lands Registry\n3. Hire a licensed surveyor for boundaries\n4. Consult an advocate before payment\n\nWant me to help find a surveyor or advocate?";
  }

  if (msg.includes('freehold') || msg.includes('leasehold')) {
    return "📋 Freehold = permanent ownership. Leasehold = fixed term (often 99 years). Always check specific terms with a legal professional before purchasing.";
  }
  
  if (properties.length === 0) {
    return "I couldn't find matching properties. Please try a different search or contact us directly for personalized assistance.";
  }
  
  const matchingProperties = findRelevantProperties(message, properties);
  if (matchingProperties.length > 0) {
    return `✨ Found ${matchingProperties.length} properties that might interest you! Check them out below. Click any property for full details.`;
  }
  
  return "🏠 I'd love to help you find a property! Tell me what you're looking for - property type, location, or budget range?";
}

// ============= FIND RELEVANT PROPERTIES =============
function findRelevantProperties(message: string, properties: MiniProperty[]): MiniProperty[] {
  const msg = message.toLowerCase();
  
  return properties.filter(p => {
    const title = (p.title || '').toLowerCase();
    const location = (p.location || '').toLowerCase();
    const type = (p.property_type || '').toLowerCase();
    const county = (p.county || '').toLowerCase();

    const titleMatch = msg.split(' ').some(word => word.length > 2 && title.includes(word));
    const locationMatch = msg.split(' ').some(word => word.length > 2 && location.includes(word));
    const typeMatch = type && msg.includes(type);
    const countyMatch = county && msg.includes(county);
    
    const priceMatch = msg.match(/(\d+)\s*(million|m|k)/i);
    let budgetMatch = false;
    if (priceMatch && typeof p.price === 'number') {
      const amount = parseInt(priceMatch[1]);
      const unit = priceMatch[2].toLowerCase();
      const budget = unit.startsWith('m') ? amount * 1000000 : amount * 1000;
      budgetMatch = (p.price || 0) <= budget * 1.3;
    }
    
    return titleMatch || locationMatch || typeMatch || countyMatch || budgetMatch;
  }).slice(0, 5);
}

// ============= AI CALLER (STANDARD) =============
async function callAI(messages: Array<{ role: string; content: string }>, max_tokens = 500, model = DEFAULT_MODEL) {
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
    const openaiModel = model.startsWith('google/') ? 'gpt-4o-mini' : model;
    return await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: openaiModel, messages, max_tokens }),
    });
  }

  return new Response(
    JSON.stringify({ error: 'No AI API key configured' }), 
    { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============= AI CALLER WITH TOOLS (STRUCTURED OUTPUT) =============
interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

async function callAIWithTools(
  messages: Array<{ role: string; content: string }>, 
  tools: Tool[], 
  toolChoice: string,
  max_tokens = 1000
) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  const payload = {
    model: DEFAULT_MODEL,
    messages,
    max_tokens,
    tools,
    tool_choice: { type: "function", function: { name: toolChoice } }
  };

  if (LOVABLE_API_KEY) {
    return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  if (OPENAI_API_KEY) {
    return await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...payload, model: 'gpt-4o-mini' }),
    });
  }

  return new Response(
    JSON.stringify({ error: 'No AI API key configured' }), 
    { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
