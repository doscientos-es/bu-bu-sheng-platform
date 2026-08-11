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

const idSchema = z.string().uuid();

type RouteContext = { params: Promise<{ id: string }> };

type NoteRow = {
  id: string;
  document_number: string | null;
  document_date: string | null;
  image_path: string | null;
  extraction_confidence: number | string | null;
  suppliers: Array<{ name: string }> | { name: string } | null;
  delivery_note_items: Array<{
    id: string;
    raw_description: string;
    quantity: number | string | null;
    unit_price: number | string | null;
  }>;
};

function bucketName() {
  return process.env.SUPABASE_DELIVERY_NOTES_BUCKET || "albaranes";
}

function supplierName(row: NoteRow) {
  if (Array.isArray(row.suppliers)) return row.suppliers[0]?.name ?? "";
  return row.suppliers?.name ?? "";
}

async function loadNoteRow(supabase: ReturnType<typeof getSupabaseAdmin>, id: string) {
  const result = await supabase
    .from("delivery_notes")
    .select(
      "id, document_number, document_date, image_path, extraction_confidence, suppliers(name), delivery_note_items(id, raw_description, quantity, unit_price)",
    )
    .eq("id", id)
    .eq("organization_id", DEMO_ORGANIZATION_ID)
    .maybeSingle();
  if (result.error) throw result.error;
  return (result.data as NoteRow | null) ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = idSchema.parse((await context.params).id);
    const supabase = getSupabaseAdmin();
    const row = await loadNoteRow(supabase, id);
    if (!row) return NextResponse.json({ error: "Albarán no encontrado." }, { status: 404 });

    const draft: DeliveryNoteDraft = {
      supplier: supplierName(row),
      date: row.document_date ?? new Date().toISOString().slice(0, 10),
      documentNumber: row.document_number ?? "",
      total: null,
      confidence:
        row.extraction_confidence === null ? null : Number(row.extraction_confidence),
      lines: row.delivery_note_items.map((item) => ({
        description: item.raw_description,
        id: item.id,
        quantity: item.quantity === null ? null : Number(item.quantity),
        unitPrice: item.unit_price === null ? null : Number(item.unit_price),
      })),
    };

    let imageUrl: string | null = null;
    if (row.image_path) {
      const signed = await supabase.storage
        .from(bucketName())
        .createSignedUrl(row.image_path, 60 * 10);
      imageUrl = signed.data?.signedUrl ?? null;
    }

    return NextResponse.json({ draft, imageUrl });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Albarán no válido." }, { status: 400 });
    console.error("Unable to load delivery note", error);
    return NextResponse.json({ error: "No se ha podido cargar el albarán." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const id = idSchema.parse((await context.params).id);
    const supabase = getSupabaseAdmin();
    const row = await loadNoteRow(supabase, id);
    if (!row) return NextResponse.json({ error: "Albarán no encontrado." }, { status: 404 });

    const draft = deliveryNoteDraftSchema.parse(await request.json()) as DeliveryNoteDraft;
    const supplierId = await resolveSupplierId(supabase, draft.supplier);
    const productIdsByName = await resolveProducts(supabase, supplierId, draft.lines);
    const previousPrices = await findPreviousPrices(
      supabase,
      supplierId,
      [...productIdsByName.values()],
      id,
    );
    const comparison = buildComparison(draft.lines, productIdsByName, previousPrices);

    const noteUpdate = await supabase
      .from("delivery_notes")
      .update({
        supplier_id: supplierId,
        document_number: draft.documentNumber || null,
        document_date: dateOrToday(draft.date),
        extraction: { confirmed: draft },
        status: "validated",
      })
      .eq("id", id)
      .eq("organization_id", DEMO_ORGANIZATION_ID);
    if (noteUpdate.error) throw noteUpdate.error;

    const itemsDelete = await supabase
      .from("delivery_note_items")
      .delete()
      .eq("delivery_note_id", id);
    if (itemsDelete.error) throw itemsDelete.error;

    const items = draft.lines.map((line, index) => ({
      delivery_note_id: id,
      product_id: productIdsByName.get(normalizeProductName(line.description)) ?? null,
      raw_description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      previous_unit_price: comparison[index]?.previousUnitPrice ?? null,
      comparison_status: comparison[index]?.status ?? "review",
    }));
    const itemsInsert = await supabase.from("delivery_note_items").insert(items);
    if (itemsInsert.error) throw itemsInsert.error;

    return NextResponse.json({ comparison, note: await getDeliveryNoteById(id) });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Revisa los datos del albarán antes de guardarlo." },
        { status: 400 },
      );
    console.error("Unable to update delivery note", error);
    return NextResponse.json({ error: "No se ha podido actualizar el albarán." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = idSchema.parse((await context.params).id);
    const supabase = getSupabaseAdmin();
    const row = await loadNoteRow(supabase, id);
    if (!row) return NextResponse.json({ error: "Albarán no encontrado." }, { status: 404 });

    const noteDelete = await supabase
      .from("delivery_notes")
      .delete()
      .eq("id", id)
      .eq("organization_id", DEMO_ORGANIZATION_ID);
    if (noteDelete.error) throw noteDelete.error;

    if (row.image_path) {
      const removal = await supabase.storage.from(bucketName()).remove([row.image_path]);
      if (removal.error) console.error("Unable to remove delivery note file", removal.error);
    }

    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Albarán no válido." }, { status: 400 });
    console.error("Unable to delete delivery note", error);
    return NextResponse.json({ error: "No se ha podido eliminar el albarán." }, { status: 500 });
  }
}
