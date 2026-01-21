// src/api/transportApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

/**
 * USER Transport endpoints (matches provided Backend):
 * - Vehicles:
 *   GET  /api/transport-vehicles
 *   GET  /api/transport-vehicles/{id}
 *   POST /api/transport-vehicles/{id}/tax-payments      (body: { taxYear })
 *   GET  /api/transport-vehicles/{id}/registration-doc  (blob/pdf)
 *   GET  /api/transport-vehicles/{id}/tech-inspection-doc (blob/pdf)
 *
 * - Requests:
 *   GET  /api/transport-requests
 *   GET  /api/transport-requests/{id}
 *   POST /api/transport-requests/add-vehicle     (multipart: data + registrationDoc)
 *   POST /api/transport-requests/tech-inspection (multipart: data + inspectionDoc)
 *
 * - Vignettes:
 *   GET  /api/transport-vignettes
 *   POST /api/transport-vignettes/purchase (json: { vehicleId, type, validFrom? })
 *
 * - Fines:
 *   GET   /api/transport-fines
 *   PATCH /api/transport-fines/{id}/pay
 */

function enc(x) {
  return encodeURIComponent(String(x));
}

function asJsonBlob(obj) {
  return new Blob([JSON.stringify(obj)], { type: "application/json" });
}

/** VEHICLES */
export async function listMyTransportVehicles() {
  requireUser();
  return http("/api/transport-vehicles", {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getMyTransportVehicle(vehicleId) {
  requireUser();
  return http(`/api/transport-vehicles/${enc(vehicleId)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function payVehicleTax(vehicleId, taxYear) {
  requireUser();

  // Backend: POST /api/transport-vehicles/{id}/tax-payments  body: { taxYear }
  return http(`/api/transport-vehicles/${enc(vehicleId)}/tax-payments`, {
    method: "POST",
    authHeader: getAuthHeader(),
    body: { taxYear: Number(taxYear) },
  });
}

export async function downloadVehicleRegistrationDoc(vehicleId) {
  requireUser();
  return http(`/api/transport-vehicles/${enc(vehicleId)}/registration-doc`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "application/pdf,*/*" },
  });
}

export async function downloadVehicleInspectionDoc(vehicleId) {
  requireUser();
  // Backend endpoint name is tech-inspection-doc
  return http(`/api/transport-vehicles/${enc(vehicleId)}/tech-inspection-doc`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "application/pdf,*/*" },
  });
}

/** REQUESTS */
export async function listMyTransportRequests() {
  requireUser();
  // Backend has only /api/transport-requests
  return http("/api/transport-requests", {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getMyTransportRequest(requestId) {
  requireUser();
  return http(`/api/transport-requests/${enc(requestId)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function createAddVehicleRequest(data, registrationDocFile) {
  requireUser();

  const fd = new FormData();
  fd.append("data", asJsonBlob(data));
  fd.append("registrationDoc", registrationDocFile);

  return http("/api/transport-requests/add-vehicle", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: fd,
  });
}

export async function createTechInspectionRequest(data, inspectionDocFile) {
  requireUser();

  // Backend DTO expects: { vehicleId, inspectionDate } (YYYY-MM-DD)
  // So we normalize input fields here:
  const normalized = {
    vehicleId: data?.vehicleId,
    inspectionDate: data?.inspectionDate || data?.inspectionDateISO, // accept either from UI
  };

  const fd = new FormData();
  fd.append("data", asJsonBlob(normalized));
  fd.append("inspectionDoc", inspectionDocFile);

  return http("/api/transport-requests/tech-inspection", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: fd,
  });
}

/** VIGNETTES */
export async function listMyVignettes() {
  requireUser();
  return http("/api/transport-vignettes", {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function buyVignette({ vehicleId, type, validFrom }) {
  requireUser();
  // Backend: POST /api/transport-vignettes/purchase
  return http("/api/transport-vignettes/purchase", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: { vehicleId, type, validFrom },
  });
}

/** FINES */
export async function listMyFines() {
  requireUser();
  return http("/api/transport-fines", {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function payFine(fineId) {
  requireUser();
  // Backend: PATCH /api/transport-fines/{id}/pay
  return http(`/api/transport-fines/${enc(fineId)}/pay`, {
    method: "PATCH",
    authHeader: getAuthHeader(),
  });
}
