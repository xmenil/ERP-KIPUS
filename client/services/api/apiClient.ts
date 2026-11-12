/**
 * Cliente HTTP base para la integración con el backend REST KIPU'S ERP (NestJS + PostgreSQL).
 * Permite realizar peticiones tipadas, inyectar el Bearer Token JWT y manejar errores centralizadamente.
 */

import { AUTH_TOKEN_KEY } from '@/features/auth/services/sessionStore';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Configuración base de la URL del API
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

export interface RequestOptions extends RequestInit {
  rawResponse?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  // 1. Obtener token de autenticación (localStorage o sessionStorage)
  const token =
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    sessionStorage.getItem(AUTH_TOKEN_KEY) ||
    localStorage.getItem('kipus_auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Normalizar endpoint con slash inicial
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const { rawResponse, ...fetchOptions } = options;

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (netErr: any) {
    throw new ApiError(
      0,
      'No se pudo conectar con el servidor backend. Verifica que esté activo en el puerto 3002.',
      netErr
    );
  }

  if (!response.ok) {
    let errorMessage = response.statusText || 'Error en la petición al servidor';
    let errorDetails: any = null;

    try {
      errorDetails = await response.json();
      if (errorDetails?.message) {
        if (Array.isArray(errorDetails.message)) {
          errorMessage = errorDetails.message.join(', ');
        } else if (typeof errorDetails.message === 'string') {
          errorMessage = errorDetails.message;
        }
      }
    } catch {
      // Ignorar si la respuesta de error no es JSON
    }

    // Si el token es inválido o expiró (401)
    if (response.status === 401 && typeof window !== 'undefined') {
      if (!window.location.pathname.includes('/login')) {
        // Limpiar tokens residuales
        localStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }

    throw new ApiError(response.status, errorMessage, errorDetails);
  }

  // Si la respuesta es 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();

  if (rawResponse) {
    return json as T;
  }

  // Si el backend responde con el sobre canónico de NestJS ({ success: true, data: ... })
  if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
    return json.data as T;
  }

  return json as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
