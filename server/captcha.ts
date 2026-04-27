/**
 * CAPTCHA Challenge Engine
 * ========================
 * Handles challenge generation (SVG rendering) and server-side answer validation.
 *
 * Extension point: replace `renderSvg()` with a different renderer to swap the
 * challenge type entirely — math formula, emoji sequence, audio clip, etc.
 * The rest of the module (token store, generate/verify API) can stay as-is.
 */

import { captchaConfig } from './config.js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredChallenge {
  /** Correct answer (normalised to lower-case when caseSensitive is false). */
  answer: string;
  /** Unix timestamp (ms) after which this challenge is invalid. */
  expires: number;
}

// ── In-memory token store ────────────────────────────────────────────────────
// Tokens are single-use: they are deleted immediately after a verification
// attempt, whether correct or not.  Expired tokens are purged lazily.

const challenges = new Map<string, StoredChallenge>();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a new CAPTCHA challenge.
 * @returns A one-time `token` and a Base64-encoded SVG `imageData` URI.
 */
export function generateChallenge(): { token: string; imageData: string } {
  purgeExpired();

  const text = sampleText();
  const token = crypto.randomUUID();

  challenges.set(token, {
    answer: captchaConfig.caseSensitive ? text : text.toLowerCase(),
    expires: Date.now() + captchaConfig.expiryMs,
  });

  const svg = renderSvg(text);
  const imageData = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return { token, imageData };
}

/**
 * Verify a user's answer against a stored challenge.
 * Tokens are consumed on first use regardless of outcome.
 * @returns `true` only if the token exists, has not expired, and the answer matches.
 */
export function verifyChallenge(token: string, answer: string): boolean {
  const challenge = challenges.get(token);
  challenges.delete(token); // always consume

  if (!challenge) return false;
  if (Date.now() > challenge.expires) return false;

  const submitted = captchaConfig.caseSensitive ? answer : answer.toLowerCase();
  return submitted === challenge.answer;
}

// ── Text generation ───────────────────────────────────────────────────────────

function sampleText(): string {
  const { charset, length } = captchaConfig;
  return Array.from(
    { length },
    () => charset[Math.floor(Math.random() * charset.length)],
  ).join('');
}

// ── SVG renderer ──────────────────────────────────────────────────────────────
//
// Extension point: swap this function to change the visual style of the challenge.
// The function receives the plain-text answer and must return a valid SVG string.

function renderSvg(text: string): string {
  const { width, height, fontSize, noise } = captchaConfig;
  const elements: string[] = [];

  // Background
  elements.push(`<rect width="${width}" height="${height}" fill="#f4f4f4" rx="4"/>`);

  // Noise lines (drawn behind the text)
  for (let i = 0; i < noise.lines; i++) {
    const x1 = rnd(width);
    const y1 = rnd(height);
    const x2 = rnd(width);
    const y2 = rnd(height);
    elements.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
        `stroke="${rgba(0.25)}" stroke-width="${(Math.random() * 2 + 0.5).toFixed(1)}"/>`,
    );
  }

  // Distorted characters
  const charSlotWidth = (width - 20) / text.length;
  for (let i = 0; i < text.length; i++) {
    const cx = (10 + i * charSlotWidth + charSlotWidth / 2).toFixed(1);
    const baseY = (height / 2 + fontSize * 0.35).toFixed(1);
    const yOff = ((Math.random() - 0.5) * 10).toFixed(1);
    const y = (Number.parseFloat(baseY) + Number.parseFloat(yOff)).toFixed(1);
    const rotation = ((Math.random() - 0.5) * 30).toFixed(1);
    const size = (fontSize + (Math.random() - 0.5) * 8).toFixed(0);

    elements.push(
      `<text x="${cx}" y="${y}" ` +
        `transform="rotate(${rotation},${cx},${y})" ` +
        `fill="${rgba(1)}" font-size="${size}" ` +
        `font-family="monospace" font-weight="bold" text-anchor="middle">` +
        escapeXml(text[i]) +
        `</text>`,
    );
  }

  // Noise dots (drawn on top)
  for (let i = 0; i < noise.dots; i++) {
    elements.push(
      `<circle cx="${rnd(width)}" cy="${rnd(height)}" ` +
        `r="${(Math.random() * 2 + 0.5).toFixed(1)}" fill="${rgba(0.45)}"/>`,
    );
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    elements.join('') +
    `</svg>`
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Random number in [0, max], formatted to 1 decimal place. */
function rnd(max: number): string {
  return (Math.random() * max).toFixed(1);
}

/** Random dark colour with the given alpha. */
function rgba(alpha: number): string {
  const c = () => Math.floor(Math.random() * 160);
  return `rgba(${c()},${c()},${c()},${alpha})`;
}

/** Escape the five XML special characters to prevent SVG injection. */
function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function purgeExpired(): void {
  const now = Date.now();
  for (const [token, ch] of challenges) {
    if (now > ch.expires) challenges.delete(token);
  }
}
