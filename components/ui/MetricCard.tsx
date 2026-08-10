import type { LucideIcon } from "lucide-react";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { MetricAccent } from "@/lib/types";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  accent: MetricAccent;
  icon?: LucideIcon;
  trend?: "down" | "up";
};

export function MetricCard({
  label,
  value,
  detail,
  accent,
  icon: Icon = Sparkles,
  trend,
}: MetricCardProps) {
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;

  return (
    <div className="metric-card">
      <div className={`metric-icon ${accent}`}>
        <Icon size={17} />
      </div>
      <div className="metric-content">
        <p>{label}</p>
        <div className="metric-value-row">
          <strong>{value}</strong>
          {trend && (
            <span className={`metric-trend ${trend}`}>
              <TrendIcon size={13} />
            </span>
          )}
        </div>
        <small>{detail}</small>
      </div>
      {trend && (
        <svg className={`metric-sparkline ${trend}`} viewBox="0 0 72 26" aria-hidden="true">
          <polyline
            points={
              trend === "up"
                ? "1,21 12,18 22,20 34,7 45,14 56,5 71,12"
                : "1,7 12,14 23,10 34,19 45,13 56,18 71,8"
            }
          />
        </svg>
      )}
    </div>
  );
}
