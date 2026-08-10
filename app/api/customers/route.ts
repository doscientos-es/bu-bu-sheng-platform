import { NextResponse } from "next/server";
import { z } from "zod";
import { getCustomerById } from "@/lib/dashboard-data";
import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const requestSchema = z.object({
  birthday: z.string().date(),
  consent: z.boolean(),
  email: z.string().email(),
  name: z.string().trim().min(2).max(120),
  storeId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("id", input.storeId)
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .maybeSingle();
    if (storeError) throw storeError;
    if (!store) return NextResponse.json({ error: "Cafetería no válida." }, { status: 400 });

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        organization_id: DEMO_ORGANIZATION_ID,
        store_id: store.id,
        full_name: input.name,
        email: input.email,
        birthday: input.birthday,
      })
      .select("id")
      .single();
    if (customerError) throw customerError;

    const { error: consentError } = await supabase.from("customer_consents").insert({
      customer_id: customer.id,
      channel: "email",
      granted: input.consent,
      granted_at: input.consent ? new Date().toISOString() : null,
    });
    if (consentError) throw consentError;
    return NextResponse.json(await getCustomerById(customer.id), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Datos de cliente no válidos." }, { status: 400 });
    console.error("Unable to create customer", error);
    return NextResponse.json({ error: "No se ha podido crear el cliente." }, { status: 500 });
  }
}
