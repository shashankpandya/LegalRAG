"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Toggle a compliance item's completed status.
 */
export async function toggleItem(itemId: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("compliance_items")
    .update({ completed })
    .eq("id", itemId);

  if (error) throw new Error(`Failed to update: ${error.message}`);

  revalidatePath("/compliance");
}

/**
 * Seed compliance items for the current user based on their company type.
 */
export async function seedComplianceItems(companyType?: string | null) {
  const { getDefaultChecklist } = await import("@/lib/compliance/seed");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const items = getDefaultChecklist(companyType);

  const rows = items.map((item) => ({
    user_id: user.id,
    title: item.title,
    description: item.description,
    category: item.category,
  }));

  const { error } = await supabase.from("compliance_items").insert(rows);

  if (error) throw new Error(`Failed to seed compliance items: ${error.message}`);

  revalidatePath("/compliance");
}
