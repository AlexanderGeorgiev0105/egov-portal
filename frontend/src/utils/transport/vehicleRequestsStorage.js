// src/utils/vehicleRequestsStorage.js
import { VEHICLE_REQUEST_STATUSES } from "./vehiclesModel";

const KEY = "demo_vehicle_requests_v1";

export function loadVehicleRequests() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVehicleRequests(list) {
  localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

export function addVehicleRequest(req) {
  const current = loadVehicleRequests();
  const updated = [req, ...current]; // newest on top
  saveVehicleRequests(updated);
  return updated;
}

export function updateVehicleRequestStatus(requestId, status, adminNote = "") {
  const current = loadVehicleRequests();
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
  saveVehicleRequests(updated);
  return updated;
}

export function getVehicleRequestById(id) {
  return loadVehicleRequests().find((r) => r.id === id) || null;
}

export function loadVehicleRequestsByUserId(userId) {
  return loadVehicleRequests().filter((r) => r.userId === userId);
}

export function loadVehicleRequestsByEgn(egn) {
  const e = String(egn || "").trim();
  return loadVehicleRequests().filter((r) => String(r.ownerEgn || r.egn || "").trim() === e);
}

export function getPendingVehicleRequestsCount() {
  return loadVehicleRequests().filter((r) => r.status === VEHICLE_REQUEST_STATUSES.PENDING).length;
}

export function clearAllVehicleRequests() {
  localStorage.removeItem(KEY);
}
