import { KpiCard } from "@/components/KpiCard";
import { DollarSign, Users, CreditCard, TrendingUp } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
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

export default function Overview() {
  const { grossProfit, totalExpenses, netProfit } = useFinancial();
  const totalInvested = grossProfit; // Client returns represent deployed capital returns

  return (
    <div className="space-y-6 xl:space-y-8">
      <div>
        <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time financial overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <KpiCard
          title="Gross Profit"
          value={fmt(grossProfit)}
          change="From client returns"
          changeType="positive"
          icon={<DollarSign size={18} className="text-primary-foreground" />}
          accentColor="bg-kpi-blue"
        />
        <KpiCard
          title="Client Returns"
          value={fmt(grossProfit)}
          change="Actual returns received"
          changeType="positive"
          icon={<TrendingUp size={18} className="text-primary-foreground" />}
          accentColor="bg-kpi-emerald"
        />
        <KpiCard
          title="Operational Expenses"
          value={fmt(totalExpenses)}
          change="Total deductions"
          changeType="negative"
          icon={<CreditCard size={18} className="text-primary-foreground" />}
          accentColor="bg-kpi-amber"
        />
        <KpiCard
          title="Net Profit"
          value={fmt(netProfit)}
          change={netProfit >= 0 ? `Margin: ${grossProfit > 0 ? ((netProfit / grossProfit) * 100).toFixed(1) : 0}%` : "Loss"}
          changeType={netProfit >= 0 ? "positive" : "negative"}
          icon={<Users size={18} className="text-primary-foreground" />}
          accentColor={netProfit >= 0 ? "bg-kpi-emerald" : "bg-destructive"}
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-6 xl:p-8 kpi-shadow">
        <h2 className="text-sm font-semibold text-foreground mb-4">Profit vs Expenses — Last 12 Months</h2>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" />
            <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" />
            <Tooltip
              formatter={(value: number) => fmt(value)}
              contentStyle={{ borderRadius: 8, border: "1px solid hsl(214 32% 91%)", fontSize: 13 }}
            />
            <Legend />
            <Line type="monotone" dataKey="profit" stroke="hsl(152 69% 31%)" strokeWidth={2} dot={false} name="Profit" />
            <Line type="monotone" dataKey="expenses" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={false} name="Expenses" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
