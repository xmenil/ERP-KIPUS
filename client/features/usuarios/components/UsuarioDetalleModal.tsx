import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Usuario } from '../types/usuarios.types';
import {
  User,
  Shield,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface UsuarioDetalleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onEditarClick: (user: Usuario) => void;
  onEliminarClick: (user: Usuario) => void;
}

const ROLES_BADGES: Record<string, { label: string; color: string; desc: string }> = {
  ADMINISTRADOR: {
    label: 'Administrador General',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    desc: 'Acceso total a finanzas, costos, reportes, usuarios y configuración global.',
  },
  SUPERVISOR: {
    label: 'Supervisor de Almacén',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    desc: 'Gestión de inventario, recepción de compras, movimientos de kardex y catálogo.',
  },
  CAJERO: {
    label: 'Cajero / Punto de Venta',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    desc: 'Emisión de comprobantes, apertura/cierre de caja chica y cobros en POS.',
  },
};

export const UsuarioDetalleModal: React.FC<UsuarioDetalleModalProps> = ({
  open,
  onOpenChange,
  usuario,
  onEditarClick,
  onEliminarClick,
}) => {
  const [copiado, setCopiado] = React.useState(false);

  if (!usuario) return null;

  const roleInfo = ROLES_BADGES[usuario.rol] || {
    label: usuario.rol,
    color: 'bg-muted text-muted-foreground border-border',
    desc: 'Permisos estándar del sistema.',
  };

  const esAdminPrincipal = usuario.id === 'user-admin';

  const handleCopiarEmail = () => {
    navigator.clipboard.writeText(usuario.email);
    setCopiado(true);
    toast.success(`Correo ${usuario.email} copiado al portapapeles`);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md flex flex-col p-0 overflow-hidden rounded-xl">
        {/* Cabecera con Avatar */}
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center shadow-sm shrink-0">
              {usuario.avatarInitials}
            </div>
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-base font-bold text-foreground truncate">
                {usuario.nombreCompleto}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">
                  @{usuario.username}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${roleInfo.color}`}
                >
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Cuerpo con Datos */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Descripción del Rol */}
          <div className="p-3 rounded-lg bg-card border border-border space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Alcance de Permisos
            </span>
            <p className="text-foreground leading-relaxed">
              {usuario.descripcion || roleInfo.desc}
            </p>
          </div>

          {/* Datos de contacto y asignación */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Correo Electrónico
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{usuario.email}</span>
                <button
                  type="button"
                  onClick={handleCopiarEmail}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                  title="Copiar correo"
                >
                  {copiado ? <Check className="h-3 w-3 text-success-text" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {usuario.telefono && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Teléfono
                </span>
                <span className="font-medium text-foreground">{usuario.telefono}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" />
                Sucursal Asignada
              </span>
              <span className="font-medium text-foreground">{usuario.sucursal}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Estado
              </span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  usuario.estado === 'ACTIVO' ? 'text-emerald-600' : 'text-muted-foreground'
                }`}
              >
                {usuario.estado === 'ACTIVO' ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Activo
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    Inactivo
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Último Acceso
              </span>
              <span className="font-mono text-foreground">{usuario.ultimoAcceso || 'Nunca'}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between sm:justify-between gap-2">
          {!esAdminPrincipal ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEliminarClick(usuario)}
              className="h-8 text-xs gap-1 text-destructive hover:bg-danger-soft border-destructive/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar Usuario</span>
            </Button>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Cuenta Administrador Principal</span>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cerrar
            </Button>
            <Button
              size="sm"
              onClick={() => onEditarClick(usuario)}
              className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Editar Usuario</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
