// src/api/healthReferralsApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

export async function listMyHealthReferrals() {
  requireUser();
  return http(`/api/health-referrals`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function downloadMyReferralPdf(referralId) {
  requireUser();
  return http(`/api/health-referrals/${enc(referralId)}/pdf`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
  });
}
