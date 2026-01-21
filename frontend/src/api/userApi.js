// src/api/userApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

/**
 * User endpoints (Spring Boot):
 * - GET /api/users/me   (requires Basic Auth - user credentials)
 */

export async function getMe() {
  requireUser(); // throws if not logged as user
  return http("/api/users/me", {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}
