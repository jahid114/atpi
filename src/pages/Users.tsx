import { useState, useMemo } from "react";
import { Shield, User, Mail, Phone, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRole = "admin" | "investor";

interface PlatformUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  joinedDate: string;
  status: "active" | "inactive";
}

const initialUsers: PlatformUser[] = [
  { id: 1, name: "Admin User", email: "admin@investfarm.com", phone: "+1 555-0001", role: "admin", joinedDate: "2025-01-01", status: "active" },
  { id: 2, name: "Sarah Chen", email: "sarah@investfarm.com", phone: "+1 555-0002", role: "admin", joinedDate: "2025-02-15", status: "active" },
  { id: 3, name: "Alice Johnson", email: "alice@example.com", phone: "+1 555-1001", role: "investor", joinedDate: "2025-10-01", status: "active" },
  { id: 4, name: "Bob Smith", email: "bob@example.com", phone: "+1 555-1002", role: "investor", joinedDate: "2025-11-15", status: "active" },
  { id: 5, name: "Carol Williams", email: "carol@example.com", phone: "+1 555-1003", role: "investor", joinedDate: "2025-12-01", status: "active" },
  { id: 6, name: "David Lee", email: "david@example.com", phone: "+1 555-1004", role: "investor", joinedDate: "2026-01-10", status: "active" },
  { id: 7, name: "Eva Martinez", email: "eva@example.com", phone: "+1 555-1005", role: "investor", joinedDate: "2026-01-20", status: "inactive" },
];

const roleConfig: Record<UserRole, { label: string; icon: React.ElementType; variant: "default" | "secondary" }> = {
  admin: { label: "Admin", icon: Shield, variant: "default" },
  investor: { label: "Investor", icon: User, variant: "secondary" },
};

const emptyForm = { name: "", email: "", phone: "", role: "investor" as UserRole, status: "active" as "active" | "inactive" };

export default function Users() {
  const [users, setUsers] = useState<PlatformUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  }), [users, search, roleFilter]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const investorCount = users.filter((u) => u.role === "investor").length;

  const openAdd = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (u: PlatformUser) => {
    setEditId(u.id);
    setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editId) {
      setUsers((prev) => prev.map((u) => u.id === editId ? { ...u, ...form } : u));
    } else {
      setUsers((prev) => [...prev, { id: Date.now(), ...form, joinedDate: new Date().toISOString().slice(0, 10) }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">All platform users — admins & investors</p>
        </div>
        <Button size="sm" onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add User</Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold text-foreground mt-1">{users.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold text-foreground mt-1">{adminCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Investors</p>
          <p className="text-2xl font-bold text-foreground mt-1">{investorCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Filter role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="investor">Investors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[800px]">
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
            {filtered.map((user) => {
              const rc = roleConfig[user.role];
              const RoleIcon = rc.icon;
              return (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /> {user.phone}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={rc.variant} className="text-[11px] gap-1"><RoleIcon className="h-3 w-3" /> {rc.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.joinedDate}</td>
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
                            <AlertDialogDescription>This will permanently remove the user from the platform.</AlertDialogDescription>
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
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleSave}>{editId ? "Save Changes" : "Add User"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
