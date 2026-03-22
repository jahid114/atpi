import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, UserPlus, ArrowLeftRight, DollarSign } from "lucide-react";
import { LTIOverviewTab } from "@/components/long-term/LTIOverviewTab";
import { LTIRequestsTab } from "@/components/long-term/LTIRequestsTab";
import { LTITransactionsTab } from "@/components/long-term/LTITransactionsTab";
import { LTIProfitShareTab } from "@/components/long-term/LTIProfitShareTab";
import { YearSelector } from "@/components/YearSelector";
import { useLTI } from "@/contexts/LTIContext";

export default function Investors() {
  const {
    investors, profit, selectedYear, setSelectedYear,
    handleRelease, handleApprove, handleReject, handleRegister,
    handleUpdateInvestment, handleWithdraw, handleAddTransaction,
  } = useLTI();

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
