# Integracion con legal-contracts

## Rol de este repositorio

`legal-datacollection` produce candidate bundles.

El contrato de referencia vive en:

```text
legal-contracts/schemas/candidate-bundle.schema.json
legal-contracts/fixtures/candidate-bundle.example.json
```

## Salida minima

Cada ejecucion de ingesta debe producir un paquete con:

- `schemaVersion`
- `generatedAt`
- `source`
- `legalItems`
- `provisions`
- `citations`
- `relationships`
- `rules`
- `concepts`
- `snapshots`

Los arrays pueden estar vacios cuando una etapa aun no extrae ese tipo de entidad, pero las claves deben existir para mantener compatibilidad.

## Estados esperados

Los datos emitidos por este repositorio deben considerarse candidatos.

Cuando existan campos de revision, deben iniciar como:

```text
AUTO_EXTRACTED
```

o:

```text
NEEDS_REVIEW
```

segun la confianza disponible.

## Regla de citas

Toda provision debe poder relacionarse con una cita cuando la fuente lo permita.

Toda regla, relacion o concepto interpretado debe incluir evidencia suficiente para que `legal-datavalidation` pueda aprobarlo, rechazarlo o pedir revision.

## Prohibido

Este repositorio no debe emitir approved bundles.

La promocion a datos aprobados corresponde exclusivamente a `legal-datavalidation`.

