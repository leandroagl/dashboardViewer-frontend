# Design: VMware summary cards + animación scale-fade

## Cambios

### 1. Summary strip (servers-page)
- Reemplazar `.summary-strip` grid full-width por 3 `app-kpi-card` en flex layout izquierda
- Consistente con backups, networking y windows dashboards
- Eliminar clases obsoletas: `.summary-card`, `.summary-icon`, `.summary-label`, `.summary-value`, `.si-*`

### 2. Animación global
- Reemplazar `fadeInUp` (translateY) por `scaleFadeIn` (scale 0.97→1 + fade)
- Easing: `cubic-bezier(0.34, 1.10, 0.64, 1)` — leve overshoot suave
- Duración: 380ms
- Aplica a todos los dashboards vía `.fade-in-up`

## Archivos
- `src/app/modules/dashboard/pages/servers/servers-page.component.html`
- `src/app/modules/dashboard/pages/servers/servers-page.component.scss`
- `src/styles/styles.scss`
