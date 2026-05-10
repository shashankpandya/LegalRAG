"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign out server action — clears the session and redirects to /login.
 * Called from the sidebar sign-out button.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
