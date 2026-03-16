# TreeSelect Angular 19 (sin PrimeNG)

Base inicial para implementar un `TreeSelect` propio con enfoque de producto.

## Requisitos

- Node.js `>=22.12.0`
- npm `>=10`

## Scripts principales

- `npm start`: inicia la app.
- `npm run lint`: ejecuta ESLint.
- `npm run test`: ejecuta unit tests con cobertura.
- `npm run test:coverage`: ejecuta tests con cobertura y valida umbrales mínimos.
- `npm run e2e`: ejecuta E2E visuales automáticos en una sola sesión de navegador, con `slowMo` y listado visible en consola.
- `npm run e2e:ui`: abre Playwright UI mode (interfaz interactiva; requiere pulsar Play).
- `npm run e2e:ui:slow`: abre Playwright UI con `slowMo` y ejecución secuencial para depuración visual.
- `npm run e2e:headed`: ejecuta E2E con navegador visible (automático, sin pulsar Play).
- `npm run e2e:visual:auto`: alias para ejecución visual automática.
- `npm run e2e:snapshots:update`: actualiza snapshots de regresión visual.
- `npm run verify`: corre lint + unit tests + build + E2E headed.
- `npm run benchmark`: ejecuta benchmark local para 1k/5k/10k nodos.
- `npm run build`: genera build de producción.
- `npm run format`: aplica Prettier.
- `npm run format:check`: valida formato sin modificar.

## Estructura inicial del feature

- `src/app/treeselect/models`: tipos y contratos.
- `src/app/treeselect/utils`: utilidades puras.
- `src/app/treeselect/services`: estado base del overlay/filtro.
- `src/app/treeselect/components`: UI inicial del TreeSelect.

## Validación local (sin CI remoto)

Para este flujo simplificado, las validaciones se ejecutan en local:

1. `npm run lint`
2. `npm run test`
3. `npm run build`
4. `npm run e2e`

Este flujo actúa como validación local completa (lint + tests unitarios + build + E2E automáticos).

## Despliegue a GitHub Pages

El despliegue se realiza por script local usando `angular-cli-ghpages`.

### 1. Publicar con un solo comando

```bash
npm run deploy
```

Este script:

1. compila en producción con base href para Pages (`/treeselect-angular/`),
2. publica `dist/treeselect-angular/browser` en la rama `gh-pages`.

Si es la primera vez en tu máquina, autentica GitHub CLI antes:

```bash
gh auth login
```

### 2. URL esperada

Al terminar, el sitio se publica en:

- `https://galadef.github.io/treeselect-angular/`

El workflow ya compila con base href correcto para Pages (`/treeselect-angular/`) y publica el artefacto desde `dist/treeselect-angular/browser`.
El script `deploy` compila con base href correcto para Pages (`/treeselect-angular/`) y publica el artefacto desde `dist/treeselect-angular/browser`.

## Estado actual

Implementado el primer esqueleto funcional de `app-treeselect` con:

- `ControlValueAccessor` base,
- comunicación entre componentes con APIs modernas de Angular (`input()`/`output()` + signals),
- overlay inicial,
- árbol jerárquico con expansión,
- selección `single`, `multiple` y `checkbox` inicial,
- display `comma` y `chip`,
- filtro lenient/strict inicial,
- integración validada con `Reactive Forms` y `ngModel`,
- eventos principales del contrato,
- API de templates (`value`, `header`, `footer`, `empty` e íconos),
- contextos tipados para templates y demo de uso en la app.

Estado: listo para uso transversal, con checklist técnica y de calidad completada.

## API preliminar (`app-treeselect`)

Inputs principales definidos: `options`, `selectionMode`, `display`, `placeholder`, `showClear`, `filter`, `filterBy`, `filterMode`, `filterPlaceholder`, `filterInputAutoFocus`, `resetFilterOnHide`, `virtualScroll`, `virtualScrollItemSize`, `loading`, `loadingMode`, `propagateSelectionDown`, `propagateSelectionUp`, `checkboxSelectionStartLevel`, `disabled`, `tabindex`, `inputId`, `ariaLabel`, `ariaLabelledBy` y estilos de `root/panel/label`.

Inputs de extensibilidad para templates: `valueTemplate`, `headerTemplate`, `footerTemplate`, `emptyTemplate`, `triggerIconTemplate`, `clearIconTemplate`, `togglerIconTemplate`, `checkboxIconTemplate`, `loadingIconTemplate`, `filterIconTemplate`, `closeIconTemplate`.

Outputs definidos: `valueChange`, `nodeSelect`, `nodeUnselect`, `nodeExpand`, `nodeCollapse`, `filterApplied`, `panelShown`, `panelHidden`, `cleared`, `lazyLoadError`.

## Tabla de API

### Inputs

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `options` | `TreeNode[]` | `[]` | Datos del árbol. |
| `selectionMode` | `'single' \| 'multiple' \| 'checkbox'` | `'single'` | Modo de selección. |
| `display` | `'comma' \| 'chip'` | `'comma'` | Forma de mostrar selección múltiple. |
| `placeholder` | `string` | `'Selecciona'` | Texto por defecto sin selección. |
| `showClear` | `boolean` | `false` | Muestra botón para limpiar valor. |
| `filter` | `boolean` | `false` | Habilita input de búsqueda. |
| `filterBy` | `string` | `'label'` | Campo usado para filtrar. |
| `filterMode` | `'lenient' \| 'strict'` | `'lenient'` | Estrategia de filtrado. |
| `filterPlaceholder` | `string` | `'Buscar'` | Placeholder del filtro. |
| `filterInputAutoFocus` | `boolean` | `false` | Enfoca filtro al abrir. |
| `resetFilterOnHide` | `boolean` | `false` | Limpia filtro al cerrar panel. |
| `virtualScroll` | `boolean` | `false` | Activa render virtual en panel. |
| `virtualScrollItemSize` | `number` | `36` | Alto de fila para cálculo virtual. |
| `lazy` | `boolean` | `false` | Habilita carga lazy de hijos al expandir. |
| `loadChildren` | `(node) => Promise<TreeNode[]> \| null` | `null` | Callback asíncrono para cargar hijos lazy. |
| `metaKeySelection` | `boolean` | `true` | Usa Ctrl/Cmd para selección múltiple acumulada. |
| `propagateSelectionDown` | `boolean` | `true` | Propaga selección a descendientes en checkbox. |
| `propagateSelectionUp` | `boolean` | `true` | Recalcula padres en checkbox. |
| `checkboxSelectionStartLevel` | `number` | `1` | Nivel mínimo (1-based) desde el que se muestran y seleccionan checkboxes. |
| `loading` | `boolean` | `false` | Activa estado de carga. |
| `loadingMode` | `'mask' \| 'icon'` | `'icon'` | Modo visual de carga. |
| `disabled` | `boolean` | `false` | Deshabilita interacción. |
| `tabindex` | `number` | `0` | Tab index del trigger. |
| `inputId` | `string \| null` | `null` | ID del trigger. |
| `ariaLabel` | `string \| null` | `null` | Etiqueta ARIA directa. |
| `ariaLabelledBy` | `string \| null` | `null` | Etiqueta ARIA por referencia. |
| `rootClass` / `panelClass` / `labelClass` | `string` | `''` | Clases de personalización. |
| `rootStyle` / `panelStyle` / `labelStyle` | `Record<string,string> \| null` | `null` | Estilos inline de personalización. |
| `valueTemplate`, `headerTemplate`, `footerTemplate`, `emptyTemplate` | `TemplateRef` | `null` | Templates principales. |
| `triggerIconTemplate`, `clearIconTemplate`, `togglerIconTemplate`, `checkboxIconTemplate`, `loadingIconTemplate`, `filterIconTemplate`, `closeIconTemplate` | `TemplateRef` | `null` | Templates de íconos. |

### Outputs

| Output | Payload | Descripción |
|---|---|---|
| `valueChange` | `TreeselectValue` | Emite valor reconciliado. |
| `nodeSelect` / `nodeUnselect` | `TreeselectNodeEvent` | Cambio de selección por nodo. |
| `nodeExpand` / `nodeCollapse` | `TreeselectNodeEvent` | Cambio de expansión por nodo. |
| `filterApplied` | `TreeselectFilterEvent` | Query y nodos filtrados. |
| `panelShown` / `panelHidden` | `void` | Apertura/cierre del panel. |
| `cleared` | `void` | Limpieza manual del valor. |
| `lazyLoadError` | `TreeselectLazyLoadErrorEvent` | Error al cargar hijos en modo lazy. |

## Ejemplos disponibles

La app demo incluye ejemplos funcionales para:

- `single`
- `multiple` (display `chip`)
- `checkbox`
- integración con `Reactive Forms`
- integración con `ngModel`
- `virtualScroll` con dataset grande
- `lazy` loading de hijos en expansión
- personalización con templates (`value/header/footer/empty` + íconos)

## Theming y personalización

- Clases de entrada para customización: `rootClass`, `panelClass`, `labelClass`.
- Estilos inline opcionales: `rootStyle`, `panelStyle`, `labelStyle`.
- Variables CSS disponibles en `:root`:
	- colores/superficies (`--ts-surface`, `--ts-surface-hover`, `--ts-surface-active`, `--ts-text`, `--ts-primary`, `--ts-danger`)
	- bordes y foco (`--ts-border`, `--ts-border-hover`, `--ts-focus`)
	- spacing/radius/sombras (`--ts-space-*`, `--ts-radius-*`, `--ts-shadow-lg`)
	- estados de selección/chip (`--ts-selected-bg`, `--ts-chip-bg`, `--ts-chip-text`)
- Soporte dark mode automático vía `@media (prefers-color-scheme: dark)`.

## Operación y release

- Feature flag de rollout gradual en la demo (`rolloutSeed` + `treeselectRolloutPercent`).
- Telemetría mínima de interacción (`open`, `close`, `clear`) con duración de panel abierto.
- Plan operativo de piloto, monitoreo, rollback y backlog en:
	- `docs/release-operacion-treeselect.md`

## Guías adicionales

- Plan inicial del proyecto: `docs/plan-proyecto-treeselect.md`
- Arquitectura del componente: `docs/arquitectura-treeselect.md`
- Migración interna: `docs/migracion-interna-treeselect.md`
- Accesibilidad y teclado: `docs/accesibilidad-teclado.md`

## Política de reconciliación de valor

- Si cambia `options`, el componente preserva solo claves válidas del nuevo árbol.
- Si el valor inicial no existe en `options`, se limpia/reconcilia automáticamente:
	- `single`: pasa a `null`
	- `multiple`: conserva solo claves existentes
	- `checkbox`: conserva solo estados de claves existentes
- El estado de expansión también se reconcilia para evitar keys huérfanas.

## Rendimiento

- Soporte de `virtualScroll` para datasets grandes.
- Soporte de `lazy` loading de hijos en expansión.
- Benchmark base con escenarios 1k/5k/10k usando:
	- `npm run benchmark`
- Guía de benchmark:
	- `docs/benchmark-rendimiento.md`

## Visual regression

- Snapshot E2E del shell principal con Playwright.
- Para actualizar baseline visual:
	- `npm run e2e:snapshots:update`

## Cobertura

- Umbrales mínimos definidos en `karma.conf.js`:
	- statements: `80%`
	- branches: `80%`
	- functions: `80%`
	- lines: `80%`
