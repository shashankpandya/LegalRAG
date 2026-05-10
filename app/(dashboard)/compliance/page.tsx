import { createClient } from "@/lib/supabase/server";
import { seedComplianceItems } from "@/lib/actions/compliance";
import { ComplianceChecklist } from "@/components/compliance/checklist";

const CATEGORY_LABELS: Record<string, string> = {
  incorporation: "Incorporation",
  tax: "Tax & Registration",
  employment: "Employment & Labour",
  annual: "Annual Filings",
  data_privacy: "Data Privacy (DPDP)",
};

const CATEGORY_ORDER = ["incorporation", "tax", "employment", "annual", "data_privacy"];

/**
 * Compliance page — auto-seeds checklist on first visit based on company type.
 * Groups items by category in a responsive grid.
 */
export default async function CompliancePage() {
  const supabase = await createClient();

  // Read existing compliance items
  let { data: items } = await supabase
    .from("compliance_items")
    .select("id, title, description, category, due_date, completed")
    .order("created_at", { ascending: true });

  // Auto-seed if empty
  if (!items || items.length === 0) {
    // Get user's company type from profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_type")
        .eq("id", user.id)
        .single();

      await seedComplianceItems(profile?.company_type);

      // Re-read after seeding
      const { data: seeded } = await supabase
        .from("compliance_items")
        .select("id, title, description, category, due_date, completed")
        .order("created_at", { ascending: true });

      items = seeded || [];
    }
  }

  // Group by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    items: (items || []).filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance Checklist</h1>
        <p className="text-muted-foreground">
          Track your regulatory requirements. Items are auto-generated based on your company type.
        </p>
      </div>

      {grouped.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {grouped.map((group) => (
            <ComplianceChecklist
              key={group.category}
              label={group.label}
              items={group.items}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="font-medium">No compliance items</p>
          <p className="text-sm text-muted-foreground mt-1">
            Set your company type in your profile to get a personalized checklist.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        ⚖️ This checklist is for general guidance only. Requirements vary by state,
        industry, and circumstances. Consult a qualified professional.
      </p>
    </div>
  );
}
