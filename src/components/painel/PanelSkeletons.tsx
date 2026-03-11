import { Skeleton } from "@/components/ui/skeleton";

/** Dashboard do usuário: greeting + 4 KPI cards + property cards + histórico */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 rounded-lg" />
        <Skeleton className="h-4 w-36 rounded-md" />
      </div>
      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-2xl" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40 rounded-md" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <Skeleton className="h-[72px] rounded-2xl" />
          <Skeleton className="h-[72px] rounded-2xl" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

/** Admin Dashboard: title + 5 stat cards + 2 side-by-side cards */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36 rounded-lg" />
        <Skeleton className="h-4 w-44 rounded-md" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

/** Leilões: título + accordion cards */
export function AuctionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40 rounded-lg" />
        <Skeleton className="h-4 w-52 rounded-md" />
      </div>
      <Skeleton className="h-5 w-44 rounded-md" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Meus Projetos: título + tabs + KPI cards + property grid */
export function PropertiesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>
      <Skeleton className="h-10 w-56 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

/** Extrato: título + saldo + info box + lista de transações */
export function StatementSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Comprovantes: título + tabs + grid de imagens */
export function ReceiptsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44 rounded-lg" />
        <Skeleton className="h-4 w-56 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Contratos: título + lista de cards */
export function ContractsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Informações (Profile): título + cards com formulários */
export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48 rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}

/** Property detail: subnav + gallery + info */
export function PropertyDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-10 w-80 rounded-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

/** Novidades / Gastos de propriedade */
export function PropertySubPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-10 w-80 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Admin: lista de usuários / propriedades / atividades / config */
export function AdminListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44 rounded-lg" />
        <Skeleton className="h-4 w-52 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Leilão detail page */
export function AuctionDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-20 rounded-md" />
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

/** Fallback genérico */
export function GenericPanelSkeleton() {
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
