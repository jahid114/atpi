import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { FinancialProvider } from "./contexts/FinancialContext";
import { WalletProvider } from "./contexts/WalletContext";
import Overview from "./pages/Overview";
import Expenses from "./pages/Expenses";
import Clients from "./pages/Clients";
import Investors from "./pages/Investors";
import ShortTermInvestment from "./pages/ShortTermInvestment";
import Admins from "./pages/Admins";
import InvestorUsers from "./pages/InvestorUsers";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FinancialProvider>
        <WalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/long-term-investment" element={<Investors />} />
                <Route path="/short-term-investment" element={<ShortTermInvestment />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/admins" element={<Admins />} />
                <Route path="/investor-users" element={<InvestorUsers />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DashboardLayout>
          </BrowserRouter>
        </WalletProvider>
      </FinancialProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
