import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { APP_ROUTES } from '@/constants/routes';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuth } from '@/features/auth/context/AuthContext';
import LoginPage from '@/features/auth/pages/LoginPage';

// Importación de módulos consolidados
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import VentasPage from '@/features/ventas/pages/VentasPage';
import InventarioPage from '@/features/inventario/pages/InventarioPage';
import ComprasPage from '@/features/compras/pages/ComprasPage';
import GastosPage from '@/features/gastos/pages/GastosPage';
import ClientesPage from '@/features/clientes/pages/ClientesPage';
import ReportesPage from '@/features/reportes/pages/ReportesPage';
import AdministracionPage from '@/features/administracion/pages/AdministracionPage';
import NotFound from '@/pages/NotFound';

/**
 * Manejador de ruta para Clientes:
 * Si el usuario autenticado es Dueño/Administrador, lo redirige al módulo consolidado
 * 'Gastos y clientes' (/gastos?tab=clientes).
 * Si es Cajero, muestra la pantalla directa autorizada de Clientes (/clientes).
 */
const ClientesRouteHandler: React.FC = () => {
  const { user } = useAuth();
  if (user?.rol === 'ADMINISTRADOR') {
    return <Navigate to="/gastos?tab=clientes" replace />;
  }
  return <ClientesPage />;
};

/**
 * Enrutador principal centralizado de KIPU'S ERP.
 * Define la estructura declarativa de rutas y redirecciones para evitar duplicados.
 */
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Ruta pública de Autenticación */}
      <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />

      {/* Rutas protegidas bajo el Shell del ERP */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Redirección raíz al Dashboard (Inicio) */}
          <Route path={APP_ROUTES.HOME} element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />

          {/* 1. Inicio */}
          <Route path={APP_ROUTES.DASHBOARD} element={<DashboardPage />} />

          {/* 2. Ventas y caja */}
          <Route path={APP_ROUTES.VENTAS} element={<VentasPage />} />
          <Route path={APP_ROUTES.CAJA} element={<Navigate to="/ventas?tab=caja" replace />} />

          {/* 3. Inventario (Productos e Inventario unificados en el mismo módulo) */}
          <Route path={APP_ROUTES.INVENTARIO} element={<InventarioPage />} />
          <Route path={APP_ROUTES.PRODUCTOS} element={<Navigate to={APP_ROUTES.INVENTARIO} replace />} />

          {/* 4. Compras y proveedores (Órdenes, recepción y directorio unificados) */}
          <Route path={APP_ROUTES.COMPRAS} element={<ComprasPage />} />
          <Route path={APP_ROUTES.PROVEEDORES} element={<Navigate to="/compras?tab=proveedores" replace />} />

          {/* 5. Gastos y clientes */}
          <Route path={APP_ROUTES.GASTOS} element={<GastosPage />} />
          <Route path={APP_ROUTES.CLIENTES} element={<ClientesRouteHandler />} />

          {/* 6. Reportes (KIPU'S IA integrado dentro de Reportes) */}
          <Route path={APP_ROUTES.REPORTES} element={<ReportesPage />} />
          <Route path={APP_ROUTES.KIPUS_IA} element={<Navigate to="/reportes?tab=ia" replace />} />

          {/* 7. Administración (Usuarios, Roles, Sucursales y Configuración del Sistema) */}
          <Route path={APP_ROUTES.ADMINISTRACION} element={<AdministracionPage />} />
          <Route path={APP_ROUTES.USUARIOS} element={<Navigate to="/administracion?tab=usuarios" replace />} />
          <Route path={APP_ROUTES.CONFIGURACION} element={<Navigate to="/administracion?tab=sistema" replace />} />
        </Route>
      </Route>

      {/* Ruta comodín 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
