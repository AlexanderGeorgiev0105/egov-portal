// src/api/adminHealthRequestsApi.js
import { http } from "./http";
import { getAuthHeader, requireAdmin } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

export async function listAdminHealthRequests(status /* optional */) {
  requireAdmin();

  const qs = status ? `?${new URLSearchParams({ status }).toString()}` : "";
  return http(`/api/admin/health-requests${qs}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getAdminHealthRequest(id) {
  requireAdmin();
  return http(`/api/admin/health-requests/${enc(id)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function approveAdminHealthRequest(id, note = "") {
  requireAdmin();
  return http(`/api/admin/health-requests/${enc(id)}/approve`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
    body: { note },
  });
}

export async function rejectAdminHealthRequest(id, note = "") {
  requireAdmin();
  return http(`/api/admin/health-requests/${enc(id)}/reject`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
    body: { note },
  });
}

export async function downloadAdminBookletImage(requestId) {
  requireAdmin();
  return http(`/api/admin/health-requests/${enc(requestId)}/booklet-image`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
  });
}

export async function downloadAdminReferralPdfFromRequest(requestId) {
  requireAdmin();
  return http(`/api/admin/health-requests/${enc(requestId)}/referral/pdf`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
  });
}
