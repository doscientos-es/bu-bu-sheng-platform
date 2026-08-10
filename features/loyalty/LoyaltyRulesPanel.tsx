"use client";

import { useState } from "react";
import type { LoyaltyRule } from "@/lib/types";

const RULE_COPY = {
  birthday: {
    description: "Se revisa cada mañana y se envía una sola vez por cumpleaños y año.",
    title: "Cumpleaños",
  },
  inactivity: {
    description: "Solo se aplica a personas que ya han registrado al menos una visita.",
    title: "Reactivación",
  },
  visit_milestone: {
    description: "Se evalúa al registrar una visita y se repite en cada nuevo hito.",
    title: "Visitas acumuladas",
  },
} as const;

type LoyaltyRulesPanelProps = {
  rules: LoyaltyRule[];
  onSave: (rule: LoyaltyRule) => Promise<void>;
};

function RuleEditor({
  rule,
  onSave,
}: {
  rule: LoyaltyRule;
  onSave: (rule: LoyaltyRule) => Promise<void>;
}) {
  const [draft, setDraft] = useState(rule);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = RULE_COPY[rule.type];
  const needsThreshold = rule.type !== "birthday";
  const thresholdLabel =
    rule.type === "visit_milestone" ? "Cada cuántas visitas" : "Días sin visitar";

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se ha podido guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="loyalty-rule-card">
      <div className="loyalty-rule-heading">
        <div>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
        <label className="rule-toggle">
          <input
            checked={draft.active}
            type="checkbox"
            onChange={(event) =>
              setDraft((current) => ({ ...current, active: event.target.checked }))
            }
          />
          <span>{draft.active ? "Activa" : "Pausada"}</span>
        </label>
      </div>

      <div className="loyalty-rule-fields">
        {needsThreshold && (
          <label>
            {thresholdLabel}
            <input
              min="1"
              type="number"
              value={draft.threshold ?? 1}
              onChange={(event) =>
                setDraft((current) => ({ ...current, threshold: Number(event.target.value) || 1 }))
              }
            />
          </label>
        )}
        <label>
          Validez (días)
          <input
            min="1"
            type="number"
            value={draft.validityDays}
            onChange={(event) =>
              setDraft((current) => ({ ...current, validityDays: Number(event.target.value) || 1 }))
            }
          />
        </label>
        <label>
          Recompensa
          <input
            value={draft.rewardName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, rewardName: event.target.value }))
            }
          />
        </label>
      </div>
      <label className="loyalty-rule-description">
        Texto para el email
        <textarea
          rows={2}
          value={draft.rewardDescription}
          onChange={(event) =>
            setDraft((current) => ({ ...current, rewardDescription: event.target.value }))
          }
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="loyalty-rule-actions">
        <small>Solo se comunica a clientes con consentimiento de email.</small>
        <button className="secondary-button" disabled={isSaving} type="button" onClick={save}>
          {isSaving ? "Guardando…" : "Guardar regla"}
        </button>
      </div>
    </article>
  );
}

export function LoyaltyRulesPanel({ rules, onSave }: LoyaltyRulesPanelProps) {
  return (
    <section className="loyalty-rules" aria-label="Automatizaciones de fidelización">
      <div className="dashboard-panel-heading">
        <div>
          <p className="panel-kicker">AUTOMATIZACIONES</p>
          <h2>Condiciones de los descuentos</h2>
        </div>
        <p>Configura qué ocurre y qué recibe cada cliente.</p>
      </div>
      <div className="loyalty-rule-grid">
        {rules.map((rule) => (
          <RuleEditor key={rule.id} rule={rule} onSave={onSave} />
        ))}
      </div>
    </section>
  );
}
