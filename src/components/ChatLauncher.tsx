import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Chat from "./Chat";
import { supabase } from "@/integrations/supabase/client";

const CHAT_SESSION_KEY = 'chat_session_id';
const UNREAD_KEY = 'chat_unread';
const SOUND_KEY = 'chat_sound_enabled';
const FIRST_VISIT_KEY = 'chat_first_visit_done';
const ENABLE_REALTIME = import.meta.env.VITE_ENABLE_REALTIME === "true";

const ChatLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(SOUND_KEY);
      return raw === null ? true : raw === '1';
    } catch (e) {
      return true;
    }
  });

  const channelRef = useRef<ReturnType<typeof supabase['channel']> | null>(null);

  type RealtimePayload = { new?: { session_id?: string; role?: string; [key: string]: unknown } | null };

  // Ensure a stable session id exists so both Chat and launcher can listen
  useEffect(() => {
    try {
      let sid = localStorage.getItem(CHAT_SESSION_KEY);
      if (!sid) {
        sid = `s_${Date.now()}`;
        localStorage.setItem(CHAT_SESSION_KEY, sid);
      }

      // Auto-open chat on first visit
      const seen = localStorage.getItem(FIRST_VISIT_KEY);
      if (!seen) {
        setIsOpen(true);
        localStorage.setItem(FIRST_VISIT_KEY, '1');
      }

      // Initialize unread indicator from persisted state
      const unread = localStorage.getItem(UNREAD_KEY) === '1';
      setHasNewMessage(unread);
    } catch (err: unknown) {
      // Storage may be unavailable in some environments; log for debugging
      console.warn('ChatLauncher: storage access failed', err);
    }
    // run once on mount
  }, []);

  const playBeep = useCallback(() => {
    try {
      // Simple beep using WebAudio API
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 650;
      g.gain.value = 0.02;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 120);
    } catch (err: unknown) {
      console.warn('ChatLauncher: audio playback failed', err);
    }
  }, []);

  // Toggle sound preference
  const toggleSound = useCallback(() => {
    setSoundEnabled((v) => {
      const nv = !v;
      try { localStorage.setItem(SOUND_KEY, nv ? '1' : '0'); } catch (err: unknown) { console.warn('ChatLauncher: failed to persist sound setting', err); }
      return nv;
    });
  }, []);

  const clearIndicator = useCallback(() => {
    setHasNewMessage(false);
    try { localStorage.setItem(UNREAD_KEY, '0'); } catch (err: unknown) { console.warn('ChatLauncher: failed to persist unread state', err); }
  }, []);

  // When dialog is opened, clear unread state
  useEffect(() => {
    if (isOpen) clearIndicator();
  }, [isOpen, clearIndicator]);

  // Subscribe to Supabase realtime chat_messages INSERT events
  useEffect(() => {
    if (!ENABLE_REALTIME) return;

    let channel: ReturnType<typeof supabase['channel']> | undefined;
    try {
      channel = supabase
        .channel("chat-launcher-messages")
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          (payload: RealtimePayload) => {
            try {
              const sid = localStorage.getItem(CHAT_SESSION_KEY);
              const newMsg = payload?.new;
              if (!newMsg) return;

              // Only consider assistant messages for our session
              if (newMsg.session_id === sid && newMsg.role === 'assistant') {
                const open = isOpen;
                if (!open) {
                  setHasNewMessage(true);
                  try { localStorage.setItem(UNREAD_KEY, '1'); } catch (err: unknown) { console.warn('ChatLauncher: failed to persist unread state', err); }
                  if (soundEnabled) playBeep();
                } else {
                  clearIndicator();
                }
              }
            } catch (err: unknown) {
              console.warn('ChatLauncher: failed processing realtime payload', err);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch (err) {
      console.warn('Realtime subscription failed:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel as ReturnType<typeof supabase['channel']>);
      } catch (err: unknown) {
        console.warn('ChatLauncher: failed to remove realtime channel', err);
      }
    };
  }, [isOpen, playBeep, soundEnabled, clearIndicator]);

  return (
    <>
      {/* Small sound toggle above the main button */}
      <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2">
        <button
          aria-label={soundEnabled ? 'Disable chat sound' : 'Enable chat sound'}
          onClick={toggleSound}
          className="h-8 w-8 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-105 transition-transform"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4 text-slate-700" /> : <VolumeX className="h-4 w-4 text-slate-700" />}
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            aria-label="Open AI property assistant"
            className="group fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full 
                       bg-blue-600 shadow-xl transition-all duration-300 
                       hover:bg-blue-700 hover:shadow-2xl
                       focus-visible:ring-2 focus-visible:ring-blue-400 
                       focus-visible:ring-offset-2"
          >
            <div className="relative">
              <Bot className="h-7 w-7 text-white" />

              <AnimatePresence>
                {hasNewMessage && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="absolute -top-1 -right-1 h-5 w-5"
                  >
                    {/* Pulse animation: ping + dot */}
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-60 animate-ping" />
                    <span className="absolute inset-[6px] rounded-full bg-red-500" />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Tooltip */}
            <span
              className="pointer-events-none absolute bottom-full right-0 mb-2
                         hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1
                         text-sm text-white opacity-0 transition-opacity
                         group-hover:block group-hover:opacity-100"
            >
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
    </>
  );
};

export default ChatLauncher;
