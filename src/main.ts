/**
 * Front-end entry point
 * =====================
 * Handles:
 *  1. Fetching a fresh CAPTCHA challenge on page load and on "refresh" click.
 *  2. Submitting the login form and showing the server's response.
 *
 * Extension point: swap the captcha rendering here if you want a different
 * widget (e.g. a canvas-based renderer, audio player, drag-and-drop puzzle).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChallengeResponse {
  token: string;
  imageData: string; // data:image/svg+xml;base64,…
}

interface VerifyResponse {
  success: boolean;
  message: string;
}

// ── State ─────────────────────────────────────────────────────────────────────

let currentToken = '';

// ── CAPTCHA loading ───────────────────────────────────────────────────────────

async function loadCaptcha(): Promise<void> {
  const img = document.getElementById('captcha-img') as HTMLImageElement;
  const input = document.getElementById('captcha-input') as HTMLInputElement;

  img.style.opacity = '0.4';
  input.value = '';

  try {
    const res = await fetch('/api/captcha/challenge');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as ChallengeResponse;
    currentToken = data.token;
    img.src = data.imageData;
    img.style.opacity = '1';
    input.focus();
  } catch {
    showMessage('Could not load CAPTCHA — please refresh the page.', 'error');
  }
}

// ── Form submission ───────────────────────────────────────────────────────────

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const username = (form.querySelector('#username') as HTMLInputElement).value.trim();
  const password = (form.querySelector('#password') as HTMLInputElement).value;
  const answer = (form.querySelector('#captcha-input') as HTMLInputElement).value.trim();

  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying…';

  hideMessage();

  try {
    const res = await fetch('/api/captcha/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken, answer, username, password }),
    });

    const data = (await res.json()) as VerifyResponse;
    showMessage(data.message, data.success ? 'success' : 'error');

    if (!data.success) {
      // Always reload the captcha after a failed attempt
      await loadCaptcha();
    }
  } catch {
    showMessage('Something went wrong — please try again.', 'error');
    await loadCaptcha();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log in';
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function showMessage(text: string, type: 'success' | 'error'): void {
  const el = document.getElementById('message') as HTMLDivElement;
  el.textContent = text;
  el.className = `message ${type}`;
  el.removeAttribute('hidden');
}

function hideMessage(): void {
  const el = document.getElementById('message') as HTMLDivElement;
  el.setAttribute('hidden', '');
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  void loadCaptcha();

  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    void handleSubmit(e);
  });

  document.getElementById('captcha-refresh')?.addEventListener('click', () => {
    void loadCaptcha();
  });
});
