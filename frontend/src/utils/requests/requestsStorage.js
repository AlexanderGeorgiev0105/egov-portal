const STORAGE_KEY = "demo_requests_v1";

export function loadRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRequests(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function addRequest(newRequest) {
  const existing = loadRequests();
  const updated = [newRequest, ...existing]; // най-новите най-отгоре
  saveRequests(updated);
  return updated;
}

export function updateRequestStatus(requestId, newStatus) {
  const existing = loadRequests();
  const updated = existing.map((r) =>
    r.id === requestId ? { ...r, status: newStatus } : r
  );
  saveRequests(updated);
  return updated;
}

export function clearAllRequests() {
  localStorage.removeItem(STORAGE_KEY);
}
