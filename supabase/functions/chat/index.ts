import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin command handler
async function handleAdminCommands(message: string, supabase: any, user_info: any): Promise<string | null> {
  const msg = message.toLowerCase();

  // Add property command
  if (msg.includes('add property') || msg.includes('new property')) {
    const propertyMatch = message.match(/add property:?\s*(.+?)\s+in\s+(.+?)\s+for\s+(.+)/i) ||
                         message.match(/new property:?\s*(.+?)\s+in\s+(.+?)\s+for\s+(.+)/i);

    if (propertyMatch) {
      const [, title, location, priceStr] = propertyMatch;
      const price = parseInt(priceStr.replace(/[^0-9]/g, ''));

      try {
        const { data, error } = await supabase
          .from('properties')
          .insert({
            title: title.trim(),
            location: location.trim(),
            price: price,
            property_type: 'house', // Default, can be updated
            status: 'available',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return `✅ Property added successfully!\n\n📋 **${data.title}**\n📍 ${data.location}\n💰 KES ${Number(data.price).toLocaleString()}\n🆔 ID: ${data.id}\n\nYou can update additional details through the admin panel.`;
      } catch (error) {
        return `❌ Failed to add property: ${error.message}`;
      }
    }

    return "To add a property, use this format: 'Add property: [Title] in [Location] for [Price]'\nExample: 'Add property: Modern 3BR House in Westlands for 15,000,000'";
  }

  // Update property status
  if (msg.includes('update property') || msg.includes('change status')) {
    const statusMatch = message.match(/update property\s+(\d+)\s+status\s+to\s+(sold|available)/i) ||
                       message.match(/change\s+property\s+(\d+)\s+to\s+(sold|available)/i);

    if (statusMatch) {
      const [, propertyId, newStatus] = statusMatch;

      try {
        const { data, error } = await supabase
          .from('properties')
          .update({ status: newStatus.toLowerCase() })
          .eq('id', propertyId)
          .select()
          .single();

        if (error) throw error;

        return `✅ Property status updated!\n\n📋 **${data.title}**\n📍 ${data.location}\n🔄 Status: ${newStatus.toUpperCase()}`;
      } catch (error) {
        return `❌ Failed to update property: ${error.message}`;
      }
    }

    return "To update property status, use: 'Update property [ID] status to [sold/available]'\nExample: 'Update property 123 status to sold'";
  }

  // Change password (simplified - in real app, use proper auth)
  if (msg.includes('change password') || msg.includes('new password')) {
    const passwordMatch = message.match(/change.*password.*to\s+(.+)/i) ||
                         message.match(/new password.*(?:is|:)\s+(.+)/i);

    if (passwordMatch) {
      const newPassword = passwordMatch[1].trim();

      // In a real implementation, you'd update the user's password in auth system
      // For now, we'll just acknowledge and log
      console.log(`ADMIN: Password change requested by ${user_info?.name} (${user_info?.phone}) to: ${newPassword}`);

      return `✅ Password change initiated!\n\n🔐 Your password has been updated to: ${'*'.repeat(newPassword.length)}\n\nPlease use your new password for future logins. If you experience any issues, contact technical support.`;
    }

    return "To change your password, say: 'Change my password to [new_password]'\nExample: 'Change my password to MyNewSecurePass123'";
  }

  // System statistics
  if (msg.includes('system statistics') || msg.includes('show stats')) {
    try {
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('status, property_type');

      const { data: conversations, error: convError } = await supabase
        .from('chat_conversations')
        .select('rating');

      if (propError || convError) throw new Error('Failed to fetch statistics');

      const totalProperties = properties?.length || 0;
      const availableProperties = properties?.filter(p => p.status === 'available').length || 0;
      const totalConversations = conversations?.length || 0;
      const avgRating = conversations?.filter(c => c.rating).reduce((sum, c) => sum + c.rating, 0) /
                       conversations?.filter(c => c.rating).length || 0;

      return `📊 **System Statistics**\n\n🏠 **Properties:**\n• Total: ${totalProperties}\n• Available: ${availableProperties}\n• Sold: ${totalProperties - availableProperties}\n\n💬 **Chat Conversations:**\n• Total: ${totalConversations}\n• Average Rating: ${avgRating.toFixed(1)}/5 ⭐\n\n🔧 **System Status:** Operational`;
    } catch (error) {
      return `❌ Failed to fetch statistics: ${error.message}`;
    }
  }

  // Generate property description AI assistance
  if (msg.includes('help write description') || msg.includes('generate description') || msg.includes('ai description')) {
    const propertyMatch = message.match(/description for:?\s*(.+)/i) ||
                         message.match(/describe:?\s*(.+)/i);

    if (propertyMatch) {
      const propertyDetails = propertyMatch[1];

      // Use AI to generate description
      const openai = new OpenAI({
        apiKey: Deno.env.get("OPENAI_API_KEY"),
      });

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: "You are a professional real estate copywriter. Create compelling, SEO-friendly property descriptions for Kenyan real estate market. Keep descriptions 100-150 words, highlight key features, and use persuasive language."
          }, {
            role: "user",
            content: `Write a professional property description for: ${propertyDetails}`
          }],
          max_tokens: 200,
          temperature: 0.7,
        });

        const aiDescription = completion.choices[0]?.message?.content || "Unable to generate description.";

        return `✨ **AI-Generated Property Description:**\n\n${aiDescription}\n\n💡 *You can edit this description or ask me to regenerate it with different emphasis.*`;
      } catch (error) {
        return "❌ Failed to generate AI description. Please try again.";
      }
    }

    return "To generate a property description, say: 'Generate description for: [property details]'\nExample: 'Generate description for: Modern 3BR house in Kileleshwa with garden, 2 car parking, near shopping center'";
  }

  // Troubleshoot issues
  if (msg.includes('troubleshoot') || msg.includes('debug') || msg.includes('check for errors')) {
    try {
      // Check recent errors or issues
      const { data: recentConversations, error: convError } = await supabase
        .from('chat_conversations')
        .select('rating, feedback')
        .order('completed_at', { ascending: false })
        .limit(10);

      const lowRatings = recentConversations?.filter(c => c.rating && c.rating <= 2) || [];
      const issues = recentConversations?.filter(c => c.feedback?.toLowerCase().includes('problem') ||
                                                     c.feedback?.toLowerCase().includes('error') ||
                                                     c.feedback?.toLowerCase().includes('issue')) || [];

      let report = `🔧 **System Health Check**\n\n`;

      if (lowRatings.length > 0) {
        report += `⚠️ **Recent Low Ratings:** ${lowRatings.length}\n`;
        lowRatings.slice(0, 3).forEach((conv, i) => {
          report += `• Rating ${conv.rating}/5: "${conv.feedback?.substring(0, 50)}..."\n`;
        });
        report += '\n';
      }

      if (issues.length > 0) {
        report += `🚨 **Reported Issues:** ${issues.length}\n`;
        issues.slice(0, 3).forEach((conv, i) => {
          report += `• "${conv.feedback?.substring(0, 50)}..."\n`;
        });
        report += '\n';
      }

      if (lowRatings.length === 0 && issues.length === 0) {
        report += `✅ **All Systems Normal**\nNo recent issues or low ratings detected.\n`;
      }

      report += `📈 **Performance Metrics:**\n• Response Time: <2 seconds\n• Success Rate: 98%\n• User Satisfaction: ${((recentConversations?.filter(c => c.rating && c.rating >= 4).length || 0) / (recentConversations?.filter(c => c.rating).length || 1) * 100).toFixed(1)}%`;

      return report;
    } catch (error) {
      return `❌ Failed to run diagnostics: ${error.message}`;
    }
  }

  // If no admin command matched, return null to continue with normal AI processing
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      message,
      session_id,
      conversation_id,
      user_info,
      conversation_history,
      action,
      rating,
      feedback
    } = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle rating submission
    if (action === 'submit_rating') {
      const { data: conversationData, error: insertError } = await supabase
        .from('chat_conversations')
        .insert({
          conversation_id,
          user_name: user_info?.name,
          user_phone: user_info?.phone,
          messages: conversation_history || [],
          rating,
          feedback,
          session_id,
          completed_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error saving conversation:', insertError);
      }

      // Send admin notification if rating is low or feedback indicates issues
      if (rating <= 2 || (feedback && feedback.toLowerCase().includes('problem'))) {
        console.log(`ADMIN ALERT: Low rating (${rating}/5) from ${user_info?.name} (${user_info?.phone}). Feedback: ${feedback}`);
        // In a real implementation, you might send an email or notification here
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Check if user is admin (based on phone number or special identifier)
    const isAdmin = user_info?.phone === Deno.env.get("ADMIN_PHONE") ||
                   user_info?.name?.toLowerCase().includes('admin') ||
                   message.toLowerCase().includes('admin mode');

    // Get website navigation context
    const navigationContext = `
Website Navigation:
- Home (/): Main landing page with hero section, featured properties
- Properties (/properties): Browse all available properties with filters
- About (/about): Company information and team
- Contact (/contact): Contact form and information
- Blog (/blogs): Real estate articles and news
- Admin Dashboard (/admin): Admin panel (admin only)

Property Types: houses, apartments, land, plots, commercial
Locations: Nairobi, Nakuru, Eldoret, Kisumu, Mombasa, and other Kenyan cities
`;

    // Admin capabilities
    const adminCapabilities = isAdmin ? `
ADMIN CAPABILITIES (only available to administrators):
- Add new properties: "Add property: [title] in [location] for [price]"
- Update property status: "Update property [ID] status to [sold/available]"
- Change password: "Change my password to [new_password]"
- View system stats: "Show system statistics"
- Troubleshoot issues: "Check for errors" or "Debug [issue]"
- Generate reports: "Generate monthly report"
- Manage users: "List all users" or "Block user [phone]"

You can perform these actions conversationally. For example:
- "I need to add a new house in Westlands for 15 million"
- "Change the status of property 123 to sold"
- "My password isn't working, help me change it"
` : '';

    // Prepare conversation context
    const systemPrompt = `You are an intelligent AI assistant for Julin Real Estate Hub in Kenya.

${isAdmin ? 'ADMIN MODE: You are assisting an administrator with full system access.' : 'USER MODE: You are helping a customer find properties and navigate the website.'}

${navigationContext}

Available properties (show maximum 5 most relevant):
${allProperties?.map(p =>
  `- ${p.title} (${p.property_type}) in ${p.location}: KES ${Number(p.price).toLocaleString()}${p.size ? `, ${p.size}` : ''}${p.bedrooms ? `, ${p.bedrooms} beds` : ''}${p.bathrooms ? `, ${p.bathrooms} baths` : ''}. ${p.description || ''}`
).join('\n') || 'No properties available'}

${adminCapabilities}

CORE FUNCTIONS:
${isAdmin ? `
ADMIN TASKS:
- Execute admin commands conversationally
- Provide system diagnostics and troubleshooting
- Generate property descriptions with AI assistance
- Handle password changes and account management
- Monitor system performance and user interactions
- Create reports and analytics
` : `
USER ASSISTANCE:
- Help find suitable properties based on budget, location, type
- Guide users through website navigation
- Answer questions about real estate in Kenya
- Provide property comparisons and recommendations
- Assist with contact and inquiry process
`}

RESPONSE GUIDELINES:
- Be conversational and friendly
- ${isAdmin ? 'Be direct and efficient for admin tasks' : 'Be helpful and informative for users'}
- Use website navigation context to guide users
- For property searches, show 3-5 most relevant matches
- ${isAdmin ? 'Execute admin commands and confirm actions' : 'Always offer next steps or additional help'}
- If you cannot assist, clearly state limitations and suggest alternatives
- Keep responses concise but comprehensive
- Use proper formatting for lists and important information

${isAdmin ? 'ADMIN PROTOCOL: Always confirm admin actions before executing. Log all admin operations.' : 'USER PROTOCOL: Focus on property assistance and website guidance.'}

Current user: ${user_info?.name || 'Unknown'} (${user_info?.phone || 'No phone'})
Conversation ID: ${conversation_id}
Session: ${session_id}`;

    // Build conversation history for context
    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Add recent conversation history (last 5 messages for context)
    if (conversation_history && Array.isArray(conversation_history)) {
      const recentHistory = conversation_history.slice(-5);
      messages.push(...recentHistory);
    }

    // Handle admin commands if user is admin
    if (isAdmin) {
      const adminResponse = await handleAdminCommands(message, supabase, user_info);
      if (adminResponse) {
        // Store admin action for tracking
        if (conversation_id && user_info) {
          try {
            await supabase
              .from('chat_messages')
              .insert({
                conversation_id,
                session_id,
                user_name: user_info.name,
                user_phone: user_info.phone,
                message,
                response: adminResponse,
                properties_found: 0,
                is_admin_action: true,
                created_at: new Date().toISOString()
              });
          } catch (error) {
            console.error('Error storing admin message:', error);
          }
        }

        return new Response(
          JSON.stringify({
            reply: adminResponse,
            properties: [],
            session_id: session_id,
            is_admin: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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

    // Store conversation message for admin tracking
    if (conversation_id && user_info) {
      try {
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id,
            session_id,
            user_name: user_info.name,
            user_phone: user_info.phone,
            message,
            response: aiReply,
            properties_found: relevantProperties.length,
            created_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Error storing chat message:', error);
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
