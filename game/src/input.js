// input.js — pointer and keyboard input for the two harbour panels.
//
// A click in either picture is translated into scene coordinates and tested
// against the round's unfound differences: the nearest centre inside its
// radius wins, so a click that grazes two overlapping regions still picks
// the difference it was closest to. Clicks that land on an already-found
// difference are ignored rather than punished — the ring is already there.

export function scenePointFromEvent(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

// hitTest(differences, x, y) → the difference whose region a click at (x, y)
// lands in — the nearest centre inside its radius — or null when the click
// lands on plain harbour. Whether that difference is already found, and so
// whether the click scores, costs time or is ignored, is the game wiring's
// call (main.js), not the input layer's.
export function hitTest(differences, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const d of differences) {
    const dist = Math.hypot(x - d.cx, y - d.cy);
    if (dist <= d.r && dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  return best;
}

// attachPanelInput wires one canvas: onClick(point) fires for every pointer
// press, point in scene coordinates.
export function attachPanelInput(canvas, state, onClick) {
  canvas.addEventListener('pointerdown', (event) => {
    onClick(scenePointFromEvent(canvas, event));
  });
}

// attachKeyboardInput: H asks for a hint, R restarts the round.
export function attachKeyboardInput({ onHint, onRestart }) {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'h') onHint();
    if (key === 'r') onRestart();
  });
}
