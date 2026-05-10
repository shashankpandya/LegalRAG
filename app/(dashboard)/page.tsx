// This file intentionally left as a re-export to avoid route conflicts.
// The actual dashboard page is at app/(dashboard)/dashboard/page.tsx.
// This file should NOT exist as a page — deleting would be ideal,
// but if Next.js requires it, this redirect prevents conflicts.

import { redirect } from "next/navigation";

export default function DashboardGroupRedirect() {
  redirect("/dashboard");
}
