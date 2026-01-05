import React, { useEffect, useRef, useState } from 'react';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { PreChatForm } from '@/components/chat/PreChatForm';
import { restUpsertConversation, restInsertMessage, restPatchConversation, fetchReply } from './chatService';
import { safeSessionGet } from '@/lib/utils';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };
type ChatPhase = 'form' | 'chat' | 'completed';
type UserInfo = { name: string; phone: string };

const CustomerChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>('form');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).slice(2,9)}`);
  const sessionIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = safeSessionGet<string>('chat_session_id');
    if (!sid) { sid = `s_${Date.now()}_${Math.random().toString(36).slice(2,9)}`; }
    sessionIdRef.current = sid as string;
  }, []);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const createConversation = async (name: string, phone: string) => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
    const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    const SERVER_API = (import.meta.env.VITE_SERVER_API_URL || '').replace(/\/$/, '');
    if (!SERVER_API && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
      const msg = 'Chat not configured: missing Supabase URL or publishable key in site build.';
      console.error('[CustomerChat] createConversation aborted', { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SERVER_API });
      throw new Error(msg);
    }

    await restUpsertConversation({ 
      conversation_id: conversationId, 
      user_display_name: name, 
      user_phone: phone,
      started_at: new Date().toISOString(), 
      summary: JSON.stringify({ phone }) 
    });
  };

  const saveMessage = async (role: string, content: string) => {
    await restInsertMessage({ conversation_id: conversationId, session_id: sessionIdRef.current, role, content });
    await restPatchConversation(conversationId, { last_message: content.substring(0, 100) });
  };

  const sendMessage = async () => {
    const text = input.trim(); if (!text) return;
    setInput('');
    const userMsg = { role: 'user' as const, content: text };
    setMessages(m => [...m, userMsg]);
    setLoading(true);
    await saveMessage('user', text);
    try {
      const payload = { 
        message: text, 
        session_id: sessionIdRef.current, 
        conversation_id: conversationId, 
        user_role: 'user',
        user_info: userInfo ? { name: userInfo.name, phone: userInfo.phone } : undefined
      };
      const data = await fetchReply(payload);
      if (data?.reply) {
        await saveMessage('assistant', data.reply);
        setMessages(m => [...m, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      console.error('[CustomerChat] sendMessage error', e);
      setMessages(m => [...m, { role: 'assistant', content: 'Unable to reach chat service. Please try again.' }]);
    } finally { setLoading(false); }
  };

  if (phase === 'form') return (
    <PreChatForm
      onSubmit={async (info) => {
        try {
          await createConversation(info.name, info.phone);
          setUserInfo(info);
          setPhase('chat');
          // Add welcome message
          setMessages([{
            role: 'assistant',
            content: `Hello ${info.name}! 👋 Welcome to Julin Real Estate. I'm Mary, your virtual property assistant. How can I help you find your perfect property today?`
          }]);
        } catch (err) {
          console.error('[CustomerChat] createConversation failed', err);
          alert('Failed to start chat. Please check your connection and try again.');
        }
      }}
      onCancel={() => { window.history.back(); }}
    />
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <ChatHeader userRole="user" userInfo={userInfo} />
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
        <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} loading={loading} />
      </div>
    </div>
  );
};

export default CustomerChat;
