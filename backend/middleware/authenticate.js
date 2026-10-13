import jwt from 'jsonwebtoken';

export default function authenticate(request, response, next) {
  const token = request.headers.authorization?.startsWith('Bearer ')
    ? request.headers.authorization.slice(7)
    : null;

  if (!token) {
    return response.status(401).json({ error: 'Sign in to continue.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    request.userId = payload.sub;
    return next();
  } catch {
    return response.status(401).json({ error: 'Your session has expired. Sign in again.' });
  }
}