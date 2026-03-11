import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

function PanelSkeleton() {
  return (
    <div className="space-y-4">
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
  const prevPath = useRef(location.pathname);
  const [phase, setPhase] = useState<"content" | "skeleton">("content");
  const [renderedChildren, setRenderedChildren] = useState(children);
  const [animKey, setAnimKey] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      // Immediately show skeleton
      setPhase("skeleton");
      // Short delay then show new content with animation
      const timer = setTimeout(() => {
        setRenderedChildren(children);
        setAnimKey(location.pathname);
        setPhase("content");
      }, 120);
      return () => clearTimeout(timer);
    } else {
      // Same path, just update children (e.g. data loaded)
      setRenderedChildren(children);
    }
  }, [location.pathname, children]);

  if (phase === "skeleton") {
    return <PanelSkeleton />;
  }

  return (
    <motion.div
      key={animKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {renderedChildren}
    </motion.div>
  );
}
