import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

/**
 * Shell maestro de KIPU'S ERP.
 * Proporciona el diseño envolvente con navegación lateral, barra superior y área de contenido dinámico.
 */
export const AppLayout: React.FC = () => {
  const location = useLocation();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background antialiased">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <ErrorBoundary key={location.pathname} moduleName="este módulo">
              <Suspense fallback={<div role="status" aria-label="Cargando módulo" className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>}>
                <Outlet />
              </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
