"use client";

import type { Customer, Store } from "@/lib/types";
import { Building2, CheckCircle2, Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

type RegisterVisitCardProps = {
  customers: Customer[];
  defaultStoreId?: string;
  stores: Store[];
  onRegister: (customerId: string, storeId: string) => Promise<{ issued: number }>;
  variant?: "full" | "widget";
};

export function RegisterVisitCard({
  customers,
  defaultStoreId,
  stores,
  onRegister,
  variant = "full",
}: RegisterVisitCardProps) {
  const [customerId, setCustomerId] = useState("");
  const [storeId, setStoreId] = useState(defaultStoreId ?? stores[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStoreId(defaultStoreId ?? stores[0]?.id ?? "");
  }, [defaultStoreId, stores]);

  async function register() {
    if (!customerId || !storeId) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const result = await onRegister(customerId, storeId);
      setMessage(
        result.issued ? "Visita registrada. Recompensa preparada." : "Visita registrada.",
      );
      setCustomerId("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se ha podido registrar la visita.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className={`panel visit-registration ${variant === "widget" ? "visit-registration-widget" : ""}`}
      aria-labelledby="register-visit-heading"
    >
      <div className="visit-registration-heading">
        <div className="visit-registration-icon" aria-hidden="true">
          <UserRound size={18} />
        </div>
        <div>
          <p className="panel-kicker">{variant === "widget" ? "ACCIÓN RÁPIDA" : "EVENTO INMEDIATO"}</p>
          <h2 id="register-visit-heading">Registrar una visita</h2>
          <p>Elige al cliente y la cafetería. Si corresponde, prepararemos su recompensa.</p>
        </div>
      </div>
      <div className="visit-registration-controls">
        <label className="visit-registration-field">
          <span>
            <UserRound size={13} /> Cliente
          </span>
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Selecciona un cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label className="visit-registration-field">
          <span>
            <Building2 size={13} /> Cafetería
          </span>
          <select value={storeId} onChange={(event) => setStoreId(event.target.value)}>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary-button"
          disabled={!customerId || !storeId || isSaving}
          type="button"
          onClick={register}
        >
          <Plus size={16} />
          {isSaving ? "Registrando…" : "Registrar ahora"}
        </button>
      </div>
      {message && (
        <p className="visit-message" role="status">
          <CheckCircle2 size={14} /> {message}
        </p>
      )}
    </section>
  );
}
