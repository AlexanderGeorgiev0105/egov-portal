const KEY = "demo_property_requests_v1";

export const PROPERTY_REQUEST_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export function loadPropertyRequests() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePropertyRequests(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addPropertyRequest(req) {
  const current = loadPropertyRequests();
  const updated = [req, ...current];
  savePropertyRequests(updated);
  return updated;
}

export function loadPropertyRequestsByUser(userId) {
  return loadPropertyRequests().filter((r) => r.userId === userId);
}

export function updatePropertyRequestStatus(id, status, adminNote = "") {
  const current = loadPropertyRequests();
  const updated = current.map((r) =>
    r.id === id
      ? {
          ...r,
          status,
          adminNote,
          updatedAt: new Date().toISOString(),
        }
      : r
  );
  savePropertyRequests(updated);
  return updated;
}

export function getPropertyRequestById(id) {
  return loadPropertyRequests().find((r) => r.id === id) || null;
}
