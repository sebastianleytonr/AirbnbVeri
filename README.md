# AirbnbVeri

Sitio estático de un alojamiento, preparado para publicarse en GitHub Pages. La interfaz tendrá ocho idiomas; las reglas de traducción están en `AGENTS.md`.

## Diseño responsivo y prioridad en celulares

Es probable que la mayoría de las visitas al sitio sean desde un celular. Por eso, todo el sitio y las interfaces que se creen, incluido el administrador local, deben ser responsivos, con especial atención a funcionar bien en celulares.

- Diseñar primero para pantallas pequeñas y adaptar la distribución a tabletas y computadoras.
- Mantener textos legibles, imágenes y contenidos adaptables, sin desbordamientos ni desplazamiento horizontal de la página.
- Ofrecer navegación, botones y formularios cómodos de usar con el dedo; ninguna función debe depender únicamente de pasar el cursor.
- Optimizar las imágenes y los recursos para que el sitio cargue con agilidad en conexiones móviles.
- Antes de dar por terminada una interfaz, comprobar su funcionamiento en distintos tamaños de pantalla, en orientación vertical y horizontal, y en los ocho idiomas, incluidos los textos más largos.

## Separación entre contenido público y herramientas locales

| Ubicación | Contenido | ¿Se publica en este repositorio? |
| --- | --- | --- |
| `docs/` | HTML, estilos, JavaScript del sitio, traducciones, eventos e imágenes públicas | Sí |
| `private/` | Administrador, código fuente, ejecutables, dependencias, empaquetado, configuración local y herramienta de publicación | No |
| `.gitignore`, `AGENTS.md`, `README.md` | Reglas y documentación del proyecto | Sí |

El repositorio aplica una lista explícita de archivos permitidos: los archivos nuevos quedan excluidos por defecto. La carpeta pública no debe contener herramientas de administración o publicación, credenciales ni archivos relacionados con ellas.

Los controles locales de commit y push validan la lista de archivos permitidos. El control de push revisa también el historial que se va a enviar para detectar archivos privados incorporados en un commit anterior. Estos controles se guardan en `private/` y no se distribuyen en el repositorio público.

Los controles locales dependen de la configuración de cada computadora: `core.hooksPath` debe apuntar a `private/git-guards`. Deben configurarse antes de publicar desde una instalación nueva; no se debe usar `--no-verify` ni deshabilitarlos. El futuro administrador deberá validar los archivos y el historial antes de cada publicación, incluso si los hooks no están instalados.

## GitHub Pages

La carpeta pública es `docs/`. Si GitHub Pages publica desde `main` y `/(root)`, la guía se abre en `/AirbnbVeri/docs/`. Si la fuente es `/docs`, se abre en `/AirbnbVeri/`. Las herramientas locales no se deben adjuntar a releases, subir como artefactos públicos ni incluir en la web.

Para usar el sitio en Windows, abrí `docs/index.html` con doble clic y conservá junto a él las carpetas de `docs/`. La guía, el calendario y los ocho idiomas funcionan desde el disco. Desde el índice de la portada podés abrir cualquiera de los trece capítulos, desde «Bienvenida» (capítulo 0) hasta «Despedida» (capítulo 12). Cada página de lectura conserva su enlace, por ejemplo `#pagina-5`.

Al abrir el HTML desde el disco, el sitio usa una copia de los JSON incluida en `docs/assets/file-data.js`. Para probar una edición de los JSON, pulsá «Leer datos de la carpeta del sitio» al pie de la página y elegí la carpeta `docs`. El selector del navegador autoriza la lectura local. El sitio lee los ocho diccionarios, los enlaces de la guía y los eventos, y actualiza la vista. Podés volver a elegir la carpeta después de otra edición. La selección dura hasta que recargues o cierres la página.

Si querés incorporar los datos editados a la copia que se abre por defecto con doble clic, ejecutá `python private/refresh_file_data.py` desde la raíz del proyecto.

## Calendario de eventos

La pestaña «Calendario de Eventos» se abre en `#calendario`. Incluye vistas de mes, semana y día, navegación anterior/siguiente, botón Hoy y selector de fecha. Las semanas empiezan el lunes. Los días con eventos se destacan; al tocarlos se abre un diálogo con todos sus eventos, nombre, fecha, hora, lugar e información extra. Se cierra con el botón Cerrar, Escape o tocando fuera.

La portada muestra el próximo evento según su hora de inicio y enlaza al mes correspondiente del calendario. En GitHub Pages, la portada y el calendario comparten una única lectura de `docs/events/events.json` durante la visita. Al actualizar el JSON publicado, recargá la página para ver la nueva versión.

El documento contiene `schemaVersion: 1`, `timeZone: "America/Montevideo"` y un array `events`. Cada evento incluye:

| Campo | Contenido |
| --- | --- |
| `id` | Identificador único y estable |
| `startsAt` | Fecha y hora ISO 8601 con segundos y zona explícita, por ejemplo `2026-11-14T10:00:00-03:00` |
| `name` | Nombre del evento por idioma. El valor en `es` es obligatorio. |
| `location` | Lugar por idioma. El valor en `es` es obligatorio. Los nombres propios se conservan. |
| `extraInfo` | Información adicional por idioma. Se puede omitir por completo. Si se incluye texto, debe estar disponible en `es`. |
| `mock` | Opcional; `true` identifica un evento de prueba |

Podés publicar un evento solo en español y agregar manualmente las demás traducciones cuando estén listas. Para cada campo, el calendario busca primero el texto en el idioma del visitante, luego en inglés y por último en español. Por ejemplo, si un visitante elige francés y solo el nombre está traducido al francés, verá ese nombre y el lugar en inglés si está disponible, o en español si falta el inglés. Los valores vacíos o con solo espacios cuentan como traducciones pendientes.

La fecha y hora se muestran con `Intl` en el idioma seleccionado y siempre en la zona del alojamiento, aunque el visitante esté en otro país. Cambiar de idioma conserva la vista y la fecha seleccionada. Los campos de contenido se muestran como texto, sin interpretar HTML. Los archivos inválidos muestran un error con opción de reintentar.

Se incluyen dos eventos ficticios: «Paseo por la costa» el **14 de noviembre de 2026, 10:00**, y «Encuentro de música acústica» el **21 de noviembre de 2026, 18:00**, hora de Uruguay. Para quitarlos, eliminar los objetos `mock-paseo-costero` y `mock-musica-acustica` del array `events`; si todavía no hay eventos reales, dejar `events: []`. No eliminar el archivo. La advertencia de pruebas desaparece cuando no quedan eventos con `mock: true`.
