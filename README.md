# Demo Cafeterías

Demo comercial de una plataforma central para albaranes y fidelización. El TPV, los pagos y la integración bancaria quedan fuera de esta primera fase.

## Arranque rápido

```bash
pnpm install
pnpm dev
```

La demo visual funciona con `DEMO_MODE=true` sin Supabase y sin enviar emails. La persistencia real de Supabase y los proveedores externos quedan encapsulados como siguiente paso de implementación del prompt maestro.

## Configuración de Supabase

1. Crea un proyecto Supabase independiente para la demo.
2. Copia la URL y la publishable key a `.env.local`.
3. Mantén `SUPABASE_SERVICE_ROLE_KEY` únicamente en servidor.
4. Ejecuta `supabase/schema.sql` desde el SQL Editor.
5. Crea un bucket privado llamado `delivery-notes`.
6. Carga los datos de demo indicados en el seed cuando el proyecto esté conectado.
7. Cambia `DEMO_MODE=false` solo después de probar la conexión.

## Email

El comportamiento por defecto es mock: prepara el email y lo registra, pero no lo envía. Para producción habrá que configurar un proveedor, un dominio remitente y consentimiento válido.

## Datos sensibles

Las fotografías originales pueden contener CIF, direcciones y números de documento. Para una demo utiliza copias redacted/ocultas o mantén el Storage privado.

## Próxima fase

La futura centralización del TPV debe empezar con un diagnóstico de las integraciones disponibles. No se deben almacenar tarjetas ni desarrollar el procesamiento de pagos propio.
