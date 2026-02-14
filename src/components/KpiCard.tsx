import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: ReactNode;
  accentColor: string;
}

export function KpiCard({ title, value, change, changeType = "neutral", icon, accentColor }: KpiCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 kpi-shadow hover:kpi-shadow-hover transition-shadow animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={`text-xs font-medium ${
              changeType === "positive" ? "text-profit" : changeType === "negative" ? "text-loss" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${accentColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
