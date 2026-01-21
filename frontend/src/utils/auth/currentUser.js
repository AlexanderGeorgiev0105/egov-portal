// src/utils/currentUser.js

const CURRENT_USER_KEY = "currentUser";

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function splitFullName(fullName) {
  const raw = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!raw) return { firstName: "", middleName: "", lastName: "" };
  const parts = raw.split(" ");
  return {
    firstName: parts[0] || "",
    middleName: parts[1] || "",
    lastName: parts.slice(2).join(" ") || "",
  };
}
