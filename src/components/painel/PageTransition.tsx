import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useRef } from "react";
import {
  DashboardSkeleton,
  AuctionsSkeleton,
  PropertiesSkeleton,
  StatementSkeleton,
  PropertyDetailSkeleton,
  PropertySubPageSkeleton,
  AdminListSkeleton,
  AuctionDetailSkeleton,
  ReceiptsSkeleton,
  ContractsSkeleton,
  ProfileSkeleton,
  GenericPanelSkeleton,
} from "./PanelSkeletons";

function getSkeletonForPath(path: string) {
  if (path === "/painel") return <DashboardSkeleton />;
  if (path.includes("/leiloes-user") || path.includes("/leiloes")) return <AuctionsSkeleton />;
  if (path.includes("/meus-projetos")) return <PropertiesSkeleton />;
  if (path.includes("/extrato")) return <StatementSkeleton />;
  if (path.includes("/novidades") || path.includes("/gastos")) return <PropertySubPageSkeleton />;
  if (path.includes("/imovel/")) return <PropertyDetailSkeleton />;
  if (path.includes("/leilao/")) return <AuctionDetailSkeleton />;
  if (path.includes("/comprovantes")) return <ReceiptsSkeleton />;
  if (path.includes("/contratos")) return <ContractsSkeleton />;
  if (path.includes("/informacoes") || path.includes("/usuarios/")) return <ProfileSkeleton />;
  if (path.includes("/usuarios") || path.includes("/propriedades") || path.includes("/atividades") || path.includes("/configuracoes")) return <AdminListSkeleton />;
  return <GenericPanelSkeleton />;
}

export function PageTransition({
  children,
  isNavigating = false,
}: {
  children: React.ReactNode;
  isNavigating?: boolean;
}) {
  const location = useLocation();
  const visitedPages = useRef(new Set<string>());

  // Mark current page as visited once it renders content
  if (!isNavigating) {
    visitedPages.current.add(location.pathname);
  }

  // Only show skeleton if navigating AND the target page hasn't been visited yet
  if (isNavigating && !visitedPages.current.has(location.pathname)) {
    return getSkeletonForPath(location.pathname);
  }

  return (
    <motion.div
      key={location.pathname}
      initial={visitedPages.current.has(location.pathname) ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
