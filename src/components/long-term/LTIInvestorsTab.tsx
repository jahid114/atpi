import { useMemo, useState } from "react";
import { Eye, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { InvestorDetailDialog } from "@/components/InvestorDetailDialog";
import type { Investor, InvestorStatus, InvestmentStatus } from "@/types/investor";
import { calcDaysActive, calculateInvestorShare, fmt } from "@/lib/investor-utils";

const statusConfig: Record<InvestorStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
};

interface Props {
  investors: Investor[];
  profit: number;
  onRelease: (id: number) => void;
  onUpdateInvestment: (investorId: number, entryId: number, status: InvestmentStatus) => void;
  onWithdraw: (investorId: number, amount: number) => void;
}

export function LTIInvestorsTab({ investors, profit, onRelease, onUpdateInvestment, onWithdraw }: Props) {
  const [search, setSearch] = useState("");
  const [detailInvestor, setDetailInvestor] = useState<Investor | null>(null);

  const approvedInvestors = useMemo(() => investors.filter((i) => i.status === "approved"), [investors]);

  const rows = useMemo(() => {
    return approvedInvestors
      .filter((inv) => inv.name.toLowerCase().includes(search.toLowerCase()) || inv.email.toLowerCase().includes(search.toLowerCase()))
      .map((inv) => {
        const daysActive = calcDaysActive(inv.investmentDate);
        const share = calculateInvestorShare(inv, profit, investors);
        return { ...inv, daysActive, share };
      });
  }, [approvedInvestors, profit, investors, search]);

  const totalInvested = approvedInvestors.reduce((s, i) => s + i.invested, 0);
  const currentDetailInvestor = detailInvestor ? investors.find((i) => i.id === detailInvestor.id) || null : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search investors..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground">{rows.length} active investor{rows.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Investor Name</th>
              <th className="text-right px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Total Principal</th>
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Investment Date</th>
              <th className="text-right px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Days Active</th>
              <th className="text-right px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Projected Share</th>
              <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 xl:px-6 py-3 xl:py-4">
                  <p className="font-medium text-foreground">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">{inv.email}</p>
                </td>
                <td className="px-4 xl:px-6 py-3 xl:py-4 text-right text-foreground">{fmt(inv.invested)}</td>
                <td className="px-4 xl:px-6 py-3 xl:py-4 text-muted-foreground">{inv.investmentDate}</td>
                <td className="px-4 xl:px-6 py-3 xl:py-4 text-right text-foreground">{inv.daysActive}</td>
                <td className="px-4 xl:px-6 py-3 xl:py-4 text-right font-semibold text-profit">{fmt(Math.round(inv.share))}</td>
                <td className="px-4 xl:px-6 py-3 xl:py-4 text-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => setDetailInvestor(inv)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-profit hover:text-profit" title="Release profit" onClick={() => onRelease(inv.id)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td className="px-4 xl:px-6 py-3 xl:py-4 font-semibold text-foreground">Total</td>
              <td className="px-4 xl:px-6 py-3 xl:py-4 text-right font-semibold text-foreground">{fmt(totalInvested)}</td>
              <td colSpan={2} />
              <td className="px-4 xl:px-6 py-3 xl:py-4 text-right font-bold text-profit">{fmt(profit)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <InvestorDetailDialog
        investor={currentDetailInvestor}
        allInvestors={investors}
        profit={profit}
        onClose={() => setDetailInvestor(null)}
        onUpdateInvestment={onUpdateInvestment}
        onWithdraw={onWithdraw}
      />
    </div>
  );
}
