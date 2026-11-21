// Lanternfall — the hand-in program (Node 22, standard library only).
//
// The game itself is the static site under game/: plain files a desktop
// browser opens offline. This program hands it in — it copies game/ and
// screenshots/ from beside this file into the output directory and writes
// dossier.json there with buildDossier from the vendored make.fun library,
// byte for byte the way the gate rebuilds it. MAKEFUN_OUTPUT_DIR stands in
// for /output outside the grader.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own caps, passed so the dossier this writes is the dossier the
// scorer rebuilds: at most 4 screenshots of 256 KiB, at most 993 files and
// 48 MiB under game/, no game path over 1000 bytes, source text capped.
const GATE_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handInGame() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

  const shotsDir = join(repoRoot, 'screenshots');
  if (existsSync(shotsDir)) {
    cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
  }

  writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, GATE_LIMITS));

  const gameFiles = readdirSync(join(outputDir, 'game'), { recursive: true }).length;
  const shotBytes = readdirSync(join(outputDir, 'screenshots'))
    .reduce((sum, name) => sum + statSync(join(outputDir, 'screenshots', name)).size, 0);
  console.log(`Lanternfall handed in: ${gameFiles} game files, ${shotBytes} bytes of screenshots, dossier written.`);
}

handInGame();
