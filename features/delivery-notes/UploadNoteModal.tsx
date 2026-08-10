"use client";

import { ArrowUpRight, Upload } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

type UploadNoteModalProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export function UploadNoteModal({ onClose, onConfirm }: UploadNoteModalProps) {
  const [uploaded, setUploaded] = useState(false);

  return (
    <Modal title="Subir nuevo albarán" onClose={onClose}>
      <div className="upload-area">
        <Upload size={28} />
        <strong>Arrastra una foto o selecciónala</strong>
        <span>JPG, PNG o PDF · hasta 10 MB</span>
        <label className="secondary-button">
          Seleccionar archivo
          <input type="file" accept="image/*,.pdf" onChange={() => setUploaded(true)} hidden />
        </label>
      </div>
      {uploaded && (
        <div className="processing-card">
          <div className="processing-dot" />
          <div>
            <strong>Documento analizado</strong>
            <p>Hemos encontrado 4 líneas. Revisa los datos antes de validar.</p>
          </div>
        </div>
      )}
      <div className="modal-actions">
        <button type="button" className="ghost-button" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="primary-button" disabled={!uploaded} onClick={onConfirm}>
          Revisar albarán <ArrowUpRight size={15} />
        </button>
      </div>
    </Modal>
  );
}
