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

