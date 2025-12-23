import React, { useEffect, useRef, useState } from 'react';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { PreChatForm } from '@/components/chat/PreChatForm';
import { ConversationRating } from '@/components/chat/ConversationRating';
import { restUpsertConversation, restInsertMessage, restPatchConversation, fetchReply } from './chatService';
import { safeSessionGet, safeSessionSet } from '@/lib/utils';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };
type ChatPhase = 'form' | 'chat' | 'rating' | 'completed';

const CustomerChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>('form');
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).slice(2,9)}`);
  const sessionIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // For customer chats we avoid persisting session identifiers to storage
    // to keep conversations ephemeral on the client. Generate an in-memory
    // session id for server-side tracking only.
    let sid = safeSessionGet<string>('chat_session_id');
    if (!sid) { sid = `s_${Date.now()}_${Math.random().toString(36).slice(2,9)}`; }
    sessionIdRef.current = sid as string;
  }, []);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const createConversation = async (name: string, phone: string) => {
    await restUpsertConversation({ conversation_id: conversationId, user_display_name: name, started_at: new Date().toISOString(), summary: JSON.stringify({ phone }) });
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
      const payload = { message: text, session_id: sessionIdRef.current, conversation_id: conversationId, user_role: 'user' };
      const data = await fetchReply(payload);
      if (data?.reply) {
        await saveMessage('assistant', data.reply);
        setMessages(m => [...m, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Unable to reach chat service.' }]);
    } finally { setLoading(false); }
  };

  if (phase === 'form') return <PreChatForm onSubmit={async (info) => { await createConversation(info.name, info.phone); setPhase('chat'); }} onCancel={() => { window.history.back(); }} />;
  if (phase === 'rating') return <ConversationRating onSubmit={() => setPhase('completed')} onSkip={() => setPhase('completed')} />;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 overflow-hidden">
        <ChatHeader userRole={'user'} userInfo={null} />
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
        <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} loading={loading} />
        <div className="mt-4 text-center">
          <button onClick={() => setPhase('rating')} className="text-sm text-gray-500 underline">End conversation and rate</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerChat;
