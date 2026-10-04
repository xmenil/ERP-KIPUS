import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingStateProps {
  rows?: number;
  hasCards?: boolean;
}

/**
 * Estado de carga con esqueletos que calcan la estructura exacta de la vista.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ rows = 5, hasCards = true }) => {
  return (
    <div className="space-y-4">
      {hasCards && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`skel-card-${i}`} className="border-border bg-card shadow-xs p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))}
        </div>
      )}

      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-32" />
          </div>

          <div className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted/40 h-10 border-b border-border px-4 flex items-center">
              <Skeleton className="h-4 w-full" />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={`skel-row-${i}`}
                className="h-12 border-b border-border/70 px-4 flex items-center justify-between gap-4"
              >
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
