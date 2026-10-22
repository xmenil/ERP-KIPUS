import { useCallback, useEffect, useRef, useState } from 'react';
import { createLatestRequest } from '@/lib/latestRequest';
import { subscribeToErp } from '@/services/erp/erpStore';

/** Una sola consulta por notificación; descarta respuestas antiguas y desmontadas. */
export function useErpQuery<T>(load: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requests = useRef(createLatestRequest());
  const refresh = useCallback(async () => {
    const request = requests.current.begin();
    setLoading(true);
    setError('');
    try {
      const result = await load();
      if (requests.current.isCurrent(request)) setData(result);
    } catch (cause) {
      if (requests.current.isCurrent(request)) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la lista. Inténtalo de nuevo.');
    } finally {
      if (requests.current.isCurrent(request)) setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeToErp(() => { void refresh(); });
    return () => { requests.current.invalidate(); unsubscribe(); };
  }, [refresh]);
  return { data, loading, error, refresh };
}
