import { useMemo } from "react";
import type { Investor } from "@/types/investor";
import {
  YEAR_TOTAL_DAYS,
  yearDaysElapsed,
  calculateInvestorShare,
  fmt,
} from "@/lib/investor-utils";
import { useFinancial } from "@/contexts/FinancialContext";

interface Props {
  investors: Investor[];
  profit: number;
}

export function LTIOverviewTab({ investors, profit }: Props) {
  const { grossProfit, totalExpenses } = useFinancial();
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
    <div className="space-y-6 xl:space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Investors</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{approved.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{pending.length} pending requests</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Principal</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmt(totalInvested)}</p>
          <p className="text-xs text-muted-foreground mt-1">{fmt(pendingDeposits)} pending</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Year Progress</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{yearDaysElapsed} / {YEAR_TOTAL_DAYS}</p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (yearDaysElapsed / YEAR_TOTAL_DAYS) * 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net Profit</p>
          <p className={`text-2xl xl:text-3xl font-bold mt-1 ${profit >= 0 ? "text-profit" : "text-destructive"}`}>{fmt(profit)}</p>
        </div>
      </div>

      {/* Profit Breakdown */}
      <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow space-y-3">
        <p className="text-sm font-medium text-foreground">Profit Calculation</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Gross Profit (Client Returns)</span>
            <span className="text-lg xl:text-xl font-bold text-profit mt-1">{fmt(grossProfit)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Expenses</span>
            <span className="text-lg xl:text-xl font-bold text-destructive mt-1">− {fmt(totalExpenses)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Net Profit</span>
            <span className={`text-lg xl:text-xl font-bold mt-1 ${profit >= 0 ? "text-profit" : "text-destructive"}`}>{fmt(profit)}</span>
          </div>
        </div>
      </div>

      {/* Summary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:gap-6">
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Profit Distributed</p>
          <p className="text-2xl xl:text-3xl font-bold text-profit mt-1">{fmt(totalProfitDistributed)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Withdrawals</p>
          <p className="text-2xl xl:text-3xl font-bold text-destructive mt-1">{fmt(totalWithdrawals)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net Capital</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmt(totalInvested - totalWithdrawals)}</p>
        </div>
      </div>

      {/* Top investors */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <div className="px-4 xl:px-6 py-3 xl:py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Top Investors by Projected Share</p>
        </div>
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 xl:px-6 py-2 xl:py-3 font-medium text-muted-foreground">Investor</th>
              <th className="text-right px-4 xl:px-6 py-2 xl:py-3 font-medium text-muted-foreground">Principal</th>
              <th className="text-right px-4 xl:px-6 py-2 xl:py-3 font-medium text-muted-foreground">Projected Share</th>
            </tr>
          </thead>
          <tbody>
            {topInvestors.map((inv) => (
              <tr key={inv.name} className="border-b border-border last:border-0">
                <td className="px-4 xl:px-6 py-2 xl:py-3 font-medium text-foreground">{inv.name}</td>
                <td className="px-4 xl:px-6 py-2 xl:py-3 text-right text-foreground">{fmt(inv.invested)}</td>
                <td className="px-4 xl:px-6 py-2 xl:py-3 text-right font-semibold text-profit">{fmt(Math.round(inv.share))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
