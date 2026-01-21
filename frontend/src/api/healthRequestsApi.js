// src/api/healthRequestsApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

function asJsonBlob(obj) {
  return new Blob([JSON.stringify(obj)], { type: "application/json" });
}

// USER: list my requests
export async function listMyHealthRequests() {
  requireUser();
  return http(`/api/health-requests`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

// USER: create add personal doctor (multipart: data + bookletImage)
export async function createAddPersonalDoctorRequest(data, bookletImageFile) {
  requireUser();

  const fd = new FormData();
  fd.append("data", asJsonBlob(data));
  fd.append("bookletImage", bookletImageFile);

  return http(`/api/health-requests/add-personal-doctor`, {
    method: "POST",
    authHeader: getAuthHeader(),
    body: fd,
  });
}

// USER: create remove personal doctor (json body optional; backend accepts any)
export async function createRemovePersonalDoctorRequest(payload = {}) {
  requireUser();

  return http(`/api/health-requests/remove-personal-doctor`, {
    method: "POST",
    authHeader: getAuthHeader(),
    body: payload,
  });
}

// USER: create add referral (multipart: data + referralPdf)
export async function createAddReferralRequest(data, referralPdfFile) {
  requireUser();

  const fd = new FormData();
  fd.append("data", asJsonBlob(data));
  fd.append("referralPdf", referralPdfFile);

  return http(`/api/health-requests/add-referral`, {
    method: "POST",
    authHeader: getAuthHeader(),
    body: fd,
  });
}

// USER: download files for a given request
export async function downloadMyBookletImage(requestId) {
  requireUser();
  return http(`/api/health-requests/${enc(requestId)}/booklet-image`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
  });
}

export async function downloadMyReferralPdfFromRequest(requestId) {
  requireUser();
  return http(`/api/health-requests/${enc(requestId)}/referral/pdf`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
  });
}
