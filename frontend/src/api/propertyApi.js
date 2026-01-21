// src/api/propertyApi.js
import { http } from "./http";
import { getAuthHeader, requireUser } from "../auth/authStorage";

/**
 * Property (User) endpoints (Spring Boot):
 * - GET  /api/properties
 * - GET  /api/properties/{id}
 * - GET  /api/properties/{id}/tax-assessment
 * - GET  /api/properties/{id}/sketch
 * - GET  /api/properties/{id}/sketch/pdf
 * - GET  /api/properties/{id}/ownership-doc
 * - GET  /api/properties/{id}/debts
 * - PATCH /api/properties/{id}/debts/{year}/pay?kind=YEARLY_TAX|TRASH_FEE
 */

function enc(x) {
  return encodeURIComponent(String(x));
}

function buildAuthHeaders() {
  const auth = getAuthHeader();
  const headers = {};

  // най-често getAuthHeader връща { Authorization: "Basic ..." }
  if (auth && typeof auth === "object") {
    for (const [k, v] of Object.entries(auth)) headers[k] = v;
    return headers;
  }

  // fallback ако е string
  if (typeof auth === "string" && auth.trim()) {
    headers["Authorization"] = auth;
  }

  return headers;
}

function parseFilenameFromContentDisposition(cd) {
  if (!cd) return "";

  // examples:
  // inline; filename="doc.pdf"
  // attachment; filename=doc.pdf
  const m = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(cd);
  const raw = (m && (m[1] || m[2] || m[3])) ? String(m[1] || m[2] || m[3]).trim() : "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function headExists(path) {
  requireUser();
  try {
    await http(path, {
      method: "HEAD",
      authHeader: getAuthHeader(),
      responseType: "text",
    });
    return true;
  } catch (e) {
    if (e?.status === 404) return false;
    if (e?.status === 405) {
      try {
        await http(path, {
          method: "GET",
          authHeader: getAuthHeader(),
          responseType: "blob",
          headers: { Accept: "*/*" },
        });
        return true;
      } catch (e2) {
        if (e2?.status === 404) return false;
        throw e2;
      }
    }
    throw e;
  }
}

export async function listMyProperties() {
  requireUser();
  return http("/api/properties", {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getMyProperty(propertyId) {
  requireUser();
  return http(`/api/properties/${enc(propertyId)}`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function getTaxAssessment(propertyId) {
  requireUser();
  return http(`/api/properties/${enc(propertyId)}/tax-assessment`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function hasTaxAssessment(propertyId) {
  try {
    await getTaxAssessment(propertyId);
    return true;
  } catch (e) {
    if (e?.status === 404) return false;
    throw e;
  }
}

export async function getSketchMeta(propertyId) {
  requireUser();
  return http(`/api/properties/${enc(propertyId)}/sketch`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });
}

export async function hasSketch(propertyId) {
  try {
    const meta = await getSketchMeta(propertyId);
    return !!meta;
  } catch (e) {
    if (e?.status === 404 || e?.status === 405) {
      return headExists(`/api/properties/${enc(propertyId)}/sketch/pdf`);
    }
    throw e;
  }
}

export async function downloadSketchPdf(propertyId) {
  requireUser();
  return http(`/api/properties/${enc(propertyId)}/sketch/pdf`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "application/pdf" },
  });
}

export async function downloadOwnershipDoc(propertyId) {
  requireUser();
  return http(`/api/properties/${enc(propertyId)}/ownership-doc`, {
    method: "GET",
    authHeader: getAuthHeader(),
    responseType: "blob",
    headers: { Accept: "*/*" },
  });
}

/**
 * ✅ Reads ownership-doc filename & metadata via HEAD.
 * Returns null if no file (404).
 */
export async function getOwnershipDocMeta(propertyId) {
  requireUser();

  const url = `/api/properties/${enc(propertyId)}/ownership-doc`;
  const headers = buildAuthHeaders();

  // Spring обикновено поддържа HEAD за @GetMapping, а и нашият контролер връща Content-Disposition с име. :contentReference[oaicite:4]{index=4}
  const res = await fetch(url, { method: "HEAD", headers });

  if (res.status === 404) return null;
  if (res.status === 405) {
    // ако сървърът не позволява HEAD, не теглим целия файл само за име
    return { filename: "property_document", mimeType: "", sizeBytes: null };
  }
  if (!res.ok) {
    throw new Error(`Failed to load ownership doc meta (${res.status})`);
  }

  const cd = res.headers.get("content-disposition") || "";
  const filename = parseFilenameFromContentDisposition(cd) || "property_document";
  const mimeType = res.headers.get("content-type") || "";
  const sizeBytes = (() => {
    const s = res.headers.get("content-length");
    const n = s ? Number(s) : NaN;
    return Number.isFinite(n) ? n : null;
  })();

  return { filename, mimeType, sizeBytes };
}

export async function getDebts(propertyId) {
  requireUser();

  const raw = await http(`/api/properties/${enc(propertyId)}/debts`, {
    method: "GET",
    authHeader: getAuthHeader(),
  });

  if (!Array.isArray(raw)) return raw;

  return raw.map((d) => ({
    ...d,
    yearlyTax: {
      amount: d.yearlyTaxAmount ?? d.yearlyTax?.amount ?? null,
      isPaid: d.yearlyTaxIsPaid ?? d.yearlyTax?.isPaid ?? false,
      paidAt: d.yearlyTaxPaidAt ?? d.yearlyTax?.paidAt ?? null,
    },
    trashFee: {
      amount: d.trashFeeAmount ?? d.trashFee?.amount ?? null,
      isPaid: d.trashFeeIsPaid ?? d.trashFee?.isPaid ?? false,
      paidAt: d.trashFeePaidAt ?? d.trashFee?.paidAt ?? null,
    },
  }));
}

export async function payDebt(propertyId, year, kind /* "YEARLY_TAX"|"TRASH_FEE" */) {
  requireUser();

  const pid = enc(propertyId);
  const y = enc(year);

  // A) PATCH + query ?kind=
  try {
    const qs = new URLSearchParams({ kind }).toString();
    return await http(`/api/properties/${pid}/debts/${y}/pay?${qs}`, {
      method: "PATCH",
      authHeader: getAuthHeader(),
      responseType: "text",
    });
  } catch (e1) {
    if (![404, 405].includes(e1?.status)) throw e1;
  }

  // B) POST + query ?kind=
  try {
    const qs = new URLSearchParams({ kind }).toString();
    return await http(`/api/properties/${pid}/debts/${y}/pay?${qs}`, {
      method: "POST",
      authHeader: getAuthHeader(),
      responseType: "text",
    });
  } catch (e2) {
    if (![404, 405].includes(e2?.status)) throw e2;
  }

  // C) POST + body
  return http(`/api/properties/${pid}/debts/${y}/pay`, {
    method: "POST",
    authHeader: getAuthHeader(),
    body: {
      kind,
      debtKind: kind,
      type: kind,
      year: Number(year),
    },
    responseType: "text",
  });
}
