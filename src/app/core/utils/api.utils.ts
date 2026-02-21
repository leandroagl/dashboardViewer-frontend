// ─── Utilidades para respuestas de la API ─────────────────────────────────────

import { ApiResponse } from '../models';

/**
 * Extrae `data` de una ApiResponse o lanza un error si está ausente.
 * Usar en lugar de `r.data!` para que los errores se propaguen al
 * handler `error` del subscribe en lugar de crashear en runtime.
 */
export function requireData<T>(r: ApiResponse<T>): T {
  if (r.data == null) throw new Error('La respuesta del servidor no contiene datos.');
  return r.data;
}
