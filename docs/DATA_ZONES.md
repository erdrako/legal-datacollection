# Zonas de datos

## Raw

Contenido descargado sin transformar.

Ejemplos:

- HTML original.
- PDF original.
- CSV original.
- ZIP original.
- Metadata de descarga.

## Parsed

Contenido estructurado a partir del raw.

Ejemplos:

- Titulo.
- Numero de norma.
- Fecha de publicacion.
- Articulos segmentados.
- Anexos detectados.

## Normalized candidate

Contenido adaptado a contratos compartidos, pero todavia no aprobado.

Ejemplos:

- `LegalItem` candidato.
- `LegalProvision` candidata.
- `LegalRelationship` candidata.
- `LegalRule` candidata.
- `LegalConcept` candidato.

## Regla de oro

Un dato candidate no debe ser consumido por el backend publico como dato aprobado.

