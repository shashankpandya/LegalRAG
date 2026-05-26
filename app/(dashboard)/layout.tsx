import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { Sidebar } from "@/components/shared/sidebar";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: chats } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(30);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DisclaimerBanner />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" data-onboarding="ask-question">
          {children}
        </main>
        <DashboardShell chats={chats || []} userEmail={user.email ?? ""} />
      </div>
    </div>
  );
}
