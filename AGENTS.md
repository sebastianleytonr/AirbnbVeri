# AirbnbVeri

Este proyecto contiene el sitio de un alojamiento y su administrador local para Windows. El sitio público será estático; los eventos y las imágenes se prepararán localmente y se publicarán en GitHub Pages.

## Regla general de estilos y paleta aprobada

- Dirección visual: costera y rústica, cálida y atemporal, con tonos naturales y materiales como lino, madera, yute y cerámica. El primer tablero «Coastal Rustic Color Palette» es una referencia conceptual; el flyer AWEN y el libro «AWEN · Lugares para descubrir» muestran la aplicación concreta que el usuario pidió analizar para definir los colores.
- La siguiente paleta y sus usos están **aprobados por el usuario como regla general de estilos** para el sitio público y el administrador local. Reemplaza la extracción preliminar del primer tablero. Usar estos hex como valores de referencia del proyecto y respetar sus funciones en las interfaces que se creen o modifiquen.
- Se revisaron las 38 páginas del PDF. El libro usa crema, azul petróleo, azul grisáceo, arena dorada y detalles salvia. El flyer usa crema, arena, oliva oscuro, texto casi negro y madera. La paleta aprobada conserva ambas familias con funciones diferenciadas.
- El PDF contiene páginas rasterizadas, sin colores ni fuentes editables. Los hex del libro proceden de píxeles planos repetidos en las imágenes incrustadas; los del flyer son medianas de muestras interiores, con filtros para separar las letras de sus fondos. Son valores representativos para normalizar el diseño, no códigos originales de autoría garantizados.

| N.º | Categoría | Uso aprobado | Color | Hex | Evidencia |
| --- | --- | --- | --- | --- | --- |
| 1 | Fondos | Fondo general | Crema cálido | `#F8F4ED` | Fondo plano repetido del PDF; familia también presente en el flyer |
| 2 | Fondos | Tarjetas y paneles | Arena lino | `#F1E4D4` | Fondos de tarjetas del flyer |
| 3 | Fondos | Consejos y destacados suaves | Salvia muy claro | `#F2F2E9` | Recuadros de consejos del PDF |
| 4 | Títulos | Marca y títulos principales | Oliva profundo | `#333414` | Marca AWEN del flyer |
| 5 | Textos | Texto general | Carbón cálido | `#19140C` | Texto oscuro del flyer |
| 6 | Textos | Variante editorial para guías | Azul grisáceo | `#244D5B` | Párrafos del PDF |
| 7 | Acciones | Enlaces y botones del sitio; títulos de guías | Azul petróleo | `#0A4B60` | Color de títulos y códigos QR del PDF; uso en botones aprobado por el usuario |
| 8 | Detalles | Líneas e iconos decorativos | Verde salvia | `#7E9180` | Líneas de consejos del PDF |
| 9 | Detalles | Separadores y acentos | Arena dorada | `#CAA572` | Líneas horizontales del PDF |
| 10 | Texturas | Ilustraciones y detalles de madera | Madera cálida | `#B58352` | Textura de los iconos del flyer |

- Jerarquía de estilos: fondos crema y arena, títulos oliva y texto general carbón. Reservar el azul grisáceo para la variante editorial y el azul petróleo para acciones y contenidos de la guía; no alternar los colores de párrafo sin criterio dentro de una misma sección.
- Al implementar las interfaces, centralizar los colores en variables de estilo con nombres semánticos según su función, en lugar de dispersar códigos hex por los componentes. La dirección visual y la paleta son comunes al sitio y al administrador.
- Salvia, arena dorada y madera son acentos; no usarlos para texto pequeño sobre fondos claros. Las muestras de madera resumen una textura y no obligan a convertirla en un relleno plano.
- Respecto de la primera propuesta, se mantienen las familias crema, beige/arena, verdes naturales y madera. El azul marino grisáceo cambia a azul petróleo. La arcilla y el gris azulado «Sea Glass» quedan fuera de la paleta de maquetación; espresso y yute no tienen un color independiente en la selección aprobada.
- El coral del logotipo Airbnb pertenece a esa marca externa; no incorporarlo como color de AWEN. Los colores variables de fotografías, plantas, mapas y otros logotipos no se convierten automáticamente en colores de la identidad.
- Los datos, la evidencia de muestreo y las láminas se guardan localmente en `private/design/`; la selección aprobada está en `paleta-awen-por-uso.json` y `paleta-awen-por-uso.png`. No publicar los adjuntos originales ni los materiales de revisión como parte del sitio.

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
