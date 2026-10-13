import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 20 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: true });

userSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('User', userSchema);