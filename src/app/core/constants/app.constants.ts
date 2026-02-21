// ─── app.constants.ts ─────────────────────────────────────────────────────────
// Constantes globales de la aplicación. Importar desde aquí para evitar
// valores mágicos dispersos en el código.

// ─── Dashboard – tiempos ──────────────────────────────────────────────────────

/** Intervalo de refresco automático de datos en páginas de dashboard (ms). */
export const REFRESH_INTERVAL_MS = 60_000;

/** Tiempo entre avances automáticos de dashboard en el layout fullscreen (ms). */
export const AUTO_ADVANCE_MS = 60_000;

/** Tiempo de inactividad tras el cual se ocultan los controles del layout (ms). */
export const CONTROLS_HIDE_MS = 4_000;

// ─── Snackbar – duraciones ────────────────────────────────────────────────────

/** Duración estándar para mensajes informativos / confirmaciones rápidas (ms). */
export const SNACKBAR_SHORT = 3_000;

/** Duración para mensajes de error o confirmaciones que requieren más atención (ms). */
export const SNACKBAR_LONG = 4_000;

/** Duración para mensajes que contienen datos sensibles (contraseñas) (ms). */
export const SNACKBAR_PASSWORD = 15_000;
