import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Users,
  TrendingUp,
  ToggleLeft,
  FileText,
  UsersRound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { title: "Overview", path: "/", icon: LayoutDashboard },
  { title: "Expense Ledger", path: "/expenses", icon: Receipt },
  { title: "Client Tracker", path: "/clients", icon: TrendingUp },
  { title: "Long-Term Investment", path: "/long-term-investment", icon: Users },
  { title: "Short-Term Investment", path: "/short-term-investment", icon: TrendingUp },
  { title: "Distribution", path: "/distribution", icon: ToggleLeft },
  { title: "Invoice Vault", path: "/invoices", icon: FileText },
  { title: "Users", path: "/users", icon: UsersRound },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight truncate">
            InvestFarm
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-sidebar-hover text-sidebar-muted transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-active text-sidebar-active-foreground font-medium"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover"
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <p className="text-xs text-sidebar-muted">v1.0 · Admin Panel</p>
        )}
      </div>
    </aside>
  );
}
