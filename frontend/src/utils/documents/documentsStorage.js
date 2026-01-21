// src/utils/documentsStorage.js

const KEY = "demo_documents_v1";

export function loadDocuments() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDocuments(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addDocument(doc) {
  const current = loadDocuments();
  const updated = [doc, ...current];
  saveDocuments(updated);
  return updated;
}

export function updateDocument(documentId, patch) {
  const current = loadDocuments();
  const updated = current.map((d) => (d.id === documentId ? { ...d, ...patch } : d));
  saveDocuments(updated);
  return updated;
}

export function removeDocument(documentId) {
  const current = loadDocuments();
  const updated = current.filter((d) => d.id !== documentId);
  saveDocuments(updated);
  return updated;
}

export function getDocumentById(id) {
  return loadDocuments().find((d) => d.id === id) || null;
}

export function loadDocumentsByUser(userId) {
  return loadDocuments().filter((d) => d.userId === userId);
}

export function clearAllDocuments() {
  localStorage.removeItem(KEY);
}
