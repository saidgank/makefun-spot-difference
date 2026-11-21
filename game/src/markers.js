// markers.js — everything drawn over the harbour pictures themselves: the
// rings that settle on a found difference in both panels, the brief pulse
// when a find lands, the fading cross of a wrong guess, and the slow pulse
// a hint breathes around one unfound difference.

const RING_COLOUR = '#7be0a3';
const RING_EDGE = 'rgba(8,20,14,0.85)';
const MISS_COLOUR = '#ff6b6b';
const HINT_COLOUR = '#ffd977';

export function drawFoundRing(ctx, difference, pulseScale = 0) {
  const r = Math.max(15, difference.r * 0.72) + pulseScale;
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = RING_EDGE;
  ctx.beginPath();
  ctx.arc(difference.cx, difference.cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = RING_COLOUR;
  ctx.beginPath();
  ctx.arc(difference.cx, difference.cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// drawFindPulse: an expanding ring + sparkles for the moment of a find.
// progress runs 0 → 1 over the pulse's life.
export function drawFindPulse(ctx, difference, progress) {
  const r = Math.max(15, difference.r * 0.72) + progress * 26;
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  ctx.lineWidth = 3;
  ctx.strokeStyle = RING_COLOUR;
  ctx.beginPath();
  ctx.arc(difference.cx, difference.cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + progress * 1.4;
    const d = r + 6 + progress * 10;
    ctx.beginPath();
    ctx.arc(difference.cx + Math.cos(a) * d, difference.cy + Math.sin(a) * d, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// drawMissMark: the cross of a wrong guess, fading with its age.
export function drawMissMark(ctx, mark) {
  const alpha = Math.max(0, 1 - mark.age / 0.9);
  const s = 9;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = MISS_COLOUR;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(mark.x - s, mark.y - s); ctx.lineTo(mark.x + s, mark.y + s);
  ctx.moveTo(mark.x + s, mark.y - s); ctx.lineTo(mark.x - s, mark.y + s);
  ctx.stroke();
  ctx.restore();
}

// drawHintPulse: a breathing double ring around the hinted difference.
export function drawHintPulse(ctx, difference, nowMs) {
  const breathe = 0.5 + 0.5 * Math.sin(nowMs / 190);
  const r = Math.max(15, difference.r * 0.72) + 4 + breathe * 7;
  ctx.save();
  ctx.globalAlpha = 0.55 + breathe * 0.45;
  ctx.lineWidth = 3;
  ctx.strokeStyle = HINT_COLOUR;
  ctx.beginPath();
  ctx.arc(difference.cx, difference.cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(difference.cx, difference.cy, r + 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
