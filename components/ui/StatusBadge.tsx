import type { StatusTone } from "@/lib/types";

type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
};

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span className={`status ${tone}`}>
      <span />
      {label}
    </span>
  );
}
