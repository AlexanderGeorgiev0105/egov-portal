// src/utils/vehiclesModel.js

// -----------------------------
// ENUMS / OPTIONS
// -----------------------------
export const EURO_CATEGORIES = {
  EURO_2: "EURO_2",
  EURO_3: "EURO_3",
  EURO_4: "EURO_4",
  EURO_5: "EURO_5",
  EURO_6: "EURO_6",
};

export const EURO_OPTIONS = [
  EURO_CATEGORIES.EURO_2,
  EURO_CATEGORIES.EURO_3,
  EURO_CATEGORIES.EURO_4,
  EURO_CATEGORIES.EURO_5,
  EURO_CATEGORIES.EURO_6,
];

export function euroLabel(euro) {
  switch (euro) {
    case EURO_CATEGORIES.EURO_2:
      return "Euro 2";
    case EURO_CATEGORIES.EURO_3:
      return "Euro 3";
    case EURO_CATEGORIES.EURO_4:
      return "Euro 4";
    case EURO_CATEGORIES.EURO_5:
      return "Euro 5";
    case EURO_CATEGORIES.EURO_6:
      return "Euro 6";
    default:
      return euro || "—";
  }
}

export const VIGNETTE_TYPES = {
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
};

export const VIGNETTE_OPTIONS = [
  VIGNETTE_TYPES.WEEKLY,
  VIGNETTE_TYPES.MONTHLY,
  VIGNETTE_TYPES.QUARTERLY,
  VIGNETTE_TYPES.YEARLY,
];

// (Demo) реалистични, но неофициални стойности
export const VIGNETTE_PRICES_BGN = {
  [VIGNETTE_TYPES.WEEKLY]: 15,
  [VIGNETTE_TYPES.MONTHLY]: 30,
  [VIGNETTE_TYPES.QUARTERLY]: 54,
  [VIGNETTE_TYPES.YEARLY]: 97,
};

export function vignetteTypeLabel(type) {
  switch (type) {
    case VIGNETTE_TYPES.WEEKLY:
      return "Седмична";
    case VIGNETTE_TYPES.MONTHLY:
      return "Месечна";
    case VIGNETTE_TYPES.QUARTERLY:
      return "Тримесечна";
    case VIGNETTE_TYPES.YEARLY:
      return "Годишна";
    default:
      return type || "—";
  }
}

export function getVignettePrice(type) {
  const v = VIGNETTE_PRICES_BGN[type];
  return Number.isFinite(v) ? v : 0;
}

export const VEHICLE_REQUEST_KINDS = {
  ADD_VEHICLE: "ADD_VEHICLE",
  TECH_INSPECTION: "TECH_INSPECTION",
};

export const VEHICLE_REQUEST_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export function vehicleRequestStatusLabel(status) {
  switch (status) {
    case VEHICLE_REQUEST_STATUSES.PENDING:
      return "Чака проверка";
    case VEHICLE_REQUEST_STATUSES.APPROVED:
      return "Одобрена";
    case VEHICLE_REQUEST_STATUSES.REJECTED:
      return "Отказана";
    default:
      return status || "—";
  }
}

export function vehicleRequestKindLabel(kind) {
  switch (kind) {
    case VEHICLE_REQUEST_KINDS.ADD_VEHICLE:
      return "Добавяне на превозно средство";
    case VEHICLE_REQUEST_KINDS.TECH_INSPECTION:
      return "Технически преглед";
    default:
      return kind || "—";
  }
}

// -----------------------------
// FINES (10 типа) — demo, но с реалистични категории
// -----------------------------
export const FINE_TYPES = [
  { code: "SPEED_UP_TO_10", label: "Превишена скорост (до 10 км/ч)", amount: 20 },
  { code: "SPEED_11_20", label: "Превишена скорост (11–20 км/ч)", amount: 50 },
  { code: "SPEED_21_30", label: "Превишена скорост (21–30 км/ч)", amount: 100 },
  { code: "SPEED_31_40", label: "Превишена скорост (31–40 км/ч)", amount: 300 },
  { code: "RED_LIGHT", label: "Преминаване на червен сигнал", amount: 150 },
  { code: "NO_SEATBELT", label: "Без поставен колан", amount: 50 },
  { code: "PHONE_WHILE_DRIVING", label: "Използване на телефон по време на шофиране", amount: 50 },
  { code: "NO_INSURANCE", label: "Липса на застраховка „Гражданска отговорност“", amount: 250 },
  { code: "NO_LICENSE", label: "Управление без валидно СУМПС", amount: 300 },
  { code: "PARKING_FORBIDDEN", label: "Неправилно паркиране/спиране", amount: 30 },
];

export function getFineTypeByCode(code) {
  return FINE_TYPES.find((f) => f.code === code) || null;
}

export function fineLabel(code) {
  return getFineTypeByCode(code)?.label || code || "—";
}

export function getFineBaseAmount(code) {
  const a = getFineTypeByCode(code)?.amount;
  return Number.isFinite(a) ? a : 0;
}

// -----------------------------
// DATE HELPERS
// -----------------------------
const MS_DAY = 24 * 60 * 60 * 1000;

export function toISODate(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  const s = String(input);
  const d = s.includes("T") ? new Date(s) : new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function addDaysISO(isoDate, days) {
  const d = parseDate(isoDate);
  if (!d) return "";
  const out = new Date(d.getTime() + Number(days || 0) * MS_DAY);
  return toISODate(out);
}

export function addMonthsISO(isoDate, months) {
  const d = parseDate(isoDate);
  if (!d) return "";
  const out = new Date(d);
  out.setMonth(out.getMonth() + Number(months || 0));
  return toISODate(out);
}

export function addYearsISO(isoDate, years) {
  const d = parseDate(isoDate);
  if (!d) return "";
  const out = new Date(d);
  out.setFullYear(out.getFullYear() + Number(years || 0));
  return toISODate(out);
}

export function isISODateOnOrAfter(aISO, bISO) {
  const a = parseDate(aISO);
  const b = parseDate(bISO);
  if (!a || !b) return false;
  return a.getTime() >= b.getTime();
}

export function isISODateOnOrBefore(aISO, bISO) {
  const a = parseDate(aISO);
  const b = parseDate(bISO);
  if (!a || !b) return false;
  return a.getTime() <= b.getTime();
}

export function diffDays(fromDate, toDate) {
  const a = parseDate(fromDate);
  const b = parseDate(toDate);
  if (!a || !b) return 0;
  return Math.floor((b.getTime() - a.getTime()) / MS_DAY);
}

// -----------------------------
// FINES: -20% за първите 14 дни
// -----------------------------
export function computeFinePricing(fine, asOf = new Date()) {
  const issuedAt = parseDate(fine?.issuedAt);
  const now = parseDate(asOf) || new Date();

  const base = Number(fine?.amount);
  const baseAmount = Number.isFinite(base) ? base : 0;

  if (!issuedAt) {
    return {
      baseAmount,
      discountPercent: 0,
      discountAmount: 0,
      finalAmount: baseAmount,
      isDiscountActive: false,
      daysLeft: 0,
    };
  }

  const daysPassed = Math.floor((now.getTime() - issuedAt.getTime()) / MS_DAY);
  const isDiscountActive = daysPassed >= 0 && daysPassed < 14;
  const daysLeft = isDiscountActive ? Math.max(0, 14 - daysPassed) : 0;

  const discountPercent = isDiscountActive ? 20 : 0;
  const discountAmount = isDiscountActive ? (baseAmount * 20) / 100 : 0;
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return {
    baseAmount,
    discountPercent,
    discountAmount: round2(discountAmount),
    finalAmount: round2(finalAmount),
    isDiscountActive,
    daysLeft,
  };
}

// -----------------------------
// TECH INSPECTION: валиден 1 година
// -----------------------------
export function calcInspectionValidUntil(inspectionDateISO) {
  // валидна до същата дата следващата година
  return addYearsISO(inspectionDateISO, 1);
}

// -----------------------------
// VEHICLE TAX (DEMO): реалистична формула на база kW + Euro + възраст
// Плаща се 1 път годишно на 1 декември (за съответната година).
// -----------------------------
function euroCoeff(euro) {
  switch (euro) {
    case EURO_CATEGORIES.EURO_2:
      return 1.2;
    case EURO_CATEGORIES.EURO_3:
      return 1.1;
    case EURO_CATEGORIES.EURO_4:
      return 1.0;
    case EURO_CATEGORIES.EURO_5:
      return 0.9;
    case EURO_CATEGORIES.EURO_6:
      return 0.85;
    default:
      return 1.0;
  }
}

function ageCoeff(manufactureYear, asOf = new Date()) {
  const y = Number(manufactureYear);
  const nowY = (parseDate(asOf) || new Date()).getFullYear();
  if (!Number.isFinite(y) || y < 1900 || y > nowY) return 1.2;

  const age = Math.max(0, nowY - y);
  if (age <= 5) return 1.0;
  if (age <= 14) return 1.2;
  if (age <= 20) return 1.4;
  return 1.6;
}

function ratePerKw(powerKw) {
  const kw = Number(powerKw);
  if (!Number.isFinite(kw) || kw <= 0) return 0;

  // bracketed demo rates
  if (kw <= 37) return 0.34;
  if (kw <= 55) return 0.40;
  if (kw <= 74) return 0.54;
  if (kw <= 110) return 1.10;
  return 1.23;
}

export function calculateAnnualVehicleTax(input, asOf = new Date()) {
  const kw = Number(input?.powerKw);
  const yr = Number(input?.manufactureYear);
  const euro = input?.euroCategory;

  const r = ratePerKw(kw);
  const aC = ageCoeff(yr, asOf);
  const eC = euroCoeff(euro);

  const amount = round2(Math.max(0, kw * r * aC * eC));

  return {
    amount,
    breakdown: {
      powerKw: Number.isFinite(kw) ? kw : 0,
      ratePerKw: r,
      ageCoeff: aC,
      euroCoeff: eC,
    },
    note:
      "Демо формула (kW × ставка × коеф. възраст × коеф. Euro). Не е официална методика на община/НАП.",
  };
}

export function getVehicleTaxDueDateISO(taxYear) {
  const y = Number(taxYear);
  if (!Number.isFinite(y) || y < 1900) return "";
  return `${y}-12-01`;
}

// Лихва: 0.1% на ден след 1 месец от пускането (пускане = dueDate 1 декември)
export function calculateTaxLateInterest(principal, dueDateISO, asOf = new Date()) {
  const base = Number(principal);
  const p = Number.isFinite(base) ? base : 0;

  const due = parseDate(dueDateISO);
  const now = parseDate(asOf) || new Date();
  if (!due) {
    return { overdueDays: 0, interest: 0, total: round2(p), graceUntilISO: "" };
  }

  const graceUntilISO = addMonthsISO(toISODate(due), 1);
  const graceUntil = parseDate(graceUntilISO);

  if (!graceUntil) {
    return { overdueDays: 0, interest: 0, total: round2(p), graceUntilISO };
  }

  const overdueDays = now.getTime() > graceUntil.getTime() ? Math.floor((now.getTime() - graceUntil.getTime()) / MS_DAY) : 0;
  const interest = round2(p * 0.001 * Math.max(0, overdueDays)); // 0.1% = 0.001

  return {
    overdueDays: Math.max(0, overdueDays),
    interest,
    total: round2(p + interest),
    graceUntilISO,
  };
}

// -----------------------------
// tiny helpers
// -----------------------------
export function round2(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
}

export function genId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
