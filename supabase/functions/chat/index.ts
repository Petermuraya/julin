import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  type MiniProperty = {
    id?: string;
    title?: string;
    location?: string;
    price?: number;
    property_type?: string;
    size?: string | null;
    description?: string | null;
    images?: string[] | null;
    county?: string | null;
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, session_id, conversation_id, user_info, user_role, conversation_history, type } = body;

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different request types
    if (type === 'blog_suggestion') {
      return handleBlogSuggestion(body as unknown, supabase);
    }

    if (type === 'generate_blog') {
      return handleGenerateBlog(body as unknown, supabase);
    }

    if (type === 'enhance_description') {
      return handleEnhanceDescription(body as unknown);
    }

    if (type === 'conversation_summary') {
      return handleConversationSummary(body as unknown, supabase);
    }

    // Default: chat message handling
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all available properties for context
    const { data: allProperties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, location, price, property_type, size, description, images, county")
      .eq("status", "available")
      .limit(50);

    if (propertiesError) {
      console.error("Database error:", propertiesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch properties" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      // Fallback to simple property-based response without AI
      const reply = generateSimpleResponse(message, allProperties || [], user_role);
      const relevantProperties = findRelevantProperties(message, allProperties || []);
      
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
    const isAdmin = user_role === 'admin';
    
    const systemPrompt = isAdmin ? `You are an advanced AI assistant for Julin Real Estate Hub administrators in Kenya.

Available properties:
${allProperties?.map(p =>
  `- ${p.title} (${p.property_type}) in ${p.location}: KES ${Number(p.price).toLocaleString()}${p.size ? `, ${p.size}` : ''}. ${p.description || ''}`
).join('\n') || 'No properties available'}

ADMIN FUNCTIONS:
- Provide detailed property analytics and insights
- Help manage listings, pricing, and inventory
- Assist with customer inquiries and lead management
- Generate reports and market analysis
- Access admin commands (respond to 'admin help', 'stats', 'analytics', etc.)

CORE FUNCTIONS:
- Advanced property search and filtering
- Market trend analysis and recommendations
- Customer relationship management
- Administrative task automation

RESPONSE GUIDELINES:
- Be professional and detailed for admin users
- Provide comprehensive information and options
- Include relevant statistics and data when available
- Offer administrative insights and recommendations
- Support admin commands and system queries

Current admin user: ${user_info?.name || 'Unknown'} (${user_info?.phone || 'No phone'})` : `You are an intelligent AI assistant for Julin Real Estate Hub in Kenya.

Available properties:
${allProperties?.map(p =>
  `- ${p.title} (${p.property_type}) in ${p.location}: KES ${Number(p.price).toLocaleString()}${p.size ? `, ${p.size}` : ''}. ${p.description || ''}`
).join('\n') || 'No properties available'}

CORE FUNCTIONS:
- Help find suitable properties based on budget, location, type
- Guide users through website navigation
- Answer questions about real estate in Kenya
- Provide property comparisons and recommendations

RESPONSE GUIDELINES:
- Be conversational and friendly
- For property searches, show 3-5 most relevant matches
- Keep responses concise but comprehensive
- Always offer next steps or additional help

Current user: ${user_info?.name || 'Unknown'} (${user_info?.phone || 'No phone'})`;

    // Build messages for AI
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add recent conversation history
    if (conversation_history && Array.isArray(conversation_history)) {
      const recentHistory = conversation_history.slice(-5);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: message });

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Fallback to simple response
      const reply = generateSimpleResponse(message, allProperties || [], user_role);
      const relevantProperties = findRelevantProperties(message, allProperties || []);
      
      return new Response(
        JSON.stringify({ reply, properties: relevantProperties, session_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const aiReply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    // Find relevant properties
    const relevantProperties = findRelevantProperties(message, allProperties || []);

    return new Response(
      JSON.stringify({
        reply: aiReply,
        properties: relevantProperties,
        session_id
      }),
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

// Handle blog suggestion requests
async function handleBlogSuggestion(body: unknown, supabase: any) {
  const ctx = (body as Record<string, unknown>)?.context as string | undefined;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
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
  const { data } = await supabase
    .from("properties")
    .select("location, property_type, price, county")
    .eq("status", "available")
    .limit(20);

  const properties = (data || []) as MiniProperty[];
  const locations = [...new Set(properties.map((p) => p.location).filter(Boolean))];
  const types = [...new Set(properties.map((p) => p.property_type).filter(Boolean))];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
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
          content: body.context || "Suggest 5 blog topics for a Kenyan real estate website"
        }
      ],
      max_tokens: 500,
    }),
  });

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

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";
  
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
async function handleGenerateBlog(body: unknown, supabase: any) {
  const b = body as Record<string, unknown>;
  const title = String(b.title || 'Untitled');
  const topic = String(b.topic || 'General');
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
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

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
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
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to generate blog content" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
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
async function handleEnhanceDescription(body: unknown) {
  const { description, property_type, location, price } = body;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ enhanced: description || "A beautiful property in a prime location." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are a real estate copywriter. Enhance property descriptions to be compelling, professional, and highlight key selling points. Keep it concise (150-250 words)."
        },
        {
          role: "user",
          content: `Enhance this property description:
Property Type: ${property_type}
Location: ${location}
Price: KES ${price?.toLocaleString() || 'Not specified'}
Current Description: ${description || 'No description provided'}

Write an engaging, professional property description.`
        }
      ],
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ enhanced: description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const data = await response.json();
  const enhanced = data.choices?.[0]?.message?.content || description;
  
  return new Response(
    JSON.stringify({ enhanced }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Handle conversation summary requests
async function handleConversationSummary(body: unknown, supabase: any) {
  const conversation_id = (body as Record<string, unknown>)?.conversation_id as string | undefined;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  // Get conversation messages
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("session_id", conversation_id)
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
        summary: `Conversation with ${messageCount} messages (${userMessages} from user). Enable AI for detailed analysis.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const conversationText = messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n');

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Analyze this real estate chat conversation and provide a brief summary including:
1. User's property interests (type, location, budget)
2. Key questions asked
3. Lead quality assessment (Hot/Warm/Cold)
4. Recommended follow-up actions

Keep the summary concise (100-150 words).`
        },
        {
          role: "user",
          content: conversationText
        }
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ summary: "Unable to generate summary." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";
  
  return new Response(
    JSON.stringify({ summary }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Simple response generator when AI is not available
function generateSimpleResponse(message: string, properties: MiniProperty[], userRole?: string): string {
  const msg = message.toLowerCase();
  const isAdmin = userRole === 'admin';
  
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
      return "Hello Admin! Welcome to the Julin Real Estate admin assistant. Type 'admin help' for available commands or ask about properties and analytics.";
    }
  }
  
  if (msg.includes('hello') || msg.includes('hi')) {
    return "Hello! Welcome to Julin Real Estate. I can help you find properties in Kenya. What are you looking for? You can ask about houses, land, apartments, or plots in any location.";
  }
  
  if (msg.includes('contact') || msg.includes('phone') || msg.includes('call')) {
    return "You can contact us via WhatsApp or visit our Contact page for more information. Would you like to see any properties?";
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