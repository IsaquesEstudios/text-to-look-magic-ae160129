import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
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

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [currentChildren, setCurrentChildren] = useState(children);
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== key) {
      setShowSkeleton(true);
      const timer = setTimeout(() => {
        setCurrentChildren(children);
        setKey(location.pathname);
        setShowSkeleton(false);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setCurrentChildren(children);
    }
  }, [location.pathname, children, key]);

  if (showSkeleton) {
    return <PanelSkeleton />;
  }

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {currentChildren}
    </motion.div>
  );
}
