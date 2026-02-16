import { useMemo } from "react";
import { KpiCard } from "@/components/KpiCard";
import {
  DollarSign, Users, CreditCard, TrendingUp, PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Percent, Wallet,
} from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
} from "recharts";

const chartData = [
  { month: "Mar", profit: 42000, expenses: 28000 },
  { month: "Apr", profit: 48000, expenses: 30000 },
  { month: "May", profit: 39000, expenses: 27000 },
  { month: "Jun", profit: 55000, expenses: 32000 },
  { month: "Jul", profit: 61000, expenses: 35000 },
  { month: "Aug", profit: 52000, expenses: 31000 },
  { month: "Sep", profit: 68000, expenses: 33000 },
  { month: "Oct", profit: 73000, expenses: 36000 },
  { month: "Nov", profit: 65000, expenses: 34000 },
  { month: "Dec", profit: 80000, expenses: 38000 },
  { month: "Jan", profit: 78000, expenses: 37000 },
  { month: "Feb", profit: 85000, expenses: 39000 },
];

const fmt = (n: number) => "$" + n.toLocaleString();

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(152 69% 31%)",
  "hsl(38 92% 50%)",
  "hsl(0 72% 51%)",
  "hsl(262 60% 50%)",
];

export default function Overview() {
  const { grossProfit, totalExpenses, netProfit, clients, clientTransactions, expenses } = useFinancial();

  const analytics = useMemo(() => {
    const totalDeployed = clientTransactions.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0);
    const totalReturned = clientTransactions.filter((t) => t.type === "principal_return").reduce((s, t) => s + t.amount, 0);
    const activeClients = clients.filter((c) => c.status === "active").length;
    const roi = totalDeployed > 0 ? ((grossProfit / totalDeployed) * 100).toFixed(1) : "0";
    const profitMargin = grossProfit > 0 ? ((netProfit / grossProfit) * 100).toFixed(1) : "0";
    const expenseRatio = grossProfit > 0 ? ((totalExpenses / grossProfit) * 100).toFixed(1) : "0";
    const capitalAtWork = totalDeployed - totalReturned;

    // Capital by client for pie chart
    const capitalByClient = clients.map((c) => {
      const invested = clientTransactions.filter((t) => t.clientId === c.id && t.type === "investment").reduce((s, t) => s + t.amount, 0);
      return { name: c.name, value: invested };
    }).filter((c) => c.value > 0);

    // Expense by category
    const expenseByCategory: Record<string, number> = {};
    expenses.forEach((e) => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });
    const expensePie = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    // Monthly capital flow
    const monthlyFlow: Record<string, { month: string; invested: number; returned: number; profit: number }> = {};
    clientTransactions.forEach((t) => {
      const month = t.date.slice(0, 7); // YYYY-MM
      if (!monthlyFlow[month]) monthlyFlow[month] = { month, invested: 0, returned: 0, profit: 0 };
      if (t.type === "investment") monthlyFlow[month].invested += t.amount;
      if (t.type === "principal_return") monthlyFlow[month].returned += t.amount;
      if (t.type === "profit_receive") monthlyFlow[month].profit += t.amount;
    });
    const capitalFlow = Object.values(monthlyFlow).sort((a, b) => a.month.localeCompare(b.month));

    return { totalDeployed, totalReturned, activeClients, roi, profitMargin, expenseRatio, capitalAtWork, capitalByClient, expensePie, capitalFlow };
  }, [clients, clientTransactions, expenses, grossProfit, netProfit, totalExpenses]);

  return (
    <div className="space-y-6 xl:space-y-8">
      <div>
        <h1 className="text-2xl xl:text-3xl font-bold text-foreground">ATPI</h1>
        <p className="text-sm text-muted-foreground mt-1">Analytics, Tracking & Performance Intelligence</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <KpiCard
          title="Total Capital Deployed"
          value={fmt(analytics.totalDeployed)}
          change={`${analytics.activeClients} active client${analytics.activeClients !== 1 ? "s" : ""}`}
          changeType="positive"
          icon={<Wallet size={18} className="text-primary-foreground" />}
          accentColor="bg-kpi-blue"
        />
        <KpiCard
          title="Gross Profit"
          value={fmt(grossProfit)}
          change={`ROI: ${analytics.roi}%`}
          changeType="positive"
          icon={<TrendingUp size={18} className="text-primary-foreground" />}
          accentColor="bg-kpi-emerald"
        />
        <KpiCard
          title="Operational Expenses"
          value={fmt(totalExpenses)}
          change={`Expense ratio: ${analytics.expenseRatio}%`}
          changeType="negative"
          icon={<CreditCard size={18} className="text-primary-foreground" />}
          accentColor="bg-kpi-amber"
        />
        <KpiCard
          title="Net Profit"
          value={fmt(netProfit)}
          change={`Margin: ${analytics.profitMargin}%`}
          changeType={netProfit >= 0 ? "positive" : "negative"}
          icon={<DollarSign size={18} className="text-primary-foreground" />}
          accentColor={netProfit >= 0 ? "bg-kpi-emerald" : "bg-destructive"}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:gap-6">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ArrowUpRight size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Capital at Work</p>
            <p className="text-lg font-bold text-foreground">{fmt(analytics.capitalAtWork)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-profit/10 flex items-center justify-center">
            <ArrowDownRight size={20} className="text-profit" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Principal Returned</p>
            <p className="text-lg font-bold text-foreground">{fmt(analytics.totalReturned)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Percent size={20} className="text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Return on Investment</p>
            <p className="text-lg font-bold text-foreground">{analytics.roi}%</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Profit vs Expenses + Capital Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 xl:p-8 kpi-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Profit vs Expenses — Last 12 Months</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(value: number) => fmt(value)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="hsl(152 69% 31%)" strokeWidth={2} dot={false} name="Profit" />
              <Line type="monotone" dataKey="expenses" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={false} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 xl:p-8 kpi-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Capital Allocation by Client</h2>
          {analytics.capitalByClient.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie data={analytics.capitalByClient} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {analytics.capitalByClient.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value)} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {analytics.capitalByClient.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{c.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No investments yet.</p>
          )}
        </div>
      </div>

      {/* Charts Row 2: Capital Flow + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 xl:p-8 kpi-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Capital Flow — Monthly</h2>
          {analytics.capitalFlow.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.capitalFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(value: number) => fmt(value)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                <Legend />
                <Bar dataKey="invested" fill="hsl(var(--primary))" name="Invested" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="hsl(152 69% 31%)" name="Profit Received" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returned" fill="hsl(38 92% 50%)" name="Principal Returned" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6 xl:p-8 kpi-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Expense Breakdown</h2>
          {analytics.expensePie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie data={analytics.expensePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {analytics.expensePie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value)} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {analytics.expensePie.map((e, i) => (
                  <div key={e.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{e.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{fmt(e.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No expenses yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
