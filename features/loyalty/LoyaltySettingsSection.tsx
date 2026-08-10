import type { LoyaltyRule } from "@/lib/types";
import { LoyaltyRulesPanel } from "./LoyaltyRulesPanel";

type LoyaltySettingsSectionProps = {
  rules: LoyaltyRule[];
  onSaveRule: (rule: LoyaltyRule) => Promise<void>;
};

export function LoyaltySettingsSection({ rules, onSaveRule }: LoyaltySettingsSectionProps) {
  return (
    <section className="loyalty-settings">
      <div className="section-heading page-heading">
        <div>
          <p className="eyebrow">CONFIGURACIÓN</p>
          <h1>Fidelización y descuentos</h1>
          <p className="subtitle">
            Configura las recompensas para que se apliquen automáticamente.
          </p>
        </div>
      </div>
      <LoyaltyRulesPanel rules={rules} onSave={onSaveRule} />
    </section>
  );
}
