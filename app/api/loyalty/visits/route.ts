import { NextResponse } from "next/server";
import { z } from "zod";
import { registerCustomerVisit } from "@/lib/loyalty";

const requestSchema = z.object({
  customerId: z.string().uuid(),
  storeId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    return NextResponse.json(await registerCustomerVisit(input), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "La visita no es válida." }, { status: 400 });
    console.error("Unable to register customer visit", error);
    return NextResponse.json({ error: "No se ha podido registrar la visita." }, { status: 500 });
  }
}
