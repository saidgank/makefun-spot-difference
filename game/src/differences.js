// differences.js — the catalogue of everything that can change between the
// two harbour pictures, and the three rounds that pick from it.
//
// The scene renderer (scene.js) draws a panel from a "variant": a flat bag of
// settings such as the sail's colour or whether the cat is on its crate. The
// left picture is drawn from BASE_VARIANT untouched; the right picture is
// drawn from BASE_VARIANT with the round's difference patches laid over it.
// Because both panels come from the same drawing code and the same settings
// except for these patches, the two pictures agree everywhere except exactly
// at the differences — and each difference carries the scene-space centre and
// radius the input handler (input.js) hit-tests clicks against.

export const BASE_VARIANT = {
  beamOn: true, // lighthouse beam sweeping out to sea
  moonPhase: 'full', // 'full' | 'crescent'
  sailColour: '#c8433c', // the near boat's sail: crimson
  catPresent: true, // the harbour cat asleep on the fish crates
  bulbColour: '#ffb347', // the big paper lantern on the second string: amber
  clockMinutes: 550, // the tower clock reads 9:10
  birdCount: 3, // gulls crossing the moon sky
  pennantDir: 'right', // the market pennant streams to the right
  buoyX: 300, // the red channel buoy rides here…
  buoyY: 540,
  awningColour: '#c8433c', // the fish stall's awning stripes: red
  windowLit: true, // a lamplit window in the skyline houses
  sparkleStar: true, // one star burns brighter than the rest
  boatFlag: true, // a pennant at the far boat's masthead
  dockLanterns: 2, // lanterns hanging on the east lamp post
};

export const DIFFERENCES = [
  { id: 'lighthouse-beam', cx: 72, cy: 150, r: 42, patch: { beamOn: false },
    label: 'The lighthouse beam has gone out' },
  { id: 'moon-phase', cx: 495, cy: 75, r: 40, patch: { moonPhase: 'crescent' },
    label: 'The full moon has thinned to a crescent' },
  { id: 'sail-colour', cx: 188, cy: 453, r: 36, patch: { sailColour: '#2e8f86' },
    label: 'The near boat has hoisted a teal sail' },
  { id: 'cat-on-crate', cx: 56, cy: 524, r: 26, patch: { catPresent: false },
    label: 'The harbour cat has slipped away' },
  { id: 'bulb-colour', cx: 356, cy: 330, r: 21, patch: { bulbColour: '#69e08a' },
    label: 'The great paper lantern burns green' },
  { id: 'clock-time', cx: 448, cy: 238, r: 27, patch: { clockMinutes: 565 },
    label: 'The tower clock has jumped to 9:25' },
  { id: 'extra-bird', cx: 214, cy: 102, r: 22, patch: { birdCount: 4 },
    label: 'A fourth gull has joined the flight' },
  { id: 'pennant-flip', cx: 360, cy: 327, r: 22, patch: { pennantDir: 'left' },
    label: 'The market pennant streams the other way' },
  { id: 'buoy-moved', cx: 320, cy: 545, r: 36, patch: { buoyX: 340, buoyY: 550 },
    label: 'The channel buoy has drifted off its mark' },
  { id: 'awning-stripes', cx: 200, cy: 368, r: 38, patch: { awningColour: '#3c6ec8' },
    label: "The fish stall's awning is striped blue" },
  { id: 'window-dark', cx: 268, cy: 336, r: 15, patch: { windowLit: false },
    label: 'A lamplit window has gone dark' },
  { id: 'sparkle-star', cx: 120, cy: 178, r: 18, patch: { sparkleStar: false },
    label: 'The brightest star has faded' },
  { id: 'boat-flag', cx: 460, cy: 425, r: 18, patch: { boatFlag: false },
    label: "The far boat's masthead pennant is gone" },
  { id: 'dock-lantern', cx: 540, cy: 404, r: 24, patch: { dockLanterns: 1 },
    label: 'One lantern is missing from the east post' },
];

export const DIFFERENCE_BY_ID = new Map(DIFFERENCES.map((d) => [d.id, d]));

// The three rounds: later rounds lean on the quieter differences, give the
// hunter less time, and repaint the harbour deeper into the night.
export const ROUNDS = [
  {
    name: 'Round 1 · Dusk on the Quay',
    palette: 'dusk',
    seconds: 300,
    ids: ['lighthouse-beam', 'moon-phase', 'sail-colour', 'cat-on-crate',
      'clock-time', 'extra-bird', 'pennant-flip', 'buoy-moved',
      'awning-stripes', 'bulb-colour'],
  },
  {
    name: 'Round 2 · Midnight Market',
    palette: 'midnight',
    seconds: 270,
    ids: ['bulb-colour', 'window-dark', 'sparkle-star', 'boat-flag',
      'dock-lantern', 'moon-phase', 'pennant-flip', 'buoy-moved',
      'sail-colour', 'clock-time'],
  },
  {
    name: 'Round 3 · The Small Hours',
    palette: 'smallhours',
    seconds: 240,
    ids: ['moon-phase', 'sail-colour', 'bulb-colour', 'clock-time',
      'extra-bird', 'pennant-flip', 'buoy-moved', 'awning-stripes',
      'window-dark', 'sparkle-star', 'boat-flag', 'dock-lantern'],
  },
];

// buildVariants(round) → { left, right }: the two setting bags to draw the
// round's two pictures from. The left is the base harbour; the right carries
// every patch of the round's differences and nothing else.
export function buildVariants(round) {
  const right = { ...BASE_VARIANT };
  for (const id of round.ids) Object.assign(right, DIFFERENCE_BY_ID.get(id).patch);
  return { left: { ...BASE_VARIANT }, right };
}
