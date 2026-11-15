import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Usuario, NuevoUsuarioPayload, UserRole } from '../types/usuarios.types';
import {
  User,
  Shield,
  Mail,
  Lock,
  Phone,
  Building,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

interface UsuarioFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (payload: NuevoUsuarioPayload, id?: string) => Promise<void>;
  usuarioAEditar?: Usuario | null;
}

const ROLES_INFO: Record<UserRole, { label: string; desc: string; color: string }> = {
  ADMINISTRADOR: {
    label: 'Administrador General',
    desc: 'Acceso total a finanzas, costos, reportes, usuarios y configuración global.',
    color: 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
  },
  SUPERVISOR: {
    label: 'Supervisor de Almacén',
    desc: 'Gestión de inventario, recepción de compras, movimientos de kardex y catálogo.',
    color: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
  },
  ALMACENERO: {
    label: 'Almacenero',
    desc: 'Gestión de inventario, entradas, salidas, conteos físicos y recepción de mercadería.',
    color: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
  },
  CAJERO: {
    label: 'Cajero / Punto de Venta',
    desc: 'Emisión de comprobantes, apertura/cierre de caja chica y cobros en POS.',
    color: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
  },
};

const SUCURSALES_PREDEFINIDAS = [
  'Sede Central - Tingo María',
  'Punto de Venta 01 - Rupa Rupa',
  'Almacén 01 - Tingo María',
  'Sucursal 02 - Castillo Grande',
];

export const UsuarioFormSheet: React.FC<UsuarioFormSheetProps> = ({
  open,
  onOpenChange,
  onGuardar,
  usuarioAEditar,
}) => {
  const esEdicion = Boolean(usuarioAEditar);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<UserRole>('CAJERO');
  const [sucursal, setSucursal] = useState(SUCURSALES_PREDEFINIDAS[0]);
  const [telefono, setTelefono] = useState('');
  const [estado, setEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setErrors({});
    if (usuarioAEditar) {
      setNombreCompleto(usuarioAEditar.nombreCompleto || '');
      setUsername(usuarioAEditar.username || '');
      setEmail(usuarioAEditar.email || '');
      setPassword(''); // Dejar en blanco en edición si no se quiere cambiar
      setRol(usuarioAEditar.rol || 'CAJERO');
      setSucursal(usuarioAEditar.sucursal || SUCURSALES_PREDEFINIDAS[0]);
      setTelefono(usuarioAEditar.telefono || '');
      setEstado(usuarioAEditar.estado || 'ACTIVO');
    } else {
      setNombreCompleto('');
      setUsername('');
      setEmail('');
      setPassword('');
      setRol('CAJERO');
      setSucursal(SUCURSALES_PREDEFINIDAS[0]);
      setTelefono('');
      setEstado('ACTIVO');
    }
  }, [usuarioAEditar, open]);

  // Autogenerar username sugerido cuando escribe el nombre (solo en creación)
  const handleNombreChange = (val: string) => {
    setNombreCompleto(val);
    if (errors.nombreCompleto) {
      setErrors((prev) => ({ ...prev, nombreCompleto: '' }));
    }
    if (!esEdicion && !username) {
      const parts = val.trim().toLowerCase().split(/\s+/);
      if (parts.length >= 2) {
        setUsername(`${parts[0]}.${parts[1]}`.replace(/[^a-z0-9.]/g, ''));
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombreCompleto.trim() || nombreCompleto.trim().length < 3) {
      newErrors.nombreCompleto = 'El nombre completo debe tener al menos 3 caracteres.';
    }

    if (!username.trim() || username.trim().length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres.';
    } else if (!/^[a-z0-9._-]+$/i.test(username.trim())) {
      newErrors.username = 'Usa solo letras, números, puntos o guiones.';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido (ej. usuario@comercio.pe).';
    }

    if (!esEdicion && (!password || password.length < 6)) {
      newErrors.password = 'La contraseña inicial debe tener al menos 6 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Corrige los campos marcados en rojo antes de guardar.');
      return;
    }

    const payload: NuevoUsuarioPayload = {
      nombreCompleto: nombreCompleto.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      rol,
      sucursal,
      telefono: telefono.trim(),
      estado,
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    setIsSubmitting(true);
    try {
      await onGuardar(payload, usuarioAEditar?.id);
      toast.success(
        esEdicion
          ? `Usuario "${payload.nombreCompleto}" actualizado correctamente.`
          : `Usuario "${payload.nombreCompleto}" registrado exitosamente.`
      );
      onOpenChange(false);
    } catch {
      // Error manejado en componente padre
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col bg-card border-l border-border select-none"
      >
        <SheetHeader className="p-5 pb-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-foreground">
                {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {esEdicion
                  ? `Modificando datos y permisos de "${usuarioAEditar?.nombreCompleto}"`
                  : 'Crea una cuenta de acceso para el personal del negocio'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Identificación Personal */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Nombre Completo</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. Juan Pérez Quispe"
                value={nombreCompleto}
                onChange={(e) => handleNombreChange(e.target.value)}
                className={`h-8 text-xs ${errors.nombreCompleto ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                required
              />
              {errors.nombreCompleto && (
                <p className="text-[11px] text-destructive mt-0.5">{errors.nombreCompleto}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Usuario (Login)</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="ej. jperez"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                    if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                  }}
                  className={`h-8 text-xs font-mono ${errors.username ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                  required
                />
                {errors.username && (
                  <p className="text-[11px] text-destructive mt-0.5">{errors.username}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Teléfono / WhatsApp</span>
                </Label>
                <Input
                  placeholder="Ej. 987654321"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Correo Electrónico</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="usuario@comercio.pe"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={`h-8 text-xs ${errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                required
              />
              {errors.email && (
                <p className="text-[11px] text-destructive mt-0.5">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{esEdicion ? 'Cambiar Contraseña (Opcional)' : 'Contraseña de Acceso'}</span>
                {!esEdicion && <span className="text-destructive">*</span>}
              </Label>
              <Input
                type="password"
                placeholder={esEdicion ? 'Dejar en blanco para no modificar' : 'Mínimo 6 caracteres'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={`h-8 text-xs ${errors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
              />
              {errors.password && (
                <p className="text-[11px] text-destructive mt-0.5">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Rol y Nivel de Acceso (Gestalt Cerramiento y Proximidad) */}
          <div className="space-y-2 pt-3 border-t border-border">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              <span>Rol Operativo</span>
              <span className="text-destructive">*</span>
            </Label>
            <Select value={rol} onValueChange={(val) => setRol(val as UserRole)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMINISTRADOR">
                  <div className="py-0.5">
                    <span className="font-semibold text-purple-700 dark:text-purple-400">
                      Administrador General
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Acceso total a finanzas, costos, reportes y configuración
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="ALMACENERO">
                  <div className="py-0.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">
                      Almacenero
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Gestión de existencias, kardex y recepción de compras
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="SUPERVISOR">
                  <div className="py-0.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">
                      Supervisor de Almacén
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Supervisión de inventario y pedidos de compra
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="CAJERO">
                  <div className="py-0.5">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      Cajero / Ventas POS
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Punto de venta y control de turno de caja
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Tarjeta descriptiva del rol */}
            <div className={`p-2.5 rounded-md border text-xs ${ROLES_INFO[rol].color}`}>
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{ROLES_INFO[rol].label}</span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">{ROLES_INFO[rol].desc}</p>
            </div>
          </div>

          {/* Sucursal y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sucursal Asignada</span>
              </Label>
              <Select value={sucursal} onValueChange={setSucursal}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {SUCURSALES_PREDEFINIDAS.map((suc) => (
                    <SelectItem key={suc} value={suc} className="text-xs">
                      {suc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Estado de Cuenta</Label>
              <Select value={estado} onValueChange={(val) => setEstado(val as 'ACTIVO' | 'INACTIVO')}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO" className="text-xs font-medium text-emerald-600">
                    ● Activo
                  </SelectItem>
                  <SelectItem value="INACTIVO" className="text-xs font-medium text-muted-foreground">
                    ○ Inactivo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <SheetFooter className="p-4 border-t border-border bg-muted/10 shrink-0 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-8 text-xs border-border"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-8 text-xs bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-4 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : esEdicion ? (
              'Guardar Cambios'
            ) : (
              'Crear Usuario'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
