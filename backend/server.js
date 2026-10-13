import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './database.js';

const port = Number(process.env.PORT) || 3000;
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  console.error('JWT_SECRET must be set to at least 32 characters. Copy .env.example to .env and configure it.');
  process.exit(1);
}

try {
  await connectDatabase();
  app.listen(port, () => console.log(`APEX // SHIFT is running at http://localhost:${port}`));
} catch (error) {
  console.error(`Could not connect to MongoDB: ${error.message}`);
  process.exit(1);
}