# Checklist de Deploy - BuenAuto Monetización

## Variables de Entorno Requeridas

### En Vercel (Production)
```
MERCADOPAGO_ACCESS_TOKEN=your_mp_production_token
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

### Local (.env.local)
```
MERCADOPAGO_ACCESS_TOKEN=TEST-your_sandbox_token
NEXT_PUBLIC_SITE_URL=http://localhost:3005
```

## Pasos para Deploy

1. **Crear cuenta MercadoPago** (si no existe)
   - Ir a https://www.mercadopago.cl/developers
   - Crear aplicación y obtener Access Token
   - Para producción: usar credenciales de cuenta real verificada

2. **Configurar Webhook en MercadoPago** (Producción)
   - URL: `https://tu-dominio.vercel.app/api/webhooks/mercadopago`
   - Tipo: `payment`
   - Método: `POST`

3. **Deploy en Vercel**
   ```bash
   cd web
   vercel --prod
   ```

4. **Verificar post-deploy**
   - [ ] Crear usuario de prueba
   - [ ] Crear aviso de prueba
   - [ ] Probar flujo de pago con tarjeta de prueba MP
   - [ ] Verificar que el webhook publica el aviso
   - [ ] Verificar que aparece en catálogo público

## Tarjetas de Prueba MercadoPago

### Aprobar pago
- Número: `5031 7557 3453 0604`
- Vencimiento: `12/25`
- CVV: `123`

### Rechazar pago
- Número: `4000 0000 0000 0002`
- Vencimiento: `12/25`
- CVV: `123`

## Estructura de Datos (JSON Files)

Los datos se guardan en `web/data/`:
- `listings.json` - Avisos con estado de pago
- `payments.json` - Registro de pagos
- `subscriptions.json` - Suscripciones (si aplica)
- `users.json` - Usuarios
- `sessions.json` - Sesiones

**⚠️ Importante:** En Vercel (serverless), los archivos JSON se reinician en cada deploy. Para producción real, migrar a Supabase ASAP.

## URLs Importantes

- `/publicar` - Formulario de publicación con pago
- `/mis-avisos` - Dashboard con estados de pago
- `/api/listings/[id]/pay` - API para iniciar pago
- `/api/webhooks/mercadopago` - Webhook de confirmación

## Flujo de Estados de Aviso

```
[draft] → [pending_payment] → [published] → [expired]
   ↑           ↑                    ↓
   └───────────┴────────────────────┘
      (no pago = no publicación)
```

## Precauciones

1. **Boletas**: Los datos (email, RUT) se guardan en cada aviso. No se integra con SII (requiere facturación electrónica real).
2. **Expiración**: Avisos vencidos se ocultan automáticamente del catálogo público.
3. **Reembolsos**: No implementado. Si se requiere, hacer manualmente vía MP.

## Post-MVP: Migrar a Supabase

1. Crear tablas: listings, payments, users, sessions
2. Mover datos JSON a Supabase
3. Actualizar stores para usar Prisma/Supabase client
4. Configurar RLS (Row Level Security) para owners
