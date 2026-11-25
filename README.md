# Gabriel’s Auto Service · Astro demo

Versión local en inglés del sitio de Gabriel’s Auto Service. Usa la composición, las imágenes, los iconos, la tipografía y los colores de la plantilla CRAS. Los textos y las rutas de servicio, el trabajo del taller, los artículos y las páginas por ciudad provienen del WordPress público.

## Abrir el sitio local

Con Node.js 24, desde esta carpeta:

```powershell
npm ci
npm run dev
```

Astro muestra la URL en la terminal. El inicio queda en `/` y la demo de membresías en `/memberships/`.

```powershell
npm run build
npm run preview
```

El build estático se genera en `dist/`. La demo lleva `noindex`.

## Contenido

- `src/data/wordpress.json` contiene el contenido importado y las rutas originales.
- `public/media/` contiene las imágenes importadas de WordPress.
- `src/templates/` contiene el HTML original de cada diseño de la plantilla CRAS que se usa en el sitio.
- `public/cras/` contiene las hojas de estilo, scripts, imágenes e iconos de la plantilla, incluidas sus animaciones.
- `public/brand/` contiene los logos suministrados; `public/fonts/` contiene las fuentes Inter y Montserrat del WordPress.
- `src/pages/memberships.astro` contiene los tres planes de ejemplo y el flujo de inscripción simulado. Los precios y beneficios son ficticios. La demo no recoge datos, crea suscripciones ni cobra.

El contenido y las imágenes incluidos alcanzan para compilar. Las páginas que existen solo en la plantilla no aparecen en la navegación. Para volver a importar la copia del WordPress público, se puede ejecutar `npm run import:wordpress` con acceso de red. El importador guarda las respuestas en `.migration-cache/`.
