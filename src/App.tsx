import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { FinancialProvider } from "./contexts/FinancialContext";
import { WalletProvider } from "./contexts/WalletContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Overview from "./pages/Overview";
import Expenses from "./pages/Expenses";
import Clients from "./pages/Clients";
import Investors from "./pages/Investors";
import ShortTermInvestment from "./pages/ShortTermInvestment";
import Admins from "./pages/Admins";
import InvestorUsers from "./pages/InvestorUsers";
import Wallet from "./pages/Wallet";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FinancialProvider>
        <WalletProvider>
          <NotificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
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
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
          </NotificationProvider>
        </WalletProvider>
      </FinancialProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
