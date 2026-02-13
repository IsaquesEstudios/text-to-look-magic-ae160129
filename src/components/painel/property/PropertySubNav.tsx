import { Link } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, MessageSquare, Receipt } from "lucide-react";

interface Props {
  propertyId: string;
  propertyTitle: string;
  active: "overview" | "novidades" | "gastos";
}

const navItems = [
  { key: "overview" as const, label: "Visão Geral", icon: LayoutDashboard, path: "" },
  { key: "novidades" as const, label: "Novidades", icon: MessageSquare, path: "/novidades" },
  { key: "gastos" as const, label: "Gastos", icon: Receipt, path: "/gastos" },
];

export function PropertySubNav({ propertyId, propertyTitle, active }: Props) {
  const basePath = `/painel/imovel/${propertyId}`;

  return (
    <div className="space-y-4">
      <Link
        to="/painel"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        {propertyTitle}
      </h1>

      <nav className="flex gap-1 p-1 rounded-xl bg-secondary/50 w-fit">
        {navItems.map((item) => (
          <Link
            key={item.key}
            to={`${basePath}${item.path}`}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === item.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
