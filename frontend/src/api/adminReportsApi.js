// src/api/adminReportsApi.js
import { http } from "./http";
import { getAuthHeader, requireAdmin } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

/**
 * ADMIN Problem Reports endpoints:
 * - GET   /api/admin/problem-reports?status=IN_REVIEW|RESOLVED|REJECTED (optional)
 * - GET   /api/admin/problem-reports/{id}
 * - PATCH /api/admin/problem-reports/{id}/resolve  (body: { note })
 * - PATCH /api/admin/problem-reports/{id}/reject   (body: { note })
 */

export async function listAdminProblemReports(status /* optional */) {
  requireAdmin();
  const qs = status ? `?${new URLSearchParams({ status }).toString()}` : "";
  return http(`/api/admin/problem-reports${qs}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getAdminProblemReport(id) {
  requireAdmin();
  return http(`/api/admin/problem-reports/${enc(id)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function resolveAdminProblemReport(id, note = "") {
  requireAdmin();
  return http(`/api/admin/problem-reports/${enc(id)}/resolve`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
    body: { note: String(note || "") },
  });
}

export async function rejectAdminProblemReport(id, note = "") {
  requireAdmin();
  return http(`/api/admin/problem-reports/${enc(id)}/reject`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
    body: { note: String(note || "") },
  });
}
