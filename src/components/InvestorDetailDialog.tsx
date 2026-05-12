import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Investor, InvestmentEntry, InvestmentStatus } from "@/types/investor";
import { calcDaysActive, calculateProRata, fmt, YEAR_TOTAL_DAYS, TODAY } from "@/lib/investor-utils";

interface InvestorDetailDialogProps {
  investor: Investor | null;
  allInvestors: Investor[];
  profit: number;
  onClose: () => void;
  onWithdraw?: (investorId: number, amount: number) => void;
}

const typeConfig: Record<string, { label: string; colorClass: string }> = {
  deposit: { label: "Deposit", colorClass: "text-profit" },
  withdrawal: { label: "Withdrawal", colorClass: "text-destructive" },
  payout: { label: "Payout", colorClass: "text-profit" },
};

const statusBadge: Record<InvestmentStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
};

export function InvestorDetailDialog({ investor, allInvestors, profit, onClose }: InvestorDetailDialogProps) {
  if (!investor) return null;

  const deposits = investor.history.filter((h) => h.type === "deposit");
  const withdrawals = investor.history.filter((h) => h.type === "withdrawal");
  const payouts = investor.history.filter((h) => h.type === "payout");
  const approvedPrincipal = deposits.filter((d) => d.status === "approved").reduce((s, d) => s + d.amount, 0);
  const approvedWithdrawals = withdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + w.amount, 0);
  const currentBalance = approvedPrincipal - approvedWithdrawals;
  const totalProfitReceived = payouts.filter((p) => p.status === "approved").reduce((s, p) => s + p.amount, 0);
  const statusChip = statusBadge[investor.status as InvestmentStatus] || statusBadge.pending;
  const StatusIcon = statusChip.icon;

  return (
    <Dialog open={!!investor} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {investor.name}
            <Badge variant={statusChip.variant} className="text-[11px] gap-1">
              <StatusIcon className="h-3 w-3" /> {statusChip.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {investor.email} · {investor.phone || "No phone"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Investment</p>
              <p className="text-lg font-bold text-foreground">{fmt(approvedPrincipal)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Withdrawn</p>
              <p className="text-lg font-bold text-destructive">{fmt(approvedWithdrawals)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Profit Received</p>
              <p className="text-lg font-bold text-profit">{fmt(totalProfitReceived)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Current Investment</p>
              <p className="text-lg font-bold text-foreground">{fmt(currentBalance)}</p>
            </div>
          </div>

          {/* Investment History */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Investment History</p>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Days Active</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Profit Share</th>
                     <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {investor.history.map((h) => {
                     const tc = typeConfig[h.type] || typeConfig.deposit;
                     const sb = statusBadge[h.status] || statusBadge.pending;
                     const SIcon = sb.icon;
                     const daysActive = h.type === "deposit" && h.status === "approved" ? calcDaysActive(h.date) : 0;
                     const depositShare = h.type === "deposit" && h.status === "approved"
                       ? calculateProRata(h.amount, h.date, YEAR_TOTAL_DAYS, profit, allInvestors)
                       : 0;
                     return (
                       <tr key={h.id} className="border-b border-border last:border-0">
                         <td className="px-3 py-2 text-muted-foreground">{h.date}</td>
                         <td className="px-3 py-2 text-foreground capitalize">{tc.label}</td>
                         <td className={`px-3 py-2 text-right font-medium ${h.type === "withdrawal" ? "text-destructive" : "text-profit"}`}>
                           {h.type === "withdrawal" ? "-" : "+"}
                           {fmt(h.amount)}
                         </td>
                         <td className="px-3 py-2 text-right text-foreground">
                           {h.type === "deposit" && h.status === "approved" ? daysActive : "—"}
                         </td>
                         <td className="px-3 py-2 text-right font-medium text-profit">
                           {h.type === "deposit" && h.status === "approved" ? fmt(Math.round(depositShare)) : "—"}
                         </td>
                         <td className="px-3 py-2 text-center">
                           <Badge variant={sb.variant} className="text-[11px] gap-1">
                             <SIcon className="h-3 w-3" /> {sb.label}
                           </Badge>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
              </table>
            </div>
          </div>

          {/* Profit Received History */}
          {payouts.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Profit Distribution History</p>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => {
                      const sb = statusBadge[p.status] || statusBadge.pending;
                      const SIcon = sb.icon;
                      return (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 text-muted-foreground">{p.date}</td>
                          <td className="px-3 py-2 text-right font-medium text-profit">+{fmt(p.amount)}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant={sb.variant} className="text-[11px] gap-1">
                              <SIcon className="h-3 w-3" /> {sb.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t border-border">
                      <td className="px-3 py-2 font-semibold text-foreground">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-profit">{fmt(totalProfitReceived)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
