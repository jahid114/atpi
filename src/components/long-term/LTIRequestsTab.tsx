import { useMemo, useState } from "react";
import { CheckCircle, XCircle, Clock, UserPlus, Eye, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Investor, InvestorStatus } from "@/types/investor";
import { fmt } from "@/lib/investor-utils";
import { useWallet } from "@/contexts/WalletContext";
import { fmtWallet } from "@/types/wallet";

interface Props {
  investors: Investor[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onRegister: (data: { name: string; email: string; phone: string; invested: number; investmentDate: string }) => void;
}

export function LTIRequestsTab({ investors, onApprove, onReject, onRegister }: Props) {
  const { investFromWallet, getWalletBalance } = useWallet();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", invested: "", investmentDate: "" });
  const [fundingSource, setFundingSource] = useState<"direct" | "wallet">("direct");

  const pendingInvestors = useMemo(() => investors.filter((i) => i.status === "pending"), [investors]);
  const rejectedInvestors = useMemo(() => investors.filter((i) => i.status === "rejected"), [investors]);

  const walletBalance = form.email ? getWalletBalance(form.email) : 0;

  const handleRegister = () => {
    if (!form.name || !form.email || !form.invested || !form.investmentDate) {
      toast.error("Please fill all required fields.");
      return;
    }
    const amount = Number(form.invested);
    if (fundingSource === "wallet") {
      const success = investFromWallet(form.name, form.email, amount, "invest_lti", "Long-term investment from wallet");
      if (!success) return;
    }
    onRegister({
      name: form.name,
      email: form.email,
      phone: form.phone,
      invested: amount,
      investmentDate: form.investmentDate,
    });
    setForm({ name: "", email: "", phone: "", invested: "", investmentDate: "" });
    setFundingSource("direct");
    setRegisterOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{pendingInvestors.length} pending request{pendingInvestors.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Register Investor
        </Button>
      </div>

      {/* Pending requests */}
      {pendingInvestors.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Pending Requests
            </p>
          </div>
          <div className="divide-y divide-border">
            {pendingInvestors.map((inv) => (
              <div key={inv.id} className="px-4 py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">{inv.email} · {inv.phone || "No phone"}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Amount: <span className="font-medium text-foreground">{fmt(inv.invested)}</span></span>
                    <span>Date: <span className="font-medium text-foreground">{inv.investmentDate}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-profit border-profit/30 hover:bg-profit/10 hover:text-profit" onClick={() => onApprove(inv.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => onReject(inv.id)}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8 text-center kpi-shadow">
          <CheckCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No pending requests. All caught up!</p>
        </div>
      )}

      {/* Rejected */}
      {rejectedInvestors.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" /> Rejected ({rejectedInvestors.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {rejectedInvestors.map((inv) => (
              <div key={inv.id} className="px-4 py-3 flex items-center justify-between opacity-60">
                <div>
                  <p className="font-medium text-foreground">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">{inv.email} · {fmt(inv.invested)}</p>
                </div>
                <Badge variant="destructive" className="text-[11px]">Rejected</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Investor</DialogTitle>
            <DialogDescription>Submit investor details for review. They will remain in "Pending" status until approved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Full Name *</Label>
              <Input id="reg-name" placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email *</Label>
                <Input id="reg-email" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Phone</Label>
                <Input id="reg-phone" placeholder="+1 555-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-amount">Investment Amount *</Label>
                <Input id="reg-amount" type="number" placeholder="100000" value={form.invested} onChange={(e) => setForm((f) => ({ ...f, invested: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-date">Investment Date *</Label>
                <Input id="reg-date" type="date" value={form.investmentDate} onChange={(e) => setForm((f) => ({ ...f, investmentDate: e.target.value }))} />
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
              {fundingSource === "wallet" && walletBalance > 0 && Number(form.invested) > walletBalance && (
                <p className="text-xs text-destructive">Amount exceeds wallet balance of {fmtWallet(walletBalance)}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRegister}>Submit for Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
