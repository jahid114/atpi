import { useState, useMemo } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Wallet as WalletIcon, Plus, ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Clock, Search, Eye, DollarSign, Upload, Paperclip, User, Hash, CalendarIcon, CreditCard, FileText } from "lucide-react";
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
import type { InvestorWallet, TransferMedium, WalletTransaction } from "@/types/wallet";
import WalletDetailDialog from "@/components/wallet/WalletDetailDialog";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/TablePagination";

export default function Wallet() {
  const { addNotification } = useNotifications();
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
  const [viewTx, setViewTx] = useState<(WalletTransaction & { walletId: number }) | null>(null);

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

  // Pagination hooks
  const walletsPagination = usePagination(wallets);
  const requestsPagination = usePagination(pendingTopUps);
  const txPagination = usePagination(allTransactions);

  const handleSubmitTransaction = () => {
    if (!txForm.investorId || !txForm.amount || Number(txForm.amount) <= 0) return;
    const wallet = wallets.find(w => w.id === Number(txForm.investorId));
    requestTransaction(Number(txForm.investorId), Number(txForm.amount), txForm.type, txForm.transferMedium, txForm.attachment || undefined);
    addNotification({
      type: "wallet",
      action: "request",
      title: `New ${txForm.type === "top_up" ? "Top-Up" : "Withdrawal"} Request`,
      message: `${wallet?.investorName || "Investor"} requested a ${txForm.type === "top_up" ? "top-up" : "withdrawal"} of $${Number(txForm.amount).toLocaleString()}`,
      link: "/wallet",
    });
    setTxForm({ investorId: "", amount: "", type: "top_up", transferMedium: "cash", attachment: "" });
    setTxDialogOpen(false);
  };

  const handleApprove = (walletId: number, txId: number) => {
    const wallet = wallets.find(w => w.id === walletId);
    const tx = wallet?.transactions.find(t => t.id === txId);
    approveTransaction(walletId, txId);
    addNotification({
      type: "wallet",
      action: "approved",
      title: "Transaction Approved",
      message: `${tx?.investorName || "Investor"}'s ${tx?.type === "top_up" ? "top-up" : "withdrawal"} of $${tx?.amount?.toLocaleString() || 0} has been approved`,
      link: "/wallet",
    });
  };

  const handleReject = (walletId: number, txId: number) => {
    const wallet = wallets.find(w => w.id === walletId);
    const tx = wallet?.transactions.find(t => t.id === txId);
    rejectTransaction(walletId, txId);
    addNotification({
      type: "wallet",
      action: "rejected",
      title: "Transaction Rejected",
      message: `${tx?.investorName || "Investor"}'s ${tx?.type === "top_up" ? "top-up" : "withdrawal"} of $${tx?.amount?.toLocaleString() || 0} has been rejected`,
      link: "/wallet",
    });
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

        {/* Wallets Tab */}
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
                {walletsPagination.paginatedItems.map((w) => (
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
          <TablePagination
            currentPage={walletsPagination.currentPage}
            totalPages={walletsPagination.totalPages}
            totalItems={walletsPagination.totalItems}
            onPageChange={walletsPagination.goToPage}
            hasNextPage={walletsPagination.hasNextPage}
            hasPrevPage={walletsPagination.hasPrevPage}
          />
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          {pendingTopUps.length > 0 ? (
            <>
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
                    {requestsPagination.paginatedItems.map((tx) => {
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
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setViewTx(tx)}>
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-profit border-profit/30 hover:bg-profit/10 hover:text-profit" onClick={() => handleApprove(tx.walletId, tx.id)}>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleReject(tx.walletId, tx.id)}>
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
              <TablePagination
                currentPage={requestsPagination.currentPage}
                totalPages={requestsPagination.totalPages}
                totalItems={requestsPagination.totalItems}
                onPageChange={requestsPagination.goToPage}
                hasNextPage={requestsPagination.hasNextPage}
                hasPrevPage={requestsPagination.hasPrevPage}
              />
            </>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center kpi-shadow">
              <CheckCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending requests.</p>
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
                  {txPagination.paginatedItems.map((tx) => {
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
            <TablePagination
              currentPage={txPagination.currentPage}
              totalPages={txPagination.totalPages}
              totalItems={txPagination.totalItems}
              onPageChange={txPagination.goToPage}
              hasNextPage={txPagination.hasNextPage}
              hasPrevPage={txPagination.hasPrevPage}
            />
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

      {/* View Request Detail Dialog */}
      <Dialog open={!!viewTx} onOpenChange={(open) => !open && setViewTx(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewTx && (() => {
            const typeConf = walletTxTypeConfig[viewTx.type];
            const statusConf = walletTxStatusConfig[viewTx.status];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Request Details
                  </DialogTitle>
                  <DialogDescription>Full details for this transaction request.</DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                  {/* Transaction Info */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Info</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Investor</p>
                          <p className="text-sm font-medium text-foreground">{viewTx.investorName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transaction ID</p>
                          <p className="text-sm font-mono font-medium text-foreground">#{viewTx.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</p>
                          <p className="text-sm font-medium text-foreground">{viewTx.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Details</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-card border border-border rounded-lg p-3 text-center">
                        <DollarSign className={`h-5 w-5 mx-auto mb-1 ${typeConf.color}`} />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</p>
                        <p className={`text-lg font-bold mt-0.5 ${typeConf.color}`}>
                          {viewTx.type === "top_up" ? "+" : "-"}{fmtWallet(viewTx.amount)}
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3 text-center">
                        <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">{typeConf.label}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3 text-center">
                        <CreditCard className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transfer Medium</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">{viewTx.transferMedium ? transferMediumConfig[viewTx.transferMedium] : "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Details</p>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-start gap-2.5">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Description</p>
                          <p className="text-sm font-medium text-foreground">{viewTx.description || "No description provided"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Paperclip className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Attachment</p>
                          {viewTx.attachment ? (
                            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                              <Paperclip className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate">{viewTx.attachment}</span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No attachment</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 px-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={statusConf.variant} className="text-xs">{statusConf.label}</Badge>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                  {viewTx.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => { handleReject(viewTx.walletId, viewTx.id); setViewTx(null); }}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button
                        className="bg-profit text-white hover:bg-profit/90"
                        onClick={() => { handleApprove(viewTx.walletId, viewTx.id); setViewTx(null); }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <WalletDetailDialog wallet={selectedWallet} open={!!selectedWallet} onOpenChange={(open) => !open && setSelectedWallet(null)} />
    </div>
  );
}
