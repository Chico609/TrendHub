/**
 * @file src/contexts/AuthContext.tsx
 * @description Authentication context provider for TrendHub
 * Handles Supabase Auth session management and profile fetching
 * @author TrendHub Engineering
 */

import React, { createContext, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore, useThemeStore } from "@/store/authStore";

interface AuthContextValue {
  initialized: boolean;
}

const AuthContext = createContext<AuthContextValue>({ initialized: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setLoading, fetchProfile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  // Apply persisted theme on mount
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setLoading, fetchProfile]);

  return (
    <AuthContext.Provider value={{ initialized: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
