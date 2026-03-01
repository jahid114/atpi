import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

export interface Client {
  id: number;
  name: string;
  description?: string;
  status: "active" | "completed" | "inactive";
  createdAt: string;
}

export interface ClientTransaction {
  id: number;
  clientId: number;
  type: "investment" | "profit_receive" | "principal_return";
  amount: number;
  date: string;
  description: string;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
}

interface FinancialContextType {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  clientTransactions: ClientTransaction[];
  setClientTransactions: React.Dispatch<React.SetStateAction<ClientTransaction[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

const initialClients: Client[] = [
  { id: 1, name: "Apex Ventures", description: "Tech growth fund", status: "active", createdAt: "2025-06-01" },
  { id: 2, name: "BlueStone Capital", description: "Real estate fund", status: "active", createdAt: "2025-07-15" },
  { id: 3, name: "Crestline Holdings", description: "Diversified portfolio", status: "completed", createdAt: "2025-04-10" },
  { id: 4, name: "Delta Equity Group", description: "Private equity", status: "active", createdAt: "2025-09-01" },
  { id: 5, name: "Evergreen Fund", description: "Sustainable investments", status: "completed", createdAt: "2025-05-20" },
  { id: 6, name: "Falcon Capital", description: "Venture capital fund", status: "active", createdAt: "2025-10-15" },
  { id: 7, name: "Golden Bridge Partners", description: "Infrastructure investments", status: "active", createdAt: "2025-11-01" },
  { id: 8, name: "Horizon Wealth", description: "Wealth management fund", status: "active", createdAt: "2025-12-05" },
  { id: 9, name: "Ironclad Investments", description: "Fixed income portfolio", status: "completed", createdAt: "2025-03-18" },
  { id: 10, name: "Jupiter Growth", description: "High-growth equity fund", status: "active", createdAt: "2026-01-10" },
  { id: 11, name: "Keystone Ventures", description: "Early-stage startups", status: "inactive", createdAt: "2025-08-22" },
];

const initialTransactions: ClientTransaction[] = [
  { id: 1, clientId: 1, type: "investment", amount: 500000, date: "2025-06-01", description: "Initial capital deployment" },
  { id: 2, clientId: 1, type: "profit_receive", amount: 62000, date: "2026-01-15", description: "Q4 profit distribution" },
  { id: 3, clientId: 2, type: "investment", amount: 750000, date: "2025-07-15", description: "Property acquisition fund" },
  { id: 4, clientId: 3, type: "investment", amount: 320000, date: "2025-04-10", description: "Mixed asset deployment" },
  { id: 5, clientId: 3, type: "profit_receive", amount: 41000, date: "2025-12-20", description: "Annual returns" },
  { id: 6, clientId: 3, type: "principal_return", amount: 320000, date: "2026-01-30", description: "Full principal returned" },
  { id: 7, clientId: 4, type: "investment", amount: 1200000, date: "2025-09-01", description: "Series B co-investment" },
  { id: 8, clientId: 5, type: "investment", amount: 450000, date: "2025-05-20", description: "Green energy fund" },
  { id: 9, clientId: 5, type: "profit_receive", amount: 58000, date: "2026-02-01", description: "Dividend payout" },
  { id: 10, clientId: 6, type: "investment", amount: 680000, date: "2025-10-15", description: "Series A round participation" },
  { id: 11, clientId: 6, type: "profit_receive", amount: 45000, date: "2026-02-10", description: "Q1 dividend" },
  { id: 12, clientId: 7, type: "investment", amount: 950000, date: "2025-11-01", description: "Bridge financing" },
  { id: 13, clientId: 8, type: "investment", amount: 400000, date: "2025-12-05", description: "Portfolio allocation" },
  { id: 14, clientId: 9, type: "investment", amount: 280000, date: "2025-03-18", description: "Bond fund allocation" },
  { id: 15, clientId: 9, type: "profit_receive", amount: 22000, date: "2025-09-18", description: "Semi-annual coupon" },
  { id: 16, clientId: 9, type: "principal_return", amount: 280000, date: "2026-01-18", description: "Maturity principal return" },
  { id: 17, clientId: 10, type: "investment", amount: 850000, date: "2026-01-10", description: "Growth equity deployment" },
  { id: 18, clientId: 2, type: "profit_receive", amount: 55000, date: "2026-02-15", description: "Rental income distribution" },
];

const initialExpenses: Expense[] = [
  { id: 1, date: "2026-02-01", category: "Salary", description: "January payroll", amount: 85000 },
  { id: 2, date: "2026-02-03", category: "Rent", description: "Office lease Q1", amount: 12000 },
  { id: 3, date: "2026-02-05", category: "Utilities", description: "Internet + Power", amount: 2400 },
  { id: 4, date: "2026-02-10", category: "Software", description: "SaaS subscriptions", amount: 4500 },
  { id: 5, date: "2026-02-12", category: "Legal", description: "Compliance review", amount: 8000 },
  { id: 6, date: "2026-01-15", category: "Salary", description: "December payroll", amount: 85000 },
  { id: 7, date: "2026-01-18", category: "Travel", description: "Client meetings - Dubai", amount: 6500 },
  { id: 8, date: "2026-01-22", category: "Marketing", description: "Q1 digital campaigns", amount: 15000 },
  { id: 9, date: "2026-01-28", category: "Insurance", description: "Annual business insurance", amount: 9200 },
  { id: 10, date: "2026-02-15", category: "Office Supplies", description: "Equipment & furniture", amount: 3800 },
  { id: 11, date: "2026-02-18", category: "Software", description: "Analytics platform license", amount: 7200 },
  { id: 12, date: "2026-02-20", category: "Legal", description: "Contract drafting services", amount: 5500 },
];

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [clientTransactions, setClientTransactions] = useState<ClientTransaction[]>(initialTransactions);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const grossProfit = useMemo(
    () => clientTransactions.filter((t) => t.type === "profit_receive").reduce((s, t) => s + t.amount, 0),
    [clientTransactions]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  const netProfit = useMemo(() => grossProfit - totalExpenses, [grossProfit, totalExpenses]);

  return (
    <FinancialContext.Provider
      value={{ clients, setClients, clientTransactions, setClientTransactions, expenses, setExpenses, grossProfit, totalExpenses, netProfit }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error("useFinancial must be used within FinancialProvider");
  return ctx;
}
