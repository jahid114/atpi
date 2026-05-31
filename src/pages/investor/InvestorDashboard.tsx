import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import { useLTI } from "@/contexts/LTIContext";
import {
  Wallet, DollarSign, TrendingUp, ArrowDownCircle, CheckCircle, Clock, XCircle,
} from "lucide-react";
import { fmt } from "@/lib/investor-utils";
import { fmtWallet } from "@/types/wallet";
import { useState } from "react";

const CURRENT_USER = {
  name: "Alice Johnson",
  email: "alice@example.com",
  phone: "+8801711111111",
};

// Mock wallet (mirrors InvestorWallet)
const mockWallet = {
  balance: 25000,
  transactions: [
    { id: 101, type: "top_up", amount: 75000, date: "2026-01-10", status: "approved", description: "Initial wallet funding" },
    { id: 102, type: "invest_lti", amount: 30000, date: "2026-01-15", status: "approved", description: "Long-term investment from wallet" },
    { id: 103, type: "invest_sti", amount: 20000, date: "2026-02-01", status: "approved", description: "Commercial Property Flip investment" },
    { id: 104, type: "top_up", amount: 10000, date: "2026-03-01", status: "pending", description: "Wallet top-up request" },
  ],
};

// Mock STI investments (mirrors InvestorSTI)
const mockSTI = [
  { id: 1, projectName: "Commercial Property Flip", amount: 100000, date: "2026-01-20", status: "approved", expectedReturn: 18, distributed: false },
  { id: 2, projectName: "Solar Farm Phase 1", amount: 50000, date: "2025-09-10", status: "approved", expectedReturn: 15, distributed: true },
];

type UnifiedTx = {
  id: string;
  date: string;
  source: "Wallet" | "Direct";
  type: string;
  description: string;
  amount: number;
  direction: "in" | "out" | "neutral";
  status: "approved" | "pending" | "rejected";
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  approved: { label: "Approved", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  rejected: { label: "Rejected", variant: "destructive" },
};

const sourceColor: Record<string, string> = {
  Wallet: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Direct: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const walletTypeLabel: Record<string, string> = {
  top_up: "Top Up",
  withdraw: "Withdraw",
  invest_lti: "Invest (LTI)",
  invest_sti: "Invest (STI)",
};

function getStatusIcon(status: string) {
  switch (status) {
    case "approved": return <CheckCircle className="h-3.5 w-3.5" />;
    case "pending": return <Clock className="h-3.5 w-3.5" />;
    case "rejected": return <XCircle className="h-3.5 w-3.5" />;
    default: return null;
  }
}

export default function InvestorDashboard() {
  const { investors } = useLTI();
  const ltiInvestor = useMemo(() => investors.find((i) => i.email === CURRENT_USER.email) || null, [investors]);

  const [sourceFilter, setSourceFilter] = useState<"all" | "Wallet" | "Direct">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");

  // LTI aggregates
  const ltiApproved = ltiInvestor?.status === "approved";
  const ltiDeposited = useMemo(() => ltiInvestor?.history.filter(h => h.type === "deposit" && h.status === "approved").reduce((s, h) => s + h.amount, 0) || 0, [ltiInvestor]);
  const ltiWithdrawn = useMemo(() => ltiInvestor?.history.filter(h => h.type === "withdrawal" && h.status === "approved").reduce((s, h) => s + h.amount, 0) || 0, [ltiInvestor]);
  const ltiPayouts = useMemo(() => ltiInvestor?.history.filter(h => h.type === "payout" && h.status === "approved").reduce((s, h) => s + h.amount, 0) || 0, [ltiInvestor]);
  const ltiCurrent = ltiDeposited - ltiWithdrawn;

  // STI aggregates
  const stiInvested = useMemo(() => mockSTI.filter(s => s.status === "approved").reduce((s, x) => s + x.amount, 0), []);
  const stiProfit = useMemo(() => mockSTI.filter(s => s.distributed && s.status === "approved").reduce((sum, s) => sum + Math.round(s.amount * s.expectedReturn / 100), 0), []);
  const stiExpected = useMemo(() => mockSTI.filter(s => s.status === "approved").reduce((sum, s) => sum + Math.round(s.amount * s.expectedReturn / 100), 0), []);

  // Wallet aggregates
  const walletWithdrawn = useMemo(() => mockWallet.transactions.filter(t => t.type === "withdraw" && t.status === "approved").reduce((s, t) => s + t.amount, 0), []);

  // KPIs
  const totalInvested = ltiCurrent + stiInvested;
  const totalWithdrawn = ltiWithdrawn + walletWithdrawn;
  const totalProfit = ltiPayouts + stiProfit;

  // Unified transactions
  const unifiedTx: UnifiedTx[] = useMemo(() => {
    const all: UnifiedTx[] = [];

    mockWallet.transactions.forEach((t) => {
      const dir: UnifiedTx["direction"] = t.type === "top_up" ? "in" : "out";
      all.push({
        id: `wallet-${t.id}`,
        date: t.date,
        source: "Wallet",
        type: walletTypeLabel[t.type] || t.type,
        description: t.description,
        amount: t.amount,
        direction: dir,
        status: t.status as UnifiedTx["status"],
      });
    });

    if (ltiInvestor) {
      ltiInvestor.history.forEach((h) => {
        const dir: UnifiedTx["direction"] = h.type === "payout" ? "in" : h.type === "withdrawal" ? "out" : "neutral";
        const typeLabel = h.type === "deposit" ? "Deposit" : h.type === "withdrawal" ? "Withdrawal" : "Profit Payout";
        const src: UnifiedTx["source"] = h.fundingSource === "wallet" ? "Wallet" : "Direct";
        all.push({
          id: `lti-${h.id}`,
          date: h.date,
          source: src,
          type: `LTI ${typeLabel}`,
          description: h.description || `Long-term ${typeLabel.toLowerCase()}`,
          amount: h.amount,
          direction: dir,
          status: h.status as UnifiedTx["status"],
        });
      });
    }

    mockSTI.forEach((s) => {
      const src: UnifiedTx["source"] = (s as any).fundingSource === "wallet" ? "Wallet" : "Direct";
      all.push({
        id: `sti-${s.id}`,
        date: s.date,
        source: src,
        type: "STI Investment",
        description: s.projectName,
        amount: s.amount,
        direction: "out",
        status: s.status as UnifiedTx["status"],
      });
      if (s.distributed && s.status === "approved") {
        all.push({
          id: `sti-payout-${s.id}`,
          date: s.date,
          source: src,
          type: "STI Profit Payout",
          description: `${s.projectName} · distributed return`,
          amount: Math.round(s.amount * s.expectedReturn / 100),
          direction: "in",
          status: "approved",
        });
      }
    });

    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ltiInvestor]);

  const filteredTx = useMemo(() => {
    return unifiedTx.filter((t) => {
      if (sourceFilter !== "all" && t.source !== sourceFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      return true;
    });
  }, [unifiedTx, sourceFilter, statusFilter]);

  const pagination = usePagination(filteredTx, { pageSize: 8 });

  return (
    <div className="space-y-6 xl:space-y-8">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
        </div>
        <CardContent className="relative py-6 px-6 sm:py-8 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary-foreground/70 font-medium">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <h1 className="text-2xl xl:text-3xl font-bold mt-1">Welcome back, {CURRENT_USER.name.split(" ")[0]} 👋</h1>
            <p className="text-sm text-primary-foreground/80 mt-2 max-w-xl">
              Here's a snapshot of your wallet, investments, and returns. Keep growing your portfolio.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 rounded-xl bg-white/10 backdrop-blur-sm px-5 py-4 border border-white/20">
            <span className="text-[11px] uppercase tracking-wider text-primary-foreground/70">Wallet Balance</span>
            <span className="text-xl font-bold">{fmtWallet(mockWallet.balance)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Wallet Balance" value={fmtWallet(mockWallet.balance)} icon={<Wallet className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-blue))]" />
        <KpiCard title="Total Invested" value={fmt(totalInvested)} icon={<TrendingUp className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-emerald))]" />
        <KpiCard title="Total Withdrawn" value={fmt(totalWithdrawn)} icon={<ArrowDownCircle className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-amber))]" />
        <KpiCard title="Total Profit" value={fmt(totalProfit)} icon={<DollarSign className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-slate))]" />
      </div>

      {/* Investment Summary */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Investment Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-5 pb-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Long-Term Investment</p>
                {ltiInvestor && <Badge variant={ltiApproved ? "default" : "secondary"} className="text-[10px]">{ltiInvestor.status}</Badge>}
              </div>
              {ltiInvestor ? (
                <>
                  <p className="text-sm text-foreground">Shares: <span className="font-semibold">{ltiInvestor.shares ?? 0}</span></p>
                  <p className="text-sm text-foreground">Current Investment: <span className="font-semibold">{fmt(ltiCurrent)}</span></p>
                  <p className="text-sm text-foreground">Withdrawn: <span className="font-semibold">{fmt(ltiWithdrawn)}</span></p>
                  <p className="text-sm text-emerald-600">Profit Received: {fmt(ltiPayouts)}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not registered for long-term investment yet.</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-5 pb-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Short-Term Investment</p>
                <Badge variant="default" className="text-[10px]">{mockSTI.length} project{mockSTI.length !== 1 ? "s" : ""}</Badge>
              </div>
              <p className="text-sm text-foreground">Total Invested: <span className="font-semibold">{fmt(stiInvested)}</span></p>
              <p className="text-sm text-foreground">Expected Returns: <span className="font-semibold">{fmt(stiExpected)}</span></p>
              <p className="text-sm text-emerald-600">Distributed Profit: {fmt(stiProfit)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <div className="flex gap-2">
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Wallet">Wallet</SelectItem>
                <SelectItem value="Direct">Direct</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions found.</TableCell>
                  </TableRow>
                ) : (
                  pagination.paginatedItems.map((tx) => {
                    const sConf = statusConfig[tx.status];
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap">{tx.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${sourceColor[tx.source]}`}>{tx.source}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{tx.type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate">{tx.description}</TableCell>
                        <TableCell className={`text-right font-medium ${tx.direction === "in" ? "text-profit" : tx.direction === "out" ? "text-destructive" : "text-foreground"}`}>
                          {tx.direction === "in" ? "+" : tx.direction === "out" ? "-" : ""}{fmt(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sConf.variant} className="gap-1 text-xs">
                            {getStatusIcon(tx.status)}
                            {sConf.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
            totalItems={filteredTx.length}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}