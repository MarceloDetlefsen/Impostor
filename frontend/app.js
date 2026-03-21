/**
 * Juego del Impostor - Frontend
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
  names: "screen-names",
  roles: "screen-roles",
  roulette: "screen-roulette",
  game: "screen-game",
  reveal: "screen-reveal",
};

let state = {
  categoria: null,
  numJugadores: null,
  playerNames: [],
  palabra: null,
  pista: null,
  impostorIndex: 0,
  playerCards: [],
  gameOrder: [],
  currentNameIndex: 0,
};

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const screen = document.getElementById(screens[screenId] || screenId);
  if (screen) screen.classList.add("active");
}

function showLoading(show) {
  document.getElementById("loading-overlay").classList.toggle("hidden", !show);
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
  const { palabra, pista, numJugadores, playerNames } = state;
  const cards = [];
  for (let i = 0; i < numJugadores; i++) {
    cards.push({ type: "palabra", value: palabra, name: playerNames[i] });
  }
  state.impostorIndex = Math.floor(Math.random() * numJugadores);
  cards[state.impostorIndex] = { type: "pista", value: pista, name: playerNames[state.impostorIndex] };
  state.playerCards = cards;
}

function renderNamesScreen() {
  state.currentNameIndex = 0;
  state.playerNames = [];
  document.getElementById("names-instruction").textContent = "Nombre del jugador 1";
  document.getElementById("player-name-input").value = "";
  document.getElementById("player-name-input").focus();
  document.getElementById("names-list").innerHTML = "";
  document.getElementById("next-name-btn").textContent = "Siguiente";
}

function renderNextName() {
  const idx = state.currentNameIndex;
  const total = state.numJugadores;
  const input = document.getElementById("player-name-input");
  const btn = document.getElementById("next-name-btn");

  if (idx < total) {
    document.getElementById("names-instruction").textContent = `Nombre del jugador ${idx + 1}`;
    input.value = "";
    input.focus();
    btn.textContent = idx === total - 1 ? "Comenzar" : "Siguiente";
  }
}

function renderNamesList() {
  const list = document.getElementById("names-list");
  list.innerHTML = state.playerNames
    .map((n) => `<span class="name-chip">${escapeHtml(n)}</span>`)
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function addPlayerName() {
  const input = document.getElementById("player-name-input");
  const name = input.value.trim() || `Jugador ${state.currentNameIndex + 1}`;
  state.playerNames.push(name);
  renderNamesList();
  state.currentNameIndex++;
  if (state.currentNameIndex >= state.numJugadores) {
    initRoles();
    return;
  }
  renderNextName();
}

function renderPlayerCards() {
  const grid = document.getElementById("player-cards-grid");
  grid.innerHTML = state.playerCards
    .map(
      (card, i) => `
    <div class="player-card ${card.type === "pista" ? "impostor" : ""}" data-index="${i}" tabindex="0" role="button">
      <span class="card-name">${escapeHtml(card.name)}</span>
      <span class="card-secret" data-secret="${escapeHtml(card.value)}">Mantén apretado</span>
    </div>
  `
    )
    .join("");

  grid.querySelectorAll(".player-card").forEach((el) => {
    const secretEl = el.querySelector(".card-secret");
    const secret = secretEl.dataset.secret;

    const show = () => {
      secretEl.textContent = secret;
      el.classList.add("revealed");
    };
    const hide = () => {
      secretEl.textContent = "Mantén apretado";
      el.classList.remove("revealed");
    };

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      show();
    });
    el.addEventListener("pointerup", hide);
    el.addEventListener("pointerleave", hide);
    el.addEventListener("pointercancel", hide);
  });
}

function runRoulette() {
  const names = [...state.playerNames];
  const wheel = document.getElementById("roulette-wheel");
  const resultEl = document.getElementById("roulette-result");
  const doneBtn = document.getElementById("roulette-done-btn");

  resultEl.textContent = "";
  resultEl.classList.add("hidden");
  doneBtn.classList.add("hidden");

  const segmentAngle = 360 / names.length;
  wheel.innerHTML = names
    .map(
      (name, i) => {
        const angle = i * segmentAngle + segmentAngle / 2;
        return `<span class="roulette-name" style="--angle: ${angle}deg">${escapeHtml(name)}</span>`;
      }
    )
    .join("");

  wheel.style.transform = "rotate(0deg)";

  const winnerIndex = Math.floor(Math.random() * names.length);
  const winner = names[winnerIndex];
  const spins = 5 + Math.floor(Math.random() * 2);
  const targetRotation = 360 * spins + (360 - winnerIndex * segmentAngle - segmentAngle / 2);

  requestAnimationFrame(() => {
    wheel.style.transform = `rotate(${targetRotation}deg)`;
  });

  setTimeout(() => {
    resultEl.textContent = `¡${winner} empieza!`;
    resultEl.classList.remove("hidden");
    doneBtn.classList.remove("hidden");
    state.gameOrder = [...names.slice(winnerIndex), ...names.slice(0, winnerIndex)];
  }, 3100);
}

function startGame() {
  state.categoria = null;
  state.numJugadores = null;
  state.playerNames = [];
  state.palabra = null;
  state.pista = null;
  state.playerCards = [];
  showScreen("home");
}

// Event listeners
document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.categoria = btn.dataset.categoria;
    document.getElementById("selected-category").textContent = CATEGORY_LABELS[state.categoria];
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

document.getElementById("to-names-btn").addEventListener("click", () => {
  if (!state.numJugadores) return;
  renderNamesScreen();
  showScreen("names");
});

document.getElementById("back-to-config").addEventListener("click", () => {
  showScreen("config");
});

document.getElementById("next-name-btn").addEventListener("click", addPlayerName);

document.getElementById("player-name-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPlayerName();
});

document.getElementById("roles-done-btn").addEventListener("click", () => {
  showScreen("roulette");
  runRoulette();
});

document.getElementById("roulette-done-btn").addEventListener("click", () => {
  const orderEl = document.getElementById("game-order");
  if (state.gameOrder && state.gameOrder.length > 0) {
    orderEl.textContent = `Orden: ${state.gameOrder.join(" → ")}`;
    orderEl.classList.remove("hidden");
  } else {
    orderEl.classList.add("hidden");
  }
  showScreen("game");
});

document.getElementById("reveal-btn").addEventListener("click", () => {
  document.getElementById("reveal-word").textContent = state.palabra;
  document.getElementById("reveal-impostor-name").textContent = state.playerNames[state.impostorIndex];
  showScreen("reveal");
});

document.getElementById("play-again-btn").addEventListener("click", startGame);

document.getElementById("retry-btn").addEventListener("click", () => {
  hideError();
  if (state.categoria && !state.palabra) initRoles();
});

async function initRoles() {
  showLoading(true);
  hideError();
  try {
    const data = await fetchPalabra(state.categoria);
    state.palabra = data.palabra;
    state.pista = data.pista;
    setupPlayerCards();
    renderPlayerCards();
    showScreen("roles");
  } catch (err) {
    showError(err.message || "No se pudo conectar con el servidor. ¿Está el backend ejecutándose?");
  } finally {
    showLoading(false);
  }
}
