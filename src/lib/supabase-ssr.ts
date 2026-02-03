// SSR-safe Supabase client
// This wrapper ensures Supabase works during SSG build (Node.js) and in browser

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ssrSafeStorage, isBrowser } from "./ssr-storage";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

// Create SSR-safe Supabase client
// - During SSG: Uses no-op storage, no session persistence
// - In browser: Uses localStorage, full session persistence
export const supabaseSSR = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: ssrSafeStorage,
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
    },
  }
);
