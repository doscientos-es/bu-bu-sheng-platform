"use client";

import { createContext, useContext } from "react";
import type { Customer, DashboardData, DeliveryNote } from "@/lib/types";

export type DashboardContextValue = {
  createCustomer: (input: {
    birthday: string;
    consent: boolean;
    email: string;
    name: string;
    storeId: string;
  }) => Promise<void>;
  createDeliveryNote: (storeId: string, file: File) => Promise<void>;
  data: DashboardData;
  defaultStoreId?: string;
  notes: DeliveryNote[];
  preparePromotion: (promotionAssignmentId: string) => Promise<void>;
  selectedStoreLabel: string;
  storeId: string;
};

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("DashboardContext debe utilizarse dentro de DashboardShell.");
  return context;
}
