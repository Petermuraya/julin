import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, session_id, conversation_id, user_info, user_role, conversation_history } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

// Simple response generator when AI is not available
function generateSimpleResponse(message: string, properties: any[], userRole?: string): string {
  const msg = message.toLowerCase();
  const isAdmin = userRole === 'admin';
  
  // Admin commands
  if (isAdmin) {
    if (msg.includes('admin help')) {
      return "Admin Commands Available:\n• 'stats' - Show property statistics\n• 'analytics' - Market analytics\n• 'pending' - Show pending properties\n• 'inquiries' - Recent customer inquiries\n• 'admin help' - Show this help";
    }
    
    if (msg.includes('stats')) {
      const totalProperties = properties.length;
      const availableProperties = properties.filter(p => p.status === 'available').length;
      const avgPrice = properties.length > 0 ? properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length : 0;
      
      return `Property Statistics:\n• Total Properties: ${totalProperties}\n• Available: ${availableProperties}\n• Average Price: KES ${Math.round(avgPrice).toLocaleString()}`;
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
function findRelevantProperties(message: string, properties: any[]): any[] {
  const msg = message.toLowerCase();
  
  return properties.filter(p => {
    const titleMatch = p.title?.toLowerCase().includes(msg) || msg.includes(p.title?.toLowerCase());
    const locationMatch = p.location?.toLowerCase().includes(msg) || msg.includes(p.location?.toLowerCase());
    const typeMatch = p.property_type?.toLowerCase().includes(msg) || msg.includes(p.property_type?.toLowerCase());
    const countyMatch = p.county?.toLowerCase().includes(msg) || msg.includes(p.county?.toLowerCase());
    
    // Price-based matching
    const priceMatch = msg.match(/(\d+)\s*(million|m|k)/i);
    let budgetMatch = false;
    if (priceMatch) {
      const amount = parseInt(priceMatch[1]);
      const unit = priceMatch[2].toLowerCase();
      const budget = unit.startsWith('m') ? amount * 1000000 : amount * 1000;
      budgetMatch = p.price <= budget * 1.2; // 20% buffer
    }
    
    return titleMatch || locationMatch || typeMatch || countyMatch || budgetMatch;
  }).slice(0, 5);
}
