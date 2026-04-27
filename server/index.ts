/**
 * Express API Server
 * ==================
 * Exposes two endpoints consumed by the Vite front-end (proxied via /api/*):
 *
 *   GET  /api/captcha/challenge  — issue a new CAPTCHA challenge
 *   POST /api/captcha/verify     — verify the user's answer + credentials
 *
 * Extension point: add new routes here, or replace the credential check with
 * a real database / auth library (e.g. Passport.js, bcrypt + SQLite).
 */

import express from 'express';
import cors from 'cors';
import { generateChallenge, verifyChallenge } from './captcha.js';

const app = express();
const PORT = 3001;

// ── Middleware ────────────────────────────────────────────────────────────────

// Only allow the Vite dev origin in development.  Update for production.
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/captcha/challenge
 * Returns a fresh challenge token and a Base64-encoded SVG image.
 */
app.get('/api/captcha/challenge', (_req, res) => {
  const { token, imageData } = generateChallenge();
  res.json({ token, imageData });
});

/**
 * POST /api/captcha/verify
 * Body: { token: string, answer: string, username: string, password: string }
 *
 * Validates the CAPTCHA first, then the credentials.  Tokens are single-use;
 * a failed attempt always requires a new challenge.
 *
 * Extension point: replace the credential block with real auth logic.
 */
app.post('/api/captcha/verify', (req, res) => {
  const { token, answer, username, password } = req.body as {
    token?: string;
    answer?: string;
    username?: string;
    password?: string;
  };

  if (!token || !answer) {
    res.status(400).json({ success: false, message: 'Missing token or answer.' });
    return;
  }

  if (!verifyChallenge(token, answer)) {
    res.status(422).json({ success: false, message: 'Incorrect CAPTCHA. Please try again.' });
    return;
  }

  // ── Credential check ────────────────────────────────────────────────────────
  // NOTE: This is intentionally minimal — any non-empty username + password is
  // accepted.  Replace this block with real authentication for a production app.
  if (!username?.trim() || !password?.trim()) {
    res.status(401).json({ success: false, message: 'Username and password are required.' });
    return;
  }

  res.json({ success: true, message: 'Login successful! Welcome back.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`API server → http://localhost:${PORT}`);
});
