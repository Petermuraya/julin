import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { PreChatForm } from './PreChatForm';
import { ConversationRating } from './ConversationRating';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';

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
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
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
      const welcomeMessage = userRole === 'admin' 
        ? "Hello Admin! I'm your AI property assistant with enhanced capabilities. You can:\n\n• Search and manage properties\n• Access admin commands (type 'analytics' or 'summary')\n• Get detailed analytics and reports\n• Manage listings and inquiries\n• Use the full analytics dashboard"
        : "Hello! I'm your AI property assistant. Ask me about properties, prices, or locations. For example:\n\n• 'Show me houses in Nairobi'\n• 'Land under 5 million'\n• 'Available plots'";
      
      setMessages([{
        role: 'assistant',
        content: welcomeMessage
      }]);
    }
  }, [userRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check authentication and user role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        const isAdmin = !!roleData;
        setUserRole(isAdmin ? 'admin' : 'user');

        // For admins, skip the form and set user info automatically
        if (isAdmin) {
          setUserInfo({
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Admin',
            phone: session.user.user_metadata?.phone || 'Admin'
          });
          setPhase('chat');
        }
      } else {
        setUserRole(null);
      }
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .maybeSingle();
          
          const isAdmin = !!roleData;
          setUserRole(isAdmin ? 'admin' : 'user');

          // For admins, skip the form and set user info automatically
          if (isAdmin) {
            setUserInfo({
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Admin',
              phone: session.user.user_metadata?.phone || 'Admin'
            });
            setPhase('chat');
          }
        } else {
          setUserRole(null);
          // Reset to form phase when user logs out
          if (phase !== 'form') {
            setPhase('form');
            setUserInfo(null);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [phase]);

  // Create conversation in database when chat starts
  const createConversation = async () => {
    if (!conversationId || !userInfo) return;
    
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .upsert({
          id: conversationId,
          user_display_name: userInfo.name,
          started_at: new Date().toISOString(),
          last_message: null,
          summary: JSON.stringify({ phone: userInfo.phone, is_admin: userRole === 'admin' })
        }, { onConflict: 'id' });

      if (error) console.error('Error creating conversation:', error);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Save message to database
  const saveMessage = async (role: string, content: string) => {
    if (!conversationId) return;
    
    try {
      const messageData = {
        session_id: conversationId,
        role,
        content,
        metadata: { user_info: userInfo } as any
      };
      
      const { error } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (error) console.error('Error saving message:', error);

      // Update last message in conversation
      await supabase
        .from('chat_conversations')
        .update({ last_message: content.substring(0, 100) })
        .eq('id', conversationId);
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  };

  const handleFormSubmit = async (data: UserInfo) => {
    setUserInfo(data);
    setPhase('chat');
    
    // Create conversation after form submit
    setTimeout(async () => {
      try {
        await supabase
          .from('chat_conversations')
          .upsert({
            id: conversationId,
            user_display_name: data.name,
            started_at: new Date().toISOString(),
            last_message: null,
            summary: JSON.stringify({ phone: data.phone, is_admin: false })
          }, { onConflict: 'id' });
      } catch (err) {
        console.error('Failed to create conversation:', err);
      }
    }, 100);
  };

  const handleFormCancel = () => {
    window.history.back();
  };

  const handleRatingSubmit = async (rating: number, feedback?: string) => {
    console.log('Rating submitted:', { rating, feedback, conversationId, userInfo });
    
    // Save rating to conversation summary
    try {
      const { data: convData } = await supabase
        .from('chat_conversations')
        .select('summary')
        .eq('id', conversationId)
        .single();

      let existingSummary = {};
      if (convData?.summary) {
        try {
          existingSummary = JSON.parse(convData.summary);
        } catch {}
      }

      await supabase
        .from('chat_conversations')
        .update({
          summary: JSON.stringify({
            ...existingSummary,
            rating,
            feedback,
            rated_at: new Date().toISOString()
          })
        })
        .eq('id', conversationId);
    } catch (err) {
      console.error('Failed to save rating:', err);
    }
    
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

    // Save user message to database
    await saveMessage('user', text);

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
          user_role: userRole,
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
        
        // Save assistant message to database
        await saveMessage('assistant', full);
        
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
        <ChatHeader userRole={userRole} userInfo={userInfo} />

        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />

        <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} loading={loading} />

        {messages.length === 1 && userRole === 'admin' && (
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">Admin Commands:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInput('analytics')}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs rounded-lg transition-colors"
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setInput('summary')}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs rounded-lg transition-colors"
              >
                📈 Summary
              </button>
              <button
                onClick={() => setInput('admin help')}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs rounded-lg transition-colors"
              >
                ❓ Help
              </button>
              <button
                onClick={() => setInput('Show me houses in Nairobi')}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-lg transition-colors"
              >
                Houses in Nairobi
              </button>
            </div>
          </div>
        )}

        {messages.length === 1 && userRole !== 'admin' && (
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

        <div className="mt-4 text-center space-y-2">
          {userRole === 'admin' && (
            <div className="flex justify-center gap-4">
              <Link
                to="/admin/chats"
                className="text-sm text-purple-600 hover:text-purple-700 underline"
              >
                View Full Analytics Dashboard
              </Link>
            </div>
          )}
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