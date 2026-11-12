import React, { useEffect, useRef, useState } from 'react';
import { socketClient } from './socketClient';

/**
 * Hook de React para escuchar eventos WebSocket en tiempo real.
 * Se suscribe al montar el componente y se desuscribe automáticamente al desmontar.
 *
 * @param event Nombre del canal/evento WebSocket (ej. 'stock:actualizado', 'ventas:nueva_venta')
 * @param handler Callback con la carga de datos recibida
 */
export function useSocketEvent<T = any>(event: string, handler: (data: T) => void): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsubscribe = socketClient.on<T>(event, (data) => {
      handlerRef.current(data);
    });

    return () => {
      unsubscribe();
    };
  }, [event]);
}

/**
 * Hook para conocer el estado de la conexión WebSocket (true: online/verde, false: reconectando)
 */
export function useSocketStatus(): boolean {
  const [connected, setConnected] = React.useState<boolean>(() => socketClient.isConnected());

  React.useEffect(() => {
    const unsub = socketClient.onStatusChange((status) => {
      setConnected(status);
    });
    return unsub;
  }, []);

  return connected;
}
