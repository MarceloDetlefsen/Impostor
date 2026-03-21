# CONTEXT.md — Juego del Impostor

## ¿Qué es este proyecto?

Una web app para jugar el juego del **Impostor** en grupo (estilo party game).

### Cómo funciona el juego:
- Se selecciona un **tema** antes de empezar.
- A cada jugador se le asigna una **palabra secreta** del tema (ej: "Messi").
- Uno de los jugadores recibe el rol de **Impostor** — a él no se le da la palabra, sino una **pista genérica** relacionada con el tema para que pueda intentar camuflarse.
- Por turnos, cada jugador dice **una sola palabra** relacionada con la palabra secreta, sin revelarla directamente.
- El grupo vota al final para adivinar quién es el Impostor.
- El Impostor gana si no lo descubren, o si adivina la palabra secreta antes de ser votado.

> **Nota importante sobre el orden:** El Impostor tiene ventaja si le toca hablar después, ya que puede asociar palabras que ya escuchó. Esto es parte del diseño del juego.

---

## Stack Tecnológico

### Frontend
- **HTML + JavaScript Vanilla** (sin frameworks)
- Archivos estáticos deployados en **Vercel**
- Se comunica con el backend via `fetch()` a la API REST

### Backend
- **Elysia** framework sobre **Bun** runtime
- Expone una API REST simple
- Lee los datos desde archivos CSV locales
- **Deploy en Railway o Render** (Vercel no soporta servidores Bun persistentes)

### Datos
- 3 archivos CSV independientes, uno por categoría
- Cada fila tiene dos columnas: `palabra` y `pista`
- La `pista` es lo que se le muestra al Impostor — debe ser relacionada con la palabra pero no tan obvia

---

## Categorías y CSVs

### 1. `futbolistas.csv`
- Jugadores de fútbol, principalmente de la **década 2010 en adelante**
- Incluir tanto estrellas mundiales como figuras regionales reconocidas
- Ejemplos de entradas:
  ```
  palabra,pista
  Messi,Futbolista argentino considerado uno de los mejores de la historia
  Mbappé,Delantero francés campeón del mundo en 2018
  Vinicius Jr,Extremo brasileño que juega en España
  ```

### 2. `musica.csv`
- Artistas, bandas o cantantes — **cualquier género**
- Se puede incluir contenido **underground o de nicho**, no solo mainstream
- Mezcla entre artistas en solitario y grupos/bandas
- Ejemplos de entradas:
  ```
  palabra,pista
  Arctic Monkeys,Banda de rock alternativo inglesa formada en Sheffield
  Bad Bunny,Cantante de trap y reggaeton originario de Puerto Rico
  Brockhampton,Colectivo de hip-hop americano activo principalmente en los 2010s
  ```

### 3. `videojuegos.csv`
- Videojuegos de cualquier época
- Para títulos de **los 90s o anteriores**, priorizar los más reconocidos
- Para títulos más recientes o de nicho, se puede ser más amplio
- Ejemplos de entradas:
  ```
  palabra,pista
  The Legend of Zelda,Saga de aventura y exploración de Nintendo protagonizada por Link
  Among Us,Juego multijugador de deducción social ambientado en el espacio
  Minecraft,Juego de construcción y supervivencia en mundo abierto con bloques
  ```

---

## Flujo de la Aplicación

```
1. Pantalla de inicio
   └── Selección de categoría (Futbolistas / Música / Videojuegos)

2. Configuración de partida
   └── Ingresar número de jugadores (mínimo 3, recomendado 4-8)

3. Repartición de roles (en el mismo dispositivo, pasándolo entre jugadores)
   ├── Cada jugador ve su pantalla individualmente
   ├── A N-1 jugadores les toca la misma palabra secreta
   └── A 1 jugador (el Impostor) le toca solo la pista

4. Pantalla de juego (referencia / timer opcional)
   └── Recordatorio de las reglas mientras juegan en persona

5. Pantalla de revelación
   └── Se revela quién era el Impostor y cuál era la palabra
```

---

## API Endpoints (Elysia Backend)

### `GET /palabra?categoria=futbolistas`
Devuelve una palabra aleatoria y su pista de la categoría indicada.

**Response:**
```json
{
  "palabra": "Messi",
  "pista": "Futbolista argentino considerado uno de los mejores de la historia"
}
```

**Categorías válidas:** `futbolistas`, `musica`, `videojuegos`

---

## Estructura del Proyecto

```
/
├── frontend/               # HTML + JS Vanilla (deploy en Vercel)
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── backend/                # Elysia + Bun (deploy en Railway/Render)
│   ├── src/
│   │   └── index.ts        # Entry point de Elysia
│   ├── data/
│   │   ├── futbolistas.csv
│   │   ├── musica.csv
│   │   └── videojuegos.csv
│   ├── package.json
│   └── tsconfig.json
│
└── CONTEXT.md              # Este archivo
```

---

## Consideraciones Adicionales

- El frontend debe apuntar a la URL del backend deployado (variable de entorno o constante configurable)
- El backend debe tener **CORS habilitado** para permitir requests desde el dominio de Vercel
- Los CSVs deben tener al menos **30-50 entradas por categoría** para que el juego tenga variedad
- La pista del Impostor debe ser lo suficientemente vaga para no revelar la palabra exacta, pero lo suficientemente útil para que el Impostor pueda participar sin quedar en evidencia inmediatamente
- El juego ocurre **en persona** — la app solo gestiona la asignación de roles y palabras