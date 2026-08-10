# Prompt maestro — Demo Cafeterías

Actúa como un equipo senior de producto, UX/UI y desarrollo full-stack. Construye una demo navegable para una red de 10 cafeterías que quiere centralizar albaranes y fidelización de clientes. Usa únicamente las decisiones y límites de este documento; si falta información, deja una decisión explícita como `TODO` y no inventes integraciones.

## Objetivo de la demo

Demostrar en una reunión dos módulos de una futura plataforma central:

1. Albaranes: subir una foto, extraer datos simulados, revisar el resultado, guardar el documento y comparar precios con compras anteriores.
2. Fidelización: registrar clientes, guardar fecha de cumpleaños, asignar una promoción y preparar un email de cumpleaños simulado.

El TPV centralizado, los pagos, las tarjetas, las integraciones bancarias y VeriFactu quedan fuera de esta demo.

## Contexto confirmado

- Existen 10 cafeterías.
- Cada cafetería utiliza un TPV con variaciones; quieren centralizarlo en el futuro.
- Reciben aproximadamente 10–15 albaranes por tienda y semana, unos 100–150 semanales en total.
- Quieren saber de forma sencilla si un proveedor ha subido el precio desde la última compra.
- Quieren centralizar los albaranes.
- Quieren fidelizar clientes y enviar una promoción por su cumpleaños.
- El canal de comunicación para la demo será email, no WhatsApp.
- Hay ejemplos de pantallas de TPV y albaranes de proveedores, pero no hay todavía integración técnica con esos sistemas.

## Stack obligatorio

- Next.js App Router.
- TypeScript.
- Supabase para PostgreSQL, Auth y Storage privado.
- Tailwind CSS o CSS modular limpio.
- Arquitectura de monolito modular en un único repositorio.
- Código preparado para sustituir mocks por proveedores reales.

## Regla de demo

Supabase debe ser la fuente de datos cuando las variables estén configuradas. Si faltan variables, la aplicación debe arrancar en `DEMO_MODE=true` con datos semilla locales para que la reunión no dependa de una conexión externa.

No enviar emails reales por defecto. El adaptador de email debe ser mock y registrar el mensaje como “preparado para enviar”. Solo se activará un proveedor real si `EMAIL_SEND_ENABLED=true` y sus credenciales están configuradas.

El OCR será simulado en esta demo. Al subir una imagen, mostrar un estado de procesamiento y cargar un resultado semilla editable. El código debe encapsularlo detrás de `OcrProvider` para poder conectar después un proveedor real.

## Experiencia de usuario

Diseña una interfaz cuidada, profesional y fácil de enseñar en una llamada:

- Sidebar con “Resumen”, “Albaranes” y “Fidelización”.
- Selector de cafetería.
- Tarjetas con métricas: albaranes pendientes, subidas detectadas, clientes registrados y cumpleaños próximos.
- Estados visuales claros: validado, pendiente, subida detectada, preparado para enviar.
- Tablas limpias y responsive.
- Flujo de demo de máximo cinco clics por caso de uso.
- Usa nombres en español.
- No uses lenguaje técnico como OCR, API, webhook o RLS en la interfaz comercial.

## Flujo de albaranes

1. Abrir “Albaranes”.
2. Ver listado centralizado por tienda, proveedor, fecha y estado.
3. Pulsar “Subir albarán”.
4. Seleccionar una imagen.
5. Mostrar “Analizando documento”.
6. Mostrar resultado editable con proveedor, fecha, líneas, cantidades y precios.
7. Validar el albarán.
8. Mostrar comparación con el precio anterior.
9. Destacar en rojo o ámbar cualquier subida.

La comparación debe usar precio unitario cuando sea posible. Si no se puede determinar si dos formatos son equivalentes, mostrar “Revisión necesaria” en lugar de afirmar que existe una subida.

## Flujo de fidelización

1. Abrir “Fidelización”.
2. Ver clientes y cumpleaños próximos.
3. Crear cliente con nombre, email, fecha de cumpleaños y consentimiento.
4. Elegir una promoción de cumpleaños.
5. Preparar el email.
6. Mostrar una previsualización del email.
7. Registrar el evento como “Preparado para enviar”.

No mostrar envío real salvo que la configuración lo active expresamente.

## Backend y seguridad

- Mantén separadas organizaciones, tiendas y usuarios.
- Todas las tablas públicas deben tener RLS.
- No uses `user_metadata` para autorización.
- No expongas claves secretas al cliente.
- Usa Storage privado para imágenes de albaranes.
- Guarda el original y los datos extraídos por separado.
- Guarda un nivel de confianza y un estado de revisión.
- Incluye auditoría básica de validaciones y cambios.
- No almacenes datos de tarjetas ni credenciales bancarias.

## Modelo de datos mínimo

- `organizations`
- `stores`
- `memberships`
- `suppliers`
- `products`
- `supplier_products`
- `delivery_notes`
- `delivery_note_items`
- `price_observations`
- `customers`
- `customer_consents`
- `promotions`
- `customer_promotions`
- `message_events`

Incluye una migración SQL y datos semilla de demostración para 10 tiendas, varios proveedores, albaranes con cambios de precio y clientes con cumpleaños próximos.

## Interfaces de proveedores

Implementa estas interfaces y sus mocks:

```ts
interface OcrProvider {
  extractDeliveryNote(input: { imageUrl: string }): Promise<ExtractedDeliveryNote>
}

interface EmailProvider {
  prepareBirthdayEmail(input: BirthdayEmailInput): Promise<EmailResult>
}
```

No integres todavía un proveedor de OCR ni uno de email real. Deja las variables de entorno preparadas para hacerlo después.

## Fuera de alcance

- TPV propio.
- Cobros con tarjeta.
- Integración con bancos.
- Migración real de los TPV.
- Stock completo.
- Facturación.
- Cumplimiento certificado de VeriFactu.
- WhatsApp o SMS.
- Envío automático real de emails.

## Criterios de aceptación

- La demo arranca sin Supabase en `DEMO_MODE=true`.
- Con Supabase configurado, la app puede leer y escribir datos básicos.
- Se puede subir una imagen y completar el flujo simulado de albarán.
- Se puede visualizar una subida de precio basada en datos semilla.
- Se puede crear un cliente con consentimiento.
- Se puede preparar un email de cumpleaños sin enviarlo.
- La interfaz funciona en portátil y móvil.
- No aparecen claves secretas en el navegador.
- El README explica cómo arrancar, configurar Supabase y activar el modo demo.

## Entrega esperada

Entrega código limpio, tipos, migración SQL, seed, `.env.example`, `.env.local` con placeholders, README, y una nota de riesgos para la futura integración del TPV.
