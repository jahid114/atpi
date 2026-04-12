import { useState, useMemo, useRef } from "react";
import { User, Mail, Phone, Search, Plus, Pencil, Trash2, Calendar, Eye, Briefcase, Globe, CreditCard, Heart, Shirt, Users as UsersIcon, Hash, ArrowUpDown, Camera } from "lucide-react";
import { AccountCards } from "@/components/AccountCards";
import type { BankAccount, MobileBankingAccount } from "@/types/accounts";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { NomineeInfo } from "@/types/investor";

export interface InvestorUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  occupation: string;
  country: string;
  joinedDate: string;
  status: "active" | "inactive";
  totalInvested: number;
  shares: number;
  nidNumber: string;
  bloodGroup: string;
  jerseySize: string;
  profileImage: string;
  nominee: NomineeInfo;
  bankAccount?: BankAccount | null;
  mobileAccounts?: MobileBankingAccount[];
}

export const initialUsers: InvestorUser[] = [
  { id: 1001, name: "Alice Johnson", email: "alice@example.com", phone: "+1 555-1001", password: "••••••••", occupation: "Software Engineer", country: "United States", joinedDate: "2025-10-01", status: "active", totalInvested: 50000, shares: 5, nidNumber: "1234567890", bloodGroup: "A+", jerseySize: "M", profileImage: "", nominee: { name: "John Johnson", relationship: "Spouse", phone: "+1 555-2001", nidNumber: "9876543210" }, bankAccount: { id: 1, bankName: "Dutch-Bangla Bank", accountName: "Alice Johnson", accountNumber: "1234567890123", branchName: "Gulshan Branch", routingNumber: "090261392" }, mobileAccounts: [{ id: 1, provider: "bKash", accountNumber: "01711111111", accountName: "Alice Johnson" }] },
  { id: 1002, name: "Bob Smith", email: "bob@example.com", phone: "+1 555-1002", password: "••••••••", occupation: "Business Owner", country: "Canada", joinedDate: "2025-11-15", status: "active", totalInvested: 25000, shares: 3, nidNumber: "2345678901", bloodGroup: "B+", jerseySize: "L", profileImage: "", nominee: { name: "Mary Smith", relationship: "Spouse", phone: "+1 555-2002", nidNumber: "8765432109" } },
  { id: 1003, name: "Carol Williams", email: "carol@example.com", phone: "+1 555-1003", password: "••••••••", occupation: "Financial Analyst", country: "United Kingdom", joinedDate: "2025-12-01", status: "active", totalInvested: 120000, shares: 8, nidNumber: "3456789012", bloodGroup: "O+", jerseySize: "S", profileImage: "", nominee: { name: "Tom Williams", relationship: "Brother", phone: "+1 555-2003", nidNumber: "7654321098" } },
  { id: 1004, name: "David Lee", email: "david@example.com", phone: "+1 555-1004", password: "••••••••", occupation: "Real Estate Agent", country: "Australia", joinedDate: "2026-01-10", status: "active", totalInvested: 75000, shares: 6, nidNumber: "4567890123", bloodGroup: "AB+", jerseySize: "XL", profileImage: "", nominee: { name: "Lisa Lee", relationship: "Spouse", phone: "+1 555-2004", nidNumber: "6543210987" } },
  { id: 1005, name: "Eva Martinez", email: "eva@example.com", phone: "+1 555-1005", password: "••••••••", occupation: "Marketing Director", country: "Spain", joinedDate: "2026-01-20", status: "inactive", totalInvested: 0, shares: 0, nidNumber: "5678901234", bloodGroup: "O-", jerseySize: "S", profileImage: "", nominee: { name: "", relationship: "", phone: "", nidNumber: "" } },
  { id: 1006, name: "Frank Müller", email: "frank@example.com", phone: "+49 170-1001", password: "••••••••", occupation: "Architect", country: "Germany", joinedDate: "2025-09-05", status: "active", totalInvested: 180000, shares: 12, nidNumber: "6789012345", bloodGroup: "A-", jerseySize: "L", profileImage: "", nominee: { name: "Anna Müller", relationship: "Spouse", phone: "+49 170-2001", nidNumber: "5432109876" } },
  { id: 1007, name: "Grace Tanaka", email: "grace@example.com", phone: "+81 90-1001", password: "••••••••", occupation: "Doctor", country: "Japan", joinedDate: "2025-08-12", status: "active", totalInvested: 200000, shares: 15, nidNumber: "7890123456", bloodGroup: "B-", jerseySize: "M", profileImage: "", nominee: { name: "Kenji Tanaka", relationship: "Spouse", phone: "+81 90-2001", nidNumber: "4321098765" } },
  { id: 1008, name: "Hassan Ali", email: "hassan@example.com", phone: "+971 50-1001", password: "••••••••", occupation: "Trader", country: "UAE", joinedDate: "2025-07-22", status: "active", totalInvested: 95000, shares: 7, nidNumber: "8901234567", bloodGroup: "AB-", jerseySize: "XL", profileImage: "", nominee: { name: "Fatima Ali", relationship: "Spouse", phone: "+971 50-2001", nidNumber: "3210987654" } },
  { id: 1009, name: "Isabella Costa", email: "isabella@example.com", phone: "+55 11-1001", password: "••••••••", occupation: "Lawyer", country: "Brazil", joinedDate: "2025-06-30", status: "active", totalInvested: 150000, shares: 10, nidNumber: "9012345678", bloodGroup: "O+", jerseySize: "M", profileImage: "", nominee: { name: "Marco Costa", relationship: "Brother", phone: "+55 11-2001", nidNumber: "2109876543" } },
  { id: 1010, name: "Jack O'Brien", email: "jack@example.com", phone: "+353 87-1001", password: "••••••••", occupation: "Consultant", country: "Ireland", joinedDate: "2026-02-01", status: "active", totalInvested: 0, shares: 0, nidNumber: "0123456789", bloodGroup: "A+", jerseySize: "L", profileImage: "", nominee: { name: "", relationship: "", phone: "", nidNumber: "" } },
];

const formatCurrency = (v: number) => `$${v.toLocaleString()}`;

type SortField = "id" | "name" | "shares" | "totalInvested" | "joinedDate";

const emptyAddForm = { name: "", email: "", phone: "", password: "", occupation: "", country: "", status: "active" as "active" | "inactive" };

export default function InvestorUsers() {
  const [investors, setInvestors] = useState<InvestorUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("id");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [editForm, setEditForm] = useState<InvestorUser | null>(null);
  const [viewUser, setViewUser] = useState<InvestorUser | null>(null);
  const [editProfileImage, setEditProfileImage] = useState<string>("");
  const editImageRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = investors.filter((u) => {
      return u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    });
    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "shares": return b.shares - a.shares;
        case "totalInvested": return b.totalInvested - a.totalInvested;
        case "joinedDate": return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        default: return a.id - b.id;
      }
    });
    return list;
  }, [investors, search, sortBy]);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } = usePagination(filtered);

  // Summary KPIs
  const totalRegistered = investors.length;
  const totalInvestors = investors.filter((i) => i.totalInvested > 0).length;
  const notInvestedYet = investors.filter((i) => i.totalInvested === 0).length;
  const totalInvestedAmount = investors.reduce((s, i) => s + i.totalInvested, 0);

  // Add form
  const openAdd = () => { setEditId(null); setAddForm(emptyAddForm); setOpen(true); };
  const handleAdd = () => {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) return;
    const newId = Math.max(...investors.map((i) => i.id), 1000) + 1;
    setInvestors((prev) => [...prev, {
      id: newId, name: addForm.name, email: addForm.email, phone: addForm.phone, password: addForm.password,
      occupation: addForm.occupation, country: addForm.country, status: addForm.status,
      joinedDate: new Date().toISOString().slice(0, 10),
      totalInvested: 0, shares: 0, nidNumber: "", bloodGroup: "", jerseySize: "", profileImage: "", nominee: { name: "", relationship: "", phone: "", nidNumber: "" },
    }]);
    setOpen(false);
  };

  // Edit form
  const openEdit = (u: InvestorUser) => {
    setEditId(u.id);
    setEditForm({ ...u });
    setEditProfileImage(u.profileImage);
  };
  const handleEditSave = () => {
    if (!editForm) return;
    setInvestors((prev) => prev.map((u) => u.id === editId ? { ...editForm, profileImage: editProfileImage } : u));
    setEditId(null);
    setEditForm(null);
  };
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setEditProfileImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (id: number) => {
    setInvestors((prev) => prev.filter((u) => u.id !== id));
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">All registered users on the platform</p>
        </div>
        <Button size="sm" onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add User</Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Registered Users</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalRegistered}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">No of Investors</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalInvestors}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Not Invested Yet</p>
          <p className="text-2xl font-bold text-foreground mt-1">{notInvestedYet}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Invested Amount</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalInvestedAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
          <SelectTrigger className="w-full sm:w-44">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">Sort by ID</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="shares">Sort by Shares</SelectItem>
            <SelectItem value="totalInvested">Sort by Amount</SelectItem>
            <SelectItem value="joinedDate">Sort by Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">No of Shares</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">#{user.id}</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback className="text-[10px]">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    {user.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(user.totalInvested)}</td>
                <td className="px-4 py-3 text-center text-foreground">{user.shares}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${user.status === "active" ? "bg-profit/10 text-profit" : "bg-destructive/10 text-destructive"}`}>
                    {user.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewUser(user)}>
                      <Eye className="h-4 w-4" />
                    </Button>
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
            ))}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={goToPage} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />

      {/* View Profile Dialog - LTI review style */}
      <Dialog open={!!viewUser} onOpenChange={(o) => !o && setViewUser(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          {viewUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" /> User Profile
                </DialogTitle>
                <DialogDescription>Detailed user profile and investment summary</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={viewUser.profileImage} />
                    <AvatarFallback className="text-lg">{getInitials(viewUser.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{viewUser.name}</h3>
                    <p className="text-sm text-muted-foreground">ID: #{viewUser.id}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium mt-1 ${viewUser.status === "active" ? "bg-profit/10 text-profit" : "bg-destructive/10 text-destructive"}`}>
                      {viewUser.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Occupation</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.occupation || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Country</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.country || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">NID Number</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.nidNumber || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Heart className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Blood Group</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.bloodGroup || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Shirt className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Jersey Size</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.jerseySize || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Joined</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.joinedDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Details */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Investment Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border border-border rounded-lg p-3 text-center">
                      <Hash className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">No of Shares</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">{viewUser.shares}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 text-center">
                      <User className="h-5 w-5 text-profit mx-auto mb-1" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Invested</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">{formatCurrency(viewUser.totalInvested)}</p>
                    </div>
                  </div>
                </div>

                {/* Nominee Info */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nominee Information</p>
                  {viewUser.nominee?.name ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2.5">
                        <UsersIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</p>
                          <p className="text-sm font-medium text-foreground">{viewUser.nominee.name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Relationship</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.nominee.relationship || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.nominee.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">NID</p>
                        <p className="text-sm font-medium text-foreground">{viewUser.nominee.nidNumber || "N/A"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No nominee information provided.</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add User Dialog (simplified) */}
      <Dialog open={open && !editId} onOpenChange={(o) => { if (!o) setOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Register a new user on the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. Alice Johnson" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input placeholder="alice@example.com" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+1 555-0000" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input placeholder="Enter password" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Occupation</Label>
                <Input placeholder="e.g. Software Engineer" value={addForm.occupation} onChange={(e) => setAddForm({ ...addForm, occupation: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input placeholder="e.g. United States" value={addForm.country} onChange={(e) => setAddForm({ ...addForm, country: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={addForm.status} onValueChange={(v) => setAddForm({ ...addForm, status: v as "active" | "inactive" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAdd}>Add User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog (full data + nominee + profile image) */}
      <Dialog open={!!editForm} onOpenChange={(o) => { if (!o) { setEditForm(null); setEditId(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {editForm && (
            <>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user profile, investment details, and nominee information.</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {/* Profile Image */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={editProfileImage} />
                      <AvatarFallback className="text-lg">{getInitials(editForm.name)}</AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => editImageRef.current?.click()}
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                    <input ref={editImageRef} type="file" accept="image/*" className="hidden" onChange={handleEditImageUpload} />
                  </div>
                  <div className="text-sm text-muted-foreground">Click the camera icon to upload a profile image</div>
                </div>

                {/* Personal Info */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Personal Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Full Name *</Label>
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email *</Label>
                      <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>NID Number</Label>
                      <Input value={editForm.nidNumber} onChange={(e) => setEditForm({ ...editForm, nidNumber: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Occupation</Label>
                      <Input value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Country</Label>
                      <Input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Blood Group</Label>
                      <Select value={editForm.bloodGroup} onValueChange={(v) => setEditForm({ ...editForm, bloodGroup: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Jersey Size</Label>
                      <Select value={editForm.jerseySize} onValueChange={(v) => setEditForm({ ...editForm, jerseySize: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as "active" | "inactive" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>


                {/* Nominee Info */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Nominee Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Nominee Name</Label>
                      <Input value={editForm.nominee.name} onChange={(e) => setEditForm({ ...editForm, nominee: { ...editForm.nominee, name: e.target.value } })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Relationship</Label>
                      <Input value={editForm.nominee.relationship} onChange={(e) => setEditForm({ ...editForm, nominee: { ...editForm.nominee, relationship: e.target.value } })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nominee Phone</Label>
                      <Input value={editForm.nominee.phone} onChange={(e) => setEditForm({ ...editForm, nominee: { ...editForm.nominee, phone: e.target.value } })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nominee NID</Label>
                      <Input value={editForm.nominee.nidNumber} onChange={(e) => setEditForm({ ...editForm, nominee: { ...editForm.nominee, nidNumber: e.target.value } })} />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleEditSave}>Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
