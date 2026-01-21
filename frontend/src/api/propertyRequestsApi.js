// src/api/propertyRequestsApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

/**
 * Property Requests (User) endpoints:
 * - GET  /api/property-requests/mine
 * - POST /api/property-requests/add            (multipart: data + ownershipDoc)
 * - POST /api/property-requests/remove         (json)
 * - POST /api/property-requests/tax-assessment (json)
 * - POST /api/property-requests/sketch         (json)
 */

function asJsonBlob(obj) {
  return new Blob([JSON.stringify(obj)], { type: "application/json" });
}

function normalizePurposeCode(purposeLabel) {
  const p = String(purposeLabel || "").toLowerCase();

  if (p.includes("жилищ")) return "RESIDENTIAL";
  if (p.includes("търгов")) return "COMMERCIAL";
  if (p.includes("офис")) return "OFFICE";
  if (p.includes("склад") || p.includes("производ")) return "INDUSTRIAL";
  if (p.includes("земед")) return "AGRICULTURAL";
  if (p.includes("парцел")) return "PLOT";
  if (p.includes("гараж")) return "GARAGE";
  if (p.includes("парком")) return "PARKING";
  if (p.includes("друго")) return "OTHER";

  return "OTHER";
}

export async function listMyPropertyRequests() {
  requireUser();

  try {
    return await http("/api/property-requests/mine", {
      method: "GET",
      authHeader: getAuthHeader(),
    });
  } catch (e) {
    if (e?.status === 404) {
      return http("/api/property-requests", {
        method: "GET",
        authHeader: getAuthHeader(),
      });
    }
    throw e;
  }
}

export async function createAddPropertyRequest(data, ownershipDocFile) {
  requireUser();

  const fd = new FormData();
  fd.append("data", asJsonBlob(data));
  fd.append("ownershipDoc", ownershipDocFile);

  return http("/api/property-requests/add", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: fd,
  });
}

export async function createRemovePropertyRequest({ propertyId, reason }) {
  requireUser();
  return http("/api/property-requests/remove", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: { propertyId, reason },
  });
}

export async function createTaxAssessmentRequest({
  propertyId,
  neighborhood,      // UI "Квартал"
  purpose,           // UI текст
  purposeOther,
  hasAdjoiningParts, // boolean
}) {
  requireUser();

  const purposeCode = normalizePurposeCode(purpose);
  const hasAdjPartsStr = hasAdjoiningParts ? "Да" : "Не";

  // ✅ Пращаме и двата варианта на имената, за да мине при различни DTO-та:
  const payload = {
    propertyId,

    // квартал: backend може да очаква district ИЛИ neighborhood
    neighborhood,
    district: neighborhood,

    // purpose: backend може да очаква текст ИЛИ enum code
    purpose,
    purposeCode,

    purposeOther: purpose === "Друго" ? (purposeOther || "") : (purposeOther || ""),

    // прилежащи части: boolean И/ИЛИ "Да/Не"
    hasAdjoiningParts,
    hasAdjParts: hasAdjPartsStr,
  };

  return http("/api/property-requests/tax-assessment", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: payload,
  });
}

export async function createSketchRequest({ propertyId, docType, termDays }) {
  requireUser();
  return http("/api/property-requests/sketch", {
    method: "POST",
    authHeader: getAuthHeader(),
    body: { propertyId, docType, termDays },
  });
}
