import { useState, useMemo } from "react";
import { Wallet as WalletIcon, Plus, ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Clock, Search, Eye, DollarSign, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";
import { fmtWallet, walletTxTypeConfig, walletTxStatusConfig, transferMediumConfig } from "@/types/wallet";
import type { InvestorWallet, TransferMedium } from "@/types/wallet";
import WalletDetailDialog from "@/components/wallet/WalletDetailDialog";

export default function Wallet() {
  const { wallets, requestTransaction, approveTransaction, rejectTransaction } = useWallet();
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txForm, setTxForm] = useState<{ investorId: string; amount: string; type: "top_up" | "withdraw"; transferMedium: TransferMedium; attachment: string }>({
    investorId: "", amount: "", type: "top_up", transferMedium: "cash", attachment: "",
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<InvestorWallet | null>(null);

  const totalBalance = useMemo(() => wallets.reduce((s, w) => s + w.balance, 0), [wallets]);
  const totalTopUps = useMemo(() => wallets.reduce((s, w) => s + w.totalTopUps, 0), [wallets]);
  const totalWithdrawals = useMemo(() => wallets.reduce((s, w) => s + w.totalWithdrawals, 0), [wallets]);

  const pendingTopUps = useMemo(
    () => wallets.flatMap((w) => w.transactions.filter((t) => t.status === "pending").map((t) => ({ ...t, walletId: w.id }))),
    [wallets]
  );

  const allTransactions = useMemo(() => {
    const txs = wallets.flatMap((w) => w.transactions.map((t) => ({ ...t, walletId: w.id })));
    return txs
      .filter((t) => {
        const matchSearch = t.investorName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || t.status === statusFilter;
        const matchDateFrom = !dateFrom || t.date >= dateFrom;
        const matchDateTo = !dateTo || t.date <= dateTo;
        return matchSearch && matchStatus && matchDateFrom && matchDateTo;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [wallets, search, statusFilter, dateFrom, dateTo]);

  const handleSubmitTransaction = () => {
    if (!txForm.investorId || !txForm.amount || Number(txForm.amount) <= 0) return;
    requestTransaction(Number(txForm.investorId), Number(txForm.amount), txForm.type, txForm.transferMedium, txForm.attachment || undefined);
    setTxForm({ investorId: "", amount: "", type: "top_up", transferMedium: "cash", attachment: "" });
    setTxDialogOpen(false);
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Wallet Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Investor top-ups, withdrawals & wallet balances</p>
        </div>
        <Button onClick={() => setTxDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Transaction
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Wallets</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{wallets.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Top-Ups</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmtWallet(totalTopUps)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Withdrawals</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{fmtWallet(totalWithdrawals)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Balance</p>
          <p className="text-2xl xl:text-3xl font-bold text-profit mt-1">{fmtWallet(totalBalance)}</p>
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

        {/* Wallets Tab — now a table */}
        <TabsContent value="wallets">
          <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone Number</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">#{w.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{w.investorName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{w.phone}</td>
                    <td className="px-4 py-3 text-right font-semibold text-profit">{fmtWallet(w.balance)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setSelectedWallet(w)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-profit hover:text-profit" onClick={() => {
                          setTxForm({ investorId: String(w.id), amount: "", type: "top_up", transferMedium: "cash", attachment: "" });
                          setTxDialogOpen(true);
                        }}>
                          <ArrowUpCircle className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => {
                          setTxForm({ investorId: String(w.id), amount: "", type: "withdraw", transferMedium: "cash", attachment: "" });
                          setTxDialogOpen(true);
                        }}>
                          <ArrowDownCircle className="h-3.5 w-3.5 mr-1" /> Withdraw
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {wallets.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No wallets yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          {pendingTopUps.length > 0 ? (
            <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Medium</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTopUps.map((tx) => {
                    const typeConf = walletTxTypeConfig[tx.type];
                    return (
                      <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{tx.date}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{tx.investorName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${typeConf.color}`}>{typeConf.label}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{tx.transferMedium ? transferMediumConfig[tx.transferMedium] : "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">{fmtWallet(tx.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-profit border-profit/30 hover:bg-profit/10 hover:text-profit" onClick={() => approveTransaction(tx.walletId, tx.id)}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => rejectTransaction(tx.walletId, tx.id)}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center kpi-shadow">
              <CheckCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            </div>
          )}
        </TabsContent>

        {/* All Transactions Tab — no action column, added date filter */}
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
              <div className="flex items-center gap-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 w-auto" placeholder="From" />
                <span className="text-muted-foreground text-xs">to</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 w-auto" placeholder="To" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Medium</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
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
                        <td className="px-4 py-3 text-muted-foreground text-xs">{tx.transferMedium ? transferMediumConfig[tx.transferMedium] : "—"}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {tx.type === "top_up" ? "+" : "-"}{fmtWallet(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{tx.description}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusConf.variant} className="text-[11px]">{statusConf.label}</Badge>
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

      {/* New Transaction Dialog */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
            <DialogDescription>Submit a top-up or withdrawal request for an investor wallet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Investor *</Label>
              <Select value={txForm.investorId} onValueChange={(v) => setTxForm((f) => ({ ...f, investorId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select investor" /></SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>{w.investorName} ({w.phone})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={txForm.type} onValueChange={(v) => setTxForm((f) => ({ ...f, type: v as "top_up" | "withdraw" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top_up">Top Up</SelectItem>
                  <SelectItem value="withdraw">Withdraw</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" placeholder="10000" value={txForm.amount} onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Transfer Medium *</Label>
              <Select value={txForm.transferMedium} onValueChange={(v) => setTxForm((f) => ({ ...f, transferMedium: v as TransferMedium }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Attachment (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setTxForm((f) => ({ ...f, attachment: file?.name || "" }));
                  }}
                  className="text-xs"
                />
              </div>
              {txForm.attachment && (
                <p className="text-xs text-muted-foreground">Selected: {txForm.attachment}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSubmitTransaction}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WalletDetailDialog wallet={selectedWallet} open={!!selectedWallet} onOpenChange={(open) => !open && setSelectedWallet(null)} />
    </div>
  );
}
