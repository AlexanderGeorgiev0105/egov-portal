// src/auth/authStorage.js

/**
 * Stores authentication info for Basic Auth flow.
 *
 * We store:
 * - role: "user" | "admin"
 * - basicToken: base64("identifier:password")
 *
 * NOTE: This is fine for your current setup (Basic Auth, no JWT),
 * but in a production app you’d usually switch to JWT/refresh tokens.
 */

const STORAGE_KEY = "egov_auth";

/**
 * @typedef {{
 *   role: "user" | "admin",
 *   basicToken: string
 * }} AuthState
 */

function readState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeState(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function setAuth(role, identifier, password) {
  const basicToken = btoa(`${identifier}:${password}`);
  /** @type {AuthState} */
  const state = { role, basicToken };
  writeState(state);
  return state;
}

export function logout() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getRole() {
  const state = readState();
  return state?.role ?? null;
}

export function isAuthed() {
  const state = readState();
  return Boolean(state?.basicToken && state?.role);
}

export function getAuthHeader() {
  const state = readState();
  if (!state?.basicToken) return null;
  return `Basic ${state.basicToken}`;
}

/** Guards (used by api modules / protected routes) */
export function requireAuth() {
  if (!isAuthed()) {
    const err = new Error("Нямаш активна сесия. Моля, влез отново.");
    err.code = "NOT_AUTHED";
    throw err;
  }
}

export function requireUser() {
  requireAuth();
  const role = getRole();
  if (role !== "user") {
    const err = new Error("Нямаш достъп (нужен е потребител).");
    err.code = "FORBIDDEN_ROLE";
    throw err;
  }
}

export function requireAdmin() {
  requireAuth();
  const role = getRole();
  if (role !== "admin") {
    const err = new Error("Нямаш достъп (нужен е администратор).");
    err.code = "FORBIDDEN_ROLE";
    throw err;
  }
}
