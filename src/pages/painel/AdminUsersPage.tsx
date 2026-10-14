import { AdminUsersList } from "@/components/painel/admin/AdminUsersList";

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-normal">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie os usuários cadastrados</p>
      </div>
      <AdminUsersList />
    </div>
  );
}
