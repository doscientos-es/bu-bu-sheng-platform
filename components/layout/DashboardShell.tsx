"use client";

import { DashboardContext } from "@/features/dashboard/DashboardContext";
import { useDashboardData } from "@/features/dashboard/useDashboardData";
import { ALL_STORES_ID, ALL_STORES_LABEL } from "@/lib/demo";
import type { Section } from "@/lib/types";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type DashboardShellProps = {
  children: ReactNode;
};

const SKELETON_CARD_IDS = ["purchases", "reviews", "customers", "birthdays"] as const;
const SECTION_BY_PATH: Record<string, Section> = {
  "/": "Resumen",
  "/albaranes": "Albaranes",
  "/clientes": "Clientes",
  "/configuracion": "Configuración",
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const section = SECTION_BY_PATH[pathname] ?? "Resumen";
  const [storeId, setStoreId] = useState(ALL_STORES_ID);
  const {
    createCustomer,
    createDeliveryNote,
    data,
    deleteDeliveryNote,
    error,
    isLoading,
    preparePromotion,
    registerVisit,
    saveLoyaltyRule,
    updateDeliveryNote,
  } = useDashboardData();
  const notes = data?.notes ?? [];
  const selectedStoreLabel =
    data?.stores.find((store) => store.id === storeId)?.name ?? ALL_STORES_LABEL;
  const stores = data?.stores ?? [];
  const defaultStoreId = stores[0]?.id;

  return (
    <main className="app-shell">
      <Sidebar section={section} />
      <section className="content">
        <Topbar section={section} stores={stores} storeId={storeId} onStoreChange={setStoreId} />
        <div className="page-content">
          {isLoading && <DashboardSkeleton />}

          {!isLoading && (error || !data) && (
            <DashboardContentError
              message={error ?? "Comprueba tu conexión e inténtalo de nuevo."}
            />
          )}

          {!isLoading && data && (
            <DashboardContext.Provider
              value={{
                createCustomer,
                createDeliveryNote,
                data,
                defaultStoreId,
                deleteDeliveryNote,
                notes,
                preparePromotion,
                registerVisit,
                saveLoyaltyRule,
                selectedStoreLabel,
                setStoreId,
                storeId,
                updateDeliveryNote,
              }}
            >
              {children}
            </DashboardContext.Provider>
          )}
        </div>
      </section>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-label="Cargando contenido" role="status">
      <div className="skeleton-title" />
      <div className="skeleton-copy" />
      <div className="skeleton-metrics">
        {SKELETON_CARD_IDS.map((id) => (
          <div className="skeleton-card" key={id} />
        ))}
      </div>
      <div className="skeleton-workspace" />
    </div>
  );
}

function DashboardContentError({ message }: { message: string }) {
  return (
    <div className="dashboard-content-error" role="alert">
      <strong>No hemos podido cargar esta vista.</strong>
      <p>{message}</p>
    </div>
  );
}
