import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="section-graphite border-t border-border/30 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-discovery-green/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-discovery-green rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-xl">D</span>
              </div>
              <div>
                <span className="text-foreground font-semibold">Discovery</span>
                <span className="text-discovery-green font-semibold"> Investments</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sua ponte estratégica para o mercado imobiliário americano. Dolarize seu patrimônio com segurança.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Navegação</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/" className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">Início</Link>
              <Link to="/terrenos" className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">Investimento em Terrenos</Link>
              <Link to="/casas" className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">Investimento em Casas</Link>
              <Link to="/sobre" className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">Sobre Nós</Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Modalidades</h4>
            <nav className="flex flex-col gap-3">
              <span className="text-muted-foreground text-sm">Compra Individual de Terrenos</span>
              <span className="text-muted-foreground text-sm">Compra Individual de Casas</span>
              <span className="text-muted-foreground text-sm">Venda de Cotas</span>
              <span className="text-muted-foreground text-sm">Membership Anual</span>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Contato</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-lg bg-discovery-green/10 flex items-center justify-center">
                  <MessageCircle size={16} className="text-discovery-green" />
                </div>
                <span>WhatsApp de Triagem</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-lg bg-discovery-green/10 flex items-center justify-center">
                  <Mail size={16} className="text-discovery-green" />
                </div>
                <span>contato@discovery.com</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-lg bg-discovery-green/10 flex items-center justify-center">
                  <MapPin size={16} className="text-discovery-green" />
                </div>
                <span>Estados Unidos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">© 2025 Discovery Investments. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Em parceria com</span>
            <span className="text-discovery-green font-medium">Tababog Construction</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
