import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bot, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
const Chat = React.lazy(() => import("./Chat"));

/* ───────────────── types ───────────────── */
interface ChatMessagePayload {
  new: {
    session_id: string;
    role: string;
    [key: string]: unknown;
  };
}

/* ───────────────── constants ───────────────── */
const CHAT_SESSION_KEY = "chat_session_id";
const UNREAD_KEY = "chat_unread";
const SOUND_KEY = "chat_sound_enabled";
const FIRST_VISIT_KEY = "chat_first_visit_done";
const ENABLE_REALTIME = import.meta.env.VITE_ENABLE_REALTIME === "true";

/* ───────────────── helpers ───────────────── */
const safeStorage = {
  get(key: string) {
    try {
      if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
        return sessionStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, value);
      }
    } catch {
      // ignore storage errors silently
    }
  },
};

/* ───────────────── component ───────────────── */
const ChatLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasNewMessage, setHasNewMessage] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(
    () => safeStorage.get(SOUND_KEY) !== "0"
  );

  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const channelRef = React.useRef<{ channel?: unknown; sb?: unknown } | null>(null);

  /* ───────────── init session & first visit ───────────── */
  React.useEffect(() => {
    let sid = safeStorage.get(CHAT_SESSION_KEY);
    if (!sid) {
      sid = `s_${Date.now()}`;
      safeStorage.set(CHAT_SESSION_KEY, sid);
    }

    if (!safeStorage.get(FIRST_VISIT_KEY)) {
      setIsOpen(true);
      safeStorage.set(FIRST_VISIT_KEY, "1");
    }

    setHasNewMessage(safeStorage.get(UNREAD_KEY) === "1");
  }, []);

  /* ───────────── sound ───────────── */
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
    } catch {
      /* ignore */
    }
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      safeStorage.set(SOUND_KEY, prev ? "0" : "1");
      return !prev;
    });
  };

  /* ───────────── unread handling ───────────── */
  const clearUnread = React.useCallback(() => {
    setHasNewMessage(false);
    safeStorage.set(UNREAD_KEY, "0");
  }, []);

  React.useEffect(() => {
    if (isOpen) clearUnread();
  }, [isOpen, clearUnread]);

  /* ───────────── realtime messages ───────────── */
  React.useEffect(() => {
    if (!ENABLE_REALTIME) return;
    let mounted = true;
    (async () => {
      try {
        const mod = await import("@/integrations/supabase/client");
        const sb = (mod as { supabase?: unknown }).supabase;
        if (!mounted) return;

        const channel = sb
          .channel("chat-launcher")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_messages" },
            (payload: ChatMessagePayload) => {
              const sid = safeStorage.get(CHAT_SESSION_KEY);
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
        // fail gracefully — realtime is optional
        // log the error for debugging
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
        // ignore cleanup errors but log for visibility
        console.warn('Failed to cleanup realtime channel', e);
      }
    };
  }, [isOpen, playBeep, clearUnread]);

  /* ───────────── UI ───────────── */
  return (
    <>
      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        aria-label={soundEnabled ? "Disable chat sound" : "Enable chat sound"}
        title={soundEnabled ? "Mute notifications" : "Enable notifications"}
        className="fixed bottom-24 right-6 z-50 h-9 w-9 rounded-full bg-white shadow-md flex items-center justify-center focus-visible:ring-2"
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4 text-slate-700" />
        ) : (
          <VolumeX className="h-4 w-4 text-slate-700" />
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            aria-label="Open AI property assistant"
            className="group fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-blue-600 shadow-xl hover:bg-blue-700 focus-visible:ring-2"
          >
            <div className="relative">
              <Bot className="h-7 w-7 text-white" />

              <AnimatePresence>
                {hasNewMessage && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 h-5 w-5"
                  >
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-60 animate-ping" />
                    <span className="absolute inset-[6px] rounded-full bg-red-500" />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="m-4 h-[90vh] max-w-6xl p-0">
          {/* Accessibility (required by Radix) */}
          <VisuallyHidden>
            <DialogTitle>chat Assistant</DialogTitle>
            <DialogDescription>
              Chat with the AI assistant about properties, pricing, and listings.
            </DialogDescription>
          </VisuallyHidden>

          <div className="h-full overflow-hidden">
            <React.Suspense fallback={<div className="p-4">Loading chat…</div>}>
              <Chat />
            </React.Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatLauncher;
