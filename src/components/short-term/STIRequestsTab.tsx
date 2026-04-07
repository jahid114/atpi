import { useMemo, useState, useRef } from "react";
import { CheckCircle, XCircle, Clock, Plus, Wallet, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import type { ShortTermProject, InvestorEntryStatus } from "@/types/short-term";
import { fmt } from "@/types/short-term";
import { useWallet } from "@/contexts/WalletContext";
import { fmtWallet } from "@/types/wallet";
import { initialUsers } from "@/pages/InvestorUsers";

interface Props {
  project: ShortTermProject;
  onAddInvestor: (data: { investorName: string; phone: string; email: string; amount: number; fundingSource: "direct" | "wallet"; date: string; attachment?: { name: string; url: string } }) => void;
  onUpdateStatus: (entryId: number, status: InvestorEntryStatus) => void;
}

export function STIRequestsTab({ project, onAddInvestor, onUpdateStatus }: Props) {
  const { investFromWallet, getWalletBalance } = useWallet();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ investorName: "", phone: "", email: "", amount: "", date: "" });
  const [fundingSource, setFundingSource] = useState<"direct" | "wallet">("direct");
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [confirmAction, setConfirmAction] = useState<{ entryId: number; status: InvestorEntryStatus; name: string } | null>(null);

  const pending = useMemo(() => project.investors.filter((inv) => inv.status === "pending"), [project.investors]);
  const rejected = useMemo(() => project.investors.filter((inv) => inv.status === "rejected"), [project.investors]);

  const pendingPagination = usePagination(pending);
  const rejectedPagination = usePagination(rejected);

  const availableUsers = useMemo(() => initialUsers, []);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    if (userId === "new") {
      setForm({ investorName: "", phone: "", email: "", amount: "", date: "" });
      return;
    }
    const user = initialUsers.find((u) => String(u.id) === userId);
    if (!user) return;
    setForm((f) => ({ ...f, investorName: user.name, phone: user.phone, email: user.email }));
  };

  const walletBalance = form.email ? getWalletBalance(form.email) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachment({ name: file.name, url: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!form.investorName || !form.phone || !form.amount) {
      toast.error("Please fill all required fields.");
      return;
    }
    const amount = Number(form.amount);
    if (fundingSource === "wallet") {
      if (walletBalance < amount) {
        toast.error("Insufficient wallet balance.");
        return;
      }
      const success = investFromWallet(form.investorName, form.email, amount, "invest_sti", `Investment in ${project.name}`);
      if (!success) return;
    }
    onAddInvestor({
      investorName: form.investorName,
      phone: form.phone,
      email: form.email,
      amount,
      fundingSource,
      date: form.date || new Date().toISOString().split("T")[0],
      attachment: fundingSource === "direct" ? attachment || undefined : undefined,
    });
    setForm({ investorName: "", phone: "", email: "", amount: "", date: "" });
    setFundingSource("direct");
    setAttachment(null);
    setSelectedUserId("");
    setAddOpen(false);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    onUpdateStatus(confirmAction.entryId, confirmAction.status);
    setConfirmAction(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pending.length} pending request{pending.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Investor
        </Button>
      </div>

      {/* Pending Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-muted/50">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" /> Pending Requests
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Investor</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Phone</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingPagination.paginatedItems.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No pending requests.</td></tr>
            ) : (
              pendingPagination.paginatedItems.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground text-sm">{inv.investorName}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{inv.phone}</td>
                  <td className="px-3 py-2 text-right font-medium text-foreground">{fmt(inv.amount)}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{inv.date}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-profit hover:text-profit" onClick={() => setConfirmAction({ entryId: inv.id, status: "approved", name: inv.investorName })}>
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmAction({ entryId: inv.id, status: "rejected", name: inv.investorName })}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pending.length > 5 && (
          <div className="p-2 border-t border-border">
            <TablePagination
              currentPage={pendingPagination.currentPage}
              totalPages={pendingPagination.totalPages}
              totalItems={pendingPagination.totalItems}
              onPageChange={pendingPagination.goToPage}
              hasNextPage={pendingPagination.hasNextPage}
              hasPrevPage={pendingPagination.hasPrevPage}
            />
          </div>
        )}
      </div>


      {/* Confirmation Modal */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.status === "approved" ? "Approve" : "Reject"} Investor
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction?.status === "approved" ? "approve" : "reject"} {confirmAction?.name}'s investment request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmAction?.status === "rejected" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.status === "approved" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Investor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Investor</DialogTitle>
            <DialogDescription>Add an investor to this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Select Investor</Label>
              <Select value={selectedUserId} onValueChange={handleSelectUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an investor" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name} — {u.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Investor Name *</Label>
              <Input placeholder="Auto-filled from selection" value={form.investorName} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input type="tel" placeholder="Auto-filled from selection" value={form.phone} readOnly className="bg-muted/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input type="number" placeholder="50000" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Funding Source</Label>
              <Select value={fundingSource} onValueChange={(v) => setFundingSource(v as "direct" | "wallet")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Investment</SelectItem>
                  <SelectItem value="wallet">From Wallet {walletBalance > 0 ? `(${fmtWallet(walletBalance)} available)` : "(No balance)"}</SelectItem>
                </SelectContent>
              </Select>
              {fundingSource === "wallet" && walletBalance > 0 && Number(form.amount) > walletBalance && (
                <p className="text-xs text-destructive">Amount exceeds wallet balance of {fmtWallet(walletBalance)}</p>
              )}
            </div>
            {fundingSource === "direct" && (
              <div className="space-y-1.5">
                <Label>Attachment</Label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  {attachment ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                      <Paperclip className="h-4 w-4" />
                      {attachment.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Paperclip className="h-5 w-5" />
                      <p className="text-xs">Click to attach a file</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
