// main.js — boots Lanternfall: builds the two harbour panels, runs the
// render loop and the ferry clock, keeps the HUD (counter, dots, timer,
// hints, misses) in step with the game state, and wires the buttons and the
// win/lose overlay. It also honours the ?shot= states the screenshots are
// taken from — start (a fresh board), mid (four found, one wrong guess) and
// win (the round complete) — each a real state of this same game, rendered
// by this same code.

import { buildVariants, DIFFERENCE_BY_ID } from './differences.js';
import { drawScene } from './scene.js';
import { GameState, formatClock } from './game.js';
import { attachPanelInput, attachKeyboardInput, hitTest } from './input.js';
import { drawFoundRing, drawFindPulse, drawMissMark, drawHintPulse } from './markers.js';

const canvasA = document.getElementById('canvasA');
const canvasB = document.getElementById('canvasB');
const ctxA = canvasA.getContext('2d');
const ctxB = canvasB.getContext('2d');
const els = {
  foundCount: document.getElementById('foundCount'),
  totalCount: document.getElementById('totalCount'),
  toGo: document.getElementById('toGo'),
  dots: document.getElementById('dots'),
  clock: document.getElementById('clock'),
  timerFill: document.getElementById('timerFill'),
  timerBlock: document.getElementById('timerBlock'),
  misses: document.getElementById('misses'),
  hintsLeft: document.getElementById('hintsLeft'),
  hintBtn: document.getElementById('hintBtn'),
  restartBtn: document.getElementById('restartBtn'),
  toast: document.getElementById('toast'),
  overlay: document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlayTitle'),
  overlayText: document.getElementById('overlayText'),
  overlayStats: document.getElementById('overlayStats'),
  nextBtn: document.getElementById('nextBtn'),
  againBtn: document.getElementById('againBtn'),
  panelA: document.getElementById('panelA'),
  panelB: document.getElementById('panelB'),
};

const state = new GameState();
let variants = buildVariants(state.round);
let pulses = []; // { difference, startedAt }
let missMarks = []; // { panel, x, y, startedAt, pinned }
let hintUntil = 0;
let frozen = false; // screenshot states hold the ferry clock still

function setToast(text) {
  els.toast.textContent = text;
}

function syncHud() {
  els.foundCount.textContent = String(state.foundCount);
  els.totalCount.textContent = String(state.total);
  els.toGo.textContent = state.toGo === 1 ? '1 to go' : `${state.toGo} to go`;
  els.dots.innerHTML = state.differences
    .map((d) => `<span class="${state.found.has(d.id) ? 'on' : ''}"></span>`)
    .join('');
  els.misses.textContent = String(state.misses);
  els.hintsLeft.textContent = String(state.hintsLeft);
  els.hintBtn.disabled = state.hintsLeft <= 0 || state.phase !== 'playing';
}

function syncClock() {
  els.clock.textContent = formatClock(state.secondsLeft);
  const frac = state.round.seconds === 0 ? 0 : state.secondsLeft / state.round.seconds;
  els.timerFill.style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
  els.timerBlock.classList.toggle('low', state.secondsLeft < 60 && state.phase === 'playing');
}

function startRound(intro) {
  variants = buildVariants(state.round);
  pulses = [];
  missMarks = [];
  hintUntil = 0;
  state.clearHint();
  els.overlay.classList.remove('show');
  setToast(intro ?? `${state.round.name}: ${state.total} things have changed along the quay. Find them before the last ferry leaves.`);
  syncHud();
  syncClock();
}

function showOverlay() {
  const won = state.phase === 'won';
  els.overlayTitle.textContent = won ? 'Every lantern accounted for!' : 'The last ferry has left…';
  els.overlayText.textContent = won
    ? 'You found every change along the quay before the ferry sailed. The harbour settles back into the dark — but the night is young, and the next round hides quieter changes.'
    : 'The light has gone from the water and the remaining changes keep their secrets. The quay will be just as busy tomorrow night.';
  els.overlayStats.innerHTML =
    `Round <b>${state.round.name}</b> · found <b>${state.foundCount} of ${state.total}</b> · ` +
    `time left <b>${formatClock(state.secondsLeft)}</b> · wrong guesses <b>${state.misses}</b>`;
  els.nextBtn.style.display = won ? '' : 'none';
  els.nextBtn.textContent = state.roundIndex < 2 ? 'Next round' : 'Back to Round 1';
  els.againBtn.textContent = won ? 'Replay this round' : 'Try again';
  els.overlay.classList.add('show');
}

function shake(panelEl) {
  panelEl.classList.remove('shake');
  void panelEl.offsetWidth;
  panelEl.classList.add('shake');
}

function onPanelClick(panel, point) {
  if (state.phase !== 'playing') return;
  const hit = hitTest(state.differences, point.x, point.y);
  if (hit && state.found.has(hit.id)) return; // already ringed: no penalty
  if (hit) {
    state.markFound(hit);
    pulses.push({ difference: hit, startedAt: performance.now() });
    setToast(`${hit.label}. ${state.toGo === 0 ? '' : state.toGo === 1 ? 'One remains.' : `${state.toGo} remain.`}`);
    syncHud();
    if (state.phase === 'won') setTimeout(showOverlay, 650);
    return;
  }
  state.markMiss();
  missMarks.push({ panel, x: point.x, y: point.y, startedAt: performance.now(), pinned: false });
  shake(panel === 'A' ? els.panelA : els.panelB);
  setToast(state.phase === 'lost' ? 'And that was the last of the light.' : 'Nothing there — the harbour keeps its secrets. (−5 seconds)');
  syncHud();
  syncClock();
  if (state.phase === 'lost') setTimeout(showOverlay, 650);
}

function doHint() {
  const d = state.spendHint();
  if (!d) return;
  hintUntil = performance.now() + 1600;
  setToast('Somewhere along the quay, a lantern gutters… watch both pictures.');
  syncHud();
}

attachPanelInput(canvasA, state, (point) => onPanelClick('A', point));
attachPanelInput(canvasB, state, (point) => onPanelClick('B', point));
attachKeyboardInput({ onHint: doHint, onRestart: () => { state.restartRound(); startRound(); } });
els.hintBtn.addEventListener('click', doHint);
els.restartBtn.addEventListener('click', () => { state.restartRound(); startRound(); });
els.nextBtn.addEventListener('click', () => { state.nextRound(); startRound(); });
els.againBtn.addEventListener('click', () => { state.restartRound(); startRound(); });

function drawPanel(ctx, variant, panel, now) {
  drawScene(ctx, variant, state.round.palette);
  for (const d of state.differences) {
    if (state.found.has(d.id)) drawFoundRing(ctx, d);
  }
  for (const p of pulses) {
    const progress = (now - p.startedAt) / 550;
    if (progress < 1) drawFindPulse(ctx, p.difference, progress);
  }
  for (const m of missMarks) {
    if (m.panel !== panel) continue;
    drawMissMark(ctx, { x: m.x, y: m.y, age: m.pinned ? 0.25 : (now - m.startedAt) / 1000 });
  }
  if (state.hintId && now < hintUntil) {
    drawHintPulse(ctx, DIFFERENCE_BY_ID.get(state.hintId), now);
  }
}

let lastStamp = performance.now();
function frame(now) {
  const dt = (now - lastStamp) / 1000;
  lastStamp = now;
  if (!frozen && state.phase === 'playing') {
    if (state.tick(dt)) {
      syncClock();
      setTimeout(showOverlay, 400);
    }
    syncClock();
  }
  pulses = pulses.filter((p) => now - p.startedAt < 550);
  missMarks = missMarks.filter((m) => m.pinned || now - m.startedAt < 900);
  if (state.hintId && now >= hintUntil) state.clearHint();
  drawPanel(ctxA, variants.left, 'A', now);
  drawPanel(ctxB, variants.right, 'B', now);
  requestAnimationFrame(frame);
}

// --- Screenshot states -------------------------------------------------
// ?shot=start | mid | win sets the game into a real, representative state
// and freezes the ferry clock so the picture can be taken.
function applyShotState() {
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return;
  frozen = true;
  if (shot === 'mid') {
    for (const id of ['lighthouse-beam', 'sail-colour', 'cat-on-crate', 'clock-time']) {
      state.found.add(id);
    }
    state.misses = 1;
    state.secondsLeft = 221;
    missMarks.push({ panel: 'B', x: 472, y: 498, startedAt: 0, pinned: true });
    setToast('The tower clock has jumped to 9:25. 6 remain.');
  } else if (shot === 'win') {
    for (const d of state.differences) state.found.add(d.id);
    state.phase = 'won';
    state.misses = 2;
    state.hintsLeft = 1;
    state.secondsLeft = 112;
    showOverlay();
  }
  syncHud();
  syncClock();
}

startRound();
applyShotState();
requestAnimationFrame(frame);
