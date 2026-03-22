import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import type { WalletTransaction, WalletTransactionStatus, TransferMedium } from "@/types/wallet";
import { walletTxTypeConfig, walletTxStatusConfig, transferMediumConfig, fmtWallet } from "@/types/wallet";

const myWallet = {
  id: 1,
  investorName: "Alice Johnson",
  email: "alice@example.com",
  phone: "+8801711111111",
  balance: 25000,
  totalTopUps: 75000,
  totalWithdrawals: 0,
  totalSpent: 50000,
  transactions: [
    { id: 101, investorName: "Alice Johnson", email: "alice@example.com", type: "top_up", amount: 75000, date: "2026-01-10", status: "approved", description: "Initial wallet funding", transferMedium: "bank_transfer" },
    { id: 102, investorName: "Alice Johnson", email: "alice@example.com", type: "invest_lti", amount: 30000, date: "2026-01-15", status: "approved", description: "Long-term investment from wallet" },
    { id: 103, investorName: "Alice Johnson", email: "alice@example.com", type: "invest_sti", amount: 20000, date: "2026-02-01", status: "approved", description: "Commercial Property Flip investment" },
    { id: 104, investorName: "Alice Johnson", email: "alice@example.com", type: "top_up", amount: 10000, date: "2026-03-01", status: "pending", description: "Wallet top-up request", transferMedium: "cash" },
  ] as WalletTransaction[],
};

export default function InvestorWallet() {
  const [wallet, setWallet] = useState(myWallet);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txType, setTxType] = useState<"top_up" | "withdraw">("top_up");
  const [txAmount, setTxAmount] = useState("");
  const [txMedium, setTxMedium] = useState<TransferMedium>("bank_transfer");
  const [txDescription, setTxDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WalletTransactionStatus>("all");

  const filteredTransactions = useMemo(() => {
    let txs = [...wallet.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (statusFilter !== "all") {
      txs = txs.filter((t) => t.status === statusFilter);
    }
    return txs;
  }, [wallet.transactions, statusFilter]);

  const pagination = usePagination(filteredTransactions, { pageSize: 8 });

  const pendingCount = wallet.transactions.filter((t) => t.status === "pending").length;

  const handleSubmitTransaction = () => {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (txType === "withdraw" && amount > wallet.balance) {
      toast.error("Insufficient wallet balance.");
      return;
    }

    const newTx: WalletTransaction = {
      id: Date.now(),
      investorName: wallet.investorName,
      email: wallet.email,
      type: txType,
      amount,
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      description: txDescription || (txType === "top_up" ? "Wallet top-up request" : "Wallet withdrawal request"),
      transferMedium: txMedium,
    };

    setWallet((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTx],
    }));

    toast.success(`${txType === "top_up" ? "Top-up" : "Withdrawal"} request submitted. Awaiting admin approval.`);
    setTxDialogOpen(false);
    setTxAmount("");
    setTxDescription("");
  };

  const getStatusIcon = (status: WalletTransactionStatus) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-3.5 w-3.5" />;
      case "pending": return <Clock className="h-3.5 w-3.5" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground">My Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your funds, top up, and withdraw</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setTxType("top_up"); setTxDialogOpen(true); }} className="gap-2">
            <ArrowUpCircle className="h-4 w-4" /> Top Up
          </Button>
          <Button variant="outline" onClick={() => { setTxType("withdraw"); setTxDialogOpen(true); }} className="gap-2">
            <ArrowDownCircle className="h-4 w-4" /> Withdraw
          </Button>
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagination.paginatedItems.map((tx) => {
                    const typeConf = walletTxTypeConfig[tx.type];
                    const statusConf = walletTxStatusConfig[tx.status];
                    const isInflow = tx.type === "top_up";
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap">{tx.date}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${typeConf.color}`}>{typeConf.label}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tx.description}</TableCell>
                        <TableCell className="text-sm">
                          {tx.transferMedium ? transferMediumConfig[tx.transferMedium] : "—"}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${isInflow ? "text-profit" : "text-destructive"}`}>
                          {isInflow ? "+" : "-"}{fmtWallet(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConf.variant} className="gap-1 text-xs">
                            {getStatusIcon(tx.status)}
                            {statusConf.label}
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
            totalItems={filteredTransactions.length}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        </CardContent>
      </Card>

      {/* Top Up / Withdraw Dialog */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{txType === "top_up" ? "Top Up Wallet" : "Withdraw from Wallet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {txType === "withdraw" && (
              <p className="text-sm text-muted-foreground">
                Available balance: <span className="font-semibold text-foreground">{fmtWallet(wallet.balance)}</span>
              </p>
            )}
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="Enter amount" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Transfer Medium</Label>
              <Select value={txMedium} onValueChange={(v) => setTxMedium(v as TransferMedium)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input placeholder="Add a note..." value={txDescription} onChange={(e) => setTxDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitTransaction}>
              {txType === "top_up" ? "Submit Top-Up" : "Submit Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
