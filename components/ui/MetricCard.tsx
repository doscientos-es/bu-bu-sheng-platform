import { Sparkles } from "lucide-react";
import type { MetricAccent } from "@/lib/types";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  accent: MetricAccent;
};

export function MetricCard({ label, value, detail, accent }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${accent}`}>
        <Sparkles size={17} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}
