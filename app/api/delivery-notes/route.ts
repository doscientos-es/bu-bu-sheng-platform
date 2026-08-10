import { getDeliveryNoteById } from "@/lib/dashboard-data";
import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { DeliveryNoteDraft, PriceComparison } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const storeSchema = z.string().uuid();
const decimalSchema = z.number().finite().nonnegative().nullable();
const draftSchema = z.object({
  supplier: z.string().trim().min(1, "Indica el proveedor."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indica una fecha válida."),
  documentNumber: z.string().trim(),
  total: decimalSchema,
  confidence: z.number().finite().min(0).max(1).nullable().optional(),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Cada línea necesita una descripción."),
        quantity: decimalSchema,
        unitPrice: decimalSchema,
      }),
    )
    .min(1, "Añade al menos una línea de producto."),
});

type ProductRow = { canonical_name: string; id: string };
type SupplierProductRow = { product_id: string; supplier_label: string };

function normalizeProductName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function resolveProducts(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  supplierId: string,
  lines: DeliveryNoteDraft["lines"],
) {
  const [productsResult, supplierProductsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, canonical_name")
      .eq("organization_id", DEMO_ORGANIZATION_ID),
    supabase
      .from("supplier_products")
      .select("product_id, supplier_label")
      .eq("supplier_id", supplierId),
  ]);
  if (productsResult.error) throw productsResult.error;
  if (supplierProductsResult.error) throw supplierProductsResult.error;

  const productByName = new Map(
    ((productsResult.data ?? []) as ProductRow[]).map((product) => [
      normalizeProductName(product.canonical_name),
      product.id,
    ]),
  );
  const supplierProductByName = new Map(
    ((supplierProductsResult.data ?? []) as SupplierProductRow[]).map((product) => [
      normalizeProductName(product.supplier_label),
      product.product_id,
    ]),
  );
  const productIds = new Map<string, string>();

  for (const line of lines) {
    const normalizedName = normalizeProductName(line.description);
    if (productIds.has(normalizedName)) continue;

    let productId = supplierProductByName.get(normalizedName) ?? productByName.get(normalizedName);
    if (!productId) {
      const productResult = await supabase
        .from("products")
        .insert({ canonical_name: line.description.trim(), organization_id: DEMO_ORGANIZATION_ID })
        .select("id")
        .single();
      if (productResult.error) throw productResult.error;
      productId = productResult.data.id;
    }
    if (!productId) throw new Error("No se ha podido identificar el producto.");

    if (!supplierProductByName.has(normalizedName)) {
      const mappingResult = await supabase.from("supplier_products").insert({
        product_id: productId,
        supplier_id: supplierId,
        supplier_label: line.description.trim(),
      });
      if (mappingResult.error) throw mappingResult.error;
    }
    productIds.set(normalizedName, productId);
  }

  return productIds;
}

async function findPreviousPrices(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  supplierId: string,
  productIds: string[],
) {
  if (!productIds.length) return new Map<string, number>();
  const historyResult = await supabase
    .from("delivery_notes")
    .select("document_date, created_at, delivery_note_items(product_id, unit_price)")
    .eq("organization_id", DEMO_ORGANIZATION_ID)
    .eq("supplier_id", supplierId)
    .order("document_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (historyResult.error) throw historyResult.error;

  const previousPrices = new Map<string, number>();
  for (const note of historyResult.data ?? []) {
    for (const item of note.delivery_note_items ?? []) {
      if (
        item.product_id &&
        productIds.includes(item.product_id) &&
        item.unit_price !== null &&
        !previousPrices.has(item.product_id)
      ) {
        previousPrices.set(item.product_id, Number(item.unit_price));
      }
    }
  }
  return previousPrices;
}

function comparePrice(
  current: number | null,
  previous: number | undefined,
): PriceComparison["status"] {
  if (current === null) return "review";
  if (previous === undefined) return "unmatched";
  if (Math.abs(current - previous) < 0.0001) return "same";
  return current > previous ? "higher" : "lower";
}

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

    const draft = draftSchema.parse(
      JSON.parse(String(formData.get("draft") ?? "{}")),
    ) as DeliveryNoteDraft;
    const supplierName = draft.supplier;
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

    const productIdsByName = await resolveProducts(supabase, supplierId, draft.lines);
    const previousPrices = await findPreviousPrices(
      supabase,
      supplierId,
      [...productIdsByName.values()],
    );
    const comparison: PriceComparison[] = draft.lines.map((line) => {
      const productId = productIdsByName.get(normalizeProductName(line.description));
      const previousUnitPrice = productId ? previousPrices.get(productId) : undefined;
      return {
        description: line.description,
        previousUnitPrice: previousUnitPrice ?? null,
        status: comparePrice(line.unitPrice, previousUnitPrice),
        unitPrice: line.unitPrice,
      };
    });

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
