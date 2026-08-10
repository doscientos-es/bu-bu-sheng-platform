import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { ruleFromRow } from "@/lib/loyalty";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const requestSchema = z.object({
  active: z.boolean(),
  rewardDescription: z.string().trim().min(2).max(500),
  rewardName: z.string().trim().min(2).max(120),
  id: z.string().uuid(),
  threshold: z.number().int().min(1).max(365).nullable(),
  validityDays: z.number().int().min(1).max(365),
});

export async function PATCH(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const { data, error } = await getSupabaseAdmin()
      .from("loyalty_rules")
      .update({
        active: input.active,
        threshold: input.threshold,
        reward_name: input.rewardName,
        reward_description: input.rewardDescription,
        validity_days: input.validityDays,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .select("id, type, active, threshold, reward_name, reward_description, validity_days")
      .single();
    if (error) throw error;
    return NextResponse.json(ruleFromRow(data));
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "La regla no es válida." }, { status: 400 });
    console.error("Unable to update loyalty rule", error);
    return NextResponse.json({ error: "No se ha podido actualizar la regla." }, { status: 500 });
  }
}
