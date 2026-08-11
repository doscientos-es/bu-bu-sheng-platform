import { getDeliveryNoteById } from "@/lib/dashboard-data";
import {
  buildComparison,
  dateOrToday,
  deliveryNoteDraftSchema,
  findPreviousPrices,
  normalizeProductName,
  resolveProducts,
  resolveSupplierId,
} from "@/lib/delivery-notes";
import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { DeliveryNoteDraft } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const storeSchema = z.string().uuid();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const storeId = storeSchema.parse(formData.get("storeId"));
    const file = formData.get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "Adjunta una imagen o PDF." }, { status: 400 });
    if (file.size > 4 * 1024 * 1024)
      return NextResponse.json(
        { error: "El nivel gratuito de Azure admite archivos de hasta 4 MB." },
        { status: 413 },
      );

    const supabase = getSupabaseAdmin();
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .maybeSingle();
    if (storeError) throw storeError;
    if (!store) return NextResponse.json({ error: "Cafetería no válida." }, { status: 400 });

    const draft = deliveryNoteDraftSchema.parse(
      JSON.parse(String(formData.get("draft") ?? "{}")),
    ) as DeliveryNoteDraft;
    const supplierId = await resolveSupplierId(supabase, draft.supplier);

    const productIdsByName = await resolveProducts(supabase, supplierId, draft.lines);
    const previousPrices = await findPreviousPrices(supabase, supplierId, [
      ...productIdsByName.values(),
    ]);
    const comparison = buildComparison(draft.lines, productIdsByName, previousPrices);

    const storagePath = `${DEMO_ORGANIZATION_ID}/${storeId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const upload = await supabase.storage
      .from(process.env.SUPABASE_DELIVERY_NOTES_BUCKET || "albaranes")
      .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (upload.error) throw upload.error;

    const noteInsert = await supabase
      .from("delivery_notes")
      .insert({
        organization_id: DEMO_ORGANIZATION_ID,
        store_id: storeId,
        supplier_id: supplierId,
        document_number: draft.documentNumber || null,
        document_date: dateOrToday(draft.date),
        image_path: storagePath,
        extraction: { confirmed: draft },
        extraction_confidence: draft.confidence ?? null,
        status: "validated",
      })
      .select("id")
      .single();
    if (noteInsert.error) throw noteInsert.error;

    if (draft.lines.length) {
      const items = draft.lines.map((line, index) => ({
        delivery_note_id: noteInsert.data.id,
        product_id: productIdsByName.get(normalizeProductName(line.description)) ?? null,
        raw_description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        previous_unit_price: comparison[index]?.previousUnitPrice ?? null,
        comparison_status: comparison[index]?.status ?? "review",
      }));
      const itemInsert = await supabase.from("delivery_note_items").insert(items);
      if (itemInsert.error) throw itemInsert.error;
    }

    return NextResponse.json(
      { comparison, note: await getDeliveryNoteById(noteInsert.data.id) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Revisa los datos del albarán antes de guardarlo." },
        { status: 400 },
      );
    console.error("Unable to create delivery note", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se ha podido analizar el albarán." },
      { status: 502 },
    );
  }
}
