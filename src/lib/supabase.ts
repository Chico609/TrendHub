/**
 * @file src/lib/supabase.ts
 * @description Supabase client initialization for TrendHub
 * @author TrendHub Engineering
 *
 * Assumptions:
 * - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env
 * - RLS is enabled on all tables (see schema.sql)
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[TrendHub] Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
