import React, { useEffect, useState } from 'react';

interface Session {
  id?: string;
  session_id?: string;
  user_display_name?: string;
  started_at?: string;
  last_at?: string;
  last_message?: string;
}

interface ChatMessage {
  id: string;
  role?: string;
  content?: string;
  created_at?: string;
}

const AdminChats: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    fetch('/api/chats')
      .then((r) => r.json())
      .then((d: unknown) => {
        const res = d as { conversations?: Session[]; sessions?: Session[] };
        if (res.conversations) setSessions(res.conversations);
        else if (res.sessions) setSessions(res.sessions);
      })
      .catch((err) => { console.warn('Failed to load chats', err); });
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/chats/${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d: unknown) => {
        const res = d as { messages?: ChatMessage[] };
        setMessages(res.messages || []);
      })
      .catch((err) => { console.warn('Failed to load chat messages', err); setMessages([]); });
  }, [selected]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Chat Conversations</h2>
      <div className="flex gap-4">
        <div className="w-80 border rounded p-2 overflow-auto h-[60vh]">
          {sessions.length === 0 && <div className="text-sm text-muted-foreground">No conversations found.</div>}
          {sessions.map((s) => (
            <div
              key={s.id || s.session_id}
              className={`p-2 rounded mb-2 cursor-pointer ${selected === (s.id || s.session_id) ? 'bg-muted' : 'hover:bg-muted/50'}`}
              onClick={() => setSelected(s.id || s.session_id)}
            >
              <div className="text-sm font-medium">{s.user_display_name || s.session_id || s.id}</div>
              <div className="text-xs text-muted-foreground">{s.started_at || s.last_at || ''}</div>
              <div className="text-xs text-muted-foreground truncate">{s.last_message || ''}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 border rounded p-3 h-[60vh] overflow-auto">
          {!selected && <div className="text-slate-500">Select a conversation to view messages.</div>}
          {messages.map((m) => (
            <div key={m.id} className="mb-3">
              <div className="text-xs text-slate-500">{m.role} • {new Date(m.created_at).toLocaleString()}</div>
              <div className="p-2 bg-white border rounded mt-1 whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminChats;
