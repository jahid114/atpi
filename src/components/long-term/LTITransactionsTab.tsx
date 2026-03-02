import { useMemo, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Search, CheckCircle, XCircle, Clock, CalendarIcon, FilterX, Download, Plus, Paperclip, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import type { Investor, InvestmentEntry, InvestmentStatus } from "@/types/investor";
import { fmt } from "@/lib/investor-utils";

interface FlatTransaction extends InvestmentEntry {
  investorName: string;
  investorId: number;
}

const statusBadge: Record<InvestmentStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
};

const typeLabels: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  payout: "Profit Share",
};

interface Props {
  investors: Investor[];
  onUpdateInvestment?: (investorId: number, entryId: number, status: InvestmentStatus) => void;
  onAddTransaction?: (investorId: number, amount: number, type: "deposit" | "withdrawal", date: string) => void;
  selectedYear: number;
}

type TransferMedium = "cash" | "check" | "bank_transfer";
const transferMediumLabels: Record<TransferMedium, string> = {
  cash: "Cash",
  check: "Check",
  bank_transfer: "Bank Transfer",
};

const emptyTxForm = {
  investorId: "",
  type: "deposit" as "deposit" | "withdrawal",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  transferMedium: "cash" as TransferMedium,
  description: "",
};

export function LTITransactionsTab({ investors, onUpdateInvestment, onAddTransaction, selectedYear }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txForm, setTxForm] = useState(emptyTxForm);
  const [txAttachment, setTxAttachment] = useState<{ name: string; url: string } | null>(null);
  const txAttachmentRef = useRef<HTMLInputElement>(null);
  const [viewTx, setViewTx] = useState<FlatTransaction | null>(null);

  const approvedInvestors = useMemo(() => investors.filter((i) => i.status === "approved"), [investors]);

  const handleTxAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setTxAttachment({ name: file.name, url: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTransaction = () => {
    if (!txForm.investorId || !txForm.amount || Number(txForm.amount) <= 0 || !txForm.date) {
      toast.error("Please fill all required fields.");
      return;
    }
    onAddTransaction?.(Number(txForm.investorId), Number(txForm.amount), txForm.type, txForm.date);
    const inv = investors.find((i) => i.id === Number(txForm.investorId));
    toast.success(`${txForm.type === "deposit" ? "Deposit" : "Withdrawal"} of ${fmt(Number(txForm.amount))} submitted for ${inv?.name || "investor"}.`);
    setTxForm(emptyTxForm);
    setTxAttachment(null);
    setTxDialogOpen(false);
  };

  const allTransactions = useMemo<FlatTransaction[]>(() => {
    return investors
      .flatMap((inv) =>
        inv.history.map((h) => ({
          ...h,
          investorName: inv.name,
          investorId: inv.id,
        }))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [investors]);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date.startsWith(String(selectedYear))) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (dateFrom && new Date(t.date) < dateFrom) return false;
      if (dateTo && new Date(t.date) > dateTo) return false;
      if (search && !t.investorName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allTransactions, typeFilter, statusFilter, dateFrom, dateTo, search, selectedYear]);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } = usePagination(filtered);

  const hasActiveFilters = search !== "" || typeFilter !== "all" || statusFilter !== "all" || !!dateFrom || !!dateTo;

  const clearFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  }, []);

  const downloadStatement = () => {
    const headers = ["Date", "Investor", "Type", "Amount", "Status"];
    const csvRows = [headers.join(",")];
    filtered.forEach((t) => {
      csvRows.push([t.date, t.investorName, typeLabels[t.type] || t.type, t.amount, t.status].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by investor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
            <SelectItem value="payout">Profit Share</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[150px] justify-start text-left text-sm font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[150px] justify-start text-left text-sm font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground" onClick={clearFilters}>
            <FilterX className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" className="h-10 px-3 text-xs" onClick={() => setTxDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Transaction
          </Button>
          <Button variant="outline" size="sm" className="h-10 px-3 text-xs" onClick={downloadStatement}>
            <Download className="h-4 w-4 mr-1" /> Download Statement
          </Button>
          <p className="text-xs text-muted-foreground">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[750px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Investor</th>
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Type</th>
              <th className="text-right px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Amount</th>
              <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Status</th>
              <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No transactions found.</td>
              </tr>
            ) : (
              paginatedItems.map((t) => {
                const sb = statusBadge[t.status];
                const SIcon = sb.icon;
                return (
                  <tr key={`${t.investorId}-${t.id}`} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 xl:px-6 py-3 xl:py-4 text-muted-foreground">{t.date}</td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 font-medium text-foreground">{t.investorName}</td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4">
                      <Badge variant="secondary" className="text-[11px]">{typeLabels[t.type] || t.type}</Badge>
                    </td>
                    <td className={`px-4 xl:px-6 py-3 xl:py-4 text-right font-medium ${t.type === "withdrawal" ? "text-destructive" : "text-profit"}`}>
                      {t.type === "withdrawal" ? "-" : "+"}{fmt(t.amount)}
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                      <Badge variant={sb.variant} className="text-[11px] gap-1">
                        <SIcon className="h-3 w-3" /> {sb.label}
                      </Badge>
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setViewTx(t)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        {t.status === "pending" && onUpdateInvestment && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-profit hover:text-profit" onClick={() => onUpdateInvestment(t.investorId, t.id, "approved")}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => onUpdateInvestment(t.investorId, t.id, "rejected")}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={goToPage}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
      />

      {/* View Transaction Detail Dialog */}
      <Dialog open={!!viewTx} onOpenChange={(open) => !open && setViewTx(null)}>
        <DialogContent className="sm:max-w-md">
          {viewTx && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" /> Transaction Details
                </DialogTitle>
                <DialogDescription>Full details for this transaction</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Investor</p>
                    <p className="font-medium text-foreground">{viewTx.investorName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                    <p className="font-medium text-foreground">{viewTx.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                    <Badge variant="secondary" className="text-[11px] mt-0.5">{typeLabels[viewTx.type] || viewTx.type}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount</p>
                    <p className={`font-semibold ${viewTx.type === "withdrawal" ? "text-destructive" : "text-profit"}`}>
                      {viewTx.type === "withdrawal" ? "-" : "+"}{fmt(viewTx.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                    <Badge variant={statusBadge[viewTx.status].variant} className="text-[11px] gap-1 mt-0.5">
                      {statusBadge[viewTx.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Transaction ID</p>
                    <p className="font-mono text-xs text-foreground">#{viewTx.id}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                {viewTx.status === "pending" && onUpdateInvestment && (
                  <div className="flex gap-2 mr-auto">
                    <Button size="sm" variant="outline" className="text-profit border-profit/30 hover:bg-profit/10" onClick={() => { onUpdateInvestment(viewTx.investorId, viewTx.id, "approved"); setViewTx(null); }}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { onUpdateInvestment(viewTx.investorId, viewTx.id, "rejected"); setViewTx(null); }}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                )}
                <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={txDialogOpen} onOpenChange={(open) => { if (!open) { setTxForm(emptyTxForm); setTxAttachment(null); } setTxDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Submit a deposit or withdrawal for an investor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Investor *</Label>
              <Select value={txForm.investorId} onValueChange={(v) => setTxForm((f) => ({ ...f, investorId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select investor" /></SelectTrigger>
                <SelectContent>
                  {approvedInvestors.map((inv) => (
                    <SelectItem key={inv.id} value={String(inv.id)}>{inv.name} ({inv.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={txForm.type} onValueChange={(v) => setTxForm((f) => ({ ...f, type: v as "deposit" | "withdrawal" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input type="number" placeholder="100000" value={txForm.amount} onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={txForm.date} onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))} />
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
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="e.g. Additional capital deposit" value={txForm.description} onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Attachment (optional)</Label>
              <input type="file" ref={txAttachmentRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleTxAttachment} />
              {txAttachment ? (
                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">{txAttachment.name}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTxAttachment(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => txAttachmentRef.current?.click()}>
                  <Paperclip className="h-4 w-4" /> Upload receipt or bank slip
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSubmitTransaction}>Submit Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
