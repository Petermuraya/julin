import React from 'react';

interface Props {
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  loading: boolean;
}

const ChatInput: React.FC<Props> = ({ input, setInput, sendMessage, loading }) => (
  <div className="flex gap-2">
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
      placeholder="Ask about properties, e.g. 'Show me houses in Nairobi'"
      className="flex-1 rounded-lg border border-border p-2"
    />
    <button
      onClick={sendMessage}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
    >
      {loading ? 'Sending...' : 'Send'}
    </button>
  </div>
);

export default ChatInput;
