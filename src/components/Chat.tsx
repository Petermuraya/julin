import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { PreChatForm } from './PreChatForm';
import { ConversationRating } from './ConversationRating';

interface ChatResponse {
  reply: string;
  properties: any[];
  session_id: string;
  error?: string;
}

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://fakkzdfwpucpgndofgcu.supabase.co";

type ChatPhase = 'form' | 'chat' | 'rating' | 'completed';

interface UserInfo {
  name: string;
  phone: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [phase, setPhase] = useState<ChatPhase>('form');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionIdRef = useRef<string>('');
  
  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = `s_${Date.now()}`;
      localStorage.setItem('chat_session_id', sid);
    }
    sessionIdRef.current = sid;

    const convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setConversationId(convId);

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

  const handleFormSubmit = (data: UserInfo) => {
    setUserInfo(data);
    setPhase('chat');
  };

  const handleFormCancel = () => {
    window.history.back();
  };

  const handleRatingSubmit = async (rating: number, feedback?: string) => {
    console.log('Rating submitted:', { rating, feedback, conversationId, userInfo });
    setPhase('completed');
  };

  const handleRatingSkip = () => {
    setPhase('completed');
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionIdRef.current,
          conversation_id: conversationId,
          user_info: userInfo,
          conversation_history: conversationHistory
        }),
      });

      const data: ChatResponse = await response.json();

      try {
        const stored = [...newMessages];
        if (data?.reply) stored.push({ role: 'assistant', content: data.reply });
        localStorage.setItem(`chat:${sessionIdRef.current}`, JSON.stringify(stored));
      } catch (_) {}

      if (data?.reply) {
        const full = data.reply;
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

  if (phase === 'form') {
    return <PreChatForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} />;
  }

  if (phase === 'rating') {
    return <ConversationRating onSubmit={handleRatingSubmit} onSkip={handleRatingSkip} />;
  }

  if (phase === 'completed') {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <Bot className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Thank you!</h2>
          <p className="text-gray-600">
            Thank you for using our AI assistant. {userInfo?.name ? `${userInfo.name}, ` : ''}
            We'll follow up with you soon regarding your property inquiries.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex-1 p-4 md:p-6 overflow-hidden">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            AI Property Assistant
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Hi {userInfo?.name}! How can I help you find your perfect property today?
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4 flex-1 overflow-y-auto max-h-[50vh]">
          <div className="p-4 space-y-4">
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
            className="flex-1 p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="Ask about properties, prices, locations..."
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 transition-all duration-200 hover:shadow-lg disabled:hover:shadow-none"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Sending...</span>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </div>

        {messages.length === 1 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Quick Questions:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInput('Show me houses in Nairobi')}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-lg transition-colors"
              >
                Houses in Nairobi
              </button>
              <button
                onClick={() => setInput('What properties are under 5 million?')}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-lg transition-colors"
              >
                Under 5M
              </button>
              <button
                onClick={() => setInput('Tell me about land plots')}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-lg transition-colors"
              >
                Land Plots
              </button>
              <button
                onClick={() => setInput('How do I contact you?')}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-lg transition-colors"
              >
                Contact Info
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => setPhase('rating')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            End conversation and rate experience
          </button>
        </div>

        {properties.length > 0 && (
          <div className="mt-3 sm:mt-4 max-h-[25vh] sm:max-h-[30vh] overflow-y-auto flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">Matching Properties</h3>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {properties.slice(0, 3).map((p) => (
                <div key={p.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    {p.images && p.images[0] && (
                      <img src={p.images[0]} alt={p.title} className="w-full sm:w-20 h-20 sm:h-20 object-cover flex-shrink-0" />
                    )}
                    <div className="p-2 sm:p-3 flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{p.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{p.location}</p>
                      <p className="text-sm font-medium text-blue-600 mt-1">
                        KES {Number(p.price).toLocaleString()}
                      </p>
                      <Link
                        to={`/property/${p.id}`}
                        className="text-blue-600 hover:text-blue-700 text-xs mt-1 inline-block"
                      >
                        View Details →
                      </Link>
                    </div>
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
