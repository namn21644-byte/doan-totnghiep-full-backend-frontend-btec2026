# NetworkScan Frontend

React 18 + Vite + TypeScript + Tailwind CSS + Ant Design.

## Phase 1 scope

- Login page (demo account shortcuts, cybersecurity styling).
- Protected routing with Zustand auth store + persisted tokens.
- Axios client with automatic access-token refresh on 401.
- Collapsible dashboard layout with sidebar, header, dark/light toggle.
- Dashboard page with KPI cards + Recharts (pie + bar) and a live health tag.

## Run manually (without docker)

```bash
cd frontend
npm install
# Point the app at your backend (defaults to http://localhost:8080/api/v1):
# create a .env.local with VITE_API_BASE_URL if needed
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Environment variables

| Variable             | Description                    | Default                          |
| -------------------- | ------------------------------ | -------------------------------- |
| `VITE_API_BASE_URL`  | Base URL for the REST API      | `http://localhost:8080/api/v1`   |
| `VITE_WS_BASE_URL`   | Base URL for WebSocket (P4+)   | `ws://localhost:8080/ws`         |
