# AirbnbVeri

Sitio estático de un alojamiento, preparado para publicarse en GitHub Pages. La interfaz tendrá ocho idiomas; las reglas de traducción están en `AGENTS.md`.

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

La carpeta pública elegida es `docs/`, compatible con la publicación desde una rama de GitHub Pages. Cuando exista la primera página, la fuente de publicación será la rama principal y la carpeta `/docs`. Las herramientas locales no se deben adjuntar a releases, subir como artefactos públicos ni incluir en la web.

El repositorio todavía no contiene las páginas del alojamiento ni el administrador.
