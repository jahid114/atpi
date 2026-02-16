import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinancial } from "@/contexts/FinancialContext";
import type { Client } from "@/contexts/FinancialContext";

const emptyForm = { name: "", description: "", status: "active" as Client["status"] };

export function ClientListTab() {
  const { clients, setClients, clientTransactions } = useFinancial();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clients, search, statusFilter]);

  const getClientStats = (clientId: number) => {
    const txns = clientTransactions.filter((t) => t.clientId === clientId);
    return {
      invested: txns.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0),
      profit: txns.filter((t) => t.type === "profit_receive").reduce((s, t) => s + t.amount, 0),
      returned: txns.filter((t) => t.type === "principal_return").reduce((s, t) => s + t.amount, 0),
    };
  };

  const fmt = (n: number) => "$" + n.toLocaleString();

  const openAdd = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (c: Client) => { setEditId(c.id); setForm({ name: c.name, description: c.description || "", status: c.status }); setOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setClients((prev) => prev.map((c) => c.id === editId ? { ...c, name: form.name, description: form.description, status: form.status } : c));
    } else {
      setClients((prev) => [...prev, { id: Date.now(), name: form.name, description: form.description, status: form.status, createdAt: new Date().toISOString().slice(0, 10) }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: number) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const statusBadge = (status: Client["status"]) => {
    const styles = {
      active: "bg-profit/10 text-profit",
      completed: "bg-primary/10 text-primary",
      inactive: "bg-muted text-muted-foreground",
    };
    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add Client</Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Client</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Invested</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Profit</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Returned</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const stats = getClientStats(c.id);
              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 xl:px-6 py-3">
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  </td>
                  <td className="px-4 xl:px-6 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 xl:px-6 py-3 text-right text-foreground">{fmt(stats.invested)}</td>
                  <td className="px-4 xl:px-6 py-3 text-right text-profit font-medium">{fmt(stats.profit)}</td>
                  <td className="px-4 xl:px-6 py-3 text-right text-foreground">{fmt(stats.returned)}</td>
                  <td className="px-4 xl:px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
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
                            <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the client. Associated transactions will remain.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No clients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Client" : "Add Client"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Client Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Client["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleSave}>{editId ? "Save Changes" : "Add Client"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
