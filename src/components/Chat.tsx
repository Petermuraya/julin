import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

const SUPABASE_URL = "https://fakkzdfwpucpgndofgcu.supabase.co";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionIdRef = useRef<string>('');
  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = `s_${Date.now()}`;
      localStorage.setItem('chat_session_id', sid);
    }
    sessionIdRef.current = sid;

    // Load previous messages from localStorage
    try {
      const stored = localStorage.getItem(`chat:${sid}`);
      if (stored) {
        const msgs = JSON.parse(stored);
        if (Array.isArray(msgs)) {
          setMessages(msgs);
        }
      }
    } catch (_) {}

    // Set initial welcome message if no messages
    if (!localStorage.getItem(`chat:${sid}`)) {
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm your AI property assistant. Ask me about properties, prices, or locations. For example:\n\n• 'Show me houses in Nairobi'\n• 'Land under 5 million'\n• 'Available plots'"
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Call Supabase Edge Function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZha2t6ZGZ3cHVjcGduZG9mZ2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODkzMjcsImV4cCI6MjA4MDk2NTMyN30.C_V3yvLOJ30JdY28luXjuX0gLJ_ML0QXxQh181Zvunk',
        },
        body: JSON.stringify({ message: text, session_id: sessionIdRef.current }),
      });

      const data = await response.json();

      // Persist to localStorage
      try {
        const stored = [...newMessages];
        if (data?.reply) stored.push({ role: 'assistant', content: data.reply });
        localStorage.setItem(`chat:${sessionIdRef.current}`, JSON.stringify(stored));
      } catch (_) {}

      // Show assistant reply with typewriter effect
      if (data?.reply) {
        const full = data.reply as string;
        let cur = '';
        setMessages((m) => [...m, { role: 'assistant', content: '' }]);
        const interval = setInterval(() => {
          cur = full.slice(0, cur.length + Math.max(1, Math.floor(full.length / 60)));
          setMessages((m) => {
            const copy = [...m];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === 'assistant') {
                copy[i] = { role: 'assistant', content: cur };
                break;
              }
            }
            return copy;
          });
          if (cur.length >= full.length) clearInterval(interval);
        }, 30);
      } else if (data?.error) {
        setMessages((m) => [...m, { role: 'assistant', content: `Error: ${data.error}` }]);
      }

      if (Array.isArray(data?.properties)) setProperties(data.properties);
    } catch (e) {
      console.error('Chat error:', e);
      setMessages((m) => [...m, { role: 'assistant', content: 'Unable to connect to the chat service. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Property Assistant</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Ask me anything about our properties</p>
        </div>

        {/* Chat Messages */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4 h-[50vh] overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about properties, prices, locations..."
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
            disabled={loading}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>

        {/* Property Results */}
        {properties.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Matching Properties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((p) => (
                <div key={p.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {p.images && p.images[0] && (
                    <img src={p.images[0]} alt={p.title} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{p.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{p.location}</p>
                    <p className="text-sm font-medium text-blue-600 mt-1">
                      KES {Number(p.price).toLocaleString()}
                    </p>
                    <Link 
                      to={`/property/${p.id}`} 
                      className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
