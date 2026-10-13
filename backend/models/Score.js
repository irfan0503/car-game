import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  score: { type: Number, required: true, min: 0 },
  durationMs: { type: Number, required: true, min: 0 },
}, { timestamps: { createdAt: 'playedAt', updatedAt: false } });

scoreSchema.index({ userId: 1, score: -1 });
scoreSchema.index({ score: -1, playedAt: 1 });

export default mongoose.model('Score', scoreSchema);