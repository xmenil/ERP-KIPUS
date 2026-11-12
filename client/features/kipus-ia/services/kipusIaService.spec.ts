import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kipusIaService } from './kipusIaService';
import { apiClient } from '@/services/api/apiClient';
import { ChatMessage, InsightPredictivo } from '../types/kipus-ia.types';

describe('Kipus-IA Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene insights predictivos llamando a GET /ia/insights', async () => {
    const mockInsights: InsightPredictivo[] = [
      {
        id: 'in-1',
        tipo: 'STOCK',
        titulo: 'Alerta de Stock Crítico',
        descripcion: 'Quedan 2 unidades de Aceite Primor 900ml.',
        accionSugerida: 'Generar orden de compra urgente.',
        querySugerida: '¿Qué productos debo reabastecer hoy?',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockInsights);

    const res = await kipusIaService.getInsights();
    expect(getSpy).toHaveBeenCalledWith('/ia/insights');
    expect(res).toHaveLength(1);
    expect(res[0].tipo).toBe('STOCK');
  });

  it('permite consultar al asistente inteligente KIPU\'S IA enviando POST /ia/chat', async () => {
    const mockChatResponse: ChatMessage = {
      id: 'msg-1',
      sender: 'assistant',
      content: 'El saldo actual en efectivo en la caja chica es de S/ 250.00 con arqueo conforme.',
      timestamp: '2026-11-12T11:00:00.000Z',
      category: 'FINANZAS',
      dataPoints: [
        { label: 'Saldo Esperado', value: 'S/ 250.00', badge: 'Conforme' },
      ],
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockChatResponse);

    const res = await kipusIaService.responderConsulta('¿Cuál es el saldo actual de la caja?');
    expect(postSpy).toHaveBeenCalledWith('/ia/chat', { pregunta: '¿Cuál es el saldo actual de la caja?' });
    expect(res.sender).toBe('assistant');
    expect(res.category).toBe('FINANZAS');
    expect(res.dataPoints).toHaveLength(1);
  });
});

