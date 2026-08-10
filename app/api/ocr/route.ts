import { NextResponse } from "next/server";
import { analyzeWithAzure } from "@/lib/azure-ocr";
import { getMockDeliveryNoteDraft } from "@/lib/mock-ocr";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "Adjunta una imagen o PDF." }, { status: 400 });
    if (file.size > 4 * 1024 * 1024)
      return NextResponse.json(
        { error: "El nivel gratuito admite archivos de hasta 4 MB." },
        { status: 413 },
      );
    const usesAzure = process.env.OCR_PROVIDER?.trim().toLowerCase() === "azure";
    if (!usesAzure) {
      await new Promise((resolve) => setTimeout(resolve, 750));
      return NextResponse.json({ provider: "mock", result: getMockDeliveryNoteDraft() });
    }

    const extracted = await analyzeWithAzure(file);
    return NextResponse.json({
      provider: "azure",
      result: {
        confidence: extracted.confidence,
        date: extracted.date,
        documentNumber: extracted.documentNumber,
        lines: extracted.lines,
        supplier: extracted.supplier,
        total: extracted.total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo analizar el documento";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
