import React from 'react';
import {
  ClientesDirectorioView,
  ClientesDirectorioViewProps,
} from '../components/ClientesDirectorioView';

export const ClientesPage: React.FC<ClientesDirectorioViewProps> = (props) => {
  return <ClientesDirectorioView {...props} />;
};

export default ClientesPage;
