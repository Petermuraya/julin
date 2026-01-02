import React from 'react';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

interface Props {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<Props> = ({ messages, messagesEndRef }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4 flex-1 overflow-y-auto max-h-[50vh]">
    <div className="p-4 space-y-4">
      {messages.map((m, idx) => (
        <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] p-3 rounded-2xl ${
            m.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md'
          }`}>
            <div className="text-sm whitespace-pre-wrap">{m.content}</div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  </div>
);

export default ChatMessages;
