import React, { useState } from 'react';
import {
  Truck,
  FolderTree,
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardCheck,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Link2,
  Info,
} from 'lucide-react';
import { EtapaFlujoInventario } from '../types/inventario.types';

interface InventarioFlowBannerProps {
  etapaActiva: EtapaFlujoInventario;
  onSelectEtapa: (etapa: EtapaFlujoInventario) => void;
  productosBajoStockCount: number;
  totalMovimientos: number;
  totalValorizado: number;
}

interface EtapaConfig {
  id: EtapaFlujoInventario;
  numero: number;
  titulo: string;
  subtitulo: string;
  areaRelacionada: string;
  areaRuta: string;
  icon: React.ComponentType<{ className?: string }>;
  indicador?: string;
  explicacion: string;
}

export const InventarioFlowBanner: React.FC<InventarioFlowBannerProps> = ({
  etapaActiva,
  onSelectEtapa,
  productosBajoStockCount,
  totalMovimientos,
  totalValorizado,
}) => {
  const [mostrarRelaciones, setMostrarRelaciones] = useState(false);

  const etapas: EtapaConfig[] = [
    {
      id: 'RECEPCION',
      numero: 1,
      titulo: 'Recepción',
      subtitulo: 'Llegada de compras',
      areaRelacionada: 'Compras y Proveedores',
      areaRuta: '/compras',
      icon: Truck,
      indicador: 'Entradas',
      explicacion:
        'Cuando tu proveedor te entrega mercadería con factura o guía, se registra aquí para aumentar el stock automáticamente.',
    },
    {
      id: 'CLASIFICACION',
      numero: 2,
      titulo: 'Clasificación',
      subtitulo: 'Estantes y códigos',
      areaRelacionada: 'Catálogo de Productos',
      areaRuta: '/productos',
      icon: FolderTree,
      indicador: 'Ubicaciones',
      explicacion:
        'Organiza tus artículos por categoría, código SKU y estante/pasillo para encontrarlos rápido al momento de vender.',
    },
    {
      id: 'MOVIMIENTOS',
      numero: 3,
      titulo: 'Movimientos',
      subtitulo: 'Kardex continuo',
      areaRelacionada: 'Ventas (POS) y Caja',
      areaRuta: '/ventas',
      icon: ArrowLeftRight,
      indicador: `${totalMovimientos} reg.`,
      explicacion:
        'Cada venta en mostrador descuenta stock al instante; cada compra suma unidades; las mermas quedan anotadas.',
    },
    {
      id: 'CONTROL_STOCK',
      numero: 4,
      titulo: 'Niveles de Stock',
      subtitulo: 'Alertas y mínimos',
      areaRelacionada: 'Reorden y Abastecimiento',
      areaRuta: '/inventario',
      icon: SlidersHorizontal,
      indicador:
        productosBajoStockCount > 0
          ? `${productosBajoStockCount} por agotarse`
          : 'Stock al día',
      explicacion:
        'Monitorea qué productos están en nivel óptimo, cuáles están por terminarse y cuáles ya se agotaron.',
    },
    {
      id: 'AUDITORIA',
      numero: 5,
      titulo: 'Recuento Físico',
      subtitulo: 'Cotejo en tienda',
      areaRelacionada: 'Control de Mermas',
      areaRuta: '/gastos',
      icon: ClipboardCheck,
      indicador: 'Auditoría',
      explicacion:
        'Cuenta físicamente las cajas en tu estante y compara con la computadora. Si falta o sobra, ajustas en 1 clic.',
    },
    {
      id: 'ANALISIS',
      numero: 6,
      titulo: 'Análisis',
      subtitulo: 'Valor y rotación',
      areaRelacionada: 'Finanzas y Reportes',
      areaRuta: '/reportes',
      icon: BarChart3,
      indicador: `S/ ${totalValorizado.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      explicacion:
        'Conoce cuánto dinero tienes invertido en mercadería, qué productos vuelan del estante y cuáles están parados.',
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
      {/* Encabezado del flujo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Flujo del ciclo de inventario
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
              6 Etapas
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Haz clic en cualquier etapa para abrir su herramienta o revisar cómo se conecta con tu negocio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarRelaciones(!mostrarRelaciones)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline self-start sm:self-auto cursor-pointer"
        >
          <Link2 className="h-3.5 w-3.5" />
          <span>{mostrarRelaciones ? 'Ocultar conexiones con otras áreas' : 'Ver conexiones con otras áreas'}</span>
          {mostrarRelaciones ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Grid horizontal de los 6 pasos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {etapas.map((etapa, idx) => {
          const Icon = etapa.icon;
          const isActiva = etapaActiva === etapa.id;

          return (
            <div
              key={etapa.id}
              onClick={() => onSelectEtapa(etapa.id)}
              className={`group relative flex flex-col justify-between rounded-md border p-3 text-left transition-all cursor-pointer select-none ${
                isActiva
                  ? 'border-primary bg-primary-soft/40 shadow-xs ring-1 ring-primary'
                  : 'border-border bg-card hover:border-slate-300 dark:hover:border-slate-700 hover:bg-muted/30'
              }`}
            >
              {/* Encabezado con número de paso e icono */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isActiva
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {etapa.numero}
                </span>

                <Icon
                  className={`h-4 w-4 ${
                    isActiva ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
              </div>

              {/* Títulos de la etapa */}
              <div className="space-y-0.5">
                <h4
                  className={`text-xs font-semibold truncate ${
                    isActiva ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {etapa.titulo}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  {etapa.subtitulo}
                </p>
              </div>

              {/* Indicador o badge de estado */}
              <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${
                    etapa.id === 'CONTROL_STOCK' && productosBajoStockCount > 0
                      ? 'bg-warning-soft text-warning-text border border-warning/20'
                      : isActiva
                      ? 'bg-primary-soft text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {etapa.indicador}
                </span>
                <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  Ver →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel explicativo de conexiones con las demás áreas del negocio */}
      {mostrarRelaciones && (
        <div className="rounded-md border border-border bg-muted/30 p-3.5 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h5 className="text-xs font-semibold text-foreground">
              Cómo se comunica el inventario automáticamente con las demás áreas:
            </h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div className="rounded border border-border/80 bg-card p-2.5 space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Ventas & Punto de Venta (POS)
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Cada comprobante emitido (Boleta, Factura o Nota de Venta) descuenta automáticamente el stock del almacén y genera el registro de salida en el Kardex.
              </p>
            </div>

            <div className="rounded border border-border/80 bg-card p-2.5 space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Compras & Proveedores
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Al recepcionar la mercadería de un proveedor con su Guía o Factura, el stock se incrementa al instante sin necesidad de registrarlo dos veces.
              </p>
            </div>

            <div className="rounded border border-border/80 bg-card p-2.5 space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Caja & Finanzas
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Las compras en efectivo descuentan de tu saldo diario de caja chica, y las mermas o deterioros detectados en auditoría se valorizan como pérdida real.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
