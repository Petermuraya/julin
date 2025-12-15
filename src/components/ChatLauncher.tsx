import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Chat from "./Chat";

const NEW_MESSAGE_CHECK_INTERVAL = 30_000;
const NEW_MESSAGE_PROBABILITY = 0.1;
const NEW_MESSAGE_DURATION = 3_000;

const ChatLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearIndicator = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHasNewMessage(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      clearIndicator();
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() < NEW_MESSAGE_PROBABILITY) {
        setHasNewMessage(true);
        timeoutRef.current = setTimeout(clearIndicator, NEW_MESSAGE_DURATION);
      }
    }, NEW_MESSAGE_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isOpen, clearIndicator]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          aria-label="Open AI property assistant"
          className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-blue-600 shadow-xl transition-all duration-300 hover:bg-blue-700 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          <div className="relative">
            <Bot className="h-7 w-7 text-white" />

            <AnimatePresence>
              {hasNewMessage && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Tooltip */}
          <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1 text-sm text-white opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100">
            Ask about properties
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="m-4 h-[90vh] max-h-[90vh] max-w-6xl p-0 sm:m-6">
        <div className="h-full overflow-hidden">
          <Chat />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatLauncher;
