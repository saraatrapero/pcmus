// Interfaz web de PC Mus. Toda la lógica del juego corre en Python (Pyodide):
// este archivo solo pinta el estado y envía las jugadas del humano.

const $ = (id) => document.getElementById(id);
let py = null;
let api = null;
let state = null;
let selectedBot = null;
let selectedDiscard = new Set();
let busy = false;

// ---------------------------------------------------------------- vistas
function show(view) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-active", v.id === view));
  if (view === "board") loadBoard();
}
document.querySelectorAll("[data-view]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    if (!api && a.dataset.view !== "board") return;
    show(a.dataset.view);
  }),
);

// ---------------------------------------------------------------- arranque
async function boot() {
  try {
    py = await loadPyodide();
    $("loading-step").textContent = "Colocando la baraja";
    const manifest = await (await fetch("py/manifest.json")).json();
    for (const path of manifest.files) {
      const text = await (await fetch(`py/${path}`)).text();
      const full = `/home/pyodide/${path}`;
      py.FS.mkdirTree(full.substring(0, full.lastIndexOf("/")));
      py.FS.writeFile(full, text);
    }
    py.runPython(`
import os, sys
sys.path.insert(0, "/home/pyodide/src")
os.environ["PCMUS_PLAYERS"] = "/home/pyodide/players"
`);
    api = py.pyimport("pcmus.webapi");
    renderBots(JSON.parse(api.list_bots()));
    show("start");
  } catch (err) {
    $("loading-step").textContent = `No se pudo cargar el juego: ${err}`;
  }
}

function renderBots(bots) {
  const list = $("bot-list");
  list.innerHTML = "";
  const preferred = bots.find((b) => b.name === "tio-paco") || bots[0];
  for (const bot of bots) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bot-option";
    btn.setAttribute("role", "radio");
    btn.innerHTML = `<span class="dot"></span><strong></strong><span class="desc"></span>`;
    btn.querySelector("strong").textContent = bot.name;
    btn.querySelector(".desc").textContent = bot.description;
    btn.addEventListener("click", () => selectBot(bot.name));
    btn.dataset.name = bot.name;
    list.appendChild(btn);
  }
  selectBot(preferred.name);
}

function selectBot(name) {
  selectedBot = name;
  document.querySelectorAll(".bot-option").forEach((b) =>
    b.setAttribute("aria-checked", String(b.dataset.name === name)),
  );
}

$("start-btn").addEventListener("click", () => {
  const target = Number($("target").value);
  const seed = Math.floor(Math.random() * 1e9);
  withBusy("Barajando…", () => api.new_game(selectedBot, target, seed));
  $("rival-name").textContent = selectedBot;
  $("sum-rival-name").textContent = selectedBot;
  show("game");
});

// ---------------------------------------------------------------- llamadas a Python
function withBusy(message, call) {
  if (busy) return;
  busy = true;
  $("hint").textContent = message;
  $("actions").querySelectorAll("button").forEach((b) => (b.disabled = true));
  // Se cede un fotograma para que se vea el mensaje antes de que piense el bot.
  setTimeout(() => {
    try {
      state = JSON.parse(call());
      $("error").textContent = state.error || "";
      render();
    } catch (err) {
      $("error").textContent = `Error: ${err}`;
    } finally {
      busy = false;
    }
  }, 30);
}

function play(action) {
  withBusy(`${selectedBot} está pensando…`, () => api.act(JSON.stringify(action)));
}

// ---------------------------------------------------------------- naipes
const FIGURES = { 10: "Sota", 11: "Caballo", 12: "Rey" };
const SUIT_SVG = {
  oros: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="currentColor"/><circle cx="20" cy="20" r="10" fill="none" stroke="#fbf7ee" stroke-width="2"/><circle cx="20" cy="20" r="3" fill="#fbf7ee"/></svg>`,
  copas: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 7h24c0 10-5 16-10 17v6h6v4H12v-4h6v-6C13 23 8 17 8 7z" fill="currentColor"/></svg>`,
  espadas: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2l3 5v19h-6V7z" fill="currentColor"/><rect x="11" y="26" width="18" height="3" rx="1.5" fill="currentColor"/><rect x="18" y="29" width="4" height="7" fill="currentColor"/><circle cx="20" cy="37" r="2.5" fill="currentColor"/></svg>`,
  bastos: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M17 36l-2-22c-1-6 2-11 7-11s8 5 7 10l-5 23z" fill="currentColor"/><circle cx="17" cy="12" r="2" fill="#fbf7ee"/><circle cx="24" cy="18" r="2" fill="#fbf7ee"/><circle cx="19" cy="25" r="1.8" fill="#fbf7ee"/></svg>`,
};

function cardEl(code, { selectable = false, index = 0 } = {}) {
  const [num, suit] = code.split("-");
  const el = document.createElement(selectable ? "button" : "div");
  el.className = `card ${suit}`;
  const label = `${FIGURES[num] || num} de ${suit}`;
  el.setAttribute("aria-label", label);
  el.innerHTML = `<span class="num">${num}</span>${SUIT_SVG[suit]}<span class="num bottom">${num}</span>${
    FIGURES[num] ? `<span class="figure">${FIGURES[num]}</span>` : ""
  }`;
  if (selectable) {
    el.type = "button";
    el.classList.toggle("selected", selectedDiscard.has(index));
    el.setAttribute("aria-pressed", String(selectedDiscard.has(index)));
    el.addEventListener("click", () => {
      selectedDiscard.has(index) ? selectedDiscard.delete(index) : selectedDiscard.add(index);
      render();
    });
  }
  return el;
}

function backEl() {
  const el = document.createElement("div");
  el.className = "card back";
  el.setAttribute("aria-hidden", "true");
  return el;
}

// ---------------------------------------------------------------- pintar la mesa
const LANCE_ORDER = ["mus", "grande", "chica", "pares", "juego"];

function render() {
  if (!state) return;
  $("score-you").textContent = state.scores[0];
  $("score-bot").textContent = state.scores[1];
  $("target-label").textContent = `a ${state.target}`;
  $("hand-label").textContent = `Mano ${state.handNumber}`;
  $("mano-badge").textContent = state.youAreMano ? "Eres mano: hablas primero y ganas los empates" : `${state.bot} es mano`;

  // Rival
  const rival = $("rival-cards");
  rival.innerHTML = "";
  for (let i = 0; i < 4; i++) rival.appendChild(backEl());

  // Lo que ha dicho cada uno en esta jugada
  const said = (p) => state.events.filter((e) => e.player === p).map((e) => cap(e.text)).join(" · ");
  $("rival-says").textContent = said(1);
  $("you-say").textContent = said(0);

  // Lances
  const current = state.phase === "descarte" ? "mus" : state.phase === "punto" ? "juego" : state.phase;
  const currentIdx = LANCE_ORDER.indexOf(current);
  $("lances").innerHTML = LANCE_ORDER.map((l, i) => {
    const name = l === "juego" && state.phase === "punto" ? "punto" : l;
    const cls = i === currentIdx ? "now" : i < currentIdx ? "done" : "";
    return `<li class="${cls}">${cap(name)}</li>`;
  }).join("");

  $("bet-status").textContent = betText();

  // Mis cartas
  const mine = $("my-cards");
  mine.innerHTML = "";
  const discarding = state.phase === "descarte" && state.yourTurn;
  state.hand.forEach((code, i) => mine.appendChild(cardEl(code, { selectable: discarding, index: i })));
  if (!discarding) selectedDiscard.clear();

  $("hint").textContent = hintText(discarding);
  renderActions(discarding);

  if (state.summary) showSummary();
}

function betText() {
  const d = state.declarations;
  if (state.phase === "mus") return state.musRound ? `Descartes hechos: ${state.musRound}` : "¿Hay mus?";
  if (state.phase === "descarte") return "Descarte";
  if (state.phase === "fin") return "Partida terminada";
  const b = state.bet;
  let text = "";
  if (!b || b.pending === null) text = "Nadie ha envidado";
  else if (b.ordago) text = `${b.bettor === 0 ? "Has echado" : state.bot + " echa"} un órdago`;
  else text = `${b.bettor === 0 ? "Envidas" : state.bot + " envida"}: ${b.pending} piedras en juego`;
  if (state.phase === "pares" && d.pares) text += " · los dos lleváis pares";
  if (state.phase === "juego" && d.juego) text += " · los dos lleváis juego";
  return text;
}

function hintText(discarding) {
  if (state.winner !== null) return "";
  if (discarding) {
    const n = selectedDiscard.size;
    return n ? `Vas a tirar ${n} carta${n > 1 ? "s" : ""}` : "Toca las cartas que quieras tirar (de 1 a 4)";
  }
  if (!state.yourTurn) return "";
  return "Te toca";
}

function renderActions(discarding) {
  const box = $("actions");
  box.innerHTML = "";
  if (state.winner !== null && !state.summary) {
    box.appendChild(button("Otra partida", "btn btn-primary", () => show("start")));
    return;
  }
  if (!state.yourTurn) return;
  if (discarding) {
    const b = button("Descartarme", "btn btn-primary", () =>
      play({ kind: "descarte", discard: [...selectedDiscard].sort() }),
    );
    b.disabled = selectedDiscard.size === 0;
    box.appendChild(b);
    return;
  }
  for (const a of state.legal) {
    const cls = a.kind === "ordago" ? "btn btn-wine" : ["mus", "quiero", "corto"].includes(a.kind) ? "btn btn-primary" : "btn";
    const { label, ...action } = a;
    box.appendChild(button(label, cls, () => play(action)));
  }
}

function button(text, cls, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}

// ---------------------------------------------------------------- recuento
function showSummary() {
  const s = state.summary;
  const dlg = $("summary");
  const over = state.winner !== null;
  $("summary-title").textContent = over
    ? state.winner === 0 ? "¡Has ganado la partida!" : `Gana ${state.bot}`
    : `Recuento de la mano ${s.hand_number}`;
  for (const [id, p] of [["sum-you", 0], ["sum-bot", 1]]) {
    const box = $(id);
    box.innerHTML = "";
    s.hands[p].forEach((c) => box.appendChild(cardEl(c)));
  }
  $("sum-you-desc").textContent = s.descriptions[0];
  $("sum-bot-desc").textContent = s.descriptions[1];
  const lines = [];
  for (const a of s.awards) {
    if (!s.count.some((c) => c.player === a.player && c.amount === a.amount)) {
      lines.push({ label: "No quiero", who: a.player, amount: a.amount });
    }
  }
  for (const c of s.count) lines.push({ label: `${cap(c.lance)} (${c.reason})`, who: c.player, amount: c.amount });
  if (s.ended_by.startsWith("órdago")) lines.push({ label: cap(s.ended_by) + " querido", who: state.winner, amount: "partida" });
  $("sum-lines").innerHTML = lines.length
    ? lines.map((l) => `<li><span>${l.label}</span><span>${l.who === 0 ? "Tú" : state.bot} +${l.amount}</span></li>`).join("")
    : `<li><span>Sin piedras en esta mano</span></li>`;
  $("sum-next").textContent = over ? "Volver al inicio" : "Siguiente mano";
  if (!dlg.open) dlg.showModal();
}

$("sum-next").addEventListener("click", () => {
  $("summary").close();
  if (state.winner !== null) {
    state = null;
    show("start");
    return;
  }
  withBusy("Repartiendo…", () => api.resume());
});

// ---------------------------------------------------------------- clasificación
async function loadBoard() {
  const body = $("board-body");
  try {
    const board = await (await fetch("results/leaderboard.json", { cache: "no-store" })).json();
    $("board-meta").textContent = `Actualizada el ${new Date(board.generated_at).toLocaleString("es-ES")} · ${board.config.games_per_pair} partidas por pareja a ${board.config.target} piedras`;
    body.innerHTML = board.standings
      .map(
        (s, i) =>
          `<tr><td>${i + 1}</td><td><strong>${esc(s.name)}</strong><small>${esc(s.authors.join(", "))}</small></td><td>${s.games}</td><td>${s.wins}</td><td>${Math.round(s.win_rate * 100)}</td><td>${Math.round(s.elo)}</td><td>${s.forfeits}</td></tr>`,
      )
      .join("");
  } catch {
    body.innerHTML = `<tr><td colspan="7">Todavía no hay clasificación publicada.</td></tr>`;
  }
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

boot();
