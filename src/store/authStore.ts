/**
 * @file src/store/authStore.ts
 * @description Zustand store for authentication state management in TrendHub
 * @author TrendHub Engineering
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      session: null,
      profile: null,
      loading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      fetchProfile: async (userId: string) => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (!error && data) {
          set({ profile: data });
        } else if (error?.code === 'PGRST116') {
          // Profile doesn't exist, create it with email username
          try {
            const user = await supabase.auth.getUser();
            const email = user.data.user?.email || '';
            const username = email.split('@')[0] || `user_${Date.now()}`;
            
            const { data: newProfile } = await supabase
              .from("profiles")
              .insert([{
                id: userId,
                username: username,
                display_name: username,
              }])
              .select()
              .single();

            if (newProfile) {
              set({ profile: newProfile });
            }
          } catch (insertError) {
            console.error('Failed to auto-create profile:', insertError);
          }
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null });
      },
    }),
    {
      name: "trendhub-auth",
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);

// Theme store
interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",

      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        document.documentElement.classList.toggle("dark", next === "dark");
      },

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle("dark", theme === "dark");
      },
    }),
    {
      name: "trendhub-theme",
    }
  )
);
