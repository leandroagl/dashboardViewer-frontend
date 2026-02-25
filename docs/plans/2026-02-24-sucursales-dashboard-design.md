# Diseño: Dashboard Sucursales

**Fecha:** 2026-02-24
**Estado:** Aprobado

## Contexto

El grupo "Sucursales" existe dentro del grupo "Networking" en PRTG. Cada sucursal es un dispositivo PRTG con uno o más sensores de ping que miden la conectividad VPN hacia el router principal del cliente. Este dashboard permite al usuario final identificar de un vistazo qué puntos de venta tienen conectividad activa y cuáles están caídos.

Un cliente típico puede tener 16 o más sucursales, por lo que el diseño debe escalar bien.

## Arquitectura

### Backend

**Fuente de datos:** Mismo `prtgGroup` que el dashboard de Networking. La función `getSucursalesDashboard(prtgGroup, extraProbes)` reutiliza `getSensorsByGroup()` y filtra sensores cuyo leaf group coincide con `/^sucursales?$/i`.

Los sensores se agrupan por `device` (nombre del dispositivo en PRTG = nombre de la sucursal). El status del dispositivo es el peor status de sus sensores.

**Resultado ordenado:** offline/error primero, luego online.

**Interfaces:**
```typescript
export interface SucursalDevice {
  name:    string;        // device name en PRTG
  status:  SensorStatus;  // ok | warning | error | paused | unknown
  latency: string | null; // lastvalue del sensor ping (ej: "12.5 ms") o null si está caído
  message: string;        // mensaje PRTG del sensor de ping
}

export interface SucursalesDashboard {
  sucursales:   SucursalDevice[];
  onlineCount:  number;
  offlineCount: number;
  alerts:       { name: string; message: string; status: SensorStatus }[];
}
```

**Caché:** 55s TTL (igual que los otros dashboards).

**Ruta nueva:** `GET /:clientSlug/dashboards/sucursales`

### Frontend

**Nuevo DashboardType:** `'sucursales'` en `models/index.ts`.

**Nuevo servicio:** `DashboardService.getSucursales(slug): Observable<SucursalesDashboard>`.

**Nueva ruta:** `/dashboard/:slug/dashboards/sucursales` → `SucursalesPageComponent`.

## Diseño visual

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  PAGE HEADER: "Sucursales" + icon: location_city                    │
│  Subtitle: "Conectividad VPN de puntos de venta"                    │
├───────────┬───────────────┬───────────────┬─────────────────────────┤
│  KPI      │  KPI          │  KPI          │  KPI                    │
│  Total    │  En línea ✅  │  Sin conex ❌  │  % conectividad         │
├───────────┴───────────────┴───────────────┴─────────────────────────┤
│  GRID: repeat(auto-fill, minmax(160px, 1fr))                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │● OFFLINE│  │● OFFLINE│  │● online │  │● online │  │● online │  │
│  │  wifi_  │  │  wifi_  │  │  loc_   │  │  loc_   │  │  loc_   │  │
│  │  off    │  │  off    │  │  on     │  │  on     │  │  on     │  │
│  │SUC CEN  │  │SUC NORTE│  │ SUC SUR │  │SUC ESTE │  │SUC OESTE│  │
│  │   ---   │  │   ---   │  │  12ms   │  │   8ms   │  │  15ms   │  │
│  │msg PRTG │  │msg PRTG │  │msg PRTG │  │msg PRTG │  │msg PRTG │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│  ...más tarjetas...                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Tarjeta de sucursal

**Dimensiones:** ~160px min-width, altura fija ~140px. Compact, uniforme.

**Estado ONLINE (ok):**
- Borde izquierdo: `3px solid var(--status-ok)`
- Background: tinte verde muy sutil (`rgba(var(--status-ok-rgb), 0.06)`)
- Dot (esquina superior derecha): 10px, verde con glow, color `var(--status-ok)`
- Ícono central: `location_on` (Material Icons)
- Latencia: `12 ms` en monospace, color `var(--text-primary)`
- Mensaje PRTG: truncado, `var(--text-secondary)`

**Estado OFFLINE (error/unknown):**
- Borde izquierdo: `3px solid var(--status-error)`
- Background: tinte rojizo sutil (`rgba(var(--status-error-rgb), 0.08)`)
- Dot: 10px, rojo, con animación `pulse` (keyframes: opacidad + scale)
- Ícono central: `wifi_off` o `signal_disconnected`
- Latencia: `---` (no disponible)
- Mensaje PRTG: truncado, color `var(--status-error)`

**Estado WARNING:**
- Borde izquierdo: `3px solid var(--status-warning)`
- Dot: amarillo, sin pulso
- Ícono: `wifi_find`

### KPI Strip

| KPI | Valor | Status |
|-----|-------|--------|
| Total | `sucursales.length` | `ok` |
| En línea | `onlineCount` | `onlineCount === total ? 'ok' : 'ok'` |
| Sin conexión | `offlineCount` | `offlineCount > 0 ? 'error' : 'ok'` |
| Conectividad | `(onlineCount/total * 100)\|number:'1.0-0'` + `%` | según % |

### Empty States

- Sin sucursales detectadas → `<mat-icon>info</mat-icon> Sin sucursales configuradas`
- Loading → skeleton cards (3 filas de 4 rectángulos)

## Comportamiento

- **Orden:** Offline/error primero (sorted en backend por status).
- **Auto-refresh:** 60s (heredado de `BaseDashboardPage`).
- **Sin panel de alertas:** La información crítica ya está en las tarjetas + KPIs. Las alertas PRTG se incluyen en el objeto de respuesta pero no se muestran en panel separado (pueden usarse en el futuro).
- **Responsive:** Grid auto-fill colapsa naturalmente en tablets/mobile.

## Archivos a crear/modificar

### Backend (`e:\develop\dashboardViewer-backend`)
- `src/modules/dashboards/dashboards.service.ts` — añadir `SucursalDevice`, `SucursalesDashboard`, `getSucursalesDashboard()`
- `src/modules/dashboards/dashboards.controller.ts` — añadir `getSucursales()`
- `src/modules/dashboards/dashboards.router.ts` — añadir `GET /sucursales`

### Frontend (`e:\develop\dashboardViewer-frontend`)
- `src/app/core/models/index.ts` — añadir tipos + `'sucursales'` a `DashboardType`
- `src/app/core/services/dashboard.service.ts` — añadir `getSucursales()`
- `src/app/modules/dashboard/pages/sucursales/sucursales-page.component.ts`
- `src/app/modules/dashboard/pages/sucursales/sucursales-page.component.html`
- `src/app/modules/dashboard/pages/sucursales/sucursales-page.component.scss`
- `src/app/modules/dashboard/dashboard.module.ts` — declarar componente + ruta
