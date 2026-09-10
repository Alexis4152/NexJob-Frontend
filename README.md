# NexJob Frontend

Frontend (React 18 + Vite + Tailwind CSS + React Router + Axios) de NexJob, la plataforma
que conecta clientes con prestadores de servicio.

## Requisitos

- Node.js 18+
- El backend (`NexJobBack`) corriendo en `http://localhost:8082` (ver su README)

## Instalar y correr

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5175`. En desarrollo, Vite hace proxy de
`/api` y `/uploads` hacia `http://localhost:8082` (ver `vite.config.js`).

## Estructura

- `src/api` — clientes axios por modulo (auth, categorias, prestadores, servicios, contrataciones, soporte, configuracion)
- `src/context` — sesion (Auth), notificaciones/toasts, configuracion de marca de la plataforma
- `src/layouts` — shell publico, panel del prestador y panel de administracion
- `src/pages` — paginas publicas, `pages/provider` (tablero Kanban, servicios, perfil) y `pages/admin`

## Build de produccion

```bash
npm run build
```

Genera `dist/`. Configura `VITE_API_URL` en build time si el backend vive en otro dominio.
