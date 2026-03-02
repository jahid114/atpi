import { ReactNode } from "react";
import { AppSidebar, MobileSidebarTrigger } from "./AppSidebar";
import { NotificationBell } from "./NotificationBell";
import { ProfileAvatar } from "./ProfileAvatar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Mobile header with hamburger */}
        <header className="md:hidden flex items-center h-14 px-4 border-b border-border bg-background sticky top-0 z-30">
          <MobileSidebarTrigger />
          <span className="ml-3 text-sm font-bold tracking-tight text-foreground">InvestFarm</span>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <ProfileAvatar />
          </div>
        </header>
        {/* Desktop header with notification bell */}
        <header className="hidden md:flex items-center justify-end h-14 px-6 border-b border-border bg-background sticky top-0 z-30 gap-2">
          <NotificationBell />
          <ProfileAvatar />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
