import { Modal } from "@/components/ui/Modal";
import { ALL_STORES, stores } from "@/lib/data";

type NewCustomerModalProps = {
  onClose: () => void;
  onSave: () => void;
};

const selectableStores = stores.filter((store) => store !== ALL_STORES);

export function NewCustomerModal({ onClose, onSave }: NewCustomerModalProps) {
  return (
    <Modal title="Nuevo cliente" onClose={onClose}>
      <div className="form-grid">
        <label>
          Nombre
          <input placeholder="Nombre y apellidos" />
        </label>
        <label>
          Email
          <input type="email" placeholder="cliente@email.com" />
        </label>
        <label>
          Fecha de cumpleaños
          <input type="date" />
        </label>
        <label>
          Cafetería
          <select>
            {selectableStores.map((store) => (
              <option key={store}>{store}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="consent">
        <input type="checkbox" /> El cliente ha dado consentimiento para recibir comunicaciones.
      </label>
      <div className="modal-actions">
        <button type="button" className="ghost-button" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="primary-button" onClick={onSave}>
          Guardar cliente
        </button>
      </div>
    </Modal>
  );
}
