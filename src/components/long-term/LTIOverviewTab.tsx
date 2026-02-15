import { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import type { Investor } from "@/types/investor";
import {
  QUARTER_TOTAL_DAYS,
  quarterDaysElapsed,
  calculateInvestorShare,
  fmt,
} from "@/lib/investor-utils";

interface Props {
  investors: Investor[];
  profit: number;
  onProfitChange: (v: number) => void;
}

export function LTIOverviewTab({ investors, profit, onProfitChange }: Props) {
  const approved = useMemo(() => investors.filter((i) => i.status === "approved"), [investors]);
  const pending = useMemo(() => investors.filter((i) => i.status === "pending"), [investors]);
  const totalInvested = approved.reduce((s, i) => s + i.invested, 0);
  const totalProfitDistributed = approved.reduce(
    (s, inv) => s + inv.history.filter((h) => h.type === "payout" && h.status === "approved").reduce((a, h) => a + h.amount, 0),
    0
  );
  const totalWithdrawals = approved.reduce(
    (s, inv) => s + inv.history.filter((h) => h.type === "withdrawal" && h.status === "approved").reduce((a, h) => a + h.amount, 0),
    0
  );
  const pendingDeposits = pending.reduce(
    (s, inv) => s + inv.history.filter((h) => h.type === "deposit" && h.status === "pending").reduce((a, h) => a + h.amount, 0),
    0
  );

  const topInvestors = useMemo(() => {
    return approved
      .map((inv) => ({
        name: inv.name,
        invested: inv.invested,
        share: calculateInvestorShare(inv, profit, investors),
      }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 5);
  }, [approved, profit, investors]);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Investors</p>
          <p className="text-2xl font-bold text-foreground mt-1">{approved.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{pending.length} pending requests</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Principal</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalInvested)}</p>
          <p className="text-xs text-muted-foreground mt-1">{fmt(pendingDeposits)} pending</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quarter Progress</p>
          <p className="text-2xl font-bold text-foreground mt-1">{quarterDaysElapsed} / {QUARTER_TOTAL_DAYS}</p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (quarterDaysElapsed / QUARTER_TOTAL_DAYS) * 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Simulated Profit</p>
          <p className="text-2xl font-bold text-profit mt-1">{fmt(profit)}</p>
        </div>
      </div>

      {/* Profit Slider */}
      <div className="bg-card border border-border rounded-lg p-5 kpi-shadow space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Simulate Quarter Net Profit</p>
          <span className="text-sm font-bold text-profit">{fmt(profit)}</span>
        </div>
        <Slider min={0} max={1000000} step={10000} value={[profit]} onValueChange={(v) => onProfitChange(v[0])} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>$1,000,000</span>
        </div>
      </div>

      {/* Summary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Profit Distributed</p>
          <p className="text-2xl font-bold text-profit mt-1">{fmt(totalProfitDistributed)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Withdrawals</p>
          <p className="text-2xl font-bold text-destructive mt-1">{fmt(totalWithdrawals)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net Capital</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalInvested - totalWithdrawals)}</p>
        </div>
      </div>

      {/* Top investors */}
      <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Top Investors by Projected Share</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Investor</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Principal</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Projected Share</th>
            </tr>
          </thead>
          <tbody>
            {topInvestors.map((inv) => (
              <tr key={inv.name} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium text-foreground">{inv.name}</td>
                <td className="px-4 py-2 text-right text-foreground">{fmt(inv.invested)}</td>
                <td className="px-4 py-2 text-right font-semibold text-profit">{fmt(Math.round(inv.share))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
