import React, { useId } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Campo de búsqueda accesible y minimalista con botón de limpiar.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar por nombre o código…',
  className,
  autoFocus = false,
}) => {
  const searchId = useId();
  return (
    <div className={cn('min-w-0', className)}>
      <label
        htmlFor={searchId}
        className="mb-1 block text-xs text-muted-foreground"
      >
        Buscar producto
      </label>
      <div className="relative">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          id={searchId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-9 pr-11 h-11 md:h-9 text-base md:text-sm border-input bg-card"
          aria-label={placeholder}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="absolute right-0 top-0 h-11 w-11 md:h-9 md:w-9 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
