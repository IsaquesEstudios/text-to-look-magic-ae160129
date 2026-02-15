import { AdminUsersList } from "@/components/painel/admin/AdminUsersList";

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie os usuários cadastrados</p>
      </div>
      <AdminUsersList />
    </div>
  );
}
