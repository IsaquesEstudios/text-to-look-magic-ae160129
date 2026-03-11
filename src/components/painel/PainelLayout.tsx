import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { useUnreadNews } from "@/hooks/useUnreadNews";
import { useUnreadAuctions } from "@/hooks/useUnreadAuctions";
import { Button } from "@/components/ui/button";
import {
  LogOut, Home, Shield, LayoutDashboard, Building2, Receipt,
  History, Loader2, Settings, Gavel, FileImage, UserCircle,
  PanelLeftClose, PanelLeft, FileText,
} from "lucide-react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import discoveryLogo from "@/assets/discovery-logo.png";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function PainelLayout() {
  const { user, isAdmin, isLoading, profile, signOut } = useAuth();
  const { p } = usePanelTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const totalUnread = useUnreadNews();
  const unreadAuctions = useUnreadAuctions();
  const [collapsed, setCollapsed] = useState(false);

  const adminNavItems = [
    { label: p.dashboard, icon: LayoutDashboard, path: "/painel" },
    { label: p.auctions, icon: Gavel, path: "/painel/leiloes" },
    { label: p.properties, icon: Building2, path: "/painel/propriedades" },
    { label: p.users, icon: Shield, path: "/painel/usuarios" },
    { label: p.activities, icon: History, path: "/painel/atividades" },
    { label: p.settings, icon: Settings, path: "/painel/configuracoes" },
  ];

  const userNavItems = [
    { label: p.dashboard, icon: LayoutDashboard, path: "/painel" },
    { label: p.auctions, icon: Gavel, path: "/painel/leiloes-user" },
    { label: p.myProjects, icon: Building2, path: "/painel/meus-projetos" },
    { label: p.statement, icon: Receipt, path: "/painel/extrato" },
    { label: p.receipts, icon: FileImage, path: "/painel/comprovantes" },
    { label: "Contratos", icon: FileText, path: "/painel/contratos" },
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = isAdmin ? adminNavItems : userNavItems;
  const userInitials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? "U").toUpperCase();

  const profilePath = isAdmin ? "/painel/usuarios" : "/painel/informacoes";
  const isProfileActive = location.pathname === "/painel/informacoes";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background flex">
        {/* ── Desktop Sidebar ── */}
        <aside
          className={cn(
            "hidden md:flex flex-col flex-shrink-0 border-r border-border/20 bg-card/30 min-h-screen sticky top-0 transition-all duration-300",
            collapsed ? "w-[68px]" : "w-56"
          )}
        >
          <div className={cn("flex items-center h-14 px-3 border-b border-border/20", collapsed ? "justify-center" : "justify-between")}>
            <Link to="/pt" className="flex items-center gap-2 group flex-shrink-0">
              <img src={discoveryLogo} alt="Discovery" className={cn("transition-all", collapsed ? "h-6" : "h-7")} />
            </Link>
            {!collapsed && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setCollapsed(true)}>
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
            {collapsed && (
              <div className="absolute -right-3 top-4 z-10">
                <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-full border-border/40 bg-background shadow-sm" onClick={() => setCollapsed(false)}>
                  <PanelLeft className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="px-4 py-2">
              <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground/50 flex items-center gap-1.5">
                {isAdmin && <Shield className="h-3 w-3 text-primary" />}
                {isAdmin ? "Admin" : p.investor}
              </span>
            </div>
          )}

          <nav className="flex-1 p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = item.path === "/painel"
                ? location.pathname === "/painel"
                : location.pathname.startsWith(item.path) || (item.path === "/painel/meus-projetos" && location.pathname.startsWith("/painel/imovel/"));
              const isAuctionLink = item.path === "/painel/leiloes-user" || item.path === "/painel/leiloes";
              const showDashBadge = !isAdmin && item.path === "/painel" && totalUnread > 0;
              const showAuctionBadge = isAuctionLink && unreadAuctions > 0;
              const badgeCount = showDashBadge ? totalUnread : showAuctionBadge ? unreadAuctions : 0;

              const linkContent = (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && item.label}
                  {!collapsed && badgeCount > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center">
                      {badgeCount > 9 ? "+9" : badgeCount}
                    </span>
                  )}
                  {collapsed && badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {badgeCount > 9 ? "+9" : badgeCount}
                    </span>
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>

          <div className={cn("border-t border-border/20 p-2 space-y-1", collapsed && "flex flex-col items-center")}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/pt" className="flex items-center justify-center px-2 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <Home className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{p.goToSite}</TooltipContent>
              </Tooltip>
            ) : (
              <Link to="/pt" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <Home className="h-4 w-4 flex-shrink-0" />
                {p.goToSite}
              </Link>
            )}

            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to={profilePath} className={cn(
                    "flex items-center justify-center px-2 py-2.5 rounded-xl transition-colors",
                    isProfileActive ? "bg-primary/10" : "hover:bg-secondary/50"
                  )}>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={cn("text-[10px] font-bold", isProfileActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {profile?.full_name || user?.email}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link to={profilePath} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isProfileActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className={cn("text-[9px] font-bold", isProfileActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{profile?.full_name || user?.email}</span>
              </Link>
            )}

            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    className="flex items-center justify-center px-2 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{p.logout}</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {p.logout}
              </button>
            )}
          </div>
        </aside>

        {/* ── Mobile bottom nav ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/30 bg-background/95 backdrop-blur-xl">
          <nav className="flex items-center justify-around h-14 px-2">
            {[...navItems, { label: p.profile, icon: UserCircle, path: profilePath }].map((item) => {
              const isActive = item.path === "/painel"
                ? location.pathname === "/painel"
                : location.pathname.startsWith(item.path) || (item.path === "/painel/meus-projetos" && location.pathname.startsWith("/painel/imovel/"));
              const isAuctionLink = item.path === "/painel/leiloes-user" || item.path === "/painel/leiloes";
              const showDashBadge = !isAdmin && item.path === "/painel" && totalUnread > 0;
              const showAuctionBadge = isAuctionLink && unreadAuctions > 0;
              const badgeCount = showDashBadge ? totalUnread : showAuctionBadge ? unreadAuctions : 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {badgeCount > 9 ? "+9" : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="flex-1 px-6 py-8 w-full pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
