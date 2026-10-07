import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ReportesSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Skeleton de Métricas Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-md border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-40" />
          </Card>
        ))}
      </div>

      {/* Skeleton de Pestañas y Contenido */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-48 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-md" />
        </div>

        {/* Skeleton de Panel Central */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-md border-border bg-card">
            <CardHeader className="space-y-2 pb-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-md" />
            </CardContent>
          </Card>

          <Card className="rounded-md border-border bg-card">
            <CardHeader className="space-y-2 pb-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
