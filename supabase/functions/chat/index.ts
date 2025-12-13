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
    const { message, session_id } = await req.json();

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

    // Search for properties based on message keywords
    const searchTerms = message.toLowerCase();
    let query = supabase
      .from("properties")
      .select("id, title, location, price, property_type, size, images, description")
      .eq("status", "available");

    // Simple keyword matching for property search
    if (searchTerms.includes("house")) {
      query = query.eq("property_type", "house");
    } else if (searchTerms.includes("land")) {
      query = query.eq("property_type", "land");
    } else if (searchTerms.includes("plot")) {
      query = query.eq("property_type", "plot");
    } else if (searchTerms.includes("apartment")) {
      query = query.eq("property_type", "apartment");
    } else if (searchTerms.includes("commercial")) {
      query = query.eq("property_type", "commercial");
    }

    // Price range detection
    const priceMatch = searchTerms.match(/under\s*(\d+)/i);
    if (priceMatch) {
      query = query.lte("price", parseInt(priceMatch[1]));
    }

    const { data: properties, error } = await query.limit(6);

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to search properties" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a helpful response
    let reply = "";
    if (properties && properties.length > 0) {
      reply = `I found ${properties.length} properties that might interest you:\n\n`;
      properties.forEach((p, i) => {
        reply += `${i + 1}. **${p.title}** - ${p.location}\n`;
        reply += `   Price: KES ${Number(p.price).toLocaleString()}\n`;
        reply += `   Type: ${p.property_type}${p.size ? `, Size: ${p.size}` : ""}\n\n`;
      });
      reply += "\nWould you like more details about any of these properties? You can also filter by price, location, or property type.";
    } else {
      reply = "I couldn't find properties matching your criteria. Try asking about:\n";
      reply += "- Houses, plots, land, apartments, or commercial properties\n";
      reply += "- Properties in specific locations\n";
      reply += "- Properties under a certain price\n\n";
      reply += "For example: 'Show me houses in Nairobi' or 'Land under 5000000'";
    }

    console.log(`Chat response for session ${session_id}: Found ${properties?.length || 0} properties`);

    return new Response(
      JSON.stringify({ reply, properties: properties || [] }),
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
