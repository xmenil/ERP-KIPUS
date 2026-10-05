import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { APP_ROUTES } from '@/constants/routes';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import LoginPage from '@/features/auth/pages/LoginPage';

// Importación directa de páginas de módulos
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import VentasPage from '@/features/ventas/pages/VentasPage';
import ProductosPage from '@/features/productos/pages/ProductosPage';
import InventarioPage from '@/features/inventario/pages/InventarioPage';
import CajaPage from '@/features/caja/pages/CajaPage';
import GastosPage from '@/features/gastos/pages/GastosPage';
import ComprasPage from '@/features/compras/pages/ComprasPage';
import ClientesPage from '@/features/clientes/pages/ClientesPage';
import ProveedoresPage from '@/features/proveedores/pages/ProveedoresPage';
import ReportesPage from '@/features/reportes/pages/ReportesPage';
import KipusIaPage from '@/features/kipus-ia/pages/KipusIaPage';
import UsuariosPage from '@/features/usuarios/pages/UsuariosPage';
import ConfiguracionPage from '@/features/configuracion/pages/ConfiguracionPage';
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

