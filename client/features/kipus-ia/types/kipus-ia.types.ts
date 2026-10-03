export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  dataPoints?: { label: string; value: string }[];
}

export interface InsightPredictivo {
  id: string;
  tipo: 'STOCK' | 'FINANZAS' | 'CLIENTE';
  titulo: string;
  descripcion: string;
  accionSugerida: string;
}
