import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNews } from "@/hooks/useUnreadNews";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Shield, LayoutDashboard, PieChart, Building2, Receipt, History, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import discoveryLogo from "@/assets/discovery-logo.png";
import { useEffect } from "react";

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/painel" },
  { label: "Imóveis", icon: Building2, path: "/painel/imoveis" },
  { label: "Usuários", icon: Shield, path: "/painel/usuarios" },
  { label: "Atividades", icon: History, path: "/painel/atividades" },
];

const userNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/painel" },
  { label: "Minhas Cotas", icon: PieChart, path: "/painel/cotas" },
  { label: "Oportunidades", icon: Building2, path: "/painel/oportunidades" },
  { label: "Extrato", icon: Receipt, path: "/painel/extrato" },
];

/**
 * Route-level layout for /painel/*.
 * Renders once and stays mounted across child navigations via <Outlet />.
 * Handles auth guard so child pages don't need to.
 */
export function PainelLayout() {
  const { user, isAdmin, isLoading, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const totalUnread = useUnreadNews();

  // Auth guard — redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, user, navigate]);

  // Full-screen loader while auth is resolving
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <Link to="/pt" className="flex items-center gap-3 group">
              <img src={discoveryLogo} alt="Discovery" className="h-7 group-hover:opacity-80 transition-opacity" />
            </Link>
            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground/40">
              /
            </span>
            <span className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
              {isAdmin && <Shield className="h-3.5 w-3.5 text-primary" />}
              {isAdmin ? "Admin" : "Investidor"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2 hidden sm:block">
              {profile?.full_name || user?.email}
            </span>
            <Link to="/pt">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-border/20 bg-card/30 flex-col min-h-[calc(100vh-3.5rem)] sticky top-14">
          <nav className="flex-1 p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const showBadge = !isAdmin && item.path === "/painel" && totalUnread > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                  {showBadge && (
                    <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center">
                      {totalUnread > 9 ? "+9" : totalUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/30 bg-background/95 backdrop-blur-xl">
          <nav className="flex items-center justify-around h-14 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const showBadge = !isAdmin && item.path === "/painel" && totalUnread > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                  {showBadge && (
                    <span className="absolute -top-1 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {totalUnread > 9 ? "+9" : totalUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main content — child routes render here */}
        <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
