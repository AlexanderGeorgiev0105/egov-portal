// src/api/healthProfileApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

export async function getMyHealthProfile() {
  requireUser();
  return http(`/api/health-profile`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}
