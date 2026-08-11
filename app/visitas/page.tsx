import type { Metadata, Viewport } from "next";
import { VisitTerminal } from "@/features/visits/VisitTerminal";
import { getVisitTerminalData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registrar visita · Cafeterías",
  description: "Registro rápido de visitas para el equipo de sala",
};

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function VisitsPage() {
  const { customers, stores } = await getVisitTerminalData();
  return (
    <main className="visit-terminal-shell">
      <VisitTerminal customers={customers} stores={stores} />
    </main>
  );
}
