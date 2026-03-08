import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

export interface Client {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  nid?: string;
  attachment?: string;
  expectedRoi?: number;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface ClientTransaction {
  id: number;
  txId: string;
  clientId: number;
  type: "investment" | "profit_receive" | "principal_return" | "service_fee";
  amount: number;
  date: string;
  description: string;
  fromAccount?: string;
  toAccount?: string;
  attachment?: string;
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
  { id: 1, name: "Apex Ventures", address: "123 Tech Ave, Silicon Valley", phone: "+1-555-0101", nid: "NID-001", expectedRoi: 12, description: "Tech growth fund", status: "active", createdAt: "2025-06-01" },
  { id: 2, name: "BlueStone Capital", address: "456 Stone Rd, New York", phone: "+1-555-0102", nid: "NID-002", expectedRoi: 10, description: "Real estate fund", status: "active", createdAt: "2025-07-15" },
  { id: 3, name: "Crestline Holdings", address: "789 Crest Blvd, Chicago", phone: "+1-555-0103", nid: "NID-003", expectedRoi: 8, description: "Diversified portfolio", status: "completed", createdAt: "2025-04-10" },
  { id: 4, name: "Delta Equity Group", address: "321 Delta Dr, Boston", phone: "+1-555-0104", nid: "NID-004", expectedRoi: 15, description: "Private equity", status: "active", createdAt: "2025-09-01" },
  { id: 5, name: "Evergreen Fund", address: "654 Green Way, Portland", phone: "+1-555-0105", nid: "NID-005", expectedRoi: 9, description: "Sustainable investments", status: "completed", createdAt: "2025-05-20" },
  { id: 6, name: "Falcon Capital", address: "987 Falcon St, Austin", phone: "+1-555-0106", nid: "NID-006", expectedRoi: 14, description: "Venture capital fund", status: "active", createdAt: "2025-10-15" },
  { id: 7, name: "Golden Bridge Partners", address: "147 Bridge Ave, Seattle", phone: "+1-555-0107", nid: "NID-007", expectedRoi: 11, description: "Infrastructure investments", status: "active", createdAt: "2025-11-01" },
  { id: 8, name: "Horizon Wealth", address: "258 Horizon Pl, Miami", phone: "+1-555-0108", nid: "NID-008", expectedRoi: 10, description: "Wealth management fund", status: "active", createdAt: "2025-12-05" },
  { id: 9, name: "Ironclad Investments", address: "369 Iron Rd, Denver", phone: "+1-555-0109", nid: "NID-009", expectedRoi: 7, description: "Fixed income portfolio", status: "completed", createdAt: "2025-03-18" },
  { id: 10, name: "Jupiter Growth", address: "741 Jupiter Ln, Dallas", phone: "+1-555-0110", nid: "NID-010", expectedRoi: 18, description: "High-growth equity fund", status: "active", createdAt: "2026-01-10" },
  { id: 11, name: "Keystone Ventures", address: "852 Key Ave, Phoenix", phone: "+1-555-0111", nid: "NID-011", expectedRoi: 13, description: "Early-stage startups", status: "inactive", createdAt: "2025-08-22" },
];

export const generateTxId = () => `TXN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

const initialTransactions: ClientTransaction[] = [
  { id: 1, txId: "TXN-A1B2C3D4", clientId: 1, type: "investment", amount: 500000, date: "2025-06-01", description: "Initial capital deployment", fromAccount: "Company Main", toAccount: "Apex Ventures" },
  { id: 2, txId: "TXN-E5F6G7H8", clientId: 1, type: "profit_receive", amount: 62000, date: "2026-01-15", description: "Q4 profit distribution", fromAccount: "Apex Ventures", toAccount: "Company Main" },
  { id: 3, txId: "TXN-I9J0K1L2", clientId: 2, type: "investment", amount: 750000, date: "2025-07-15", description: "Property acquisition fund", fromAccount: "Company Main", toAccount: "BlueStone Capital" },
  { id: 4, txId: "TXN-M3N4O5P6", clientId: 3, type: "investment", amount: 320000, date: "2025-04-10", description: "Mixed asset deployment", fromAccount: "Company Main", toAccount: "Crestline Holdings" },
  { id: 5, txId: "TXN-Q7R8S9T0", clientId: 3, type: "profit_receive", amount: 41000, date: "2025-12-20", description: "Annual returns", fromAccount: "Crestline Holdings", toAccount: "Company Main" },
  { id: 6, txId: "TXN-U1V2W3X4", clientId: 3, type: "principal_return", amount: 320000, date: "2026-01-30", description: "Full principal returned", fromAccount: "Crestline Holdings", toAccount: "Company Main" },
  { id: 7, txId: "TXN-Y5Z6A7B8", clientId: 4, type: "investment", amount: 1200000, date: "2025-09-01", description: "Series B co-investment", fromAccount: "Company Main", toAccount: "Delta Equity Group" },
  { id: 8, txId: "TXN-C9D0E1F2", clientId: 5, type: "investment", amount: 450000, date: "2025-05-20", description: "Green energy fund", fromAccount: "Company Main", toAccount: "Evergreen Fund" },
  { id: 9, txId: "TXN-G3H4I5J6", clientId: 5, type: "profit_receive", amount: 58000, date: "2026-02-01", description: "Dividend payout", fromAccount: "Evergreen Fund", toAccount: "Company Main" },
  { id: 10, txId: "TXN-K7L8M9N0", clientId: 6, type: "investment", amount: 680000, date: "2025-10-15", description: "Series A round participation", fromAccount: "Company Main", toAccount: "Falcon Capital" },
  { id: 11, txId: "TXN-O1P2Q3R4", clientId: 6, type: "profit_receive", amount: 45000, date: "2026-02-10", description: "Q1 dividend", fromAccount: "Falcon Capital", toAccount: "Company Main" },
  { id: 12, txId: "TXN-S5T6U7V8", clientId: 7, type: "investment", amount: 950000, date: "2025-11-01", description: "Bridge financing", fromAccount: "Company Main", toAccount: "Golden Bridge Partners" },
  { id: 13, txId: "TXN-W9X0Y1Z2", clientId: 8, type: "investment", amount: 400000, date: "2025-12-05", description: "Portfolio allocation", fromAccount: "Company Main", toAccount: "Horizon Wealth" },
  { id: 14, txId: "TXN-A3B4C5D6", clientId: 9, type: "investment", amount: 280000, date: "2025-03-18", description: "Bond fund allocation", fromAccount: "Company Main", toAccount: "Ironclad Investments" },
  { id: 15, txId: "TXN-E7F8G9H0", clientId: 9, type: "profit_receive", amount: 22000, date: "2025-09-18", description: "Semi-annual coupon", fromAccount: "Ironclad Investments", toAccount: "Company Main" },
  { id: 16, txId: "TXN-I1J2K3L4", clientId: 9, type: "principal_return", amount: 280000, date: "2026-01-18", description: "Maturity principal return", fromAccount: "Ironclad Investments", toAccount: "Company Main" },
  { id: 17, txId: "TXN-M5N6O7P8", clientId: 10, type: "investment", amount: 850000, date: "2026-01-10", description: "Growth equity deployment", fromAccount: "Company Main", toAccount: "Jupiter Growth" },
  { id: 18, txId: "TXN-Q9R0S1T2", clientId: 2, type: "profit_receive", amount: 55000, date: "2026-02-15", description: "Rental income distribution", fromAccount: "BlueStone Capital", toAccount: "Company Main" },
  { id: 19, txId: "TXN-U3V4W5X6", clientId: 1, type: "service_fee", amount: 15000, date: "2026-01-20", description: "Management fee Q4", fromAccount: "Company Main", toAccount: "Service Provider" },
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
