import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import discoveryLogo from "@/assets/discovery-logo.png";

interface PainelLayoutProps {
  children: ReactNode;
}

export function PainelLayout({ children }: PainelLayoutProps) {
  const { user, isAdmin, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <Link to="/pt" className="flex items-center gap-3 group">
              <img src={discoveryLogo} alt="Discovery" className="h-7 group-hover:opacity-80 transition-opacity" />
            </Link>
            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60">
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

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
