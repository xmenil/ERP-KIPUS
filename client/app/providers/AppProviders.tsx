import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Instancia única del cliente de Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutos de cache por defecto
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Envoltorio global de Providers para la aplicación.
 * Centraliza la inyección de contexto de Query, Tooltips y Notificaciones Toasts.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster />
        <Sonner position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
};
