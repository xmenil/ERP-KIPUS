import { Button } from '@/components/ui/button';

export function QueryError({ message, retry }: { message: string; retry: () => void }) {
  if (!message) return null;
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive bg-danger-soft p-4 text-sm text-danger-text">
    <p>No se pudo actualizar la lista. {message}</p>
    <Button variant="outline" onClick={retry}>Reintentar</Button>
  </div>;
}
