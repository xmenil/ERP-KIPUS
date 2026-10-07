import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Venta, TipoComprobante, MetodoPago, EstadoVenta } from '../types/ventas.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Search,
  Printer,
  Eye,
  RotateCcw,
  FileText,
  Filter,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface VentasHistorialViewProps {
  ventas: Venta[];
  loading: boolean;
  onVerDetalle: (venta: Venta) => void;
  onIniciarDevolucion?: (venta: Venta) => void;
}

export const VentasHistorialView: React.FC<VentasHistorialViewProps> = ({
  ventas,
  loading,
  onVerDetalle,
  onIniciarDevolucion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroComprobante, setFiltroComprobante] = useState<string>('TODOS');
  const [filtroMetodo, setFiltroMetodo] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  const filteredVentas = ventas.filter((v) => {
    const matchSearch =
      v.serieCorrelativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.clienteDocumento.includes(searchTerm);

    const matchComp = filtroComprobante === 'TODOS' || v.tipoComprobante === filtroComprobante;
    const matchMetodo = filtroMetodo === 'TODOS' || v.metodoPago === filtroMetodo;
    const matchEstado = filtroEstado === 'TODOS' || v.estado === filtroEstado;

    return matchSearch && matchComp && matchMetodo && matchEstado;
  });

  return (
    <div className="space-y-3.5">
      {/* Barra de Filtros */}
      <Card className="border-border/80">
        <CardContent className="p-3 space-y-2.5">
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por serie, cliente, DNI o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro Comprobante */}
              <Select value={filtroComprobante} onValueChange={setFiltroComprobante}>
                <SelectTrigger className="h-8 text-xs w-32 bg-card">
                  <SelectValue placeholder="Comprobante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS" className="text-xs">Todos los docs</SelectItem>
                  <SelectItem value="BOLETA" className="text-xs">Boletas</SelectItem>
                  <SelectItem value="FACTURA" className="text-xs">Facturas</SelectItem>
                  <SelectItem value="NOTA_VENTA" className="text-xs">Notas de Venta</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Método de Pago */}
              <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
                <SelectTrigger className="h-8 text-xs w-32 bg-card">
                  <SelectValue placeholder="Medio pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS" className="text-xs">Todos los pagos</SelectItem>
                  <SelectItem value="EFECTIVO" className="text-xs">Efectivo</SelectItem>
                  <SelectItem value="YAPE" className="text-xs">Yape</SelectItem>
                  <SelectItem value="PLIN" className="text-xs">Plin</SelectItem>
                  <SelectItem value="TARJETA" className="text-xs">Tarjeta POS</SelectItem>
                  <SelectItem value="TRANSFERENCIA" className="text-xs">Transferencia</SelectItem>
                  <SelectItem value="MIXTO" className="text-xs">Pago Mixto</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Estado */}
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="h-8 text-xs w-32 bg-card">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS" className="text-xs">Todos los estados</SelectItem>
                  <SelectItem value="COMPLETADA" className="text-xs">Completada</SelectItem>
                  <SelectItem value="ANULADA" className="text-xs">Anulada</SelectItem>
                  <SelectItem value="PENDIENTE" className="text-xs">Pendiente</SelectItem>
                </SelectContent>
              </Select>

              <span className="text-xs text-muted-foreground ml-auto font-mono">
                {filteredVentas.length} registros
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla para Desktop con min-w protegido contra deformación */}
      <div className="hidden sm:block overflow-x-auto rounded border border-border bg-card shadow-2xs">
        <Table className="min-w-[880px]">
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Comprobante</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 min-w-[180px] whitespace-nowrap">Cliente / Documento</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Fecha y Hora</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Medio Pago</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Estado</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-right whitespace-nowrap">Total Cobrado</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-center w-28 whitespace-nowrap">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                  Cargando historial de ventas...
                </TableCell>
              </TableRow>
            ) : filteredVentas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                  No se encontraron ventas con los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredVentas.map((venta) => (
                <TableRow
                  key={venta.id}
                  className="text-xs hover:bg-muted/20 border-b border-border/70 transition-colors"
                >
                  <TableCell className="py-2.5 whitespace-nowrap">
                    <span className="font-mono font-semibold text-primary block text-[13px]">
                      {venta.serieCorrelativo}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {venta.tipoComprobante}
                    </span>
                  </TableCell>

                  <TableCell className="py-2.5 min-w-[180px]">
                    <span className="font-semibold text-foreground block text-[13px]">
                      {venta.clienteNombre}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Doc: {venta.clienteDocumento}
                    </span>
                  </TableCell>

                  <TableCell className="text-muted-foreground py-2.5 font-mono text-[11px] whitespace-nowrap">
                    {venta.fecha}
                  </TableCell>

                  <TableCell className="py-2.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-muted border border-border/60">
                      {venta.metodoPago}
                    </span>
                  </TableCell>

                  <TableCell className="py-2.5 whitespace-nowrap">
                    <StatusBadge
                      status={venta.estado}
                      variant={
                        venta.estado === 'COMPLETADA'
                          ? 'success'
                          : venta.estado === 'PENDIENTE'
                          ? 'warning'
                          : 'danger'
                      }
                    />
                  </TableCell>

                  <TableCell className="text-right font-semibold font-mono text-foreground py-2.5 text-sm tabular-nums whitespace-nowrap">
                    {formatCurrency(venta.total)}
                  </TableCell>

                  <TableCell className="text-center py-2.5 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVerDetalle(venta)}
                        className="h-7 w-7 p-0"
                        title="Ver detalle del comprobante"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info(`Imprimiendo comprobante ${venta.serieCorrelativo}...`)}
                        className="h-7 w-7 p-0"
                        title="Imprimir ticket"
                      >
                        <Printer className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Lista de Tarjetas Compactas para Móviles (Evita scroll horizontal feo) */}
      <div className="sm:hidden space-y-2">
        {filteredVentas.map((venta) => (
          <div
            key={venta.id}
            onClick={() => onVerDetalle(venta)}
            className="p-3 rounded-lg border border-border bg-card shadow-2xs space-y-2 cursor-pointer active:bg-muted/40"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-primary text-xs">
                  {venta.serieCorrelativo}
                </span>
                <span className="text-[11px] text-foreground font-semibold block mt-0.5">
                  {venta.clienteNombre}
                </span>
              </div>
              <span className="text-sm font-bold font-mono text-foreground tabular-nums">
                {formatCurrency(venta.total)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
              <span className="font-mono">{venta.fecha}</span>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-muted text-[10px] font-medium">
                  {venta.metodoPago}
                </span>
                <StatusBadge
                  status={venta.estado}
                  variant={venta.estado === 'COMPLETADA' ? 'success' : 'danger'}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
