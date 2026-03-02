import { useState, useMemo, useRef } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Search, CalendarIcon, FilterX, Eye, Download, Paperclip, X, User, Hash, DollarSign, FileText, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import { useFinancial, generateTxId } from "@/contexts/FinancialContext";
import { toast } from "sonner";
import type { ClientTransaction } from "@/contexts/FinancialContext";

const typeLabels: Record<ClientTransaction["type"], string> = {
  investment: "Investment",
  profit_receive: "Profit Receive",
  principal_return: "Principal Return",
  service_fee: "Service Fee",
};

const typeBadgeStyles: Record<ClientTransaction["type"], string> = {
  investment: "bg-primary/10 text-primary",
  profit_receive: "bg-profit/10 text-profit",
  principal_return: "bg-warning/10 text-warning",
  service_fee: "bg-destructive/10 text-destructive",
};

const emptyForm = {
  clientId: "",
  type: "investment" as ClientTransaction["type"],
  amount: "",
  date: "",
  description: "",
  fromAccount: "",
  toAccount: "",
};

interface Props {
  selectedYear: number;
}

export function ClientTransactionsTab({ selectedYear }: Props) {
  const { clients, clientTransactions, setClientTransactions } = useFinancial();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formAttachment, setFormAttachment] = useState<string | null>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [viewTx, setViewTx] = useState<ClientTransaction | null>(null);

  const fmt = (n: number) => "$" + n.toLocaleString();

  const filtered = useMemo(() => {
    return clientTransactions.filter((t) => {
      if (!t.date.startsWith(String(selectedYear))) return false;
      const client = clients.find((c) => c.id === t.clientId);
      const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
        (client?.name.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        t.txId.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchFrom = !dateFrom || new Date(t.date) >= dateFrom;
      const matchTo = !dateTo || new Date(t.date) <= dateTo;
      return matchSearch && matchType && matchFrom && matchTo;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [clientTransactions, clients, search, typeFilter, dateFrom, dateTo, selectedYear]);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } = usePagination(filtered);

  const hasFilters = search || typeFilter !== "all" || !!dateFrom || !!dateTo;
  const clearFilters = () => { setSearch(""); setTypeFilter("all"); setDateFrom(undefined); setDateTo(undefined); };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setFormAttachment(null); setOpen(true); };
  const openEdit = (t: ClientTransaction) => {
    setEditId(t.id);
    setForm({
      clientId: String(t.clientId),
      type: t.type,
      amount: String(t.amount),
      date: t.date,
      description: t.description,
      fromAccount: t.fromAccount || "",
      toAccount: t.toAccount || "",
    });
    setFormAttachment(t.attachment || null);
    setOpen(true);
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormAttachment(file.name);
  };

  const handleSave = () => {
    if (!form.clientId || !form.amount || !form.date) return;
    if (editId) {
      setClientTransactions((prev) => prev.map((t) => t.id === editId ? {
        ...t,
        clientId: Number(form.clientId),
        type: form.type,
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
        fromAccount: form.fromAccount || undefined,
        toAccount: form.toAccount || undefined,
        attachment: formAttachment || undefined,
      } : t));
    } else {
      setClientTransactions((prev) => [...prev, {
        id: Date.now(),
        txId: generateTxId(),
        clientId: Number(form.clientId),
        type: form.type,
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
        fromAccount: form.fromAccount || undefined,
        toAccount: form.toAccount || undefined,
        attachment: formAttachment || undefined,
      }]);
    }
    setOpen(false);
    toast.success(editId ? "Transaction updated." : "Transaction added.");
  };

  const handleDelete = (id: number) => {
    setClientTransactions((prev) => prev.filter((t) => t.id !== id));
    toast.success("Transaction deleted.");
  };

  const downloadTransactions = () => {
    const headers = ["TX ID", "Date", "Client", "Type", "Amount", "From Account", "To Account", "Description"];
    const csvRows = [headers.join(",")];
    filtered.forEach((t) => {
      const client = clients.find((c) => c.id === t.clientId);
      csvRows.push([
        t.txId,
        t.date,
        `"${client?.name || "Unknown"}"`,
        typeLabels[t.type],
        t.amount,
        `"${t.fromAccount || ""}"`,
        `"${t.toAccount || ""}"`,
        `"${t.description}"`,
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `client-transactions-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getClientName = (id: number) => clients.find((c) => c.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by client, ID, description..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="investment">Investment</SelectItem>
            <SelectItem value="profit_receive">Profit Receive</SelectItem>
            <SelectItem value="principal_return">Principal Return</SelectItem>
            <SelectItem value="service_fee">Service Fee</SelectItem>
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
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground">
            <FilterX className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={downloadTransactions}>
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>
          <Button size="sm" onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add Transaction</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">TX ID</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Client</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">From / To</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 xl:px-6 py-3 font-mono text-xs text-muted-foreground">{t.txId}</td>
                <td className="px-4 xl:px-6 py-3 text-muted-foreground">{t.date}</td>
                <td className="px-4 xl:px-6 py-3 font-medium text-foreground">{getClientName(t.clientId)}</td>
                <td className="px-4 xl:px-6 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeBadgeStyles[t.type]}`}>
                    {typeLabels[t.type]}
                  </span>
                </td>
                <td className="px-4 xl:px-6 py-3 text-xs text-muted-foreground">
                  {t.fromAccount && t.toAccount ? (
                    <span className="flex items-center gap-1">
                      {t.fromAccount} <ArrowRight className="h-3 w-3" /> {t.toAccount}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 xl:px-6 py-3 text-right font-medium text-foreground">{fmt(t.amount)}</td>
                <td className="px-4 xl:px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setViewTx(t)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No transactions found.</td></tr>
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

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
            <DialogDescription>Fill in the transaction details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ClientTransaction["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="profit_receive">Profit Receive</SelectItem>
                    <SelectItem value="principal_return">Principal Return</SelectItem>
                    <SelectItem value="service_fee">Service Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From Account</Label>
                <Input placeholder="e.g. Company Main" value={form.fromAccount} onChange={(e) => setForm({ ...form, fromAccount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>To Account</Label>
                <Input placeholder="e.g. Client Account" value={form.toAccount} onChange={(e) => setForm({ ...form, toAccount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="Transaction description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Attachment (optional)</Label>
              <input type="file" ref={attachmentRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleAttachment} />
              {formAttachment ? (
                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">{formAttachment}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFormAttachment(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => attachmentRef.current?.click()}>
                  <Paperclip className="h-4 w-4" /> Upload document
                </Button>
              )}
            </div>
            <Button className="w-full" onClick={handleSave}>{editId ? "Save Changes" : "Add Transaction"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Transaction Detail Dialog */}
      <Dialog open={!!viewTx} onOpenChange={(open) => !open && setViewTx(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewTx && (() => {
            const client = clients.find((c) => c.id === viewTx.clientId);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Transaction Details
                  </DialogTitle>
                  <DialogDescription>Full details for this transaction.</DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                  {/* Transaction Info */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Info</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Client</p>
                          <p className="text-sm font-medium text-foreground">{client?.name || "Unknown"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transaction ID</p>
                          <p className="text-sm font-mono font-medium text-foreground">{viewTx.txId}</p>
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
                        <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">{fmt(viewTx.amount)}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3 text-center">
                        <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{typeLabels[viewTx.type]}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3 text-center">
                        <CreditCard className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Accounts</p>
                        <p className="text-xs font-medium text-foreground mt-0.5">
                          {viewTx.fromAccount && viewTx.toAccount
                            ? `${viewTx.fromAccount} → ${viewTx.toAccount}`
                            : "N/A"}
                        </p>
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
                          <p className="text-sm font-medium text-foreground">{viewTx.description || "No description"}</p>
                        </div>
                      </div>
                      {viewTx.attachment && (
                        <div className="flex items-start gap-2.5">
                          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Attachment</p>
                            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                              <Paperclip className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate">{viewTx.attachment}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                  <Button onClick={() => { setViewTx(null); openEdit(viewTx); }}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
