'use client';
import { useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import ScrollProgress from '@/components/ui/ScrollProgress';
import BackToTop from '@/components/ui/BackToTop';
import ChatLauncher from '@/components/chat/ChatLauncher';

export default function Providers({ children }: { children: React.ReactNode }) {
  const qcRef = useRef<QueryClient>();
  if (!qcRef.current) qcRef.current = new QueryClient();

  return (
    <QueryClientProvider client={qcRef.current}>
      <TooltipProvider>
        <ScrollProgress />
        <Toaster />
        <Sonner />
        {children}
        <ChatLauncher />
        <BackToTop />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
