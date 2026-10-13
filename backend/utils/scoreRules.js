const MAX_GAME_DURATION_MS = 10 * 60 * 1_000;
const MAX_POINTS_PER_SECOND = 40;
const SCORE_BUFFER = 50;

export function validateScoreSubmission({ score, durationMs, serverElapsedMs }) {
  if (!Number.isSafeInteger(score) || score < 0) {
    throw new Error('Score must be a non-negative integer.');
  }

  if (!Number.isSafeInteger(durationMs) || durationMs < 0 || durationMs > MAX_GAME_DURATION_MS) {
    throw new Error('Game duration is invalid.');
  }

  if (!Number.isFinite(serverElapsedMs) || durationMs > serverElapsedMs + 2_000) {
    throw new Error('Reported duration is longer than the game run.');
  }

  const maximumScore = Math.floor((durationMs / 1_000) * MAX_POINTS_PER_SECOND) + SCORE_BUFFER;
  if (score > maximumScore) {
    throw new Error('Score exceeds the score limit for this game duration.');
  }

  return { score, durationMs };
}