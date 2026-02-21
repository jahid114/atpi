import { useState, useMemo } from "react";
import { Wallet as WalletIcon, Plus, ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Clock, Search, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useWallet } from "@/contexts/WalletContext";
import { fmtWallet, walletTxTypeConfig, walletTxStatusConfig } from "@/types/wallet";
import type { WalletTransactionStatus } from "@/types/wallet";

export default function Wallet() {
  const { wallets, requestTopUp, approveTransaction, rejectTransaction } = useWallet();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpForm, setTopUpForm] = useState({ investorName: "", email: "", amount: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const totalBalance = useMemo(() => wallets.reduce((s, w) => s + w.balance, 0), [wallets]);
  const totalTopUps = useMemo(() => wallets.reduce((s, w) => s + w.totalTopUps, 0), [wallets]);
  const totalSpent = useMemo(() => wallets.reduce((s, w) => s + w.totalSpent, 0), [wallets]);
  const pendingTopUps = useMemo(
    () => wallets.flatMap((w) => w.transactions.filter((t) => t.status === "pending" && t.type === "top_up").map((t) => ({ ...t, walletId: w.id }))),
    [wallets]
  );

  const allTransactions = useMemo(() => {
    const txs = wallets.flatMap((w) => w.transactions.map((t) => ({ ...t, walletId: w.id })));
    return txs
      .filter((t) => {
        const matchSearch = t.investorName.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || t.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [wallets, search, statusFilter]);

  const handleTopUp = () => {
    if (!topUpForm.investorName || !topUpForm.email || !topUpForm.amount) return;
    requestTopUp(topUpForm.investorName, topUpForm.email, Number(topUpForm.amount));
    setTopUpForm({ investorName: "", email: "", amount: "" });
    setTopUpOpen(false);
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Wallet Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Investor top-ups & wallet balances · No interest earned</p>
        </div>
        <Button onClick={() => setTopUpOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Top-Up
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Wallets</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{wallets.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Balance</p>
          <p className="text-2xl xl:text-3xl font-bold text-profit mt-1">{fmtWallet(totalBalance)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Top-Ups</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmtWallet(totalTopUps)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Spent</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmtWallet(totalSpent)}</p>
        </div>
      </div>

      <Tabs defaultValue="wallets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="wallets" className="gap-1.5 text-xs sm:text-sm">
            <WalletIcon className="h-4 w-4" /> Wallets
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="h-4 w-4" /> Requests ({pendingTopUps.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm">
            <ArrowUpCircle className="h-4 w-4" /> All Transactions
          </TabsTrigger>
        </TabsList>

        {/* Wallets Tab */}
        <TabsContent value="wallets">
          <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Top-Ups</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Spent</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{w.investorName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{w.email}</td>
                    <td className="px-4 py-3 text-right font-semibold text-profit">{fmtWallet(w.balance)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{fmtWallet(w.totalTopUps)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{fmtWallet(w.totalSpent)}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{w.transactions.length}</td>
                  </tr>
                ))}
                {wallets.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No wallets yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Requests Tab (pending top-ups) */}
        <TabsContent value="requests">
          {pendingTopUps.length > 0 ? (
            <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
              <div className="px-4 py-3 border-b border-border bg-muted/50">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Pending Top-Up Requests
                </p>
              </div>
              <div className="divide-y divide-border">
                {pendingTopUps.map((tx) => (
                  <div key={tx.id} className="px-4 py-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{tx.investorName}</p>
                      <p className="text-xs text-muted-foreground">{tx.email} · {tx.date}</p>
                      <p className="text-sm font-semibold text-foreground">{fmtWallet(tx.amount)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="text-profit border-profit/30 hover:bg-profit/10 hover:text-profit" onClick={() => approveTransaction(tx.walletId, tx.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => rejectTransaction(tx.walletId, tx.id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center kpi-shadow">
              <CheckCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending top-up requests.</p>
            </div>
          )}
        </TabsContent>

        {/* All Transactions Tab */}
        <TabsContent value="transactions">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by investor…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((tx) => {
                    const typeConf = walletTxTypeConfig[tx.type];
                    const statusConf = walletTxStatusConfig[tx.status];
                    return (
                      <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{tx.date}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{tx.investorName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${typeConf.color}`}>
                            {tx.type === "top_up" ? <ArrowUpCircle className="inline h-3.5 w-3.5 mr-1" /> : <ArrowDownCircle className="inline h-3.5 w-3.5 mr-1" />}
                            {typeConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {tx.type === "top_up" ? "+" : "-"}{fmtWallet(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{tx.description}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusConf.variant} className="text-[11px]">{statusConf.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {tx.status === "pending" && (
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-profit hover:text-profit" onClick={() => approveTransaction(tx.walletId, tx.id)}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => rejectTransaction(tx.walletId, tx.id)}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {allTransactions.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No transactions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Top-Up Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Wallet Top-Up</DialogTitle>
            <DialogDescription>Submit a top-up request. It will require admin approval before the balance is credited.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Investor Name *</Label>
              <Input placeholder="e.g. Alice Johnson" value={topUpForm.investorName} onChange={(e) => setTopUpForm((f) => ({ ...f, investorName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="alice@example.com" value={topUpForm.email} onChange={(e) => setTopUpForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" placeholder="10000" value={topUpForm.amount} onChange={(e) => setTopUpForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleTopUp}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
