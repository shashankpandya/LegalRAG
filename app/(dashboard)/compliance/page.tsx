import { createClient } from "@/lib/supabase/server";
import { seedComplianceItems } from "@/lib/actions/compliance";
import { ComplianceChecklist } from "@/components/compliance/checklist";
import { ComplianceProgress } from "@/components/compliance/compliance-progress";

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  incorporation: { label: "Incorporation", icon: "🏛️" },
  tax: { label: "Tax & Registration", icon: "💰" },
  employment: { label: "Employment & Labour", icon: "👥" },
  annual: { label: "Annual Filings", icon: "📋" },
  data_privacy: { label: "Data Privacy (DPDP)", icon: "🛡️" },
};

const CATEGORY_ORDER = ["incorporation", "tax", "employment", "annual", "data_privacy"];

export default async function CompliancePage() {
  const supabase = await createClient();

  let { data: items } = await supabase
    .from("compliance_items")
    .select("id, title, description, category, due_date, completed")
    .order("created_at", { ascending: true });

  if (!items || items.length === 0) {
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

      const { data: seeded } = await supabase
        .from("compliance_items")
        .select("id, title, description, category, due_date, completed")
        .order("created_at", { ascending: true });

      items = seeded || [];
    }
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat]?.label || cat,
    icon: CATEGORY_LABELS[cat]?.icon || "📄",
    items: (items || []).filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  const totalItems = items?.length ?? 0;
  const completedItems = items?.filter((i) => i.completed).length ?? 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="page-title">Compliance Checklist</h1>
        <p className="page-description">
          Track your regulatory requirements. Items are auto-generated based on your company type.
        </p>
      </div>

      {totalItems > 0 && (
        <ComplianceProgress totalItems={totalItems} initialCompleted={completedItems} />
      )}

      {grouped.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {grouped.map((group) => (
            <div key={group.category} className="animate-fade-up">
              <ComplianceChecklist
                label={group.label}
                items={group.items}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <span className="text-xl">📋</span>
          </div>
          <p className="font-semibold">No compliance items</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs text-balance">
            Set your company type in your profile to get a personalized compliance checklist.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-balance flex items-center gap-1.5">
        <span className="text-base">⚖️</span>
        This checklist is for general guidance only. Requirements vary by state, industry, and circumstances.
        Consult a qualified professional.
      </p>
    </div>
  );
}
