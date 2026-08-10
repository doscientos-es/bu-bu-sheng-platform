import { Mail } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { Customer } from "@/lib/types";

type BirthdayEmailModalProps = {
  customer: Customer;
  onClose: () => void;
  onMarkAsPrepared: () => void;
};

export function BirthdayEmailModal({
  customer,
  onClose,
  onMarkAsPrepared,
}: BirthdayEmailModalProps) {
  const firstName = customer.name.split(" ")[0];

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
      <div className="modal-actions">
        <button type="button" className="ghost-button" onClick={onClose}>
          Cerrar
        </button>
        <button type="button" className="primary-button" onClick={onMarkAsPrepared}>
          <Mail size={15} />
          Marcar como preparado
        </button>
      </div>
    </Modal>
  );
}
