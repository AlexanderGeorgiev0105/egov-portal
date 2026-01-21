// src/utils/finesStorage.js

const KEY = "demo_fines_v1";

export function loadFines() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFines(list) {
  localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

export function addFine(fine) {
  const current = loadFines();
  const updated = [fine, ...current];
  saveFines(updated);
  return updated;
}

export function getFineById(id) {
  return loadFines().find((f) => f.id === id) || null;
}

export function loadFinesByEgn(egn) {
  const e = String(egn || "").trim();
  return loadFines().filter((f) => String(f.egn || "").trim() === e);
}

export function loadUnpaidFinesByEgn(egn) {
  return loadFinesByEgn(egn).filter((f) => !f.paid);
}

export function markFinePaid(fineId) {
  const current = loadFines();
  const updated = current.map((f) =>
    f.id === fineId
      ? {
          ...f,
          paid: true,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : f
  );
  saveFines(updated);
  return updated;
}

export function clearAllFines() {
  localStorage.removeItem(KEY);
}
