import mongoose from 'mongoose';

const gameRunSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startedAt: { type: Date, required: true, default: Date.now },
  submittedAt: { type: Date, default: null },
}, { timestamps: true });

gameRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86_400 });

export default mongoose.model('GameRun', gameRunSchema);