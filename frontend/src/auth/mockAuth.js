// src/auth/mockAuth.js
// Variant A: keep the same module name, but switch to real backend calls.

import * as authApi from "../api/authApi";
import * as adminApi from "../api/adminApi";
import * as userApi from "../api/userApi";
import { setAuth, getRole as getStoredRole, logout as storageLogout } from "./authStorage";

const CURRENT_USER_KEY = "currentUser";
const CURRENT_ADMIN_KEY = "currentAdmin";

/** Role helpers (used by ProtectedRoute) */
export function getRole() {
  return getStoredRole(); // "user" | "admin" | null
}

export function logout() {
  storageLogout();
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(CURRENT_ADMIN_KEY);
  } catch {}
}

export async function submitRegistrationRequest(payload) {
  // payload must be FormData for /api/auth/register
  return authApi.register(payload);
}

/**
 * USER LOGIN
 */
export async function loginUser({ egn, password }) {
  const e = String(egn || "").trim();
  if (!e) throw new Error("ЕГН е задължително.");
  if (!password) throw new Error("Паролата е задължителна.");

  const res = await authApi.loginUser({ egn: e, password });

  // Save Basic auth for protected routes
  setAuth("user", e, password);

  // Keep UI compatibility (some pages read currentUser from localStorage)
  try {
    const snapshot = { ...(res || {}), egn: e, role: "user" };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(snapshot));
  } catch {}

  return res;
}

/**
 * ADMIN LOGIN
 */
export async function loginAdmin({ username, password }) {
  const u = String(username || "").trim();
  if (!u) throw new Error("Username е задължително.");
  if (!password) throw new Error("Паролата е задължителна.");

  const res = await authApi.loginAdmin({ username: u, password });

  setAuth("admin", u, password);

  try {
    const snapshot = { ...(res || {}), username: u, role: "admin" };
    localStorage.setItem(CURRENT_ADMIN_KEY, JSON.stringify(snapshot));
  } catch {}

  return res;
}

/**
 * Admin registrations
 */
export async function getRegistrationRequests() {
  return adminApi.listRegistrations("PENDING");
}

export async function approveRegistrationRequest(userId) {
  if (!userId) throw new Error("Липсва ID на потребителя.");
  return adminApi.approveRegistration(userId);
}

export async function rejectRegistrationRequest(userId) {
  if (!userId) throw new Error("Липсва ID на потребителя.");
  return adminApi.rejectRegistration(userId);
}

export async function getRegistrationIdCardFront(userId) {
  if (!userId) throw new Error("Липсва ID на потребителя.");
  return adminApi.fetchRegistrationIdCardFront(userId);
}

export async function getRegistrationIdCardBack(userId) {
  if (!userId) throw new Error("Липсва ID на потребителя.");
  return adminApi.fetchRegistrationIdCardBack(userId);
}

/**
 * User endpoints
 * IMPORTANT:
 * In your current userApi.js you already have getMe().
 * The build was failing because mockAuth tried to call userApi.getMyProfile/updateMyProfile,
 * which do not exist. We fix it here.
 */
export async function getMe() {
  return userApi.getMe();
}

// ✅ Backward compatible alias (ако някъде още се ползва getMyProfile)
export async function getMyProfile() {
  return userApi.getMe();
}

// ✅ Stub until you implement backend endpoint for updating profile
export async function updateMyProfile() {
  throw new Error("updateMyProfile: endpoint-ът още не е добавен в backend-а.");
}
