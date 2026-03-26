/**
 * Juego del Impostor - Frontend
 */
const API_BASE = (typeof window !== "undefined" && window.IMPOSTOR_API_URL) || "http://localhost:3000";

const CATEGORY_LABELS = {
  futbolistas: "⚽ Futbolistas",
  musica: "🎵 Música",
  videojuegos: "🎮 Videojuegos",
  famosos: "⭐ Famosos",
};

const screens = {
  home: "screen-home",
  remoteAuth: "screen-remote-auth",
  remoteCreate: "screen-remote-create",
  remoteJoin: "screen-remote-join",
  remoteLobby: "screen-remote-lobby",
  remoteCard: "screen-remote-card",
  remoteOrder: "screen-remote-order",
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
  currentPlayerIndex: 0,
  remote: {
    code: null,
    playerId: null,
    isHost: false,
    lobby: null,
    pollId: null,
    ready: false,
    revealed: false,
    card: null,
    categorias: [],
    selectedCategory: null,
    roulettePlayed: false,
    joinedWithName: false,
  },
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

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
  document.getElementById("player-name-input").placeholder = "Por defecto: Jugador 1";
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
    input.placeholder = `Por defecto: Jugador ${idx + 1}`;
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

function renderRoleScreen() {
  state.currentPlayerIndex = 0;
  showCurrentPlayerCard();
}

function showCurrentPlayerCard() {
  const card = state.playerCards[state.currentPlayerIndex];
  const isLast = state.currentPlayerIndex === state.numJugadores - 1;
  const isImpostor = card.type === "pista";

  document.getElementById("player-turn").textContent = `${card.name}, es tu turno`;
  document.getElementById("card-player-name").textContent = card.name;

  const backEl = document.getElementById("flip-card-back");
  const impostorBlock = document.getElementById("card-back-impostor");
  const normalBlock = document.getElementById("card-back-normal");
  const impostorPista = document.getElementById("card-impostor-pista");
  const secretValue = document.getElementById("card-secret-value");

  if (isImpostor) {
    impostorBlock.classList.add("visible");
    normalBlock.classList.remove("visible");
    impostorPista.textContent = `Pistas: ${card.value}`;
    backEl.classList.add("impostor");
  } else {
    impostorBlock.classList.remove("visible");
    normalBlock.classList.add("visible");
    secretValue.textContent = card.value;
    backEl.classList.remove("impostor");
  }

  document.getElementById("flip-card").classList.remove("flipped");

  const btn = document.getElementById("next-player-btn");
  btn.textContent = isLast ? "Todos vimos → Sortear orden" : "Siguiente jugador →";
  btn.onclick = goNextPlayer;

  setupFlipCardListeners();
}

function setupFlipCardListeners() {
  const flipCard = document.getElementById("flip-card");
  flipCard.replaceWith(flipCard.cloneNode(true));
  const newFlipCard = document.getElementById("flip-card");

  newFlipCard.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    newFlipCard.classList.add("flipped");
  });
  newFlipCard.addEventListener("pointerup", () => newFlipCard.classList.remove("flipped"));
  newFlipCard.addEventListener("pointerleave", () => newFlipCard.classList.remove("flipped"));
  newFlipCard.addEventListener("pointercancel", () => newFlipCard.classList.remove("flipped"));
}

function goNextPlayer() {
  if (state.currentPlayerIndex < state.numJugadores - 1) {
    state.currentPlayerIndex++;
    showCurrentPlayerCard();
  } else {
    showScreen("roulette");
    runRoulette();
  }
}

function runRoulette() {
  const names = [...state.playerNames];
  const wheel = document.getElementById("roulette-wheel");
  const resultEl = document.getElementById("roulette-result");
  const doneBtn = document.getElementById("roulette-done-btn");

  resultEl.textContent = "";
  resultEl.classList.add("hidden");
  doneBtn.classList.add("hidden");

  const n = names.length;
  const segmentAngle = 360 / n;

  const colors = ["#1a1a24", "#252530", "#1e1e2a", "#2a2a36", "#22222e"];
  const gradientStops = names
    .map((_, i) => `${colors[i % colors.length]} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`)
    .join(", ");
  wheel.style.background = `conic-gradient(from 0deg, ${gradientStops})`;

  wheel.innerHTML = names
    .map(
      (name, i) => {
        const angle = i * segmentAngle + segmentAngle / 2;
        return `<div class="roulette-segment-label" style="--angle: ${angle}deg"><span class="roulette-name-text">${escapeHtml(name)}</span></div>`;
      }
    )
    .join("");

  wheel.style.setProperty("--segments", n);
  wheel.style.transform = "rotate(0deg)";

  const winnerIndex = Math.floor(Math.random() * n);
  const winner = names[winnerIndex];
  const spins = 5 + Math.floor(Math.random() * 2);
  const targetRotation = 360 * spins + (360 - winnerIndex * segmentAngle - segmentAngle / 2);

  setTimeout(() => {
    wheel.style.transform = `rotate(${targetRotation}deg)`;
  }, 50);

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
  resetRemoteState();
  document.getElementById("remote-rematch-controls").classList.add("hidden");
  document.getElementById("play-again-btn").classList.remove("hidden");
  showScreen("home");
}

function setCategoriesVisible(visible) {
  const categories = document.querySelector(".categories");
  const instruction = document.querySelector("#screen-home .instruction");
  const modeSelect = document.querySelector(".mode-select");
  const localHeader = document.getElementById("local-mode-header");
  if (!categories || !instruction) return;
  categories.classList.toggle("hidden", !visible);
  instruction.classList.toggle("hidden", !visible);
  if (modeSelect) modeSelect.classList.toggle("hidden", visible);
  if (localHeader) localHeader.classList.toggle("hidden", !visible);
}

function stopRemotePolling() {
  if (state.remote.pollId) {
    clearInterval(state.remote.pollId);
    state.remote.pollId = null;
  }
}

function resetRemoteState() {
  stopRemotePolling();
  state.remote = {
    code: null,
    playerId: null,
    isHost: false,
    lobby: null,
    pollId: null,
    ready: false,
    revealed: false,
    card: null,
    categorias: [],
    selectedCategory: null,
    roulettePlayed: false,
    joinedWithName: false,
  };
}

function playerNameById(playerId) {
  const p = state.remote.lobby?.players?.find((x) => x.id === playerId);
  return p ? p.name : "Jugador";
}

function renderRemoteLobby() {
  const lobby = state.remote.lobby;
  if (!lobby) return;
  document.getElementById("remote-lobby-code").textContent = `Código: ${lobby.code}`;
  document.getElementById("remote-players-list").innerHTML = lobby.players
    .map((p) => `<span class="name-chip">${escapeHtml(p.name)} ${p.ready ? "✅" : "⏳"}</span>`)
    .join("");

  const me = lobby.players.find((p) => p.id === state.remote.playerId);
  const nameSetter = document.getElementById("remote-name-setter");
  const hasDefaultName = !me || !me.name || /^Jugador$/.test(me.name);
  nameSetter.classList.toggle("hidden", !hasDefaultName);

  const categorySelect = document.getElementById("remote-category-select");
  const currentSelected =
    lobby.categoria ||
    state.remote.selectedCategory ||
    categorySelect.value ||
    state.remote.categorias[0] ||
    "futbolistas";
  categorySelect.innerHTML = state.remote.categorias
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(CATEGORY_LABELS[c] || c)}</option>`)
    .join("");
  if (state.remote.categorias.includes(currentSelected)) {
    categorySelect.value = currentSelected;
  }
  state.remote.selectedCategory = categorySelect.value;
  categorySelect.disabled = !state.remote.isHost;

  const startBtn = document.getElementById("remote-start-btn");
  const closeBtn = document.getElementById("remote-close-btn");
  if (state.remote.isHost && lobby.players.length >= 3) {
    startBtn.classList.remove("hidden");
  } else {
    startBtn.classList.add("hidden");
  }
  if (state.remote.isHost) closeBtn.classList.remove("hidden");
  else closeBtn.classList.add("hidden");
}

function renderRemoteCard() {
  const card = state.remote.card;
  if (!card) return;
  const myName = playerNameById(state.remote.playerId);
  document.getElementById("remote-card-name").textContent = myName;
  const isImpostor = card.role === "impostor";
  const back = document.getElementById("remote-card-back");
  const imp = document.getElementById("remote-impostor-block");
  const normal = document.getElementById("remote-normal-block");
  if (isImpostor) {
    imp.classList.add("visible");
    normal.classList.remove("visible");
    document.getElementById("remote-impostor-pista").textContent = card.value;
    back.classList.add("impostor");
  } else {
    imp.classList.remove("visible");
    normal.classList.add("visible");
    document.getElementById("remote-secret-value").textContent = card.value;
    back.classList.remove("impostor");
  }
}

function renderRemoteOrder() {
  const lobby = state.remote.lobby;
  if (!lobby) return;
  const names = (lobby.order || []).map((id) => playerNameById(id));
  document.getElementById("remote-order-text").textContent = `Orden: ${names.join(" → ")}`;
  const goBtn = document.getElementById("remote-go-game-btn");
  if (state.remote.isHost) goBtn.classList.remove("hidden");
  else goBtn.classList.add("hidden");

  if (!state.remote.roulettePlayed && names.length >= 3) {
    runRemoteRoulette(names);
    state.remote.roulettePlayed = true;
  }
}

function runRemoteRoulette(names) {
  const wheel = document.getElementById("remote-roulette-wheel");
  if (!wheel) return;
  const n = names.length;
  const segmentAngle = 360 / n;
  const colors = ["#1a1a24", "#252530", "#1e1e2a", "#2a2a36", "#22222e"];
  const gradientStops = names
    .map((_, i) => `${colors[i % colors.length]} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`)
    .join(", ");
  wheel.style.background = `conic-gradient(from 0deg, ${gradientStops})`;
  wheel.innerHTML = names
    .map((name, i) => {
      const angle = i * segmentAngle + segmentAngle / 2;
      return `<div class="roulette-segment-label" style="--angle: ${angle}deg"><span class="roulette-name-text">${escapeHtml(name)}</span></div>`;
    })
    .join("");
  wheel.style.transform = "rotate(0deg)";
  const winnerIndex = 0;
  const spins = 5 + Math.floor(Math.random() * 2);
  const targetRotation = 360 * spins + (360 - winnerIndex * segmentAngle - segmentAngle / 2);
  setTimeout(() => {
    wheel.style.transform = `rotate(${targetRotation}deg)`;
  }, 50);
}

async function remoteSync() {
  if (!state.remote.code || !state.remote.playerId) return;
  const data = await apiGet(`/lobbies/${state.remote.code}?playerId=${encodeURIComponent(state.remote.playerId)}`);
  state.remote.lobby = data.lobby;
  state.remote.isHost = data.isHost;
  state.remote.card = data.yourCard;

  if (data.lobby.phase === "lobby") {
    renderRemoteLobby();
    showScreen("remoteLobby");
    return;
  }
  if (data.lobby.phase === "reveal") {
    const me = data.lobby.players.find((p) => p.id === state.remote.playerId);
    state.remote.revealed = Boolean(me?.revealed);
    document.getElementById("remote-revealed-btn").textContent = state.remote.revealed
      ? "Esperando a los demás..."
      : "Ya revelé";
    renderRemoteCard();
    showScreen("remoteCard");
    return;
  }
  if (data.lobby.phase === "order") {
    renderRemoteOrder();
    showScreen("remoteOrder");
    return;
  }
  if (data.lobby.phase === "in_game") {
    const orderEl = document.getElementById("game-order");
    const names = (data.lobby.order || []).map((id) => playerNameById(id));
    orderEl.textContent = `Orden: ${names.join(" → ")}`;
    orderEl.classList.remove("hidden");
    document.getElementById("reveal-btn").classList.toggle("hidden", !state.remote.isHost);
    showScreen("game");
    return;
  }
  if (data.lobby.phase === "result" && data.result) {
    document.getElementById("reveal-word").textContent = data.result.palabra || "(sin palabra)";
    document.getElementById("reveal-impostor-name").textContent = data.result.impostorName;
    const rematchBox = document.getElementById("remote-rematch-controls");
    rematchBox.classList.toggle("hidden", !state.remote.isHost);
    document.getElementById("play-again-btn").classList.toggle("hidden", Boolean(state.remote.code) && !state.remote.isHost);
    if (state.remote.isHost) {
      const sel = document.getElementById("remote-rematch-category");
      const keep = sel.value || state.remote.selectedCategory || state.remote.categorias[0];
      sel.innerHTML = state.remote.categorias
        .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(CATEGORY_LABELS[c] || c)}</option>`)
        .join("");
      if (state.remote.categorias.includes(keep)) sel.value = keep;
    }
    showScreen("reveal");
  }
}

function startRemotePolling() {
  stopRemotePolling();
  state.remote.pollId = setInterval(() => {
    remoteSync().catch((e) => {
      if (String(e.message || "").toLowerCase().includes("lobby no encontrado")) {
        resetRemoteState();
        showScreen("home");
        showError("El host terminó el lobby.");
        return;
      }
      showError(e.message);
    });
  }, 1500);
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


document.getElementById("roulette-done-btn").addEventListener("click", () => {
  const orderEl = document.getElementById("game-order");
  document.getElementById("reveal-btn").classList.remove("hidden");
  if (state.gameOrder && state.gameOrder.length > 0) {
    orderEl.textContent = `Orden: ${state.gameOrder.join(" → ")}`;
    orderEl.classList.remove("hidden");
  } else {
    orderEl.classList.add("hidden");
  }
  showScreen("game");
});

document.getElementById("reveal-btn").addEventListener("click", () => {
  if (state.remote.code) {
    if (!state.remote.isHost) return;
    apiPost(`/lobbies/${state.remote.code}/phase`, {
      playerId: state.remote.playerId,
      phase: "result",
    })
      .then(() => remoteSync())
      .catch((e) => showError(e.message));
    return;
  }
  document.getElementById("reveal-word").textContent = state.palabra;
  document.getElementById("reveal-impostor-name").textContent = state.playerNames[state.impostorIndex];
  document.getElementById("play-again-btn").classList.remove("hidden");
  showScreen("reveal");
});

document.getElementById("play-again-btn").addEventListener("click", startGame);

document.getElementById("retry-btn").addEventListener("click", () => {
  hideError();
  if (state.categoria && !state.palabra) initRoles();
});

document.getElementById("mode-local-btn").addEventListener("click", () => {
  setCategoriesVisible(true);
});

document.getElementById("local-mode-back").addEventListener("click", () => {
  setCategoriesVisible(false);
});

document.getElementById("mode-remote-btn").addEventListener("click", async () => {
  try {
    const data = await apiGet("/categorias");
    state.remote.categorias = data.categorias || [];
    state.remote.selectedCategory = state.remote.categorias[0] || null;
    showScreen("remoteAuth");
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-back-home").addEventListener("click", () => {
  showScreen("home");
});

document.getElementById("remote-go-create-btn").addEventListener("click", () => {
  showScreen("remoteCreate");
});

document.getElementById("remote-go-join-btn").addEventListener("click", () => {
  showScreen("remoteJoin");
});

document.getElementById("remote-back-auth-from-create").addEventListener("click", () => {
  showScreen("remoteAuth");
});

document.getElementById("remote-back-auth-from-join").addEventListener("click", () => {
  showScreen("remoteAuth");
});

document.getElementById("remote-create-btn").addEventListener("click", async () => {
  const name = document.getElementById("remote-create-name-input").value.trim() || "Host";
  try {
    const data = await apiPost("/lobbies", { name });
    state.remote.code = data.code;
    state.remote.playerId = data.playerId;
    state.remote.lobby = data.lobby;
    state.remote.isHost = true;
    state.remote.joinedWithName = true;
    state.remote.selectedCategory = state.remote.categorias[0] || null;
    state.remote.roulettePlayed = false;
    state.remote.revealed = false;
    startRemotePolling();
    renderRemoteLobby();
    showScreen("remoteLobby");
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-join-btn").addEventListener("click", async () => {
  const code = document.getElementById("remote-code-input").value.trim().toUpperCase();
  if (!code) return;
  try {
    const data = await apiPost(`/lobbies/${encodeURIComponent(code)}/join`, {});
    state.remote.code = data.code;
    state.remote.playerId = data.playerId;
    state.remote.lobby = data.lobby;
    state.remote.isHost = false;
    state.remote.joinedWithName = false;
    state.remote.roulettePlayed = false;
    state.remote.revealed = false;
    startRemotePolling();
    renderRemoteLobby();
    showScreen("remoteLobby");
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-ready-btn").addEventListener("click", async () => {
  if (!state.remote.code) return;
  state.remote.ready = !state.remote.ready;
  try {
    await apiPost(`/lobbies/${state.remote.code}/ready`, {
      playerId: state.remote.playerId,
      ready: state.remote.ready,
    });
    document.getElementById("remote-ready-btn").textContent = state.remote.ready ? "Listo ✅" : "Estoy listo";
    await remoteSync();
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-start-btn").addEventListener("click", async () => {
  if (!state.remote.code) return;
  if (!state.remote.isHost) return;
  if ((state.remote.lobby?.players?.length || 0) < 3) {
    showError("Se necesitan al menos 3 jugadores para iniciar.");
    return;
  }
  const categoria = state.remote.selectedCategory || document.getElementById("remote-category-select").value;
  try {
    await apiPost(`/lobbies/${state.remote.code}/start`, {
      playerId: state.remote.playerId,
      categoria,
    });
    state.remote.roulettePlayed = false;
    state.remote.revealed = false;
    await remoteSync();
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-save-name-btn").addEventListener("click", async () => {
  if (!state.remote.code || !state.remote.playerId) return;
  const name = document.getElementById("remote-lobby-name-input").value.trim();
  if (!name) return;
  try {
    await apiPost(`/lobbies/${state.remote.code}/name`, { playerId: state.remote.playerId, name });
    state.remote.joinedWithName = true;
    document.getElementById("remote-lobby-name-input").value = "";
    await remoteSync();
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-copy-code-btn").addEventListener("click", async () => {
  const code = state.remote.code;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    document.getElementById("remote-copy-code-btn").textContent = "✅";
    setTimeout(() => {
      document.getElementById("remote-copy-code-btn").textContent = "📋";
    }, 1200);
  } catch {
    showError("No se pudo copiar el código.");
  }
});

document.getElementById("remote-revealed-btn").addEventListener("click", async () => {
  if (!state.remote.code) return;
  if (state.remote.revealed) return;
  try {
    await apiPost(`/lobbies/${state.remote.code}/reveal`, { playerId: state.remote.playerId });
    state.remote.revealed = true;
    document.getElementById("remote-revealed-btn").textContent = "Esperando a los demás...";
    await remoteSync();
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-go-game-btn").addEventListener("click", async () => {
  if (!state.remote.code) return;
  try {
    await apiPost(`/lobbies/${state.remote.code}/phase`, {
      playerId: state.remote.playerId,
      phase: "in_game",
    });
    await remoteSync();
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-close-btn").addEventListener("click", async () => {
  if (!state.remote.code || !state.remote.isHost) return;
  try {
    await apiPost(`/lobbies/${state.remote.code}/close`, { playerId: state.remote.playerId });
    resetRemoteState();
    showScreen("home");
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-rematch-btn").addEventListener("click", async () => {
  if (!state.remote.code || !state.remote.isHost) return;
  const categoria = document.getElementById("remote-rematch-category").value || state.remote.selectedCategory;
  try {
    await apiPost(`/lobbies/${state.remote.code}/start`, {
      playerId: state.remote.playerId,
      categoria,
    });
    state.remote.roulettePlayed = false;
    state.remote.revealed = false;
    document.getElementById("remote-revealed-btn").textContent = "Ya revelé";
    await remoteSync();
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("remote-category-select").addEventListener("change", (e) => {
  state.remote.selectedCategory = e.target.value;
  if (!state.remote.isHost || !state.remote.code) return;
  apiPost(`/lobbies/${state.remote.code}/categoria`, {
    playerId: state.remote.playerId,
    categoria: state.remote.selectedCategory,
  }).catch((err) => showError(err.message));
});

document.getElementById("remote-leave-btn").addEventListener("click", () => {
  resetRemoteState();
  document.getElementById("remote-ready-btn").textContent = "Estoy listo";
  document.getElementById("remote-revealed-btn").textContent = "Ya revelé";
  showScreen("home");
});

(() => {
  setCategoriesVisible(false);
  const flipCard = document.getElementById("remote-flip-card");
  if (flipCard) {
    flipCard.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      flipCard.classList.add("flipped");
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) =>
      flipCard.addEventListener(evt, () => flipCard.classList.remove("flipped"))
    );
  }
})();

async function initRoles() {
  if (!state.categoria) {
    showError("No se seleccionó categoría. Volvé al inicio.");
    return;
  }
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