import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Bot } from 'lucide-react';
import Chat from './Chat';

const ChatLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Simulate occasional "new message" indicator
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly show the indicator (reduced frequency)
      if (Math.random() < 0.1 && !isOpen) {
        setHasNewMessage(true);
        setTimeout(() => setHasNewMessage(false), 3000);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className={`fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 group ${
            hasNewMessage ? 'animate-pulse bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          aria-label="Open AI property assistant"
        >
          <div className="relative">
            <Bot className="h-7 w-7 text-white" />
            {hasNewMessage && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping"></div>
            )}
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Ask about properties
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] p-0">
        <div className="h-full">
          <Chat />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatLauncher;