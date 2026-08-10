import type { MetricAccent } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { MetricSparkline } from "./MetricSparkline";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  accent: MetricAccent;
  icon?: LucideIcon;
  trend?: "down" | "up";
  href?: string;
};

export function MetricCard({
  label,
  value,
  detail,
  accent,
  icon: Icon = Sparkles,
  trend,
  href,
}: MetricCardProps) {
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;
  const content = (
    <>
      <div className={`metric-icon ${accent}`}>
        <Icon size={17} />
      </div>
      <div className="metric-content">
        <p>{label}</p>
        <div className="metric-data-row">
          <div className="metric-value-row">
            <strong>{value}</strong>
            {trend && (
              <span className={`metric-trend ${trend}`}>
                <TrendIcon size={13} />
              </span>
            )}
          </div>
          {trend && <MetricSparkline trend={trend} />}
        </div>
        <small>{detail}</small>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="metric-card metric-card-link">
        {content}
      </Link>
    );
  }

  return (
    <div className="metric-card">
      {content}
    </div>
  );
}
