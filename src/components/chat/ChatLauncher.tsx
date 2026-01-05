import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageCircle, Volume2, VolumeX, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '@/contexts/AuthContextValue';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
const Chat = React.lazy(() => import("./Chat"));

interface ChatMessagePayload {
  new: {
    session_id: string;
    role: string;
    [key: string]: unknown;
  };
}

const CHAT_SESSION_KEY = "chat_session_id";
const UNREAD_KEY = "chat_unread";
const SOUND_KEY = "chat_sound_enabled";
const FIRST_VISIT_KEY = "chat_first_visit_done";
const ENABLE_REALTIME = import.meta.env.VITE_ENABLE_REALTIME === "true";

const safeStorage = {
  get(key: string) {
    try {
      if (typeof window === 'undefined') return null;
      if (typeof window.sessionStorage !== 'undefined') {
        const v = sessionStorage.getItem(key);
        if (v !== null) return v;
      }
      if (typeof window.localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      if (typeof window === 'undefined') return;
      try {
        if (typeof window.sessionStorage !== 'undefined') {
          sessionStorage.setItem(key, value);
          return;
        }
      } catch {}
      if (typeof window.localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {}
  },
};

const ChatLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasNewMessage, setHasNewMessage] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(
    () => safeStorage.get(SOUND_KEY) !== "0"
  );
  const [showTooltip, setShowTooltip] = React.useState(false);

  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const channelRef = React.useRef<{ channel?: unknown; sb?: unknown } | null>(null);

  const { isAdmin } = useAuth();

  React.useEffect(() => {
    let sid: string | null = null;
    if (isAdmin) sid = safeStorage.get(CHAT_SESSION_KEY);

    if (!sid) {
      sid = `s_${Date.now()}`;
      if (isAdmin) safeStorage.set(CHAT_SESSION_KEY, sid);
    }

    // Show tooltip after 3 seconds on first visit
    if (!safeStorage.get(FIRST_VISIT_KEY)) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 5000);
      }, 3000);
      safeStorage.set(FIRST_VISIT_KEY, "1");
      return () => clearTimeout(timer);
    }

    setHasNewMessage(safeStorage.get(UNREAD_KEY) === "1");
  }, [isAdmin]);

  const playBeep = React.useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 680;
      gain.gain.value = 0.03;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 120);
    } catch {}
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      safeStorage.set(SOUND_KEY, prev ? "0" : "1");
      return !prev;
    });
  };

  const clearUnread = React.useCallback(() => {
    setHasNewMessage(false);
    safeStorage.set(UNREAD_KEY, "0");
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      clearUnread();
      setShowTooltip(false);
    }
  }, [isOpen, clearUnread]);

  React.useEffect(() => {
    if (!ENABLE_REALTIME) return;
    const persistedSid = safeStorage.get(CHAT_SESSION_KEY);
    if (!persistedSid) return;
    let mounted = true;
    (async () => {
      try {
        const mod = await import("@/integrations/supabase/client");
        const sb = (mod as { supabase?: unknown }).supabase;
        if (!mounted) return;
        if (!sb || typeof (sb as any).channel !== 'function') {
          console.warn('Supabase realtime not available');
          return;
        }
        const channel = (sb as any)
          .channel("chat-launcher")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_messages" },
            (payload: ChatMessagePayload) => {
              const sid = persistedSid;
              const msg = payload.new;
              if (msg?.session_id === sid && msg?.role === "assistant") {
                if (!isOpen) {
                  setHasNewMessage(true);
                  safeStorage.set(UNREAD_KEY, "1");
                  playBeep();
                } else {
                  clearUnread();
                }
              }
            }
          )
          .subscribe();
        channelRef.current = { channel, sb };
      } catch (e) {
        console.warn('Realtime init failed', e);
      }
    })();
    return () => {
      mounted = false;
      try {
        const cur = channelRef.current;
        if (cur) {
          const { channel, sb } = cur;
          type ChannelWithUnsub = { unsubscribe?: () => void };
          type SupabaseLike = { removeChannel?: (c: ChannelWithUnsub) => void };
          if (channel && typeof (channel as ChannelWithUnsub).unsubscribe === 'function') {
            (channel as ChannelWithUnsub).unsubscribe();
          } else if (sb && typeof (sb as SupabaseLike).removeChannel === 'function') {
            (sb as SupabaseLike).removeChannel(channel as ChannelWithUnsub);
          }
        }
      } catch (e) {
        console.warn('Failed to cleanup realtime channel', e);
      }
    };
  }, [isOpen, playBeep, clearUnread]);

  return (
    <>
      <VisuallyHidden>
        <div aria-live="polite">{hasNewMessage ? 'New message received' : ''}</div>
      </VisuallyHidden>

      {/* Sound toggle */}
      <div className="fixed bottom-24 right-6 z-50">
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleSound}
          aria-label={soundEnabled ? "Disable chat sound" : "Enable chat sound"}
          className="h-9 w-9 rounded-full bg-background shadow-md border border-border"
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="fixed bottom-6 right-6 z-50">
            {/* Tooltip */}
            <AnimatePresence>
              {showTooltip && !isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full right-0 mb-3 w-64"
                >
                  <div className="bg-foreground text-background p-3 rounded-xl shadow-xl text-sm relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                      className="absolute top-1 right-1 p-1 hover:bg-background/20 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="font-medium mb-1">👋 Need help finding property?</p>
                    <p className="text-xs opacity-80">Chat with Mary, our AI assistant!</p>
                    <div className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-3 h-3 bg-foreground"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              size="icon"
              aria-label="Chat with our AI property assistant"
              className="group h-14 w-14 rounded-full bg-primary shadow-xl hover:bg-primary/90 hover:scale-105 transition-all duration-200"
            >
              <div className="relative">
                <MessageCircle className="h-6 w-6 text-primary-foreground" />
                <AnimatePresence>
                  {hasNewMessage && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1"
                    >
                      <span className="absolute inset-0 h-4 w-4 rounded-full bg-destructive opacity-60 animate-ping" />
                      <span className="absolute inset-0 h-4 w-4 rounded-full bg-destructive" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Button>
          </div>
        </DialogTrigger>

        <DialogContent className="h-[85vh] max-h-[700px] w-[95vw] max-w-2xl p-0 gap-0">
          <VisuallyHidden>
            <DialogTitle>Chat with Mary - AI Property Assistant</DialogTitle>
            <DialogDescription>
              Chat with our AI assistant about properties, pricing, and real estate in Kenya.
            </DialogDescription>
          </VisuallyHidden>

          <div className="h-full overflow-hidden rounded-lg">
            <React.Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading chat...</p>
                </div>
              </div>
            }>
              <Chat />
            </React.Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatLauncher;
