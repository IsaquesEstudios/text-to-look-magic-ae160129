import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, PlusCircle } from "lucide-react";
import { AdminPropertiesList } from "./admin/AdminPropertiesList";
import { AdminPropertyForm } from "./admin/AdminPropertyForm";
import { AdminUsersList } from "./admin/AdminUsersList";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie imóveis, cotas e usuários
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2 rounded-xl h-10 px-5 font-medium"
        >
          <PlusCircle className="h-4 w-4" />
          Novo Imóvel
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 border-0 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="properties"
            className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-sm"
          >
            <Building2 className="h-4 w-4" />
            Imóveis
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-sm"
          >
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>
        <TabsContent value="properties" className="mt-6">
          <AdminPropertiesList onEdit={handleEdit} />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <AdminUsersList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
