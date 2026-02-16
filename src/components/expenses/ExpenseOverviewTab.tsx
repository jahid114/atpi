import { useMemo } from "react";
import { DollarSign, TrendingDown, Flame, PieChart } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const fmt = (n: number) => "$" + n.toLocaleString();

interface Props {
  categories: string[];
  selectedYear: number;
}

export function ExpenseOverviewTab({ categories, selectedYear }: Props) {
  const { expenses, totalExpenses: allTotalExpenses } = useFinancial();

  const yearExpenses = useMemo(() => expenses.filter((e) => e.date.startsWith(String(selectedYear))), [expenses, selectedYear]);
  const totalExpenses = yearExpenses.reduce((s, e) => s + e.amount, 0);

  const burnRate = Math.round(totalExpenses / 12);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1]);
  }, [yearExpenses]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    yearExpenses.forEach((e) => {
      const month = e.date.slice(0, 7);
      map[month] = (map[month] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [yearExpenses]);

  const avgExpense = yearExpenses.length > 0 ? Math.round(totalExpenses / yearExpenses.length) : 0;
  const highestExpense = yearExpenses.length > 0 ? yearExpenses.reduce((max, e) => e.amount > max.amount ? e : max, yearExpenses[0]) : null;
  const topCategory = byCategory.length > 0 ? byCategory[0] : null;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <DollarSign className="h-4 w-4" /> Total Expenses
          </div>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmt(totalExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-1">{yearExpenses.length} entries in {selectedYear}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Flame className="h-4 w-4" /> Burn Rate
          </div>
          <p className="text-2xl xl:text-3xl font-bold text-destructive mt-1">{fmt(burnRate)}/mo</p>
          <p className="text-xs text-muted-foreground mt-1">annualized</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <TrendingDown className="h-4 w-4" /> Avg. Expense
          </div>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmt(avgExpense)}</p>
          <p className="text-xs text-muted-foreground mt-1">per entry</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <PieChart className="h-4 w-4" /> Categories
          </div>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{categories.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{byCategory.length} active</p>
        </div>
      </div>

      {/* Highest expense */}
      {highestExpense && (
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-sm font-semibold text-foreground mb-3">Largest Single Expense</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{highestExpense.description || "No description"}</p>
              <p className="text-xs text-muted-foreground">{highestExpense.category} · {highestExpense.date}</p>
            </div>
            <p className="text-xl font-bold text-destructive">{fmt(highestExpense.amount)}</p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
        <p className="text-sm font-semibold text-foreground mb-4">Spending by Category</p>
        <div className="space-y-3">
          {byCategory.map(([cat, amount]) => {
            const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{cat}</span>
                  <span className="text-muted-foreground">{fmt(amount)} <span className="text-xs">({pct.toFixed(1)}%)</span></span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {byCategory.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded yet.</p>
          )}
        </div>
      </div>

      {/* Monthly breakdown */}
      {byMonth.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-sm font-semibold text-foreground mb-3">Monthly Breakdown</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byMonth.map(([month, amount]) => ({ month, amount }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value: number) => fmt(value)}
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13, background: "hsl(var(--card))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
