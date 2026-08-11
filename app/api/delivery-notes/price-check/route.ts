import { comparePrice, findPreviousPrices, normalizeProductName } from "@/lib/delivery-notes";
import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { DeliveryNoteLineDraft } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const priceCheckSchema = z.object({
  supplier: z.string().trim().min(1),
  excludeNoteId: z.string().uuid().optional(),
  lines: z.array(
    z.object({
      description: z.string().trim().min(1),
      unitPrice: z.number().finite().nonnegative().nullable(),
    }),
  ),
});

type ProductRow = { canonical_name: string; id: string };
type SupplierProductRow = { product_id: string; supplier_label: string };

export async function POST(request: Request) {
  try {
    const draft = priceCheckSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const supplierResult = await supabase
      .from("suppliers")
      .select("id")
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .ilike("name", draft.supplier)
      .maybeSingle();
    if (supplierResult.error) throw supplierResult.error;
    if (!supplierResult.data) {
      return NextResponse.json({ comparison: toUnmatchedComparison(draft.lines) });
    }

    const [productsResult, supplierProductsResult] = await Promise.all([
      supabase.from("products").select("id, canonical_name").eq("organization_id", DEMO_ORGANIZATION_ID),
      supabase
        .from("supplier_products")
        .select("product_id, supplier_label")
        .eq("supplier_id", supplierResult.data.id),
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
    const productIds = draft.lines.map(
      (line) =>
        supplierProductByName.get(normalizeProductName(line.description)) ??
        productByName.get(normalizeProductName(line.description)),
    );
    const previousPrices = await findPreviousPrices(
      supabase,
      supplierResult.data.id,
      productIds.filter((productId): productId is string => Boolean(productId)),
      draft.excludeNoteId,
    );
    const comparison = draft.lines.map((line, index) => {
      const previous = productIds[index] ? previousPrices.get(productIds[index]) : undefined;
      return {
        description: line.description,
        previousUnitPrice: previous ?? null,
        status: comparePrice(line.unitPrice, previous),
        unitPrice: line.unitPrice,
      };
    });

    return NextResponse.json({ comparison });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "No se han podido comprobar los precios extraídos." }, { status: 400 });
    }
    console.error("Unable to check delivery note prices", error);
    return NextResponse.json({ error: "No se han podido comprobar los precios." }, { status: 502 });
  }
}

function toUnmatchedComparison(lines: Pick<DeliveryNoteLineDraft, "description" | "unitPrice">[]) {
  return lines.map((line) => ({
    description: line.description,
    previousUnitPrice: null,
    status: line.unitPrice === null ? "review" : "unmatched",
    unitPrice: line.unitPrice,
  }));
}
