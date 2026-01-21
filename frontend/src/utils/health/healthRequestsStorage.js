import { HEALTH_REQUEST_KINDS, HEALTH_REQUEST_STATUSES } from "./healthModel";

const KEY_REQUESTS = "demo_health_requests_v1";
const KEY_USER_PROFILE = "demo_health_user_profile_v1";
const KEY_REFERRALS = "demo_health_referrals_v1";

// -------------------- Requests --------------------

export function loadHealthRequests() {
  try {
    const raw = localStorage.getItem(KEY_REQUESTS);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveHealthRequests(list) {
  localStorage.setItem(KEY_REQUESTS, JSON.stringify(Array.isArray(list) ? list : []));
}

export function addHealthRequest(req) {
  const current = loadHealthRequests();
  const updated = [...current, req];
  saveHealthRequests(updated);
  return updated;
}

export function getHealthRequestById(id) {
  return loadHealthRequests().find((r) => r.id === id) || null;
}

export function loadHealthRequestsByUser(userId) {
  return loadHealthRequests()
    .filter((r) => r.userId === userId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

export function updateHealthRequestStatus(id, status, adminNote = "") {
  const current = loadHealthRequests();
  const updated = current.map((r) =>
    r.id === id
      ? {
          ...r,
          status,
          adminNote,
          updatedAt: new Date().toISOString(),
        }
      : r
  );
  saveHealthRequests(updated);
  return updated;
}

// -------------------- User profile (personal doctor) --------------------

function loadUserProfileMap() {
  try {
    const raw = localStorage.getItem(KEY_USER_PROFILE);
    const map = raw ? JSON.parse(raw) : {};
    return map && typeof map === "object" ? map : {};
  } catch {
    return {};
  }
}

function saveUserProfileMap(map) {
  localStorage.setItem(KEY_USER_PROFILE, JSON.stringify(map && typeof map === "object" ? map : {}));
}

export function getUserPersonalDoctor(userId) {
  const map = loadUserProfileMap();
  const row = map?.[userId];
  return row?.personalDoctor || null;
}

export function setUserPersonalDoctor(userId, doctorObjOrNull) {
  const map = loadUserProfileMap();
  const prev = map?.[userId] || {};
  map[userId] = {
    ...prev,
    personalDoctor: doctorObjOrNull ? { ...doctorObjOrNull } : null,
    updatedAt: new Date().toISOString(),
  };
  saveUserProfileMap(map);
  return map[userId];
}

// -------------------- Referrals (approved) --------------------

export function loadHealthReferrals() {
  try {
    const raw = localStorage.getItem(KEY_REFERRALS);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveHealthReferrals(list) {
  localStorage.setItem(KEY_REFERRALS, JSON.stringify(Array.isArray(list) ? list : []));
}

export function loadHealthReferralsByUser(userId) {
  return loadHealthReferrals()
    .filter((r) => r.userId === userId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

export function addHealthReferral(ref) {
  const current = loadHealthReferrals();
  const updated = [...current, ref];
  saveHealthReferrals(updated);
  return updated;
}

// -------------------- Admin approval side effects --------------------
// IMPORTANT FIX: allow passing request ID; always fetch UPDATED request.
export function tryApplyHealthApprovalSideEffects(reqOrId) {
  const req = typeof reqOrId === "string" ? getHealthRequestById(reqOrId) : reqOrId;
  if (!req) return;

  // only when APPROVED
  if (req.status !== HEALTH_REQUEST_STATUSES.APPROVED) return;

  // Approve: Add personal doctor to user profile
  if (req.kind === HEALTH_REQUEST_KINDS.ADD_PERSONAL_DOCTOR) {
    const doctorSnapshot = req.payload?.doctor || null;
    if (!doctorSnapshot?.practiceNumber) return;
    setUserPersonalDoctor(req.userId, doctorSnapshot);
    return;
  }

  // Approve: Remove personal doctor from user profile
  if (req.kind === HEALTH_REQUEST_KINDS.REMOVE_PERSONAL_DOCTOR) {
    setUserPersonalDoctor(req.userId, null);
    return;
  }

  // Approve: Add referral to user referrals list
  if (req.kind === HEALTH_REQUEST_KINDS.ADD_REFERRAL) {
    const title = String(req.payload?.title || "").trim();
    if (!title) return;

    const ref = {
      id: `ref_${Date.now()}`,
      userId: req.userId,
      title,
      createdAt: new Date().toISOString(),
      attachments: Array.isArray(req.attachments) ? req.attachments : [],
      sourceRequestId: req.id,
    };

    addHealthReferral(ref);
  }
}

export function clearAllHealthRequests() {
  localStorage.removeItem(KEY_REQUESTS);
}

export function clearAllHealthProfiles() {
  localStorage.removeItem(KEY_USER_PROFILE);
}

export function clearAllHealthReferrals() {
  localStorage.removeItem(KEY_REFERRALS);
}
