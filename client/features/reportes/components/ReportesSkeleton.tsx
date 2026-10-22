import { Skeleton } from "@/components/ui/skeleton";
export function ReportesSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando reporte">
      <div className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="min-w-0 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-full sm:w-96" />
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
