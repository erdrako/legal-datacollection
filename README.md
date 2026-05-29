# LexMapa Datacollection

Repositorio publico para ingesta, descarga, parsing y normalizacion inicial de fuentes legales argentinas.

## Responsabilidad

`legal-datacollection` transforma fuentes externas en datos candidatos.

Puede:

- Descargar documentos desde fuentes oficiales.
- Guardar datos raw.
- Parsear HTML, PDF, CSV o ZIP.
- Segmentar articulos, incisos, parrafos y anexos.
- Extraer metadata basica.
- Detectar relaciones candidatas.
- Generar reglas y conceptos candidatos.
- Asociar citas de origen.

No puede:

- Aprobar datos como definitivos.
- Promover datos a consumo publico.
- Resolver interpretaciones legales complejas como verdad final.
- Exponer datos directamente al frontend.

## Estado inicial

Este repositorio arranca como esqueleto documentado. La primera implementacion debe cubrir una sola fuente y una sola norma para validar el flujo completo.

## Flujo

```text
fuente oficial
-> raw data
-> parsed data
-> normalized candidate data
-> legal-datavalidation
```

## Documentacion

- [Arquitectura](./docs/ARCHITECTURE.md)
- [Primer importador](./docs/FIRST_IMPORTER.md)
- [Zonas de datos](./docs/DATA_ZONES.md)

## Contratos

La salida de este repositorio debe respetar los contratos definidos en `legal-contracts`.

