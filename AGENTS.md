# AirbnbVeri

Este proyecto contiene el sitio de un alojamiento y su administrador local para Windows. El sitio público será estático; los eventos y las imágenes se prepararán localmente y se publicarán en GitHub Pages.

## Idiomas obligatorios

El idioma inicial es español. El selector debe ofrecer siempre estos ocho idiomas:

| Código | Idioma | Nombre en el selector |
| --- | --- | --- |
| `es` | Español | Español |
| `en` | Inglés | English |
| `pt-BR` | Portugués de Brasil | Português (Brasil) |
| `fr` | Francés | Français |
| `it` | Italiano | Italiano |
| `de` | Alemán | Deutsch |
| `pl` | Polaco | Polski |
| `ru` | Ruso | Русский |

- La primera visita debe mostrarse en español, independientemente del idioma del navegador.
- Recordar la selección explícita del usuario para próximas visitas. Si no hay una selección válida, usar español.
- Mostrar los nombres de los idiomas en su propio idioma para facilitar que cada visitante encuentre el suyo.
- Actualizar el atributo `lang` del documento al cambiar de idioma.

## Arquitectura de traducciones

- Mantener una estructura HTML compartida y diccionarios de traducción en JSON, uno por idioma. No mantener copias manuales del HTML para cada idioma.
- Ubicar los diccionarios en `locales/` dentro de la carpeta pública del sitio: `es.json`, `en.json`, `pt-BR.json`, `fr.json`, `it.json`, `de.json`, `pl.json` y `ru.json`.
- Usar las mismas claves semánticas y la misma estructura en todos los diccionarios, por ejemplo `navigation.activities` o `events.empty`.
- Resolver los textos mediante una función común de traducción; evitar textos visibles escritos directamente en los componentes o scripts.
- Si en el futuro se necesitan páginas con URL propia por idioma, generarlas desde las mismas plantillas y diccionarios, sin duplicar su mantenimiento.

## Cobertura de textos

- Todo texto que agreguemos y que se muestre al usuario debe tener traducción en los ocho idiomas. Esta regla también se aplica a las interfaces de administración que creemos.
- Incluye títulos, navegación, botones, formularios, placeholders, validaciones, errores, confirmaciones, estados vacíos, mensajes de carga, textos del calendario, pies de página y metadatos descriptivos.
- Traducir también los textos accesibles, como etiquetas para lectores de pantalla y textos alternativos de imágenes cuando correspondan.
- El contenido editable, como títulos y descripciones de eventos o pies de fotos, debe contemplar valores por idioma cuando se diseñen sus archivos JSON y formularios.
- No traducir nombres propios, marcas, direcciones, enlaces ni otros identificadores que deban conservarse.
- Hacer traducciones naturales y coherentes con el contexto del alojamiento. El portugués debe ser de Brasil.
- Evitar construir frases concatenando fragmentos traducidos. Usar mensajes completos con parámetros y variantes cuando haya plurales.
- Formatear fechas, horas y números con `Intl` según el idioma seleccionado. Cambiar de idioma no debe modificar el momento real de un evento.

## Criterio de finalización

- Al agregar o modificar un texto, actualizar sus traducciones en los ocho diccionarios en el mismo cambio.
- Antes de dar por terminada una funcionalidad, comprobar que todos los idiomas tengan las mismas claves y parámetros y que no se muestren claves internas como texto.
- Comprobar que los textos largos y los caracteres de todos los idiomas se vean correctamente. Usar UTF-8.
- Un recurso de respaldo en español puede evitar una pantalla rota ante un error, pero no sustituye las traducciones obligatorias.

## Repositorio público y herramientas privadas

- El repositorio de GitHub será público. Su contenido permitido es el sitio estático en `docs/` y los archivos raíz `.gitignore`, `AGENTS.md` y `README.md`.
- La carpeta pública es `docs/`; sus traducciones se ubicarán en `docs/locales/`.
- Guardar todo el administrador en `private/`, incluyendo código fuente, interfaces HTML/JavaScript de administración, ejecutables, instaladores, dependencias, archivos de empaquetado, cachés, logs y configuración local. Ninguno de estos archivos debe entrar al repositorio público.
- Guardar también en `private/` el script o programa que publique en producción y todos sus archivos relacionados. Nunca incluirlo en `docs/`, commits, ramas, tags, releases ni artefactos públicos.
- Las credenciales y claves deben permanecer fuera del contenido versionado y de las URLs del remoto. No incrustarlas en archivos públicos.
- Mantener el `.gitignore` con exclusión por defecto y excepciones explícitas para archivos públicos. No usar excepciones amplias para código o herramientas locales.
- No usar `git add .`, `git add -A`, `git add --force` ni saltarse los controles locales con `--no-verify`. Agregar únicamente rutas públicas explícitas.
- Antes de hacer un commit o push, revisar los archivos preparados y el historial que se publicará. Un `.gitignore` no elimina archivos ya incluidos en el índice o en commits anteriores.
- Los hooks de validación locales se guardan en `private/git-guards/`, se configuran mediante `core.hooksPath` y no se publican. Revisan las rutas, el tipo de archivo y patrones de credenciales; el control de push revisa todos los commits alcanzables desde las referencias que se enviarán.
- La futura herramienta de publicación debe validar por sí misma el contenido y el historial antes de enviar cambios; no debe depender únicamente de que estén instalados los hooks.
- Si hace falta versionar las herramientas privadas, usar un repositorio privado separado; nunca crear una rama para ellas dentro del repositorio público.

Estas reglas fijan la estructura de trabajo; no requieren construir todavía las páginas ni el administrador.
