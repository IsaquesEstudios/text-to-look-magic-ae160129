import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const investmentItems = [
  { name: "Terrenos", path: "/terrenos" },
  { name: "Casas", path: "/casas" },
];

const navItems = [
  { name: "Início", path: "/" },
  { name: "Investimentos", path: null, hasDropdown: true },
  { name: "Sobre Nós", path: "/sobre" },
  { name: "Contato", path: "/contato" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const isInvestmentActive = location.pathname === "/terrenos" || location.pathname === "/casas";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
      isScrolled 
        ? "bg-discovery-dark/95 backdrop-blur-lg border-border/30" 
        : "bg-discovery-dark/80 backdrop-blur-md border-transparent"
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-discovery-green rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-xl">D</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-foreground font-semibold text-lg">Discovery</span>
              <span className="text-discovery-green font-semibold text-lg"> Investments</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              item.hasDropdown ? (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button
                    className={`flex items-center gap-1 text-sm font-medium transition-all duration-300 hover:text-discovery-green ${
                      isInvestmentActive
                        ? "text-discovery-green"
                        : "text-foreground/70"
                    }`}
                  >
                    {item.name}
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-3"
                      >
                        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                          {investmentItems.map((subItem) => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`block px-5 py-3 text-sm font-medium transition-all duration-200 hover:bg-discovery-green/10 hover:text-discovery-green ${
                                location.pathname === subItem.path
                                  ? "text-discovery-green bg-discovery-green/5"
                                  : "text-foreground/80"
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path!}
                  className={`text-sm font-medium transition-all duration-300 hover:text-discovery-green ${
                    location.pathname === item.path
                      ? "text-discovery-green"
                      : "text-foreground/70"
                  }`}
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>

          <div className="hidden lg:block">
            <Button variant="cta" size="default">
              Falar com Consultor
            </Button>
          </div>

          <button
            className="lg:hidden text-foreground p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-discovery-dark/95 backdrop-blur-lg border-b border-border/30"
          >
            <nav className="container mx-auto px-6 py-6 flex flex-col gap-4">
              {navItems.map((item) => (
                item.hasDropdown ? (
                  <div key={item.name}>
                    <button
                      onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                      className={`flex items-center justify-between w-full text-lg font-medium transition-colors hover:text-discovery-green ${
                        isInvestmentActive
                          ? "text-discovery-green"
                          : "text-foreground/70"
                      }`}
                    >
                      {item.name}
                      <ChevronDown 
                        size={20} 
                        className={`transition-transform duration-300 ${isMobileDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isMobileDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pt-2 flex flex-col gap-2">
                            {investmentItems.map((subItem) => (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => {
                                  setIsOpen(false);
                                  setIsMobileDropdownOpen(false);
                                }}
                                className={`text-base font-medium transition-colors hover:text-discovery-green ${
                                  location.pathname === subItem.path
                                    ? "text-discovery-green"
                                    : "text-foreground/60"
                                }`}
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path!}
                    onClick={() => setIsOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-discovery-green ${
                      location.pathname === item.path
                        ? "text-discovery-green"
                        : "text-foreground/70"
                    }`}
                  >
                    {item.name}
                  </Link>
                )
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
