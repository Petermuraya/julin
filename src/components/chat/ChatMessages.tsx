import React from 'react';
import { Bot, User } from 'lucide-react';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

interface Props {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<Props> = ({ messages, messagesEndRef }) => (
  <div className="bg-muted/30 rounded-xl border border-border shadow-sm mb-4 flex-1 overflow-y-auto">
    <div className="p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Start a conversation by typing a message below.</p>
          <p className="text-xs mt-2">Ask about properties, locations, prices, or get help with your search!</p>
        </div>
      )}
      {messages.map((m, idx) => (
        <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {m.role !== 'user' && (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className={`max-w-[80%] p-3 rounded-2xl ${
            m.role === 'user' 
              ? 'bg-primary text-primary-foreground rounded-br-md' 
              : 'bg-background border border-border text-foreground rounded-bl-md shadow-sm'
          }`}>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
          </div>
          {m.role === 'user' && (
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  </div>
);

export default ChatMessages;
