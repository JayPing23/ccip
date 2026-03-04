import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client (uses anon key + RLS)
// Use this in React components and client hooks
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
