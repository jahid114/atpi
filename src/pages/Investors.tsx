import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, UserPlus, ArrowLeftRight } from "lucide-react";
import type { Investor, InvestorStatus, InvestmentStatus } from "@/types/investor";
import { calculateInvestorShare, fmt, initialInvestors, TODAY } from "@/lib/investor-utils";
import { useFinancial } from "@/contexts/FinancialContext";
import { LTIOverviewTab } from "@/components/long-term/LTIOverviewTab";
import { LTIInvestorsTab } from "@/components/long-term/LTIInvestorsTab";
import { LTIRequestsTab } from "@/components/long-term/LTIRequestsTab";
import { LTITransactionsTab } from "@/components/long-term/LTITransactionsTab";

export default function Investors() {
  const { netProfit: profit } = useFinancial();
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);

  const handleRelease = (id: number) => {
    const inv = investors.find((i) => i.id === id);
    if (!inv || inv.status !== "approved") return;
    const share = calculateInvestorShare(inv, profit, investors);
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

  const handleRegister = (data: { name: string; email: string; phone: string; invested: number; investmentDate: string }) => {
    const entryId = Date.now();
    const newInvestor: Investor = {
      id: entryId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      invested: data.invested,
      investmentDate: data.investmentDate,
      status: "pending",
      history: [{ id: entryId + 1, date: data.investmentDate, amount: data.invested, type: "deposit", status: "pending" }],
    };
    setInvestors((prev) => [...prev, newInvestor]);
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
        const approvedDeposits = updatedHistory.filter((h) => h.type === "deposit" && h.status === "approved").reduce((s, h) => s + h.amount, 0);
        const approvedWithdrawals = updatedHistory.filter((h) => h.type === "withdrawal" && h.status === "approved").reduce((s, h) => s + h.amount, 0);
        return { ...inv, history: updatedHistory, invested: approvedDeposits - approvedWithdrawals };
      })
    );
  };

  const handleWithdraw = (investorId: number, amount: number) => {
    const withdrawalEntry = {
      id: Date.now(),
      date: TODAY.toISOString().split("T")[0],
      amount,
      type: "withdrawal" as const,
      status: "pending" as const,
    };
    setInvestors((prev) =>
      prev.map((i) => (i.id === investorId ? { ...i, history: [...i.history, withdrawalEntry] } : i))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Long-Term Investment</h1>
        <p className="text-sm text-muted-foreground mt-1">Pro-rata distribution engine · Q1 2026</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="investors" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" /> Investors
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5 text-xs sm:text-sm">
            <UserPlus className="h-4 w-4" /> Requests
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm">
            <ArrowLeftRight className="h-4 w-4" /> Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <LTIOverviewTab investors={investors} profit={profit} />
        </TabsContent>
        <TabsContent value="investors">
          <LTIInvestorsTab investors={investors} profit={profit} onRelease={handleRelease} onUpdateInvestment={handleUpdateInvestment} onWithdraw={handleWithdraw} />
        </TabsContent>
        <TabsContent value="requests">
          <LTIRequestsTab investors={investors} onApprove={handleApprove} onReject={handleReject} onRegister={handleRegister} />
        </TabsContent>
        <TabsContent value="transactions">
          <LTITransactionsTab investors={investors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
