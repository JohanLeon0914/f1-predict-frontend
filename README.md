# F1 ML Predicts Frontend

Frontend separado en Next.js, TypeScript y Tailwind para consumir la API local del modelo F1 Ranker.

## Comandos

Backend desde la raiz del repo:

```bash
.venv/bin/python scripts/run_api.py
```

Frontend:

```bash
cd frontend
npm run dev
```

Rutas:

- `/`: reservada para una landing futura.
- `/predicts`: simulacion libre de carreras.
- `/races`: calendario futuro y prediccion por carrera seleccionada.
- `/history`: historico de predicciones guardadas.

## Variables

Copia `.env.example` a `.env.local` y ajusta valores:

```bash
ML_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-7540259599534777
NEXT_PUBLIC_ADSENSE_SLOT_RACES_TOP=
NEXT_PUBLIC_ADSENSE_SLOT_RACES_INLINE=
NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_RECTANGLE=
SUPABASE_SECRET_KEY=
KOFI_VERIFICATION_TOKEN=
KOFI_FOUNDING_PROMO_START=2026-09-03T00:00:00.000Z
KOFI_FOUNDING_PROMO_END=2026-10-03T00:00:00.000Z
```

No uses `sb_secret_*` en el frontend. Esa llave es solo para backend, server functions o workers.

Para el login, habilita Google en Supabase Auth y agrega la URL publica de tu app en
Authentication > URL Configuration.

## Supabase

Proyecto esperado: `f1-ml-predicts`.

Ejecuta esta migracion en el SQL editor de Supabase:

```txt
supabase/migrations/20260828161000_create_prediction_tables.sql
```

La migracion habilita RLS para que cada usuario autenticado solo pueda insertar y leer sus propias predicciones.

Usuarios premium:

```sql
insert into public.premium_users (email) values ('usuario@gmail.com');
```

Los usuarios premium no ven anuncios y no tienen los limites del plan gratuito.

## Ko-fi Support

La pagina publica de soporte vive en `/support` y apunta a:

```txt
https://ko-fi.com/grdx1
```

Configura el webhook de Ko-fi en:

```txt
https://www.grdx1.com/api/webhooks/kofi
```

Variables necesarias del backend:

```bash
KOFI_VERIFICATION_TOKEN=
KOFI_FOUNDING_PROMO_START=2026-09-03T00:00:00.000Z
KOFI_FOUNDING_PROMO_END=2026-10-03T00:00:00.000Z
SUPABASE_SECRET_KEY=
```

`KOFI_FOUNDING_PROMO_END` debe quedar un mes despues del inicio real de la campana. Solo las donaciones Ko-fi recibidas dentro de esa ventana reciben automaticamente `unlimited_f1` con `source = 'kofi_founding_supporter'`. Pagos fuera de la ventana se guardan en `kofi_payments`, pero no reciben ese acceso automaticamente.

Para probar, usa el boton de test webhook en Ko-fi. El endpoint espera un `POST` con form data y un campo `data` que contiene el JSON del evento. La donacion se procesa solo si `verification_token` coincide con `KOFI_VERIFICATION_TOKEN`; los reintentos se deduplican por `message_id`.

## Google AdSense

Variables:

```bash
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-7540259599534777
NEXT_PUBLIC_ADSENSE_SLOT_RACES_TOP=
NEXT_PUBLIC_ADSENSE_SLOT_RACES_INLINE=
NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_RECTANGLE=
```

En AdSense:

1. Agrega y verifica el dominio de la app.
2. Crea unidades de anuncio Display responsive para cada ubicacion.
3. Copia el publisher ID (`ca-pub-...`) en `NEXT_PUBLIC_ADSENSE_CLIENT`.
4. Copia cada `data-ad-slot` en su variable correspondiente.
5. Publica el sitio en un dominio aprobado; en localhost normalmente no veras anuncios reales.
