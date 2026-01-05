import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface Props {
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  loading: boolean;
}

const ChatInput: React.FC<Props> = ({ input, setInput, sendMessage, loading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && input.trim()) {
      sendMessage();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about properties, locations, prices..."
          disabled={loading}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
          aria-label="Type your message"
        />
      </div>
      <Button 
        type="submit"
        disabled={loading || !input.trim()}
        size="icon"
        className="h-12 w-12 rounded-xl"
        aria-label="Send message"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
};

export default ChatInput;
