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
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-7540259599534777
NEXT_PUBLIC_ADSENSE_SLOT_RACES_TOP=
NEXT_PUBLIC_ADSENSE_SLOT_RACES_INLINE=
NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_RECTANGLE=
```

No uses `sb_secret_*` en el frontend. Esa llave es solo para backend, server functions o workers.

Para el login, habilita Google en Supabase Auth y configura las URLs en
Authentication > URL Configuration:

- `Site URL`: la URL publica de la app desplegada, por ejemplo `https://tu-dominio.com`.
- `Redirect URLs`: agrega `https://tu-dominio.com/races` y, si usas previews, sus URLs correspondientes.

En el entorno de deploy define `NEXT_PUBLIC_APP_URL` con esa misma URL publica, sin una ruta final,
por ejemplo `https://tu-dominio.com`. Si se omite, el frontend usa el dominio desde el que se abrio.

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
