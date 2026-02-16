import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Search, CalendarIcon, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinancial } from "@/contexts/FinancialContext";
import type { ClientTransaction } from "@/contexts/FinancialContext";

const typeLabels: Record<ClientTransaction["type"], string> = {
  investment: "Investment",
  profit_receive: "Profit Receive",
  principal_return: "Principal Return",
};

const typeBadgeStyles: Record<ClientTransaction["type"], string> = {
  investment: "bg-primary/10 text-primary",
  profit_receive: "bg-profit/10 text-profit",
  principal_return: "bg-warning/10 text-warning",
};

const emptyForm = { clientId: "", type: "investment" as ClientTransaction["type"], amount: "", date: "", description: "" };

export function ClientTransactionsTab() {
  const { clients, clientTransactions, setClientTransactions } = useFinancial();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const fmt = (n: number) => "$" + n.toLocaleString();

  const filtered = useMemo(() => {
    return clientTransactions.filter((t) => {
      const client = clients.find((c) => c.id === t.clientId);
      const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) || (client?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchClient = clientFilter === "all" || t.clientId === Number(clientFilter);
      const matchFrom = !dateFrom || new Date(t.date) >= dateFrom;
      const matchTo = !dateTo || new Date(t.date) <= dateTo;
      return matchSearch && matchType && matchClient && matchFrom && matchTo;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [clientTransactions, clients, search, typeFilter, clientFilter, dateFrom, dateTo]);

  const hasFilters = search || typeFilter !== "all" || clientFilter !== "all" || !!dateFrom || !!dateTo;
  const clearFilters = () => { setSearch(""); setTypeFilter("all"); setClientFilter("all"); setDateFrom(undefined); setDateTo(undefined); };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (t: ClientTransaction) => {
    setEditId(t.id);
    setForm({ clientId: String(t.clientId), type: t.type, amount: String(t.amount), date: t.date, description: t.description });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.clientId || !form.amount || !form.date) return;
    if (editId) {
      setClientTransactions((prev) => prev.map((t) => t.id === editId ? { ...t, clientId: Number(form.clientId), type: form.type, amount: Number(form.amount), date: form.date, description: form.description } : t));
    } else {
      setClientTransactions((prev) => [...prev, { id: Date.now(), clientId: Number(form.clientId), type: form.type, amount: Number(form.amount), date: form.date, description: form.description }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: number) => {
    setClientTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const getClientName = (id: number) => clients.find((c) => c.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
              <SelectItem value="profit_receive">Profit Receive</SelectItem>
              <SelectItem value="principal_return">Principal Return</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
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
          <Button size="sm" onClick={openAdd} className="ml-auto"><Plus size={16} className="mr-1.5" /> Add Transaction</Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Client</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Description</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 xl:px-6 py-3 text-muted-foreground">{t.date}</td>
                <td className="px-4 xl:px-6 py-3 font-medium text-foreground">{getClientName(t.clientId)}</td>
                <td className="px-4 xl:px-6 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeBadgeStyles[t.type]}`}>
                    {typeLabels[t.type]}
                  </span>
                </td>
                <td className="px-4 xl:px-6 py-3 text-muted-foreground">{t.description}</td>
                <td className="px-4 xl:px-6 py-3 text-right font-medium text-foreground">{fmt(t.amount)}</td>
                <td className="px-4 xl:px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
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
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Transaction" : "Add Transaction"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ClientTransaction["type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="profit_receive">Profit Receive</SelectItem>
                <SelectItem value="principal_return">Principal Return</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Button className="w-full" onClick={handleSave}>{editId ? "Save Changes" : "Add Transaction"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
