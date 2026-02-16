import { useState, useMemo } from "react";
import { User, Mail, Phone, Search, Plus, Pencil, Trash2, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InvestmentType = "long-term" | "short-term" | "both";

interface InvestorUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  status: "active" | "inactive";
  investmentType: InvestmentType;
  longTermInvested: number;
  shortTermInvested: number;
  totalProfit: number;
  activePlans: number;
}

const initialInvestors: InvestorUser[] = [
  { id: 3, name: "Alice Johnson", email: "alice@example.com", phone: "+1 555-1001", joinedDate: "2025-10-01", status: "active", investmentType: "long-term", longTermInvested: 50000, shortTermInvested: 0, totalProfit: 4200, activePlans: 2 },
  { id: 4, name: "Bob Smith", email: "bob@example.com", phone: "+1 555-1002", joinedDate: "2025-11-15", status: "active", investmentType: "short-term", longTermInvested: 0, shortTermInvested: 25000, totalProfit: 1800, activePlans: 1 },
  { id: 5, name: "Carol Williams", email: "carol@example.com", phone: "+1 555-1003", joinedDate: "2025-12-01", status: "active", investmentType: "both", longTermInvested: 80000, shortTermInvested: 40000, totalProfit: 9500, activePlans: 4 },
  { id: 6, name: "David Lee", email: "david@example.com", phone: "+1 555-1004", joinedDate: "2026-01-10", status: "active", investmentType: "long-term", longTermInvested: 75000, shortTermInvested: 0, totalProfit: 5600, activePlans: 3 },
  { id: 7, name: "Eva Martinez", email: "eva@example.com", phone: "+1 555-1005", joinedDate: "2026-01-20", status: "inactive", investmentType: "short-term", longTermInvested: 0, shortTermInvested: 10000, totalProfit: 600, activePlans: 0 },
];

const investmentTypeLabels: Record<InvestmentType, string> = {
  "long-term": "Long-Term",
  "short-term": "Short-Term",
  both: "Both",
};

const emptyForm = {
  name: "", email: "", phone: "",
  status: "active" as "active" | "inactive",
  investmentType: "long-term" as InvestmentType,
  longTermInvested: 0, shortTermInvested: 0, totalProfit: 0, activePlans: 0,
};

const formatCurrency = (v: number) => `$${v.toLocaleString()}`;

export default function InvestorUsers() {
  const [investors, setInvestors] = useState<InvestorUser[]>(initialInvestors);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => investors.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || u.investmentType === typeFilter || (typeFilter !== "both" && u.investmentType === "both");
    return matchesSearch && matchesType;
  }), [investors, search, typeFilter]);

  const totalInvestedAll = investors.reduce((s, i) => s + i.longTermInvested + i.shortTermInvested, 0);
  const totalProfitAll = investors.reduce((s, i) => s + i.totalProfit, 0);
  const totalActivePlans = investors.reduce((s, i) => s + i.activePlans, 0);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (u: InvestorUser) => {
    setEditId(u.id);
    setForm({ name: u.name, email: u.email, phone: u.phone, status: u.status, investmentType: u.investmentType, longTermInvested: u.longTermInvested, shortTermInvested: u.shortTermInvested, totalProfit: u.totalProfit, activePlans: u.activePlans });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editId) {
      setInvestors((prev) => prev.map((u) => u.id === editId ? { ...u, ...form } : u));
    } else {
      setInvestors((prev) => [...prev, { id: Date.now(), ...form, joinedDate: new Date().toISOString().slice(0, 10) }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: number) => {
    setInvestors((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investors</h1>
          <p className="text-sm text-muted-foreground mt-1">All platform investors & their portfolio summary</p>
        </div>
        <Button size="sm" onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add Investor</Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Investors</p>
          <p className="text-2xl font-bold text-foreground mt-1">{investors.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Invested</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalInvestedAll)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Profit</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalProfitAll)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Plans</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalActivePlans}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Investment type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="long-term">Long-Term</SelectItem>
            <SelectItem value="short-term">Short-Term</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">LTI Amount</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">STI Amount</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Profit</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Plans</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">
                  <span className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground shrink-0" />{user.name}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /> {user.phone}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="secondary" className="text-[11px]">{investmentTypeLabels[user.investmentType]}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(user.longTermInvested)}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(user.shortTermInvested)}</td>
                <td className="px-4 py-3 text-right font-medium text-profit">{formatCurrency(user.totalProfit)}</td>
                <td className="px-4 py-3 text-center text-foreground">{user.activePlans}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={user.status === "active" ? "default" : "destructive"} className="text-[11px]">
                    {user.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
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
                          <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove the investor from the platform.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No investors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Investor" : "Add Investor"}</DialogTitle>
            <DialogDescription>{editId ? "Update investor profile and portfolio details." : "Register a new investor on the platform."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. Alice Johnson" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input placeholder="alice@example.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+1 555-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Investment Type</Label>
                <Select value={form.investmentType} onValueChange={(v) => setForm({ ...form, investmentType: v as InvestmentType })}>
                  <SelectTrigger><SelectValue placeholder="Investment Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long-term">Long-Term</SelectItem>
                    <SelectItem value="short-term">Short-Term</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Long-Term Invested</Label>
                <Input type="number" placeholder="50000" value={form.longTermInvested || ""} onChange={(e) => setForm({ ...form, longTermInvested: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Short-Term Invested</Label>
                <Input type="number" placeholder="25000" value={form.shortTermInvested || ""} onChange={(e) => setForm({ ...form, shortTermInvested: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Total Profit</Label>
                <Input type="number" placeholder="4200" value={form.totalProfit || ""} onChange={(e) => setForm({ ...form, totalProfit: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Active Plans</Label>
                <Input type="number" placeholder="2" value={form.activePlans || ""} onChange={(e) => setForm({ ...form, activePlans: Number(e.target.value) })} />
              </div>
            </div>
            <Button className="w-full" onClick={handleSave}>{editId ? "Save Changes" : "Add Investor"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
