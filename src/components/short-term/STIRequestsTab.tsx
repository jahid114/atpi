import { useMemo, useState } from "react";
import { CheckCircle, XCircle, Clock, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ShortTermProject, InvestorEntryStatus } from "@/types/short-term";
import { fmt } from "@/types/short-term";
import { useWallet } from "@/contexts/WalletContext";
import { fmtWallet } from "@/types/wallet";

interface Props {
  project: ShortTermProject;
  onAddInvestor: (data: { investorName: string; email: string; amount: number; fundingSource: "direct" | "wallet" }) => void;
  onUpdateStatus: (entryId: number, status: InvestorEntryStatus) => void;
}

export function STIRequestsTab({ project, onAddInvestor, onUpdateStatus }: Props) {
  const { investFromWallet, getWalletBalance } = useWallet();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ investorName: "", email: "", amount: "" });
  const [fundingSource, setFundingSource] = useState<"direct" | "wallet">("direct");

  const pending = useMemo(() => project.investors.filter((inv) => inv.status === "pending"), [project.investors]);
  const rejected = useMemo(() => project.investors.filter((inv) => inv.status === "rejected"), [project.investors]);

  const walletBalance = form.email ? getWalletBalance(form.email) : 0;

  const handleSubmit = () => {
    if (!form.investorName || !form.amount) {
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
    onAddInvestor({ investorName: form.investorName, email: form.email, amount, fundingSource });
    setForm({ investorName: "", email: "", amount: "" });
    setFundingSource("direct");
    setAddOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pending.length} pending request{pending.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Investor
        </Button>
      </div>

      {/* Pending */}
      {pending.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/50">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" /> Pending Requests
            </p>
          </div>
          <div className="divide-y divide-border">
            {pending.map((inv) => (
              <div key={inv.id} className="px-3 py-3 flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-medium text-foreground text-sm">{inv.investorName}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.email} · {fmt(inv.amount)} · {inv.date}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-profit hover:text-profit" onClick={() => onUpdateStatus(inv.id, "approved")}>
                    <CheckCircle className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => onUpdateStatus(inv.id, "rejected")}>
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-6 text-center">
          <CheckCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        </div>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/50">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-destructive" /> Rejected ({rejected.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {rejected.map((inv) => (
              <div key={inv.id} className="px-3 py-2 flex items-center justify-between opacity-60">
                <div>
                  <p className="font-medium text-foreground text-sm">{inv.investorName}</p>
                  <p className="text-xs text-muted-foreground">{inv.email} · {fmt(inv.amount)}</p>
                </div>
                <Badge variant="destructive" className="text-[11px]">Rejected</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Investor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Investor</DialogTitle>
            <DialogDescription>Add an investor to this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Investor Name *</Label>
              <Input placeholder="e.g. John Doe" value={form.investorName} onChange={(e) => setForm((f) => ({ ...f, investorName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" placeholder="50000" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
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
