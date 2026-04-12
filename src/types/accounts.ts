export interface BankAccount {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  routingNumber: string;
}

export interface MobileBankingAccount {
  id: number;
  provider: "bKash" | "Nagad" | "Rocket" | "Upay" | "Other";
  accountNumber: string;
  accountName: string;
}

export const mobileBankingProviders = ["bKash", "Nagad", "Rocket", "Upay", "Other"] as const;

export const providerColors: Record<string, { bg: string; text: string; accent: string }> = {
  bKash: { bg: "from-pink-600 to-pink-800", text: "text-white", accent: "bg-pink-400/30" },
  Nagad: { bg: "from-orange-500 to-orange-700", text: "text-white", accent: "bg-orange-400/30" },
  Rocket: { bg: "from-purple-600 to-purple-800", text: "text-white", accent: "bg-purple-400/30" },
  Upay: { bg: "from-green-500 to-green-700", text: "text-white", accent: "bg-green-400/30" },
  Other: { bg: "from-slate-600 to-slate-800", text: "text-white", accent: "bg-slate-400/30" },
};
