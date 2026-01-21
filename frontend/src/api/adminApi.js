// src/api/adminApi.js
import { http } from "./http";
import { getAuthHeader, requireAdmin } from "../auth/authStorage";

/**
 * Admin endpoints (Spring Boot):
 * - GET    /api/admin/registrations?status=PENDING|ACTIVE
 * - PATCH  /api/admin/registrations/{id}/approve
 * - DELETE /api/admin/registrations/{id}
 *
 * Files (ID card images):
 * - GET /api/admin/registrations/{userId}/id-card/front
 * - GET /api/admin/registrations/{userId}/id-card/back
 *
 * All require Basic Auth - admin credentials.
 */

export async function listRegistrations(status = "PENDING") {
  requireAdmin();
  const qs = new URLSearchParams({ status }).toString();
  return http(`/api/admin/registrations?${qs}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function approveRegistration(userId) {
  requireAdmin();
  return http(`/api/admin/registrations/${encodeURIComponent(userId)}/approve`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
  });
}

export async function rejectRegistration(userId) {
  requireAdmin();
  return http(`/api/admin/registrations/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    authHeader: getAuthHeader(),
  });
}

export async function fetchRegistrationIdCardFront(userId) {
  requireAdmin();
  return http(`/api/admin/registrations/${encodeURIComponent(userId)}/id-card/front`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "image/*" },
  });
}

export async function fetchRegistrationIdCardBack(userId) {
  requireAdmin();
  return http(`/api/admin/registrations/${encodeURIComponent(userId)}/id-card/back`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "image/*" },
  });
}
