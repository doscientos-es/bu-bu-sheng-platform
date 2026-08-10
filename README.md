# Demo Cafeterías

Demo comercial de una plataforma central para albaranes y fidelización. El TPV, los pagos y la integración bancaria quedan fuera de esta primera fase.

## Arranque rápido

```bash
pnpm install
pnpm dev
```

La demo usa Supabase para leer y escribir cafeterías, albaranes, clientes y promociones. El envío de emails y el OCR siguen en modo mock.

## Configuración de Supabase

1. Crea un proyecto Supabase independiente para la demo.
2. Copia la URL y la publishable key a `.env.local`.
3. Mantén `SUPABASE_SECRET_KEY` únicamente en servidor. `SUPABASE_JWKS_URL` se reserva para una futura integración de autenticación.
4. Ejecuta `supabase/schema.sql` y después `supabase/seed.sql` desde el SQL Editor.
5. Crea un bucket privado llamado `delivery-notes`.
6. El seed es idempotente y puede ejecutarse de nuevo para restaurar los datos iniciales.
7. Usa `DEMO_MODE=false` cuando la conexión esté configurada.

## Activar Azure Document Intelligence

1. Entra en [portal.azure.com](https://portal.azure.com).
2. Crea un recurso de Azure AI Document Intelligence.
3. Selecciona el nivel de precios `F0 (Free)`.
4. Cuando el recurso esté creado, abre `Keys and Endpoint`.
5. Copia `Endpoint` y `KEY 1` a `.env.local`:

```env
OCR_PROVIDER=azure
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://...cognitiveservices.azure.com
AZURE_DOCUMENT_INTELLIGENCE_KEY=...
AZURE_DOCUMENT_INTELLIGENCE_MODEL=prebuilt-invoice
```

6. Reinicia `pnpm dev`.
7. Entra en `Albaranes`, pulsa `Subir albarán` y selecciona una foto de hasta 4 MB.

El endpoint `/api/ocr` mantiene la clave en el servidor y usa la API REST de Azure v4.0. El nivel F0 sirve para pruebas: procesa hasta 500 páginas mensuales según los límites publicados, solo analiza las dos primeras páginas de cada documento y limita el tamaño del archivo a 4 MB. Para el piloto, prueba primero 20–30 albaranes de proveedores diferentes.

## Email

El comportamiento por defecto es mock: prepara el email y lo registra, pero no lo envía. Para producción habrá que configurar un proveedor, un dominio remitente y consentimiento válido.

## Datos sensibles

Las fotografías originales pueden contener CIF, direcciones y números de documento. Para una demo utiliza copias redacted/ocultas o mantén el Storage privado.

## Próxima fase

La futura centralización del TPV debe empezar con un diagnóstico de las integraciones disponibles. No se deben almacenar tarjetas ni desarrollar el procesamiento de pagos propio.
