import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "react-router-dom";

function PanelSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

export function PageTransition({
  children,
  isNavigating = false,
}: {
  children: React.ReactNode;
  isNavigating?: boolean;
}) {
  const location = useLocation();

  if (isNavigating) {
    return <PanelSkeleton />;
  }

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
