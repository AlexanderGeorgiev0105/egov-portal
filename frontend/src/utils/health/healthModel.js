export const SHIFT_OPTIONS = ["1", "2"];

export const HEALTH_REQUEST_KINDS = {
  ADD_PERSONAL_DOCTOR: "ADD_PERSONAL_DOCTOR",
  REMOVE_PERSONAL_DOCTOR: "REMOVE_PERSONAL_DOCTOR",
  ADD_REFERRAL: "ADD_REFERRAL",
};

export const HEALTH_REQUEST_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export function shiftLabel(shift) {
  const s = String(shift);
  if (s === "1") return "1 (първа смяна)";
  if (s === "2") return "2 (втора смяна)";
  return shift || "—";
}

export function healthRequestKindLabel(kind) {
  switch (kind) {
    case HEALTH_REQUEST_KINDS.ADD_PERSONAL_DOCTOR:
      return "Личен лекар";
    case HEALTH_REQUEST_KINDS.REMOVE_PERSONAL_DOCTOR:
      return "Премахни личен лекар";
    case HEALTH_REQUEST_KINDS.ADD_REFERRAL:
      return "Направление";
    default:
      return kind || "—";
  }
}

export function healthRequestStatusLabel(status) {
  switch (status) {
    case HEALTH_REQUEST_STATUSES.PENDING:
      return "Чака";
    case HEALTH_REQUEST_STATUSES.APPROVED:
      return "Одобрена";
    case HEALTH_REQUEST_STATUSES.REJECTED:
      return "Отказана";
    default:
      return status || "—";
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function buildTimeSlotsForShift(shift) {
  const s = String(shift);
  if (s === "1") return buildSlots("08:00", "11:30", 30);
  if (s === "2") return buildSlots("13:00", "16:30", 30);
  return [];
}

function buildSlots(startHHMM, endHHMM, stepMinutes) {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);

  let cur = sh * 60 + sm;
  const end = eh * 60 + em;

  const out = [];
  while (cur <= end) {
    const hh = Math.floor(cur / 60);
    const mm = cur % 60;
    out.push(`${pad2(hh)}:${pad2(mm)}`);
    cur += stepMinutes;
  }
  return out;
}

export function formatDateBG(isoDate) {
  try {
    const [y, m, d] = String(isoDate).split("-");
    if (!y || !m || !d) return String(isoDate || "");
    return `${pad2(d)}.${pad2(m)}.${y}`;
  } catch {
    return String(isoDate || "");
  }
}

export function formatDateTimeBG(isoDateTime) {
  try {
    const dt = new Date(isoDateTime);
    if (Number.isNaN(dt.getTime())) return String(isoDateTime || "");
    return dt.toLocaleString("bg-BG");
  } catch {
    return String(isoDateTime || "");
  }
}
