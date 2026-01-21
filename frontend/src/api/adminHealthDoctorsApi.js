// src/api/adminHealthDoctorsApi.js
import { http } from "./http";
import { getAuthHeader, requireAdmin } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

export async function listAdminHealthDoctors() {
  requireAdmin();
  return http(`/api/admin/health-doctors`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function createAdminHealthDoctor(body) {
  requireAdmin();
  return http(`/api/admin/health-doctors`, {
    method: "POST",
    authHeader: getAuthHeader(),
    body,
  });
}

export async function deleteAdminHealthDoctor(id) {
  requireAdmin();
  return http(`/api/admin/health-doctors/${enc(id)}`, {
    method: "DELETE",
    authHeader: getAuthHeader(),
  });
}
