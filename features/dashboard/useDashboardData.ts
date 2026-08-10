"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Customer,
  DashboardData,
  DeliveryNoteDraft,
  DeliveryNoteSaveResult,
  LoyaltyRule,
} from "@/lib/types";

type NewCustomer = {
  birthday: string;
  consent: boolean;
  email: string;
  name: string;
  storeId: string;
};

let dashboardCache: DashboardData | null = null;

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "La operación no se ha podido completar.");
  return body;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(() => dashboardCache);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => dashboardCache === null);

  const commitData = useCallback((updater: (current: DashboardData) => DashboardData) => {
    setData((current) => {
      const source = current ?? dashboardCache;
      if (!source) return current;
      const next = updater(source);
      dashboardCache = next;
      return next;
    });
  }, []);

  const refresh = useCallback(async (force = false) => {
    if (dashboardCache && !force) {
      setData(dashboardCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const dashboard = await requestJson<DashboardData>("/api/dashboard");
      dashboardCache = dashboard;
      setData(dashboard);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createDeliveryNote = useCallback(
    async (storeId: string, file: File, draft: DeliveryNoteDraft) => {
      const formData = new FormData();
      formData.set("storeId", storeId);
      formData.set("file", file);
      formData.set("draft", JSON.stringify(draft));
      const result = await requestJson<DeliveryNoteSaveResult>("/api/delivery-notes", {
        method: "POST",
        body: formData,
      });
      commitData((current) => ({ ...current, notes: [result.note, ...current.notes] }));
      return result;
    },
    [commitData],
  );

  const createCustomer = useCallback(
    async (input: NewCustomer) => {
      const customer = await requestJson<Customer>("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      commitData((current) => ({ ...current, customers: [...current.customers, customer] }));
    },
    [commitData],
  );

  const preparePromotion = useCallback(
    async (promotionAssignmentId: string) => {
      const customer = await requestJson<Customer>("/api/customers/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotionAssignmentId }),
      });
      commitData((current) => ({
        ...current,
        customers: current.customers.map((item) => (item.id === customer.id ? customer : item)),
      }));
    },
    [commitData],
  );

  const saveLoyaltyRule = useCallback(
    async (rule: LoyaltyRule) => {
      const updatedRule = await requestJson<LoyaltyRule>("/api/loyalty/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      commitData((current) => ({
        ...current,
        loyaltyRules: current.loyaltyRules.map((item) =>
          item.id === updatedRule.id ? updatedRule : item,
        ),
      }));
    },
    [commitData],
  );

  const registerVisit = useCallback(
    async (customerId: string, storeId: string) => {
      const response = await requestJson<{ result: { issued: number } }>("/api/loyalty/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, storeId }),
      });
      await refresh(true);
      return response.result;
    },
    [refresh],
  );

  return {
    createCustomer,
    createDeliveryNote,
    data,
    error,
    isLoading,
    preparePromotion,
    refresh,
    registerVisit,
    saveLoyaltyRule,
  };
}
