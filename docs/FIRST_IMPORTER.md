# Primer importador

## Objetivo

Implementar un importador minimo que permita probar el flujo completo de LexMapa.

## Criterios para elegir la primera norma

La norma inicial debe tener:

- Fuente oficial clara.
- Texto accesible en HTML o formato simple.
- Estructura de articulos ordenada.
- Bajo riesgo de interpretacion compleja.
- Impacto entendible para usuarios no especialistas.
- Algunas relaciones o modificaciones detectables.

## Alcance tecnico inicial

El primer importador debe:

1. Descargar o incorporar el documento fuente.
2. Guardar el raw document.
3. Extraer metadata basica.
4. Segmentar articulos.
5. Crear `LegalItem` candidato.
6. Crear `LegalProvision` candidatas.
7. Crear `LegalCitation` para cada provision.
8. Emitir un archivo candidate compatible con `legal-contracts`.

## Fuera de alcance inicial

- Extraccion exhaustiva de reglas.
- Jurisprudencia.
- Doctrina.
- Cobertura provincial.
- Resolucion automatica de conflictos normativos.
- Interpretaciones juridicas complejas.

## Salida esperada

```text
data/
  raw/
  parsed/
  candidate/
```

La carpeta `candidate` debe contener datos listos para ser enviados a `legal-datavalidation`.

## CLI inicial

El repositorio incluye una CLI minima para generar un candidate bundle desde un documento fuente de ejemplo:

```bash
npm run build:example
```

El comando lee:

```text
examples/source-document.example.json
```

y escribe:

```text
data/candidate/candidate-bundle.example.generated.json
```

Esta CLI no descarga fuentes reales todavia. Sirve como primer esqueleto funcional para fijar el formato de salida antes de implementar el importador oficial.

## Importador InfoLEG inicial

Tambien existe un importador inicial para el texto actualizado de Ley 24.240 en InfoLEG:

```bash
npm run import:infoleg:ley24240
```

Salida:

```text
data/candidate/infoleg-ley-24240.candidate.json
```

Tambien genera:

```text
data/raw/infoleg-ley-24240.raw.html
data/parsed/infoleg-ley-24240.report.json
```

El importador:

- Descarga HTML desde InfoLEG.
- Guarda una copia raw del HTML.
- Convierte HTML a texto.
- Segmenta articulos.
- Genera un reporte de parsing con cantidad de articulos, hashes, duplicados y advertencias.
- Genera `LegalItem`, `LegalProvision` y `LegalCitation` candidatos.

Limitaciones actuales:

- No valida vigencia.
- No extrae relaciones modificatorias.
- No extrae reglas semanticas.
- No aprueba datos.
- Usa parsing HTML inicial, pendiente de endurecer con casos reales.

Si la maquina local tiene problemas de certificados contra el sitio de InfoLEG, puede ejecutarse temporalmente:

```powershell
$env:LEXMAPA_ALLOW_INSECURE_TLS='1'
npm run import:infoleg:ley24240
```

Ese modo es solo para desarrollo local con bloqueo de certificados. No debe usarse como configuracion productiva.

## Carga descartable de desarrollo

Para cargar varias normas de desarrollo:

```bash
npm run import:dev:infoleg
```

Fuentes configuradas:

```text
examples/dev-infoleg-sources.json
```

Salidas descartables:

```text
data/raw/
data/parsed/
data/candidate/
```

Estas salidas no deben versionarse. Sirven para probar parsing, validacion, backend y frontend antes de limpiar datos de desarrollo.
