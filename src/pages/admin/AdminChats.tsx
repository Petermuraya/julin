import React, { useEffect, useState } from 'react';

const AdminChats: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/chats')
      .then((r) => r.json())
      .then((d) => {
        if (d.conversations) setSessions(d.conversations);
        else if (d.sessions) setSessions(d.sessions);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/chats/${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => setMessages([]));
  }, [selected]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Chat Conversations</h2>
      <div className="flex gap-4">
        <div className="w-80 border rounded p-2 overflow-auto h-[60vh]">
          {sessions.length === 0 && <div className="text-sm text-muted-foreground">No conversations found.</div>}
          {sessions.map((s: any) => (
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
