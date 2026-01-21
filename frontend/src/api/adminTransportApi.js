// src/api/adminTransportApi.js
import { http } from "./http";
import { getAuthHeader, requireAdmin } from "../auth/authStorage";

/**
 * ADMIN Transport endpoints (matches provided Backend):
 * - Requests:
 *   GET   /api/admin/transport-requests?status=PENDING|APPROVED|REJECTED
 *   GET   /api/admin/transport-requests/{id}
 *   PATCH /api/admin/transport-requests/{id}/approve
 *   PATCH /api/admin/transport-requests/{id}/reject (body: { note })
 *   GET   /api/admin/transport-requests/{id}/registration-doc (blob/pdf)
 *   GET   /api/admin/transport-requests/{id}/tech-inspection-doc (blob/pdf)
 *
 * - Fines:
 *   POST /api/admin/transport-fines (json: { egn, type, amount })
 */

function enc(x) {
  return encodeURIComponent(String(x));
}

export async function listAdminTransportRequests(status = "PENDING") {
  requireAdmin();
  const qs = new URLSearchParams({ status }).toString();
  return http(`/api/admin/transport-requests?${qs}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getAdminTransportRequest(id) {
  requireAdmin();
  return http(`/api/admin/transport-requests/${enc(id)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function approveAdminTransportRequest(id) {
  requireAdmin();
  return http(`/api/admin/transport-requests/${enc(id)}/approve`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
  });
}

export async function rejectAdminTransportRequest(id, note = "") {
  requireAdmin();
  return http(`/api/admin/transport-requests/${enc(id)}/reject`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
    body: { note },
  });
}

export async function downloadTransportRequestRegistrationDoc(requestId) {
  requireAdmin();
  return http(`/api/admin/transport-requests/${enc(requestId)}/registration-doc`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "application/pdf,*/*" },
  });
}

export async function downloadTransportRequestInspectionDoc(requestId) {
  requireAdmin();
  // Backend endpoint name is tech-inspection-doc
  return http(`/api/admin/transport-requests/${enc(requestId)}/tech-inspection-doc`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "application/pdf,*/*" },
  });
}

export async function createAdminFine({ egn, type, amount }) {
  requireAdmin();
  return http("/api/admin/transport-fines", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: { egn, type, amount: Number(amount) || 0 },
  });
}
