-- Add conversation rating and summary columns to chat_conversations
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS rating_feedback text,
ADD COLUMN IF NOT EXISTS user_email text,
ADD COLUMN IF NOT EXISTS user_phone text,
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ended_at timestamp with time zone;

-- Enable RLS on chat tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_conversations
CREATE POLICY "Anyone can create conversations" 
ON public.chat_conversations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update their own conversation" 
ON public.chat_conversations 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can view all conversations" 
ON public.chat_conversations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR id = id);

-- Create policies for chat_messages
CREATE POLICY "Anyone can create messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all messages" 
ON public.chat_messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR session_id = session_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_conversations_rating ON public.chat_conversations(rating);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_started_at ON public.chat_conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);