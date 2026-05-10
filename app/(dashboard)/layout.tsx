import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { Sidebar } from "@/components/shared/sidebar";

/**
 * Dashboard layout — renders sidebar + disclaimer banner + page content.
 *
 * Server Component: reads user via getUser() for defense in depth
 * (middleware also guards, but we double-check here).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DisclaimerBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
