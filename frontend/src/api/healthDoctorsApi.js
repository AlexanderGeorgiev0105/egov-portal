// src/api/healthDoctorsApi.js
import { http } from "./http";
import { getAuthHeader, requireAuth } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

export async function getHealthDoctorByPracticeNumber(practiceNumber) {
  requireAuth();
  return http(`/api/health-doctors/${enc(practiceNumber)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}
