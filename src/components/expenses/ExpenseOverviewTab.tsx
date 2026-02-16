import { useMemo } from "react";
import { DollarSign, TrendingDown, Flame, PieChart } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";

const fmt = (n: number) => "$" + n.toLocaleString();

interface Props {
  categories: string[];
}

export function ExpenseOverviewTab({ categories }: Props) {
  const { expenses, totalExpenses } = useFinancial();

  const burnRate = Math.round(totalExpenses / 12);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const month = e.date.slice(0, 7); // YYYY-MM
      map[month] = (map[month] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [expenses]);

  const avgExpense = expenses.length > 0 ? Math.round(totalExpenses / expenses.length) : 0;
  const highestExpense = expenses.length > 0 ? expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]) : null;
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
          <p className="text-xs text-muted-foreground mt-1">{expenses.length} entries</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {byMonth.map(([month, amount]) => (
              <div key={month} className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{month}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{fmt(amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
