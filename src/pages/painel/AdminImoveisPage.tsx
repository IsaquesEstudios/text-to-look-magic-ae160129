import { useState } from "react";
import { AdminPropertiesList } from "@/components/painel/admin/AdminPropertiesList";
import { AdminPropertyForm } from "@/components/painel/admin/AdminPropertyForm";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function AdminImoveisPage() {
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
    return <AdminPropertyForm propertyId={editingPropertyId} onClose={handleFormClose} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Imóveis</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os imóveis cadastrados</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl h-10 px-5 font-medium">
          <PlusCircle className="h-4 w-4" />
          Novo Imóvel
        </Button>
      </div>
      <AdminPropertiesList onEdit={handleEdit} />
    </div>
  );
}
