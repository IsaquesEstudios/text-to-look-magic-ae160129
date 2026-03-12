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
import { PageTransition } from "./PageTransition";
import { cn } from "@/lib/utils";
import discoveryLogo from "@/assets/discovery-logo.png";
import { useEffect, useState, type MouseEvent } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, X } from "lucide-react";
import { PanelSearchBar } from "./PanelSearchBar";

export function PainelLayout() {
  const { user, isAdmin, isLoading, profile, signOut } = useAuth();
  const { p } = usePanelTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const totalUnread = useUnreadNews();
  const unreadAuctions = useUnreadAuctions();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isPanelNavigating, setIsPanelNavigating] = useState(false);

  const handlePanelNavigation = (
    event: MouseEvent<HTMLElement>,
    path: string,
    callback?: () => void,
  ) => {
    if (path === location.pathname || isPanelNavigating) {
      callback?.();
      return;
    }

    event.preventDefault();
    callback?.();
    setIsPanelNavigating(true);
    window.requestAnimationFrame(() => {
      navigate(path);
    });
  };

  const adminNavItems = [
    { label: p.dashboard, icon: LayoutDashboard, path: "/painel" },
    { label: p.auctions, icon: Gavel, path: "/painel/leiloes" },
    { label: p.properties, icon: Building2, path: "/painel/propriedades" },
    { label: "Contratos", icon: FileText, path: "/painel/contratos" },
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

  useEffect(() => {
    if (!isPanelNavigating) return;

    const resetTimer = window.setTimeout(() => {
      setIsPanelNavigating(false);
    }, 220);

    return () => window.clearTimeout(resetTimer);
  }, [location.pathname, isPanelNavigating]);

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
                  onClick={(event) => handlePanelNavigation(event, item.path)}
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
              <Link to={profilePath} onClick={(event) => handlePanelNavigation(event, profilePath)} className={cn(
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
        {(() => {
          const bottomItems = isAdmin
            ? navItems.slice(0, 4)
            : [
                navItems.find(i => i.path === "/painel")!,
                navItems.find(i => i.path === "/painel/leiloes-user")!,
                navItems.find(i => i.path === "/painel/meus-projetos")!,
                navItems.find(i => i.path === "/painel/extrato")!,
              ];
          const extraItems = [
            ...navItems.filter(i => !bottomItems.includes(i)),
            { label: p.profile, icon: UserCircle, path: profilePath },
          ];

          return (
            <>
              {/* More panel – full width, above bottom nav */}
              {moreOpen && (
                <div className="md:hidden fixed inset-0 z-30" onClick={() => setMoreOpen(false)}>
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
                </div>
              )}
              <div
                className={cn(
                  "md:hidden fixed inset-x-0 z-35 transition-transform duration-300 ease-out",
                  moreOpen ? "translate-y-0" : "translate-y-full"
                )}
                style={{ zIndex: 35 }}
              >
                <div className="bg-background border-t border-border/30 rounded-t-2xl shadow-2xl px-4 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-sm font-semibold text-foreground">Menu</span>
                    <button onClick={() => setMoreOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    {extraItems.map((item) => {
                      const isActive = item.path === profilePath
                        ? location.pathname === profilePath
                        : location.pathname.startsWith(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={(event) => handlePanelNavigation(event, item.path, () => setMoreOpen(false))}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all",
                            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          )}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="border-t border-border/20 mt-3 pt-3">
                    <button
                      onClick={() => { setMoreOpen(false); signOut(); }}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
                    >
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      {p.logout}
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/30 bg-background/95 backdrop-blur-xl">
                <nav className="flex items-center justify-evenly h-16 px-1 w-full" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                  {bottomItems.map((item) => {
                    const isActive = !moreOpen && (item.path === "/painel"
                      ? location.pathname === "/painel"
                      : location.pathname.startsWith(item.path) || (item.path === "/painel/meus-projetos" && location.pathname.startsWith("/painel/imovel/")));
                    const isAuctionLink = item.path === "/painel/leiloes-user" || item.path === "/painel/leiloes";
                    const showDashBadge = !isAdmin && item.path === "/painel" && totalUnread > 0;
                    const showAuctionBadge = isAuctionLink && unreadAuctions > 0;
                    const badgeCount = showDashBadge ? totalUnread : showAuctionBadge ? unreadAuctions : 0;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={(event) => handlePanelNavigation(event, item.path, () => setMoreOpen(false))}
                        className={cn(
                          "relative flex flex-col items-center gap-1 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 px-3",
                          "text-[10px]",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="truncate max-w-[60px] text-center">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className="absolute -top-0.5 right-0.5 min-w-[18px] h-[18px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                            {badgeCount > 9 ? "+9" : badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  <button
                    onClick={() => setMoreOpen(prev => !prev)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 px-3",
                      "text-[10px]",
                      moreOpen ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                    <span>Mais</span>
                  </button>
                </nav>
              </div>
            </>
          );
        })()}

        <main className="flex-1 min-w-0 w-full pb-20 md:pb-8 pt-10 md:pt-8 px-[4%] md:px-6 overflow-x-hidden">
          <PageTransition isNavigating={isPanelNavigating}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </TooltipProvider>
  );
}
