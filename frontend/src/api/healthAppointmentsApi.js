// src/api/healthAppointmentsApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

function enc(x) {
  return encodeURIComponent(String(x));
}

export async function listMyHealthAppointments() {
  requireUser();
  return http(`/api/health-appointments`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function listBusySlots(practiceNumber, date /* yyyy-mm-dd */) {
  requireUser();
  const qs = new URLSearchParams({ practiceNumber, date }).toString();
  return http(`/api/health-appointments/busy?${qs}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function bookHealthAppointment({ doctorPracticeNumber, doctorName, date, time }) {
  requireUser();
  return http(`/api/health-appointments`, {
    method: "POST",
    authHeader: getAuthHeader(),
    body: {
      doctorPracticeNumber,
      doctorName,
      date,
      time,
    },
  });
}

export async function cancelHealthAppointment(id) {
  requireUser();
  return http(`/api/health-appointments/${enc(id)}`, {
    method: "DELETE",
    authHeader: getAuthHeader(),
  });
}
