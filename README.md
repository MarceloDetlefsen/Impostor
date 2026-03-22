# 🎭 Juego del Impostor

Web app para jugar el **Juego del Impostor** en grupo — un party game de palabras secretas.

## 🚀 Deploy

- **Frontend:** https://impostor-lyi1s8drp-marcelodetlefsens-projects.vercel.app
- **Backend:** https://impostor-production-e89b.up.railway.app

## ¿Cómo se juega?

1. Eligen un **tema** (Futbolistas, Música, Videojuegos o Famosos)
2. Ingresan el **número de jugadores** (3–8) y el **nombre** de cada uno
3. Cada jugador ve su rol en pantallas separadas: **mantienen apretada** la tarjeta para ver su palabra o pista
4. El **Impostor** recibe solo una pista (1–2 palabras); el resto recibe la palabra secreta
5. Una **ruleta** sortea quién empieza
6. Por turnos, cada uno dice **una sola palabra** relacionada
7. Votan para descubrir al Impostor
8. **Impostor gana** si no lo descubren o si adivina la palabra

> El juego se juega **en persona** — la app gestiona roles, palabras y el orden de inicio.

## Stack

- **Frontend:** HTML + CSS + JavaScript Vanilla (deploy en Vercel)
- **Backend:** Elysia + Bun (deploy en Railway)
- **Datos:** CSVs con palabra + pista por categoría (~50 entradas cada uno)

## Desarrollo local

### 1. Backend (Bun)

```bash
cd backend
bun install
bun run dev
```

El API estará en `http://localhost:3000`.

### 2. Frontend

Sirve la carpeta `frontend/` con cualquier servidor estático:

```bash
cd frontend
npx serve .
```

Abre `http://localhost:8080` (o el puerto que uses).

## Deploy

### Backend (Railway)

1. Conecta el repo y selecciona la carpeta `backend/`
2. Comando de inicio: `bun run start`
3. Configura la variable `PORT` si el servicio lo requiere
4. URL generada: https://impostor-production-e89b.up.railway.app

### Frontend (Vercel)

1. Conecta el repo y selecciona la carpeta `frontend/`
2. En `frontend/config.js`, asegúrate de que `IMPOSTOR_API_URL` apunte a la URL de Railway:

```js
window.IMPOSTOR_API_URL = "https://impostor-production-e89b.up.railway.app";
```

## API

### `GET /palabra?categoria={futbolistas|musica|videojuegos|famosos}`

Devuelve una palabra aleatoria y su pista (ambigua, 1–2 palabras para el Impostor):

```json
{
  "palabra": "Messi",
  "pista": "Argentina"
}
```

### `GET /health`

Comprueba que el servidor está activo.

## Estructura

```
/
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── config.js          # URL del backend
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