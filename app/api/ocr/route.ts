import { NextResponse } from "next/server";
import { analyzeWithAzure } from "@/lib/azure-ocr";

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
    const result = await analyzeWithAzure(file);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo analizar el documento";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
