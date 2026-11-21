// game.js — the state of one Lanternfall hunt: which round is being played,
// which of its differences are found, how many wrong guesses and hints the
// hunter has spent, and how long is left before the last ferry. Pure state
// and rules; the drawing lives in scene.js and the wiring in main.js.

import { ROUNDS, DIFFERENCE_BY_ID } from './differences.js';

export const MISS_PENALTY_SECONDS = 5;
export const HINTS_PER_ROUND = 3;

export class GameState {
  constructor() {
    this.roundIndex = 0;
    this.reset(ROUNDS[0]);
  }

  reset(round) {
    this.round = round;
    this.differences = round.ids.map((id) => DIFFERENCE_BY_ID.get(id));
    this.found = new Set();
    this.misses = 0;
    this.hintsLeft = HINTS_PER_ROUND;
    this.secondsLeft = round.seconds;
    this.phase = 'playing'; // 'playing' | 'won' | 'lost'
    this.hintId = null; // the difference a hint is currently pulsing
  }

  get total() {
    return this.differences.length;
  }

  get foundCount() {
    return this.found.size;
  }

  get toGo() {
    return this.total - this.found.size;
  }

  unfound() {
    return this.differences.filter((d) => !this.found.has(d.id));
  }

  // markFound(difference) → true when this find wins the round.
  markFound(difference) {
    this.found.add(difference.id);
    if (this.found.size === this.total) this.phase = 'won';
    return this.phase === 'won';
  }

  markMiss() {
    this.misses += 1;
    this.secondsLeft = Math.max(0, this.secondsLeft - MISS_PENALTY_SECONDS);
    if (this.secondsLeft === 0) this.phase = 'lost';
  }

  // spendHint() → a random unfound difference to pulse, or null when the
  // hunter is out of hints or out of differences.
  spendHint() {
    const pool = this.unfound();
    if (this.hintsLeft <= 0 || pool.length === 0 || this.phase !== 'playing') return null;
    this.hintsLeft -= 1;
    this.hintId = pool[Math.floor(Math.random() * pool.length)].id;
    return DIFFERENCE_BY_ID.get(this.hintId);
  }

  clearHint() {
    this.hintId = null;
  }

  // tick(seconds) advances the ferry clock; returns true when time ran out.
  tick(seconds) {
    if (this.phase !== 'playing') return false;
    this.secondsLeft = Math.max(0, this.secondsLeft - seconds);
    if (this.secondsLeft === 0) {
      this.phase = 'lost';
      return true;
    }
    return false;
  }

  nextRound() {
    this.roundIndex = (this.roundIndex + 1) % ROUNDS.length;
    this.reset(ROUNDS[this.roundIndex]);
  }

  restartRound() {
    this.reset(ROUNDS[this.roundIndex]);
  }
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
