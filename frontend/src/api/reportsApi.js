// src/api/reportsApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

/**
 * USER Problem Reports endpoints:
 * - GET  /api/problem-reports
 * - GET  /api/problem-reports/{id}
 * - POST /api/problem-reports   (body: { category, description })
 */

export async function listMyProblemReports() {
  requireUser();
  return http("/api/problem-reports", {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getMyProblemReport(id) {
  requireUser();
  return http(`/api/problem-reports/${enc(id)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function createProblemReport({ category, description }) {
  requireUser();
  return http("/api/problem-reports", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: {
      category: String(category || "").trim(),
      description: String(description || "").trim(),
    },
  });
}
