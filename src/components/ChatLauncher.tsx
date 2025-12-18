import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Chat from "./Chat";
import { supabase } from "@/integrations/supabase/client";

const CHAT_SESSION_KEY = "chat_session_id";
const UNREAD_KEY = "chat_unread";
const SOUND_KEY = "chat_sound_enabled";
const FIRST_VISIT_KEY = "chat_first_visit_done";
const ENABLE_REALTIME = import.meta.env.VITE_ENABLE_REALTIME === "true";

const ChatLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(SOUND_KEY);
      return raw === null ? true : raw === "1";
    } catch {
      return true;
    }
  });

  const channelRef = useRef<ReturnType<typeof supabase["channel"]> | null>(null);

  type RealtimePayload = {
    new?: { session_id?: string; role?: string };
  };

  useEffect(() => {
    try {
      let sid = localStorage.getItem(CHAT_SESSION_KEY);
      if (!sid) {
        sid = `s_${Date.now()}`;
        localStorage.setItem(CHAT_SESSION_KEY, sid);
      }

      if (!localStorage.getItem(FIRST_VISIT_KEY)) {
        setIsOpen(true);
        localStorage.setItem(FIRST_VISIT_KEY, "1");
      }

      setHasNewMessage(localStorage.getItem(UNREAD_KEY) === "1");
    } catch (err) {
      console.warn("ChatLauncher: storage access failed", err);
    }
  }, []);

  const playBeep = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 650;
      g.gain.value = 0.02;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 120);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((v) => {
      const nv = !v;
      try {
        localStorage.setItem(SOUND_KEY, nv ? "1" : "0");
      } catch {}
      return nv;
    });
  }, []);

  const clearIndicator = useCallback(() => {
    setHasNewMessage(false);
    try {
      localStorage.setItem(UNREAD_KEY, "0");
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen) clearIndicator();
  }, [isOpen, clearIndicator]);

  useEffect(() => {
    if (!ENABLE_REALTIME) return;

    const channel = supabase
      .channel("chat-launcher-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload: RealtimePayload) => {
          const sid = localStorage.getItem(CHAT_SESSION_KEY);
          const msg = payload.new;
          if (!msg) return;

          if (msg.session_id === sid && msg.role === "assistant") {
            if (!isOpen) {
              setHasNewMessage(true);
              localStorage.setItem(UNREAD_KEY, "1");
              if (soundEnabled) playBeep();
            } else {
              clearIndicator();
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, soundEnabled, playBeep, clearIndicator]);

  return (
    <>
      {/* Sound toggle */}
      <div className="fixed bottom-24 right-6 z-50">
        <button
          aria-label={soundEnabled ? "Disable chat sound" : "Enable chat sound"}
          onClick={toggleSound}
          className="h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center"
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-slate-700" />
          ) : (
            <VolumeX className="h-4 w-4 text-slate-700" />
          )}
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            aria-label="Open AI property assistant"
            className="group fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-blue-600 shadow-xl hover:bg-blue-700"
          >
            <div className="relative">
              <Bot className="h-7 w-7 text-white" />

              <AnimatePresence>
                {hasNewMessage && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
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
          <div className="h-full overflow-hidden">
            <Chat />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatLauncher;
