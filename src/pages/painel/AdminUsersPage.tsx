import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { AdminUsersList } from "@/components/painel/admin/AdminUsersList";
import { Loader2 } from "lucide-react";

export default function AdminUsersPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/auth");
  }, [authLoading, user, isAdmin, navigate]);

  if (authLoading) {
    return (
      <PainelLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PainelLayout>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <PainelLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os usuários cadastrados</p>
        </div>
        <AdminUsersList />
      </div>
    </PainelLayout>
  );
}
