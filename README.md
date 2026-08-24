# Menú interno de propiedades — Landea

Página HTML de uso interno con el listado de todos los desarrollos, modelos y
sus links en [landea.com.mx](https://landea.com.mx/), para uso del equipo.

## Uso

Abre [`menu-interno.html`](menu-interno.html) directamente en el navegador
(doble clic) o publícalo con GitHub Pages para tener un link compartible.

## Actualizar links o modelos

Todo el contenido vive en el arreglo `DATA` (y `PROXIMAMENTE`) dentro del
`<script>` al final de `menu-interno.html`. Cada modelo tiene:

- `modelo`: nombre corto del modelo/casa
- `nombre`: nombre completo mostrado en la tarjeta
- `href`: link a la página del modelo (dejar `""` si aún no existe)

No se requiere tocar el HTML ni el CSS para agregar o corregir un link.

## Estructura

- `menu-interno.html` — la página completa (HTML + CSS + JS en un solo archivo)
- `logo-*.png`, `LOGO ANKARA*.png` — logos de cada desarrollo, usados como
  encabezado de cada sección
- Otros PNG sueltos — variantes de logos entregadas por el equipo de diseño,
  disponibles para uso futuro
