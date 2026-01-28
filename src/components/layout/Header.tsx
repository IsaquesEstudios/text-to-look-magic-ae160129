import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Início", path: "/" },
  { name: "Terrenos", path: "/terrenos" },
  { name: "Casas", path: "/casas" },
  { name: "Sobre Nós", path: "/sobre" },
  { name: "Contato", path: "/contato" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-discovery-green rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">D</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-foreground font-bold text-lg">Discovery</span>
              <span className="text-discovery-green font-bold text-lg"> Investments</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-discovery-green ${
                  location.pathname === item.path
                    ? "text-discovery-green"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Button variant="cta" size="default">
              Falar com Consultor
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border"
          >
            <nav className="container mx-auto px-6 py-6 flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium transition-colors hover:text-discovery-green ${
                    location.pathname === item.path
                      ? "text-discovery-green"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Button variant="cta" size="lg" className="mt-4">
                Falar com Consultor
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
