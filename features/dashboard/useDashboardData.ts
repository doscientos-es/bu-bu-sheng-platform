"use client";

import { useCallback, useEffect, useState } from "react";
import type { Customer, DashboardData, DeliveryNote } from "@/lib/types";

type NewCustomer = {
  birthday: string;
  consent: boolean;
  email: string;
  name: string;
  storeId: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "La operación no se ha podido completar.");
  return body;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await requestJson<DashboardData>("/api/dashboard"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createDeliveryNote = useCallback(async (storeId: string, file: File) => {
    const formData = new FormData();
    formData.set("storeId", storeId);
    formData.set("file", file);
    const note = await requestJson<DeliveryNote>("/api/delivery-notes", {
      method: "POST",
      body: formData,
    });
    setData((current) => (current ? { ...current, notes: [note, ...current.notes] } : current));
  }, []);

  const createCustomer = useCallback(async (input: NewCustomer) => {
    const customer = await requestJson<Customer>("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setData((current) =>
      current ? { ...current, customers: [...current.customers, customer] } : current,
    );
  }, []);

  const preparePromotion = useCallback(async (promotionAssignmentId: string) => {
    const customer = await requestJson<Customer>("/api/customers/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promotionAssignmentId }),
    });
    setData((current) =>
      current
        ? {
            ...current,
            customers: current.customers.map((item) => (item.id === customer.id ? customer : item)),
          }
        : current,
    );
  }, []);

  return { createCustomer, createDeliveryNote, data, error, isLoading, preparePromotion, refresh };
}
