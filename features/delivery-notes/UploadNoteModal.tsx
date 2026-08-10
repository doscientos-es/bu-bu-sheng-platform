"use client";

import { ArrowUpRight, Upload } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

type UploadNoteModalProps = {
  onClose: () => void;
  onConfirm: (file: File) => Promise<void>;
};

export function UploadNoteModal({ onClose, onConfirm }: UploadNoteModalProps) {
  const [uploaded, setUploaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      if (!file) throw new Error("Selecciona primero un albarán.");
      await onConfirm(file);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "No se ha podido crear el albarán.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title="Subir nuevo albarán" onClose={onClose}>
      <div className="upload-area">
        <Upload size={28} />
        <strong>Arrastra una foto o selecciónala</strong>
        <span>JPG, PNG o PDF · hasta 4 MB en Azure F0</span>
        <label className="secondary-button">
          Seleccionar archivo
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
              setUploaded(Boolean(selected));
              setError(null);
            }}
            hidden
          />
        </label>
      </div>
      {uploaded && (
        <div className="processing-card">
          <div className="processing-dot" />
          <div>
            <strong>Documento analizado</strong>
            <p>
              {file?.name ?? "Documento seleccionado"}. Azure analizará el proveedor, líneas y
              precios al continuar.
            </p>
          </div>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="ghost-button" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={!uploaded || isSaving}
          onClick={handleConfirm}
        >
          {isSaving ? "Guardando…" : "Revisar albarán"} <ArrowUpRight size={15} />
        </button>
      </div>
    </Modal>
  );
}
