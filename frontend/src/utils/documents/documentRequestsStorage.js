// src/utils/documentRequestsStorage.js
import { DOCUMENT_REQUEST_STATUSES } from "./documentsModel";

const KEY = "demo_document_requests_v1";

export function loadDocumentRequests() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDocumentRequests(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addDocumentRequest(req) {
  const current = loadDocumentRequests();
  const updated = [req, ...current];
  saveDocumentRequests(updated);
  return updated;
}

export function loadDocumentRequestsByUser(userId) {
  return loadDocumentRequests().filter((r) => r.userId === userId);
}

export function updateDocumentRequestStatus(requestId, status, adminNote = "") {
  const current = loadDocumentRequests();
  const updated = current.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status,
          adminNote,
          updatedAt: new Date().toISOString(),
        }
      : r
  );
  saveDocumentRequests(updated);
  return updated;
}

export function getDocumentRequestById(id) {
  return loadDocumentRequests().find((r) => r.id === id) || null;
}

export function getPendingDocumentRequestsCount() {
  return loadDocumentRequests().filter((r) => r.status === DOCUMENT_REQUEST_STATUSES.PENDING).length;
}

export function clearAllDocumentRequests() {
  localStorage.removeItem(KEY);
}
