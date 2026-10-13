import { Router } from 'express';
import GameRun from '../models/GameRun.js';
import Score from '../models/Score.js';
import authenticate from '../middleware/authenticate.js';
import { validateScoreSubmission } from '../utils/scoreRules.js';

const router = Router();

router.post('/start', authenticate, async (request, response) => {
  const run = await GameRun.create({ userId: request.userId });
  return response.status(201).json({ runId: run.id, startedAt: run.startedAt });
});

router.post('/scores', authenticate, async (request, response) => {
  const { runId, score, durationMs } = request.body ?? {};
  if (typeof runId !== 'string' || !/^[a-f\d]{24}$/i.test(runId)) {
    return response.status(400).json({ error: 'A valid game run is required.' });
  }

  const run = await GameRun.findOne({ _id: runId, userId: request.userId, submittedAt: null });
  if (!run) {
    return response.status(404).json({ error: 'Game run was not found or has already been submitted.' });
  }

  const validated = validateScoreSubmission({
    score,
    durationMs,
    serverElapsedMs: Date.now() - run.startedAt.getTime(),
  });
  const claimedRun = await GameRun.findOneAndUpdate(
    { _id: runId, userId: request.userId, submittedAt: null },
    { $set: { submittedAt: new Date() } },
    { new: true },
  );
  if (!claimedRun) {
    return response.status(409).json({ error: 'This game run has already been submitted.' });
  }

  const savedScore = await Score.create({ userId: request.userId, ...validated });
  return response.status(201).json({ score: savedScore.score, playedAt: savedScore.playedAt });
});

router.get('/scores/me', authenticate, async (request, response) => {
  const scores = await Score.find({ userId: request.userId })
    .sort({ playedAt: -1 })
    .limit(50)
    .select('score durationMs playedAt');
  return response.json({
    scores,
    bestScore: scores.reduce((best, entry) => Math.max(best, entry.score), 0),
  });
});

router.get('/leaderboard', async (request, response) => {
  const leaderboard = await Score.aggregate([
    { $group: { _id: '$userId', bestScore: { $max: '$score' }, gamesPlayed: { $sum: 1 } } },
    { $sort: { bestScore: -1, _id: 1 } },
    { $limit: 10 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'player' } },
    { $unwind: '$player' },
    { $project: { _id: 0, username: '$player.username', bestScore: 1, gamesPlayed: 1 } },
  ]);
  return response.json({ leaderboard });
});

export default router;