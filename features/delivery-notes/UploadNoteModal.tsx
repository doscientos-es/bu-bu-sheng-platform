"use client";

import { Modal } from "@/components/ui/Modal";
import type {
  DeliveryNoteDraft,
  DeliveryNoteLineDraft,
  DeliveryNoteSaveResult,
  PriceComparison,
} from "@/lib/types";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  FileText,
  LoaderCircle,
  Plus,
  ScanLine,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type UploadNoteModalProps = {
  noteId?: string;
  onClose: () => void;
  onConfirm: (file: File | null, draft: DeliveryNoteDraft) => Promise<DeliveryNoteSaveResult>;
};

type UploadStep = "capture" | "loading" | "scanning" | "review" | "saving" | "success";

const SCAN_STEPS = [
  "Preparando el documento",
  "Leyendo proveedor y fecha",
  "Identificando productos y precios",
] as const;

const EMPTY_LINE: DeliveryNoteLineDraft = {
  description: "",
  quantity: null,
  unitPrice: null,
};

function createEmptyLine(): DeliveryNoteLineDraft {
  return { ...EMPTY_LINE, id: crypto.randomUUID() };
}

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatPrice(value: number | null) {
  return value === null
    ? "Sin precio"
    : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}

function compareScannedPrice(
  current: number | null,
  previous: number | null,
): PriceComparison["status"] {
  if (current === null) return "review";
  if (previous === null) return "unmatched";
  if (Math.abs(current - previous) < 0.0001) return "same";
  return current > previous ? "higher" : "lower";
}

function formatPriceIncrease(current: number | null, previous: number | null) {
  if (current === null || previous === null || previous <= 0) return null;
  return `${Math.round(((current - previous) / previous) * 100)}%`;
}

export function UploadNoteModal({ noteId, onClose, onConfirm }: UploadNoteModalProps) {
  const isEditing = Boolean(noteId);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<DeliveryNoteDraft | null>(null);
  const [ocrProvider, setOcrProvider] = useState<"azure" | "mock" | null>(null);
  const [step, setStep] = useState<UploadStep>(noteId ? "loading" : "capture");
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<DeliveryNoteSaveResult | null>(null);
  const [priceComparison, setPriceComparison] = useState<PriceComparison[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isBusy = step === "scanning" || step === "saving" || step === "loading";
  const documentName = file?.name ?? "Documento del albarán";
  const documentUrl = previewUrl ?? remoteImageUrl;

  useEffect(() => {
    if (!file?.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (step !== "scanning") return;
    const interval = window.setInterval(() => {
      setScanStep((current) => Math.min(current + 1, SCAN_STEPS.length - 1));
    }, 1300);
    return () => window.clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (!noteId) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/delivery-notes/${noteId}`);
        const payload = (await response.json()) as {
          draft?: DeliveryNoteDraft;
          error?: string;
          imageUrl?: string | null;
        };
        if (!response.ok || !payload.draft) {
          throw new Error(payload.error ?? "No hemos podido cargar el albarán.");
        }
        if (cancelled) return;
        const loadedDraft: DeliveryNoteDraft = {
          ...payload.draft,
          lines: payload.draft.lines.length
            ? payload.draft.lines.map((line) => ({ ...line, id: line.id ?? crypto.randomUUID() }))
            : [createEmptyLine()],
        };
        setDraft(loadedDraft);
        setRemoteImageUrl(payload.imageUrl ?? null);
        setStep("review");
        void checkPriceChanges(loadedDraft, noteId);
      } catch (requestError) {
        if (cancelled) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No hemos podido cargar el albarán.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  async function scanDocument(selectedFile: File) {
    setFile(selectedFile);
    setError(null);
    setPriceComparison([]);
    setResult(null);
    setScanStep(0);
    setStep("scanning");
    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      const response = await fetch("/api/ocr", { body: formData, method: "POST" });
      const payload = (await response.json()) as {
        error?: string;
        provider?: "azure" | "mock";
        result?: DeliveryNoteDraft;
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "No hemos podido leer el documento.");
      }
      const scannedDraft = {
        ...payload.result,
        lines: payload.result.lines.length
          ? payload.result.lines.map((line) => ({ ...line, id: crypto.randomUUID() }))
          : [createEmptyLine()],
      };
      setDraft(scannedDraft);
      setOcrProvider(payload.provider ?? null);
      setStep("review");
      void checkPriceChanges(scannedDraft);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "No se ha podido leer el albarán.",
      );
      setStep("capture");
    }
  }

  async function checkPriceChanges(scannedDraft: DeliveryNoteDraft, excludeNoteId?: string) {
    try {
      const response = await fetch("/api/delivery-notes/price-check", {
        body: JSON.stringify({
          excludeNoteId,
          lines: scannedDraft.lines,
          supplier: scannedDraft.supplier,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { comparison?: PriceComparison[] };
      if (response.ok && payload.comparison) setPriceComparison(payload.comparison);
    } catch {
      // A price warning should never prevent the user from reviewing or saving an albarán.
    }
  }

  function updateDraft<K extends keyof DeliveryNoteDraft>(field: K, value: DeliveryNoteDraft[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateLine(
    index: number,
    field: keyof DeliveryNoteLineDraft,
    value: string | number | null,
  ) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        lines: current.lines.map((line, lineIndex) =>
          lineIndex === index ? { ...line, [field]: value } : line,
        ),
      };
    });
    if (field === "description") {
      setPriceComparison((current) =>
        current.map((comparison, comparisonIndex) =>
          comparisonIndex === index
            ? { ...comparison, description: String(value), previousUnitPrice: null, status: "unmatched" }
            : comparison,
        ),
      );
    }
    if (field === "unitPrice") {
      const unitPrice = typeof value === "number" || value === null ? value : null;
      setPriceComparison((current) =>
        current.map((comparison, comparisonIndex) =>
          comparisonIndex === index
            ? {
              ...comparison,
              status: compareScannedPrice(unitPrice, comparison.previousUnitPrice),
              unitPrice,
            }
            : comparison,
        ),
      );
    }
  }

  function canConfirm() {
    return Boolean(
      (file || isEditing) &&
      draft?.supplier.trim() &&
      draft.date &&
      draft.lines.length &&
      draft.lines.every(
        (line) => line.description.trim() && line.quantity !== null && line.unitPrice !== null,
      ),
    );
  }

  async function handleConfirm() {
    if (!draft || (!file && !isEditing)) return;
    if (!canConfirm()) {
      setError("Completa proveedor, fecha, cantidad y precio de cada producto antes de confirmar.");
      return;
    }
    setStep("saving");
    setError(null);
    try {
      setResult(await onConfirm(file, draft));
      setStep("success");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se ha podido guardar el albarán.",
      );
      setStep("review");
    }
  }

  const title = isEditing
    ? step === "success"
      ? "Albarán actualizado"
      : step === "loading"
        ? "Cargando el albarán"
        : "Editar albarán"
    : step === "capture"
      ? "Añadir albarán"
      : step === "scanning"
        ? "Leyendo el albarán"
        : step === "success"
          ? "Albarán guardado"
          : "Revisa el albarán";

  const confirmedIncreases = result?.comparison.filter((line) => line.status === "higher") ?? [];
  const scannedIncreases = priceComparison.filter((line) => line.status === "higher");

  return (
    <Modal
      className={`modal-wide ${step === "review" ? "modal-review" : ""}`}
      title={title}
      onClose={() => !isBusy && onClose()}
    >
      {!isEditing && (
        <ol
          className={`upload-steps ${step === "review" ? "review-upload-steps" : ""}`}
          aria-label="Progreso de subida"
        >
          <li className={step === "capture" ? "active" : "complete"}>
            <span>1</span> Documento
          </li>
          <li className={["scanning", "review", "saving", "success"].includes(step) ? "active" : ""}>
            <span>2</span> Lectura
          </li>
          <li className={["review", "saving", "success"].includes(step) ? "active" : ""}>
            <span>3</span> Confirmar
          </li>
        </ol>
      )}

      {step === "loading" && (
        <div className="saving-state" aria-live="polite">
          <LoaderCircle size={25} />
          <strong>Cargando el albarán…</strong>
          <p>Recuperamos los datos guardados para que puedas editarlos.</p>
        </div>
      )}

      {step === "capture" && (
        <div className="capture-grid">
          <label className="capture-action">
            <Camera size={20} />
            <strong>Hacer una foto</strong>
            <span>Abre la cámara del dispositivo.</span>
            <input
              accept="image/*"
              capture="environment"
              type="file"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) void scanDocument(selected);
              }}
            />
          </label>
          <label className="capture-action">
            <Upload size={20} />
            <strong>Importar documento</strong>
            <span>Foto, escaneo o PDF desde tu dispositivo.</span>
            <input
              accept="image/*,.pdf,application/pdf"
              type="file"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) void scanDocument(selected);
              }}
            />
          </label>
        </div>
      )}

      {step === "capture" && (
        <p className="capture-hint">
          JPG, PNG o PDF · máximo 4 MB · revisarás todo antes de guardar.
        </p>
      )}

      {step === "scanning" && file && (
        <div className="scan-workspace" aria-live="polite">
          <DocumentPreview name={documentName} previewUrl={previewUrl} scanning />
          <div className="scan-progress">
            <div className="scan-icon">
              <ScanLine size={22} />
            </div>
            <p className="eyebrow">LECTURA EN CURSO</p>
            <h3>{SCAN_STEPS[scanStep]}</h3>
            <p>
              El documento permanece en pantalla. Estamos preparando un borrador para que lo
              revises.
            </p>
            <div className="scan-progress-list">
              {SCAN_STEPS.map((item, index) => {
                const status =
                  index < scanStep ? "complete" : index === scanStep ? "active" : "pending";
                return (
                  <span className={`scan-step ${status}`} key={item}>
                    {status === "complete" ? (
                      <Check size={13} />
                    ) : status === "active" ? (
                      <LoaderCircle size={13} />
                    ) : (
                      <i className="scan-step-dot" aria-hidden="true" />
                    )}
                    {item}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step === "review" && (file || isEditing) && draft && (
        <div className="review-workspace">
          <DocumentPreview name={documentName} previewUrl={documentUrl} />
          <form
            className="delivery-note-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            <div className="review-form-heading">
              <div>
                <p className="eyebrow">{isEditing ? "ALBARÁN GUARDADO" : "BORRADOR EXTRAÍDO"}</p>
                <h3>{isEditing ? "Edita los datos" : "Confirma los datos"}</h3>
              </div>
              {!isEditing && (
                <button type="button" className="text-button" onClick={() => setStep("capture")}>
                  Cambiar documento
                </button>
              )}
            </div>
            <div className="review-status-row">
              <p className="review-help">Revisa los campos vacíos antes de guardar.</p>
              {ocrProvider === "mock" && <span className="ocr-mode-badge">Datos de muestra</span>}
            </div>
            {scannedIncreases.length > 0 && (
              <aside className="price-alert" role="alert">
                <div className="price-alert-icon" aria-hidden="true">
                  <AlertTriangle size={19} />
                </div>
                <div>
                  <p className="eyebrow">SUBIDA DE PRECIO DETECTADA</p>
                  <h4>
                    {scannedIncreases.length === 1
                      ? "Este proveedor ha subido un precio"
                      : `Este proveedor ha subido ${scannedIncreases.length} precios`}
                  </h4>
                  <p>Comparado con su último albarán. Comprueba estas líneas antes de guardar.</p>
                  <ul>
                    {scannedIncreases.map((line) => {
                      const increase = formatPriceIncrease(line.unitPrice, line.previousUnitPrice);
                      return (
                        <li key={line.description}>
                          <strong>{line.description}</strong>
                          <span>
                            {formatPrice(line.previousUnitPrice)} → {formatPrice(line.unitPrice)}
                            {increase && ` (+${increase})`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>
            )}
            <div className="form-grid delivery-note-header-fields">
              <label>
                Proveedor
                <input
                  value={draft.supplier}
                  onChange={(event) => updateDraft("supplier", event.target.value)}
                  placeholder="Ej. Distribuciones Norte"
                />
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => updateDraft("date", event.target.value)}
                />
              </label>
              <label>
                Nº de documento <span className="optional-field">Opcional</span>
                <input
                  value={draft.documentNumber}
                  onChange={(event) => updateDraft("documentNumber", event.target.value)}
                  placeholder="Ej. ALB-2048"
                />
              </label>
              <label>
                Total detectado <span className="optional-field">Opcional</span>
                <input
                  inputMode="decimal"
                  value={draft.total ?? ""}
                  onChange={(event) => updateDraft("total", parseNumber(event.target.value))}
                  placeholder="0,00"
                />
              </label>
            </div>
            <div className="review-lines-heading">
              <div>
                <strong>Productos</strong>
                <span>Comprueba cantidades y precio unitario.</span>
              </div>
              <button
                type="button"
                className="text-button"
                onClick={() => updateDraft("lines", [...draft.lines, createEmptyLine()])}
              >
                <Plus size={14} /> Añadir línea
              </button>
            </div>
            <div className="review-line-columns" aria-hidden="true">
              <span>Producto</span>
              <span>Cantidad</span>
              <span>Precio/unidad</span>
              <span />
            </div>
            <div className="review-lines">
              {draft.lines.map((line, index) => (
                <div
                  className={`review-line ${priceComparison[index]?.status === "higher" ? "has-price-increase" : ""}`}
                  key={line.id}
                >
                  <label>
                    <span>Producto</span>
                    <input
                      value={line.description}
                      onChange={(event) => updateLine(index, "description", event.target.value)}
                      placeholder="Nombre del producto"
                    />
                  </label>
                  <label>
                    <span>Cantidad</span>
                    <input
                      inputMode="decimal"
                      min="0"
                      step="any"
                      type="number"
                      value={line.quantity ?? ""}
                      onChange={(event) =>
                        updateLine(index, "quantity", parseNumber(event.target.value))
                      }
                      placeholder="0"
                    />
                  </label>
                  <label>
                    <span>Precio/unidad</span>
                    <input
                      inputMode="decimal"
                      min="0"
                      step="any"
                      type="number"
                      value={line.unitPrice ?? ""}
                      onChange={(event) =>
                        updateLine(index, "unitPrice", parseNumber(event.target.value))
                      }
                      placeholder="0,00"
                    />
                  </label>
                  <button
                    aria-label={`Eliminar ${line.description || "línea"}`}
                    className="remove-line-button"
                    disabled={draft.lines.length === 1}
                    type="button"
                    onClick={() =>
                      updateDraft(
                        "lines",
                        draft.lines.filter((_, lineIndex) => lineIndex !== index),
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions wizard-actions">
              <button type="button" className="ghost-button" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="primary-button">
                {isEditing ? "Guardar cambios" : "Confirmar y guardar"} <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}

      {step === "saving" && (
        <div className="saving-state" aria-live="polite">
          <LoaderCircle size={25} />
          <strong>Guardando y comparando precios…</strong>
          <p>Buscamos el último precio de cada producto antes de finalizar.</p>
        </div>
      )}

      {step === "success" && result && (
        <div className="save-success" aria-live="polite">
          <div className="save-success-icon">
            <Check size={23} />
          </div>
          <h3>
            {isEditing ? "Albarán actualizado correctamente" : "Albarán guardado correctamente"}
          </h3>
          {confirmedIncreases.length ? (
            <aside className="price-alert" role="alert">
              <div className="price-alert-icon" aria-hidden="true">
                <AlertTriangle size={19} />
              </div>
              <div>
                <p className="eyebrow">SUBIDA DE PRECIO DETECTADA</p>
                <h4>
                  {confirmedIncreases.length === 1
                    ? "Este proveedor ha subido un precio"
                    : `Este proveedor ha subido ${confirmedIncreases.length} precios`}
                </h4>
                <p>Comparado con su último albarán.</p>
                <ul>
                  {confirmedIncreases.map((line) => {
                    const increase = formatPriceIncrease(line.unitPrice, line.previousUnitPrice);
                    return (
                      <li key={line.description}>
                        <strong>{line.description}</strong>
                        <span>
                          {formatPrice(line.previousUnitPrice)} → {formatPrice(line.unitPrice)}
                          {increase && ` (+${increase})`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          ) : (
            <p>No hay subidas de precio en los productos con historial de compra.</p>
          )}
          <div className="modal-actions">
            <button type="button" className="primary-button" onClick={onClose}>
              Listo <Check size={15} />
            </button>
          </div>
        </div>
      )}

      {error && (step === "capture" || step === "loading") && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}

function DocumentPreview({
  name,
  previewUrl,
  scanning = false,
}: {
  name: string;
  previewUrl: string | null;
  scanning?: boolean;
}) {
  return (
    <figure className={`document-preview ${scanning ? "is-scanning" : ""}`}>
      {previewUrl ? (
        <Image
          alt={`Vista previa de ${name}`}
          height={1600}
          src={previewUrl}
          unoptimized
          width={1200}
        />
      ) : (
        <FileText size={42} />
      )}
      {scanning && <span className="document-scan-line" aria-hidden="true" />}
      <figcaption>
        <FileText size={14} /> {name}
      </figcaption>
    </figure>
  );
}
