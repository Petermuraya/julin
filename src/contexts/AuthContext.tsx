import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from './AuthContextValue.ts';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      if (!mounted) return;
      setUser(u);

      if (u) {
        // Check user_roles table for admin role
        try {
          const { data: roleData, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', u.id)
            .eq('role', 'admin')
            .maybeSingle();

          setIsAdmin(!!roleData);
        } catch (e) {
          console.error('Failed to check user role', e);
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', u.id)
            .eq('role', 'admin')
            .maybeSingle();

          setIsAdmin(!!roleData);
        } catch (e) {
          console.error('Failed to check user role', e);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password?: string) => {
    // Delegates to Supabase magic link or password flow depending on your setup
    await supabase.auth.signInWithOtp({ email });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
