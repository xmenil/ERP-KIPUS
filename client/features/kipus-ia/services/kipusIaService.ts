import { apiClient } from '@/services/api/apiClient';
import { ChatMessage, InsightPredictivo } from '../types/kipus-ia.types';

export const kipusIaService = {
  /**
   * Obtiene los insights predictivos automáticos sobre inventario, caja y clientes
   */
  async getInsights(): Promise<InsightPredictivo[]> {
    const data = await apiClient.get<InsightPredictivo[]>('/ia/insights');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Envía una consulta en lenguaje natural al asistente KIPU'S IA
   */
  async responderConsulta(pregunta: string): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>('/ia/chat', { pregunta });
  },
};
