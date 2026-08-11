"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, Gift, Search, Store as StoreIcon, UserPlus, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import type { Customer, Store } from "@/lib/types";

type VisitTerminalProps = {
  customers: Customer[];
  stores: Store[];
};

type Feedback = {
  tone: "success" | "error";
  title: string;
  detail?: string;
};

type NewCustomerForm = {
  name: string;
  email: string;
  birthday: string;
  consent: boolean;
};

const STORE_STORAGE_KEY = "visit-terminal-store";
const EMPTY_NEW_CUSTOMER: NewCustomerForm = { name: "", email: "", birthday: "", consent: false };

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function VisitTerminal({ customers, stores }: VisitTerminalProps) {
  const [storeId, setStoreId] = useState(() => {
    if (typeof window === "undefined") return stores[0]?.id ?? "";
    const stored = window.localStorage.getItem(STORE_STORAGE_KEY);
    return stores.some((store) => store.id === stored) ? (stored as string) : (stores[0]?.id ?? "");
  });
  const [customerList, setCustomerList] = useState(customers);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [newCustomer, setNewCustomer] = useState<NewCustomerForm | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return customerList.slice(0, 12);
    return customerList
      .filter(
        (customer) =>
          normalize(customer.name).includes(term) || normalize(customer.email).includes(term),
      )
      .slice(0, 24);
  }, [customerList, query]);

  function selectStore(nextStoreId: string) {
    setStoreId(nextStoreId);
    window.localStorage.setItem(STORE_STORAGE_KEY, nextStoreId);
  }

  function openNewCustomer() {
    setCreateError(null);
    setNewCustomer({ ...EMPTY_NEW_CUSTOMER, name: query.trim() });
  }

  function closeNewCustomer() {
    setNewCustomer(null);
    setCreateError(null);
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newCustomer || !storeId || isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCustomer, storeId }),
      });
      const body = (await response.json()) as Customer & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No se ha podido crear el cliente.");
      setCustomerList((current) => [body, ...current]);
      setQuery("");
      setNewCustomer(null);
      await registerVisit(body);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "No se ha podido crear el cliente.");
    } finally {
      setIsCreating(false);
    }
  }

  async function registerVisit(customer: Customer) {
    if (!storeId || pendingId) return;
    setPendingId(customer.id);
    setFeedback(null);
    try {
      const response = await fetch("/api/loyalty/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, storeId }),
      });
      const body = (await response.json()) as {
        error?: string;
        result?: { issued: number };
        visits?: number;
      };
      if (!response.ok) throw new Error(body.error ?? "No se ha podido registrar la visita.");
      setFeedback({
        tone: "success",
        title: `Visita registrada para ${customer.name}`,
        detail: body.result?.issued
          ? "¡Recompensa preparada! Avisa al cliente."
          : `Visitas acumuladas: ${body.visits ?? customer.visits + 1}`,
      });
      setQuery("");
    } catch (error) {
      setFeedback({
        tone: "error",
        title: error instanceof Error ? error.message : "No se ha podido registrar la visita.",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="visit-terminal">
      <header className="visit-terminal-header">
        <fieldset className="visit-terminal-stores">
          <legend className="visit-terminal-kicker">
            <StoreIcon size={13} /> Cafetería
          </legend>
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              className={store.id === storeId ? "visit-store-chip active" : "visit-store-chip"}
              aria-pressed={store.id === storeId}
              onClick={() => selectStore(store.id)}
            >
              {store.name}
            </button>
          ))}
        </fieldset>
        <h1>Registrar visita</h1>
        <p className="visit-terminal-help">Busca al cliente y toca su nombre.</p>
      </header>

      <label className="visit-terminal-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Nombre o email del cliente"
          aria-label="Buscar cliente"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery("")}>
            <X size={16} />
          </button>
        )}
      </label>

      <button
        type="button"
        className="visit-quick-action"
        disabled={!storeId}
        onClick={openNewCustomer}
      >
        <UserPlus size={16} />
        Nuevo cliente
      </button>

      {feedback && (
        <p
          className={`visit-terminal-feedback ${feedback.tone}`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.tone === "success" ? <Gift size={16} /> : <X size={16} />}
          <span>
            <strong>{feedback.title}</strong>
            {feedback.detail && <em>{feedback.detail}</em>}
          </span>
        </p>
      )}

      <ul className="visit-terminal-list">
        {results.map((customer) => (
          <li key={customer.id}>
            <button
              type="button"
              className="visit-customer-row"
              disabled={!storeId || pendingId !== null}
              onClick={() => registerVisit(customer)}
            >
              <span className="visit-customer-avatar" aria-hidden="true">
                {customer.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="visit-customer-detail">
                <strong>{customer.name}</strong>
                <em>{customer.visits} visitas</em>
              </span>
              <span className="visit-customer-action">
                {pendingId === customer.id ? "…" : <Check size={18} />}
              </span>
            </button>
          </li>
        ))}
        {results.length === 0 && (
          <li className="visit-terminal-empty">
            No hay clientes que coincidan con la búsqueda.
            <button type="button" className="text-button" onClick={openNewCustomer}>
              <UserPlus size={14} /> Crear cliente
            </button>
          </li>
        )}
      </ul>

      <Dialog.Root open={newCustomer !== null} onOpenChange={(open) => !open && closeNewCustomer()}>
        <Dialog.Portal>
          <Dialog.Backdrop className="visit-sheet-backdrop" />
          <Dialog.Viewport className="visit-sheet-viewport">
            <Dialog.Popup className="visit-sheet">
              <div className="visit-sheet-heading">
                <Dialog.Title render={<h2>Nuevo cliente</h2>} />
                <Dialog.Close type="button" aria-label="Cerrar">
                  <X size={18} />
                </Dialog.Close>
              </div>
              {newCustomer && (
                <form className="visit-sheet-form" onSubmit={handleCreateCustomer}>
                  <label>
                    Nombre
                    <input
                      type="text"
                      required
                      placeholder="Nombre y apellidos"
                      value={newCustomer.name}
                      onChange={(event) =>
                        setNewCustomer({ ...newCustomer, name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      inputMode="email"
                      required
                      placeholder="cliente@email.com"
                      value={newCustomer.email}
                      onChange={(event) =>
                        setNewCustomer({ ...newCustomer, email: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Cumpleaños
                    <input
                      type="date"
                      required
                      value={newCustomer.birthday}
                      onChange={(event) =>
                        setNewCustomer({ ...newCustomer, birthday: event.target.value })
                      }
                    />
                  </label>
                  <label className="visit-sheet-consent">
                    <input
                      type="checkbox"
                      checked={newCustomer.consent}
                      onChange={(event) =>
                        setNewCustomer({ ...newCustomer, consent: event.target.checked })
                      }
                    />
                    Acepta recibir comunicaciones por email.
                  </label>
                  {createError && (
                    <p className="visit-sheet-error" role="alert">
                      {createError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="visit-quick-action primary"
                    disabled={isCreating}
                  >
                    {isCreating ? "Guardando…" : "Guardar y registrar visita"}
                  </button>
                </form>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
