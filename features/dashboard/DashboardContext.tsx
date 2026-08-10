"use client";

import { createContext, useContext } from "react";
import type {
  DashboardData,
  DeliveryNote,
  DeliveryNoteDraft,
  DeliveryNoteSaveResult,
  LoyaltyRule,
} from "@/lib/types";

export type DashboardContextValue = {
  createCustomer: (input: {
    birthday: string;
    consent: boolean;
    email: string;
    name: string;
    storeId: string;
  }) => Promise<void>;
  createDeliveryNote: (
    storeId: string,
    file: File,
    draft: DeliveryNoteDraft,
  ) => Promise<DeliveryNoteSaveResult>;
  data: DashboardData;
  defaultStoreId?: string;
  notes: DeliveryNote[];
  preparePromotion: (promotionAssignmentId: string) => Promise<void>;
  registerVisit: (customerId: string, storeId: string) => Promise<{ issued: number }>;
  saveLoyaltyRule: (rule: LoyaltyRule) => Promise<void>;
  selectedStoreLabel: string;
  setStoreId: (storeId: string) => void;
  storeId: string;
};

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("DashboardContext debe utilizarse dentro de DashboardShell.");
  return context;
}
