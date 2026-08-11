"use client";

import type {
  DashboardData,
  DeliveryNote,
  DeliveryNoteDraft,
  DeliveryNoteSaveResult,
  LoyaltyRule,
} from "@/lib/types";
import { createContext, useContext } from "react";

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
  deleteDeliveryNote: (noteId: string) => Promise<void>;
  notes: DeliveryNote[];
  preparePromotion: (promotionAssignmentId: string) => Promise<void>;
  registerVisit: (customerId: string, storeId: string) => Promise<{ issued: number }>;
  saveLoyaltyRule: (rule: LoyaltyRule) => Promise<void>;
  selectedStoreLabel: string;
  setStoreId: (storeId: string) => void;
  storeId: string;
  updateDeliveryNote: (
    noteId: string,
    draft: DeliveryNoteDraft,
  ) => Promise<DeliveryNoteSaveResult>;
};

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("DashboardContext debe utilizarse dentro de DashboardShell.");
  return context;
}
