/**
 * Juego del Impostor - Frontend
 * Configura la URL del backend aquí (o usa variable de entorno en build)
 */
const API_BASE = (typeof window !== "undefined" && window.IMPOSTOR_API_URL) || "http://localhost:3000";

const CATEGORY_LABELS = {
  futbolistas: "⚽ Futbolistas",
  musica: "🎵 Música",
  videojuegos: "🎮 Videojuegos",
};

const screens = {
  home: "screen-home",
  config: "screen-config",
  roles: "screen-roles",
  game: "screen-game",
  reveal: "screen-reveal",
};

let state = {
  categoria: null,
  numJugadores: null,
  palabra: null,
  pista: null,
  impostorIndex: 0,
  playerCards: [],
  currentPlayerIndex: 0,
};

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const screen = document.getElementById(screens[screenId] || screenId);
  if (screen) screen.classList.add("active");
}

function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  overlay.classList.toggle("hidden", !show);
}

function showError(message) {
  document.getElementById("error-message").textContent = message;
  document.getElementById("error-overlay").classList.remove("hidden");
}

function hideError() {
  document.getElementById("error-overlay").classList.add("hidden");
}

async function fetchPalabra(categoria) {
  const res = await fetch(`${API_BASE}/palabra?categoria=${encodeURIComponent(categoria)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setupPlayerCards() {
  const { palabra, pista, numJugadores } = state;
  const cards = [];
  for (let i = 0; i < numJugadores; i++) {
    cards.push({ type: "palabra", value: palabra });
  }
  state.impostorIndex = Math.floor(Math.random() * numJugadores);
  cards[state.impostorIndex] = { type: "pista", value: pista };
  state.playerCards = cards;
  state.currentPlayerIndex = 0;
}

function renderRoleScreen() {
  const card = state.playerCards[state.currentPlayerIndex];
  const isImpostor = card.type === "pista";

  document.getElementById("player-indicator").textContent = `Jugador ${state.currentPlayerIndex + 1}`;
  document.getElementById("role-label").textContent = isImpostor
    ? "Eres el Impostor — Tu pista"
    : "Tu palabra secreta";
  document.getElementById("role-value").textContent = card.value;

  const roleCard = document.getElementById("role-card");
  roleCard.classList.toggle("impostor", isImpostor);

  const btn = document.getElementById("next-player-btn");
  const isLast = state.currentPlayerIndex === state.numJugadores - 1;
  btn.textContent = isLast ? "Empezar partida →" : "Siguiente jugador →";
}

function goNextPlayer() {
  if (state.currentPlayerIndex < state.numJugadores - 1) {
    state.currentPlayerIndex++;
    renderRoleScreen();
  } else {
    showScreen("game");
  }
}

function startGame() {
  state.categoria = null;
  state.numJugadores = null;
  state.palabra = null;
  state.pista = null;
  state.playerCards = [];
  showScreen("home");
}

// Event listeners
document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.categoria = btn.dataset.categoria;
    document.getElementById("selected-category").textContent =
      CATEGORY_LABELS[state.categoria];
    document.querySelectorAll(".player-btn").forEach((b) => b.classList.remove("selected"));
    state.numJugadores = null;
    showScreen("config");
  });
});

document.querySelectorAll(".player-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".player-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.numJugadores = parseInt(btn.dataset.players, 10);
  });
});

document.getElementById("back-to-home").addEventListener("click", () => {
  state.categoria = null;
  state.numJugadores = null;
  showScreen("home");
});

document.getElementById("next-player-btn").addEventListener("click", goNextPlayer);

document.getElementById("reveal-btn").addEventListener("click", () => {
  document.getElementById("reveal-word").textContent = state.palabra;
  document.getElementById("reveal-impostor-num").textContent = state.impostorIndex + 1;
  showScreen("reveal");
});

document.getElementById("play-again-btn").addEventListener("click", startGame);

document.getElementById("retry-btn").addEventListener("click", () => {
  hideError();
  if (state.categoria && !state.palabra) {
    initRoles();
  }
});

document.getElementById("start-game-btn").addEventListener("click", async () => {
  if (!state.numJugadores) return;
  initRoles();
});

async function initRoles() {
  showLoading(true);
  hideError();
  try {
    const data = await fetchPalabra(state.categoria);
    state.palabra = data.palabra;
    state.pista = data.pista;
    setupPlayerCards();
    renderRoleScreen();
    showScreen("roles");
  } catch (err) {
    showError(err.message || "No se pudo conectar con el servidor. ¿Está el backend ejecutándose?");
  } finally {
    showLoading(false);
  }
}
