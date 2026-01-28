import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="section-graphite border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-discovery-green rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">D</span>
              </div>
              <div>
                <span className="text-foreground font-bold">Discovery</span>
                <span className="text-discovery-green font-bold"> Investments</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sua ponte estratégica para o mercado imobiliário americano. Dolarize seu patrimônio com segurança.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Navegação</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">
                Início
              </Link>
              <Link to="/terrenos" className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">
                Investimento em Terrenos
              </Link>
              <Link to="/casas" className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">
                Investimento em Casas
              </Link>
              <Link to="/sobre" className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">
                Sobre Nós
              </Link>
            </nav>
          </div>

          {/* Modalities */}
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Modalidades</h4>
            <nav className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Compra Individual de Terrenos</span>
              <span className="text-muted-foreground text-sm">Compra Individual de Casas</span>
              <span className="text-muted-foreground text-sm">Venda de Cotas</span>
              <span className="text-muted-foreground text-sm">Membership Anual</span>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Contato</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <MessageCircle size={18} className="text-discovery-green" />
                <span>WhatsApp de Triagem</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail size={18} className="text-discovery-green" />
                <span>contato@discovery.com</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin size={18} className="text-discovery-green" />
                <span>Estados Unidos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2025 Discovery Investments. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Em parceria com</span>
            <span className="text-discovery-green font-semibold">Tababog Construction</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
