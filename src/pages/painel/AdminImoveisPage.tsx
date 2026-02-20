import { useState } from "react";
import { AdminPropertiesList } from "@/components/painel/admin/AdminPropertiesList";
import { AdminPropertyForm } from "@/components/painel/admin/AdminPropertyForm";

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
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Imóveis</h1>
        <p className="text-sm text-muted-foreground mt-1">Imóveis com investidores vinculados</p>
      </div>
      <AdminPropertiesList onEdit={handleEdit} />
    </div>
  );
}
