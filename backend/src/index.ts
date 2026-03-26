import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

type Card = { palabra: string; pista: string };
type Phase = "lobby" | "reveal" | "order" | "in_game" | "result";
type Player = {
  id: string;
  name: string;
  ready: boolean;
  revealed: boolean;
  joinedAt: number;
};
type Lobby = {
  code: string;
  hostId: string;
  players: Player[];
  phase: Phase;
  categoria: string | null;
  palabra: string | null;
  pista: string | null;
  impostorId: string | null;
  order: string[];
  createdAt: number;
  updatedAt: number;
};

const dataDir = join(import.meta.dir, "..", "data");
const lobbies = new Map<string, Lobby>();

function getValidCategories(): string[] {
  if (!existsSync(dataDir)) return [];
  return readdirSync(dataDir)
    .filter((f) => f.endsWith(".csv"))
    .map((f) => f.replace(".csv", "").toLowerCase())
    .sort();
}

function loadCsv(category: string): Card[] {
  const filePath = join(dataDir, `${category}.csv`);
  if (!existsSync(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const entries: Card[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([^,]+),(.*)$/);
    if (match) {
      entries.push({ palabra: match[1].trim(), pista: match[2].trim() });
    }
  }

  return entries;
}

function getRandomWord(category: string): Card | null {
  const entries = loadCsv(category);
  if (entries.length === 0) return null;
  return entries[Math.floor(Math.random() * entries.length)];
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createUniqueCode(): string {
  let code = randomCode();
  while (lobbies.has(code)) code = randomCode();
  return code;
}

function rotateOrder(list: string[], startIdx: number): string[] {
  return [...list.slice(startIdx), ...list.slice(0, startIdx)];
}

function publicLobbyView(lobby: Lobby) {
  return {
    code: lobby.code,
    hostId: lobby.hostId,
    phase: lobby.phase,
    categoria: lobby.categoria,
    players: lobby.players.map((p) => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
      revealed: p.revealed,
    })),
    order:
      lobby.phase === "order" || lobby.phase === "in_game" || lobby.phase === "result"
        ? lobby.order
        : [],
  };
}

const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["content-type"],
    })
  )
  .onBeforeHandle(({ request, set }) => {
    if (request.method === "OPTIONS") {
      set.status = 204;
      return "";
    }
  })
  .get("/categorias", () => ({ categorias: getValidCategories() }))
  .get("/palabra", ({ query, set }) => {
    const categoria = query.categoria?.toLowerCase();
    const validCategories = getValidCategories();

    if (!categoria || !validCategories.includes(categoria)) {
      set.status = 400;
      return {
        error: "Categoría inválida",
        categoriasValidas: validCategories,
      };
    }

    const result = getRandomWord(categoria);
    if (!result) {
      set.status = 500;
      return { error: "No hay datos para esta categoría" };
    }

    return result;
  })
  .post("/lobbies", ({ body, set }) => {
    const payload = body as { name?: string };
    const name = (payload.name || "Host").trim().slice(0, 24);
    if (!name) {
      set.status = 400;
      return { error: "Nombre requerido" };
    }

    const code = createUniqueCode();
    const playerId = randomId("player");
    const now = Date.now();

    const lobby: Lobby = {
      code,
      hostId: playerId,
      players: [{ id: playerId, name, ready: false, revealed: false, joinedAt: now }],
      phase: "lobby",
      categoria: null,
      palabra: null,
      pista: null,
      impostorId: null,
      order: [],
      createdAt: now,
      updatedAt: now,
    };

    lobbies.set(code, lobby);
    return { code, playerId, lobby: publicLobbyView(lobby) };
  })
  .post("/lobbies/:code/join", ({ params, body, set }) => {
    const lobby = lobbies.get(params.code.toUpperCase());
    if (!lobby) {
      set.status = 404;
      return { error: "Lobby no encontrado" };
    }
    if (lobby.phase !== "lobby") {
      set.status = 400;
      return { error: "La partida ya empezó" };
    }

    const payload = body as { name?: string };
    const name = (payload.name || "Jugador").trim().slice(0, 24) || "Jugador";

    const playerId = randomId("player");
    lobby.players.push({ id: playerId, name, ready: false, revealed: false, joinedAt: Date.now() });
    lobby.updatedAt = Date.now();
    return { code: lobby.code, playerId, lobby: publicLobbyView(lobby) };
  })
  .post("/lobbies/:code/name", ({ params, body, set }) => {
    const lobby = lobbies.get(params.code.toUpperCase());
    if (!lobby) {
      set.status = 404;
      return { error: "Lobby no encontrado" };
    }

    const payload = body as { playerId?: string; name?: string };
    const player = lobby.players.find((p) => p.id === payload.playerId);
    if (!player) {
      set.status = 404;
      return { error: "Jugador no encontrado" };
    }

    const name = (payload.name || "").trim().slice(0, 24);
    if (!name) {
      set.status = 400;
      return { error: "Nombre requerido" };
    }

    player.name = name;
    lobby.updatedAt = Date.now();
    return { lobby: publicLobbyView(lobby) };
  })
  .get("/lobbies/:code", ({ params, query, set }) => {
    const lobby = lobbies.get(params.code.toUpperCase());
    if (!lobby) {
      set.status = 404;
      return { error: "Lobby no encontrado" };
    }

    const playerId = String(query.playerId || "");
    const player = lobby.players.find((p) => p.id === playerId);
    const yourCard =
      lobby.phase !== "lobby" && player
        ? {
            role: lobby.impostorId === player.id ? "impostor" : "jugador",
            value: lobby.impostorId === player.id ? `Pistas: ${lobby.pista || ""}` : lobby.palabra || "",
          }
        : null;

    const result =
      lobby.phase === "result"
        ? {
            palabra: lobby.palabra,
            impostorId: lobby.impostorId,
            impostorName: lobby.players.find((p) => p.id === lobby.impostorId)?.name || null,
          }
        : null;

    return {
      lobby: publicLobbyView(lobby),
      yourCard,
      isHost: player ? player.id === lobby.hostId : false,
      result,
    };
  })
  .post("/lobbies/:code/ready", ({ params, body, set }) => {
    const lobby = lobbies.get(params.code.toUpperCase());
    if (!lobby) {
      set.status = 404;
      return { error: "Lobby no encontrado" };
    }

    const payload = body as { playerId?: string; ready?: boolean };
    const player = lobby.players.find((p) => p.id === payload.playerId);
    if (!player) {
      set.status = 404;
      return { error: "Jugador no encontrado" };
    }

    player.ready = Boolean(payload.ready);
    lobby.updatedAt = Date.now();
    return { lobby: publicLobbyView(lobby) };
  })
  .post("/lobbies/:code/categoria", ({ params, body, set }) => {
    const lobby = lobbies.get(params.code.toUpperCase());
    if (!lobby) {
      set.status = 404;
      return { error: "Lobby no encontrado" };
    }
    if (lobby.phase !== "lobby") {
      set.status = 400;
      return { error: "Solo se puede cambiar en fase lobby" };
    }

    const payload = body as { playerId?: string; categoria?: string };
    if (payload.playerId !== lobby.hostId) {
      set.status = 403;
      return { error: "Solo el host puede cambiar categoría" };
    }

    const categoria = String(payload.categoria || "").toLowerCase();
    const validCategories = getValidCategories();
    if (!validCategories.includes(categoria)) {
      set.status = 400;
      return { error: "Categoría inválida" };
    }

    lobby.categoria = categoria;
    lobby.updatedAt = Date.now();
    return { lobby: publicLobbyView(lobby) };
  })
  .post("/lobbies/:code/start", ({ params, body, set }) => {
    const lobby = lobbies.get(params.code.toUpperCase());
    if (!lobby) {
      set.status = 404;
      return { error: "Lobby no encontrado" };
    }

    const payload = body as { playerId?: string; categoria?: string };
    if (payload.playerId !== lobby.hostId) {
      set.status = 403;
      return { error: "Solo el host puede iniciar" };
    }
    if (lobby.players.length < 3) {
      set.status = 400;
      return { error: "Mínimo 3 jugadores" };
    }

    const categoria = String(payload.categoria || "").toLowerCase();
    const validCategories = getValidCategories();
    if (!validCategories.includes(categoria)) {
      set.status = 400;
      return { error: "Categoría inválida" };
    }

    const card = getRandomWord(categoria);
    if (!card) {
      set.status = 500;
      return { error: "No hay datos para esta categoría" };
    }

    const impostorIdx = Math.floor(Math.random() * lobby.players.length);
    const startIdx = Math.floor(Math.random() * lobby.players.length);
    lobby.categoria = categoria;
    lobby.palabra = card.palabra;
    lobby.pista = card.pista;
    lobby.impostorId = lobby.players[impostorIdx].id;
    lobby.order = rotateOrder(lobby.players.map((p) => p.id), startIdx);
    lobby.phase = "reveal";
    lobby.players.forEach((p) => {
      p.ready = false;
      p.revealed = false;
    });
    lobby.updatedAt = Date.now();

    return { lobby: publicLobbyView(lobby) };
  })
  .post("/lobbies/:code/reveal", ({ params, body, set }) => {
    const lobby = lobbies.get(params.code.toUpperCase());
    if (!lobby) {
      set.status = 404;
      return { error: "Lobby no encontrado" };
    }

    const payload = body as { playerId?: string };
    const player = lobby.players.find((p) => p.id === payload.playerId);
    if (!player) {
      set.status = 404;
      return { error: "Jugador no encontrado" };
    }

    player.revealed = true;
    if (lobby.players.every((p) => p.revealed)) {
      lobby.phase = "order";
    }
    lobby.updatedAt = Date.now();
    return { lobby: publicLobbyView(lobby) };
  })
  .post("/lobbies/:code/phase", ({ params, body, set }) => {
    const lobby = lobbies.get(params.code.toUpperCase());
    if (!lobby) {
      set.status = 404;
      return { error: "Lobby no encontrado" };
    }

    const payload = body as { playerId?: string; phase?: Phase };
    if (payload.playerId !== lobby.hostId) {
      set.status = 403;
      return { error: "Solo el host puede cambiar fase" };
    }
    if (payload.phase === "in_game" || payload.phase === "result") {
      lobby.phase = payload.phase;
      lobby.updatedAt = Date.now();
    }
    return { lobby: publicLobbyView(lobby) };
  })
  .post("/lobbies/:code/close", ({ params, body, set }) => {
    const code = params.code.toUpperCase();
    const lobby = lobbies.get(code);
    if (!lobby) {
      set.status = 404;
      return { error: "Lobby no encontrado" };
    }

    const payload = body as { playerId?: string };
    if (payload.playerId !== lobby.hostId) {
      set.status = 403;
      return { error: "Solo el host puede cerrar el lobby" };
    }

    lobbies.delete(code);
    return { ok: true };
  })
  .get("/health", () => ({ ok: true, lobbies: lobbies.size }))
  .listen(process.env.PORT || 3000);

console.log(`🎭 Impostor API running at http://localhost:${app.server?.port}`);
