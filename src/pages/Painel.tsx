import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "@/components/painel/AdminDashboard";
import { UserDashboard } from "@/components/painel/UserDashboard";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { Loader2 } from "lucide-react";

export default function Painel() {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <PainelLayout>
      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </PainelLayout>
  );
}
