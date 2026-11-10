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

Para revisar la guía localmente en Windows, ejecutá `python -m http.server 8000 --bind 127.0.0.1 --directory docs` desde la raíz del proyecto y abrí [la portada](http://127.0.0.1:8000/). El índice permite abrir los once capítulos. Cada página tiene un enlace propio, por ejemplo `#pagina-5`.
