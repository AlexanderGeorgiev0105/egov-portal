// src/api/adminPropertyApi.js
import { http } from "./http";
import { getAuthHeader, requireAdmin } from "../auth/authStorage";

/**
 * Property Requests (Admin) endpoints:
 * - GET    /api/admin/property-requests?status=PENDING|APPROVED|REJECTED
 * - GET    /api/admin/property-requests/{id}
 * - PATCH  /api/admin/property-requests/{id}/approve
 * - PATCH  /api/admin/property-requests/{id}/reject   (json: { note })
 * - POST   /api/admin/property-requests/{id}/approve-sketch (multipart: pdf)
 */

function enc(x) {
  return encodeURIComponent(String(x));
}

export async function listAdminPropertyRequests(status = "PENDING") {
  requireAdmin();
  const qs = new URLSearchParams({ status }).toString();
  return http(`/api/admin/property-requests?${qs}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getAdminPropertyRequest(id) {
  requireAdmin();
  return http(`/api/admin/property-requests/${enc(id)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function approveAdminPropertyRequest(id) {
  requireAdmin();
  return http(`/api/admin/property-requests/${enc(id)}/approve`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
  });
}

export async function rejectAdminPropertyRequest(id, note = "") {
  requireAdmin();
  return http(`/api/admin/property-requests/${enc(id)}/reject`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
    body: { note },
  });
}

export async function approveSketchWithPdf(id, pdfFile) {
  requireAdmin();
  const fd = new FormData();
  fd.append("pdf", pdfFile);

  return http(`/api/admin/property-requests/${enc(id)}/approve-sketch`, {
    method: "POST",
    authHeader: getAuthHeader(),
    body: fd,
  });
}

// ✅ Admin preview/download of ownership document attached to an ADD_PROPERTY request
export async function downloadPropertyRequestOwnershipDoc(requestId) {
  requireAdmin();
  return http(`/api/admin/property-requests/${enc(requestId)}/ownership-doc`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "*/*" },
  });
}
