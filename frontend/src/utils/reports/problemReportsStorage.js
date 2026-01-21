// src/utils/problemReportsStorage.js
import { PROBLEM_REPORT_STATUSES } from "./problemReportsModel";

const KEY = "demo_problem_reports_v1";

export function loadProblemReports() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProblemReports(list) {
  localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

export function addProblemReport(report) {
  const existing = loadProblemReports();
  const updated = [...existing, report];
  saveProblemReports(updated);
  return updated;
}

export function getProblemReportById(id) {
  return loadProblemReports().find((r) => r.id === id) || null;
}

export function loadProblemReportsByEgn(egn) {
  const e = String(egn || "").trim();
  if (!e) return [];
  return loadProblemReports().filter((r) => String(r.userEgn || "").trim() === e);
}

export function updateProblemReport(id, patch) {
  const existing = loadProblemReports();
  const updated = existing.map((r) => (r.id === id ? { ...r, ...patch } : r));
  saveProblemReports(updated);
  return updated;
}

export function updateProblemReportStatus(id, newStatus, adminNote = "") {
  const now = new Date().toISOString();
  return updateProblemReport(id, {
    status: newStatus,
    adminNote: String(adminNote || "").trim(),
    updatedAt: now,
  });
}

export function getPendingProblemReportsCount() {
  return loadProblemReports().filter((r) => r.status === PROBLEM_REPORT_STATUSES.IN_REVIEW).length;
}

export function clearAllProblemReports() {
  localStorage.removeItem(KEY);
}
