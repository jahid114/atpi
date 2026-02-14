import { useState, useMemo } from "react";
import { Calculator, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface Investor {
  id: number;
  name: string;
  invested: number;
  investmentDate: string;
}

const QUARTER_START = new Date("2026-01-01");
const TODAY = new Date("2026-02-14");
const QUARTER_TOTAL_DAYS = 90;

const calcDaysActive = (dateStr: string): number => {
  const d = new Date(dateStr);
  const start = d > QUARTER_START ? d : QUARTER_START;
  return Math.max(0, Math.ceil((TODAY.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

const calculateProRata = (amount: number, joinDate: string, periodTotalDays: number, totalProfit: number, allInvestors: Investor[]): number => {
  const daysActive = calcDaysActive(joinDate);
  const weight = amount * daysActive;
  const totalWeight = allInvestors.reduce((s, inv) => s + inv.invested * calcDaysActive(inv.investmentDate), 0);
  return totalWeight > 0 ? (weight / totalWeight) * totalProfit : 0;
};

const getPeriodBadge = (dateStr: string): "Early-Period" | "Mid-Period" => {
  const daysActive = calcDaysActive(dateStr);
  const quarterElapsed = Math.ceil((TODAY.getTime() - QUARTER_START.getTime()) / (1000 * 60 * 60 * 24));
  return daysActive >= quarterElapsed * 0.75 ? "Early-Period" : "Mid-Period";
};

const investors: Investor[] = [
  { id: 1, name: "Sarah Mitchell", invested: 200000, investmentDate: "2024-06-15" },
  { id: 2, name: "James Chen", invested: 500000, investmentDate: "2025-03-01" },
  { id: 3, name: "Olivia Nakamura", invested: 150000, investmentDate: "2025-11-20" },
  { id: 4, name: "Marcus Williams", invested: 800000, investmentDate: "2026-01-10" },
  { id: 5, name: "Elena Rodriguez", invested: 350000, investmentDate: "2025-08-05" },
];

const fmt = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const quarterDaysElapsed = Math.ceil((TODAY.getTime() - QUARTER_START.getTime()) / (1000 * 60 * 60 * 24));

export default function Investors() {
  const [profit, setProfit] = useState(280000);

  const rows = useMemo(() =>
    investors.map((inv) => {
      const daysActive = calcDaysActive(inv.investmentDate);
      const share = calculateProRata(inv.invested, inv.investmentDate, QUARTER_TOTAL_DAYS, profit, investors);
      const badge = getPeriodBadge(inv.investmentDate);
      return { ...inv, daysActive, share, badge };
    }),
    [profit]
  );

  const totalInvested = investors.reduce((s, i) => s + i.invested, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Investor Ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">Pro-rata distribution engine · Q1 2026</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Investors</p>
          <p className="text-2xl font-bold text-foreground mt-1">{investors.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Principal</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalInvested)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Days Elapsed</p>
          <p className="text-2xl font-bold text-foreground mt-1">{quarterDaysElapsed} / {QUARTER_TOTAL_DAYS}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Simulated Profit</p>
          <p className="text-2xl font-bold text-profit mt-1">{fmt(profit)}</p>
        </div>
      </div>

      {/* Simulate Quarter Slider */}
      <div className="bg-card border border-border rounded-lg p-5 kpi-shadow space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Simulate Quarter Net Profit</p>
          <span className="text-sm font-bold text-profit">{fmt(profit)}</span>
        </div>
        <Slider
          min={0}
          max={1000000}
          step={10000}
          value={[profit]}
          onValueChange={(v) => setProfit(v[0])}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>$1,000,000</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investor Name</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Principal</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investment Date</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Days Active</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Period</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Projected Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{inv.name}</td>
                <td className="px-4 py-3 text-right text-foreground">{fmt(inv.invested)}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.investmentDate}</td>
                <td className="px-4 py-3 text-right text-foreground">{inv.daysActive}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={inv.badge === "Early-Period" ? "default" : "secondary"} className="text-[11px]">
                    {inv.badge}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-profit">{fmt(Math.round(inv.share))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td className="px-4 py-3 font-semibold text-foreground">Total</td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(totalInvested)}</td>
              <td colSpan={3} />
              <td className="px-4 py-3 text-right font-bold text-profit">{fmt(profit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
