import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { APP_ROUTES } from '@/constants/routes';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import LoginPage from '@/features/auth/pages/LoginPage';

// Cada módulo se descarga al visitarlo; el shell permanece montado.
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const VentasPage = lazy(() => import('@/features/ventas/pages/VentasPage'));
const ProductosPage = lazy(() => import('@/features/productos/pages/ProductosPage'));
const InventarioPage = lazy(() => import('@/features/inventario/pages/InventarioPage'));
const CajaPage = lazy(() => import('@/features/caja/pages/CajaPage'));
const GastosPage = lazy(() => import('@/features/gastos/pages/GastosPage'));
const ComprasPage = lazy(() => import('@/features/compras/pages/ComprasPage'));
const ClientesPage = lazy(() => import('@/features/clientes/pages/ClientesPage'));
const ProveedoresPage = lazy(() => import('@/features/proveedores/pages/ProveedoresPage'));
const ReportesPage = lazy(() => import('@/features/reportes/pages/ReportesPage'));
const KipusIaPage = lazy(() => import('@/features/kipus-ia/pages/KipusIaPage'));
const UsuariosPage = lazy(() => import('@/features/usuarios/pages/UsuariosPage'));
const ConfiguracionPage = lazy(() => import('@/features/configuracion/pages/ConfiguracionPage'));
import NotFound from '@/pages/NotFound';

/**
 * Enrutador principal centralizado de KIPU'S ERP.
 * Define la estructura declarativa de rutas dentro del Shell del ERP y salvaguarda con ProtectedRoute.
 */
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Ruta pública de Autenticación */}
      <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />

      {/* Rutas protegidas bajo el Shell del ERP */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Redirección raíz al Dashboard */}
          <Route path={APP_ROUTES.HOME} element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />
          
          {/* Módulos de Gestión */}
          <Route path={APP_ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={APP_ROUTES.VENTAS} element={<VentasPage />} />
          <Route path={APP_ROUTES.PRODUCTOS} element={<ProductosPage />} />
          <Route path={APP_ROUTES.INVENTARIO} element={<InventarioPage />} />
          <Route path={APP_ROUTES.CAJA} element={<CajaPage />} />
          <Route path={APP_ROUTES.GASTOS} element={<GastosPage />} />
          <Route path={APP_ROUTES.COMPRAS} element={<ComprasPage />} />
          <Route path={APP_ROUTES.CLIENTES} element={<ClientesPage />} />
          <Route path={APP_ROUTES.PROVEEDORES} element={<ProveedoresPage />} />
          <Route path={APP_ROUTES.REPORTES} element={<ReportesPage />} />
          <Route path={APP_ROUTES.KIPUS_IA} element={<KipusIaPage />} />
          <Route path={APP_ROUTES.USUARIOS} element={<UsuariosPage />} />
          <Route path={APP_ROUTES.CONFIGURACION} element={<ConfiguracionPage />} />
        </Route>
      </Route>

      {/* Ruta comodín 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

