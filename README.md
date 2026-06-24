# Click Tracker — Ethical Hacking Simulation

Mini-proyecto de phishing controlado para medir cuántos empleados hacen clic en un enlace y capturar métricas del dispositivo.

## Arquitectura

```
Email con enlace
     ↓
Netlify Function (track.js) → devuelve HTML invisible
     ↓
Navegador captura datos del cliente (resolución, idioma, UA, etc.)
     ↓
POST a Supabase REST API (insert en tabla clics)
     ↓
Redirección 302 al destino real (Google, intranet, etc.)
```

```
Dashboard protegido (dashboard.js)
     ↓
Requerimiento: ?token=ADMIN_TOKEN
     ↓
Consulta a Supabase con service_role key
     ↓
HTML con total de clics, resumen por campaña y últimos 50 registros
```

## Requisitos

- Cuenta gratuita en [Supabase](https://supabase.com)
- Cuenta gratuita en [Netlify](https://netlify.com)
- Repositorio privado en GitHub

## Configuración — Supabase

### 1. Crear proyecto
1. Ir a [app.supabase.com](https://app.supabase.com) → **New project**
2. Nombre: `click-tracker` (o el que prefieras)
3. Crear contraseña de base de datos y guardarla
4. Elegir región más cercana
5. Esperar 1-2 minutos a que se provisione

### 2. Crear tabla y políticas RLS
1. Ir a **SQL Editor** → **New query**
2. Pegar y ejecutar:

```sql
create table clics (
  id bigint generated always as identity primary key,
  campana text not null,
  url_destino text,
  ip_address text,
  user_agent text,
  idioma text,
  resolucion text,
  profundidad_color smallint,
  zona_horaria text,
  acepta_cookies boolean,
  referer text,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_clics_campana on clics (campana);

alter table clics enable row level security;

create policy "anon_insert" on clics
  for insert to anon with check (true);
```

### 3. Obtener claves de API
1. Ir a **Settings → API** (menú izquierdo, sección inferior)
2. Copiar los siguientes valores:

| Nombre en Supabase | Variable de entorno |
|---|---|
| `Project URL` | `SUPABASE_URL` |
| `anon public` / `Publishable Key` | `SUPABASE_ANON_KEY` |
| `service_role secret` (más abajo) | `SUPABASE_SERVICE_KEY` |

## Despliegue — Netlify

### 1. Subir a GitHub

```bash
cd /ruta/del/proyecto
git init
git add .
git commit -m "Initial commit"
```

Crear un repositorio **privado** en GitHub y luego:

```bash
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### 2. Importar en Netlify
1. Ir a [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Conectar con **GitHub**
4. Seleccionar el repositorio
5. No modificar settings (Netlify lee `netlify.toml` automáticamente)
6. **Deploy site**

### 3. Variables de entorno
1. **Site settings** → **Environment variables**
2. Agregar las siguientes variables:

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | `Project URL` de Supabase |
| `SUPABASE_ANON_KEY` | `anon public` key de Supabase |
| `SUPABASE_SERVICE_KEY` | `service_role secret` de Supabase |
| `ADMIN_TOKEN` | Token seguro para proteger el dashboard |

3. Ir a **Deploy** → **Trigger deploy** → **Deploy site** para aplicar los cambios

## Uso

### Link para empleados (colocar en el correo)

```
https://tu-app.netlify.app/.netlify/functions/track?campana=Nombre_Campana&url=https://destino.com
```

| Parámetro | Descripción |
|---|---|
| `campana` | Nombre identificador de la campaña (ej: `Prueba_RH_Junio`) |
| `url` | URL de destino después del clic |

### Dashboard de métricas (solo para admin)

```
https://tu-app.netlify.app/.netlify/functions/dashboard?token=TU_ADMIN_TOKEN
```

## Datos capturados por clic

| Dato | Fuente | Descripción |
|---|---|---|
| `campana` | Query param | Nombre de la campaña |
| `url_destino` | Query param | URL a la que se redirigió |
| `ip_address` | Header `x-forwarded-for` | IP del empleado |
| `user_agent` | `navigator.userAgent` | Navegador y sistema operativo |
| `idioma` | `navigator.language` | Idioma del navegador |
| `resolucion` | `screen.width x screen.height` | Resolución de pantalla |
| `profundidad_color` | `screen.colorDepth` | Profundidad de color |
| `zona_horaria` | `Intl.DateTimeFormat` | Zona horaria del empleado |
| `acepta_cookies` | `navigator.cookieEnabled` | Cookies habilitadas |
| `referer` | Header `referer` | Origen del clic |
| `creado_en` | Default DB (UTC) | Marca de tiempo |

## Solución de problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| El clic redirige pero no hay datos en Supabase | `SUPABASE_ANON_KEY` no configurada o incorrecta | Verificar env var en Netlify |
| Dashboard muestra "Sin datos" | `SUPABASE_SERVICE_KEY` incorrecta (ej: pusiste connection string en vez del JWT) | Usar el valor `service_role secret` de Supabase |
| Dashboard responde "401 No autorizado" | Token incorrecto o `ADMIN_TOKEN` no configurado | Verificar `?token=` en la URL y env var |
| Error 500 en la función | Faltan variables de entorno | Revisar Functions → Logs en Netlify |
| El navegador no ejecuta el POST | CORS o RLS mal configurada | Verificar politique RLS en Supabase |
