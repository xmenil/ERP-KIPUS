import React, { useState } from 'react';
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
import { Key, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TiendaItem } from '../types/superAdmin.types';

interface CambiarPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tienda: TiendaItem | null;
  onSubmit: (id: string, newPassword: string) => Promise<void>;
}

export const CambiarPasswordModal: React.FC<CambiarPasswordModalProps> = ({
  open,
  onOpenChange,
  tienda,
  onSubmit,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!tienda) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(tienda.id, password);
      toast.success(
        `Contraseña actualizada para el dueño de "${tienda.nombreComercial}". El usuario ya puede iniciar sesión.`
      );
      setPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Restablecer Contraseña del Dueño
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Asigna una nueva clave para el administrador de la tienda.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tarjeta de contexto */}
          <div className="rounded-lg border border-border/80 bg-slate-50/70 dark:bg-muted/30 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tienda:</span>
              <span className="font-semibold text-foreground">{tienda.nombreComercial}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dueño / Admin:</span>
              <span className="font-medium text-foreground">
                {tienda.dueno?.nombreCompleto || 'Sin asignar'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Usuario login:</span>
              <span className="font-mono font-medium text-primary">
                {tienda.dueno?.username || 'admin'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-8 text-xs pr-8"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Confirmar Nueva Contraseña</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-[11px] text-destructive bg-destructive/10 p-2 rounded-md">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Actualizar Contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
