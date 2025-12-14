-- Create chat conversations table for storing completed conversations with ratings
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT NOT NULL UNIQUE,
    session_id TEXT NOT NULL,
    user_name TEXT,
    user_phone TEXT,
    messages JSONB DEFAULT '[]'::jsonb,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table for storing individual messages during conversations
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_name TEXT,
    user_phone TEXT,
    message TEXT NOT NULL,
    response TEXT,
    properties_found INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_conversation_id ON chat_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_completed_at ON chat_conversations(completed_at);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_rating ON chat_conversations(rating);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- Enable RLS (Row Level Security)
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (assuming you have an admin role)
-- These policies allow admins to view all conversations and messages
CREATE POLICY "Allow admin access to chat_conversations" ON chat_conversations
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin access to chat_messages" ON chat_messages
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- For development/testing, you might want to allow all access temporarily
-- Remove these policies in production and use proper admin authentication
CREATE POLICY "Allow all access to chat_conversations" ON chat_conversations
    FOR ALL USING (true);

CREATE POLICY "Allow all access to chat_messages" ON chat_messages
    FOR ALL USING (true);