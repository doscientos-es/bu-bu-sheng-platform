import { NextResponse } from "next/server";
import { z } from "zod";
import { getCustomerById } from "@/lib/dashboard-data";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const requestSchema = z.object({ promotionAssignmentId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const { data: assignment, error } = await getSupabaseAdmin()
      .from("customer_promotions")
      .update({ status: "prepared" })
      .eq("id", input.promotionAssignmentId)
      .select("customer_id")
      .single();
    if (error) throw error;
    return NextResponse.json(await getCustomerById(assignment.customer_id));
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Promoción no válida." }, { status: 400 });
    console.error("Unable to prepare customer promotion", error);
    return NextResponse.json({ error: "No se ha podido preparar la promoción." }, { status: 500 });
  }
}
