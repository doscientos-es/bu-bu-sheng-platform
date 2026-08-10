"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Customer } from "@/lib/types";

type BirthdayEmailModalProps = {
  customer: Customer;
  onClose: () => void;
  onMarkAsPrepared: () => Promise<void>;
};

export function BirthdayEmailModal({
  customer,
  onClose,
  onMarkAsPrepared,
}: BirthdayEmailModalProps) {
  const firstName = customer.name.split(" ")[0];
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkAsPrepared() {
    setIsSaving(true);
    setError(null);
    try {
      await onMarkAsPrepared();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "No se ha podido preparar el email.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title="Preparar email de cumpleaños" onClose={onClose}>
      <div className="email-preview">
        <div className="email-top">
          <div className="brand-mark">D</div>
          <span>Una sorpresa para ti</span>
        </div>
        <h3>¡Feliz cumpleaños, {firstName}!</h3>
        <p>
          Queremos celebrarlo contigo. Pasa por tu cafetería y disfruta de un café y una pieza de
          bollería por nuestra cuenta.
        </p>
        <div className="promo-code">CUMPLE-CAFE</div>
        <small>Esta demo prepara el email, pero no lo envía.</small>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="ghost-button" onClick={onClose}>
          Cerrar
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={isSaving}
          onClick={handleMarkAsPrepared}
        >
          <Mail size={15} />
          {isSaving ? "Guardando…" : "Marcar como preparado"}
        </button>
      </div>
    </Modal>
  );
}
