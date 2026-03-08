import { useState, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, Search, Eye, Download, Send, User, MapPin, Phone, CreditCard, TrendingUp, Paperclip, X, CalendarIcon, FileText, Hash, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import { useFinancial } from "@/contexts/FinancialContext";
import { toast } from "sonner";
import type { Client } from "@/contexts/FinancialContext";

const emptyForm = {
  name: "",
  address: "",
  phone: "",
  nid: "",
  expectedRoi: "",
  description: "",
  status: "active" as Client["status"],
};

interface Props {
  selectedYear: number;
}

export function ClientListTab({ selectedYear }: Props) {
  const { clients, setClients, clientTransactions } = useFinancial();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formAttachment, setFormAttachment] = useState<string | null>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [reminderClient, setReminderClient] = useState<Client | null>(null);
  const [reminderText, setReminderText] = useState("");

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.address || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clients, search, statusFilter]);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } = usePagination(filtered);

  const getClientStats = (clientId: number) => {
    const txns = clientTransactions.filter((t) => t.clientId === clientId && t.date.startsWith(String(selectedYear)));
    return {
      invested: txns.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0),
      profit: txns.filter((t) => t.type === "profit_receive").reduce((s, t) => s + t.amount, 0),
      returned: txns.filter((t) => t.type === "principal_return").reduce((s, t) => s + t.amount, 0),
    };
  };

  const fmt = (n: number) => "$" + n.toLocaleString();

  const openAdd = () => { setEditId(null); setForm(emptyForm); setFormAttachment(null); setOpen(true); };
  const openEdit = (c: Client) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      address: c.address || "",
      phone: c.phone || "",
      nid: c.nid || "",
      expectedRoi: c.expectedRoi ? String(c.expectedRoi) : "",
      description: c.description || "",
      status: c.status,
    });
    setFormAttachment(c.attachment || null);
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const clientData = {
      name: form.name,
      address: form.address || undefined,
      phone: form.phone || undefined,
      nid: form.nid || undefined,
      expectedRoi: form.expectedRoi ? Number(form.expectedRoi) : undefined,
      description: form.description || undefined,
      attachment: formAttachment || undefined,
      status: form.status,
    };
    if (editId) {
      setClients((prev) => prev.map((c) => c.id === editId ? { ...c, ...clientData } : c));
    } else {
      setClients((prev) => [...prev, { id: Date.now(), ...clientData, createdAt: new Date().toISOString().slice(0, 10) }]);
    }
    setOpen(false);
    toast.success(editId ? "Client updated." : "Client added.");
  };

  const handleDelete = (id: number) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    toast.success("Client deleted.");
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormAttachment(file.name);
  };

  const openReminder = (c: Client) => {
    setReminderClient(c);
    setReminderText(`Dear ${c.name},\n\nThis is a friendly reminder regarding your investment account with us. We wanted to follow up on the current status and ensure everything is progressing as expected.\n\nPlease feel free to reach out if you have any questions or require any updates.\n\nBest regards,\nInvestment Management Team`);
  };

  const handleSendReminder = () => {
    toast.success(`Reminder sent to ${reminderClient?.name}.`);
    setReminderClient(null);
  };

  const downloadClientData = () => {
    const headers = ["Name", "Address", "Phone", "NID", "Expected ROI (%)", "Status", "Created"];
    const csvRows = [headers.join(",")];
    clients.forEach((c) => {
      csvRows.push([
        `"${c.name}"`,
        `"${c.address || ""}"`,
        `"${c.phone || ""}"`,
        `"${c.nid || ""}"`,
        c.expectedRoi ?? "",
        c.status,
        c.createdAt,
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: Client["status"]) => {
    const styles = {
      active: "bg-profit/10 text-profit",
      inactive: "bg-destructive/10 text-destructive",
    };
    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>{status === "active" ? "Active" : "Inactive"}</span>;
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
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={downloadClientData}>
            <Download size={16} className="mr-1.5" /> Download
          </Button>
          <Button size="sm" onClick={openAdd}><Plus size={16} className="mr-1.5" /> Add Client</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Client</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">NID</th>
              <th className="text-center px-4 xl:px-6 py-3 font-medium text-muted-foreground">Expected ROI</th>
              <th className="text-left px-4 xl:px-6 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Invested</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Profit</th>
              <th className="text-right px-4 xl:px-6 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((c) => {
              const stats = getClientStats(c.id);
              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 xl:px-6 py-3">
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.address && <p className="text-xs text-muted-foreground">{c.address}</p>}
                  </td>
                  <td className="px-4 xl:px-6 py-3 text-muted-foreground text-xs">{c.phone || "—"}</td>
                  <td className="px-4 xl:px-6 py-3 text-muted-foreground text-xs font-mono">{c.nid || "—"}</td>
                  <td className="px-4 xl:px-6 py-3 text-center text-foreground font-medium">{c.expectedRoi ? `${c.expectedRoi}%` : "—"}</td>
                  <td className="px-4 xl:px-6 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 xl:px-6 py-3 text-right text-foreground">{fmt(stats.invested)}</td>
                  <td className="px-4 xl:px-6 py-3 text-right text-profit font-medium">{fmt(stats.profit)}</td>
                  <td className="px-4 xl:px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setViewClient(c)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openReminder(c)}>
                        <Send className="h-3.5 w-3.5 mr-1" /> Remind
                      </Button>
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
            {paginatedItems.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No clients found.</td></tr>
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

      {/* Add/Edit Client Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Client" : "Add Client"}</DialogTitle>
            <DialogDescription>{editId ? "Update client information." : "Add a new client to the platform."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input placeholder="e.g. Acme Corp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="Full address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input placeholder="+1-555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>NID</Label>
                <Input placeholder="NID-001" value={form.nid} onChange={(e) => setForm({ ...form, nid: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Expected ROI (%)</Label>
                <Input type="number" placeholder="12" value={form.expectedRoi} onChange={(e) => setForm({ ...form, expectedRoi: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Client["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
            <Button className="w-full" onClick={handleSave}>{editId ? "Save Changes" : "Add Client"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Client Detail Dialog */}
      <Dialog open={!!viewClient} onOpenChange={(open) => !open && setViewClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewClient && (() => {
            const stats = getClientStats(viewClient.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Client Details
                  </DialogTitle>
                  <DialogDescription>Full details for this client.</DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                  {/* Client Info */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Info</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</p>
                          <p className="text-sm font-medium text-foreground">{viewClient.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Address</p>
                          <p className="text-sm font-medium text-foreground">{viewClient.address || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium text-foreground">{viewClient.phone || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">NID</p>
                          <p className="text-sm font-mono font-medium text-foreground">{viewClient.nid || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected ROI</p>
                          <p className="text-sm font-medium text-foreground">{viewClient.expectedRoi ? `${viewClient.expectedRoi}%` : "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Created</p>
                          <p className="text-sm font-medium text-foreground">{viewClient.createdAt}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Summary ({selectedYear})</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-card border border-border rounded-lg p-3 text-center">
                        <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invested</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">{fmt(stats.invested)}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3 text-center">
                        <TrendingUp className="h-5 w-5 text-profit mx-auto mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Profit</p>
                        <p className="text-lg font-bold text-profit mt-0.5">{fmt(stats.profit)}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3 text-center">
                        <DollarSign className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Returned</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">{fmt(stats.returned)}</p>
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
                          <p className="text-sm font-medium text-foreground">{viewClient.description || "No description"}</p>
                        </div>
                      </div>
                      {viewClient.attachment && (
                        <div className="flex items-start gap-2.5">
                          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Attachment</p>
                            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                              <Paperclip className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate">{viewClient.attachment}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 px-1">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {statusBadge(viewClient.status)}
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                  <Button variant="outline" onClick={() => { setViewClient(null); openReminder(viewClient); }}>
                    <Send className="h-4 w-4 mr-1" /> Send Reminder
                  </Button>
                  <Button onClick={() => { setViewClient(null); openEdit(viewClient); }}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={!!reminderClient} onOpenChange={(open) => !open && setReminderClient(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Send Reminder
            </DialogTitle>
            <DialogDescription>Send a reminder to {reminderClient?.name}. Edit the template below if needed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Sending to:</p>
              <p className="text-sm font-medium text-foreground">{reminderClient?.name} {reminderClient?.phone ? `· ${reminderClient.phone}` : ""}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                rows={8}
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSendReminder}>
              <Send className="h-4 w-4 mr-1" /> Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
