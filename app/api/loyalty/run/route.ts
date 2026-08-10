import { NextResponse } from "next/server";
import { processDailyLoyaltyAutomations } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.LOYALTY_CRON_SECRET ?? process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    return NextResponse.json(await processDailyLoyaltyAutomations());
  } catch (error) {
    console.error("Unable to process loyalty automations", error);
    return NextResponse.json(
      { error: "No se han podido procesar las automatizaciones." },
      { status: 500 },
    );
  }
}
