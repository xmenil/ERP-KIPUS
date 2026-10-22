import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Venta } from '@/features/ventas/types/ventas.types';
import type { Cliente } from '../types/clientes.types';
import { formatCurrency } from '@/utils/formatters';
import { normalizarDocumentoCliente } from '../utils/clienteValidation';

export function ClienteDetalleDialog({ cliente, ventas, cargandoVentas = false, errorVentas = '', onClose, onEditar }: {
  cliente: Cliente | null;
  ventas: Venta[];
  cargandoVentas?: boolean;
  errorVentas?: string;
  onClose: () => void;
  onEditar: (cliente: Cliente) => void;
}) {
  if (!cliente) return null;
  const documento = normalizarDocumentoCliente(cliente.numeroDocumento);
  const ventasCliente = ventas.filter(v => normalizarDocumentoCliente(v.clienteDocumento) === documento);
  return <Dialog open={!!cliente} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader className="text-left">
        <DialogTitle className="text-lg font-semibold">Ficha del cliente</DialogTitle>
        <DialogDescription>Directorio y comprobantes asociados al documento guardado en cada venta.</DialogDescription>
      </DialogHeader>
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">Nombre o razón social</p><p className="text-sm font-medium">{cliente.nombre}</p></div>
          <div><p className="text-xs text-muted-foreground">Documento</p><p className="font-mono text-sm">{cliente.documentoTipo} · {cliente.numeroDocumento}</p></div>
          <div><p className="text-xs text-muted-foreground">Teléfono</p><p className="text-sm">{cliente.telefono && cliente.telefono !== '-' ? cliente.telefono : 'Sin teléfono'}</p></div>
          <div><p className="text-xs text-muted-foreground">Correo</p><p className="text-sm">{cliente.correo && cliente.correo !== '-' ? cliente.correo : 'Sin correo'}</p></div>
          <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Dirección</p><p className="text-sm">{cliente.direccion && cliente.direccion !== 'Mostrador Tienda' ? cliente.direccion : 'Sin dirección'}</p></div>
        </section>
        <section className="space-y-2">
          <div className="flex items-center justify-between"><h3 className="text-base font-medium">Ventas del directorio</h3><span className="text-xs text-muted-foreground">{ventasCliente.length} comprobantes</span></div>
          {errorVentas ? <p role="alert" className="rounded-md border border-destructive bg-danger-soft p-3 text-sm text-danger-text">{errorVentas}</p>
            : cargandoVentas ? <p className="rounded-md border border-border px-3 py-5 text-sm text-muted-foreground">Cargando comprobantes…</p>
            : ventasCliente.length ? <div className="max-h-60 overflow-auto rounded-md border border-border">
            <table className="w-full text-sm"><thead className="sticky top-0 bg-muted text-left"><tr><th className="px-3 py-2 font-medium">Fecha</th><th className="px-3 py-2 font-medium">Comprobante</th><th className="px-3 py-2 font-medium">Datos históricos</th><th className="px-3 py-2 text-right font-medium">Total</th></tr></thead>
              <tbody>{ventasCliente.map(v => <tr key={v.id} className="border-t border-border"><td className="px-3 py-2 whitespace-nowrap">{v.fecha}</td><td className="px-3 py-2 font-mono">{v.serieCorrelativo}</td><td className="px-3 py-2">{v.clienteNombre} · {v.clienteDocumento}</td><td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrency(v.total)}</td></tr>)}</tbody>
            </table>
          </div> : <p className="rounded-md border border-dashed border-border px-3 py-5 text-sm text-muted-foreground">Aún no hay ventas registradas con este documento.</p>}
        </section>
        <p className="text-xs text-muted-foreground">Los saldos y acumulados heredados de la ficha demo no están conciliados; esta pantalla muestra los comprobantes guardados, no un estado de cuenta.</p>
      </div>
      <div className="flex justify-end"><Button variant="outline" className="h-11 sm:h-9" onClick={() => onEditar(cliente)}>Editar datos de contacto</Button></div>
    </DialogContent>
  </Dialog>;
}
