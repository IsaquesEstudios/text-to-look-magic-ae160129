import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, MessageSquare, Receipt } from "lucide-react";
import { usePropertyUnreadCounts } from "@/hooks/usePropertyUnreadCounts";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  propertyId: string;
  propertyTitle: string;
  active: "overview" | "novidades" | "gastos";
  hasShares?: boolean;
}

const navItems = [
  { key: "overview" as const, label: "Visão Geral", icon: LayoutDashboard, path: "", restricted: false, badgeKey: null },
  { key: "novidades" as const, label: "Novidades", icon: MessageSquare, path: "/novidades", restricted: true, badgeKey: "novidades" as const },
  { key: "gastos" as const, label: "Gastos", icon: Receipt, path: "/gastos", restricted: true, badgeKey: "gastos" as const },
];

export function PropertySubNav({ propertyId, propertyTitle, active, hasShares }: Props) {
  const basePath = `/painel/imovel/${propertyId}`;
  const { data: unread } = usePropertyUnreadCounts(propertyId);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if there's meaningful history within our app to go back to
    if (window.history.length > 1 && document.referrer) {
      navigate(-1);
    } else {
      navigate("/painel");
    }
  };

  const showRestricted = isAdmin || !!hasShares;
  const visibleItems = navItems.filter((item) => !item.restricted || showRestricted);

  return (
    <div className="space-y-4">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        {propertyTitle}
      </h1>

      <nav className="flex gap-1 p-1 rounded-xl bg-secondary/50 w-fit">
        {visibleItems.map((item) => {
          const count = item.badgeKey && unread ? unread[item.badgeKey] : 0;
          return (
            <Link
              key={item.key}
              to={`${basePath}${item.path}`}
              className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active === item.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {count > 0 && (
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  item.badgeKey === "gastos"
                    ? "bg-amber-500 text-white"
                    : "bg-destructive text-destructive-foreground"
                }`}>
                  {count > 9 ? "+9" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
