import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MetricCard } from '@/components/common/MetricCard';
import { ProveedorFormDialog } from '../components/ProveedorFormDialog';
import { ProveedorDetalleModal } from '../components/ProveedorDetalleModal';
import { proveedoresService } from '../services/proveedoresService';
import { Proveedor, NuevoProveedorPayload } from '../types/proveedores.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  CreditCard,
  Download,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Store,
  Copy,
  Check,
  LayoutGrid,
  List,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type FiltroTab = 'TODOS' | 'CREDITO' | 'CONTADO' | 'CON_DEUDA';
type TipoVista = 'TABLA' | 'TARJETAS';

export const ProveedoresPage: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTab, setFiltroTab] = useState<FiltroTab>('TODOS');
  const [tipoVista, setTipoVista] = useState<TipoVista>('TABLA');

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const fetchProveedores = async () => {
    try {
      const data = await proveedoresService.getProveedores();
      setProveedores(data);
    } catch {
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
    const unsubscribe = subscribeToErp(() => {
      fetchProveedores();
    });
    return unsubscribe;
  }, []);

  // Guardar (Crear o Editar)
  const handleGuardarProveedor = async (payload: NuevoProveedorPayload, id?: string) => {
    try {
      if (id) {
        const actualizado = await proveedoresService.actualizarProveedor(id, payload);
        toast.success(`Proveedor "${actualizado.razonSocial}" actualizado correctamente`);
      } else {
        const nuevo = await proveedoresService.registrarProveedor(payload);
        toast.success(`Proveedor "${nuevo.razonSocial}" registrado exitosamente`);
      }
      fetchProveedores();
    } catch {
      toast.error('Error al procesar la operación');
    }
  };

  // Eliminar
  const handleEliminarProveedor = async (prov: Proveedor) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar a "${prov.nombreComercial || prov.razonSocial}" del directorio?`
      )
    ) {
      return;
    }
    try {
      await proveedoresService.eliminarProveedor(prov.id);
      toast.success('Proveedor eliminado del directorio');
      fetchProveedores();
    } catch {
      toast.error('No se pudo eliminar el proveedor');
    }
  };

  // Copiar RUC
  const handleCopiarRuc = (e: React.MouseEvent, ruc: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ruc);
    setCopiadoId(id);
    toast.success(`RUC ${ruc} copiado al portapapeles`);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  // Exportar CSV
  const handleExportarCsv = () => {
    const encabezados = 'Código,RUC,Nombre Comercial,Razón Social,Rubro,Teléfono,Correo,Ciudad,Condición Pago,Saldo Pendiente\n';
    const filas = proveedores
      .map(
        (p) =>
          `"${p.codigo || ''}","${p.ruc}","${p.nombreComercial || ''}","${p.razonSocial}","${p.rubro}","${p.telefono}","${p.correo}","${p.ciudad}","${p.condicionPago}","${p.saldoPendiente || 0}"`
      )
      .join('\n');
    const blob = new Blob([encabezados + filas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Proveedores_KIPUS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Directorio de proveedores exportado en CSV');
  };

  // Filtros
  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter((p) => {
      // Filtro por tab
      if (filtroTab === 'CREDITO' && !p.condicionPago.includes('Crédito')) return false;
      if (filtroTab === 'CONTADO' && p.condicionPago.includes('Crédito')) return false;
      if (filtroTab === 'CON_DEUDA' && (!p.saldoPendiente || p.saldoPendiente <= 0)) return false;

      // Filtro por texto
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const coincideRuc = p.ruc.includes(q);
        const coincideRazon = p.razonSocial.toLowerCase().includes(q);
        const coincideComercial = p.nombreComercial?.toLowerCase().includes(q) || false;
        const coincideCiudad = p.ciudad.toLowerCase().includes(q);
        const coincideRubro = p.rubro.toLowerCase().includes(q);
        const coincideContacto = p.contacto.toLowerCase().includes(q);
        return (
          coincideRuc ||
          coincideRazon ||
          coincideComercial ||
          coincideCiudad ||
          coincideRubro ||
          coincideContacto
        );
      }
      return true;
    });
  }, [proveedores, filtroTab, searchTerm]);

  // Métricas Consolidadas
  const totalProveedores = proveedores.length;
  const aCredito = proveedores.filter((p) => p.condicionPago.includes('Crédito')).length;
  const totalComprasAcumuladas = proveedores.reduce((acc, p) => acc + (p.totalCompras || 0), 0);
  const totalCuentasPorPagar = proveedores.reduce((acc, p) => acc + (p.saldoPendiente || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Principal */}
      <PageHeader
        title="Directorio de Proveedores"
        description="Gestión integral de empresas proveedoras, datos fiscales, canales de contacto y acuerdos de pago"
        badge="Catálogo Homologado"
      >
        <div className="flex items-center gap-2">
          {/* Botón Exportar */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCsv}
            className="h-9 text-xs font-semibold gap-1.5"
            title="Exportar directorio de proveedores"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>

          {/* Botón Nuevo Proveedor */}
          <Button
            size="sm"
            onClick={() => {
              setProveedorAEditar(null);
              setFormModalOpen(true);
            }}
            className="h-9 font-semibold text-xs gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo proveedor</span>
          </Button>
        </div>
      </PageHeader>

      {/* 2. Cuatro Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Proveedores en Cartera */}
        <MetricCard
          title="Proveedores en Cartera"
          value={formatNumber(totalProveedores)}
          subtitle="Empresas con RUC verificado"
          icon={Building2}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />

        {/* Proveedores a Crédito */}
        <MetricCard
          title="Proveedores a Crédito"
          value={formatNumber(aCredito)}
          subtitle="Con líneas de 15 a 60 días"
          icon={CreditCard}
          iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/40"
        />

        {/* Compras Acumuladas */}
        <MetricCard
          title="Compras Acumuladas"
          value={formatCurrency(totalComprasAcumuladas)}
          subtitle="Volumen histórico facturado"
          icon={Store}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />

        {/* Cuentas por Pagar */}
        <MetricCard
          title="Cuentas por Pagar"
          value={formatCurrency(totalCuentasPorPagar)}
          subtitle="Saldos pendientes a liquidar"
          icon={CreditCard}
          iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40"
        />
      </div>

      {/* 3. Barra de Búsqueda y Filtros con Switcher de Vista */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Buscador en Vivo con botón de limpiar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por RUC, nombre, ciudad, rubro o contacto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-8 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Chips de Filtro Rápido */}
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border/60 overflow-x-auto w-full md:w-auto">
              {(
                [
                  { id: 'TODOS', label: `Todos (${totalProveedores})` },
                  { id: 'CREDITO', label: `A Crédito (${aCredito})` },
                  { id: 'CONTADO', label: `Al Contado (${totalProveedores - aCredito})` },
                  {
                    id: 'CON_DEUDA',
                    label: `Con Saldo (${proveedores.filter((p) => (p.saldoPendiente || 0) > 0).length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroTab(tab.id)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all whitespace-nowrap ${
                    filtroTab === tab.id
                      ? 'bg-card text-foreground shadow-xs border border-border font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Selector de Vista: Tabla vs Tarjetas */}
            <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/30 shrink-0">
              <button
                type="button"
                onClick={() => setTipoVista('TABLA')}
                className={`p-1.5 rounded transition-colors ${
                  tipoVista === 'TABLA'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista en tabla"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setTipoVista('TARJETAS')}
                className={`p-1.5 rounded transition-colors ${
                  tipoVista === 'TARJETAS'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista en tarjetas"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Contenedor de Resultados (Tabla o Tarjetas) */}
      {proveedoresFiltrados.length === 0 ? (
        <Card className="border border-border/80 shadow-xs bg-card p-12 text-center space-y-3">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              No se encontraron proveedores
            </h3>
            <p className="text-xs text-muted-foreground">
              No hay resultados que coincidan con "{searchTerm}" o el filtro seleccionado.
            </p>
          </div>
          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="text-xs"
            >
              Limpiar búsqueda
            </Button>
          )}
        </Card>
      ) : tipoVista === 'TABLA' ? (
        /* VISTA 1: TABLA MODERNA Y LIMPIA */
        <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs bg-muted/40">
                    <TableHead className="w-12 text-center">ID</TableHead>
                    <TableHead>Proveedor (Nombre y Razón Social)</TableHead>
                    <TableHead className="w-36">RUC / Doc</TableHead>
                    <TableHead>Ubicación (Ciudad • Dirección)</TableHead>
                    <TableHead>Contacto & Canales</TableHead>
                    <TableHead>Condición Pago</TableHead>
                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                    <TableHead className="w-24 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proveedoresFiltrados.map((prov) => {
                    const cleanPhone = prov.telefono ? prov.telefono.replace(/\s+/g, '') : '';
                    return (
                      <TableRow
                        key={prov.id}
                        className="text-xs hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => {
                          setProveedorSeleccionado(prov);
                          setDetalleModalOpen(true);
                        }}
                      >
                        {/* ID / Código */}
                        <TableCell className="text-center font-mono text-[11px] text-muted-foreground">
                          {prov.codigo || prov.id.slice(-3)}
                        </TableCell>

                        {/* Proveedor con Avatar e Identidad */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                              {(prov.nombreComercial || prov.razonSocial).slice(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-bold text-foreground block line-clamp-1">
                                {prov.nombreComercial || prov.razonSocial}
                              </span>
                              <span className="text-[10px] text-muted-foreground block line-clamp-1">
                                {prov.razonSocial}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* RUC con Copiar */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleCopiarRuc(e, prov.ruc, prov.id)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-foreground hover:text-primary transition-colors text-[11px]"
                            title="Copiar RUC"
                          >
                            <span>{prov.ruc}</span>
                            {copiadoId === prov.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                          <span className="text-[10px] text-primary block">{prov.rubro}</span>
                        </TableCell>

                        {/* Ubicación */}
                        <TableCell>
                          <div className="text-foreground font-medium flex items-center gap-1 line-clamp-1">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{prov.ciudad}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {prov.direccion}
                          </span>
                        </TableCell>

                        {/* Contacto & Teléfono */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-0.5">
                            <span className="font-medium text-foreground block">
                              {prov.contacto || 'Contacto'}
                            </span>
                            <div className="flex items-center gap-2 text-[11px]">
                              {cleanPhone && (
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="text-muted-foreground hover:text-primary flex items-center gap-1 font-mono"
                                  title="Llamar"
                                >
                                  <Phone className="h-3 w-3" />
                                  <span>{prov.telefono}</span>
                                </a>
                              )}
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/51${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Condición de Pago */}
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              prov.condicionPago.includes('Crédito')
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {prov.condicionPago}
                          </span>
                        </TableCell>

                        {/* Saldo Pendiente */}
                        <TableCell className="text-right">
                          <span
                            className={`font-bold tabular-nums text-xs ${
                              (prov.saldoPendiente || 0) > 0 ? 'text-rose-600' : 'text-muted-foreground'
                            }`}
                          >
                            {formatCurrency(prov.saldoPendiente || 0)}
                          </span>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setProveedorSeleccionado(prov);
                                setDetalleModalOpen(true);
                              }}
                              title="Ver ficha completa"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setProveedorAEditar(prov);
                                setFormModalOpen(true);
                              }}
                              title="Editar proveedor"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                              onClick={() => handleEliminarProveedor(prov)}
                              title="Eliminar proveedor"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* VISTA 2: TARJETAS (CARDS) MODERNAS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedoresFiltrados.map((prov) => {
            const cleanPhone = prov.telefono ? prov.telefono.replace(/\s+/g, '') : '';
            return (
              <Card
                key={prov.id}
                className="border border-border/80 shadow-xs hover:border-primary/50 transition-all bg-card cursor-pointer"
                onClick={() => {
                  setProveedorSeleccionado(prov);
                  setDetalleModalOpen(true);
                }}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Cabecera de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                        {(prov.nombreComercial || prov.razonSocial).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm line-clamp-1">
                          {prov.nombreComercial || prov.razonSocial}
                        </h4>
                        <span className="text-[11px] text-muted-foreground font-mono block">
                          RUC: {prov.ruc}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-primary border border-border">
                      {prov.rubro}
                    </span>
                  </div>

                  {/* Datos Clave */}
                  <div className="space-y-1.5 text-xs p-3 rounded-lg bg-muted/30 border border-border/60">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Ciudad:
                      </span>
                      <span className="font-semibold text-foreground">{prov.ciudad}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Condición:
                      </span>
                      <span className="font-semibold text-foreground">{prov.condicionPago}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-border/40">
                      <span className="text-muted-foreground">Saldo pendiente:</span>
                      <span
                        className={`font-bold tabular-nums ${
                          (prov.saldoPendiente || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(prov.saldoPendiente || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Botones de Acción Directa */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors"
                          title="Llamar"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/51${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold"
                        onClick={() => {
                          setProveedorAEditar(prov);
                          setFormModalOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                        onClick={() => handleEliminarProveedor(prov)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Formulario (Crear / Editar) */}
      <ProveedorFormDialog
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onGuardar={handleGuardarProveedor}
        proveedorAEditar={proveedorAEditar}
      />

      {/* Modal de Ficha 360° Detallada */}
      <ProveedorDetalleModal
        open={detalleModalOpen}
        onOpenChange={setDetalleModalOpen}
        proveedor={proveedorSeleccionado}
        onEditarClick={(prov) => {
          setProveedorAEditar(prov);
          setFormModalOpen(true);
        }}
      />
    </div>
  );
};

export default ProveedoresPage;
