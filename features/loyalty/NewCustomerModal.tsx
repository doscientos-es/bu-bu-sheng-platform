"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Store } from "@/lib/types";

type NewCustomerModalProps = {
  stores: Store[];
  onClose: () => void;
  onSave: (input: {
    birthday: string;
    consent: boolean;
    email: string;
    name: string;
    storeId: string;
  }) => Promise<void>;
};

export function NewCustomerModal({ stores, onClose, onSave }: NewCustomerModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        birthday: String(formData.get("birthday") ?? ""),
        storeId: String(formData.get("storeId") ?? ""),
        consent: formData.get("consent") === "on",
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se ha podido guardar el cliente.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose}>
      <form action={handleSubmit}>
        <div className="form-grid">
          <label>
            Nombre
            <input name="name" placeholder="Nombre y apellidos" required />
          </label>
          <label>
            Email
            <input name="email" type="email" placeholder="cliente@email.com" required />
          </label>
          <label>
            Fecha de cumpleaños
            <input name="birthday" type="date" required />
          </label>
          <label>
            Cafetería
            <select name="storeId" required>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="consent">
          <input name="consent" type="checkbox" /> El cliente ha dado consentimiento para recibir
          comunicaciones.
        </label>
        {error && <p role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? "Guardando…" : "Guardar cliente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
