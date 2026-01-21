// src/api/authApi.js
import { http } from "./http";

/**
 * Backend endpoints (Spring Boot):
 * - POST /api/auth/register  (multipart/form-data)
 * - POST /api/auth/login     (json)
 * - POST /api/admin/auth/login (json)
 *
 * LoginRequest:
 * { identifier: string, password: string }
 * - USER: identifier = EGN
 * - ADMIN: identifier = username
 */

export async function register(registerFormData) {
  // registerFormData must be FormData:
  // - data (application/json)
  // - idFront (image/*)
  // - idBack  (image/*)
  return http("/api/auth/register", {
    method: "POST",
    body: registerFormData,
  });
}

export async function loginUser({ egn, password }) {
  return http("/api/auth/login", {
    method: "POST",
    body: {
      identifier: String(egn || "").trim(),
      password,
    },
  });
}

export async function loginAdmin({ username, password }) {
  return http("/api/admin/auth/login", {
    method: "POST",
    body: {
      identifier: String(username || "").trim(),
      password,
    },
  });
}
