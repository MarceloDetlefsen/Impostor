# 🎭 Juego del Impostor

Web app para jugar **Impostor** en modo local o remoto.

## 🚀 Deploy

- Frontend: https://impostor-lyi1s8drp-marcelodetlefsens-projects.vercel.app
- Backend: https://impostor-production-e89b.up.railway.app

## Modos de juego

### 1) Modo local

- Un solo dispositivo.
- Elegís categoría y cantidad de jugadores.
- Cada jugador revela su tarjeta manteniendo apretado.
- Se sortea orden con ruleta.
- Se revela impostor y palabra al final.

### 2) Modo remoto (parties)

- Host crea lobby y comparte código.
- Otros entran con código.
- Solo el host elige categoría, inicia partida, revela resultado y puede cerrar lobby.
- Cada jugador revela su propia tarjeta desde su dispositivo.
- Orden de inicio con ruleta.
- Rematch sin volver a pedir nombres.
- Si el host cierra lobby, los demás salen automáticamente.

## Categorías

- `futbolistas`
- `musica`
- `videojuegos`
- `famosos`

## Stack

- Frontend: HTML + CSS + JavaScript Vanilla
- Backend: Elysia + Bun
- Datos: CSV (`palabra,pista`) por categoría

## Desarrollo local

### Backend

```bash
cd backend
bun install
bun run dev
```

API local: `http://localhost:3000`

### Frontend

```bash
cd frontend
npx serve .
```

Abre `http://localhost:8080` (o el puerto que muestre tu servidor).

## Config frontend

En `frontend/config.js`:

- Local:
```js
window.IMPOSTOR_API_URL = "http://localhost:3000";
```

- Producción:
```js
window.IMPOSTOR_API_URL = "https://impostor-production-e89b.up.railway.app";
```

## API principal

### Básica

- `GET /categorias`
- `GET /palabra?categoria=...`
- `GET /health`

### Lobbies remotos

- `POST /lobbies` (crear)
- `POST /lobbies/:code/join`
- `GET /lobbies/:code?playerId=...`
- `POST /lobbies/:code/name`
- `POST /lobbies/:code/ready`
- `POST /lobbies/:code/categoria` (solo host)
- `POST /lobbies/:code/start` (solo host)
- `POST /lobbies/:code/reveal`
- `POST /lobbies/:code/phase` (solo host)
- `POST /lobbies/:code/close` (solo host)

## Estructura

```text
/
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── config.js
├── backend/
│   ├── src/index.ts
│   └── data/
│       ├── futbolistas.csv
│       ├── musica.csv
│       ├── videojuegos.csv
│       └── famosos.csv
├── CONTEXT.md
└── README.md
```

## 👨‍💻 Autor

Marcelo Detlefsen - 24554