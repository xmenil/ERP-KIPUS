import React from 'react';
import {
  ProveedoresDirectorioView,
  ProveedoresDirectorioViewProps,
} from '@/features/compras/components/ProveedoresDirectorioView';

export const ProveedoresPage: React.FC<ProveedoresDirectorioViewProps> = (props) => {
  return <ProveedoresDirectorioView {...props} />;
};

export default ProveedoresPage;
