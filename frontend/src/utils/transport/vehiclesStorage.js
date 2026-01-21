// src/utils/vehiclesStorage.js

const KEY = "demo_vehicles_v1";

export function loadVehicles() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVehicles(list) {
  localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

export function addVehicle(vehicle) {
  const current = loadVehicles();
  const updated = [vehicle, ...current];
  saveVehicles(updated);
  return updated;
}

export function updateVehicle(vehicleId, patch) {
  const current = loadVehicles();
  const updated = current.map((v) =>
    v.id === vehicleId
      ? {
          ...v,
          ...(patch || {}),
          updatedAt: new Date().toISOString(),
        }
      : v
  );
  saveVehicles(updated);
  return updated;
}

export function removeVehicle(vehicleId) {
  const current = loadVehicles();
  const updated = current.filter((v) => v.id !== vehicleId);
  saveVehicles(updated);
  return updated;
}

export function getVehicleById(vehicleId) {
  return loadVehicles().find((v) => v.id === vehicleId) || null;
}

export function loadVehiclesByUserId(userId) {
  return loadVehicles().filter((v) => v.userId === userId);
}

export function loadVehiclesByEgn(egn) {
  const e = String(egn || "").trim();
  return loadVehicles().filter((v) => String(v.ownerEgn || "").trim() === e);
}

// Tech inspection helper (записва обект techInspection върху МПС-то)
export function setVehicleTechInspection(vehicleId, techInspection) {
  return updateVehicle(vehicleId, { techInspection });
}

// Mark tax paid for year (записва в vehicle.taxPayments[year])
export function markVehicleTaxPaid(vehicleId, taxYear, amount) {
  const current = loadVehicles();
  const updated = current.map((v) => {
    if (v.id !== vehicleId) return v;

    const y = String(taxYear);
    const payments = { ...(v.taxPayments || {}) };
    payments[y] = {
      year: Number(taxYear),
      amount: Number(amount) || 0,
      paid: true,
      paidAt: new Date().toISOString(),
    };

    return { ...v, taxPayments: payments, updatedAt: new Date().toISOString() };
  });

  saveVehicles(updated);
  return updated;
}

export function clearAllVehicles() {
  localStorage.removeItem(KEY);
}
