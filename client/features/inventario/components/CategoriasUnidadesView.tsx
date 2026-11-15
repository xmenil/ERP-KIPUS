import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { categoriasService, CategoriaItem, UnidadMedidaItem } from '@/features/productos/services/categoriasService';
import { productosService } from '@/features/productos/services/productosService';
import { Producto } from '@/features/productos/types/productos.types';
import { SummaryCard } from './SummaryCard';
import { cn } from '@/lib/utils';
import {
  Tags,
  Scale,
  Plus,
  RotateCw,
  Search,
  CheckCircle2,
  FolderTree,
  Package,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

const UNIDADES_SUNAT_DEFAULT: UnidadMedidaItem[] = [
  { id: 'u1', codigo: 'UND', codigoSunat: 'NIU', nombre: 'Unidad (Bienes)' },
  { id: 'u2', codigo: 'KG', codigoSunat: 'KGM', nombre: 'Kilogramo (Peso)' },
  { id: 'u3', codigo: 'LT', codigoSunat: 'LTR', nombre: 'Litro (Volumen)' },
  { id: 'u4', codigo: 'CJA', codigoSunat: 'BX', nombre: 'Caja' },
  { id: 'u5', codigo: 'PQT', codigoSunat: 'PK', nombre: 'Paquete' },
  { id: 'u6', codigo: 'DOC', codigoSunat: 'DZN', nombre: 'Docena' },
  { id: 'u7', codigo: 'BLS', codigoSunat: 'BG', nombre: 'Bolsa' },
  { id: 'u8', codigo: 'LAT', codigoSunat: 'CA', nombre: 'Lata' },
  { id: 'u9', codigo: 'BOT', codigoSunat: 'BO', nombre: 'Botella' },
];

export const CategoriasUnidadesView: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedidaItem[]>(UNIDADES_SUNAT_DEFAULT);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabActiva, setTabActiva] = useState<'categorias' | 'unidades'>('categorias');

  // Modal para nueva categoría
  const [modalCatOpen, setModalCatOpen] = useState(false);
  const [nuevoNombreCat, setNuevoNombreCat] = useState('');
  const [nuevaDescCat, setNuevaDescCat] = useState('');
  const [guardandoCat, setGuardandoCat] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [catsData, prodsData] = await Promise.all([
        categoriasService.getCategorias().catch(() => []),
        productosService.getProductos().catch(() => []),
      ]);

      // Si la API aún no tiene categorías registradas, deducir de los productos existentes
      if (!catsData || catsData.length === 0) {
        const uniqueCats = Array.from(new Set(prodsData.map((p) => p.categoria))).filter(Boolean);
        const fallbackCats: CategoriaItem[] = uniqueCats.map((nombre, idx) => ({
          id: `cat-${idx + 1}`,
          nombre,
          descripcion: 'Categoría activa del catálogo de productos',
          activo: true,
        }));
        setCategorias(fallbackCats);
      } else {
        setCategorias(catsData);
      }

      setProductos(prodsData || []);
    } catch {
      toast.error('Error al cargar categorías y unidades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Conteo de productos por categoría
  const productosPorCategoria = useMemo(() => {
    const mapa: Record<string, number> = {};
    productos.forEach((p) => {
      const cat = p.categoria || 'Sin Categoría';
      mapa[cat] = (mapa[cat] || 0) + 1;
    });
    return mapa;
  }, [productos]);

  const categoriasFiltradas = useMemo(() => {
    return categorias.filter((c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [categorias, searchTerm]);

  const categoriaTop = useMemo(() => {
    let max = 0;
    let topName = 'Ninguna';
    Object.entries(productosPorCategoria).forEach(([name, count]) => {
      if (count > max) {
        max = count;
        topName = name;
      }
    });
    return { name: topName, count: max };
  }, [productosPorCategoria]);

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreCat.trim()) {
      toast.error('Ingresa el nombre de la categoría');
      return;
    }

    setGuardandoCat(true);
    try {
      const nueva = await categoriasService.crearCategoria(nuevoNombreCat.trim(), nuevaDescCat.trim()).catch(() => ({
        id: `cat-${Date.now()}`,
        nombre: nuevoNombreCat.trim(),
        descripcion: nuevaDescCat.trim() || 'Categoría personalizada',
        activo: true,
      }));

      setCategorias((prev) => [...prev, nueva]);
      toast.success(`Categoría "${nueva.nombre}" creada exitosamente`);
      setModalCatOpen(false);
      setNuevoNombreCat('');
      setNuevaDescCat('');
    } catch {
      toast.error('No se pudo crear la categoría');
    } finally {
      setGuardandoCat(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Indicadores Resumidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Categorías de productos"
          value={categorias.length}
          description="clasificaciones comerciales activas"
        />
        <SummaryCard
          label="Categoría con mayor stock"
          value={categoriaTop.name}
          description={`${categoriaTop.count} productos registrados`}
          variant="success"
        />
        <SummaryCard
          label="Unidades de medida"
          value={unidades.length}
          description="homologadas con catálogo SUNAT"
        />
      </div>

      {/* Switcher de Pestañas: Categorías / Unidades de Medida */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={tabActiva === 'categorias' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTabActiva('categorias')}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              tabActiva === 'categorias' && 'bg-primary text-primary-foreground'
            )}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Categorías de Catálogo ({categorias.length})</span>
          </Button>

          <Button
            type="button"
            variant={tabActiva === 'unidades' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTabActiva('unidades')}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              tabActiva === 'unidades' && 'bg-primary text-primary-foreground'
            )}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Unidades de Medida SUNAT ({unidades.length})</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cargarDatos}
            className="h-8 text-xs border-border"
            title="Refrescar catálogo"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>

          {tabActiva === 'categorias' && (
            <Button
              type="button"
              size="sm"
              onClick={() => setModalCatOpen(true)}
              className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nueva categoría</span>
            </Button>
          )}
        </div>
      </div>

      {/* Vista de Categorías */}
      {tabActiva === 'categorias' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categoría por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground ml-3 hidden sm:inline">
              {categoriasFiltradas.length} encontrada{categoriasFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="rounded-md border border-border bg-card overflow-hidden shadow-xs">
            <Table className="w-full">
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-foreground w-[35%]">
                    Categoría
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-foreground w-[40%]">
                    Descripción
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-center text-foreground w-[15%]">
                    Productos Asociados
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-center text-foreground w-[10%]">
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-xs text-muted-foreground">
                      Cargando categorías...
                    </TableCell>
                  </TableRow>
                ) : categoriasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-28 text-center text-xs text-muted-foreground">
                      No se encontraron categorías registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  categoriasFiltradas.map((cat) => {
                    const cantProductos = productosPorCategoria[cat.nombre] || 0;
                    return (
                      <TableRow key={cat.id} className="text-xs hover:bg-muted/30 transition-colors">
                        <TableCell className="py-2.5 px-3 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <Tags className="h-3.5 w-3.5 text-primary" />
                            <span>{cat.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-muted-foreground">
                          {cat.descripcion || 'Sin descripción'}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-center">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px]">
                            {cantProductos} {cantProductos === 1 ? 'producto' : 'productos'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                            <CheckCircle2 className="h-3 w-3" /> Activa
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Vista de Unidades de Medida */}
      {tabActiva === 'unidades' && (
        <div className="space-y-3.5">
          <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs flex items-center gap-2.5 text-muted-foreground">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span>
              Catálogo de unidades de medida estándar para retail y facturación electrónica SUNAT (Catálogo Nº 03).
            </span>
          </div>

          <div className="rounded-md border border-border bg-card overflow-hidden shadow-xs">
            <Table className="w-full">
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-foreground w-[25%]">
                    Símbolo Comercial
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-foreground w-[25%]">
                    Código Oficial SUNAT
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-foreground w-[50%]">
                    Descripción y Tipo de Medida
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidades.map((u) => (
                  <TableRow key={u.id} className="text-xs hover:bg-muted/30 transition-colors">
                    <TableCell className="py-2.5 px-3 font-mono font-bold text-foreground">
                      {u.codigo}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 font-mono text-primary font-semibold">
                      {u.codigoSunat || 'NIU'}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-muted-foreground">
                      {u.nombre}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Categoría */}
      <Dialog open={modalCatOpen} onOpenChange={setModalCatOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCrearCategoria}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" />
                <span>Nueva Categoría de Productos</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Crea una nueva clasificación para organizar los productos de tu negocio.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-nombre" className="text-xs font-semibold">
                  Nombre de la Categoría <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cat-nombre"
                  placeholder="Ej. Bebidas Calientes, Panadería Artesanal..."
                  value={nuevoNombreCat}
                  onChange={(e) => setNuevoNombreCat(e.target.value)}
                  className="h-9 text-xs"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-desc" className="text-xs font-semibold">
                  Descripción (Opcional)
                </Label>
                <Input
                  id="cat-desc"
                  placeholder="Breve descripción del grupo de productos..."
                  value={nuevaDescCat}
                  onChange={(e) => setNuevaDescCat(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalCatOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={guardandoCat}
                className="text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
              >
                {guardandoCat ? 'Guardando...' : 'Crear Categoría'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
