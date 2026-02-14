import React, { useState, useMemo } from "react";
import { UserPlus, Eye, CheckCircle, XCircle, Clock, Send, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
import { toast } from "sonner";
import { InvestorDetailDialog } from "@/components/InvestorDetailDialog";
import type { Investor, InvestorStatus, InvestmentStatus } from "@/types/investor";
import {
  QUARTER_TOTAL_DAYS,
  quarterDaysElapsed,
  calcDaysActive,
  calculateProRata,
  fmt,
  initialInvestors,
  TODAY,
} from "@/lib/investor-utils";

const statusConfig: Record<InvestorStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
};

export default function Investors() {
  const [profit, setProfit] = useState(280000);
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailInvestor, setDetailInvestor] = useState<Investor | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({ name: "", email: "", phone: "", invested: "", investmentDate: "" });

  const approvedInvestors = useMemo(() => investors.filter((i) => i.status === "approved"), [investors]);

  const rows = useMemo(
    () =>
      investors.map((inv) => {
        const daysActive = inv.status === "approved" ? calcDaysActive(inv.investmentDate) : 0;
        const share = inv.status === "approved" ? calculateProRata(inv.invested, inv.investmentDate, QUARTER_TOTAL_DAYS, profit, investors) : 0;
        return { ...inv, daysActive, share };
      }),
    [profit, investors]
  );

  const totalInvested = approvedInvestors.reduce((s, i) => s + i.invested, 0);

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const currentDetailInvestor = detailInvestor ? investors.find((i) => i.id === detailInvestor.id) || null : null;

  const handleRelease = (id: number) => {
    const inv = investors.find((i) => i.id === id);
    if (!inv || inv.status !== "approved") return;
    const share = calculateProRata(inv.invested, inv.investmentDate, QUARTER_TOTAL_DAYS, profit, investors);
    if (share <= 0) {
      toast.error("No profit to release for this investor.");
      return;
    }
    const payoutEntry = {
      id: Date.now(),
      date: TODAY.toISOString().split("T")[0],
      amount: Math.round(share),
      type: "payout" as const,
      status: "approved" as const,
    };
    setInvestors((prev) =>
      prev.map((i) => (i.id === id ? { ...i, history: [...i.history, payoutEntry] } : i))
    );
    toast.success(`Released ${fmt(Math.round(share))} to ${inv.name}.`);
  };

  const handleRegister = () => {
    if (!form.name || !form.email || !form.invested || !form.investmentDate) {
      toast.error("Please fill all required fields.");
      return;
    }
    const entryId = Date.now();
    const newInvestor: Investor = {
      id: entryId,
      name: form.name,
      email: form.email,
      phone: form.phone,
      invested: Number(form.invested),
      investmentDate: form.investmentDate,
      status: "pending",
      history: [{ id: entryId + 1, date: form.investmentDate, amount: Number(form.invested), type: "deposit", status: "pending" }],
    };
    setInvestors((prev) => [...prev, newInvestor]);
    setForm({ name: "", email: "", phone: "", invested: "", investmentDate: "" });
    setRegisterOpen(false);
    toast.success(`${newInvestor.name} registered — awaiting approval.`);
  };

  const handleApprove = (id: number) => {
    setInvestors((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "approved" as InvestorStatus, history: i.history.map((h) => (h.status === "pending" ? { ...h, status: "approved" as InvestmentStatus } : h)) }
          : i
      )
    );
    toast.success("Investor approved.");
  };

  const handleReject = (id: number) => {
    setInvestors((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "rejected" as InvestorStatus, history: i.history.map((h) => (h.status === "pending" ? { ...h, status: "rejected" as InvestmentStatus } : h)) }
          : i
      )
    );
    toast("Investor rejected.");
  };

  const handleUpdateInvestment = (investorId: number, entryId: number, status: InvestmentStatus) => {
    setInvestors((prev) =>
      prev.map((inv) => {
        if (inv.id !== investorId) return inv;
        const updatedHistory = inv.history.map((h) => (h.id === entryId ? { ...h, status } : h));
        // Recalculate invested from approved deposits
        const approvedDeposits = updatedHistory.filter((h) => h.type === "deposit" && h.status === "approved").reduce((s, h) => s + h.amount, 0);
        return { ...inv, history: updatedHistory, invested: approvedDeposits };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investor Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Pro-rata distribution engine · Q1 2026</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Register Investor
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Investors</p>
          <p className="text-2xl font-bold text-foreground mt-1">{approvedInvestors.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Principal</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalInvested)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Days Elapsed</p>
          <p className="text-2xl font-bold text-foreground mt-1">{quarterDaysElapsed} / {QUARTER_TOTAL_DAYS}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Simulated Profit</p>
          <p className="text-2xl font-bold text-profit mt-1">{fmt(profit)}</p>
        </div>
      </div>

      {/* Simulate Quarter Slider */}
      <div className="bg-card border border-border rounded-lg p-5 kpi-shadow space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Simulate Quarter Net Profit</p>
          <span className="text-sm font-bold text-profit">{fmt(profit)}</span>
        </div>
        <Slider min={0} max={1000000} step={10000} value={[profit]} onValueChange={(v) => setProfit(v[0])} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>$1,000,000</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investor Name</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Principal</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investment Date</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Days Active</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Projected Share</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => {
              const sc = statusConfig[inv.status];
              const StatusIcon = sc.icon;
              return (
                <React.Fragment key={inv.id}>
                <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      {inv.status === "approved" && inv.history.filter(h => h.type === "deposit" && h.status === "approved").length > 0 && (
                        <button onClick={() => toggleExpand(inv.id)} className="p-0.5 rounded hover:bg-muted transition-colors">
                          {expandedRows.has(inv.id) ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                      )}
                      {inv.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(inv.invested)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.investmentDate}</td>
                  <td className="px-4 py-3 text-right text-foreground">{inv.daysActive}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={sc.variant} className="text-[11px] gap-1">
                      <StatusIcon className="h-3 w-3" /> {sc.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-profit">
                    {inv.status === "approved" ? fmt(Math.round(inv.share)) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => setDetailInvestor(inv)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {inv.status === "approved" && (
                      <Button variant="ghost" size="sm" className="text-profit hover:text-profit" title="Release profit" onClick={() => handleRelease(inv.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {inv.status === "pending" && (
                      <>
                        <Button variant="ghost" size="sm" className="text-profit hover:text-profit" onClick={() => handleApprove(inv.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleReject(inv.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
                {expandedRows.has(inv.id) && inv.history.filter(h => h.type === "deposit" && h.status === "approved").map((dep) => (
                  <tr key={`dep-${dep.id}`} className="bg-muted/20 border-b border-border last:border-0">
                    <td className="px-4 py-2 pl-10 text-sm text-muted-foreground">↳ Deposit on {dep.date}</td>
                    <td className="px-4 py-2 text-right text-sm text-muted-foreground">{fmt(dep.amount)}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">{dep.date}</td>
                    <td className="px-4 py-2 text-right text-sm text-foreground font-medium">{calcDaysActive(dep.date)}</td>
                    <td colSpan={3} />
                  </tr>
                ))}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td className="px-4 py-3 font-semibold text-foreground">Total</td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(totalInvested)}</td>
              <td colSpan={3} />
              <td className="px-4 py-3 text-right font-bold text-profit">{fmt(profit)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Register Investor Dialog */}
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
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRegister}>Submit for Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <InvestorDetailDialog
        investor={currentDetailInvestor}
        onClose={() => setDetailInvestor(null)}
        onUpdateInvestment={handleUpdateInvestment}
      />
    </div>
  );
}
