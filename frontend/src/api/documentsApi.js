// src/api/documentsApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

function asJsonBlob(obj) {
  return new Blob([JSON.stringify(obj)], { type: "application/json" });
}

/** DOCUMENTS (USER) */
export async function listMyDocuments() {
  requireUser();
  return http("/api/documents", {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getMyDocument(id) {
  requireUser();
  return http(`/api/documents/${enc(id)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function downloadMyDocumentPhoto(documentId, which /* 1|2 */) {
  requireUser();
  const n = which === 2 ? 2 : 1;
  return http(`/api/documents/${enc(documentId)}/photo-${n}`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "image/*,*/*" },
  });
}

/** REQUESTS (USER) */
export async function listMyDocumentRequests() {
  requireUser();
  return http("/api/document-requests", {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getMyDocumentRequest(id) {
  requireUser();
  return http(`/api/document-requests/${enc(id)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function createAddDocumentRequest(data, photo1File, photo2File) {
  requireUser();

  const fd = new FormData();
  fd.append("data", asJsonBlob(data));
  fd.append("photo1", photo1File);
  fd.append("photo2", photo2File);

  return http("/api/document-requests/add", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: fd,
  });
}

export async function createRemoveDocumentRequest({ documentId, reason }) {
  requireUser();
  return http("/api/document-requests/remove", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: { documentId, reason: reason || "" },
  });
}

export async function downloadMyRequestPhoto(requestId, which /* 1|2 */) {
  requireUser();
  const n = which === 2 ? 2 : 1;
  return http(`/api/document-requests/${enc(requestId)}/photo-${n}`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "image/*,*/*" },
  });
}
