import { NavLink, useNavigate } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const investorNavItems = [
  { title: "My Wallet", path: "/investor/wallet", icon: Wallet },
  { title: "Long-Term Investment", path: "/investor/lti", icon: TrendingUp },
  { title: "Short-Term Investment", path: "/investor/sti", icon: BarChart3 },
];

function LogoutButton({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    onNavigate?.();
    navigate("/login");
  };
  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-sidebar-muted hover:text-primary-foreground hover:bg-primary/80 w-full"
    >
      <LogOut size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">Logout</span>}
    </button>
  );
}

function InvestorSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 py-3 space-y-0.5 px-2">
      {investorNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground font-medium"
                : "text-sidebar-muted hover:text-primary-foreground hover:bg-primary/80"
            }`
          }
        >
          <item.icon size={18} className="shrink-0" />
          <span className="truncate">{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function MobileInvestorSidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 rounded-md hover:bg-muted transition-colors text-foreground">
          <Menu size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
        <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
          <span className="text-sm font-bold tracking-tight">InvestFarm</span>
        </div>
        <InvestorSidebarNav onNavigate={() => setOpen(false)} />
        <div className="p-2 border-t border-sidebar-border">
          <LogoutButton onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function InvestorSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border bg-primary-foreground text-primary">
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight truncate">InvestFarm</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-primary/80 hover:text-primary-foreground text-sidebar-muted transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto bg-primary-foreground text-muted-foreground">
        {investorNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-sidebar-muted hover:text-primary-foreground hover:bg-primary/80"
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border shrink-0 bg-primary-foreground mt-auto">
        <LogoutButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
