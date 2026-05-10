"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Used only in "use client" components (sign-in/sign-up forms, chat window, upload).
 *
 * The anon key + RLS enforces row-level isolation — this is safe to run in the browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
