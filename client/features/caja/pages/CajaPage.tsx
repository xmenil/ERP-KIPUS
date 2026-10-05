import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cajaService } from '../services/cajaService';
import {
  EstadoCaja,
  MovimientoCaja,
  CajaInfo,
  CierreCaja,
  AuditoriaCaja,
  NuevaOperacionCajaPayload,
  AperturaCajaPayload,
  CierreCajaPayload,
  ArqueoConteo,
  TipoOperacionCaja,
} from '../types/caja.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency } from '@/utils/formatters';

// Componentes del Módulo
import { MiCajaView } from '../components/MiCajaView';
import { CajaCerradaEmptyState } from '../components/CajaCerradaEmptyState';
import { AbrirCajaDialog } from '../components/AbrirCajaDialog';
import { OperacionCajaDialog } from '../components/OperacionCajaDialog';
import { ArqueoConteoDialog } from '../components/ArqueoConteoDialog';
import { CierreCajaDialog } from '../components/CierreCajaDialog';
import { CierreResultadoModal } from '../components/CierreResultadoModal';
import { MovimientosCajaView } from '../components/MovimientosCajaView';
import { GestionCajasView } from '../components/GestionCajasView';
import { HistorialCierresView } from '../components/HistorialCierresView';
import { AuditoriaCajaView } from '../components/AuditoriaCajaView';
import { KipusIACajaDialog } from '../components/KipusIACajaDialog';

// Iconos
import {
  Store,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  LockKeyhole,
  History,
  ShieldCheck,
  Sparkles,
  Bot,
  Layers,
  CheckCircle2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

type NivelComplejidad = 'BODEGA' | 'MEDIANO' | 'EMPRESARIAL';
type TabCaja = 'MI_CAJA' | 'MOVIMIENTOS' | 'ARQUEO' | 'CIERRES' | 'CAJAS' | 'AUDITORIA';

export const CajaPage: React.FC = () => {
  // Estado de Datos
  const [estado, setEstado] = useState<EstadoCaja | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [cajas, setCajas] = useState<CajaInfo[]>([]);
  const [cierres, setCierres] = useState<CierreCaja[]>([]);
  const [auditorias, setAuditorias] = useState<AuditoriaCaja[]>([]);
  const [loading, setLoading] = useState(true);

  // Navegación y Complejidad Progresiva
  const [nivel, setNivel] = useState<NivelComplejidad>('EMPRESARIAL');
  const [activeTab, setActiveTab] = useState<TabCaja>('MI_CAJA');

  // Diálogos Modales
  const [modalAbrirOpen, setModalAbrirOpen] = useState(false);
  const [modalOperacionOpen, setModalOperacionOpen] = useState(false);
  const [operacionTipo, setOperacionTipo] = useState<TipoOperacionCaja>('INGRESO');
  const [modalArqueoOpen, setModalArqueoOpen] = useState(false);
  const [modalCierreOpen, setModalCierreOpen] = useState(false);
  const [ultimoArqueo, setUltimoArqueo] = useState<ArqueoConteo | null>(null);
  const [modalResultadoCierreOpen, setModalResultadoCierreOpen] = useState(false);
  const [ultimoCierreRealizado, setUltimoCierreRealizado] = useState<CierreCaja | null>(null);
  const [modalIAOpen, setModalIAOpen] = useState(false);

  // Carga reactiva de datos
  const fetchDatos = async () => {
    try {
      const [est, movs, cjs, cies, auds] = await Promise.all([
        cajaService.getEstado(),
        cajaService.getMovimientos(),
        cajaService.getCajas(),
        cajaService.getCierres(),
        cajaService.getAuditoria(),
      ]);
      setEstado(est);
      setMovimientos(movs);
      setCajas(cjs);
      setCierres(cies);
      setAuditorias(auds);
    } catch {
      toast.error('Error al sincronizar el módulo de caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
    const unsubscribe = subscribeToErp(() => {
      fetchDatos();
    });
    return unsubscribe;
  }, []);

  // Handlers Operativos
  const handleAbrirCaja = async (payload: AperturaCajaPayload) => {
    try {
      const nuevoEstado = await cajaService.abrirCaja(payload);
      setEstado(nuevoEstado);
      toast.success(
        `Caja abierta con sencillo inicial de ${formatCurrency(payload.saldoInicial)}`
      );
      fetchDatos();
    } catch {
      toast.error('No se pudo abrir la caja');
    }
  };

  const handleOpenOperacion = (tipo: TipoOperacionCaja) => {
    setOperacionTipo(tipo);
    setModalOperacionOpen(true);
  };

  const handleRegistrarOperacion = async (payload: NuevaOperacionCajaPayload) => {
    try {
      await cajaService.registrarOperacion(payload);
      toast.success(
        `${payload.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} de ${formatCurrency(
          payload.monto
        )} registrado correctamente`
      );
      fetchDatos();
    } catch {
      toast.error('Error al registrar la operación');
    }
  };

  const handleArqueoGuardado = async (arqueo: ArqueoConteo) => {
    try {
      await cajaService.registrarArqueo(arqueo);
      setUltimoArqueo(arqueo);
      toast.success(
        `Conteo guardado: ${
          arqueo.estadoCuadre === 'CUADRADA'
            ? 'Caja cuadrada sin diferencia'
            : `Diferencia de ${formatCurrency(arqueo.diferencia)} registrada`
        }`
      );
      fetchDatos();
    } catch {
      toast.error('No se pudo guardar el arqueo');
    }
  };

  const handleProcederCierreDesdeArqueo = (arqueo: ArqueoConteo) => {
    setUltimoArqueo(arqueo);
    setModalCierreOpen(true);
  };

  const handleCierreConfirmado = async (payload: CierreCajaPayload) => {
    try {
      const res = await cajaService.cerrarCaja(payload);
      setUltimoCierreRealizado(res);
      setModalResultadoCierreOpen(true);
      toast.success('Turno de caja cerrado exitosamente.');
      fetchDatos();
    } catch {
      toast.error('Error al procesar el cierre de caja');
    }
  };

  // Determinar tabs visibles según el nivel de complejidad progresiva (Regla 35)
  const tabsVisibles = React.useMemo(() => {
    if (nivel === 'BODEGA') {
      return [
        { id: 'MI_CAJA', label: 'Mi caja', icon: Coins },
        { id: 'MOVIMIENTOS', label: 'Movimientos', icon: RefreshCw },
        { id: 'ARQUEO', label: 'Contar dinero', icon: Calculator },
      ];
    }
    if (nivel === 'MEDIANO') {
      return [
        { id: 'MI_CAJA', label: 'Mi caja', icon: Coins },
        { id: 'MOVIMIENTOS', label: 'Movimientos', icon: RefreshCw },
        { id: 'ARQUEO', label: 'Arqueo', icon: Calculator },
        { id: 'CIERRES', label: 'Historial de Cierres', icon: History },
      ];
    }
    // EMPRESARIAL (Admin y cadenas)
    return [
      { id: 'MI_CAJA', label: 'Mi caja', icon: Coins },
      { id: 'MOVIMIENTOS', label: 'Movimientos', icon: RefreshCw },
      { id: 'ARQUEO', label: 'Arqueo', icon: Calculator },
      { id: 'CIERRES', label: 'Historial Cierres', icon: History },
      { id: 'CAJAS', label: 'Todas las Cajas', icon: Store },
      { id: 'AUDITORIA', label: 'Auditoría', icon: ShieldCheck },
    ];
  }, [nivel]);

  if (loading || !estado) {
    return (
      <div className="p-8 text-center space-y-3">
        <Coins className="h-8 w-8 text-primary animate-pulse mx-auto" />
        <p className="text-xs font-semibold text-muted-foreground">
          Sincronizando estado de caja...
        </p>
      </div>
    );
  }

  const cajaEstaAbierta = estado.abierta;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Principal con Estado Semántico y Selector Progresivo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Módulo de Caja
            </h1>
            {/* Estado Semántico (Regla 6) */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                cajaEstaAbierta
                  ? 'bg-success-soft text-success-text border-success/30'
                  : 'bg-danger-soft text-danger-text border-destructive/30'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  cajaEstaAbierta ? 'bg-success animate-pulse' : 'bg-destructive'
                }`}
              />
              {cajaEstaAbierta ? 'Caja abierta' : 'Caja cerrada'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control de efectivo en gaveta, ventas automáticas, cobros digitales y cierres de turno.
          </p>
        </div>

        {/* Acciones de Cabecera: Selector Progresivo y KIPU'S IA */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Complejidad Progresiva (Regla 35) */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-md border border-border/60 overflow-x-auto max-w-full">
            <span className="text-xs font-medium text-muted-foreground px-2 hidden sm:inline shrink-0">
              Modo:
            </span>
            {(
              [
                { id: 'BODEGA', label: 'Tienda Rápida' },
                { id: 'MEDIANO', label: 'Comercio Mediano' },
                { id: 'EMPRESARIAL', label: 'Cadena / Admin' },
              ] as const
            ).map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setNivel(mod.id);
                  if (mod.id === 'BODEGA' && (activeTab === 'CAJAS' || activeTab === 'AUDITORIA' || activeTab === 'CIERRES')) {
                    setActiveTab('MI_CAJA');
                  }
                }}
                className={`px-2.5 py-1 rounded text-xs transition-all whitespace-nowrap shrink-0 ${
                  nivel === mod.id
                    ? 'bg-card text-foreground shadow-xs border border-border font-medium'
                    : 'text-muted-foreground hover:text-foreground font-normal'
                }`}
              >
                {mod.label}
              </button>
            ))}
          </div>

          {/* Botón KIPU'S IA */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModalIAOpen(true)}
            className="h-8 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/5 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>KIPU'S IA</span>
          </Button>

          {/* Botón Abrir Caja (si está cerrada) */}
          {!cajaEstaAbierta && (
            <Button
              type="button"
              size="sm"
              onClick={() => setModalAbrirOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Abrir caja</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Barra de Navegación por Tabs Adaptativa (Reglas 3 y 35) */}
      <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-px scrollbar-none">
        {tabsVisibles.map((tab) => {
          const Icon = tab.icon;
          const esActivo = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabCaja)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] text-xs font-medium transition-all border-b-2 whitespace-nowrap shrink-0 ${
                esActivo
                  ? 'border-primary text-primary font-semibold bg-primary/5 rounded-t-md'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-md'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.id === 'MOVIMIENTOS' && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-muted font-medium">
                  {movimientos.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Contenido Principal según Tab Activo */}
      <div className="min-h-[420px]">
        {/* TAB 1: MI CAJA */}
        {activeTab === 'MI_CAJA' && (
          <>
            {cajaEstaAbierta ? (
              <MiCajaView
                estado={estado}
                movimientos={movimientos}
                onOpenIngreso={() => handleOpenOperacion('INGRESO')}
                onOpenEgreso={() => handleOpenOperacion('EGRESO')}
                onOpenArqueo={() => setModalArqueoOpen(true)}
                onOpenCierre={() => setModalCierreOpen(true)}
                onVerTodosMovimientos={() => setActiveTab('MOVIMIENTOS')}
              />
            ) : (
              /* REGLA 8: Si no tiene caja abierta, mostrar pantalla clara sin errores técnicos */
              <CajaCerradaEmptyState
                onAbrirCajaClick={() => setModalAbrirOpen(true)}
                sucursal={estado.sucursal}
                cajaNombre={estado.nombre}
              />
            )}
          </>
        )}

        {/* TAB 2: MOVIMIENTOS */}
        {activeTab === 'MOVIMIENTOS' && (
          <MovimientosCajaView
            movimientos={movimientos}
            cajaNombre={estado.nombre}
          />
        )}

        {/* TAB 3: CONTAR DINERO / ARQUEO */}
        {activeTab === 'ARQUEO' && (
          <Card className="border border-border/80 shadow-xs bg-card p-6 text-center space-y-4 max-w-lg mx-auto">
            <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Calculator className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Conteo y Arqueo de Caja
              </h3>
              <p className="text-xs text-muted-foreground">
                Cuenta los billetes y monedas físicos de tu gaveta para comprobar que no existan sobrantes ni faltantes en tu turno.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => setModalArqueoOpen(true)}
                className="font-medium text-xs h-9 px-5 gap-2"
                disabled={!cajaEstaAbierta}
              >
                <Calculator className="h-4 w-4" />
                {cajaEstaAbierta ? 'Abrir calculadora de conteo' : 'Abre tu caja primero para arquear'}
              </Button>
            </div>
          </Card>
        )}

        {/* TAB 4: HISTORIAL DE CIERRES */}
        {activeTab === 'CIERRES' && (
          <HistorialCierresView
            cierres={cierres}
            onNuevaApertura={() => setModalAbrirOpen(true)}
          />
        )}

        {/* TAB 5: TODAS LAS CAJAS (Solo Admin / Nivel Empresarial) */}
        {activeTab === 'CAJAS' && (
          <GestionCajasView
            cajas={cajas}
            onSeleccionarCaja={(caja) => {
              toast.info(`Consultando ${caja.nombre} de ${caja.sucursal}`);
              setActiveTab('MOVIMIENTOS');
            }}
          />
        )}

        {/* TAB 6: AUDITORÍA (Solo Admin / Nivel Empresarial) */}
        {activeTab === 'AUDITORIA' && (
          <AuditoriaCajaView auditorias={auditorias} />
        )}
      </div>

      {/* 4. Diálogos Modales del Flujo */}
      {/* Modal Abrir Caja */}
      <AbrirCajaDialog
        open={modalAbrirOpen}
        onOpenChange={setModalAbrirOpen}
        onCajaAbierta={handleAbrirCaja}
        sucursalDefecto={estado.sucursal}
      />

      {/* Modal Operación (Ingreso / Egreso) */}
      <OperacionCajaDialog
        open={modalOperacionOpen}
        onOpenChange={setModalOperacionOpen}
        onOperacionRegistrada={handleRegistrarOperacion}
        tipoInicial={operacionTipo}
        saldoActual={estado.saldoEfectivoEsperado}
      />

      {/* Modal Arqueo / Contar Dinero */}
      <ArqueoConteoDialog
        open={modalArqueoOpen}
        onOpenChange={setModalArqueoOpen}
        estadoCaja={estado}
        onArqueoGuardado={handleArqueoGuardado}
        onProcederCierre={handleProcederCierreDesdeArqueo}
      />

      {/* Modal Cierre de Caja */}
      <CierreCajaDialog
        open={modalCierreOpen}
        onOpenChange={setModalCierreOpen}
        estadoCaja={estado}
        arqueoPrevio={ultimoArqueo}
        onCierreConfirmado={handleCierreConfirmado}
      />

      {/* Modal Resultado del Cierre (Comprobante imprimible) */}
      <CierreResultadoModal
        open={modalResultadoCierreOpen}
        onOpenChange={setModalResultadoCierreOpen}
        cierre={ultimoCierreRealizado}
        onNuevaAperturaClick={() => setModalAbrirOpen(true)}
      />

      {/* Modal KIPU'S IA */}
      <KipusIACajaDialog
        open={modalIAOpen}
        onOpenChange={setModalIAOpen}
        estadoCaja={estado}
        movimientos={movimientos}
        cierres={cierres}
      />
    </div>
  );
};

export default CajaPage;
