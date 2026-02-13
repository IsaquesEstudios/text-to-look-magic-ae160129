import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";
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
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to="/pt">
              <img src={discoveryLogo} alt="Discovery" className="h-8" />
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <span className="hidden sm:block text-sm text-muted-foreground">
              {isAdmin ? "Painel Admin" : "Meus Investimentos"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.full_name || user?.email}
            </span>
            <Link to="/pt">
              <Button variant="ghost" size="icon">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
