// src/contexts/AuthContextValue.ts
import React, { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export type AuthContextValue = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
  signInWithEmail: async () => { /* noop */ },
  signOut: async () => { /* noop */ },
});

export const useAuth = () => useContext(AuthContext);