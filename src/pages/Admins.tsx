import { useState, useMemo } from "react";
import { Shield, Mail, Phone, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
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

type AdminRole = "admin" | "staff";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  joinedDate: string;
  status: "active" | "inactive";
}

const initialAdmins: AdminUser[] = [
  { id: 1, name: "Admin User", email: "admin@investfarm.com", phone: "+1 555-0001", role: "admin", joinedDate: "2025-01-01", status: "active" },
  { id: 2, name: "Sarah Chen", email: "sarah@investfarm.com", phone: "+1 555-0002", role: "admin", joinedDate: "2025-02-15", status: "active" },
  { id: 3, name: "Michael Rivera", email: "michael@investfarm.com", phone: "+1 555-0003", role: "staff", joinedDate: "2025-03-10", status: "active" },
  { id: 4, name: "Jessica Park", email: "jessica@investfarm.com", phone: "+1 555-0004", role: "staff", joinedDate: "2025-04-20", status: "active" },
  { id: 5, name: "Omar Hassan", email: "omar@investfarm.com", phone: "+1 555-0005", role: "staff", joinedDate: "2025-05-08", status: "inactive" },
  { id: 6, name: "Linda Nguyen", email: "linda@investfarm.com", phone: "+1 555-0006", role: "admin", joinedDate: "2025-06-12", status: "active" },
  { id: 7, name: "Thomas Wright", email: "thomas@investfarm.com", phone: "+1 555-0007", role: "staff", joinedDate: "2025-07-25", status: "active" },
  { id: 8, name: "Priya Sharma", email: "priya@investfarm.com", phone: "+1 555-0008", role: "staff", joinedDate: "2025-08-30", status: "active" },
];

const emptyForm = { name: "", email: "", phone: "", role: "staff" as AdminRole, status: "active" as "active" | "inactive" };

export default function Admins() {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => admins.filter((u) => {
    return u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
  }), [admins, search]);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } = usePagination(filtered);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (u: AdminUser) => {
    setEditId(u.id);
    setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editId) {
      setAdmins((prev) => prev.map((u) => u.id === editId ? { ...u, ...form } : u));
    } else {
      setAdmins((prev) => [...prev, { id: Date.now(), ...form, joinedDate: new Date().toISOString().slice(0, 10) }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: number) => {
    setAdmins((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admins</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform administrators & staff</p>
        </div>
        <Button size="sm" onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add Admin</Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Admins</p>
          <p className="text-2xl font-bold text-foreground mt-1">{admins.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-foreground mt-1">{admins.filter(a => a.status === "active").length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Inactive</p>
          <p className="text-2xl font-bold text-foreground mt-1">{admins.filter(a => a.status === "inactive").length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">
                  <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary shrink-0" />{user.name}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /> {user.phone}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="secondary" className="text-[11px] capitalize">{user.role}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.joinedDate}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${user.status === "active" ? "bg-profit/10 text-profit" : "bg-destructive/10 text-destructive"}`}>
                    {user.status === "active" ? "Active" : "Inactive"}
                  </span>
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
                          <AlertDialogDescription>This will permanently remove the admin from the platform.</AlertDialogDescription>
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
            {paginatedItems.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No admins found.</td></tr>
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

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Admin" : "Add Admin"}</DialogTitle>
            <DialogDescription>{editId ? "Update administrator details." : "Add a new platform administrator."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input placeholder="john@example.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+1 555-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AdminRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
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
            <Button className="w-full" onClick={handleSave}>{editId ? "Save Changes" : "Add Admin"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
