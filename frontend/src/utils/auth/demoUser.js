export const DEMO_USER = {
  id: "demo-user-1",
};

export function getCurrentUserId() {
  // Prefer real logged user (EGN), fallback to demo.
  // В приложението идентификаторът е ЕГН (10 цифри).
  try {
    const raw = localStorage.getItem("currentUser");
    const u = raw ? JSON.parse(raw) : null;
    const egn = String(u?.egn || "").trim();

    if (/^\d{10}$/.test(egn)) return egn;
  } catch {
    // ignore
  }

  return DEMO_USER.id;
}
