import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

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
    const { message, session_id, conversation_history } = await req.json();

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

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    // Get all available properties for context
    const { data: allProperties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, location, price, property_type, size, bedrooms, bathrooms, description, features, images")
      .eq("status", "available")
      .limit(50);

    if (propertiesError) {
      console.error("Database error:", propertiesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch properties" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare conversation context
    const systemPrompt = `You are a helpful real estate assistant for Julin Real Estate Hub in Kenya. You help customers find properties and answer questions about real estate.

Available properties (show maximum 5 most relevant):
${allProperties?.map(p => 
  `- ${p.title} (${p.property_type}) in ${p.location}: KES ${Number(p.price).toLocaleString()}${p.size ? `, ${p.size}` : ''}${p.bedrooms ? `, ${p.bedrooms} beds` : ''}${p.bathrooms ? `, ${p.bathrooms} baths` : ''}. ${p.description || ''}`
).join('\n') || 'No properties available'}

Guidelines:
- Be friendly, professional, and conversational
- Focus on helping users find suitable properties
- Provide specific property details when relevant
- Ask clarifying questions when needed
- Suggest alternatives if exact matches aren't found
- Mention price ranges, locations, and property types
- Keep responses concise but informative
- If showing properties, limit to 3-5 most relevant ones
- Always offer to provide more details or help with next steps`;

    // Build conversation history for context
    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Add recent conversation history (last 5 messages for context)
    if (conversation_history && Array.isArray(conversation_history)) {
      const recentHistory = conversation_history.slice(-5);
      messages.push(...recentHistory);
    }

    // Add current user message
    messages.push({ role: "user", content: message });

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiReply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    // Extract property recommendations from AI response
    const relevantProperties = [];
    if (allProperties) {
      // Simple heuristic: look for property titles or locations mentioned in the response
      const responseLower = aiReply.toLowerCase();
      for (const property of allProperties) {
        const titleMatch = property.title.toLowerCase().includes(responseLower) ||
                          responseLower.includes(property.title.toLowerCase());
        const locationMatch = property.location.toLowerCase().includes(responseLower) ||
                             responseLower.includes(property.location.toLowerCase());
        const typeMatch = property.property_type.toLowerCase().includes(responseLower);

        if (titleMatch || locationMatch || typeMatch) {
          relevantProperties.push(property);
          if (relevantProperties.length >= 5) break; // Limit to 5 properties
        }
      }
    }

    console.log(`Chat response for session ${session_id}: AI generated response with ${relevantProperties.length} property suggestions`);

    return new Response(
      JSON.stringify({
        reply: aiReply,
        properties: relevantProperties,
        session_id: session_id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Chat error:", err);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
