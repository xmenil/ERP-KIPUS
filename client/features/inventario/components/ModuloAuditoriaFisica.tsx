import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ItemStockDetalle, AjusteAuditoriaPayload } from '../types/inventario.types';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface ModuloAuditoriaFisicaProps {
  productos: ItemStockDetalle[];
  onAjustar: (payload: AjusteAuditoriaPayload) => Promise<void>;
  almacenActual?: string;
}

export const ModuloAuditoriaFisica: React.FC<ModuloAuditoriaFisicaProps> = ({
  productos,
  onAjustar,
  almacenActual = 'Almacén Principal (Sede Central)',
}) => {
  // Estado local para los conteos ingresados
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  const handleConteoChange = (id: string, val: number) => {
    setConteos((prev) => ({
      ...prev,
      [id]: Math.max(0, val),
    }));
  };

  const handleAjustarFila = async (prod: ItemStockDetalle) => {
    const fisico = conteos[prod.id] !== undefined ? conteos[prod.id] : prod.stock;
    const diferencia = fisico - prod.stock;

    if (diferencia === 0) {
      toast.info(`El conteo de ${prod.nombre} coincide con el sistema (sin diferencia).`);
      return;
    }

    setGuardandoId(prod.id);
    try {
      await onAjustar({
        productoId: prod.id,
        stockReal: fisico,
        motivo:
          diferencia < 0
            ? 'Merma / faltante detectado en recuento físico'
            : 'Sobrante detectado en recuento físico',
        almacen: almacenActual,
      });

      toast.success(
        `Ajuste aplicado: ${prod.nombre} actualizado a ${fisico} unid. en Kardex`
      );

      // Limpiar conteo local para este producto
      setConteos((prev) => {
        const copy = { ...prev };
        delete copy[prod.id];
        return copy;
      });
    } catch {
      toast.error('No se pudo guardar el ajuste de auditoría');
    } finally {
      setGuardandoId(null);
    }
  };

  const filtered = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Explicación amigable para pequeños negocios */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          <span>Hoja de Recuento Físico y Auditoría de Tienda</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Recorre tus estantes con tu celular o libreta: escribe en la columna <strong>"Conteo Físico Real"</strong> cuántas unidades tienes físicamente en la mano. Si la computadora dice una cantidad distinta, el sistema calculará la diferencia y podrás aplicar el ajuste al Kardex con un solo clic.
        </p>
      </div>

      {/* Buscador */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto por nombre, SKU o estante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <span className="text-xs text-muted-foreground font-medium">
          {filtered.length} artículos en lista de cotejo
        </span>
      </div>

      {/* Tabla interactiva de conteo */}
      <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold py-2.5 w-24">SKU</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Producto & Ubicación</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-center">Stock en Sistema</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-center w-36">Conteo Físico Real</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-center">Diferencia</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-right">Impacto en Costo</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-right w-36">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                  No se encontraron productos para auditar.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((prod) => {
                const fisico =
                  conteos[prod.id] !== undefined ? conteos[prod.id] : prod.stock;
                const diferencia = fisico - prod.stock;
                const impactoSoles = diferencia * prod.precioCompra;
                const modificado = conteos[prod.id] !== undefined && diferencia !== 0;

                return (
                  <TableRow
                    key={prod.id}
                    className={`text-xs transition-colors border-b border-border/70 ${
                      modificado
                        ? 'bg-amber-50/40 dark:bg-amber-950/20'
                        : 'hover:bg-muted/20'
                    }`}
                  >
                    <TableCell className="font-mono text-muted-foreground font-medium py-2.5">
                      {prod.sku}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <span className="font-semibold text-foreground block text-[13px]">
                        {prod.nombre}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {prod.ubicacion} · {prod.unidadMedida}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 text-center font-mono font-bold text-foreground text-sm tabular-nums">
                      {prod.stock}
                    </TableCell>

                    {/* Input editable de conteo físico */}
                    <TableCell className="py-2.5 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={fisico}
                        onChange={(e) =>
                          handleConteoChange(prod.id, Number(e.target.value))
                        }
                        className={`h-8 text-xs font-mono font-bold text-center tabular-nums w-24 mx-auto ${
                          modificado
                            ? 'border-warning text-warning-text bg-warning-soft'
                            : 'bg-card'
                        }`}
                      />
                    </TableCell>

                    {/* Diferencia */}
                    <TableCell className="py-2.5 text-center">
                      {diferencia === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-success-text font-medium">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          Cuadrado (0)
                        </span>
                      ) : diferencia < 0 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-danger-soft text-danger-text border border-destructive/20 font-mono">
                          <AlertTriangle className="h-3 w-3" />
                          {diferencia} unid.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary-soft text-primary border border-primary/20 font-mono">
                          +{diferencia} unid.
                        </span>
                      )}
                    </TableCell>

                    {/* Impacto en soles */}
                    <TableCell className="py-2.5 text-right font-mono tabular-nums">
                      {diferencia === 0 ? (
                        <span className="text-muted-foreground">S/ 0.00</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            impactoSoles < 0 ? 'text-danger-text' : 'text-primary'
                          }`}
                        >
                          {impactoSoles < 0 ? '-' : '+'}S/ {Math.abs(impactoSoles).toFixed(2)}
                        </span>
                      )}
                    </TableCell>

                    {/* Botón de ajuste */}
                    <TableCell className="py-2.5 text-right">
                      <Button
                        size="sm"
                        variant={modificado ? 'default' : 'outline'}
                        disabled={!modificado || guardandoId === prod.id}
                        onClick={() => handleAjustarFila(prod)}
                        className={`h-7 px-2.5 text-xs font-medium gap-1 ${
                          modificado ? 'bg-primary text-primary-foreground font-semibold' : ''
                        }`}
                      >
                        {guardandoId === prod.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <ClipboardCheck className="h-3 w-3" />
                        )}
                        <span>{modificado ? 'Ajustar saldo' : 'Al día'}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
