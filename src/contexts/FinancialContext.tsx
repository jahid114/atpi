import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

export interface Client {
  id: number;
  name: string;
  invested: number;
  expectedReturn: string;
  actualReturn: number | null;
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
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

const initialClients: Client[] = [
  { id: 1, name: "Apex Ventures", invested: 500000, expectedReturn: "2026-06-15", actualReturn: 62000 },
  { id: 2, name: "BlueStone Capital", invested: 750000, expectedReturn: "2026-04-01", actualReturn: null },
  { id: 3, name: "Crestline Holdings", invested: 320000, expectedReturn: "2026-08-30", actualReturn: 41000 },
  { id: 4, name: "Delta Equity Group", invested: 1200000, expectedReturn: "2026-05-20", actualReturn: null },
  { id: 5, name: "Evergreen Fund", invested: 450000, expectedReturn: "2026-03-10", actualReturn: 58000 },
];

const initialExpenses: Expense[] = [
  { id: 1, date: "2026-02-01", category: "Salary", description: "January payroll", amount: 85000 },
  { id: 2, date: "2026-02-03", category: "Rent", description: "Office lease Q1", amount: 12000 },
  { id: 3, date: "2026-02-05", category: "Utilities", description: "Internet + Power", amount: 2400 },
  { id: 4, date: "2026-02-10", category: "Software", description: "SaaS subscriptions", amount: 4500 },
  { id: 5, date: "2026-02-12", category: "Legal", description: "Compliance review", amount: 8000 },
];

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const grossProfit = useMemo(
    () => clients.reduce((s, c) => s + (c.actualReturn ?? 0), 0),
    [clients]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  const netProfit = useMemo(() => grossProfit - totalExpenses, [grossProfit, totalExpenses]);

  return (
    <FinancialContext.Provider
      value={{ clients, setClients, expenses, setExpenses, grossProfit, totalExpenses, netProfit }}
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
