import test from 'node:test';
import assert from 'node:assert/strict';
import { validateScoreSubmission } from '../utils/scoreRules.js';

test('accepts a score that fits its recorded run duration', () => {
  assert.deepEqual(
    validateScoreSubmission({ score: 700, durationMs: 20_000, serverElapsedMs: 21_000 }),
    { score: 700, durationMs: 20_000 },
  );
});

test('rejects scores above the server-calculated run limit', () => {
  assert.throws(
    () => validateScoreSubmission({ score: 100_000, durationMs: 10_000, serverElapsedMs: 10_000 }),
    /exceeds the score limit/,
  );
});

test('rejects a reported duration longer than the server-issued game run', () => {
  assert.throws(
    () => validateScoreSubmission({ score: 100, durationMs: 20_000, serverElapsedMs: 2_000 }),
    /longer than the game run/,
  );
});

test('rejects malformed scores and durations', () => {
  assert.throws(
    () => validateScoreSubmission({ score: -1, durationMs: 1_000, serverElapsedMs: 1_000 }),
    /non-negative integer/,
  );
  assert.throws(
    () => validateScoreSubmission({ score: 1, durationMs: 700_000, serverElapsedMs: 700_000 }),
    /duration is invalid/,
  );
});