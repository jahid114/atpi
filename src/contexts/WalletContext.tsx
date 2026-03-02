import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from "react";
import type { InvestorWallet, WalletTransaction, WalletTransactionStatus, TransferMedium } from "@/types/wallet";
import { toast } from "sonner";

interface WalletContextType {
  wallets: InvestorWallet[];
  requestTransaction: (investorId: number, amount: number, type: "top_up" | "withdraw", transferMedium: TransferMedium, attachment?: string) => void;
  approveTransaction: (walletId: number, txId: number) => void;
  rejectTransaction: (walletId: number, txId: number) => void;
  investFromWallet: (investorName: string, email: string, amount: number, type: "invest_lti" | "invest_sti", description: string) => boolean;
  getWalletBalance: (email: string) => number;
  pendingCount: number;
}

const WalletContext = createContext<WalletContextType | null>(null);

const initialWallets: InvestorWallet[] = [
  {
    id: 1, investorName: "Alice Johnson", email: "alice@example.com", phone: "+8801711111111",
    balance: 25000, totalTopUps: 75000, totalWithdrawals: 0, totalSpent: 50000,
    transactions: [
      { id: 101, investorName: "Alice Johnson", email: "alice@example.com", type: "top_up", amount: 75000, date: "2026-01-10", status: "approved", description: "Initial wallet funding", transferMedium: "bank_transfer" },
      { id: 102, investorName: "Alice Johnson", email: "alice@example.com", type: "invest_lti", amount: 30000, date: "2026-01-15", status: "approved", description: "Long-term investment from wallet" },
      { id: 103, investorName: "Alice Johnson", email: "alice@example.com", type: "invest_sti", amount: 20000, date: "2026-02-01", status: "approved", description: "Commercial Property Flip investment" },
    ],
  },
  {
    id: 2, investorName: "Bob Smith", email: "bob@example.com", phone: "+8801722222222",
    balance: 15000, totalTopUps: 40000, totalWithdrawals: 0, totalSpent: 25000,
    transactions: [
      { id: 201, investorName: "Bob Smith", email: "bob@example.com", type: "top_up", amount: 40000, date: "2026-01-20", status: "approved", description: "Wallet top-up", transferMedium: "cash" },
      { id: 202, investorName: "Bob Smith", email: "bob@example.com", type: "invest_sti", amount: 25000, date: "2026-02-05", status: "approved", description: "Equipment Leasing investment" },
    ],
  },
  {
    id: 3, investorName: "David Lee", email: "david@example.com", phone: "+8801733333333",
    balance: 10000, totalTopUps: 10000, totalWithdrawals: 0, totalSpent: 0,
    transactions: [
      { id: 301, investorName: "David Lee", email: "david@example.com", type: "top_up", amount: 10000, date: "2026-02-10", status: "pending", description: "Pending top-up", transferMedium: "check" },
    ],
  },
  {
    id: 4, investorName: "Carol Williams", email: "carol@example.com", phone: "+8801744444444",
    balance: 45000, totalTopUps: 100000, totalWithdrawals: 0, totalSpent: 55000,
    transactions: [
      { id: 401, investorName: "Carol Williams", email: "carol@example.com", type: "top_up", amount: 100000, date: "2026-01-05", status: "approved", description: "Initial funding", transferMedium: "bank_transfer" },
      { id: 402, investorName: "Carol Williams", email: "carol@example.com", type: "invest_lti", amount: 55000, date: "2026-01-18", status: "approved", description: "LTI allocation" },
    ],
  },
  {
    id: 5, investorName: "Frank Müller", email: "frank@example.com", phone: "+8801755555555",
    balance: 30000, totalTopUps: 80000, totalWithdrawals: 0, totalSpent: 50000,
    transactions: [
      { id: 501, investorName: "Frank Müller", email: "frank@example.com", type: "top_up", amount: 80000, date: "2026-01-08", status: "approved", description: "Wallet deposit", transferMedium: "bank_transfer" },
      { id: 502, investorName: "Frank Müller", email: "frank@example.com", type: "invest_sti", amount: 50000, date: "2026-02-03", status: "approved", description: "STI project investment" },
    ],
  },
  {
    id: 6, investorName: "Grace Tanaka", email: "grace@example.com", phone: "+8801766666666",
    balance: 60000, totalTopUps: 60000, totalWithdrawals: 0, totalSpent: 0,
    transactions: [
      { id: 601, investorName: "Grace Tanaka", email: "grace@example.com", type: "top_up", amount: 60000, date: "2026-02-12", status: "pending", description: "Top-up request", transferMedium: "cash" },
    ],
  },
  {
    id: 7, investorName: "Hassan Ali", email: "hassan@example.com", phone: "+8801777777777",
    balance: 20000, totalTopUps: 50000, totalWithdrawals: 0, totalSpent: 30000,
    transactions: [
      { id: 701, investorName: "Hassan Ali", email: "hassan@example.com", type: "top_up", amount: 50000, date: "2026-01-25", status: "approved", description: "Wallet top-up", transferMedium: "bank_transfer" },
      { id: 702, investorName: "Hassan Ali", email: "hassan@example.com", type: "invest_lti", amount: 30000, date: "2026-02-08", status: "approved", description: "Long-term allocation" },
    ],
  },
];

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<InvestorWallet[]>(initialWallets);

  const pendingCount = useMemo(
    () => wallets.reduce((s, w) => s + w.transactions.filter((t) => t.status === "pending").length, 0),
    [wallets]
  );

  const getWalletBalance = useCallback(
    (email: string) => {
      const wallet = wallets.find((w) => w.email === email);
      return wallet?.balance ?? 0;
    },
    [wallets]
  );

  const requestTransaction = useCallback((investorId: number, amount: number, type: "top_up" | "withdraw", transferMedium: TransferMedium, attachment?: string) => {
    setWallets((prev) => {
      const wallet = prev.find((w) => w.id === investorId);
      if (!wallet) return prev;

      if (type === "withdraw" && wallet.balance < amount) {
        toast.error("Insufficient wallet balance for withdrawal.");
        return prev;
      }

      const tx: WalletTransaction = {
        id: Date.now(),
        investorName: wallet.investorName,
        email: wallet.email,
        type,
        amount,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
        description: type === "top_up" ? "Wallet top-up request" : "Wallet withdrawal request",
        transferMedium,
        attachment,
      };

      return prev.map((w) =>
        w.id === investorId ? { ...w, transactions: [...w.transactions, tx] } : w
      );
    });
    toast.success(`${type === "top_up" ? "Top-up" : "Withdrawal"} request submitted for approval.`);
  }, []);

  const approveTransaction = useCallback((walletId: number, txId: number) => {
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== walletId) return w;
        const tx = w.transactions.find((t) => t.id === txId);
        if (!tx || tx.status !== "pending") return w;
        const updatedTxs = w.transactions.map((t) => (t.id === txId ? { ...t, status: "approved" as WalletTransactionStatus } : t));
        let newBalance = w.balance;
        let newTopUps = w.totalTopUps;
        let newWithdrawals = w.totalWithdrawals;
        let newSpent = w.totalSpent;
        if (tx.type === "top_up") {
          newBalance += tx.amount;
          newTopUps += tx.amount;
        } else if (tx.type === "withdraw") {
          newBalance -= tx.amount;
          newWithdrawals += tx.amount;
        }
        return { ...w, transactions: updatedTxs, balance: newBalance, totalTopUps: newTopUps, totalWithdrawals: newWithdrawals, totalSpent: newSpent };
      })
    );
    toast.success("Transaction approved.");
  }, []);

  const rejectTransaction = useCallback((walletId: number, txId: number) => {
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== walletId) return w;
        const updatedTxs = w.transactions.map((t) => (t.id === txId ? { ...t, status: "rejected" as WalletTransactionStatus } : t));
        return { ...w, transactions: updatedTxs };
      })
    );
    toast("Transaction rejected.");
  }, []);

  const investFromWallet = useCallback((investorName: string, email: string, amount: number, type: "invest_lti" | "invest_sti", description: string) => {
    const wallet = wallets.find((w) => w.email === email);
    if (!wallet || wallet.balance < amount) {
      toast.error("Insufficient wallet balance.");
      return false;
    }
    const tx: WalletTransaction = {
      id: Date.now(),
      investorName,
      email,
      type,
      amount,
      date: new Date().toISOString().split("T")[0],
      status: "approved",
      description,
    };
    setWallets((prev) =>
      prev.map((w) =>
        w.email === email
          ? { ...w, balance: w.balance - amount, totalSpent: w.totalSpent + amount, transactions: [...w.transactions, tx] }
          : w
      )
    );
    return true;
  }, [wallets]);

  return (
    <WalletContext.Provider value={{ wallets, requestTransaction, approveTransaction, rejectTransaction, investFromWallet, getWalletBalance, pendingCount }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
