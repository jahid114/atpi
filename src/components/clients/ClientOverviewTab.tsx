import { useMemo } from "react";
import { DollarSign, TrendingUp, ArrowDownLeft, Users } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const fmt = (n: number) => "$" + n.toLocaleString();

interface Props {
  selectedYear: number;
}

export function ClientOverviewTab({ selectedYear }: Props) {
  const { clients, clientTransactions } = useFinancial();

  const yearTransactions = useMemo(
    () => clientTransactions.filter((t) => t.date.startsWith(String(selectedYear))),
    [clientTransactions, selectedYear]
  );

  const totalInvested = useMemo(
    () => yearTransactions.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0),
    [yearTransactions]
  );
  const totalProfitReceived = useMemo(
    () => yearTransactions.filter((t) => t.type === "profit_receive").reduce((s, t) => s + t.amount, 0),
    [yearTransactions]
  );
  const totalPrincipalReturned = useMemo(
    () => yearTransactions.filter((t) => t.type === "principal_return").reduce((s, t) => s + t.amount, 0),
    [yearTransactions]
  );

  const activeClients = clients.filter((c) => c.status === "active").length;

  const byClient = useMemo(() => {
    return clients.map((c) => {
      const txns = yearTransactions.filter((t) => t.clientId === c.id);
      return {
        name: c.name,
        invested: txns.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0),
        profit: txns.filter((t) => t.type === "profit_receive").reduce((s, t) => s + t.amount, 0),
        returned: txns.filter((t) => t.type === "principal_return").reduce((s, t) => s + t.amount, 0),
      };
    }).filter((c) => c.invested > 0 || c.profit > 0 || c.returned > 0);
  }, [clients, yearTransactions]);

  const byMonth = useMemo(() => {
    const map: Record<string, { investment: number; profit: number; principal: number }> = {};
    yearTransactions.forEach((t) => {
      const month = t.date.slice(0, 7);
      if (!map[month]) map[month] = { investment: 0, profit: 0, principal: 0 };
      if (t.type === "investment") map[month].investment += t.amount;
      else if (t.type === "profit_receive") map[month].profit += t.amount;
      else map[month].principal += t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, ...data }));
  }, [yearTransactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <DollarSign className="h-4 w-4" /> Total Invested
          </div>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmt(totalInvested)}</p>
          <p className="text-xs text-muted-foreground mt-1">capital deployed in {selectedYear}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Profit Received
          </div>
          <p className="text-2xl xl:text-3xl font-bold text-profit mt-1">{fmt(totalProfitReceived)}</p>
          <p className="text-xs text-muted-foreground mt-1">total returns in {selectedYear}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <ArrowDownLeft className="h-4 w-4" /> Principal Returned
          </div>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmt(totalPrincipalReturned)}</p>
          <p className="text-xs text-muted-foreground mt-1">capital returned in {selectedYear}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Users className="h-4 w-4" /> Clients
          </div>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{clients.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{activeClients} active</p>
        </div>
      </div>

      {byClient.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-sm font-semibold text-foreground mb-4">Capital by Client ({selectedYear})</p>
          <div className="space-y-3">
            {byClient.map((c) => {
              const pct = totalInvested > 0 ? (c.invested / totalInvested) * 100 : 0;
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-muted-foreground">
                      {fmt(c.invested)} <span className="text-xs">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {byMonth.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-sm font-semibold text-foreground mb-3">Monthly Transaction Volume ({selectedYear})</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value: number) => fmt(value)}
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13, background: "hsl(var(--card))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Bar dataKey="investment" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Investment" />
              <Bar dataKey="profit" fill="hsl(152 69% 31%)" radius={[4, 4, 0, 0]} name="Profit Received" />
              <Bar dataKey="principal" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Principal Return" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {byMonth.length === 0 && byClient.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center kpi-shadow">
          <p className="text-sm text-muted-foreground">No transaction data for {selectedYear}.</p>
        </div>
      )}
    </div>
  );
}
