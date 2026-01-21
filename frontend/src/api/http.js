// src/api/http.js

/**
 * Minimal fetch wrapper for Spring Boot backend.
 * - Works with Vite proxy (recommended): call paths like "/api/..."
 * - Throws readable errors for 4xx/5xx
 * - Supports JSON bodies, FormData uploads, and binary (blob) responses.
 */

const DEFAULT_HEADERS = {
  Accept: "application/json",
};

/**
 * @param {string} path e.g. "/api/auth/login"
 * @param {object} options
 * @param {"GET"|"POST"|"PUT"|"PATCH"|"DELETE"} [options.method]
 * @param {any|null} [options.body] JS object -> JSON, or FormData
 * @param {string|null} [options.authHeader] e.g. "Basic base64..."
 * @param {object} [options.headers] extra headers
 * @param {"json"|"text"|"blob"} [options.responseType] default "json"
 */
export async function http(path, options = {}) {
  const {
    method = "GET",
    body = null,
    authHeader = null,
    headers = {},
    responseType = "json",
  } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders = {
    ...DEFAULT_HEADERS,
    ...headers,
  };

  if (authHeader) {
    finalHeaders.Authorization = authHeader;
  }

  // Only set JSON content-type if we are sending a plain JS object (NOT FormData)
  if (body !== null && !isFormData) {
    // If caller already provided Content-Type, keep it; else default to JSON
    if (!finalHeaders["Content-Type"] && !finalHeaders["content-type"]) {
      finalHeaders["Content-Type"] = "application/json";
    }
  } else {
    // For FormData, browser must set boundary; ensure we don't override it
    delete finalHeaders["Content-Type"];
    delete finalHeaders["content-type"];
  }

  const fetchOptions = {
    method,
    headers: finalHeaders,
  };

  if (body !== null && method !== "GET" && method !== "HEAD") {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(path, fetchOptions);
  } catch (e) {
    throw new Error("Няма връзка със сървъра. Провери дали backend-ът работи.");
  }

  // If error, try to read JSON/text (ignore responseType)
  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");

    let payload = null;
    try {
      payload = isJson ? await res.json() : await res.text();
    } catch {
      payload = null;
    }

    const message =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" && payload.trim()) ||
      `HTTP ${res.status}`;

    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  // OK response
  if (responseType === "blob") {
    return res.blob();
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (responseType === "text") {
    return res.text();
  }

  // default: json if possible, else text
  if (isJson) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  try {
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Helper to build Basic auth header from identifier + password.
 * Example identifier: user EGN or admin username.
 */
export function buildBasicAuthHeader(identifier, password) {
  const token = btoa(`${identifier}:${password}`);
  return `Basic ${token}`;
}
