import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (request, response) => {
  const { username, email, password } = request.body ?? {};
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return response.status(400).json({ error: 'Username must be 3–20 letters, numbers, or underscores.' });
  }
  if (typeof email !== 'string' || email.length > 254 || !emailPattern.test(email)) {
    return response.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return response.status(400).json({ error: 'Password must be 8–72 characters.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email: email.toLowerCase(), passwordHash });
  return response.status(201).json({
    token: createToken(user),
    user: { id: user.id, username: user.username, email: user.email },
  });
});

router.post('/login', async (request, response) => {
  const { email, password } = request.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return response.status(400).json({ error: 'Enter your email and password.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return response.status(401).json({ error: 'Email or password is incorrect.' });
  }

  return response.json({
    token: createToken(user),
    user: { id: user.id, username: user.username, email: user.email },
  });
});

router.get('/me', authenticate, async (request, response) => {
  const user = await User.findById(request.userId).select('username email createdAt');
  if (!user) {
    return response.status(404).json({ error: 'Player account not found.' });
  }
  return response.json({ user: { id: user.id, username: user.username, email: user.email } });
});

export default router;