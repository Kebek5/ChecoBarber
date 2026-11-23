# ChecoBarber · E-commerce

Tienda en línea con catálogo, carrito, pagos (Mercado Pago y PayPal), agenda de citas y panel de administración. Proyecto de la materia Programación Web II (práctica P3-1: auditoría de calidad con Lighthouse).

## Stack

| Capa               | Tecnología                                                |
| ------------------ | --------------------------------------------------------- |
| Front              | Astro (SSR, adaptador de Vercel) + React + Tailwind       |
| Back               | Node.js + Express 5 + Apollo Server (GraphQL)             |
| Base de datos      | PostgreSQL (datos) y MongoDB (bitácora de eventos)        |
| Servicios externos | Mercado Pago, PayPal, Google Calendar, Cloudinary, Resend |

## Requisitos

- **Node.js 22 LTS** (mínimo 20.19)
- **PostgreSQL** en ejecución, con la base `ecommerce`
- **MongoDB** en ejecución (local o un clúster gratuito de Atlas)
- **pnpm** o npm para el front, y npm para el back
- Chrome o Edge (para Lighthouse)

## Cómo levantarlo

### 1. Base de datos

El esquema SQL **no está incluido en el repositorio**. Debes crear la base y cargar las tablas desde un respaldo:

```bash
psql -U postgres -c "CREATE DATABASE ecommerce;"
psql -U postgres -d ecommerce -f respaldo.sql
```

Tablas que usa el sistema: `usuario`, `categoria`, `producto`, `pedido`, `detalle_pedido`, `servicio` y `cita`. Si activaste la facturación, también `factura` y `datos_fiscales`.

El catálogo necesita al menos una categoría con productos, porque esas son las páginas que se auditan.

### 2. Backend

```bash
cd back
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Edita `back/.env` (mínimo para trabajar en local):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=ecommerce
DB_SSL=false
PORT=4000
JWT_SECRET=<genera uno propio, ver abajo>
FRONT_URL=http://localhost:4321
MONGO_URI=mongodb://localhost:27017
MONGO_DB=checobarber
```

Genera un `JWT_SECRET` propio:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Arranca el servidor:

```bash
npm run dev
```

Queda en `http://localhost:4000`.

### 3. Frontend

```bash
cd front
npm install              # o: pnpm install
cp .env.example .env
```

Edita `front/.env`:

```env
GRAPHQL_URL=http://localhost:4000/
PUBLIC_GRAPHQL_WS_URL=ws://localhost:4000/graphql
```

Arranca el servidor de desarrollo:

```bash
npm dev                  # o: pnpm dev
```

Abre `http://localhost:4321`.

> Reinicia ambos servidores cada vez que cambies un `.env`: no se recargan solos.

### 4. Crear un administrador

Regístrate desde `/registro` y luego promueve tu usuario en PostgreSQL:

```sql
UPDATE usuario SET rol = 'admin' WHERE correo = 'tu@correo.com';
```

Vuelve a iniciar sesión y entra a `/dashboard`.

## Variables de entorno

### Obligatorias para ver la tienda

| Dónde | Variable | Para qué |
| --- | --- | --- |
| back | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión a PostgreSQL |
| back | `DB_SSL` | `false` en local, `true` en una base remota con SSL |
| back | `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma de sesiones |
| back | `MONGO_URI`, `MONGO_DB` | Bitácora de eventos |
| back | `FRONT_URL`, `PORT` | CORS y puerto del API |
| front | `GRAPHQL_URL` | URL del API (SSR) |
| front | `PUBLIC_GRAPHQL_WS_URL` | WebSocket de avisos de productos nuevos |

### Opcionales (cada una habilita una función)

| Función | Variables |
| --- | --- |
| Pagos con Mercado Pago | back: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_POINT_TERMINAL_ID` · front: `PUBLIC_MP_PUBLIC_KEY` |
| Pagos con PayPal | back: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` (`sandbox`/`live`), `PAYPAL_WEBHOOK_ID` · front: `PUBLIC_PAYPAL_CLIENT_ID` |
| Webhooks de pago | back: `PUBLIC_API_URL` (URL pública, por ejemplo ngrok; los proveedores no alcanzan `localhost`) |
| Citas en Google Calendar | back: `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` (si faltan, las citas se agendan sin Calendar) |
| Subir fotos de producto | front: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Mapa del footer | front: `PUBLIC_SHOP_MAP_QUERY` |
| Facturación por correo | back: `FACTURA_*`, `RESEND_API_KEY`, `MAIL_FROM` |

Sin las opcionales la tienda funciona; solo se deshabilita esa función.

## Páginas a auditar

La práctica audita **3 páginas**, siempre en Mobile y con las mismas URLs antes y después.

| Página | Ruta | Archivo |
| --- | --- | --- |
| Home | `/` | `front/src/pages/index.astro` |
| Categoría | `/categoria/1` | `front/src/pages/categoria/[id].astro` |
| Producto | `/producto/1` | `front/src/pages/producto/[id].astro` |

Los ids `1` deben existir en tu base de datos. Si no, usa una categoría y un producto reales.

En producción: `https://checo-barber.vercel.app/`, `/categoria/1` y `/producto/1`.
## Cómo auditar
1. Abre la página en una **ventana de incógnito** (visitante anónimo, sin extensiones).
2. `F12` → pestaña **Lighthouse** → **Mode: Navigation** → **Device: Mobile**.
3. Marca Performance, Accessibility, Best Practices y SEO (PWA no se evalúa).
4. **Analyze page load** y guarda la captura en `assets/`.
5. Metas mínimas (Mobile): **Accessibility ≥ 90 · Performance ≥ 80 · SEO ≥ 90**.
### Dónde medir cada categoría

| Categoría     | Local (`npm run dev`)                              | Sitio desplegado |
| ------------- | -------------------------------------------------- | ---------------- |
| Accessibility | Confiable                                          | Confiable        |
| SEO           | Confiable                                          | Confiable        |
| Performance   | **No usar**: el modo desarrollo castiga el puntaje | **Usar este**    |

Para auditar en local, desactiva antes la barra de desarrollo de Astro, porque inyecta elementos que ensucian el reporte:
```bash
cd front npm astro preferences disable devToolbar
```

El adaptador de Vercel no incluye servidor de preview, así que `npm preview` no sirve el build real. Para Performance usa el sitio desplegado.
## Qué se mejoró en la práctica

- **Accesibilidad:** contraste mínimo 4.5:1, un solo `h1` por página, `aria-live` en el contador del carrito, enlace "Saltar al contenido", foco visible y `prefers-reduced-motion`.
- **Rendimiento:** logo en WebP con prioridad de carga, imágenes con `width`/`height` y `lazy`, directivas `client:visible`/`client:idle` y WebSocket diferido.
- **SEO:** `title` y `description` por página, `canonical`, Open Graph, JSON-LD `Product`, y `sitemap.xml` y `robots.txt` dinámicos. Resultados y análisis completos en `reporte-p31.md`. 

## Solución de problemas

| Síntoma                                                 | Causa y solución                                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `The server does not support SSL connections`           | Tu PostgreSQL local no usa SSL. Pon `DB_SSL=false` en `back/.env` y reinicia.                                        |
| `password authentication failed`                        | `DB_PASSWORD` no coincide con tu PostgreSQL.                                                                         |
| `database "ecommerce" does not exist`                   | Falta crear la base (paso 1).                                                                                        |
| La tienda carga sin productos o con "Error de conexión" | El back no está corriendo, o `GRAPHQL_URL` no apunta a `http://localhost:4000/`.                                     |
| Error al iniciar el back por MongoDB                    | Inicia MongoDB o corrige `MONGO_URI`.                                                                                |
| No llegan los avisos de productos nuevos                | Revisa `PUBLIC_GRAPHQL_WS_URL` (`ws://localhost:4000/graphql`).                                                      |
| Los pagos no se confirman solos                         | Los webhooks necesitan una URL pública (`PUBLIC_API_URL`). En local usa el botón de sincronizar del panel de cobros. |