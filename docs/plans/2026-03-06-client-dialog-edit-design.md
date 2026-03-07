# Design: Fix edición de clientes en panel admin

## Problema

Dos bugs en el panel admin → Clientes:

1. **Dialog de edición vacío**: `ClientDialogComponent` no inyecta `MAT_DIALOG_DATA`, por lo que ignora el cliente que se le pasa al abrir en modo edición. El formulario siempre aparece vacío y siempre llama a `service.create()`.

2. **Cliente ONDRA editable**: El cliente ONDRA (slug `ondra`, creado por seed como cliente del superadmin) muestra el menú de acciones igual que cualquier cliente, permitiendo editarlo, desactivarlo o eliminarlo.

## Solución

### Fix 1: `ClientDialogComponent` dual-mode (crear / editar)

Inyectar `MAT_DIALOG_DATA` y detectar si viene un cliente en los datos:

- **Modo creación** (sin data): comportamiento actual. Título "Nuevo cliente", todos los campos editables, botón "Crear cliente", llama `service.create()`.
- **Modo edición** (con `data.client`): pre-llenar form con los valores del cliente, deshabilitar el campo `slug` (no modificable), título "Editar cliente", botón "Guardar cambios", llama `service.update(id, { nombre, prtg_group })`.

El slug se excluye del payload de PATCH (solo `nombre` y `prtg_group` son editables).

### Fix 2: Protección del cliente ONDRA

En `clients-page.component.html`, para filas donde `c.slug === 'ondra'`:
- Ocultar el botón de menú tres puntos
- Mostrar un chip de texto "Sistema" que indique visualmente que es el cliente interno no modificable

## Archivos

| Archivo | Cambio |
|---------|--------|
| `src/app/modules/admin/pages/clients/client-dialog.component.ts` | Inyectar `MAT_DIALOG_DATA`, dual-mode crear/editar |
| `src/app/modules/admin/pages/clients/clients-page.component.html` | Ocultar menú y mostrar badge "Sistema" para slug `ondra` |
| `src/app/modules/admin/pages/clients/clients-page.component.scss` | Estilo del badge "Sistema" |

Sin cambios en el backend (`service.update()` ya existe).
