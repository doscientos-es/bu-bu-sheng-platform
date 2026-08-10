import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeWithAzure } from "@/lib/azure-ocr";
import { getDeliveryNoteById } from "@/lib/dashboard-data";
import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const storeSchema = z.string().uuid();

function dateOrToday(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10);
}

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

    const extracted = await analyzeWithAzure(file);
    const supplierName = extracted.supplier || "Proveedor no identificado";
    const { data: existingSupplier, error: supplierLookupError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .ilike("name", supplierName)
      .maybeSingle();
    if (supplierLookupError) throw supplierLookupError;
    let supplierId = existingSupplier?.id;
    if (!supplierId) {
      const createdSupplier = await supabase
        .from("suppliers")
        .insert({ organization_id: DEMO_ORGANIZATION_ID, name: supplierName })
        .select("id")
        .single();
      if (createdSupplier.error) throw createdSupplier.error;
      supplierId = createdSupplier.data.id;
    }

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
        document_number: extracted.documentNumber || null,
        document_date: dateOrToday(extracted.date),
        image_path: storagePath,
        extraction: extracted.raw,
        extraction_confidence: extracted.confidence,
        status: "review",
      })
      .select("id")
      .single();
    if (noteInsert.error) throw noteInsert.error;

    if (extracted.lines.length) {
      const items = extracted.lines.map((line) => ({
        delivery_note_id: noteInsert.data.id,
        raw_description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        previous_unit_price: null,
        comparison_status: "review" as const,
      }));
      const itemInsert = await supabase.from("delivery_note_items").insert(items);
      if (itemInsert.error) throw itemInsert.error;
    }

    return NextResponse.json(await getDeliveryNoteById(noteInsert.data.id), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Selecciona una cafetería válida." }, { status: 400 });
    console.error("Unable to create delivery note", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se ha podido analizar el albarán." },
      { status: 502 },
    );
  }
}
