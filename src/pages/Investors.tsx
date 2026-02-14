import { useState, useMemo } from "react";
import { UserPlus, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
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

type InvestorStatus = "pending" | "approved" | "rejected";

interface Investor {
  id: number;
  name: string;
  email: string;
  phone: string;
  invested: number;
  investmentDate: string;
  status: InvestorStatus;
  history: { date: string; amount: number; type: "deposit" | "withdrawal" | "payout" }[];
}

const QUARTER_START = new Date("2026-01-01");
const TODAY = new Date("2026-02-14");
const QUARTER_TOTAL_DAYS = 90;

const calcDaysActive = (dateStr: string): number => {
  const d = new Date(dateStr);
  const start = d > QUARTER_START ? d : QUARTER_START;
  return Math.max(0, Math.ceil((TODAY.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

const calculateProRata = (amount: number, joinDate: string, _periodTotalDays: number, totalProfit: number, allInvestors: Investor[]): number => {
  const approved = allInvestors.filter((i) => i.status === "approved");
  const daysActive = calcDaysActive(joinDate);
  const weight = amount * daysActive;
  const totalWeight = approved.reduce((s, inv) => s + inv.invested * calcDaysActive(inv.investmentDate), 0);
  return totalWeight > 0 ? (weight / totalWeight) * totalProfit : 0;
};

const getPeriodBadge = (dateStr: string): "Early-Period" | "Mid-Period" => {
  const daysActive = calcDaysActive(dateStr);
  const quarterElapsed = Math.ceil((TODAY.getTime() - QUARTER_START.getTime()) / (1000 * 60 * 60 * 24));
  return daysActive >= quarterElapsed * 0.75 ? "Early-Period" : "Mid-Period";
};

const initialInvestors: Investor[] = [
  { id: 1, name: "Sarah Mitchell", email: "sarah@example.com", phone: "+1 555-0101", invested: 200000, investmentDate: "2024-06-15", status: "approved", history: [{ date: "2024-06-15", amount: 200000, type: "deposit" }, { date: "2025-12-31", amount: 18400, type: "payout" }] },
  { id: 2, name: "James Chen", email: "james@example.com", phone: "+1 555-0202", invested: 500000, investmentDate: "2025-03-01", status: "approved", history: [{ date: "2025-03-01", amount: 500000, type: "deposit" }] },
  { id: 3, name: "Olivia Nakamura", email: "olivia@example.com", phone: "+1 555-0303", invested: 150000, investmentDate: "2025-11-20", status: "approved", history: [{ date: "2025-11-20", amount: 150000, type: "deposit" }] },
  { id: 4, name: "Marcus Williams", email: "marcus@example.com", phone: "+1 555-0404", invested: 800000, investmentDate: "2026-01-10", status: "approved", history: [{ date: "2026-01-10", amount: 800000, type: "deposit" }] },
  { id: 5, name: "Elena Rodriguez", email: "elena@example.com", phone: "+1 555-0505", invested: 350000, investmentDate: "2025-08-05", status: "pending", history: [{ date: "2025-08-05", amount: 350000, type: "deposit" }] },
];

const fmt = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const quarterDaysElapsed = Math.ceil((TODAY.getTime() - QUARTER_START.getTime()) / (1000 * 60 * 60 * 24));

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
  const [form, setForm] = useState({ name: "", email: "", phone: "", invested: "", investmentDate: "" });

  const approvedInvestors = useMemo(() => investors.filter((i) => i.status === "approved"), [investors]);

  const rows = useMemo(
    () =>
      investors.map((inv) => {
        const daysActive = inv.status === "approved" ? calcDaysActive(inv.investmentDate) : 0;
        const share = inv.status === "approved" ? calculateProRata(inv.invested, inv.investmentDate, QUARTER_TOTAL_DAYS, profit, investors) : 0;
        const badge = getPeriodBadge(inv.investmentDate);
        return { ...inv, daysActive, share, badge };
      }),
    [profit, investors]
  );

  const totalInvested = approvedInvestors.reduce((s, i) => s + i.invested, 0);

  const handleRegister = () => {
    if (!form.name || !form.email || !form.invested || !form.investmentDate) {
      toast.error("Please fill all required fields.");
      return;
    }
    const newInvestor: Investor = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      invested: Number(form.invested),
      investmentDate: form.investmentDate,
      status: "pending",
      history: [{ date: form.investmentDate, amount: Number(form.invested), type: "deposit" }],
    };
    setInvestors((prev) => [...prev, newInvestor]);
    setForm({ name: "", email: "", phone: "", invested: "", investmentDate: "" });
    setRegisterOpen(false);
    toast.success(`${newInvestor.name} registered — awaiting approval.`);
  };

  const handleApprove = (id: number) => {
    setInvestors((prev) => prev.map((i) => (i.id === id ? { ...i, status: "approved" as InvestorStatus } : i)));
    toast.success("Investor approved.");
  };

  const handleReject = (id: number) => {
    setInvestors((prev) => prev.map((i) => (i.id === id ? { ...i, status: "rejected" as InvestorStatus } : i)));
    toast("Investor rejected.");
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
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Period</th>
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
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{inv.name}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(inv.invested)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.investmentDate}</td>
                  <td className="px-4 py-3 text-right text-foreground">{inv.daysActive}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={inv.badge === "Early-Period" ? "default" : "secondary"} className="text-[11px]">
                      {inv.badge}
                    </Badge>
                  </td>
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
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td className="px-4 py-3 font-semibold text-foreground">Total</td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(totalInvested)}</td>
              <td colSpan={4} />
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
      <Dialog open={!!detailInvestor} onOpenChange={(open) => !open && setDetailInvestor(null)}>
        <DialogContent className="sm:max-w-lg">
          {detailInvestor && (
            <>
              <DialogHeader>
                <DialogTitle>{detailInvestor.name}</DialogTitle>
                <DialogDescription>{detailInvestor.email} · {detailInvestor.phone || "No phone"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Principal</p>
                    <p className="text-lg font-bold text-foreground">{fmt(detailInvestor.invested)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-lg font-bold text-foreground capitalize">{detailInvestor.status}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Days Active</p>
                    <p className="text-lg font-bold text-foreground">{detailInvestor.status === "approved" ? calcDaysActive(detailInvestor.investmentDate) : "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Investment History</p>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailInvestor.history.map((h, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 text-muted-foreground">{h.date}</td>
                            <td className="px-3 py-2 capitalize text-foreground">{h.type}</td>
                            <td className={`px-3 py-2 text-right font-medium ${h.type === "withdrawal" ? "text-destructive" : "text-profit"}`}>
                              {h.type === "withdrawal" ? "-" : "+"}{fmt(h.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
