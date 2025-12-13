import React, { useEffect, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  const sessionIdRef = useRef<string>('');
  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = `s_${Date.now()}`;
      localStorage.setItem('chat_session_id', sid);
    }
    sessionIdRef.current = sid;
    // Load conversation from server (if any)
    (async () => {
      try {
        const r = await fetch(`/api/chats/${encodeURIComponent(sid)}`);
        if (!r.ok) return;
        const d = await r.json();
        if (Array.isArray(d.messages)) {
          const msgs: Message[] = d.messages.map((m: any) => ({ role: m.role, content: m.content }));
          setMessages(msgs);
        }
      } catch (_) {}
    })();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionIdRef.current }),
      });
      const data = await res.json();

      // Persist to localStorage as backup
      try {
        const stored = JSON.parse(localStorage.getItem(`chat:${sessionIdRef.current}`) || '[]');
        stored.push({ role: 'user', content: text });
        if (data?.reply) stored.push({ role: 'assistant', content: data.reply });
        localStorage.setItem(`chat:${sessionIdRef.current}`, JSON.stringify(stored));
      } catch (_) {}

      // Show assistant reply using a typewriter-style reveal
      if (data?.reply) {
        const full = data.reply as string;
        let cur = '';
        setMessages((m) => [...m, { role: 'assistant', content: '' }]);
        const interval = setInterval(() => {
          cur = full.slice(0, cur.length + Math.max(1, Math.floor(full.length / 60)));
          setMessages((m) => {
            const copy = [...m];
            // replace last assistant placeholder
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === 'assistant') {
                copy[i] = { role: 'assistant', content: cur };
                break;
              }
            }
            return copy;
          });
          if (cur.length >= full.length) clearInterval(interval);
        }, 40);
      } else if (data?.error) {
        setMessages((m) => [...m, { role: 'assistant', content: `Error: ${data.error}` }]);
      }

      if (Array.isArray(data?.properties)) setProperties(data.properties);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Unexpected error contacting chat API.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">AI Property Assistant</h2>

      <div className="space-y-3 mb-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-slate-100 self-end' : 'bg-white border'} `}
          >
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
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
          className="flex-1 p-2 border rounded"
          placeholder="Ask about properties, prices, images..."
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>

      {properties.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Matching Properties</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {properties.map((p) => (
              <div key={p.id || JSON.stringify(p)} className="border rounded p-3">
                {p.images && p.images[0] && (
                  <img src={p.images[0]} alt={p.title} className="w-full h-36 object-cover rounded mb-2" />
                )}
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm text-slate-600">{p.location}</div>
                <div className="text-sm mt-1">Price: {p.price ?? 'N/A'}</div>
                <a href={`#/property/${p.id}`} className="text-blue-600 text-sm mt-2 inline-block">
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
