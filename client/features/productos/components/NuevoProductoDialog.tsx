import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { NuevoProductoPayload } from '../types/productos.types';

const nuevoProductoSchema = z.object({
  sku: z.string().trim().optional(),
  nombre: z
    .string({ required_error: 'Ingresa la descripción del producto' })
    .trim()
    .min(3, 'La descripción debe tener al menos 3 caracteres'),
  categoria: z
    .string({ required_error: 'Selecciona una categoría' })
    .min(1, 'Selecciona una categoría'),
  precioCompra: z.coerce
    .number({ invalid_type_error: 'Ingresa un precio de costo válido' })
    .min(0, 'El precio de costo no puede ser negativo'),
  precioVenta: z.coerce
    .number({ invalid_type_error: 'Ingresa un precio de venta válido' })
    .gt(0, 'El precio de venta debe ser mayor a S/ 0.00'),
  stock: z.coerce
    .number({ invalid_type_error: 'Ingresa una cantidad válida' })
    .min(0, 'El stock inicial no puede ser negativo'),
  stockMinimo: z.coerce
    .number({ invalid_type_error: 'Ingresa el stock mínimo' })
    .min(1, 'El stock mínimo de alerta debe ser al menos 1'),
  unidadMedida: z
    .string({ required_error: 'Selecciona la unidad de medida' })
    .min(1, 'Selecciona la unidad de medida'),
});

type FormValues = z.infer<typeof nuevoProductoSchema>;

interface NuevoProductoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductoCreado: (payload: NuevoProductoPayload) => Promise<void>;
}

const DEFAULT_VALUES: FormValues = {
  sku: '',
  nombre: '',
  categoria: 'Lubricantes',
  precioCompra: 0,
  precioVenta: 0,
  stock: 10,
  stockMinimo: 5,
  unidadMedida: 'UNIDAD',
};

export const NuevoProductoDialog: React.FC<NuevoProductoDialogProps> = ({
  open,
  onOpenChange,
  onProductoCreado,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(nuevoProductoSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });

  const { isSubmitting } = form.formState;

  const handleSubmit = async (values: FormValues) => {
    try {
      await onProductoCreado({
        sku: values.sku?.trim() || `SKU-${Date.now().toString().slice(-5)}`,
        nombre: values.nombre.trim(),
        categoria: values.categoria,
        precioCompra: Number(values.precioCompra),
        precioVenta: Number(values.precioVenta),
        stock: Number(values.stock),
        stockMinimo: Number(values.stockMinimo),
        unidadMedida: values.unidadMedida,
      });
      form.reset(DEFAULT_VALUES);
      onOpenChange(false);
    } catch {
      // El error se maneja con toast en el handler padre
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset(DEFAULT_VALUES);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Nuevo producto o servicio
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ingresa los datos comerciales, precios de venta y límites de stock del artículo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">
                      Código SKU <span className="text-muted-foreground font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. REP-001"
                        className="h-9 font-mono text-base md:text-sm"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Categoría</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-base md:text-sm">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Lubricantes">Lubricantes</SelectItem>
                        <SelectItem value="Filtros">Filtros</SelectItem>
                        <SelectItem value="Frenos">Frenos</SelectItem>
                        <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                        <SelectItem value="Químicos">Químicos</SelectItem>
                        <SelectItem value="Encendido">Encendido</SelectItem>
                        <SelectItem value="Servicios">Servicios / M.O.</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Descripción del producto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Aceite Shell Helix 20W-50 Multigrado"
                      className="h-9 text-base md:text-sm"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="precioCompra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Precio de costo (S/)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        className="h-9 text-base md:text-sm tabular-nums"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precioVenta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Precio de venta (S/)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        className="h-9 text-base md:text-sm font-medium tabular-nums"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Stock inicial</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        className="h-9 text-base md:text-sm text-center tabular-nums"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stockMinimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Stock mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        className="h-9 text-base md:text-sm text-center tabular-nums"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidadMedida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">U. Medida</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-base md:text-sm">
                          <SelectValue placeholder="Unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UNIDAD">Unidad</SelectItem>
                        <SelectItem value="GALON">Galón</SelectItem>
                        <SelectItem value="JUEGO">Juego</SelectItem>
                        <SelectItem value="KILO">Kilo</SelectItem>
                        <SelectItem value="LITRO">Litro</SelectItem>
                        <SelectItem value="PAQUETE">Paquete</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Guardando producto…</span>
                  </>
                ) : (
                  'Guardar producto'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
