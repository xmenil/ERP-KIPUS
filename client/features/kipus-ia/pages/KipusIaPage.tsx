import React from 'react';
import {
  KipusIaAssistantView,
  KipusIaAssistantViewProps,
} from '@/features/reportes/components/KipusIaAssistantView';

export const KipusIaPage: React.FC<KipusIaAssistantViewProps> = (props) => {
  return <KipusIaAssistantView {...props} />;
};

export default KipusIaPage;
