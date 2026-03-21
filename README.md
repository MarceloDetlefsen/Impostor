# 🎭 Juego del Impostor

Web app para jugar el **Juego del Impostor** en grupo — un party game de palabras secretas.

## ¿Cómo se juega?

1. Eligen un **tema** (Futbolistas, Música o Videojuegos)
2. A cada jugador se le asigna una **palabra secreta** — excepto al Impostor, que recibe solo una **pista**
3. Por turnos, cada uno dice **una sola palabra** relacionada
4. Votan para descubrir al Impostor
5. **Impostor gana** si no lo descubren o si adivina la palabra

## Stack

- **Frontend:** HTML + JavaScript Vanilla (deploy en Vercel)
- **Backend:** Elysia + Bun (deploy en Railway o Render)
- **Datos:** CSVs locales por categoría

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
# o: python -m http.server 8080
```

Abre `http://localhost:8080` (o el puerto que uses).

## Deploy

### Backend (Railway / Render)

1. Conecta el repo y selecciona la carpeta `backend/`
2. Comando de inicio: `bun run start`
3. Configura la variable `PORT` si el servicio lo requiere

### Frontend (Vercel)

1. Conecta el repo y selecciona la carpeta `frontend/`
2. En `frontend/config.js`, cambia `IMPOSTOR_API_URL` por la URL de tu backend deployado

## API

### `GET /palabra?categoria={futbolistas|musica|videojuegos}`

Devuelve una palabra aleatoria y su pista:

```json
{
  "palabra": "Messi",
  "pista": "Futbolista argentino considerado uno de los mejores de la historia"
}
```

## Estructura

```
/
├── frontend/          # HTML, CSS, JS (Vercel)
├── backend/           # Elysia + Bun (Railway/Render)
│   ├── src/index.ts
│   └── data/*.csv
└── CONTEXT.md
```
