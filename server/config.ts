/**
 * CAPTCHA Configuration — Primary Extension Point
 * ================================================
 * Modify the values below to change the difficulty, appearance, and behaviour
 * of the CAPTCHA challenge.  Every property is annotated so you know
 * exactly what to tweak for your UX experiments.
 *
 * Extension ideas:
 *  - Increase `noise.lines` / `noise.dots` to make the image harder to read.
 *  - Shorten `charset` to a confusing set (e.g. only 0 O o Q) to frustrate users.
 *  - Add a `maxAttempts` field and enforce it in `server/index.ts`.
 *  - Replace this module entirely with a different challenge type (math, emoji, …).
 */

export const captchaConfig = {
  // ── Challenge text ────────────────────────────────────────────────────────

  /** Number of characters displayed in each challenge. */
  length: 6,

  /**
   * Pool of characters to sample from.
   * Tip: remove ambiguous pairs (0/O, 1/l/I) to make it more (or less) user-friendly.
   */
  charset: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',

  // ── Image rendering ───────────────────────────────────────────────────────

  /** Width of the generated SVG image in pixels. */
  width: 200,

  /** Height of the generated SVG image in pixels. */
  height: 70,

  /** Base font size for each character. Individual chars are randomised around this value. */
  fontSize: 32,

  // ── Distortion & noise ────────────────────────────────────────────────────

  noise: {
    /** Number of random lines drawn across the image. */
    lines: 6,

    /** Number of random dots scattered across the image. */
    dots: 40,
  },

  // ── Validation ────────────────────────────────────────────────────────────

  /**
   * How long (ms) a challenge token stays valid before it must be refreshed.
   * Default: 5 minutes.
   */
  expiryMs: 5 * 60 * 1000,

  /**
   * Set to `true` if the answer check should be case-sensitive.
   * Most real CAPTCHAs are case-insensitive.
   */
  caseSensitive: false,
} as const;

export type CaptchaConfig = typeof captchaConfig;
