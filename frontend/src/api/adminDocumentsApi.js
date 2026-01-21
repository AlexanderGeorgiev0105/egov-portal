// src/api/adminDocumentsApi.js
import { http } from "./http";
import { getAuthHeader, requireAdmin } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

/**
 * ADMIN Documents endpoints:
 * - GET   /api/admin/document-requests?status=PENDING|APPROVED|REJECTED
 * - GET   /api/admin/document-requests/{id}
 * - PATCH /api/admin/document-requests/{id}/approve?note=...
 * - PATCH /api/admin/document-requests/{id}/reject   (body: { note })
 * - GET   /api/admin/document-requests/{id}/photo-1 (blob)
 * - GET   /api/admin/document-requests/{id}/photo-2 (blob)
 */

export async function listAdminDocumentRequests(status /* optional */) {
  requireAdmin();
  const qs = status ? `?${new URLSearchParams({ status }).toString()}` : "";
  return http(`/api/admin/document-requests${qs}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getAdminDocumentRequest(id) {
  requireAdmin();
  return http(`/api/admin/document-requests/${enc(id)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function approveAdminDocumentRequest(id, note = "") {
  requireAdmin();
  const qs = note ? `?${new URLSearchParams({ note }).toString()}` : "";
  return http(`/api/admin/document-requests/${enc(id)}/approve${qs}`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
  });
}

export async function rejectAdminDocumentRequest(id, note = "") {
  requireAdmin();
  return http(`/api/admin/document-requests/${enc(id)}/reject`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
    body: { note },
  });
}

export async function downloadAdminRequestPhoto(requestId, which /* 1|2 */) {
  requireAdmin();
  const n = which === 2 ? 2 : 1;
  return http(`/api/admin/document-requests/${enc(requestId)}/photo-${n}`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "image/*,*/*" },
  });
}
