import { useState } from "react";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, UserPlus, ArrowLeftRight, DollarSign } from "lucide-react";
import type { NomineeInfo } from "@/types/investor";
import type { Investor, InvestorStatus, InvestmentStatus } from "@/types/investor";
import { calculateInvestorShare, fmt, initialInvestors, TODAY } from "@/lib/investor-utils";
import { useFinancial } from "@/contexts/FinancialContext";
import { useWallet } from "@/contexts/WalletContext";
import { LTIOverviewTab } from "@/components/long-term/LTIOverviewTab";
import { LTIRequestsTab } from "@/components/long-term/LTIRequestsTab";
import { LTITransactionsTab } from "@/components/long-term/LTITransactionsTab";
import { LTIProfitShareTab } from "@/components/long-term/LTIProfitShareTab";
import { YearSelector } from "@/components/YearSelector";

export default function Investors() {
  const { netProfit: profit } = useFinancial();
  const { addNotification } = useNotifications();
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  const handleRegister = (data: { name: string; email: string; phone: string; invested: number; investmentDate: string; shares: number; bloodGroup: string; nidNumber: string; jerseySize: string; nominee: NomineeInfo }) => {
    const entryId = Date.now();
    const newInvestor: Investor = {
      id: entryId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      invested: data.invested,
      investmentDate: data.investmentDate,
      status: "pending",
      shares: data.shares,
      bloodGroup: data.bloodGroup,
      nidNumber: data.nidNumber,
      jerseySize: data.jerseySize,
      nominee: data.nominee,
      history: [{ id: entryId + 1, date: data.investmentDate, amount: data.invested, type: "deposit", status: "pending" }],
    };
    setInvestors((prev) => [...prev, newInvestor]);
    addNotification({
      type: "lti",
      action: "request",
      title: "New LTI Registration",
      message: `${data.name} has registered as an investor — awaiting approval`,
      link: "/long-term-investment",
    });
    toast.success(`${newInvestor.name} registered — awaiting approval.`);
  };

  const handleApprove = (id: number) => {
    const inv = investors.find((i) => i.id === id);
    setInvestors((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "approved" as InvestorStatus, history: i.history.map((h) => (h.status === "pending" ? { ...h, status: "approved" as InvestmentStatus } : h)) }
          : i
      )
    );
    addNotification({
      type: "lti",
      action: "approved",
      title: "LTI Investor Approved",
      message: `${inv?.name || "Investor"} has been approved for long-term investment`,
      link: "/long-term-investment",
    });
    toast.success("Investor approved.");
  };

  const handleReject = (id: number) => {
    const inv = investors.find((i) => i.id === id);
    setInvestors((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "rejected" as InvestorStatus, history: i.history.map((h) => (h.status === "pending" ? { ...h, status: "rejected" as InvestmentStatus } : h)) }
          : i
      )
    );
    addNotification({
      type: "lti",
      action: "rejected",
      title: "LTI Investor Rejected",
      message: `${inv?.name || "Investor"}'s registration has been rejected`,
      link: "/long-term-investment",
    });
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

  const handleAddTransaction = (investorId: number, amount: number, type: "deposit" | "withdrawal", date: string, extra?: { transferMedium?: string; description?: string; attachment?: { name: string; url: string } }) => {
    const entry = {
      id: Date.now(),
      date,
      amount,
      type,
      status: "pending" as const,
      transferMedium: extra?.transferMedium as any,
      description: extra?.description,
      attachment: extra?.attachment,
    };
    setInvestors((prev) =>
      prev.map((i) => (i.id === investorId ? { ...i, history: [...i.history, entry] } : i))
    );
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Long-Term Investment</h1>
          <p className="text-sm text-muted-foreground mt-1">Pro-rata distribution engine · Year {selectedYear}</p>
        </div>
        <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5 text-xs sm:text-sm">
            <UserPlus className="h-4 w-4" /> Requests
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm">
            <ArrowLeftRight className="h-4 w-4" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="profit-share" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4" /> Profit Share
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <LTIOverviewTab investors={investors} profit={profit} onRelease={handleRelease} onUpdateInvestment={handleUpdateInvestment} onWithdraw={handleWithdraw} selectedYear={selectedYear} />
        </TabsContent>
        <TabsContent value="requests">
          <LTIRequestsTab investors={investors} onApprove={handleApprove} onReject={handleReject} onRegister={handleRegister} />
        </TabsContent>
        <TabsContent value="transactions">
          <LTITransactionsTab investors={investors} onUpdateInvestment={handleUpdateInvestment} onAddTransaction={handleAddTransaction} selectedYear={selectedYear} />
        </TabsContent>
        <TabsContent value="profit-share">
          <LTIProfitShareTab investors={investors} profit={profit} selectedYear={selectedYear} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
