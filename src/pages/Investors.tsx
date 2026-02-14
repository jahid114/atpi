import { useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Investor {
  id: number;
  name: string;
  invested: number;
  investmentDate: string;
  activeDays: number;
  proRataShare: number | null;
}

const quarterStart = new Date("2026-01-01");
const today = new Date("2026-02-14");
const quarterDays = Math.ceil((today.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));

const calcDays = (dateStr: string) => {
  const d = new Date(dateStr);
  const start = d > quarterStart ? d : quarterStart;
  return Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

const initialInvestors: Investor[] = [
  { id: 1, name: "Sarah Mitchell", invested: 200000, investmentDate: "2024-06-15", activeDays: 0, proRataShare: null },
  { id: 2, name: "James Chen", invested: 500000, investmentDate: "2025-03-01", activeDays: 0, proRataShare: null },
  { id: 3, name: "Olivia Nakamura", invested: 150000, investmentDate: "2025-11-20", activeDays: 0, proRataShare: null },
  { id: 4, name: "Marcus Williams", invested: 800000, investmentDate: "2026-01-10", activeDays: 0, proRataShare: null },
  { id: 5, name: "Elena Rodriguez", invested: 350000, investmentDate: "2025-08-05", activeDays: 0, proRataShare: null },
];

const totalProfit = 280000; // Simulated quarterly profit
const fmt = (n: number) => "$" + n.toLocaleString();

export default function Investors() {
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [calculated, setCalculated] = useState(false);

  const calculate = () => {
    const updated = investors.map((inv) => {
      const days = calcDays(inv.investmentDate);
      return { ...inv, activeDays: days };
    });
    const totalWeighted = updated.reduce((s, inv) => s + inv.invested * inv.activeDays, 0);
    const final = updated.map((inv) => ({
      ...inv,
      proRataShare: totalWeighted > 0 ? (inv.invested * inv.activeDays / totalWeighted) * totalProfit : 0,
    }));
    setInvestors(final);
    setCalculated(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investor Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Pro-rata distribution engine · Q1 2026</p>
        </div>
        <Button size="sm" onClick={calculate}>
          <Calculator size={16} className="mr-1.5" /> Calculate Distribution
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quarter Profit</p>
          <p className="text-2xl font-bold text-profit mt-1">{fmt(totalProfit)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Investors</p>
          <p className="text-2xl font-bold text-foreground mt-1">{investors.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quarter Days Elapsed</p>
          <p className="text-2xl font-bold text-foreground mt-1">{quarterDays}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investor</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Invested</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investment Date</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Active Days</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pro-Rata Share</th>
            </tr>
          </thead>
          <tbody>
            {investors.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{inv.name}</td>
                <td className="px-4 py-3 text-right text-foreground">{fmt(inv.invested)}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.investmentDate}</td>
                <td className="px-4 py-3 text-right text-foreground">{calculated ? inv.activeDays : "—"}</td>
                <td className="px-4 py-3 text-right font-medium text-profit">
                  {inv.proRataShare !== null ? fmt(Math.round(inv.proRataShare)) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
