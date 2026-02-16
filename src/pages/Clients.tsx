import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, ArrowLeftRight } from "lucide-react";
import { ClientOverviewTab } from "@/components/clients/ClientOverviewTab";
import { ClientListTab } from "@/components/clients/ClientListTab";
import { ClientTransactionsTab } from "@/components/clients/ClientTransactionsTab";
import { YearSelector } from "@/components/YearSelector";

export default function Clients() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Client Investment Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor deployed capital, returns, and transactions</p>
        </div>
        <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" /> Clients
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm">
            <ArrowLeftRight className="h-4 w-4" /> Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><ClientOverviewTab selectedYear={selectedYear} /></TabsContent>
        <TabsContent value="clients"><ClientListTab selectedYear={selectedYear} /></TabsContent>
        <TabsContent value="transactions"><ClientTransactionsTab selectedYear={selectedYear} /></TabsContent>
      </Tabs>
    </div>
  );
}
