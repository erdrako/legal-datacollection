# Arquitectura de datacollection

## Objetivo

Recolectar datos desde fuentes legales y producir candidatos trazables para validacion.

## Componentes esperados

```text
sources/
  infoleg/
  boletin-oficial/
  saij/
parsers/
  html/
  pdf/
  csv/
normalizers/
  legal-item-normalizer
  provision-normalizer
extractors/
  relationship-extractor
  rule-extractor
  concept-extractor
writers/
  raw-writer
  parsed-writer
  candidate-writer
```

## Limites

Este repositorio puede decir:

> Detecte un posible articulo, una posible relacion o una posible regla.

No debe decir:

> Este dato es definitivo y debe mostrarse como verdad aprobada.

Esa decision corresponde a `legal-datavalidation`.

## Principios

- Preservar siempre la fuente raw.
- Registrar URL, fecha de recuperacion y metadata disponible.
- No descartar texto original durante normalizacion.
- Emitir candidatos con citas.
- Marcar extracciones automaticas como `AUTO_EXTRACTED`.
- Asignar confianza inicial conservadora.

