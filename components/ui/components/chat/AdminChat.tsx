import React, { useEffect, useRef, useState } from 'react';
import { Bot } from 'lucide-react';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { PreChatForm } from '@/components/chat/PreChatForm';
import { useAuth } from '@/contexts/AuthContextValue';
import { restUpsertConversation, restInsertMessage, restPatchConversation, fetchReply } from './chatService';
import { safeSessionGet, safeSessionSet } from '@/lib/utils';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };
type ChatPhase = 'form' | 'chat' | 'completed';

const AdminChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>('chat');
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).slice(2,9)}`);
  const sessionIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = safeSessionGet<string>('chat_session_id');
    if (!sid) { sid = `s_${Date.now()}`; safeSessionSet('chat_session_id', sid); }
    sessionIdRef.current = sid as string;
    if (!safeSessionGet(`chat:${sid}`)) {
      setMessages([{ role: 'assistant', content: "Hello Admin! I'm your AI property assistant with enhanced capabilities." }]);
    }
  }, []);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const createConversation = async () => {
    await restUpsertConversation({ conversation_id: conversationId, user_display_name: user?.email ?? 'admin', started_at: new Date().toISOString(), summary: JSON.stringify({ is_admin: true }) });
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
      const payload = { message: text, session_id: sessionIdRef.current, conversation_id: conversationId, user_role: 'admin' };
      const data = await fetchReply(payload);
      if (data?.reply) {
        await saveMessage('assistant', data.reply);
        setMessages(m => [...m, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Failed to get reply.' }]);
    } finally { setLoading(false); }
  };

  if (phase === 'form') return <PreChatForm onSubmit={() => setPhase('chat')} onCancel={() => {}} />;
  // Rating & analytics moved to the admin dashboard UI

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 overflow-hidden">
        <ChatHeader userRole={'admin'} userInfo={null} />
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
        <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} loading={loading} />
        {/* Rating removed from chat; admins will manage feedback in dashboard */}
      </div>
    </div>
  );
};

export default AdminChat;
