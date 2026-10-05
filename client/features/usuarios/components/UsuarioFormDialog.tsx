import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

interface UsuarioFormDialogProps {
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
    label: 'Supervisor / Almacenero',
    desc: 'Gestión de inventario, recepción de compras, movimientos de kardex y catálogo.',
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

export const UsuarioFormDialog: React.FC<UsuarioFormDialogProps> = ({
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

  useEffect(() => {
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
    if (!esEdicion && !username) {
      const parts = val.trim().toLowerCase().split(/\s+/);
      if (parts.length >= 2) {
        setUsername(`${parts[0]}.${parts[1]}`.replace(/[^a-z0-9.]/g, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreCompleto.trim() || nombreCompleto.trim().length < 3) {
      toast.error('Ingresa el nombre completo del usuario (mínimo 3 caracteres)');
      return;
    }

    if (!username.trim() || username.trim().length < 3) {
      toast.error('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }

    if (!esEdicion && (!password || password.length < 6)) {
      toast.error('La contraseña inicial debe tener al menos 6 caracteres');
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
      onOpenChange(false);
    } catch {
      // Error manejado en componente padre
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {esEdicion ? 'Editar Usuario del Sistema' : 'Registrar Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {esEdicion
                  ? `Modificando los permisos y datos de acceso para "${usuarioAEditar?.nombreCompleto}"`
                  : 'Crea una nueva cuenta de acceso con rol operativo o directivo para tu equipo.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Nombre y Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nombre Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. Juan Pérez Quispe"
                value={nombreCompleto}
                onChange={(e) => handleNombreChange(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Nombre de Usuario (Login) <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. juan.perez o jperez"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="h-9 text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Correo y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Correo Electrónico <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="Ej. juan@kipus.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Teléfono de Contacto
              </Label>
              <Input
                placeholder="Ej. +51 987 654 321"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              {esEdicion ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
              {!esEdicion && <span className="text-destructive">*</span>}
            </Label>
            <Input
              type="password"
              placeholder={
                esEdicion
                  ? 'Dejar en blanco para mantener la contraseña actual'
                  : 'Mínimo 6 caracteres (ej. secret123)'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 text-xs"
            />
            {esEdicion && (
              <p className="text-[11px] text-muted-foreground">
                Solo escribe en este campo si deseas cambiar la contraseña de este usuario.
              </p>
            )}
          </div>

          {/* Rol y Permisos */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              Rol y Nivel de Acceso en el ERP <span className="text-destructive">*</span>
            </Label>
            <Select value={rol} onValueChange={(val) => setRol(val as UserRole)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMINISTRADOR">
                  <div className="py-0.5">
                    <span className="font-semibold text-purple-700 dark:text-purple-400">
                      Administrador General
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Acceso irrestricto a todos los módulos y costos
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="SUPERVISOR">
                  <div className="py-0.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">
                      Supervisor / Almacén
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Gestión de kardex, productos y compras
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="CAJERO">
                  <div className="py-0.5">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      Cajero / Ventas POS
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Ventas de mostrador y arqueo de caja diaria
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Tarjeta explicativa del rol seleccionado */}
            <div className={`p-2.5 rounded-lg border text-xs ${ROLES_INFO[rol].color}`}>
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{ROLES_INFO[rol].label}</span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">{ROLES_INFO[rol].desc}</p>
            </div>
          </div>

          {/* Sucursal y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Sucursal Asignada
              </Label>
              <Select value={sucursal} onValueChange={setSucursal}>
                <SelectTrigger className="h-9 text-xs">
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

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                Estado de la Cuenta
              </Label>
              <Select value={estado} onValueChange={(val) => setEstado(val as 'ACTIVO' | 'INACTIVO')}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Estado de cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO" className="text-xs font-medium text-emerald-600">
                    ● Activo (Permite iniciar sesión)
                  </SelectItem>
                  <SelectItem value="INACTIVO" className="text-xs font-medium text-muted-foreground">
                    ○ Inactivo (Acceso suspendido)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-muted/10 shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 shadow-sm"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
