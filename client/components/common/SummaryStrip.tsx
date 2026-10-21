import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SummaryItem {
  label: string;
  value: ReactNode;
  description?: string;
  tone?: 'warning' | 'danger';
}

/** Resumen de una operación en una superficie, sin repetir tarjetas decorativas. */
export function SummaryStrip({
  items,
  loading = false,
}: {
  items: SummaryItem[];
  loading?: boolean;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="p-0">
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="min-w-0 space-y-1 p-4">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd
                className={cn(
                  'break-words text-xl font-semibold tabular-nums',
                  item.tone === 'warning'
                    ? 'text-warning-text'
                    : item.tone === 'danger'
                      ? 'text-danger-text'
                      : 'text-foreground',
                )}
              >
                {loading ? (
                  <Skeleton className="h-7 w-24 max-w-full" />
                ) : (
                  item.value
                )}
              </dd>
              {item.description && (
                <dd className="text-xs text-muted-foreground">
                  {item.description}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
