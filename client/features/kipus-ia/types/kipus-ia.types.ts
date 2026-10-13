export interface ChatAction {
  label: string;
  path?: string;
  query?: string;
  variant?: 'primary' | 'outline' | 'secondary';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  dataPoints?: { label: string; value: string; badge?: string }[];
  actions?: ChatAction[];
  category?: 'STOCK' | 'FINANZAS' | 'VENTAS' | 'CLIENTES' | 'ANALISIS' | 'AYUDA';
  statusNote?: string;
}

export interface InsightPredictivo {
  id: string;
  tipo: 'STOCK' | 'FINANZAS' | 'CLIENTE' | 'VENTAS';
  titulo: string;
  descripcion: string;
  accionSugerida: string;
  querySugerida?: string;
}
