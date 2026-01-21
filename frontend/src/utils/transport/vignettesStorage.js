// src/utils/vignettesStorage.js
import { VIGNETTE_PRICES_BGN } from "./vehiclesModel";

const KEY = "demo_vignettes_v1";

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function asDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  const s = String(input);
  const d = s.includes("T") ? new Date(s) : new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function loadVignettes() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return safeArray(parsed);
  } catch {
    return [];
  }
}

export function saveVignettes(list) {
  localStorage.setItem(KEY, JSON.stringify(safeArray(list)));
}

export function addVignette(vignette) {
  const current = loadVignettes();
  const updated = [vignette, ...current];
  saveVignettes(updated);
  return updated;
}

export function getVignetteById(id) {
  return loadVignettes().find((v) => v.id === id) || null;
}

export function loadVignettesByUserId(userId) {
  return loadVignettes().filter((v) => v.userId === userId);
}

export function loadVignettesByVehicleId(vehicleId) {
  return loadVignettes().filter((v) => v.vehicleId === vehicleId);
}

// active = now between validFrom..validUntil (inclusive)
export function getActiveVignetteForVehicle(vehicleId, asOf = new Date()) {
  const now = asDate(asOf) || new Date();
  const items = loadVignettesByVehicleId(vehicleId);

  return (
    items.find((v) => {
      const from = asDate(v.validFrom);
      const until = asDate(v.validUntil);
      if (!from || !until) return false;
      return now.getTime() >= from.getTime() && now.getTime() <= until.getTime();
    }) || null
  );
}

export function hasActiveVignette(vehicleId, asOf = new Date()) {
  return !!getActiveVignetteForVehicle(vehicleId, asOf);
}

// convenience: compute price if not set
export function resolveVignettePrice(type, explicitPrice) {
  const p = Number(explicitPrice);
  if (Number.isFinite(p) && p >= 0) return p;

  const modelPrice = Number(VIGNETTE_PRICES_BGN[type]);
  return Number.isFinite(modelPrice) ? modelPrice : 0;
}

export function clearAllVignettes() {
  localStorage.removeItem(KEY);
}
