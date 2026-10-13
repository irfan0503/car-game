# APEX // SHIFT

A responsive 2D lane racer built with Canvas, vanilla JavaScript, Express, and MongoDB. Guest runs are playable immediately; player accounts save scores to a global top-ten leaderboard.

## Requirements

- Node.js 20 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Run locally

1. Install dependencies from the project root:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and set `JWT_SECRET` to a random secret at least 32 characters long. Keep `.env` private. To generate a secret with Node.js, run `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.

3. Start MongoDB on `mongodb://127.0.0.1:27017`, or replace `MONGODB_URI` in `.env` with your Atlas connection string. The database is created automatically when the application first writes data.

4. Start the application:

   ```sh
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000). For auto-restarting development, use `npm run dev`.

The same Express server serves the frontend and JSON API; no separate frontend build step is needed. Without MongoDB, the home screen and guest game can still load, but account, score, and leaderboard routes need a live database.

## Deploy to Vercel

1. Import `https://github.com/irfan0503/car-game` into Vercel and keep the project root set to `.`. Vercel detects the root Express entry point and serves the `public/` frontend as static assets.
2. Add `MONGODB_URI` and `JWT_SECRET` in **Project Settings → Environment Variables** for Production (and Preview if needed). Use a MongoDB Atlas database reachable from Vercel; do not commit these values.
3. Deploy from the Vercel dashboard, or run `npx vercel --prod` after linking the project with the Vercel CLI.

The `/api/health` endpoint does not require MongoDB. Database-backed routes connect lazily and reuse the MongoDB connection within each serverless instance.

## Play

- Select **Start your run**. Steer with **← / →** or **A / D**. On touchscreens, hold the on-screen steering buttons.
- Avoid traffic and road barriers. Survive for points and gain a bonus for each obstacle you pass. Traffic accelerates as your score climbs.
- Pause and resume from the game controls. A collision ends the run; use **Race again** to start over.
- Sound effects and a synthesized engine tone can be toggled in the top navigation.
- Guests can play and keep a local personal-best display. Create an account to store scores in MongoDB, review the 50 most recent runs, and appear on the global leaderboard.

## API

JSON routes live under `/api`. Authenticated requests use `Authorization: Bearer <token>`; tokens expire after seven days.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a driver account and return a token |
| `POST` | `/api/auth/login` | Authenticate with email and password |
| `GET` | `/api/auth/me` | Return the authenticated driver |
| `POST` | `/api/games/start` | Issue a server-recorded run for an authenticated driver |
| `POST` | `/api/scores` | Validate and save a completed run |
| `GET` | `/api/scores/me` | Return the player's latest 50 scores and best score |
| `GET` | `/api/leaderboard` | Return the top ten players by personal best |
| `GET` | `/api/health` | Check that the HTTP service is running |

Passwords are hashed with bcrypt. Registration, login, and API traffic are rate-limited. Each saved score must reference an unused server-issued run, fit within its server-recorded duration, and remain under a points-per-second ceiling. This makes casual score fabrication harder, but a client-rendered game is not a fully cheat-proof competitive environment; authoritative gameplay simulation would be needed for that guarantee.

## Project layout

```text
backend/
  middleware/authenticate.js
  models/GameRun.js
  models/Score.js
  models/User.js
  routes/auth.js
  routes/games.js
  test/scoreRules.test.js
  utils/scoreRules.js
  app.js
  server.js
public/
  js/api.js
  js/app.js
  js/audio.js
  js/game.js
  index.html
  styles.css
.env.example
index.js
```

## Verify

Run the score-validation tests without a database:

```sh
npm test
```

After starting the server and MongoDB, open the site, register a driver, finish a run, then check **My runs** and **Leaderboard**. The leaderboard aggregates each player's best saved score, while the run history includes score, duration, and date played.