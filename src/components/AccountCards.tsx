import { Landmark, Smartphone, Plus, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BankAccount, MobileBankingAccount } from "@/types/accounts";
import { providerColors } from "@/types/accounts";

interface AccountCardsProps {
  bankAccount: BankAccount | null;
  mobileAccounts: MobileBankingAccount[];
  onAddBank?: () => void;
  onAddMobile?: () => void;
  onRemoveBank?: () => void;
  onRemoveMobile?: (id: number) => void;
  readOnly?: boolean;
}

export function AccountCards({ bankAccount, mobileAccounts, onAddBank, onAddMobile, onRemoveBank, onRemoveMobile, readOnly = false }: AccountCardsProps) {
  const maskNumber = (num: string) => {
    if (num.length <= 4) return num;
    return "•••• " + num.slice(-4);
  };

  return (
    <div className="space-y-4">
      {/* Bank Account */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" /> Bank Account
          </h4>
          {!readOnly && !bankAccount && onAddBank && (
            <Button variant="outline" size="sm" onClick={onAddBank} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add Bank
            </Button>
          )}
        </div>
        {bankAccount ? (
          <div className="relative rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 p-5 text-white shadow-lg overflow-hidden max-w-sm">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <CreditCard className="h-7 w-7 text-white/80" />
                {!readOnly && onRemoveBank && (
                  <button onClick={onRemoveBank} className="text-white/50 hover:text-white/80 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-lg font-mono tracking-widest">{maskNumber(bankAccount.accountNumber)}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Account Holder</p>
                  <p className="text-sm font-medium">{bankAccount.accountName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Bank</p>
                  <p className="text-sm font-medium">{bankAccount.bankName}</p>
                </div>
              </div>
              <div className="flex gap-6 text-[10px] text-white/40">
                <span>Branch: {bankAccount.branchName}</span>
                {bankAccount.routingNumber && <span>Routing: {bankAccount.routingNumber}</span>}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No bank account added.</p>
        )}
      </div>

      {/* Mobile Banking Accounts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" /> Mobile Banking
          </h4>
          {!readOnly && onAddMobile && (
            <Button variant="outline" size="sm" onClick={onAddMobile} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add Mobile
            </Button>
          )}
        </div>
        {mobileAccounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mobileAccounts.map((acc) => {
              const colors = providerColors[acc.provider] || providerColors.Other;
              return (
                <div key={acc.id} className={`relative rounded-xl bg-gradient-to-br ${colors.bg} p-4 text-white shadow-md overflow-hidden`}>
                  <div className={`absolute -top-4 -right-4 h-16 w-16 rounded-full ${colors.accent}`} />
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider bg-white/20 rounded-full px-2.5 py-0.5">
                        {acc.provider}
                      </span>
                      {!readOnly && onRemoveMobile && (
                        <button onClick={() => onRemoveMobile(acc.id)} className="text-white/50 hover:text-white/80 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-base font-mono tracking-wider">{acc.accountNumber}</p>
                    <p className="text-xs text-white/70">{acc.accountName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No mobile banking accounts added.</p>
        )}
      </div>
    </div>
  );
}
