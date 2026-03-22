import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { useWallet } from "@/contexts/WalletContext";
import { useFinancial } from "@/contexts/FinancialContext";
import type { Investor, InvestorStatus, InvestmentStatus, NomineeInfo } from "@/types/investor";
import { calculateInvestorShare, fmt, initialInvestors, TODAY } from "@/lib/investor-utils";

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  invested: number;
  investmentDate: string;
  shares: number;
  bloodGroup: string;
  nidNumber: string;
  jerseySize: string;
  nominee: NomineeInfo;
  fundingSource: "direct" | "wallet";
}

interface LTIContextType {
  investors: Investor[];
  profit: number;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  handleRegister: (data: RegisterData) => void;
  handleApprove: (id: number) => void;
  handleReject: (id: number) => void;
  handleRelease: (id: number) => void;
  handleUpdateInvestment: (investorId: number, entryId: number, status: InvestmentStatus) => void;
  handleWithdraw: (investorId: number, amount: number) => void;
  handleAddTransaction: (investorId: number, amount: number, type: "deposit" | "withdrawal", date: string, extra?: { transferMedium?: string; description?: string; attachment?: { name: string; url: string } }) => void;
  /** For investor-side: register self */
  handleSelfRegister: (investor: Investor) => void;
  /** For investor-side: buy more shares */
  handleBuyShares: (investorId: number, shares: number, amount: number) => void;
}

const LTIContext = createContext<LTIContextType | null>(null);

export function LTIProvider({ children }: { children: ReactNode }) {
  const { netProfit: profit } = useFinancial();
  const { addNotification } = useNotifications();
  const { investFromWallet } = useWallet();
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleRelease = useCallback((id: number) => {
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
  }, [investors, profit]);

  const handleRegister = useCallback((data: RegisterData) => {
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
      fundingSource: data.fundingSource,
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
  }, [addNotification]);

  const handleSelfRegister = useCallback((newInvestor: Investor) => {
    setInvestors((prev) => [...prev, newInvestor]);
    addNotification({
      type: "lti",
      action: "request",
      title: "New LTI Registration",
      message: `${newInvestor.name} has registered as an investor — awaiting approval`,
      link: "/long-term-investment",
    });
  }, [addNotification]);

  const handleApprove = useCallback((id: number) => {
    const inv = investors.find((i) => i.id === id);
    if (!inv) return;

    if (inv.fundingSource === "wallet") {
      const success = investFromWallet(inv.name, inv.email, inv.invested, "invest_lti", "Long-term investment from wallet");
      if (!success) return;
    }

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
  }, [investors, investFromWallet, addNotification]);

  const handleReject = useCallback((id: number) => {
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
  }, [investors, addNotification]);

  const handleUpdateInvestment = useCallback((investorId: number, entryId: number, status: InvestmentStatus) => {
    setInvestors((prev) =>
      prev.map((inv) => {
        if (inv.id !== investorId) return inv;
        const updatedHistory = inv.history.map((h) => (h.id === entryId ? { ...h, status } : h));
        const approvedDeposits = updatedHistory.filter((h) => h.type === "deposit" && h.status === "approved").reduce((s, h) => s + h.amount, 0);
        const approvedWithdrawals = updatedHistory.filter((h) => h.type === "withdrawal" && h.status === "approved").reduce((s, h) => s + h.amount, 0);
        return { ...inv, history: updatedHistory, invested: approvedDeposits - approvedWithdrawals };
      })
    );
  }, []);

  const handleWithdraw = useCallback((investorId: number, amount: number) => {
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
  }, []);

  const handleAddTransaction = useCallback((investorId: number, amount: number, type: "deposit" | "withdrawal", date: string, extra?: { transferMedium?: string; description?: string; attachment?: { name: string; url: string } }) => {
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
  }, []);

  const handleBuyShares = useCallback((investorId: number, shares: number, amount: number) => {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      amount,
      type: "deposit" as const,
      status: "pending" as const,
    };
    setInvestors((prev) =>
      prev.map((i) => (i.id === investorId ? {
        ...i,
        shares: (i.shares || 0) + shares,
        history: [...i.history, entry],
      } : i))
    );
    addNotification({
      type: "lti",
      action: "request",
      title: "New Share Purchase Request",
      message: `An investor requested to buy ${shares} share(s) — awaiting approval`,
      link: "/long-term-investment",
    });
  }, [addNotification]);

  const value = useMemo(() => ({
    investors, profit, selectedYear, setSelectedYear,
    handleRegister, handleApprove, handleReject, handleRelease,
    handleUpdateInvestment, handleWithdraw, handleAddTransaction,
    handleSelfRegister, handleBuyShares,
  }), [investors, profit, selectedYear, handleRegister, handleApprove, handleReject, handleRelease, handleUpdateInvestment, handleWithdraw, handleAddTransaction, handleSelfRegister, handleBuyShares]);

  return <LTIContext.Provider value={value}>{children}</LTIContext.Provider>;
}

export function useLTI() {
  const ctx = useContext(LTIContext);
  if (!ctx) throw new Error("useLTI must be used within LTIProvider");
  return ctx;
}
