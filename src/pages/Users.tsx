import { useState } from "react";
import { Shield, User, Mail, Phone, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export default function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = initialUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = initialUsers.filter((u) => u.role === "admin").length;
  const investorCount = initialUsers.filter((u) => u.role === "investor").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">All platform users — admins & investors</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold text-foreground mt-1">{initialUsers.length}</p>
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
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="investor">Investors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const rc = roleConfig[user.role];
              const RoleIcon = rc.icon;
              return (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {user.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={rc.variant} className="text-[11px] gap-1">
                      <RoleIcon className="h-3 w-3" /> {rc.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.joinedDate}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={user.status === "active" ? "default" : "destructive"} className="text-[11px]">
                      {user.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
