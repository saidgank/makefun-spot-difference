// scene.js — draws one panel of the harbour at Pelican Quay from a variant
// (see differences.js) and a palette. The drawing is a pure function of those
// two inputs: no clock, no Math.random — the star field and the water shimmer
// come from a seeded generator — so the left and right panels agree pixel for
// pixel everywhere the variant does not tell them apart.

export const SCENE_WIDTH = 600;
export const SCENE_HEIGHT = 600;

export const PALETTES = {
  dusk: {
    skyTop: '#1c2450', skyMid: '#3b3f6e', skyBot: '#c06a58',
    moonShadow: '#454a78',
    water: '#20304f', waterDeep: '#131f3a',
    silhouette: '#151d36', roof: '#1a2342',
    quayTop: '#5a4634', quayFace: '#33281e', wood: '#2c2119',
    lampGlow: 'rgba(255,179,71,',
  },
  midnight: {
    skyTop: '#0d1330', skyMid: '#1e2650', skyBot: '#57497a',
    moonShadow: '#272d55',
    water: '#16223f', waterDeep: '#0d1730',
    silhouette: '#0d1428', roof: '#121b36',
    quayTop: '#4c3a2c', quayFace: '#2a2016', wood: '#241a12',
    lampGlow: 'rgba(255,179,71,',
  },
  smallhours: {
    skyTop: '#081226', skyMid: '#12283f', skyBot: '#2e5a5e',
    moonShadow: '#1a3049',
    water: '#10222f', waterDeep: '#081826',
    silhouette: '#0a1524', roof: '#0e1c30',
    quayTop: '#42342a', quayFace: '#241c14', wood: '#201812',
    lampGlow: 'rgba(255,190,90,',
  },
};

// mulberry32: a tiny seeded generator so the harbour is the same every render.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const starRand = mulberry32(20261121);
const STARS = Array.from({ length: 110 }, () => ({
  x: starRand() * 600,
  y: starRand() * 295,
  r: 0.6 + starRand() * 1.1,
  a: 0.35 + starRand() * 0.6,
}));

const shimmerRand = mulberry32(112358);
const SHIMMER = Array.from({ length: 130 }, () => ({
  x: shimmerRand() * 600,
  y: 452 + shimmerRand() * 104,
  w: 8 + shimmerRand() * 26,
  a: 0.05 + shimmerRand() * 0.13,
}));

function glow(ctx, x, y, radius, colour, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, colour + alpha + ')');
  g.addColorStop(1, colour + '0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function catenary(ctx, x0, y0, x1, y1, sag) {
  const points = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    points.push({
      x: x0 + (x1 - x0) * t,
      y: y0 + (y1 - y0) * t + sag * 4 * t * (1 - t),
    });
  }
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  return points;
}

export function drawScene(ctx, variant, paletteName) {
  const P = PALETTES[paletteName];
  ctx.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  drawSky(ctx, P, variant);
  drawLighthouse(ctx, P, variant);
  drawSkyline(ctx, P, variant);
  drawStringLights(ctx, P, variant);
  drawQuay(ctx, P, variant);
  drawWater(ctx, P, variant);
  drawBoats(ctx, P, variant);
  drawForegroundDock(ctx, P, variant);
}

function drawSky(ctx, P, variant) {
  const sky = ctx.createLinearGradient(0, 0, 0, 350);
  sky.addColorStop(0, P.skyTop);
  sky.addColorStop(0.62, P.skyMid);
  sky.addColorStop(1, P.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 600, 352);

  for (const s of STARS) {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#e8ecff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The one bright star of the harbour pilots (a difference when it fades).
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(120, 178, 2.4, 0, Math.PI * 2);
  ctx.fill();
  if (variant.sparkleStar) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(120, 164); ctx.lineTo(120, 192);
    ctx.moveTo(106, 178); ctx.lineTo(134, 178);
    ctx.stroke();
    glow(ctx, 120, 178, 26, 'rgba(210,220,255,', 0.5);
  }

  drawMoon(ctx, P, variant);
  drawCloud(ctx, 140, 62, 1.1);
  drawCloud(ctx, 336, 122, 0.8);
  drawBirds(ctx, variant);
}

function drawMoon(ctx, P, variant) {
  glow(ctx, 495, 75, 74, 'rgba(240,238,210,', 0.4);
  ctx.fillStyle = '#f2ecd4';
  ctx.beginPath();
  ctx.arc(495, 75, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,182,150,0.5)';
  for (const [cx, cy, r] of [[484, 64, 6], [506, 86, 4.5], [492, 92, 3.4]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  if (variant.moonPhase === 'crescent') {
    ctx.fillStyle = P.moonShadow;
    ctx.beginPath();
    ctx.arc(512, 66, 29, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCloud(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(16,20,40,0.55)';
  for (const [cx, cy, r] of [[0, 0, 20], [22, 4, 15], [-23, 5, 14], [4, 8, 17]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function gull(ctx, x, y, s) {
  ctx.strokeStyle = 'rgba(10,13,26,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, y);
  ctx.quadraticCurveTo(x - 3 * s, y - 6 * s, x, y);
  ctx.quadraticCurveTo(x + 3 * s, y - 6 * s, x + 9 * s, y);
  ctx.stroke();
}

function drawBirds(ctx, variant) {
  gull(ctx, 168, 88, 1);
  gull(ctx, 250, 80, 0.8);
  gull(ctx, 288, 116, 0.9);
  if (variant.birdCount >= 4) gull(ctx, 214, 102, 0.85);
}

function drawLighthouse(ctx, P, variant) {
  // Rocky point.
  ctx.fillStyle = P.silhouette;
  ctx.beginPath();
  ctx.moveTo(0, 352);
  ctx.lineTo(18, 330); ctx.lineTo(52, 322); ctx.lineTo(96, 328);
  ctx.lineTo(128, 340); ctx.lineTo(136, 352);
  ctx.closePath();
  ctx.fill();

  if (variant.beamOn) {
    const beam = ctx.createLinearGradient(72, 150, 350, 130);
    beam.addColorStop(0, 'rgba(255,236,170,0.5)');
    beam.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(74, 142);
    ctx.lineTo(352, 92);
    ctx.lineTo(352, 176);
    ctx.lineTo(74, 158);
    ctx.closePath();
    ctx.fill();
    glow(ctx, 72, 150, 46, 'rgba(255,236,170,', 0.75);
  }

  // Tower: pale stone with deep red bands, tapering as it rises.
  const bands = ['#ddd6c2', '#a03a34', '#ddd6c2', '#a03a34', '#ddd6c2'];
  for (let i = 0; i < 5; i++) {
    const yTop = 316 - i * 28;
    const wBot = 46 - i * 2.6;
    const wTop = 46 - (i + 1) * 2.6;
    ctx.fillStyle = bands[i];
    ctx.beginPath();
    ctx.moveTo(72 - wBot / 2, yTop);
    ctx.lineTo(72 + wBot / 2, yTop);
    ctx.lineTo(72 + wTop / 2, yTop - 28);
    ctx.lineTo(72 - wTop / 2, yTop - 28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#20263f';
  ctx.fillRect(50, 168, 44, 8); // gallery
  // Lamp room.
  ctx.fillStyle = variant.beamOn ? '#ffe9a8' : '#3a415e';
  ctx.fillRect(60, 138, 24, 30);
  ctx.strokeStyle = '#20263f';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(60, 138, 24, 30);
  ctx.beginPath();
  ctx.moveTo(72, 150); ctx.lineTo(84, 150);
  ctx.moveTo(72, 138); ctx.lineTo(72, 168);
  ctx.stroke();
  ctx.fillStyle = '#20263f';
  ctx.beginPath();
  ctx.moveTo(56, 138); ctx.lineTo(88, 138); ctx.lineTo(72, 124);
  ctx.closePath();
  ctx.fill();
}

function house(ctx, P, x, w, top, litWindows) {
  ctx.fillStyle = P.roof;
  ctx.fillRect(x, top + 16, w, 345 - top - 16);
  ctx.beginPath();
  ctx.moveTo(x - 4, top + 18);
  ctx.lineTo(x + w / 2, top);
  ctx.lineTo(x + w + 4, top + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffb85e';
  for (const [wx, wy] of litWindows) {
    ctx.globalAlpha = 0.92;
    ctx.fillRect(x + wx, top + wy, 8, 11);
  }
  ctx.globalAlpha = 1;
}

function drawSkyline(ctx, P, variant) {
  ctx.fillStyle = P.silhouette;
  ctx.fillRect(120, 338, 480, 14); // far shore base behind the houses
  house(ctx, P, 128, 62, 292, [[12, 30], [40, 44]]);
  house(ctx, P, 196, 54, 306, [[20, 26]]);
  house(ctx, P, 246, 48, 288, [[10, 30], [30, 30]]);
  // The lamplit window that may go dark sits low in the third house.
  if (variant.windowLit) {
    ctx.fillStyle = '#ffb85e';
    ctx.fillRect(263, 330, 10, 13);
    glow(ctx, 268, 336, 15, P.lampGlow, 0.5);
  } else {
    ctx.fillStyle = '#0a0f22';
    ctx.fillRect(263, 330, 10, 13);
  }
  house(ctx, P, 300, 58, 298, [[14, 40], [38, 24]]);
  house(ctx, P, 364, 52, 308, [[22, 30]]);
  house(ctx, P, 478, 60, 290, [[12, 28], [42, 42]]);
  house(ctx, P, 544, 56, 302, [[24, 34]]);
  drawClockTower(ctx, P, variant);
}

function drawClockTower(ctx, P, variant) {
  ctx.fillStyle = '#232c4e';
  ctx.fillRect(424, 196, 48, 149);
  ctx.fillStyle = '#2c3760';
  ctx.fillRect(424, 196, 48, 10);
  ctx.beginPath();
  ctx.moveTo(418, 198); ctx.lineTo(448, 168); ctx.lineTo(478, 198);
  ctx.closePath();
  ctx.fillStyle = '#171f3a';
  ctx.fill();
  ctx.fillStyle = '#ffd977';
  ctx.beginPath();
  ctx.arc(448, 184, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // The clock face: cream disc, ticks, and two hands set by clockMinutes.
  ctx.fillStyle = '#f0e6c8';
  ctx.beginPath();
  ctx.arc(448, 238, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#232c4e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#232c4e';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(448 + Math.sin(a) * 15.5, 238 - Math.cos(a) * 15.5, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  const mins = variant.clockMinutes;
  const hourA = ((mins / 60) % 12) / 12 * Math.PI * 2;
  const minA = (mins % 60) / 60 * Math.PI * 2;
  ctx.strokeStyle = '#232c4e';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(448, 238);
  ctx.lineTo(448 + Math.sin(hourA) * 9.5, 238 - Math.cos(hourA) * 9.5);
  ctx.stroke();
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(448, 238);
  ctx.lineTo(448 + Math.sin(minA) * 14.5, 238 - Math.cos(minA) * 14.5);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawStringLights(ctx, P, variant) {
  ctx.strokeStyle = 'rgba(8,10,20,0.85)';
  ctx.lineWidth = 1.6;
  const seg1 = catenary(ctx, 88, 184, 300, 314, 30);
  const seg2 = catenary(ctx, 300, 314, 428, 272, 22);
  const bulbColours = ['#ffb347', '#ff7d6b', '#7be0c3', '#ffe9a8'];
  let n = 0;
  for (const pts of [seg1, seg2]) {
    for (let i = 2; i < pts.length - 1; i += 2) {
      const p = pts[i];
      const c = bulbColours[n++ % bulbColours.length];
      glow(ctx, p.x, p.y + 3, 9, 'rgba(255,190,90,', 0.4);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // The great paper lantern hanging over the lantern stall: its colour is a
  // difference. A short cord drops it from the second string to (356, 330).
  ctx.strokeStyle = 'rgba(8,10,20,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(356, 318); ctx.lineTo(356, 320);
  ctx.stroke();
  glow(ctx, 356, 330, 26, variant.bulbColour === '#69e08a' ? 'rgba(105,224,138,' : P.lampGlow, 0.55);
  ctx.fillStyle = variant.bulbColour;
  ctx.beginPath();
  ctx.ellipse(356, 330, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,10,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(356, 330, 10, 12, 0, 0, Math.PI * 2);
  ctx.moveTo(346, 330); ctx.lineTo(366, 330);
  ctx.stroke();
}

function person(ctx, x, y, h, lantern) {
  ctx.fillStyle = '#0d1327';
  ctx.beginPath();
  ctx.arc(x, y - h, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 5.5, y);
  ctx.lineTo(x - 4, y - h + 6);
  ctx.quadraticCurveTo(x, y - h + 2, x + 4, y - h + 6);
  ctx.lineTo(x + 5.5, y);
  ctx.closePath();
  ctx.fill();
  if (lantern) {
    ctx.strokeStyle = '#0d1327';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, y - h + 10);
    ctx.lineTo(x + 13, y - h + 16);
    ctx.stroke();
    glow(ctx, x + 14, y - h + 21, 13, 'rgba(255,179,71,', 0.6);
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(x + 11.5, y - h + 17, 5, 7);
  }
}

function drawQuay(ctx, P, variant) {
  // The quay: a lit top surface and a dark timber face dropping to the water.
  ctx.fillStyle = P.quayTop;
  ctx.fillRect(0, 424, 600, 12);
  ctx.fillStyle = P.quayFace;
  ctx.fillRect(0, 436, 600, 18);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let x = 26; x < 600; x += 52) ctx.fillRect(x, 436, 5, 24);

  drawFishStall(ctx, P, variant);
  drawLanternStall(ctx, P, variant);
  drawLampPost(ctx, P, 300, 314);
  drawEastPost(ctx, P, variant);

  person(ctx, 128, 428, 34, true);
  person(ctx, 272, 430, 31, false);
  person(ctx, 452, 429, 33, false);
  person(ctx, 506, 430, 29, true);
}

function drawFishStall(ctx, P, variant) {
  // Posts and counter.
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(150, 356, 6, 74);
  ctx.fillRect(244, 356, 6, 74);
  ctx.fillStyle = '#54382a';
  ctx.fillRect(146, 392, 108, 38);
  ctx.fillStyle = '#6b4a35';
  ctx.fillRect(146, 392, 108, 7);
  // Fish laid out on the counter: silver arcs with tails.
  ctx.fillStyle = '#b9c6cf';
  for (const fx of [166, 192, 218]) {
    ctx.beginPath();
    ctx.ellipse(fx, 388, 11, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fx + 10, 388); ctx.lineTo(fx + 16, 383); ctx.lineTo(fx + 16, 393);
    ctx.closePath();
    ctx.fill();
  }
  // The striped awning: its stripe colour is a difference.
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 === 0 ? variant.awningColour : '#efe6d0';
    ctx.beginPath();
    ctx.moveTo(142 + i * 17, 372);
    ctx.lineTo(142 + (i + 1) * 17, 372);
    ctx.lineTo(146 + (i + 1) * 17, 350);
    ctx.lineTo(146 + i * 17, 350);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(142, 368, 121, 4);
  glow(ctx, 200, 380, 40, P.lampGlow, 0.22);
}

function drawLanternStall(ctx, P, variant) {
  ctx.fillStyle = '#33261a';
  ctx.fillRect(302, 362, 6, 68);
  ctx.fillRect(404, 362, 6, 68);
  ctx.fillStyle = '#4c3524';
  ctx.fillRect(298, 396, 116, 34);
  // Canopy and the harbour sign.
  ctx.fillStyle = '#5d2f28';
  ctx.fillRect(296, 352, 120, 10);
  ctx.fillStyle = '#24304f';
  ctx.fillRect(304, 362, 104, 19);
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(304, 362, 104, 19);
  ctx.fillStyle = '#f3e9d2';
  ctx.font = '700 11.5px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PELICAN QUAY', 356, 376);
  ctx.textAlign = 'left';
  // Little lanterns strung under the canopy.
  for (const lx of [318, 342, 370, 394]) {
    glow(ctx, lx, 390, 10, P.lampGlow, 0.45);
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.ellipse(lx, 390, 4.4, 5.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // The pennant pole and its pennant, which can stream the other way.
  ctx.strokeStyle = '#241a12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(352, 356); ctx.lineTo(352, 320);
  ctx.stroke();
  ctx.fillStyle = '#e2543e';
  ctx.beginPath();
  if (variant.pennantDir === 'right') {
    ctx.moveTo(352, 321); ctx.lineTo(377, 327); ctx.lineTo(352, 334);
  } else {
    ctx.moveTo(352, 321); ctx.lineTo(327, 327); ctx.lineTo(352, 334);
  }
  ctx.closePath();
  ctx.fill();
}

function drawLampPost(ctx, P, topY) {
  ctx.fillStyle = '#131a2e';
  ctx.fillRect(296, topY, 7, 430 - topY);
  glow(ctx, 300, topY - 4, 17, P.lampGlow, 0.6);
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.ellipse(300, topY - 4, 5.4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEastPost(ctx, P, variant) {
  ctx.fillStyle = '#131a2e';
  ctx.fillRect(537, 388, 6, 42);
  ctx.fillRect(518, 384, 46, 5);
  // Two lanterns hang from the crossarm — or only one (a difference).
  const hooks = variant.dockLanterns >= 2 ? [524, 556] : [524];
  for (const hx of hooks) {
    ctx.strokeStyle = '#131a2e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx, 389); ctx.lineTo(hx, 396);
    ctx.stroke();
    glow(ctx, hx, 404, 15, P.lampGlow, 0.55);
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.ellipse(hx, 404, 5.6, 7.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWater(ctx, P, variant) {
  const water = ctx.createLinearGradient(0, 448, 0, 600);
  water.addColorStop(0, P.water);
  water.addColorStop(1, P.waterDeep);
  ctx.fillStyle = water;
  ctx.fillRect(0, 448, 600, 152);

  // Moonlight path and general shimmer.
  ctx.fillStyle = '#e9e4c8';
  for (const s of SHIMMER) {
    ctx.globalAlpha = s.a * (Math.abs(s.x - 495) < 46 ? 1.9 : 1);
    ctx.fillRect(s.x, s.y, s.w, 1.8);
  }
  ctx.globalAlpha = 1;

  // Warm reflections under the stalls and posts.
  for (const [x, w] of [[200, 90], [356, 100], [300, 26], [540, 40]]) {
    const g = ctx.createLinearGradient(0, 452, 0, 520);
    g.addColorStop(0, 'rgba(255,170,80,0.30)');
    g.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, 452, w, 68);
  }

  // The channel buoy, wherever it has drifted to.
  const { buoyX, buoyY } = variant;
  ctx.fillStyle = 'rgba(200,60,50,0.3)';
  ctx.beginPath();
  ctx.ellipse(buoyX, buoyY + 12, 13, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c83a30';
  ctx.beginPath();
  ctx.moveTo(buoyX - 9, buoyY + 8);
  ctx.lineTo(buoyX, buoyY - 10);
  ctx.lineTo(buoyX + 9, buoyY + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd977';
  ctx.beginPath();
  ctx.arc(buoyX, buoyY - 13, 2.6, 0, Math.PI * 2);
  ctx.fill();
  glow(ctx, buoyX, buoyY - 13, 10, 'rgba(255,217,119,', 0.5);
}

function hull(ctx, x0, x1, y, depth, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.lineTo(x1 - 14, y + depth);
  ctx.lineTo(x0 + 14, y + depth);
  ctx.closePath();
  ctx.fill();
}

function drawBoats(ctx, P, variant) {
  // Near boat, left: the one with the sail that can change colour.
  ctx.fillStyle = 'rgba(10,14,28,0.4)';
  ctx.beginPath();
  ctx.ellipse(158, 540, 66, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0e1526';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(158, 500); ctx.lineTo(158, 408);
  ctx.stroke();
  // Main sail and jib.
  ctx.fillStyle = variant.sailColour;
  ctx.beginPath();
  ctx.moveTo(165, 416); ctx.lineTo(165, 490); ctx.lineTo(218, 490);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.moveTo(165, 416); ctx.lineTo(165, 490); ctx.lineTo(186, 490);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8dfc8';
  ctx.beginPath();
  ctx.moveTo(151, 424); ctx.lineTo(151, 488); ctx.lineTo(110, 488);
  ctx.closePath();
  ctx.fill();
  hull(ctx, 94, 222, 498, 27, '#4a2e20');
  ctx.fillStyle = '#6b4a35';
  ctx.fillRect(94, 494, 128, 6);
  glow(ctx, 106, 486, 12, P.lampGlow, 0.55);
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(103, 481, 6, 8);

  // Far boat, right: furled sail, cabin, and a masthead pennant that can vanish.
  ctx.fillStyle = 'rgba(10,14,28,0.35)';
  ctx.beginPath();
  ctx.ellipse(454, 552, 62, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0e1526';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(452, 522); ctx.lineTo(452, 420);
  ctx.moveTo(452, 500); ctx.lineTo(404, 516);
  ctx.stroke();
  if (variant.boatFlag) {
    ctx.fillStyle = '#7be0c3';
    ctx.beginPath();
    ctx.moveTo(452, 420); ctx.lineTo(470, 425); ctx.lineTo(452, 431);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#d8cfb2';
  ctx.beginPath();
  ctx.moveTo(452, 428); ctx.lineTo(452, 496); ctx.lineTo(408, 510);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5d4028';
  ctx.fillRect(462, 492, 26, 18);
  ctx.fillStyle = '#ffb85e';
  ctx.fillRect(468, 497, 7, 7);
  hull(ctx, 390, 518, 520, 22, '#38261a');
}

function drawForegroundDock(ctx, P, variant) {
  // Foreground dock planks across the bottom of the picture.
  ctx.fillStyle = P.wood;
  ctx.fillRect(0, 560, 600, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 560, 600, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.4;
  for (let x = 40; x < 600; x += 56) {
    ctx.beginPath();
    ctx.moveTo(x, 563); ctx.lineTo(x, 600);
    ctx.stroke();
  }

  // Fish crates at the left, and the harbour cat asleep on top of them.
  ctx.fillStyle = '#54402a';
  ctx.fillRect(20, 566, 58, 32);
  ctx.fillRect(28, 534, 56, 32);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(20, 566, 58, 32);
  ctx.strokeRect(28, 534, 56, 32);
  ctx.beginPath();
  ctx.moveTo(28, 550); ctx.lineTo(84, 550);
  ctx.moveTo(20, 582); ctx.lineTo(78, 582);
  ctx.stroke();
  if (variant.catPresent) drawCat(ctx, 56, 534);

  // A barrel and a coil of rope at the right.
  ctx.fillStyle = '#5d4128';
  ctx.beginPath();
  ctx.ellipse(540, 600, 21, 30, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(519, 570, 42, 30);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.moveTo(519, 582); ctx.lineTo(561, 582);
  ctx.moveTo(519, 594); ctx.lineTo(561, 594);
  ctx.stroke();
  ctx.strokeStyle = '#8a6f4d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(492, 594, 15, 5.4, 0, 0, Math.PI * 2);
  ctx.ellipse(492, 590, 10, 3.8, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCat(ctx, x, y) {
  // A curled, sleeping cat: round body, head tucked down, tail wrapped round.
  ctx.fillStyle = '#1d2438';
  ctx.beginPath();
  ctx.ellipse(x, y - 8, 17, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 12, y - 13, 7.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath(); // ears
  ctx.moveTo(x - 18, y - 18); ctx.lineTo(x - 15.4, y - 23); ctx.lineTo(x - 12.4, y - 18.6);
  ctx.moveTo(x - 10, y - 19); ctx.lineTo(x - 6.8, y - 23.4); ctx.lineTo(x - 4.6, y - 18.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1d2438';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.arc(x + 3, y - 6, 15, 0.5, 2.2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,190,110,0.5)'; // rim light from the lanterns
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y - 8, 17, Math.PI * 1.15, Math.PI * 1.55);
  ctx.stroke();
}
