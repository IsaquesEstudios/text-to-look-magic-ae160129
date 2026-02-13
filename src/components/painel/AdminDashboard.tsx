import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, PlusCircle } from "lucide-react";
import { AdminPropertiesList } from "./admin/AdminPropertiesList";
import { AdminPropertyForm } from "./admin/AdminPropertyForm";
import { AdminUsersList } from "./admin/AdminUsersList";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("properties");
  const [showForm, setShowForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingPropertyId(id);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPropertyId(null);
  };

  if (showForm) {
    return (
      <AdminPropertyForm
        propertyId={editingPropertyId}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Novo Imóvel
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border/50">
          <TabsTrigger value="properties" className="gap-2">
            <Building2 className="h-4 w-4" />
            Imóveis
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>
        <TabsContent value="properties">
          <AdminPropertiesList onEdit={handleEdit} />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsersList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
