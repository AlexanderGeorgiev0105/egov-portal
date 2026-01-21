// src/utils/healthDoctorsStorage.js

const KEY = "demo_health_doctors_v1";

export function loadHealthDoctors() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveHealthDoctors(list) {
  localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

export function addHealthDoctor(doctor) {
  const current = loadHealthDoctors();
  const updated = [...current, doctor];
  saveHealthDoctors(updated);
  return updated;
}

export function removeHealthDoctor(id) {
  const current = loadHealthDoctors();
  const updated = current.filter((d) => d.id !== id);
  saveHealthDoctors(updated);
  return updated;
}

export function getHealthDoctorByPracticeNumber(practiceNumber) {
  const pn = String(practiceNumber || "").trim();
  if (!pn) return null;
  return loadHealthDoctors().find((d) => String(d.practiceNumber) === pn) || null;
}

export function clearAllHealthDoctors() {
  localStorage.removeItem(KEY);
}
