import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getDashboardData());
  } catch (error) {
    console.error("Unable to load the dashboard data", error);
    return NextResponse.json({ error: "No se han podido cargar los datos." }, { status: 500 });
  }
}
